# Stage 1: Build
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copia apenas pom.xml para cache de dependências
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline

# Copia código
COPY src ./src

# Compila (ajuste se quiser rodar testes)
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests package
FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app

COPY --from=build /app/target/*-SNAPSHOT.jar /app/app.jar

USER nonroot
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]