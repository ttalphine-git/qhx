#!/bin/bash
set -e
set -o pipefail

echo "==> Building backend services with Maven..."
mvn clean package -DskipTests

echo "==> Packaging and pushing Docker images..."
cd application-service/ && sh push-docker.sh || true
cd ../inspection-service/ && sh push-docker.sh || true
cd ../auth-service/ && sh push-docker.sh || true
cd ../certificate-service/ && sh push-docker.sh || true
cd ../company-service/ && sh push-docker.sh || true
