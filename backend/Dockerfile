FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src
RUN chmod +x mvnw && ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S cookie && adduser -S cookie -G cookie && mkdir -p /data/uploads && chown -R cookie:cookie /data/uploads
COPY --from=build /workspace/target/receitas-api-0.0.1-SNAPSHOT.jar /app/app.jar
USER cookie
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
