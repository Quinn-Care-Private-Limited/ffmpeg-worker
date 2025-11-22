#!/usr/bin/env bash
set -eo pipefail

ffmpeg -version
echo "vmaf version:"
vmaf --version

if [ "$CLOUD_TYPE" = "RUNPOD" ]; then
  # Start the Node.js FFmpeg worker API server
  echo "Starting FFmpeg Worker API server..."
  node /app/build/index.js &
  NODE_PID=$!

  # Start the RunPod handler
  echo "Starting RunPod handler..."
  cd /app && python3 runpod/handler.py &
  RUNPOD_PID=$!

  # Function to cleanup processes on exit
  cleanup() {
      echo "Shutting down services..."
      kill $NODE_PID 2>/dev/null || true
      kill $RUNPOD_PID 2>/dev/null || true
      wait $NODE_PID 2>/dev/null || true
      wait $RUNPOD_PID 2>/dev/null || true
      echo "Services stopped."
  }

    # Set up signal handlers
  trap cleanup SIGTERM SIGINT

  # Wait for any process to exit
  wait -n

  # If we reach here, one of the processes has exited
  echo "One of the services has stopped. Initiating cleanup..."
  cleanup
else
  echo "Starting FFmpeg Worker API server..."
  node /app/build/index.js &
  
  # Wait for any process to exit
  wait -n
fi

