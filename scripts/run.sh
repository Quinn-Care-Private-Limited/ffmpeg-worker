#!/usr/bin/env bash
set -eo pipefail

# Create mount directory for service.
mkdir -p $FS_PATH

# mount file store if fs ip is set
if [ -n "$FS_IP" ]; then
  echo "Mounting Cloud Filestore."
  # if Cloud storage type is S3
  if [ "$CLOUD_STORAGE_TYPE" = "S3" ]; then
    mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport $FS_IP:/ $FS_PATH
  fi

  # if Cloud storage type is GCS
  if [ "$CLOUD_STORAGE_TYPE" = "GCS" ]; then
    mount -o nolock -v $FS_IP:/$FS_SHARE_NAME $FS_PATH
  fi

  echo "Mounting completed."
fi


ffmpeg -version
echo "vmaf version:"
vmaf --version

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