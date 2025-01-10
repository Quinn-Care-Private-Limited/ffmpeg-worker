#!/bin/bash
rm -rf build
npx tsc && \
npx tsc-alias && \
cp -r src/models build/
