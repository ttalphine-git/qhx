#!/bin/bash
set -e

echo "🚀 Starting QHX Deployment..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "📝 Loading environment variables from .env..."
  set -a
  source .env
  set +a
else
  echo "⚠️  .env file not found - using defaults from docker-compose.yml"
fi

REGISTRY="registry.digitalocean.com/rzct"
SERVICES=("qhx-auth" "qhx-application" "qhx-inspection" "qhx-certificate" "qhx-company" "qhx-frontend")

# Login to registry
echo "🔑 Logging into DigitalOcean Container Registry..."
echo "$DO_API_TOKEN" | docker login registry.digitalocean.com -u doctl --password-stdin

# Pull latest images
echo "📥 Pulling latest images..."
for service in "${SERVICES[@]}"; do
  docker pull "$REGISTRY/$service:latest" || true
done

# Stop and remove old containers
echo "⏹️  Stopping old containers..."
docker compose -f docker-compose.yml down || true

# Start new containers
echo "▶️  Starting new containers..."
docker compose -f docker-compose.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "✅ Deployment complete!"
docker compose ps

echo ""
echo "📊 Service Status:"
docker compose logs --tail=5
