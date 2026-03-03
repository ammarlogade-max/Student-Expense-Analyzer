# ── ExpenseIQ Backend — Dockerfile ───────────────────────────────────────────
# Both stages use node:20-slim (Debian/Bookworm) — OpenSSL 3.x built in.
# binaryTargets are set in prisma/schema.prisma, NOT via env vars.

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# binaryTargets = ["native", "debian-openssl-3.0.x"] must be in schema.prisma
RUN npx prisma generate

RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma generated client + engines from builder
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma   ./node_modules/prisma

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
