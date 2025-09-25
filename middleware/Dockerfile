FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu AS build
WORKDIR /app


RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline

COPY . .
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests package

FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app
COPY --from=build /app/target/*-SNAPSHOT.jar /app/app.jar

USER nonroot
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
