# Instagram Video Downloader

A service to download and process Instagram videos.

## Limitations

### IG caption

- If there are more than 20 hashtags in a caption, media will be published, but caption will be empty.

## Production Deployment (Hetzner/Self-Hosted)

### Architecture

The production deployment uses Docker Compose to orchestrate a multi-container Temporal stack:

- **PostgreSQL**: Database for both application and Temporal data
- **Temporal Server**: Workflow orchestration engine with 7-day retention
- **Temporal UI**: Web interface for workflow monitoring
- **Application**: Main API server (Node.js/Express)
- **Downloading Worker**: Handles video download workflows
- **Processing Worker**: Handles video processing workflows
- **NGINX**: Reverse proxy with SSL termination and basic auth

### Prerequisites

1. **Server Requirements**:

   - Ubuntu 20.04+ or similar Linux distribution
   - Minimum 64 GB RAM, 8 CPU cores
   - 500 GB SSD storage
   - Docker & Docker Compose v2+ installed

2. **Domain & SSL**:

   - Domain name pointed to your server
   - Let's Encrypt certificates (automated setup included)

3. **GitHub Secrets**: Configure secrets for CI/CD deployment (see `docs/github-secrets-setup.md`)

### Initial Server Setup

1. **Install Docker**:

   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

2. **Create deployment directory**:

   ```bash
   sudo mkdir -p /opt/instagram-video-downloader
   sudo chown $USER:$USER /opt/instagram-video-downloader
   cd /opt/instagram-video-downloader
   ```

3. **Clone repository**:
   ```bash
   git clone https://github.com/your-username/instagram-video-downloader.git .
   ```

### Environment Configuration

1. **Copy and configure environment file**:

   ```bash
   cp .env.production .env.production.local
   ```

2. **Edit critical variables**:

   ```bash
   nano .env.production.local
   ```

   Key variables to configure:

   - `POSTGRES_PASSWORD`: Strong database password
   - `TEMPORAL_UI_PASSWORD`: Password for Temporal UI access
   - `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_ACCESS_TOKEN`
   - `FIREBASE_CONFIG`: Firebase configuration JSON
   - `GCP_PROJECT_ID`, `GCP_SERVICE_ACCOUNT_KEY_PATH`

### SSL Certificates Setup

1. **Generate Let's Encrypt certificates**:

   ```bash
   # Install certbot
   sudo apt update && sudo apt install -y certbot

   # Generate certificates
   sudo certbot certonly --standalone \
     -d your-domain.com \
     --email your-email@example.com \
     --agree-tos \
     --non-interactive
   ```

2. **Copy certificates to docker volume**:
   ```bash
   sudo mkdir -p /opt/instagram-video-downloader/certs
   sudo cp /etc/letsencrypt/live/your-domain.com/* /opt/instagram-video-downloader/certs/
   sudo chown -R $USER:$USER /opt/instagram-video-downloader/certs
   ```

### Deployment

1. **Build production images**:

   ```bash
   docker build -f Dockerfile.prod -t instagram-video-downloader:latest .
   ```

2. **Start the stack**:

   ```bash
   # Start database first
   docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d postgresql

   # Wait for database to be ready
   docker compose -f docker-compose.prod.yml --env-file .env.production.local exec postgresql pg_isready -U temporal

   # Start Temporal services
   docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d temporal temporal-ui

   # Start application and workers
   docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d app downloading-worker processing-worker

   # Start NGINX proxy
   docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d nginx
   ```

3. **Verify deployment**:

   ```bash
   # Run health checks
   ./scripts/health-check.sh

   # Check container status
   docker compose -f docker-compose.prod.yml ps
   ```

### CI/CD Deployment

For automated deployments, use the GitHub Actions workflow:

1. Configure GitHub repository secrets (see `docs/github-secrets-setup.md`)
2. Push to `main` branch or manually trigger workflow
3. The workflow will:
   - Build and push Docker images to GitHub Container Registry
   - Deploy to production server via SSH
   - Run health checks and communication verification
   - Test staging environment before production (if configured)

### Monitoring & Access

- **Application API**: `https://your-domain.com`
- **Temporal UI**: `https://your-domain.com/temporal` (requires basic auth)
- **Health endpoint**: `https://your-domain.com/health`
- **Metrics**: `https://your-domain.com/metrics`

### Backup & Restore

Daily automated backups are configured for PostgreSQL:

```bash
# Manual backup
docker compose -f docker-compose.prod.yml exec postgresql /docker-entrypoint-initdb.d/backup.sh

# View backup files
ls -la docker/postgres/backups/

# Restore from backup
docker compose -f docker-compose.prod.yml exec postgresql psql -U temporal -d temporal < /path/to/backup.sql
```

