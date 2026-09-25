#!/bin/sh
echo "🔑 Logging into Container Registry..."

if [ -z "$DO_API_TOKEN" ]; then
  echo "❌ Error: DO_API_TOKEN environment variable is not set."
  echo "Please export DO_API_TOKEN before running this script."
  exit 1
fi

# DigitalOcean registry uses 'doctl' as the username with the token passed as password
echo "$DO_API_TOKEN" | docker login registry.digitalocean.com -u doctl --password-stdin

container_registry="registry.digitalocean.com"
contianer_image_owner="rzct"
image_name="qhx-company"
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
