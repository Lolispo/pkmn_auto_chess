# Backend image for pkmn_auto_chess (Express + Socket.io game server).
FROM node:22-slim
WORKDIR /usr/src/app

# Install only production deps against the root package.json/package-lock.json.
COPY package*.json ./
RUN npm ci --omit=dev

# App source + the root pokemon *.json data files the backend loads at boot.
COPY src ./src
COPY *.json ./

ENV PORT=8000
EXPOSE 8000
CMD ["node", "src/index.js"]
