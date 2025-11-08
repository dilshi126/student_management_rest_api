FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# Environment variables for PostgreSQL connection
ENV SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/studentdb
ENV SPRING_DATASOURCE_USERNAME=postgres
ENV SPRING_DATASOURCE_PASSWORD=m1512

ENTRYPOINT ["java", "-jar", "app.jar"]
