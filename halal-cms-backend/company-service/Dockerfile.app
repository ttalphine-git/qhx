FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /workspace

COPY . .
RUN mvn -pl company-service -am package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /workspace/company-service/target/*.jar app.jar

RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app
USER appuser

EXPOSE 8085
ENTRYPOINT ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "app.jar"]
