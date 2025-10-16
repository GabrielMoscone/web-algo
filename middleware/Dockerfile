# Multi-stage build para reduzir tamanho da imagem

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copia apenas pom.xml para cache de dependências
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline

# Copia código
COPY src ./src

# Compila (ajuste se quiser rodar testes)
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests package

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar JAR do stage anterior
COPY --from=build /app/target/*.jar app.jar

# Usuário não-root (segurança)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Expor portas
EXPOSE 8080 8081

# Executar aplicação com otimizações
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]