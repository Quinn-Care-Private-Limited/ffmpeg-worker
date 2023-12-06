#!/bin/bash
sudo rm -rf build
sudo npx tsc && \
sudo npx tsc-alias && \
sudo cp -r src/models build/
