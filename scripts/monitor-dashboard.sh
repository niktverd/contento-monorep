#!/bin/bash

# Real-time Database Monitoring Dashboard
# Usage: ./scripts/monitor-dashboard.sh
# Press Ctrl+C to exit

echo "Starting real-time database monitoring dashboard..."
echo "Press Ctrl+C to exit"
echo ""

# Function to display monitoring info
show_dashboard() {
    clear
    echo "=== Database Monitoring Dashboard - $(date) ==="
    echo ""
    
    echo "=== Database Connections ==="
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
    ORDER BY datname, connections DESC;" 2>/dev/null || echo "❌ PostgreSQL not available"
    echo ""
    
    echo "=== Service Health ==="
    docker-compose -f docker-compose.prod.yml ps | head -20
    echo ""
    
    echo "=== Database Sizes ==="
    docker-compose -f docker-compose.prod.yml exec -T postgresql psql -U postgres -c "
    SELECT 
        datname,
        pg_size_pretty(pg_database_size(datname)) as size
    FROM pg_database 
    WHERE datname IN ('temporal', 'temporal_visibility', 'app_db')
    ORDER BY pg_database_size(datname) DESC;" 2>/dev/null || echo "❌ Could not get database sizes"
    echo ""
    
    echo "=== Recent Logs (last 3 lines per service) ==="
    echo "--- App ---"
    docker-compose -f docker-compose.prod.yml logs --tail=3 app 2>/dev/null | tail -3 || echo "No app logs"
    echo "--- Downloading Worker ---"
    docker-compose -f docker-compose.prod.yml logs --tail=3 downloading-worker 2>/dev/null | tail -3 || echo "No downloading-worker logs"
    echo "--- Processing Worker ---"
    docker-compose -f docker-compose.prod.yml logs --tail=3 processing-worker 2>/dev/null | tail -3 || echo "No processing-worker logs"
    echo ""
    
    echo "=== Resource Usage ==="
    echo "PostgreSQL disk usage:"
    docker-compose -f docker-compose.prod.yml exec -T postgresql df -h /var/lib/postgresql/data 2>/dev/null | tail -1 || echo "❌ Could not check disk usage"
    echo ""
    
    echo "=== Quick Health Check ==="
    # Test app database connection
    if docker-compose -f docker-compose.prod.yml exec -T postgresql psql -U app_user -d app_db -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ App database (app_db) connection: OK"
    else
        echo "❌ App database (app_db) connection: FAILED"
    fi
    
    # Test temporal database connection
    if docker-compose -f docker-compose.prod.yml exec -T postgresql psql -U temporal -d temporal -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Temporal database connection: OK"
    else
        echo "❌ Temporal database connection: FAILED"
    fi
    
    # Test Temporal server health
    if docker-compose -f docker-compose.prod.yml exec -T temporal tctl --address temporal:7233 cluster health >/dev/null 2>&1; then
        echo "✅ Temporal server: OK"
    else
        echo "❌ Temporal server: FAILED"
    fi
    
    echo ""
    echo "Last update: $(date) | Auto-refresh every 30 seconds"
    echo "Press Ctrl+C to exit"
}

# Run dashboard with auto-refresh
while true; do
    show_dashboard
    sleep 30
done 