# syntax=docker/dockerfile:1

# ClassFit-NYC — production image for AWS ECR/ECS
# Multi-stage build: install deps (with native toolchain for better-sqlite3),
# build the Next.js app + SQLite data file, then ship a minimal runtime image.

FROM node:20-bookworm-slim AS base
WORKDIR /app

# ---------- deps: install node_modules (needs build tools for better-sqlite3) ----------
FROM base AS deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder: generate data + build Next.js ----------
FROM base AS builder
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the SQLite database the app reads at runtime (lib/db.ts).
# Swap for `npm run fetch:real && npm run load:data` once you have real
# NYC data source access configured; mock data works out of the box.
RUN npm run setup:data

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runner: minimal production image ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Next.js "standalone" output (see next.config.ts: output: "standalone")
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
