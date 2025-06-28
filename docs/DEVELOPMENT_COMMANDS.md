# Development Commands Reference

This document describes all available `make` commands for developing the Instagram Video Downloader with Temporal integration.

## Quick Start

```bash
# Show all available commands
make help

# Start full development stack with Temporal
make dev

# Start only application services (no Temporal)
make dev-app

# Stop all services
make stop
```

## Core Development Commands

### `make dev`

Starts the complete development stack including:

- Express.js API server
- Video downloading worker
- Video processing worker
- PostgreSQL database
- Temporal server
- Temporal Web UI

**Services available:**

- API: http://localhost:3030
- Temporal UI: http://localhost:8080

### `make dev-app`

Starts only the application services without Temporal stack:

- Express.js API server
- Video downloading worker
- Video processing worker

**Note:** Workers will need an external Temporal server. Set `TEMPORAL_ADDRESS=your-external-temporal:7233` before running.

### `make stop`

Stops all containers (both app and Temporal profile).

### `make restart`

Convenience command that stops and restarts the full development stack.

## Logging Commands

### `make logs`

Shows recent logs (last 100 lines) for all services.

### `make logs-app`

Shows logs only for application services (app, downloading-worker, processing-worker).

### `make logs-temporal`

Shows logs only for Temporal-related services (postgresql, temporal, temporal-ui).

### `make logs-follow`

Follow logs in real-time for all services. Press Ctrl+C to exit.

## Express.js Application Logs

### Viewing App-Specific Logs

```bash
# Show recent logs for Express.js app only
make logs | grep app_dev

# Get last 20 lines from app container
make logs | grep app_dev | tail -20

# Follow app logs in real-time
make logs-follow | grep app_dev
```

### Direct Container Log Access

```bash
# Using podman (if using podman)
podman logs app_dev
podman logs app_dev --tail 50
podman logs app_dev -f  # follow mode

# Using docker (if using docker)
docker logs app_dev
docker logs app_dev --tail 50
docker logs app_dev -f  # follow mode
```

### Debugging API Requests

Express.js logs include detailed request/response information:

```bash
# Monitor API requests in real-time
make logs-follow | grep -E "(GET|POST|PUT|DELETE|PATCH)"

# View recent API errors
make logs | grep -E "(ERROR|error)" | grep app_dev

# Check specific endpoint logs
make logs | grep app_dev | grep "get-accounts"
```

### Common Log Patterns

**Server startup:**

```
app_dev | Server listening on port 8080
```

**API requests:**

```
app_dev | GET /api/ui/get-accounts - 200 OK
app_dev | POST /api/ui/add-account - 201 Created
```

**Database connection:**

```
app_dev | 🐛 Knex environment: development
app_dev | 🐛 DB config: { host: 'temporal-postgresql-dev', ... }
```

**Errors:**

```
app_dev | ERROR anonymous process
app_dev |   Error in wrapper (ThrownError): Error description
app_dev |   { reqPath: '/endpoint', reqMethod: 'GET', ... }
```

### Filtering Logs by Severity

```bash
# Show only errors
make logs | grep app_dev | grep -i error

# Show warnings and errors
make logs | grep app_dev | grep -E "(WARN|ERROR|warn|error)"

# Show debug information
make logs | grep app_dev | grep -E "(DEBUG|🐛)"
```

### Troubleshooting Common Issues

**SSL Connection Issues:**

```bash
# Look for SSL-related errors
make logs | grep app_dev | grep -i "ssl\|certificate"
```

**Database Connection Problems:**

```bash
# Check database connection logs
make logs | grep app_dev | grep -E "(postgres|database|connection)"
```

**Port/Network Issues:**

```bash
# Check server startup and port binding
make logs | grep app_dev | grep -E "(listening|port|bind)"
```

### Log File Locations (Inside Container)

If you need to access logs directly inside the container:

```bash
# Open shell in app container
podman exec -it app_dev bash

# Application logs are typically in:
# - Console output (what you see in docker logs)
# - /app/logs/ (if file logging is configured)
# - /var/log/ (system logs)
```

## Maintenance Commands

### `make build`

Rebuilds all Docker images with `--no-cache` flag. Use when Dockerfile or dependencies change.

### `make clean`

Complete cleanup:

- Stops all containers
- Removes volumes (database data will be lost)
- Removes orphaned containers
- Prunes Docker system

⚠️ **Warning:** This will delete all PostgreSQL data.

### `make status`

Shows current status of all containers.

### `make health`

Comprehensive health check:

- Container status overview
- API health endpoint test
- Temporal UI health endpoint test

## Advanced Commands

### `make dev-build`

Convenience command that builds images and starts development stack.

### `make shell-app`

Opens an interactive bash shell inside the running app container.

### `make shell-temporal`

Opens an interactive bash shell inside the running Temporal container.

## Database Commands

### `make db-logs`

Shows PostgreSQL container logs.

### `make db-shell`

Opens PostgreSQL command line interface:

- User: `temporal`
- Database: `temporal`

## Testing Commands

### `make test-connectivity`

Tests network connectivity between services:

- App → Temporal server
- Workers → Temporal server

Useful for debugging network issues.

## Development Workflow Examples

### First-time setup

```bash
# Start full development stack
make dev

# Check that everything is running
make status
make health
```

### Daily development

```bash
# Start development stack
make dev

# Watch logs during development
make logs-follow

# When done for the day
make stop
```

### Troubleshooting

```bash
# Check what's running
make status

# Check service health
make health

# Test connectivity
make test-connectivity

# Clean restart if something is broken
make clean
make dev
```

### Working with external Temporal

```bash
# Set external Temporal address
export TEMPORAL_ADDRESS=staging-temporal.company.com:7233

# Start only app services
make dev-app

# Verify workers can connect
make test-connectivity
```

### Development with hot-reload

The development setup includes bind-mounts for hot-reload:

- Source code changes in `src/` are immediately available in containers
- No need to rebuild images for code changes
- Only rebuild with `make build` when dependencies change

## Environment Profiles

The docker-compose setup supports two modes:

**Full Stack Mode:**

```bash
make dev
# Equivalent to: docker compose --profile temporal up -d
```

**App-Only Mode:**

```bash
make dev-app
# Equivalent to: docker compose up app downloading-worker processing-worker -d
```

## Configuration Files

- **docker-compose.dev.yml** - Development services configuration
- **.env.development** - Development environment variables

## Next Steps

After development setup is complete, production deployment commands will be added to this Makefile for:

- `make prod-deploy`
- `make prod-logs`
- `make prod-health`

These will be available after completing the production deployment tasks.
