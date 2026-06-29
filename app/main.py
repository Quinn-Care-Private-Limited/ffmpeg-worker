#!/usr/bin/env python3
"""
Dual-mode Handler for FFmpeg Worker
Supports both RunPod serverless and standard uvicorn server modes
Proxies requests to the Node.js FFmpeg worker API
"""

import os
import uvicorn
import requests
import json
import time
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any
from collections import deque
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from app.storage import setup_storage_credentials, upload_file

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
CLOUD_TYPE = os.getenv("CLOUD_TYPE", "GCP")
ENV = os.getenv("ENV", "production")
NODE_SERVER_PORT = os.getenv("NODE_PORT", "3000")
FFMPEG_API_BASE_URL = f"http://127.0.0.1:{NODE_SERVER_PORT}"
FFMPEG_API_TIMEOUT = 900  # 15 minutes
HEALTH_TIMEOUT = 30  # seconds
HEALTH_POLL_INTERVAL = 5  # seconds

# API Key configuration
API_KEY_HEADER = "x-api-key"
API_KEY = os.getenv("API_KEY", "n7U3Oo0tWiUx4G6b4dGmeb3vWNxi3srA")
IS_DEV = ENV == "dev"

ALLOWED_PATHS = [
    "/ffmpeg/process",
    "/canvas/process",
    "/scene-split/process",
]

setup_storage_credentials()

logger.info(f"🟢 CLOUD_TYPE: {CLOUD_TYPE}")
logger.info(f"🟢 Node.js API Base URL: {FFMPEG_API_BASE_URL}")

# Concurrency control for RunPod serverless
request_history = deque(maxlen=1000)  # Track recent request timestamps
current_request_rate = 0

# Concurrency configuration from environment variables
# FFmpeg operations are CPU-intensive and I/O bound, so we can handle multiple concurrent requests
MAX_CONCURRENCY = int(
    os.getenv("MAX_CONCURRENCY", "5")
)  # Conservative for video processing
MIN_CONCURRENCY = int(
    os.getenv("MIN_CONCURRENCY", "2")
)  # Minimum concurrent requests
HIGH_REQUEST_RATE_THRESHOLD = int(
    os.getenv("HIGH_REQUEST_RATE_THRESHOLD", "5")
)  # Requests per minute
LOW_REQUEST_RATE_THRESHOLD = int(
    os.getenv("LOW_REQUEST_RATE_THRESHOLD", "2")
)  # Scale down threshold


def update_request_rate():
    """
    Updates the request rate based on recent request history.
    Calculates requests per minute for the last 60 seconds.
    """
    global current_request_rate
    current_time = time.time()

    # Count requests in the last 60 seconds
    recent_requests = [r for r in request_history if r > current_time - 60]
    current_request_rate = len(recent_requests)

    return current_request_rate


def adjust_concurrency(current_concurrency):
    """
    Dynamically adjusts worker concurrency based on request load.

    For FFmpeg/video processing:
    - Moderate concurrency since operations are CPU/I/O intensive
    - Configurable via environment variables:
      * MAX_CONCURRENCY: Maximum concurrent requests (default: 5)
      * MIN_CONCURRENCY: Minimum concurrent requests (default: 2)
      * HIGH_REQUEST_RATE_THRESHOLD: Scale up threshold in req/min (default: 5)
      * LOW_REQUEST_RATE_THRESHOLD: Scale down threshold in req/min (default: 2)

    Args:
        current_concurrency (int): The current concurrency level

    Returns:
        int: The new concurrency level
    """
    update_request_rate()

    logger.debug(
        f"Request rate: {current_request_rate}/min, "
        f"Concurrency: {current_concurrency}, "
        f"Thresholds: High={HIGH_REQUEST_RATE_THRESHOLD}, Low={LOW_REQUEST_RATE_THRESHOLD}"
    )

    # Scale up for high request rate
    if (
        current_request_rate > HIGH_REQUEST_RATE_THRESHOLD
        and current_concurrency < MAX_CONCURRENCY
    ):
        new_concurrency = min(current_concurrency + 1, MAX_CONCURRENCY)
        logger.info(
            f"⬆️  Scaling UP concurrency: {current_concurrency} -> {new_concurrency} "
            f"(rate: {current_request_rate}/min)"
        )
        return new_concurrency

    # Scale down for low request rate
    elif (
        current_request_rate <= LOW_REQUEST_RATE_THRESHOLD
        and current_concurrency > MIN_CONCURRENCY
    ):
        new_concurrency = max(current_concurrency - 1, MIN_CONCURRENCY)
        logger.info(
            f"⬇️  Scaling DOWN concurrency: {current_concurrency} -> {new_concurrency} "
            f"(rate: {current_request_rate}/min)"
        )
        return new_concurrency

    return current_concurrency


