#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating apt metadata"
apt-get update

echo "==> Installing required packages"
apt-get install -y git maven

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Docker is not installed; installing Ubuntu Docker packages"
  apt-get install -y docker.io
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "==> Docker Compose plugin is missing; installing compose package"
  if apt-cache show docker-compose-v2 >/dev/null 2>&1; then
    apt-get install -y docker-compose-v2
  elif apt-cache show docker-compose-plugin >/dev/null 2>&1; then
    apt-get install -y docker-compose-plugin
  elif apt-cache show docker-compose >/dev/null 2>&1; then
    apt-get install -y docker-compose
  else
    echo "No Docker Compose package was found in apt repositories."
    exit 1
  fi
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
docker compose -f docker-compose.prod.yml build --no-cache auth-service company-service frontend
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate auth-service company-service frontend

echo "==> Waiting for auth service to accept connections"
for i in $(seq 1 60); do
  if docker exec qhx-frontend wget -qO- "http://auth-service:8081/actuator/health" >/tmp/auth-check.out 2>/tmp/auth-check.err; then
    cat /tmp/auth-check.out
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "Auth service did not become reachable"
    cat /tmp/auth-check.err || true
    docker compose -f docker-compose.prod.yml ps
    docker compose -f docker-compose.prod.yml logs --tail=160 auth-service
    exit 1
  fi
  sleep 5
done

echo "==> Container status"
docker compose -f docker-compose.prod.yml ps

echo "==> Auth service logs"
docker compose -f docker-compose.prod.yml logs --tail=80 auth-service

echo "==> Auth service connectivity test"
docker exec qhx-frontend wget -S -O- "http://auth-service:8081/actuator/health"

echo "==> Deployment script completed"
