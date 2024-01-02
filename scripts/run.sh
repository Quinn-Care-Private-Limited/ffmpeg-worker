#!/usr/bin/env bash
set -eo pipefail

# Create mount directory for service.
mkdir -p $FS_PATH

echo "Mounting Cloud Filestore."
mount -o nolock $FS_IP:/$FS_SHARE_NAME $MNT_DIR
echo "Mounting completed."

# Start the application
npm start &

# Exit immediately when one of the background processes terminate.
wait -n