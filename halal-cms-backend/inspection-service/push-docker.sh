#!/bin/sh
set -e
echo "🔑 Logging into Container Registry..."
DO_API_TOKEN="dop_v1_b5d030aa2ee476587e381085e89e8ea9cb7215083d8f0b2ed5c4e2f20ba5652f"

echo "$DO_API_TOKEN" | docker login \
  registry.digitalocean.com \
  -u doctl \
  --password-stdin

container_registry="registry.digitalocean.com"
contianer_image_owner="rzct"
image_name="qhx-inspection"
image_tag="latest"
Dockerfile="Dockerfile"

FULL_IMAGE="$container_registry/$contianer_image_owner/$image_name:$image_tag"

echo "Logging into DigitalOcean Container Registry..."
docker login "$container_registry"

echo "Building image from parent backend context..."
docker build -f "$Dockerfile" -t "$FULL_IMAGE" .

echo "Pushing image..."
docker push "$FULL_IMAGE"

echo "✅ Created and pushed image:"
echo "$FULL_IMAGE"
