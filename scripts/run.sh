#!/usr/bin/env bash
set -eo pipefail

ffmpeg -version
echo "vmaf version:"
vmaf --version

# Start the Node.js FFmpeg worker API server
echo "Starting FFmpeg Worker API server..."
node build/index.js &
NODE_PID=$!

# Start the RunPod handler
echo "Starting RunPod handler..."
python3 -m app.main &
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

