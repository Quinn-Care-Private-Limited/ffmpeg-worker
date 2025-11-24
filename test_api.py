#!/usr/bin/env python3
"""
Test script for FFmpeg Worker API
Usage: python test_api.py [example_file]
Example: python test_api.py examples/test-ffmpeg-simple.json
"""

import requests
import json
import sys
import time
from pathlib import Path

# API Configuration
API_BASE_URL = "https://ffmpeg-worker-357390246972.us-west1.run.app"
API_KEY = "n7U3Oo0tWiUx4G6b4dGmeb3vWNxi3srA"  # Update if different

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        response.raise_for_status()
        print(f"✅ Health check passed: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def call_api(example_file):
    """Call the API with an example JSON file"""
    print(f"\n📂 Loading example file: {example_file}")
    
    # Load the example JSON
    try:
        with open(example_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ File not found: {example_file}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return
    
    # Extract the input data
    input_data = data.get("input", {})
    path = input_data.get("path", "")
    body = input_data.get("body", {})
    upload = input_data.get("upload", None)
    
    print(f"📍 Endpoint: {path}")
    print(f"📦 Body keys: {list(body.keys())}")
    if upload:
        print(f"☁️  Upload to: {upload.get('bucket')}/{upload.get('key')}")
    
    # Prepare the request
    api_url = f"{API_BASE_URL}/api/process"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }
    
    # The request body for the /api/process endpoint
    request_body = {
        "path": path,
        "body": body,
        "upload": upload,
        "metadata": {
            "test": True,
            "source": example_file
        }
    }
    
    print(f"\n🚀 Sending request to {api_url}...")
    print(f"⏱️  This may take a while for video processing...\n")
    
    try:
        start_time = time.time()
        response = requests.post(
            api_url,
            headers=headers,
            json=request_body,
            timeout=900  # 15 minutes timeout for long processing
        )
        elapsed_time = time.time() - start_time
        
        print(f"⏱️  Request completed in {elapsed_time:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        # Try to parse JSON response
        try:
            result = response.json()
            print(f"\n📄 Response:")
            print(json.dumps(result, indent=2))
            
            # If successful, show output URLs
            if response.status_code == 200:
                outputs = result.get("outputs", [])
                if outputs:
                    print(f"\n✅ Processing successful!")
                    print(f"📁 Output files ({len(outputs)}):")
                    for output in outputs:
                        print(f"  - {output.get('name')}: {output.get('url')}")
                else:
                    print(f"\n✅ Processing successful!")
                    if "outputs" in result:
                        print(f"📁 Outputs: {result['outputs']}")
            else:
                print(f"\n❌ Request failed with status {response.status_code}")
                
        except json.JSONDecodeError:
            print(f"\n📄 Raw response:")
            print(response.text[:500])
            
    except requests.exceptions.Timeout:
        print(f"❌ Request timed out after 15 minutes")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("=" * 60)
    print("FFmpeg Worker API Test Script")
    print("=" * 60)
    
    # Test health first
    if not test_health():
        print("\n⚠️  Warning: Health check failed, but continuing anyway...")
    
    # Get example file from command line or use default
    if len(sys.argv) > 1:
        example_file = sys.argv[1]
    else:
        # List available examples
        examples_dir = Path("examples")
        if examples_dir.exists():
            examples = list(examples_dir.glob("*.json"))
            if examples:
                print(f"\n📋 Available examples:")
                for i, example in enumerate(examples, 1):
                    print(f"  {i}. {example}")
                
                choice = input(f"\nSelect an example (1-{len(examples)}) or press Enter for test-ffmpeg-simple.json: ").strip()
                
                if choice.isdigit() and 1 <= int(choice) <= len(examples):
                    example_file = str(examples[int(choice) - 1])
                else:
                    example_file = "examples/test-ffmpeg-simple.json"
            else:
                example_file = "examples/test-ffmpeg-simple.json"
        else:
            print("❌ Examples directory not found. Please provide a file path.")
            print("Usage: python test_api.py <path-to-json>")
            return
    
    # Call the API
    call_api(example_file)
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()

