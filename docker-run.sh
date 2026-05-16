#!/bin/bash
set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
  echo "Warning: GEMINI_API_KEY not set. The application may not function properly."
  echo "Please set GEMINI_API_KEY in .env file or as an environment variable."
fi

echo "Starting TruthForge AI with Docker Compose..."
docker-compose up --build
