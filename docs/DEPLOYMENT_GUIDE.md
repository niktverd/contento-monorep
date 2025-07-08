# Deployment Troubleshooting Guide

## Common Database Connection Issues

### 1. ECONNREFUSED 127.0.0.1:5432 Error

**Symptoms:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
instagram-app-prod | Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Root Cause:**
The application is trying to connect to PostgreSQL on `localhost` instead of the Docker service name `postgresql`.

**Common Causes:**

1. `knexfile.js` is falling back to localhost defaults instead of using `DATABASE_URL` or `APP_DATABASE_URL`
2. Missing or incorrectly formatted environment variables
3. `POSTGRES_CONFIG` environment variable is not being provided as valid JSON

**Solutions:**

#### Check Environment Variables

```bash
# Inside app container, verify environment variables are set
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE_URL|APP_DATABASE_URL|POSTGRES)"

# Expected output should include:
# DATABASE_URL=postgresql://temporal:password@postgresql:5432/temporal
# APP_DATABASE_URL=postgresql://app_user:password@postgresql:5432/app_db
```

#### Verify knexfile.js Configuration

```bash
# Test knexfile connection logic
docker-compose -f docker-compose.prod.yml exec app node -e "
const knex = require('./dist/server/knexfile.js');
console.log('Knex config:', JSON.stringify(knex['server-production'], null, 2));
"
```

#### Check Container Network Connectivity

```bash
# Test network connectivity between containers
docker-compose -f docker-compose.prod.yml exec app nc -zv postgresql 5432

# Should output: postgresql:5432 (5432) open
```

### 2. Password Authentication Issues

**Symptoms:**

```
FATAL: password authentication failed for user "app_user"
FATAL: password authentication failed for user "temporal"
```

**Root Cause:**
Password mismatch between what's configured in init.sql and what's provided via environment variables.

**Solutions:**

#### Verify Password Substitution

```bash
# Check if PLACEHOLDER_APP_PASSWORD was replaced in init.sql
docker-compose -f docker-compose.prod.yml exec postgresql cat /docker-entrypoint-initdb.d/01-init.sql | grep PLACEHOLDER

# Should NOT contain PLACEHOLDER_APP_PASSWORD - if it does, substitution failed
```

#### Check GitHub Secrets Configuration

Ensure these secrets are set in GitHub repository settings:

- `POSTGRES_PASSWORD` - for Temporal user
- `APP_POSTGRES_PASSWORD` - for application user

#### Verify Password in Database

```bash
# Connect to PostgreSQL and check user exists
docker-compose -f docker-compose.prod.yml exec postgresql psql -U postgres -c "\du"

# Should show both 'temporal' and 'app_user' users
```

#### Test Direct Connection

```bash
# Test app_user connection
docker-compose -f docker-compose.prod.yml exec postgresql psql -U app_user -d app_db -c "SELECT current_user, current_database();"

# Test temporal user connection
docker-compose -f docker-compose.prod.yml exec postgresql psql -U temporal -d temporal -c "SELECT current_user, current_database();"
```

### 3. Migration Failures

**Symptoms:**

```
Migration failed: Error: connect ECONNREFUSED
knex migrate:latest failed
```

**Solutions:**

#### Check Migration Service Logs

```bash
# View migration container logs
docker-compose -f docker-compose.prod.yml logs migrations

# Check if migrations service completed successfully
docker-compose -f docker-compose.prod.yml ps migrations
```

#### Run Migrations Manually

```bash
# Run migrations manually to debug
docker-compose -f docker-compose.prod.yml exec app npx knex migrate:latest --env server-production --verbose

# Check current migration status
docker-compose -f docker-compose.prod.yml exec app npx knex migrate:status --env server-production
```

#### Verify Database Permissions

```bash
# Check if app_user can create tables in app_db
docker-compose -f docker-compose.prod.yml exec postgresql psql -U app_user -d app_db -c "
CREATE TABLE test_permissions (id SERIAL PRIMARY KEY);
DROP TABLE test_permissions;
SELECT 'Permissions OK' as status;
"
```

### 4. Service Startup Dependencies

**Symptoms:**

```
Failed to create worker after 10 attempts
temporal: connection refused
```

**Solutions:**

#### Check Service Health Status

```bash
# Check all service health
docker-compose -f docker-compose.prod.yml ps

# Wait for services to be healthy
docker-compose -f docker-compose.prod.yml exec temporal tctl --address temporal:7233 cluster health
```

#### Verify Service Dependencies

Ensure services start in correct order:

1. PostgreSQL (healthy)
2. Temporal (healthy)
3. Migrations (completed)
4. App & Workers (started)

```bash
# Check dependency order in docker-compose.prod.yml
grep -A 10 "depends_on:" docker-compose.prod.yml
```

### 5. Database Isolation Issues

**Symptoms:**

```
app_user can access temporal database (security violation)
Permission denied errors when accessing app_db
```

**Solutions:**

#### Run Isolation Verification

```bash
# Run the isolation verification script
docker-compose -f docker-compose.prod.yml exec app node dist/scripts/verify-db-isolation.js

# Should show:
# ✅ app_user cannot access temporal database (expected)
# ✅ app_user can access app_db database
```

#### Check Database Permissions

```bash
# Verify app_user permissions
docker-compose -f docker-compose.prod.yml exec postgresql psql -U postgres -c "
SELECT datname, has_database_privilege('app_user', datname, 'CONNECT') as can_connect
FROM pg_database
WHERE datname IN ('temporal', 'temporal_visibility', 'app_db');
"

# Expected output:
# temporal         | f (false)
# temporal_visibility | f (false)
# app_db          | t (true)
```

## Monitoring Recommendations

### Database Connection Monitoring

#### 1. Connection Pool Metrics

