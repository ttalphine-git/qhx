#!/bin/bash
set -e

echo "🚀 Deploying QHX Frontend..."

REGISTRY="registry.digitalocean.com/rzct"
FRONTEND_IMAGE="$REGISTRY/qhx-frontend:latest"

# Login to registry
echo "🔑 Logging into DigitalOcean Container Registry..."
echo "$DO_API_TOKEN" | docker login registry.digitalocean.com -u doctl --password-stdin

# Pull latest frontend image
echo "📥 Pulling latest frontend image..."
docker pull "$FRONTEND_IMAGE" || true

# Stop and remove old frontend container
echo "⏹️  Stopping old frontend container..."
docker compose -f docker-compose.yml down || true

# Start new containers (includes frontend with updated proxy config)
echo "▶️  Starting new containers..."
docker compose -f docker-compose.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "✅ Frontend deployment complete!"
docker compose ps

echo ""
echo "📊 Service Status:"
docker compose logs --tail=5
