# RunPod FFmpeg Worker Integration

This directory contains the RunPod serverless handler that interfaces with the FFmpeg Worker API.

## Overview

The RunPod handler (`handler.py`) acts as a bridge between RunPod's serverless platform and the local FFmpeg Worker API server. It accepts job requests from RunPod and forwards them to the appropriate FFmpeg API endpoints.

## Architecture

```
RunPod Job → RunPod Handler → FFmpeg Worker API → FFmpeg Processing → Response
```

## Supported Actions

The handler supports the following actions:

### 1. Process (`process`)
Execute a single FFmpeg command chain.

**Input:**
```json
{
  "input": {
    "action": "process",
    "data": {
      "chainCmds": ["ffmpeg", "-i", "input.mp4", "-c:v", "libx264", "output.mp4"],
      "output": "output.mp4"
    }
  }
}
```

### 2. Multi Process (`multi_process`)
Execute multiple FFmpeg command chains in parallel.

**Input:**
```json
{
  "input": {
    "action": "multi_process",
    "data": {
      "processes": [
        {
          "chainCmds": ["ffmpeg", "-i", "input1.mp4", "output1.mp4"],
          "output": "output1.mp4"
        },
        {
          "chainCmds": ["ffmpeg", "-i", "input2.mp4", "output2.mp4"],
          "output": "output2.mp4"
        }
      ]
    }
  }
}
```

### 3. Probe (`probe`)
Get media file information.

**Input:**
```json
{
  "input": {
    "action": "probe",
    "data": {
      "input": "/path/to/video.mp4"
    }
  }
}
```

### 4. VMAF (`vmaf`)
Calculate VMAF quality score between two videos.

**Input:**
```json
{
  "input": {
    "action": "vmaf",
    "data": {
      "input1": "/path/to/reference.mp4",
      "input2": "/path/to/distorted.mp4",
      "output": "/path/to/vmaf_output.json"
    }
  }
}
```

## Environment Variables

- `FFMPEG_API_BASE_URL`: Base URL for the FFmpeg API (default: `http://localhost:3000/api`)
- `FFMPEG_API_TIMEOUT`: Timeout for API requests in seconds (default: `300`)

## Response Format

**Success Response:**
```json
{
  "success": true,
  "result": {
    // API response data
  }
}
```

**Error Response:**
```json
{
  "error": "Error message describing what went wrong"
}
```

## Usage Examples

### Basic Video Conversion
```python
import runpod

# Example job for video conversion
job = {
    "input": {
        "action": "process",
        "data": {
            "chainCmds": [
                "ffmpeg", "-i", "/volume/input.mp4", 
                "-c:v", "libx264", "-preset", "medium", 
                "-crf", "23", "/volume/output.mp4"
            ],
            "output": "/volume/output.mp4"
        }
    }
}
```

### Media Information Extraction
```python
job = {
    "input": {
        "action": "probe",
        "data": {
            "input": "/volume/video.mp4"
        }
    }
}
```

### Quality Assessment
```python
job = {
    "input": {
        "action": "vmaf",
        "data": {
            "input1": "/volume/reference.mp4",
            "input2": "/volume/encoded.mp4",
            "output": "/volume/vmaf_scores.json"
        }
    }
}
```

## Development

### Local Testing
To test the handler locally:

1. Start the FFmpeg Worker API server:
   ```bash
   npm run dev
   ```

2. Run the handler in test mode:
   ```bash
   python3 runpod/handler.py
   ```

### Dependencies
- `runpod`: RunPod SDK for serverless functions
- `requests`: HTTP library for API communication

## Error Handling

The handler includes comprehensive error handling:
- Health checks for the FFmpeg API
- Input validation
- Timeout handling
- Graceful error responses

## Logging

The handler uses Python's logging module to provide detailed information about:
- Job processing status
- API communication
- Error conditions
- Performance metrics


## Example Runpod JSON

```json
{
  "input": {
    "path": "/canvas/process",
    "body": {},
    "upload": {
      "bucket": "shoppable-app-assets",
      "key": "test/test.mp4",
      "cloud_type": "AWS",
      "credentials": {
        "aws_access_key_id": "",
        "aws_secret_access_key": "",
        "aws_url": "",
        "aws_public_url": ""
      }
    }
  }
}

```

### Sample .env

```
ENV=development

VERSION=1.0.1
TEST_INPUT_FILE_NAME=test-input-with-audio.json
```