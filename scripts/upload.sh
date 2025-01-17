#!/bin/bash

yarn && yarn build:lambda
gcloud storage cp dist/*.zip gs://lamar-infra-assets/worker-lambda/$1

docker build -t quinninc/ffmpeg-worker:$1 .
docker push quinninc/ffmpeg-worker:$1

