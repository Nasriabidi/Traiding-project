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

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

