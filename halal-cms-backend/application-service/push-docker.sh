#!/bin/sh
set -e
echo "🔑 Logging into Container Registry..."
DO_API_TOKEN="dop_v1_38ebefd764b5edbad51f404d19838b7d8a7dd5166868c3787de35213660b3e61"

echo "$DO_API_TOKEN" | docker login \
  registry.digitalocean.com \
  -u doctl \
  --password-stdin

container_registry="registry.digitalocean.com"
contianer_image_owner="rzct"
image_name="qhx-application"
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
