FROM node:22-alpine

WORKDIR /app

# Copie les fichiers de dépendances
COPY package*.json ./

# Installe les dépendances
RUN npm ci

# Copie le reste du projet
COPY . .

# Génère le client Prisma
RUN npx prisma generate

EXPOSE 3446

CMD ["npm", "run", "dev"]
