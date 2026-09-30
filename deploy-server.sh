#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"

echo "==> Pulling latest code"
git pull origin main

echo "==> Building container images"
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "==> Deploying all services"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate

echo "==> Container status"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Deployment completed successfully"
