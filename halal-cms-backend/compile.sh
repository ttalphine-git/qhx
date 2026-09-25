mvn clean package -DskipTests

cd application-service/ && sh push-docker.sh || true
cd ../inspection-service/ && sh push-docker.sh || true
cd ../auth-service/ && sh push-docker.sh || true
cd ../certificate-service/ && sh push-docker.sh || true
cd ../company-service/ && sh push-docker.sh || true
