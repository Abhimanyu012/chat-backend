# Use specific Node.js version for better reproducibility
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Add build argument for environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Add package files for better caching
COPY package.json package-lock.json* ./

# Install dependencies with clean install
RUN npm ci --production

# Copy application code
COPY . .

# Production image
FROM node:18-alpine AS production

# Add labels for better container management
LABEL maintainer="Your Name <your.email@example.com>"
LABEL version="1.0.0"
LABEL description="Chat Application Backend API"

# Set working directory
WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy from builder stage
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 4000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
