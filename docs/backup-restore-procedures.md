# Backup & Restore Procedures

This document outlines comprehensive backup and restore procedures for the Instagram Video Downloader production deployment.

## Overview

The backup strategy covers:

- PostgreSQL databases (application and Temporal data)
- SSL certificates and NGINX configuration
- Application configuration and environment files
- Docker volumes and persistent data

## PostgreSQL Database Backups

### Automated Daily Backups

The production deployment includes automated daily backups configured in `docker/postgres/backup.sh`:

```bash
# View backup configuration
cat docker/postgres/backup.sh

# Check backup status
docker compose -f docker-compose.prod.yml exec postgresql ls -la /var/lib/postgresql/backups/

# View backup logs
docker compose -f docker-compose.prod.yml logs postgresql | grep backup
```

### Manual Database Backup

Create a manual backup when needed:

```bash
# Full database backup
docker compose -f docker-compose.prod.yml exec postgresql pg_dumpall -U temporal > full-backup-$(date +%Y%m%d_%H%M%S).sql

# Application database only
docker compose -f docker-compose.prod.yml exec postgresql pg_dump -U temporal -d temporal -s app > app-backup-$(date +%Y%m%d_%H%M%S).sql

# Temporal database only
docker compose -f docker-compose.prod.yml exec postgresql pg_dump -U temporal -d temporal -s temporal > temporal-backup-$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker compose -f docker-compose.prod.yml exec postgresql pg_dumpall -U temporal | gzip > full-backup-$(date +%Y%m%d_%H%M%S).sql.gz
```

### Backup to External Storage

For production safety, copy backups to external storage:

```bash
# Example: Copy to AWS S3
aws s3 cp backup-file.sql.gz s3://your-backup-bucket/instagram-downloader/$(date +%Y/%m/%d)/

# Example: Copy to another server via rsync
rsync -avz backup-file.sql.gz user@backup-server:/path/to/backups/

# Example: Copy to Google Cloud Storage
gsutil cp backup-file.sql.gz gs://your-backup-bucket/instagram-downloader/$(date +%Y/%m/%d)/
```

## Database Restore Procedures

### Full System Restore

1. **Stop all services**:

   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

2. **Remove existing database volume** (⚠️ This will delete all data):

   ```bash
   docker volume rm instagram-video-downloader_postgres-data
   ```

3. **Start only PostgreSQL**:

   ```bash
   docker compose -f docker-compose.prod.yml up -d postgresql
   # Wait for database to be ready
   docker compose -f docker-compose.prod.yml exec postgresql pg_isready -U temporal
   ```

4. **Restore from backup**:

   ```bash
   # From full backup
   cat backup-file.sql | docker compose -f docker-compose.prod.yml exec -T postgresql psql -U temporal

   # From compressed backup
   gunzip -c backup-file.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgresql psql -U temporal
   ```

5. **Start remaining services**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### Selective Schema Restore

Restore only specific schemas without affecting others:

```bash
# Restore only application schema
docker compose -f docker-compose.prod.yml exec -T postgresql psql -U temporal -d temporal < app-schema-backup.sql

# Restore only Temporal schema
docker compose -f docker-compose.prod.yml exec -T postgresql psql -U temporal -d temporal < temporal-schema-backup.sql
```

### Point-in-Time Recovery

For critical data recovery, use PostgreSQL WAL (Write-Ahead Logging):

1. **Enable WAL archiving** (add to `docker/postgres/postgresql.conf`):

   ```conf
   wal_level = replica
   archive_mode = on
   archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
   ```

2. **Restore to specific point in time**:

   ```bash
   # Stop services
   docker compose -f docker-compose.prod.yml down

   # Restore base backup
   cat base-backup.sql | docker compose -f docker-compose.prod.yml exec -T postgresql psql -U temporal

   # Apply WAL files up to target time
   docker compose -f docker-compose.prod.yml exec postgresql pg_ctl -D /var/lib/postgresql/data recovery -t "2024-01-15 14:30:00"
   ```

## SSL Certificate Backup & Restore

### Backup SSL Certificates

```bash
# Create certificate backup
sudo tar -czf ssl-certs-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Copy to deployment directory
sudo cp ssl-certs-backup-*.tar.gz /opt/instagram-video-downloader/backups/

# Backup docker certificate volume
docker run --rm -v instagram-video-downloader_ssl-certs:/data -v $(pwd):/backup ubuntu tar czf /backup/ssl-certs-docker-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore SSL Certificates

```bash
# Restore from system backup
sudo tar -xzf ssl-certs-backup-*.tar.gz -C /

