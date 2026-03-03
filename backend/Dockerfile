# ── ExpenseIQ Backend — Dockerfile ───────────────────────────────────────────
# Multi-stage build: compile TypeScript in builder → lean runtime image
#
# Key fixes vs previous version:
#   1. Use node:20-slim (Debian) for BOTH stages — no Alpine, no OpenSSL issues
#   2. Copy full prisma engines from builder so nothing downloads at runtime
#   3. Run as root (Render sandboxes containers anyway) so Prisma can write
#   4. PRISMA_QUERY_ENGINE_TYPE=binary ensures correct engine is used

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL — required by Prisma generate
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client with binary engine (works on any Linux)
ENV PRISMA_CLI_BINARY_TARGETS="native,debian-openssl-3.0.x"
RUN npx prisma generate

RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PRISMA_QUERY_ENGINE_TYPE=binary

# OpenSSL required by Prisma query engine at runtime
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Production node_modules
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy everything Prisma needs from builder — no runtime downloads
COPY --from=builder /app/node_modules/.prisma        ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma        ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma         ./node_modules/prisma

# App code
COPY --from=builder /app/dist ./dist

# Schema needed for migrate deploy
COPY prisma ./prisma

EXPOSE 5000

# Run as root — Render already sandboxes the container
# Prisma needs write access to node_modules/@prisma/engines on first run
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
