#!/bin/bash

# Daily Database Health Report Script
# Usage: ./scripts/daily-db-report.sh

set -e

echo "=== Daily Database Health Report $(date) ==="
echo ""

echo "1. Connection Status:"
echo "===================="
if [ -f "./scripts/verify-communication.ts" ]; then
    npm run tsx ./scripts/verify-communication.ts || echo "❌ Communication verification failed"
else
    echo "⚠️ verify-communication.ts not found"
fi
echo ""

echo "2. Database Isolation:"
echo "====================="
if [ -f "./scripts/verify-db-isolation.ts" ]; then
    npm run tsx ./scripts/verify-db-isolation.ts || echo "❌ Database isolation check failed"
else
    echo "⚠️ verify-db-isolation.ts not found"
fi
echo ""

echo "3. Database Sizes:"
echo "=================="
docker-compose -f docker-compose.prod.yml exec -T postgresql psql -U postgres -c "
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size,
    pg_database_size(datname) as size_bytes
FROM pg_database 
WHERE datname IN ('temporal', 'temporal_visibility', 'app_db')
ORDER BY pg_database_size(datname) DESC;" 2>/dev/null || echo "❌ Could not connect to PostgreSQL"
echo ""

echo "4. Active Connections:"
echo "====================="
docker-compose -f docker-compose.prod.yml exec -T postgresql psql -U postgres -c "
SELECT 
    datname,
    usename,
    count(*) as connections,
    state
FROM pg_stat_activity 
WHERE datname IN ('temporal', 'temporal_visibility', 'app_db')
  AND state IS NOT NULL
GROUP BY datname, usename, state
ORDER BY datname, connections DESC;" 2>/dev/null || echo "❌ Could not query active connections"
echo ""

echo "5. Migration Status:"
echo "==================="
if docker-compose -f docker-compose.prod.yml exec -T app npx knex migrate:status --env server-production 2>/dev/null; then
    echo "✅ Migration status retrieved"
else
    echo "❌ Could not get migration status"
fi
echo ""

echo "6. Service Health:"
echo "=================="
docker-compose -f docker-compose.prod.yml ps
echo ""

echo "7. Recent Error Logs:"
echo "=====================" 
docker-compose -f docker-compose.prod.yml logs --tail=10 app downloading-worker processing-worker 2>/dev/null | grep -i error | tail -5 || echo "No recent errors found"
echo ""

echo "8. Disk Usage:"
echo "=============="
docker-compose -f docker-compose.prod.yml exec -T postgresql df -h /var/lib/postgresql/data 2>/dev/null || echo "❌ Could not check disk usage"
echo ""

echo "=== Report completed at $(date) ===" 