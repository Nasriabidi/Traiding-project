# === Stage 1 : Build ===
FROM node:18 AS build-stage

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et lock pour installer les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le reste du code
COPY . .

# Construire l'application (vite ou vue-cli)
RUN npm run build

# === Stage 2 : Production ===
FROM nginx:stable-alpine AS production-stage

# Supprimer le contenu par défaut de Nginx
RUN rm -rf /usr/share/nginx/

# Copier les fichiers buildés vers le dossier HTML de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
