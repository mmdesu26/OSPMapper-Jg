# ── Stage 1: Install deps ──────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

# ── Stage 2: Build TypeScript ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nestjs && adduser -S nestjs -G nestjs
COPY --from=builder --chown=nestjs:nestjs /app/dist         ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main"]
