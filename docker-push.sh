#!/bin/bash
set -e

REGISTRY="${1:-docker.io}"
USERNAME="${2:-}"
IMAGE_NAME="truthforge-ai"
IMAGE_TAG="${3:-latest}"

if [ -z "$USERNAME" ]; then
  echo "Usage: docker-push.sh <registry> <username> [tag]"
  echo ""
  echo "Examples:"
  echo "  docker-push.sh docker.io myusername"
  echo "  docker-push.sh docker.io myusername v1.0.0"
  echo "  docker-push.sh ghcr.io myusername latest"
  exit 1
fi

echo "Tagging image for registry..."
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}

echo "Pushing ${IMAGE_NAME}:${IMAGE_TAG} to ${REGISTRY}..."
docker push ${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Push successful"
  echo "Image pushed to: ${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
else
  echo ""
  echo "✗ Push failed"
  exit 1
fi
