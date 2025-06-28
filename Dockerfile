# Development Dockerfile - Fast builds, dev-friendly
FROM node:18-slim

# Install ffmpeg and development tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and package-lock.json for better caching
COPY package*.json ./

# Install dependencies (including dev dependencies for development)
RUN npm ci

# Copy configuration files
COPY tsconfig*.json ./

# Copy the rest of the application
COPY . .

# Build the TypeScript code
RUN npm run build

# Create directory for videos if it doesn't exist
RUN mkdir -p videos-working-directory logs downloads cache

# Expose the port the app runs on
EXPOSE 8080

# For development, use npm start for convenience (includes module resolution)
CMD ["npm", "start"] 