# ─── Base ──────────────────────────────────────────────────────────────────────
FROM node:25-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./

# ─── Development ───────────────────────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# ─── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
RUN npm ci --include=dev
COPY . .
RUN npm run build

# ─── Production ────────────────────────────────────────────────────────────────
FROM node:25-alpine AS production
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

RUN apk add --no-cache dumb-init

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/index.js"]
