# Instagram Video Downloader - Temporal Workers

This project contains Temporal workers for processing Instagram video workflows including downloading, processing, and publishing videos.

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- Docker (for containerized deployment)
- Access to a Temporal server
- PostgreSQL database

## Running Locally

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Start the Workers

```bash
npm run start
```

The workers will connect to the Temporal server specified in your environment variables and begin processing workflows.

## Docker Deployment

### Build the Docker Image

Build the Docker image using the provided Dockerfile:

```bash
docker build -t temporal-workers:latest .
```

The build process uses a multi-stage approach to create an optimized production image:
- Compiles TypeScript code
- Installs only production dependencies
- Runs as a non-root user for security
- Includes FFmpeg and other required system dependencies

### Run with Docker

#### Using docker run

Run the container with environment variables:

```bash
docker run --env-file .env temporal-workers:latest
```

Or pass individual environment variables:

```bash
docker run \
  -e TEMPORAL_ADDRESS=temporal.example.com:7233 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e APP_ENV=production \
  temporal-workers:latest
```

#### Using Docker Compose

The easiest way to run the workers is with Docker Compose:

```bash
# Start the workers
docker-compose up -d

# View logs
docker-compose logs -f temporal-workers

# Stop the workers
docker-compose down
```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   - `TEMPORAL_ADDRESS` - Your Temporal server address
   - `DATABASE_URL` - PostgreSQL connection string
   - `FIREBASE_ADMIN_SA_CONFIG_PREPROD` - Firebase credentials
   - Other required variables (see `.env.example` for full list)

### Required Environment Variables

- `TEMPORAL_ADDRESS` - Temporal server address (e.g., `temporal.dev.unico.rn.it:7233`)
- `TEMPORAL_NAMESPACE` - Temporal namespace (default: `default`)
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_CONFIG` - PostgreSQL configuration JSON
- `APP_ENV` - Application environment (development/staging/production)
- `APP_ID` - Application ID
- `API_SECRET` - API secret key

See `.env.example` for a complete list of optional environment variables.

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build.watch` - Watch mode for development
- `npm run start` - Start the workers
- `npm run start.watch` - Start workers with auto-reload
- `npm run workflow` - Run a workflow client
- `npm test` - Run tests
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

### Project Structure

- `src/workers/` - Worker definitions and configuration
- `src/workflows/` - Temporal workflow definitions
- `src/activities/` - Temporal activity implementations
- `src/video-production/` - Video processing logic
- `src/database/` - Database models and API

## Troubleshooting

### Docker Build Issues

**Problem**: Build fails with "unable to install Node.js"
- **Solution**: Check your internet connection and try again. The build downloads Node.js from NodeSource.

**Problem**: Build fails with "npm ci" errors
- **Solution**: Ensure `package-lock.json` is up to date. Run `npm install` locally first.

### Runtime Issues

**Problem**: Workers fail to connect to Temporal
- **Solution**: Verify `TEMPORAL_ADDRESS` is correct and the Temporal server is accessible from the container.

**Problem**: Database connection errors
- **Solution**: Check `DATABASE_URL` and ensure the database is accessible. If running in Docker, ensure network connectivity.

**Problem**: Permission denied errors
- **Solution**: The container runs as user `temporal-worker` (UID 1000). Ensure any mounted volumes have appropriate permissions.

### Checking Container Status

```bash
# Check if container is running
docker ps

# View container logs
docker logs temporal-workers

# Check container user
docker exec temporal-workers whoami
# Should output: temporal-worker

# Inspect container
docker inspect temporal-workers
```

### Image Size

The final Docker image should be approximately 400-500MB. If significantly larger, the multi-stage build may not be working correctly.

```bash
# Check image size
docker images temporal-workers
```

## Production Deployment

For production deployments, consider:

1. **Container Registry**: Push the image to a container registry (Docker Hub, GCR, ECR)
   ```bash
   docker tag temporal-workers:latest your-registry/temporal-workers:latest
   docker push your-registry/temporal-workers:latest
   ```

2. **Orchestration**: Use Kubernetes or similar for:
   - Automatic restarts
   - Horizontal scaling
   - Resource limits
   - Health checks
   - Secret management

3. **Monitoring**: Add logging and monitoring solutions to track worker performance

4. **Security**: 
   - Use Docker secrets or external secret management
   - Regularly update base images
   - Scan images for vulnerabilities

## License

[Your License Here]