# Pydantic models for FastAPI endpoints
class ProcessRequest(BaseModel):
    path: str
    body: Dict[str, Any]
    upload: Dict[str, Any] = None
    metadata: Dict[str, Any] = {}
    callback_url: str = None
    callback_auth_header: Dict[str, str] = None


class ProcessResponse(BaseModel):
    outputs: list = None
    error: str = None


# FastAPI app setup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FFmpeg Worker Handler...")
    yield
    # Shutdown
    logger.info("Shutting down FFmpeg Worker Handler...")


app = FastAPI(
    title="FFmpeg Worker Service",
    description="Async scalable API for FFmpeg and Canvas processing operations",
    version="1.0.0",
    lifespan=lifespan,
)


async def verify_api_key(request: Request):
    # Skip API key check for root and health check endpoints
    if request.url.path in ["/", "/health"]:
        return

    if CLOUD_TYPE == "RUNPOD":
        return

    if IS_DEV:
        return

    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured on server")

    api_key = request.headers.get(API_KEY_HEADER)
    if not api_key or api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# Add API key middleware
@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    try:
        await verify_api_key(request)
        response = await call_next(request)
        return response
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "FFmpeg Worker Service", "status": "running"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "ffmpeg-worker",
        "version": "1.0.0",
    }


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


# Initialize FFmpeg client
ffmpeg_client = FFmpegWorkerClient()


