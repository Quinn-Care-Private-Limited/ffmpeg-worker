#!/usr/bin/env bash
set -eo pipefail

# Create mount directory for service.
# mkdir -p $FS_PATH

# mount file store if fs ip is set
# if [ -n "$FS_IP" ]; then
#   echo "Mounting Cloud Filestore."
#   mount -o nolock -v $FS_IP:/$FS_SHARE_NAME $FS_PATH
#   echo "Mounting completed."
# fi

ffmpeg -version
echo "vmaf version:"
vmaf --version

# Start the application
node /app/build/index.js &

# Exit immediately when one of the background processes terminate.
wait -n