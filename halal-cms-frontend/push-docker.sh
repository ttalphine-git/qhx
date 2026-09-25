#!/bin/bash
set -e
set -o pipefail

echo "🔑 Logging into Container Registry..."

# Check if DO_API_TOKEN is provided in the environment
if [ -z "$DO_API_TOKEN" ]; then
  echo "❌ Error: DO_API_TOKEN environment variable is not set."
  echo "Please export DO_API_TOKEN before running this script."
  exit 1
fi

# DigitalOcean registry uses 'doctl' as the username with the token passed as password
echo "$DO_API_TOKEN" | docker login registry.digitalocean.com -u doctl --password-stdin

container_registry="registry.digitalocean.com"
container_image_owner="rzct"
image_name="qhx-frontend"
image_tag="latest"
Dockerfile="Dockerfile"

FULL_IMAGE="$container_registry/$container_image_owner/$image_name:$image_tag"

echo "Building image..."
docker build -f "$Dockerfile" -t "$FULL_IMAGE" .

echo "Pushing image..."
docker push "$FULL_IMAGE"

echo "Created and pushed image:"
echo "$FULL_IMAGE"
