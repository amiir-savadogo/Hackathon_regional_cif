# Image du frontend Angular pour docker-compose (usage local/démo uniquement).
#
# Choix : `ng serve` (serveur de développement) plutôt que le build SSR utilisé
# en production sur Vercel (dist/frontend/server/server.mjs). En SSR, le
# serveur Node tournerait DANS ce conteneur et devrait appeler le backend via
# le nom de service Docker (http://backend:8080), alors que le navigateur de
# l'utilisateur, lui, doit appeler le backend via le port publié sur l'hôte
# (http://localhost:8080) - deux URLs différentes pour un seul environnement.
# `ng serve` évite cette dualité : tout le code tourne dans le navigateur, qui
# voit toujours localhost, exactement comme environment.ts (non-production)
# le prévoit déjà. Le déploiement Vercel (SSR) n'est pas concerné par ce fichier.
FROM node:20-alpine

WORKDIR /app

# Étape séparée pour profiter du cache Docker sur npm ci.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4200

# --host 0.0.0.0 indispensable en conteneur (sinon injoignable depuis l'hôte).
# --poll utile car la détection de fichiers modifiés par inotify échoue
# parfois entre un volume monté et le conteneur ; sans impact si aucun volume
# n'est monté (mode "build only", cf. docker-compose.yml).
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000"]