# Restore to docker volume
docker run --rm -v instagram-video-downloader_ssl-certs:/data -v $(pwd):/backup ubuntu tar xzf /backup/ssl-certs-docker-*.tar.gz -C /data

# Restart NGINX to use restored certificates
docker compose -f docker-compose.prod.yml restart nginx
```

### Certificate Renewal & Backup Automation

Add to crontab for automatic certificate management:

```bash
# Edit crontab
sudo crontab -e

# Add certificate renewal and backup (runs twice daily)
0 */12 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/* /opt/instagram-video-downloader/certs/ && docker compose -f /opt/instagram-video-downloader/docker-compose.prod.yml restart nginx

# Add certificate backup (runs weekly)
0 3 * * 0 tar -czf /opt/instagram-video-downloader/backups/ssl-certs-$(date +\%Y\%m\%d).tar.gz /etc/letsencrypt/
```

## Configuration Backup & Restore

### Backup Application Configuration

```bash
# Create configuration backup directory
mkdir -p /opt/instagram-video-downloader/backups/config

# Backup environment files
cp .env.production.local /opt/instagram-video-downloader/backups/config/env-production-$(date +%Y%m%d).backup

# Backup docker compose files
cp docker-compose.prod.yml /opt/instagram-video-downloader/backups/config/docker-compose-prod-$(date +%Y%m%d).yml

# Backup NGINX configuration
cp -r docker/nginx/ /opt/instagram-video-downloader/backups/config/nginx-$(date +%Y%m%d)/

# Backup service account files
cp -r config/ /opt/instagram-video-downloader/backups/config/service-accounts-$(date +%Y%m%d)/

# Create complete configuration archive
tar -czf /opt/instagram-video-downloader/backups/complete-config-$(date +%Y%m%d).tar.gz \
  .env.production.local \
  docker-compose.prod.yml \
  docker/ \
  config/ \
  scripts/
```

### Restore Configuration

```bash
# Restore from configuration archive
cd /opt/instagram-video-downloader
tar -xzf backups/complete-config-*.tar.gz

# Restore specific configuration files
cp backups/config/env-production-*.backup .env.production.local
cp backups/config/docker-compose-prod-*.yml docker-compose.prod.yml

# Restart services with restored configuration
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

## Docker Volume Backup & Restore

### Backup All Persistent Volumes

```bash
# List docker volumes
docker volume ls | grep instagram-video-downloader

# Backup PostgreSQL data volume
docker run --rm -v instagram-video-downloader_postgres-data:/data -v $(pwd)/backups:/backup ubuntu tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz -C /data .

# Backup SSL certificates volume
docker run --rm -v instagram-video-downloader_ssl-certs:/data -v $(pwd)/backups:/backup ubuntu tar czf /backup/ssl-certs-$(date +%Y%m%d).tar.gz -C /data .

# Backup NGINX logs volume (if configured)
docker run --rm -v instagram-video-downloader_nginx-logs:/data -v $(pwd)/backups:/backup ubuntu tar czf /backup/nginx-logs-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore Docker Volumes

```bash
# Stop services
docker compose -f docker-compose.prod.yml down

# Remove existing volumes (⚠️ This will delete all data)
docker volume rm instagram-video-downloader_postgres-data
docker volume rm instagram-video-downloader_ssl-certs

# Recreate and restore volumes
docker volume create instagram-video-downloader_postgres-data
docker volume create instagram-video-downloader_ssl-certs

docker run --rm -v instagram-video-downloader_postgres-data:/data -v $(pwd)/backups:/backup ubuntu tar xzf /backup/postgres-data-*.tar.gz -C /data
docker run --rm -v instagram-video-downloader_ssl-certs:/data -v $(pwd)/backups:/backup ubuntu tar xzf /backup/ssl-certs-*.tar.gz -C /data

# Start services
docker compose -f docker-compose.prod.yml up -d
```

## Automated Backup Script

Create a comprehensive backup script:

```bash
#!/bin/bash
# /opt/instagram-video-downloader/scripts/full-backup.sh

set -e

BACKUP_DIR="/opt/instagram-video-downloader/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "Starting full backup at $(date)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Backing up PostgreSQL..."
docker compose -f /opt/instagram-video-downloader/docker-compose.prod.yml exec -T postgresql pg_dumpall -U temporal | gzip > $BACKUP_DIR/database-$DATE.sql.gz

# Configuration backup
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config-$DATE.tar.gz \
  -C /opt/instagram-video-downloader \
  .env.production.local \
  docker-compose.prod.yml \
  docker/ \
  config/ \
  scripts/

# SSL certificates backup
echo "Backing up SSL certificates..."
tar -czf $BACKUP_DIR/ssl-certs-$DATE.tar.gz -C /etc/letsencrypt .

# Docker volumes backup
echo "Backing up Docker volumes..."
docker run --rm -v instagram-video-downloader_postgres-data:/data -v $BACKUP_DIR:/backup ubuntu tar czf /backup/volumes-postgres-$DATE.tar.gz -C /data .

# Cleanup old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)"
echo "Backup files stored in: $BACKUP_DIR"
ls -lah $BACKUP_DIR/*$DATE*
```

Make the script executable and add to crontab:

```bash
chmod +x /opt/instagram-video-downloader/scripts/full-backup.sh

# Add to crontab (daily backup at 2 AM)
echo "0 2 * * * /opt/instagram-video-downloader/scripts/full-backup.sh >> /var/log/backup.log 2>&1" | sudo crontab -
```

## Disaster Recovery Procedures

### Complete System Recovery

1. **Prepare new server** with same specifications
2. **Install Docker and dependencies**
3. **Clone repository** and configure environment
4. **Restore backups** in this order:

   ```bash
   # Restore configuration
   tar -xzf config-backup.tar.gz

   # Restore SSL certificates
   tar -xzf ssl-certs-backup.tar.gz -C /etc/letsencrypt/

   # Start PostgreSQL only
   docker compose -f docker-compose.prod.yml up -d postgresql

   # Restore database
   gunzip -c database-backup.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgresql psql -U temporal

   # Start all services
   docker compose -f docker-compose.prod.yml up -d
   ```

### Migration to New Server

1. **Backup current system** using full backup script
2. **Set up new server** with updated specifications
3. **Transfer backup files** to new server
4. **Restore and verify** all services
5. **Update DNS** to point to new server
6. **Monitor** for any issues

## Backup Verification

Regularly test backup integrity:

```bash
#!/bin/bash
# scripts/verify-backup.sh

# Test database backup integrity
echo "Testing database backup..."
gunzip -t database-backup.sql.gz && echo "✓ Database backup is valid" || echo "✗ Database backup is corrupted"

# Test configuration archive
echo "Testing configuration backup..."
tar -tzf config-backup.tar.gz > /dev/null && echo "✓ Configuration backup is valid" || echo "✗ Configuration backup is corrupted"

# Test SSL certificate backup
echo "Testing SSL backup..."
tar -tzf ssl-certs-backup.tar.gz > /dev/null && echo "✓ SSL backup is valid" || echo "✗ SSL backup is corrupted"

echo "Backup verification completed"
```

## Recovery Testing

Perform quarterly recovery testing:

1. **Set up test environment** identical to production
2. **Restore from backups** using documented procedures
3. **Verify all services** are functioning correctly
4. **Test application functionality** end-to-end
5. **Document any issues** and update procedures
6. **Time the recovery process** for RTO planning

## Monitoring & Alerts

Set up monitoring for backup processes:

```bash
# Add to monitoring script
#!/bin/bash
# Check if backup completed successfully today
BACKUP_DIR="/opt/instagram-video-downloader/backups"
TODAY=$(date +%Y%m%d)

if ls $BACKUP_DIR/*$TODAY* > /dev/null 2>&1; then
  echo "✓ Today's backup exists"
else
  echo "✗ Today's backup missing - ALERT!"
  # Send notification (email, Slack, etc.)
fi

# Check backup file sizes
for file in $BACKUP_DIR/*$TODAY*; do
  if [ -f "$file" ]; then
    size=$(stat -c%s "$file")
    if [ $size -lt 1000000 ]; then  # Less than 1MB
      echo "⚠ Backup file $file seems too small ($size bytes)"
    fi
  fi
done
```

This comprehensive backup and restore strategy ensures data protection and quick recovery in case of system failures or disasters.
