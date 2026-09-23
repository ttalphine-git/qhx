FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY pom.xml .
COPY auth-service/pom.xml auth-service/
COPY application-service/pom.xml application-service/
COPY certificate-service/pom.xml certificate-service/
COPY company-service/pom.xml company-service/
COPY inspection-service/pom.xml inspection-service/

RUN mvn dependency:go-offline -pl certificate-service -am -q --no-transfer-progress

COPY certificate-service/src certificate-service/src

RUN mvn package -pl certificate-service -am -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring
COPY --from=builder /build/certificate-service/target/certificate-service-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
