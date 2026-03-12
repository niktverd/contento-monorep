#!/bin/bash
set -euo pipefail

# PostgreSQL daily backup script with 7-day retention
# Usage: Run as cron job inside postgres container or as docker exec command
# Example cron: 0 2 * * * /backup.sh >> /var/log/backup.log 2>&1

# Configuration from environment variables (set by docker-compose)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-temporal}"
DB_USER="${POSTGRES_USER:-temporal}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/postgres_backup_${TIMESTAMP}.sql"

echo "$(date): Starting PostgreSQL backup..."

# Create backup using pg_dump
# --clean: add DROP statements before CREATE
# --if-exists: use IF EXISTS with DROP statements
# --no-owner: skip ownership commands
# --no-privileges: skip privilege commands (ACL)
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  > "$BACKUP_FILE"

# Compress the backup to save space
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "$(date): Backup created: $BACKUP_FILE"

# Check backup file size (should be > 0)
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
if [ "$BACKUP_SIZE" -eq 0 ]; then
  echo "$(date): ERROR: Backup file is empty!"
  exit 1
fi

echo "$(date): Backup size: $(numfmt --to=iec $BACKUP_SIZE)"

# Remove backups older than retention period
echo "$(date): Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "$(date): Current backups:"
find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -exec ls -lh {} \;

echo "$(date): Backup completed successfully" 