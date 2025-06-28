# Temporal Production Deployment Guide

## Overview

This guide covers the production deployment and monitoring of Temporal workflows for the Instagram Video Downloader application.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Express App    │    │ Temporal Worker │    │ Temporal Server │
│  (API Server)   │◄──►│   (Activities)  │◄──►│   (Workflows)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Database     │    │  File Storage   │    │   Monitoring    │
│   (Postgres)    │    │  (Firebase)     │    │ (Prometheus)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### System Requirements

- Node.js 18+ with TypeScript support
- Temporal Server (self-hosted or Temporal Cloud)
- PostgreSQL database
- Redis (for session/cache if needed)
- Process manager (PM2, systemd, or Docker)

### Dependencies

- All Temporal packages already installed via `npm install`
- Production environment variables configured

## Configuration

### 1. Environment Variables

Copy and configure Temporal environment variables:

```bash
# Copy the template
cp temporal.env.example .env.temporal

# Edit with your production values
nano .env.temporal
```

Key production settings:

```bash
# Connection
TEMPORAL_ADDRESS=your-temporal-server:7233
TEMPORAL_NAMESPACE=production
TEMPORAL_TASK_QUEUE=video-processing-prod

# TLS Security (recommended)
TEMPORAL_TLS_ENABLED=true
TEMPORAL_TLS_CERT_PATH=/path/to/temporal.crt
TEMPORAL_TLS_KEY_PATH=/path/to/temporal.key

# Resource limits
TEMPORAL_WORKER_MAX_CONCURRENT_ACTIVITIES=10
TEMPORAL_WORKER_MAX_CONCURRENT_WORKFLOWS=100

# Monitoring
TEMPORAL_METRICS_ENABLED=true
TEMPORAL_HEALTH_CHECK_PORT=8080
```

### 2. Temporal Server Setup

#### Option A: Temporal Cloud (Recommended)

1. Sign up at [cloud.temporal.io](https://cloud.temporal.io)
2. Create namespace and download certificates
3. Configure connection settings

#### Option B: Self-Hosted

```bash
# Using Docker Compose
git clone https://github.com/temporalio/docker-compose.git temporal
cd temporal
docker-compose up -d

# Or using Temporal CLI
temporal server start-dev --db-filename temporal.db
```

## Deployment

### 1. Build Application

```bash
# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Run tests to verify
npm run test:temporal
```

### 2. Start Worker Process

#### Option A: Using PM2 (Recommended)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'temporal-worker',
      script: 'tsx',
      args: 'scripts/start-worker.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TEMPORAL_LOG_LEVEL: 'info',
      },
      env_file: '.env.temporal',
      log_file: 'logs/temporal-worker.log',
      error_file: 'logs/temporal-worker-error.log',
      out_file: 'logs/temporal-worker-out.log',
      log_type: 'json',
      merge_logs: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'express-api',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
    },
  ],
};
```

Start services:

```bash
# Start both API and Worker
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs temporal-worker
```

#### Option B: Using systemd

Create `/etc/systemd/system/temporal-worker.service`:

```ini
[Unit]
Description=Temporal Worker for Video Processing
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/opt/instagram-video-downloader
Environment=NODE_ENV=production
EnvironmentFile=/opt/instagram-video-downloader/.env.temporal
ExecStart=/usr/bin/tsx scripts/start-worker.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable temporal-worker
sudo systemctl start temporal-worker
sudo systemctl status temporal-worker
```

#### Option C: Using Docker

Create `Dockerfile.worker`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 8080 9090
CMD ["tsx", "scripts/start-worker.ts"]
```

Build and run:

```bash
# Build image
docker build -f Dockerfile.worker -t temporal-worker .

# Run container
docker run -d \
  --name temporal-worker \
  --env-file .env.temporal \
  -p 8080:8080 -p 9090:9090 \
  temporal-worker
```

### 3. Start API Server

The main Express application should also be running to handle API requests:

```bash
# Using PM2 (from ecosystem.config.js above)
pm2 start express-api

# Or directly
npm start
```

## Monitoring

### 1. Health Checks

The worker exposes health check endpoints:

```bash
# Worker health
curl http://localhost:8080/health

# Basic metrics
curl http://localhost:8080/metrics
```

### 2. Temporal UI

Access Temporal Web UI:

- Local: http://localhost:8080 (if using Temporal Server)
- Cloud: https://cloud.temporal.io

### 3. Prometheus Metrics

