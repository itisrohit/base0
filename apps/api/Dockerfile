# Multi-stage build for development environment
FROM oven/bun:1.2.16-alpine AS base
# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/db/package.json ./packages/db/
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY . .
# Build the API
RUN cd apps/api && bun run build

# Development runner image, copy all the files and run bun
FROM oven/bun:1.2.16-alpine AS runner
WORKDIR /app

ENV NODE_ENV=development
# Install curl for health checks
RUN apk add --no-cache curl

# Add a non-root user for security
RUN addgroup --system --gid 1001 bun-nodejs && \
    adduser --system --uid 1001 bun-nodejs

# Create startup script
COPY <<EOF /app/start.sh
#!/bin/sh
# Graceful shutdown handler
shutdown() {
    echo "Received shutdown signal, stopping gracefully..."
    kill -TERM \$PID
    wait \$PID
    echo "Server stopped gracefully"
    exit 0
}

# Set signal handlers
trap shutdown SIGTERM SIGINT

# Start the application in background
echo "Starting Base0 API server..."
bun run src/index.ts &
PID=\$!

# Wait for the process
wait \$PID
EOF

RUN chmod +x /app/start.sh

# Copy the built application
COPY --from=builder --chown=bun-nodejs:bun-nodejs /app/apps/api/src ./src
COPY --from=builder --chown=bun-nodejs:bun-nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=bun-nodejs:bun-nodejs /app/apps/api/package.json ./package.json
COPY --from=deps --chown=bun-nodejs:bun-nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bun-nodejs:bun-nodejs /app/packages/db ./packages/db

# Set proper permissions and switch to non-root user
USER bun-nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["/app/start.sh"]