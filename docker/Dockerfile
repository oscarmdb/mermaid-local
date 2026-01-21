# ============================================
# Stage 1: Build the application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies at build time (no runtime installs)
RUN npm ci

# Copy source code
COPY . .

# Build the production bundle
# All assets are bundled locally - no external fetches
RUN npm run build

# ============================================
# Stage 2: Production server with nginx
# ============================================
FROM nginx:alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S app && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G app app

# Copy custom nginx configuration with security headers
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Run as non-root user
USER app

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
