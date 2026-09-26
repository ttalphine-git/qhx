#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Updating apt metadata"
apt-get update

echo "==> Installing required packages"
apt-get install -y git maven

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Docker is not installed; installing Ubuntu Docker packages"
  apt-get install -y docker.io docker-compose-plugin
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "==> Docker Compose plugin is missing; installing compose plugin"
  apt-get install -y docker-compose-plugin
fi

systemctl enable --now docker || true

if ! command -v javac >/dev/null 2>&1 || ! javac -version 2>&1 | grep -q '21'; then
  echo "==> Installing JDK 21"
  if ! apt-get install -y openjdk-21-jdk; then
    echo "openjdk-21-jdk was not available from current apt repositories."
    echo "Please install Java 21 manually, then rerun this script."
    exit 1
  fi
fi

if [ -d /usr/lib/jvm/java-21-openjdk-amd64 ]; then
  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
  export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "==> Tool versions"
java -version
javac -version
mvn -version
docker --version
docker compose version

echo "==> Pulling latest code"
git pull origin main

echo "==> Building backend JARs"
cd halal-cms-backend
mvn -DskipTests package

echo "==> Building and restarting containers"
cd ..
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Container status"
docker compose -f docker-compose.prod.yml ps

echo "==> Auth service logs"
docker compose -f docker-compose.prod.yml logs --tail=80 auth-service

echo "==> Auth service connectivity test"
docker exec qhx-frontend wget -S -O- "http://auth-service:8081/auth/check-email?email=test@example.com" || true

echo "==> Deployment script completed"