Monitor database connection pools for both databases to prevent exhaustion:

```bash
# Monitor active connections to PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgresql psql -U postgres -c "
SELECT
    datname,
    usename,
    count(*) as active_connections,
    state
FROM pg_stat_activity
WHERE datname IN ('temporal', 'temporal_visibility', 'app_db')
GROUP BY datname, usename, state
ORDER BY datname, active_connections DESC;
"
```

**Key Metrics to Track:**

- Active connections per database (temporal vs app_db)
- Connection pool utilization (should stay < 80%)
- Connection wait times
- Failed connection attempts

#### 2. Application-Level Database Health Checks

**For Application Database (app_db):**

```bash
# Health check endpoint that verifies app_db connectivity
curl -f http://localhost:8080/api/health/database

# Expected response:
# {
#   "database": "healthy",
#   "connection": "app_db@postgresql:5432",
#   "migration_version": "20252201120000",
#   "response_time_ms": 15
# }
```

**For Temporal Database:**

```bash
# Temporal health check via UI
curl -f http://localhost:8080/temporal/health

# Temporal CLI health check
docker-compose -f docker-compose.prod.yml exec temporal tctl --address temporal:7233 cluster health
```

#### 3. Database Performance Metrics

**Query Performance Monitoring:**

```sql
-- Monitor slow queries on app_db
SELECT
    query,
    mean_exec_time,
    calls,
    total_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'app_db')
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Database Size Monitoring:**

```sql
-- Monitor database sizes
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) as size,
    pg_database_size(datname) as size_bytes
FROM pg_database
WHERE datname IN ('temporal', 'temporal_visibility', 'app_db')
ORDER BY pg_database_size(datname) DESC;
```

#### 4. Alerting Thresholds

**Critical Alerts:**

- Database connection failures > 5% over 5 minutes
- Connection pool utilization > 90%
- Query response time > 1000ms average over 1 minute
- Database disk usage > 85%

**Warning Alerts:**

- Connection pool utilization > 75%
- Query response time > 500ms average over 5 minutes
- Database disk usage > 70%
- Failed authentication attempts > 10 over 1 minute

#### 5. Automated Monitoring Scripts

**Daily Health Report:**

```bash
#!/bin/bash
# scripts/daily-db-report.sh

echo "=== Daily Database Health Report $(date) ==="

echo "1. Connection Status:"
./scripts/verify-communication.ts

echo "2. Database Isolation:"
./scripts/verify-db-isolation.ts

echo "3. Database Sizes:"
docker-compose -f docker-compose.prod.yml exec postgresql psql -U postgres -c "
SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datname IN ('temporal', 'temporal_visibility', 'app_db');"

echo "4. Active Connections:"
docker-compose -f docker-compose.prod.yml exec postgresql psql -U postgres -c "
SELECT datname, count(*) as connections
FROM pg_stat_activity
WHERE datname IN ('temporal', 'temporal_visibility', 'app_db')
GROUP BY datname;"

echo "5. Migration Status:"
docker-compose -f docker-compose.prod.yml exec app npx knex migrate:status --env server-production
```

**Real-time Monitoring Dashboard:**

```bash
# scripts/monitor-dashboard.sh - Run in terminal for live monitoring
watch -n 30 '
echo "=== Database Connections ==="
docker-compose -f docker-compose.prod.yml exec postgresql psql -U postgres -c "
SELECT datname, usename, count(*) as connections, state
FROM pg_stat_activity
WHERE datname IN (\"temporal\", \"temporal_visibility\", \"app_db\")
GROUP BY datname, usename, state
ORDER BY datname, connections DESC;"

echo "=== Service Health ==="
docker-compose -f docker-compose.prod.yml ps

echo "=== Recent Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=5 app downloading-worker processing-worker
'
```

#### 6. Log-Based Monitoring

**Key Log Patterns to Monitor:**

**Application Startup Logs:**

```
[INFO] Connecting to application database: app_db@postgresql:5432
[INFO] Successfully connected to app_db
[INFO] Database schema version: 20252201120000
```

**Error Patterns to Alert On:**

```
ECONNREFUSED 127.0.0.1:5432
password authentication failed
Migration failed
Connection pool exhausted
Query timeout
```

**Temporal Worker Health:**

```
✅ Downloading worker started successfully
✅ Processing worker started successfully
❌ Failed to start worker after 10 attempts
```

#### 7. Grafana/Prometheus Integration

**Metrics to Expose:**

```javascript
// In application code - expose metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = {
    database_connections_active: getActiveConnections(),
    database_response_time_ms: getLastQueryTime(),
    migration_version: getCurrentMigrationVersion(),
    temporal_workers_active: getActiveWorkerCount(),
    database_errors_total: getDatabaseErrorCount(),
  };
  res.json(metrics);
});
```

**Recommended Dashboards:**

- Database connection pools (temporal vs app_db)
- Query performance trends
- Migration status timeline
- Worker connectivity status
- Error rate trends

## Quick Diagnostic Commands

```bash
# Full health check
./scripts/health-check.sh

# Database connection test
./scripts/verify-communication.ts

# Database isolation test
./scripts/verify-db-isolation.ts

# View all logs
docker-compose -f docker-compose.prod.yml logs --tail=100

# Check environment variables in all services
docker-compose -f docker-compose.prod.yml config | grep -E "(DATABASE_URL|POSTGRES)"
```

## Recovery Procedures

### Complete Reset

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove volumes (WARNING: destroys all data)
docker-compose -f docker-compose.prod.yml down -v

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Migration Reset

```bash
# Rollback last migration
docker-compose -f docker-compose.prod.yml exec app npx knex migrate:rollback --env server-production

# Re-run migrations
docker-compose -f docker-compose.prod.yml exec app npx knex migrate:latest --env server-production
```