@app.post("/api/process")
async def process_endpoint(request: ProcessRequest):
    """
    FastAPI endpoint for processing FFmpeg/Canvas requests.
    This endpoint proxies requests to the Node.js server.
    """
    try:
        path = request.path
        body = request.body
        upload = request.upload
        
        # Validate path
        if not path or path not in ALLOWED_PATHS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid path: {path}. Allowed paths: {ALLOWED_PATHS}"
            )
        
        # Wait for Node.js server to be healthy
        start_time = time.time()
        while True:
            if ffmpeg_client.health_check():
                break
            if (time.time() - start_time) > HEALTH_TIMEOUT:
                logger.error("FFmpeg worker health check timed out.")
                raise HTTPException(
                    status_code=503,
                    detail="FFmpeg worker is not healthy after waiting period."
                )
            time.sleep(HEALTH_POLL_INTERVAL)
        
        logger.info(f"Processing path: {path}")
        
        # Make request to Node.js server
        response = ffmpeg_client.handle_request(path, body)
        if response.get("error"):
            raise HTTPException(status_code=500, detail=response.get("error"))
        
        # Handle file uploads if specified
        files = []
        outputs = response.get("outputs", [])
        if upload:
            base_key = upload.get("key")
            has_extension = "." in base_key
            if len(outputs) == 1 and has_extension:
                output = outputs[0]
                url = upload_file(
                    upload.get("bucket"),
                    upload.get("key"),
                    output.get("path"),
                    upload.get("cloud_type"),
                    upload.get("credentials")
                )
                files.append({
                    "name": output.get("filename"),
                    "path": output.get("path"),
                    "url": url,
                })
            else:
                key_prefix = base_key.split(".")[0]
                for output in outputs:
                    key = f"{key_prefix}/{output.get('filename')}"
                    url = upload_file(
                        upload.get("bucket"),
                        key,
                        output.get("path"),
                        upload.get("cloud_type"),
                        upload.get("credentials")
                    )
                    # Preserve any per-output metadata the handler attached (e.g. scene-split's
                    # sceneIndex/role/start/end/duration/score) so callers can map outputs to scenes.
                    files.append({
                        **{k: v for k, v in output.items() if k != "path"},
                        "name": output.get("filename"),
                        "key": key,
                        "url": url,
                    })

            return {"outputs": files}
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def runpod_handler(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    RunPod handler function with concurrent processing support.
    Proxies requests to the Node.js server and handles callbacks.
    
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
            },
            "metadata": {},
            "callback_url": "https://example.com/callback",
            "callback_auth_header": {}
        }
    }
    """
    import runpod
    from fastapi.testclient import TestClient
    
    # Track this request for concurrency metrics
    request_history.append(time.time())
    
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
            if ENV == "development":
                logger.info(f"Progress update: {data}")
            else:
                runpod.serverless.progress_update(
                    {"id": data["run_id"]},
                    {"progress": progress}
                )

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
            logger.error(f"Callback error: {e}")

        return data.get("data")
    
    # Send progress update: processing
    callback({
        "run_id": run_id,
        "status": "processing",
        "data": {
            "progress": 10,
        },
        "metadata": metadata,
    })
    
    try:
        # Use TestClient to call the FastAPI endpoint
        with TestClient(app) as client:
            request_data = {
                "path": path,
                "body": body,
                "upload": upload,
                "metadata": metadata,
            }
            response = client.post("/api/process", json=request_data)
            
            # Check if request was successful
            if response.status_code >= 400:
                error_detail = response.json().get("detail", "Unknown error")
                callback({
                    "run_id": run_id,
                    "status": "failed",
                    "data": {
                        "error": error_detail,
                        "status_code": response.status_code,
                    },
                    "metadata": metadata,
                })
                return {"error": error_detail}
            
            result = response.json()
            
            # Send progress update: completed
            callback({
                "run_id": run_id,
                "status": "completed",
                "data": result,
                "metadata": metadata,
            })
            return result
            
    except Exception as e:
        logger.error(f"Handler error: {e}")
        callback({
            "run_id": run_id,
            "status": "failed",
            "data": {"error": str(e), "status_code": 500},
            "metadata": metadata,
        })
        return {"error": str(e)}


async def sync_runpod_handler(job: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronous wrapper for the async runpod_handler"""
    return await runpod_handler(job)


if __name__ == "__main__":
    if CLOUD_TYPE == "RUNPOD":
        # Running in RunPod serverless mode
        import runpod
        
        logger.info("🟢 Running in RunPod serverless mode")
        logger.info("🚀 Dynamic concurrency enabled")
        logger.info(f"   ├─ Min Concurrency: {MIN_CONCURRENCY}")
        logger.info(f"   ├─ Max Concurrency: {MAX_CONCURRENCY}")
        logger.info(
            f"   ├─ Scale Up Threshold: >{HIGH_REQUEST_RATE_THRESHOLD} req/min"
        )
        logger.info(
            f"   └─ Scale Down Threshold: ≤{LOW_REQUEST_RATE_THRESHOLD} req/min"
        )
        
        runpod.serverless.start(
            {"handler": sync_runpod_handler, "concurrency_modifier": adjust_concurrency}
        )
    else:
        # Running in standard mode with uvicorn
        port = int(os.getenv("PORT", 8000))
        logger.info(f"🟢 Running in standard mode on port {port}")
        logger.info(f"🔗 Proxying to Node.js server at {FFMPEG_API_BASE_URL}")
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
            timeout_keep_alive=120,
        )
