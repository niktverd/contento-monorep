# =============================================================================
# BUILDER STAGE
# =============================================================================
FROM ubuntu:latest AS builder

# Install Node.js 22 and build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y \
    nodejs \
    python3 \
    make \
    g++ \
    git \
    ffmpeg \
    libvips-dev \
    libvips-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code and TypeScript configuration
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript project
RUN npm run build

# =============================================================================
# PRODUCTION DEPENDENCIES STAGE
# =============================================================================
FROM ubuntu:latest AS prod-deps

# Install Node.js 22
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# =============================================================================
# RUNTIME STAGE
# =============================================================================
FROM ubuntu:latest AS runtime

# Install Node.js 22 and runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y \
    nodejs \
    ffmpeg \
    libvips \
    libvips-tools \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r temporal-worker -g 10000 \
    && useradd -r -g temporal-worker -u 10000 -m -s /bin/bash temporal-worker

WORKDIR /app

# Copy compiled code from builder
COPY --from=builder /app/lib ./lib

# Copy package.json for runtime
COPY --from=builder /app/package.json ./

# Copy production node_modules from prod-deps
COPY --from=prod-deps /app/node_modules ./node_modules

# Change ownership to non-root user
RUN chown -R temporal-worker:temporal-worker /app

# Switch to non-root user
USER temporal-worker

# =============================================================================
# ENVIRONMENT VARIABLES
# =============================================================================
# Required environment variables (must be provided at runtime):
#
# TEMPORAL_ADDRESS - Temporal server address (e.g., temporal.dev.unico.rn.it:7233)
# TEMPORAL_NAMESPACE - Temporal namespace (default: default)
# DATABASE_URL - PostgreSQL connection string
# POSTGRES_CONFIG - PostgreSQL configuration JSON
# FIREBASE_ADMIN_SA_CONFIG_PREPROD - Firebase service account credentials
# APP_ENV - Application environment (development/staging/production)
# APP_ID - Application ID
# API_SECRET - API secret key
#
# Optional environment variables:
# INSTAGRAM_APP_NAME, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET
# INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCESS_TOKEN_ARRAY
# FIREBASE_CONFIG, FIREBASE_CONFIG_PREPROD, FIREBASE_CONFIG_REELS_CREATOR
# HEROKU_API_KEY, HEROKU_APP_NAME
# YT_CLOUD_ID, YT_SECRET_ID, YT_REDIRECT_URL, YT_REFRESH_TOKEN
# GCP_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS
# MAIN_BACKEND_ENDPOINT
# ENABLE_STDERR, ENABLE_PROGRESS, ENABLE_START
# ENABLE_DOWNLOAD_VIDEO, ENABLE_RUN_SCENARIO_VIDEO
#
# Example usage:
# docker run --env-file .env temporal-workers:latest
# docker run -e TEMPORAL_ADDRESS=temporal.example.com:7233 -e DATABASE_URL=postgresql://... temporal-workers:latest

# Start the Temporal workers
CMD ["node", "lib/workers/index.js"]

# podman build --platform linux/amd64 -t docker.io/niktverd/instagram-video-temporal:latest . && podman push docker.io/niktverd/instagram-video-temporal:latest   