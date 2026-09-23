FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY pom.xml .
COPY auth-service/pom.xml auth-service/
COPY application-service/pom.xml application-service/
COPY certificate-service/pom.xml certificate-service/
COPY company-service/pom.xml company-service/
COPY inspection-service/pom.xml inspection-service/

RUN mvn dependency:go-offline -pl application-service -am -q --no-transfer-progress

COPY application-service/src application-service/src

RUN mvn package -pl application-service -am -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S -G spring spring || true
USER spring
COPY --from=builder /build/application-service/target/application-service-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