### Troubleshooting

#### Container Health Issues

1. **Check container status**:

   ```bash
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs [service-name]
   ```

2. **Common issues**:
   - **Database connection failures**: Check `POSTGRES_PASSWORD` and network connectivity
   - **Temporal startup issues**: Ensure PostgreSQL is healthy before starting Temporal
   - **Worker connection issues**: Verify `TEMPORAL_ADDRESS` is correct
   - **NGINX SSL issues**: Check certificate paths and domain configuration

#### Resource Monitoring

```bash
# Container resource usage
docker stats

# System resources
htop
df -h
free -h

# Check specific container logs
docker logs -f [container-name]
```

#### Network Connectivity

```bash
# Test internal service connectivity
docker compose -f docker-compose.prod.yml exec app npm run tsx scripts/verify-communication.ts

# Test external endpoints
curl -k https://your-domain.com/health
curl -k https://your-domain.com/metrics
```

#### Performance Issues

1. **High memory usage**: Check worker concurrency settings in `.env.production.local`
2. **Slow API responses**: Monitor application logs and database performance
3. **Worker queue backlog**: Check Temporal UI for workflow status and adjust worker resources

#### SSL Certificate Renewal

```bash
# Renew certificates
sudo certbot renew --quiet

# Update docker volumes (add to crontab)
sudo cp /etc/letsencrypt/live/your-domain.com/* /opt/instagram-video-downloader/certs/
docker compose -f docker-compose.prod.yml restart nginx
```

#### Database Issues

```bash
# Check database connectivity
docker compose -f docker-compose.prod.yml exec postgresql pg_isready -U temporal

# Access database shell
docker compose -f docker-compose.prod.yml exec postgresql psql -U temporal -d temporal

# View database logs
docker compose -f docker-compose.prod.yml logs postgresql
```

### Security Considerations

1. **Firewall configuration**: Only expose ports 80/443, block direct access to other services
2. **Regular updates**: Keep Docker images and host system updated
3. **Secret management**: Never commit secrets to version control
4. **Access control**: Use strong passwords for database and Temporal UI
5. **Monitoring**: Set up log aggregation and alerting for production issues

### Scaling

For high-traffic deployments:

1. **Horizontal scaling**: Deploy multiple worker instances
2. **Database optimization**: Consider read replicas or connection pooling
3. **Load balancing**: Use multiple application server instances behind a load balancer
4. **Monitoring**: Implement comprehensive metrics and alerting

## Deployment to Google Cloud Run

### Prerequisites

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Create a Google Cloud Project
3. Enable the Cloud Run API, Cloud Build API, and Container Registry API

### Setup Environment Variables

Set up your environment variables in the Google Cloud Console. Go to Cloud Run > Your Service > Edit & Deploy New Revision > Variables.

Required environment variables (see .env.example for a complete list):

- INSTAGRAM_APP_ID
- INSTAGRAM_APP_SECRET
- INSTAGRAM_ACCESS_TOKEN
- FIREBASE_CONFIG
- PORT (will be set automatically by Cloud Run)

### Manual Deployment

1. Build the Docker image:

   ```
   docker build -t gcr.io/[PROJECT_ID]/instagram-video-downloader .
   ```

2. Push to Google Container Registry:

   ```
   docker push gcr.io/[PROJECT_ID]/instagram-video-downloader
   ```

3. Deploy to Cloud Run:
   ```
   gcloud run deploy instagram-video-downloader \
     --image gcr.io/[PROJECT_ID]/instagram-video-downloader \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Automated Deployment with Cloud Build

1. Connect your GitHub repository to Cloud Build
2. Create a build trigger that uses the cloudbuild.yaml configuration

Cloud Build will automatically build and deploy your application whenever you push to your repository.

### Automated Deployment with GitHub Actions

This project includes a GitHub Actions workflow for automatic deployment to Google Cloud Run when you push to the main branch.

To set up GitHub Actions deployment:

1. Configure the required GitHub repository secrets - see [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for detailed instructions
2. Push your code to the main branch
3. The workflow will automatically build and deploy your application to Google Cloud Run

You can also manually trigger deployments using the "Run workflow" button in the GitHub Actions tab.

### Local Testing

To test the Docker container locally before deployment:

```
npm run docker:test
```

This will build and run the Docker container, making it available at http://localhost:8080.

## Finding Unused Code with Knip

This project uses [knip](https://github.com/webpro/knip), a tool for finding unused code in JavaScript/TypeScript projects.

### Available Scripts

```bash
# Run a full knip analysis
npm run knip

