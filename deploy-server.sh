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

APP_SERVICES="auth-service application-service inspection-service certificate-service company-service frontend"
BACKEND_SERVICES="auth-service application-service inspection-service certificate-service company-service"

wait_for_service_health() {
  service="$1"
  timeout_seconds="${2:-600}"
  elapsed_seconds=0

  echo "==> Waiting for $service to become healthy"
  while [ "$elapsed_seconds" -lt "$timeout_seconds" ]; do
    container_id="$(docker compose -f docker-compose.prod.yml ps -q "$service" || true)"
    if [ -n "$container_id" ]; then
      state="$(docker inspect -f '{{.State.Status}}' "$container_id" 2>/dev/null || true)"
      health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || true)"

      if [ "$health" = "healthy" ] || { [ "$health" = "none" ] && [ "$state" = "running" ]; }; then
        echo "$service is ready"
        return 0
      fi

      if [ "$state" = "exited" ] || [ "$state" = "dead" ]; then
        echo "$service stopped while starting"
        docker compose -f docker-compose.prod.yml ps
        docker compose -f docker-compose.prod.yml logs --tail=200 "$service"
        exit 1
      fi
    fi

    sleep 10
    elapsed_seconds=$((elapsed_seconds + 10))
  done

  echo "$service did not become healthy within ${timeout_seconds}s"
  docker compose -f docker-compose.prod.yml ps
  docker compose -f docker-compose.prod.yml logs --tail=200 "$service"
  exit 1
}

echo "==> Stopping app containers to free memory for the build"
docker compose -f docker-compose.prod.yml stop $APP_SERVICES || true

export MAVEN_OPTS="${MAVEN_OPTS:-} -Xmx512m -XX:MaxMetaspaceSize=256m -XX:+UseSerialGC"

echo "==> Building backend JARs one service at a time"
cd halal-cms-backend
for service in $BACKEND_SERVICES; do
  echo "==> Packaging $service"
  mvn -DskipTests -pl "$service" clean package
done

echo "==> Building and restarting containers"
cd ..
for service in $APP_SERVICES; do
  echo "==> Building image for $service"
  docker compose -f docker-compose.prod.yml build --no-cache "$service"
done

echo "==> Starting postgres"
docker compose -f docker-compose.prod.yml up -d postgres
wait_for_service_health postgres 180

echo "==> Starting backend services one at a time"
for service in $BACKEND_SERVICES; do
  docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate "$service"
  wait_for_service_health "$service" 600
done

echo "==> Starting frontend"
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend
wait_for_service_health frontend 120

echo "==> Container status"
docker compose -f docker-compose.prod.yml ps

echo "==> Auth service connectivity test"
docker exec qhx-frontend wget -S -O- "http://auth-service:8081/actuator/health"

echo "==> Deployment script completed"
