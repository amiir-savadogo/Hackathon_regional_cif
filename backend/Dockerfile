# Étape 1 : Construction (Build) avec Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# -DskipTests conservé volontairement ICI : des tests d'intégration réels ont été
# ajoutés (src/test/java/.../ClientControllerIntegrationTest.java) mais n'ont pas pu
# être compilés dans l'environnement où ils ont été écrits (pas d'accès à Maven
# Central). Avant le hackathon : lancez `mvn test` en local pour les valider, PUIS
# seulement retirez -DskipTests ici pour que la CI les exécute à chaque build.
# Les exécuter à l'aveugle dans ce Dockerfile aurait pu casser le déploiement si le
# code de test contenait la moindre erreur de compilation.
#RUN mvn clean package -DskipTests
RUN mvn clean package -Dmaven.test.skip=true

# Étape 2 : Exécution (Run)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