# Show a more compact report
npm run knip:unused

# Check only for unused files
npm run knip:files

# Check only for unused dependencies
npm run knip:deps

# Check only for unused exports
npm run knip:exports

# Check only for unused types
npm run knip:types

# Fix automatically removable issues
npm run knip:fix

# Trace exports in a specific file
npm run knip:trace-file src/path/to/your/file.ts
```

### Pre-commit Hook

This project has a Git pre-commit hook that automatically runs knip before each commit. If new unused code issues are detected, the commit will be blocked until they are fixed.

To bypass the hook in emergency situations:

```bash
git commit --no-verify
```

Check the [report/README.md](./report/README.md) file for more details about the knip integration.

### Identified Unused Code

A list of unused code identified by knip is maintained in [UNUSED_CODE.md](./UNUSED_CODE.md).

## Dependency Analysis with dependency-cruiser

[dependency-cruiser](https://github.com/sverweij/dependency-cruiser) is a powerful tool for visualizing and validating dependencies in JavaScript/TypeScript projects.

### Installation

Install as a dev dependency (recommended):

```bash
npm install --save-dev dependency-cruiser
```

If you encounter TypeScript version conflicts (like peer dependency issues between knip and dependency-cruiser), use one of these approaches:

```bash
# Option 1: Force install with legacy peer deps
npm install --save-dev dependency-cruiser --legacy-peer-deps

# Option 2: Force install
npm install --save-dev dependency-cruiser --force
```

### Setup

Initialize a configuration file:

```bash
npx dependency-cruiser --init
```

This creates a `.dependency-cruiser.js` file with default rules.

### Usage

Generate a dependency graph:

```bash
npx depcruise --include-only "^src" --output-type dot src | dot -T svg > dependency-graph.svg
```

Validate dependencies against rules:

```bash
npx depcruise --validate src
```

### Adding to package.json

```json
"scripts": {
  "deps:cruise": "depcruise --include-only \"^src\" --output-type dot src | dot -T svg > dependency-graph.svg",
  "deps:validate": "depcruise --validate src"
}
```

### Configuration

The `.dependency-cruiser.js` file can be customized to:

- Forbid circular dependencies
- Enforce architecture boundaries
- Prevent dependency on deprecated modules
- Restrict dependency reach
- And much more

Example rule to forbid circular dependencies:

```javascript
forbidden: [
  {
    name: 'no-circular',
    severity: 'error',
    comment: 'Circular dependencies are harmful',
    from: {},
    to: {
      circular: true,
    },
  },
];
```

dependency-cruiser helps maintain a clean architecture and prevents dependency issues before they grow into larger problems.

# VideoPipeline: Множественные входы и concat

## Основные изменения

- Теперь VideoPipeline работает с массивом входных файлов: `inputs: string[]`.
- Конкатенация (concat) возможна только к master-пайплайну (по умолчанию любой созданный VideoPipeline — master).
- Все фильтры (makeItRed, rotate и т.д.) и concat можно вызывать цепочкой.
- Метод run поддерживает как один, так и несколько входов.

## Пример использования

```ts
import {VideoPipeline} from 'src/sections/cloud-run/components/video/primitives-optimized';

const p1 = new VideoPipeline();
await p1.init('video1.mp4');
const p2 = new VideoPipeline();
await p2.init('video2.mp4');

// Конкатенация и фильтры
p1.concat(p2).makeItRed().rotate(90);
await p1.run('output.mp4');
```

- Если вызвать concat на не-мастер пайплайне — будет выброшена ошибка.
- После concat можно применять любые фильтры к итоговому видео.
- run создаёт итоговый файл с учётом всех входов и фильтров.

## Тесты

См. `src/tests/optimized-primitives-demo.test.ts` для примеров тестов на concat, фильтры и работу с несколькими входами.

## Environment variables

The environment variables are managed through a `.env` file. You can create a copy of the `.env.example` file and name it `.env`.

## Local Development

### Prerequisites

- Docker or Podman with Docker Compose v2+
- make (GNU make)

### Full stack (API + Temporal)

```bash
make dev
```

• API → http://localhost:3030  
• Temporal UI → http://localhost:8080

### App-only mode (external Temporal)

```bash
export TEMPORAL_ADDRESS=your-temporal-host:7233
make dev-app
```

### Useful helpers

```bash
make stop          # stop all containers
make logs          # last 100 log lines from every service
make logs-follow   # follow logs live
make health        # basic health checks
```

The full set of developer commands is documented in `docs/DEVELOPMENT_COMMANDS.md`.

---

## Testing
