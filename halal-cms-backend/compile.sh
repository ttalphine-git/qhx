#!/bin/bash
set -e
set -o pipefail

echo "==> Building backend services with Maven..."
mvn clean package -DskipTests
 
echo "==> Packaging and pushing Docker images..."
cd application-service/ && sh push-docker.sh
cd ../inspection-service/ && sh push-docker.sh
cd ../auth-service/ && sh push-docker.sh
cd ../certificate-service/ && sh push-docker.sh
cd ../company-service/ && sh push-docker.sh
