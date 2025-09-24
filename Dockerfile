# Frontend Dockerfile
FROM node:18-alpine AS base

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy root package.json for workspace setup
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm ci

# Build shared package first
COPY shared/ ./shared/
RUN npm run build:shared

# Copy frontend source
COPY frontend/ ./frontend/

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOLANA_NETWORK
ARG NEXT_PUBLIC_SKIP_KYC

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOLANA_NETWORK=$NEXT_PUBLIC_SOLANA_NETWORK
ENV NEXT_PUBLIC_SKIP_KYC=$NEXT_PUBLIC_SKIP_KYC

# Build frontend
RUN npm run build:frontend

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built Next.js application
COPY --from=base /app/frontend/.next/standalone ./
COPY --from=base /app/frontend/.next/static ./frontend/.next/static
COPY --from=base /app/frontend/public ./frontend/public

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start frontend server
CMD ["node", "frontend/server.js"]