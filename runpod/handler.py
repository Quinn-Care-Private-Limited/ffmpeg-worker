#!/usr/bin/env python3
"""
RunPod Handler for FFmpeg Worker
Interfaces with the local FFmpeg worker API to process video/audio files
"""

import runpod
import requests
import json
import os
import logging
from typing import Dict, Any
import time
from storage import setup_storage_credentials, upload_file

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
env = os.getenv("ENV", "production")
FFMPEG_API_BASE_URL = f"http://127.0.0.1:{os.getenv('PORT', '3000')}"
FFMPEG_API_TIMEOUT = 900 # 15 minutes
HEALTH_TIMEOUT = 30  # seconds
HEALTH_POLL_INTERVAL = 5  # seconds

ALLOWED_PATHS = [
    "/ffmpeg/process",
    "/canvas/process",
]

setup_storage_credentials()

class FFmpegWorkerClient:
    """Client to interact with the local FFmpeg worker API"""
    
    def __init__(self, base_url: str = FFMPEG_API_BASE_URL):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        
    def health_check(self) -> bool:
        """Check if the FFmpeg worker is healthy"""
        try:
            # Health endpoint is at root level, not under /api
            response = self.session.get(f"{self.base_url}/health", timeout=4)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    def handle_request(self, path: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a request to the FFmpeg worker API"""
        try:
            url = f"{self.base_url}/api/{path.lstrip('/')}"
            logger.info(f"Making request to: {url}")
            response = self.session.post(url, json=body, timeout=FFMPEG_API_TIMEOUT)
            
            # Log response details for debugging
            logger.info(f"Response status: {response.status_code}")
            logger.debug(f"Response body: {response.text[:500]}")  # First 500 chars
            
            # Check if response has content
            if not response.text or response.text.strip() == "":
                return {
                    "error": f"Empty response from API (status: {response.status_code})"
                }
            
            # Try to parse JSON
            try:
                return response.json()
            except json.JSONDecodeError as je:
                logger.error(f"JSON decode error: {je}. Response text: {response.text[:200]}")
                return {
                    "error": f"Invalid JSON response (status: {response.status_code}): {response.text[:200]}"
                }
                
        except requests.exceptions.Timeout as e:
            logger.error(f"Request timeout: {e}")
            return {
                "error": f"Request timeout after {FFMPEG_API_TIMEOUT}s"
            }
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error: {e}")
            return {
                "error": f"Cannot connect to FFmpeg worker API at {self.base_url}"
            }
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return {
                "error": str(e)
            }
    


def handler(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    RunPod handler function
    
    Expected job input format:
    {
        "input": {
            "path": "/canvas/process",
            "body": {
                // Action-specific data
            },
            "upload": {
                "bucket": "bucket_name",
                "key": "key_name",
                "cloud_type": "cloud_type",
                "credentials": {
                    "aws_access_key_id": "aws_access_key_id",
                    "aws_secret_access_key": "aws_secret_access_key",
                    "aws_url": "aws_url"
                }
            }
        }
    }
    """
    try:
        run_id = job["id"]
        job_input = job.get("input", {})
        path = job_input.get("path", "")
        body = job_input.get("body", {})
        upload = job_input.get("upload", {})
        metadata = job_input.get("metadata", {})
        callback_url = job_input.get("callback_url", None)
        callback_auth_header = job_input.get("callback_auth_header", None)

        def callback(data):
            progress = data.get("data", {}).get("progress", 0)
            if data.get("status") == "processing":
                if env == "development":
                    logger.info({"progress": progress})
                else:
                    runpod.serverless.progress_update({"id": data["run_id"]}, {"progress": progress})

            if callback_url is None:
                return

            headers = {"Content-Type": "application/json"}
            if callback_auth_header:
                headers.update(callback_auth_header)

            try:
                requests.post(
                    callback_url,
                    headers=headers,
                    data=json.dumps(data),
                )
            except Exception as e:
                pass

        if not path or path not in ALLOWED_PATHS:
            callback({
                "run_id": run_id,
                "status": "failed",
                "data": {"error": f"Missing 'path' in job input or invalid path: {path}"},
                "metadata": metadata,
            })
            return {
                "error": f"Missing 'path' in job input or invalid path: {path}"
            }

        callback({
            "run_id": run_id,
            "status": "processing",
            "data": {
                "progress": 10,
            },
            "metadata": metadata,
        })
        
        # Initialize FFmpeg client
        client = FFmpegWorkerClient()
        
        start_time = time.time()
        while True:
            if client.health_check():
                break
            if (time.time() - start_time) > HEALTH_TIMEOUT:
                logger.error("FFmpeg worker health check timed out.")
                callback({
                    "run_id": run_id,
                    "status": "failed",
                    "data": {"error": "FFmpeg worker is not healthy after waiting period."},
                    "metadata": metadata,
                })
                return {"error": "FFmpeg worker is not healthy after waiting period."}
                  
            time.sleep(HEALTH_POLL_INTERVAL)
        
        logger.info(f"Processing path: {path}")
        
        # Route to appropriate handler
        response = client.handle_request(path, body)
        if response.get("error"):
            callback({
                "run_id": run_id,
                "status": "failed",
                "data": {"error": response.get("error")},
                "metadata": metadata,
            })
            return {"error": response.get("error")}


        files = []
        outputs = response.get("outputs")
        if upload:
            base_key = upload.get("key")
            has_extension = "." in base_key
            if len(outputs) == 1 and has_extension:
                output = outputs[0]
                url = upload_file(upload.get("bucket"), upload.get("key"), output.get("path"), upload.get("cloud_type"), upload.get("credentials"))
                files.append({
                    "name": output.get("filename"),
                    "path": output.get("path"),
                    "url": url,
                })
            else:
                key_prefix = base_key.split(".")[0]
                for output in outputs:
                    key = f"{key_prefix}/{output.get('filename')}"
                    url = upload_file(upload.get("bucket"), key, output.get("path"), upload.get("cloud_type"), upload.get("credentials"))
                    files.append({
                        "name": output.get("filename"),
                        "path": output.get("path"),
                        "url": url,
                    })

        callback({
            "run_id": run_id,
            "status": "completed",
            "data": {"output": files},
            "metadata": metadata,
        })
        return files
            
    except Exception as e:
        logger.error(f"Handler error: {e}")
        return {
            "error": str(e)
        }


if __name__ == "__main__":
    logger.info("Starting RunPod handler for FFmpeg Worker")
    runpod.serverless.start({"handler": handler})
