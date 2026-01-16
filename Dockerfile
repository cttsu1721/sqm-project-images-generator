# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:22-slim AS deps

WORKDIR /app

# Install Python for node-gyp (some npm packages need it)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# ============================================================
# Stage 2: Builder
# ============================================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================================
# Stage 3: Production Runner
# ============================================================
FROM node:22-slim AS runner

WORKDIR /app

# Install Python 3 and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create directories for uploads and generated images
RUN mkdir -p /app/uploads /app/generated-images && \
    chown -R nextjs:nodejs /app/uploads /app/generated-images

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Python agent
COPY --chown=nextjs:nodejs agent ./agent
COPY --chown=nextjs:nodejs requirements.txt ./

# Create Python virtual environment and install dependencies
RUN python3 -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/.venv/bin/pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Python path for spawned processes
ENV PYTHON_PATH=/app/.venv/bin/python3
ENV PYTHONPATH=/app/agent

# Storage directories
ENV UPLOAD_DIR=/app/uploads
ENV OUTPUT_DIR=/app/generated-images

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