Configure Prometheus to scrape metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'temporal-worker'
    static_configs:
      - targets: ['localhost:9090']
```

### 4. Grafana Dashboard

Import Temporal Grafana dashboard:

1. Download from [Temporal Community](https://github.com/temporalio/dashboards)
2. Import into Grafana
3. Configure data source

### 5. Alerting

Set up alerts for:

```yaml
# Example alerts
groups:
  - name: temporal-worker
    rules:
      - alert: TemporalWorkerDown
        expr: up{job="temporal-worker"} == 0
        for: 5m
        annotations:
          summary: 'Temporal Worker is down'

      - alert: HighActivityFailureRate
        expr: temporal_activity_failure_rate > 0.1
        for: 2m
        annotations:
          summary: 'High activity failure rate: {{ $value }}'

      - alert: WorkflowTimeout
        expr: temporal_workflow_timeout_count > 0
        annotations:
          summary: 'Workflow timeouts detected'
```

## Migration Strategy

### Phase 1: Parallel Deployment

1. Deploy Temporal infrastructure alongside existing Pub/Sub
2. Configure feature flag: `TEMPORAL_ENABLE_CRON_MIGRATION=false`
3. Test with small percentage of traffic

### Phase 2: Gradual Migration

1. Enable Temporal for new workflows: `TEMPORAL_ENABLE_CRON_MIGRATION=true`
2. Monitor performance and error rates
3. Keep Pub/Sub as fallback: `TEMPORAL_PUBSUB_FALLBACK_ENABLED=true`

### Phase 3: Full Migration

1. Migrate all traffic to Temporal
2. Disable Pub/Sub fallback
3. Remove old Pub/Sub infrastructure

## Troubleshooting

### Common Issues

#### 1. Worker Connection Issues

```bash
# Check network connectivity
telnet your-temporal-server 7233

# Verify TLS certificates
openssl s_client -connect your-temporal-server:7233 -showcerts
```

#### 2. High Memory Usage

- Reduce concurrent activity limits
- Check for memory leaks in activities
- Monitor with: `ps aux | grep temporal-worker`

#### 3. Activity Timeouts

- Increase timeout values in configuration
- Add more heartbeat calls in long-running activities
- Scale worker instances horizontally

#### 4. Workflow Failures

- Check activity retry policies
- Review error logs in Temporal UI
- Verify database connectivity

### Debugging

Enable debug logging:

```bash
export TEMPORAL_LOG_LEVEL=debug
export TEMPORAL_DEBUG_MODE=true
```

View detailed logs:

```bash
# PM2 logs
pm2 logs temporal-worker --lines 100

# systemd logs
journalctl -u temporal-worker -f

# Docker logs
docker logs temporal-worker -f
```

## Performance Optimization

### 1. Worker Scaling

Scale based on queue length and processing time:

```bash
# Horizontal scaling with PM2
pm2 scale temporal-worker +2

# Or start multiple instances
for i in {1..3}; do
  pm2 start scripts/start-worker.ts --name "temporal-worker-$i"
done
```

### 2. Activity Optimization

- Use heartbeats for long-running activities
- Implement proper retry policies
- Optimize database queries
- Use connection pooling

### 3. Resource Monitoring

Monitor and adjust:

- CPU usage per worker
- Memory consumption
- Activity queue depth
- Workflow completion rates

## Security

### 1. Network Security

- Use TLS for all Temporal connections
- Restrict network access to Temporal ports
- Use VPN or private networks

### 2. Authentication

- Configure Temporal authentication
- Use service accounts for workers
- Rotate certificates regularly

### 3. Data Security

- Encrypt sensitive workflow data
- Use secure environment variable management
- Audit workflow access logs

## Backup and Recovery

### 1. Database Backups

- Regular PostgreSQL backups
- Test restore procedures
- Monitor backup success

### 2. Temporal State

- Temporal Server handles workflow state
- Ensure Temporal Server backups
- Test disaster recovery procedures

## Support and Maintenance

### Regular Tasks

- Monitor worker health
- Review error rates
- Update dependencies
- Rotate certificates
- Performance tuning

### Escalation Procedures

1. Check health endpoints
2. Review logs and metrics
3. Scale resources if needed
4. Contact Temporal support if using Cloud

## Additional Resources

- [Temporal Documentation](https://docs.temporal.io)
- [Production Deployment](https://docs.temporal.io/deployment)
- [Monitoring Guide](https://docs.temporal.io/monitoring)
- [Security Best Practices](https://docs.temporal.io/security)
