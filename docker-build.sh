#!/bin/bash
set -e

IMAGE_NAME="truthforge-ai"
IMAGE_TAG="${1:-latest}"

echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Build successful"
  echo ""
  docker image ls | grep ${IMAGE_NAME}
else
  echo ""
  echo "✗ Build failed"
  exit 1
fi
