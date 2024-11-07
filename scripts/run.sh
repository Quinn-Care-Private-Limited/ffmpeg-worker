#!/usr/bin/env bash
set -eo pipefail


# Start the application
node /app/build/index.js &
echo "Application started."
# Exit immediately when one of the background processes terminate.
wait -n