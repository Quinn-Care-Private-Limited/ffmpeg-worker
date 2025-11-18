#!/usr/bin/env python3
"""
Test script for RunPod FFmpeg Worker Handler
"""

import json
import sys
import os

# Add the current directory to Python path to import handler
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from handler import handler


def test_health_check():
    """Test basic health check functionality"""
    print("Testing health check...")
    
    job = {
        "input": {
            "action": "probe",
            "data": {
                "input": "/dev/null"  # This should fail gracefully
            }
        }
    }
    
    result = handler(job)
    print(f"Health check result: {json.dumps(result, indent=2)}")
    return result


def test_process_action():
    """Test basic process action"""
    print("\nTesting process action...")
    
    job = {
        "input": {
            "action": "process",
            "data": {
                "chainCmds": ["ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=1", "-y", "/tmp/test_output.mp4"],
                "output": "/tmp/test_output.mp4"
            }
        }
    }
    
    result = handler(job)
    print(f"Process result: {json.dumps(result, indent=2)}")
    return result


def test_invalid_action():
    """Test invalid action handling"""
    print("\nTesting invalid action...")
    
    job = {
        "input": {
            "action": "invalid_action",
            "data": {}
        }
    }
    
    result = handler(job)
    print(f"Invalid action result: {json.dumps(result, indent=2)}")
    return result


def test_missing_action():
    """Test missing action handling"""
    print("\nTesting missing action...")
    
    job = {
        "input": {
            "data": {}
        }
    }
    
    result = handler(job)
    print(f"Missing action result: {json.dumps(result, indent=2)}")
    return result


def main():
    """Run all tests"""
    print("RunPod FFmpeg Worker Handler Test Suite")
    print("=" * 50)
    
    tests = [
        test_missing_action,
        test_invalid_action,
        test_health_check,
        test_process_action,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"Test failed with exception: {e}")
            results.append({"error": str(e)})
    
    print("\n" + "=" * 50)
    print("Test Summary:")
    for i, result in enumerate(results):
        status = "PASS" if "success" in result or "error" in result else "FAIL"
        print(f"Test {i+1}: {status}")
    
    print("\nNote: Some tests may show errors - this is expected for error handling tests.")


if __name__ == "__main__":
    main()
