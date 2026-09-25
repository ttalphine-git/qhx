#!/bin/bash
set -e
set -o pipefail

echo "🔑 Logging into Container Registry..."
DO_API_TOKEN="dop_v1_93c5a071467a213a921884c026c2bd9fc7d0ce07ab24cfae8936b973203e8b13"

echo "$DO_API_TOKEN" | docker login \
  registry.digitalocean.com \
  -u "$DO_API_TOKEN" \
  --password-stdin

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
