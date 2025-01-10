#!/bin/bash
rm -rf build
npx tsc && \
npx tsc-alias && \
cp -r src/handlers/vmaf_*.json build/handlers
