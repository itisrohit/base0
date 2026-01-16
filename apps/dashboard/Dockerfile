# Multi-stage build for development environment
FROM oven/bun:1.2.16-alpine AS base
# Install dependencies only when needed
FROM base AS deps
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
# Build the dashboard using bun
RUN cd apps/dashboard && bun run build

# Development runner image - serve static files with nginx
FROM nginx:1.25-alpine AS runner
WORKDIR /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Copy the built application
COPY --from=builder /app/apps/dashboard/dist ./

# Copy nginx configuration
COPY <<EOF /etc/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen       3000;
        server_name  localhost;
        root        /usr/share/nginx/html;
        index       index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Handle React Router
        location / {
            try_files \$uri \$uri/ /index.html;
        }

        # API proxy (optional - could be removed if API is separate)
        location /api/ {
            proxy_pass http://api:3001/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
EOF

# Expose port
EXPOSE 3000

# Create startup script for graceful shutdown
COPY <<EOF /docker-entrypoint.sh
#!/bin/sh
# Graceful shutdown handler for nginx
shutdown() {
    echo "Received shutdown signal, stopping nginx gracefully..."
    nginx -s quit
    wait \$NGINX_PID
    echo "Nginx stopped gracefully"
    exit 0
}

# Set signal handlers
trap shutdown SIGTERM SIGINT

echo "Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=\$!

# Wait for the nginx process
wait \$NGINX_PID
EOF

RUN chmod +x /docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]