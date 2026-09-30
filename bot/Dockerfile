# Stage 1: build the mini-app (Vite + React + TS)
FROM node:22-alpine AS webapp-build
WORKDIR /build/webapp
# Адрес API, который фронт зашьёт в бандл. Пусто = фронт работает на демо-данных.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
COPY webapp/package.json webapp/package-lock.json ./
RUN npm ci
COPY webapp/ ./
RUN npm run build

# Stage 2: build the bot backend (Express + TS)
FROM node:22-alpine AS bot-build
WORKDIR /build/bot
COPY bot/package.json bot/package-lock.json ./
RUN npm ci
COPY bot/ ./
RUN npm run build && npm prune --omit=dev

# Stage 3: runtime — bot serves webapp/dist as static from bot/public
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=bot-build /build/bot/dist ./dist
COPY --from=bot-build /build/bot/node_modules ./node_modules
COPY --from=bot-build /build/bot/package.json ./package.json
COPY --from=webapp-build /build/webapp/dist ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
