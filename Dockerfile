# Лабораторная работа №18 — Задание 2: Оптимизированный многоступенчатый Dockerfile (Multi-stage build)

# --- Этап 1: Сборка (builder) ---
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Удаляем devDependencies (typescript, @nestjs/cli, jest и др.), оставляя только production-зависимости
RUN npm prune --omit=dev

# --- Этап 2: Продакшн (production) ---
FROM node:20-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Копируем из этапа builder только скомпилированный код (dist) и production node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
