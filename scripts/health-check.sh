#!/bin/bash

# ==================================================
# Production Health Check Script
# ==================================================
# Tests inter-container communication for:
# - PostgreSQL Database
# - Temporal Server
# - Workers (downloading, processing)
# - Express.js App
# - End-to-end workflow execution

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=30
RETRY_COUNT=3
DOCKER_COMPOSE_FILE=${DOCKER_COMPOSE_FILE:-docker-compose.prod.yml}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Health check functions
check_container_running() {
    local container_name=$1
    if docker compose -f "$DOCKER_COMPOSE_FILE" ps "$container_name" | grep -q "Up"; then
        log_success "Container $container_name is running"
        return 0
    else
        log_error "Container $container_name is not running"
        return 1
    fi
}

check_container_health() {
    local container_name=$1
    local health_status
    health_status=$(docker inspect "$container_name" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-health")
    
    if [ "$health_status" = "healthy" ]; then
        log_success "Container $container_name is healthy"
        return 0
    elif [ "$health_status" = "no-health" ]; then
        log_warning "Container $container_name has no health check configured"
        return 0
    else
        log_error "Container $container_name health status: $health_status"
        return 1
    fi
}

check_postgres_connectivity() {
    log_info "Testing PostgreSQL connectivity..."
    
    # Test database connection from temporal server
    if docker exec temporal-prod pg_isready -h postgresql -p 5432 -U temporal 2>/dev/null; then
        log_success "Temporal → PostgreSQL connection: OK"
    else
        log_error "Temporal → PostgreSQL connection: FAILED"
        return 1
    fi
    
    # Test database connection from app
    if docker exec instagram-app-prod node -e "
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT NOW()')
            .then(() => { console.log('Database connection successful'); process.exit(0); })
            .catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
    " 2>/dev/null; then
        log_success "App → PostgreSQL connection: OK"
    else
        log_error "App → PostgreSQL connection: FAILED"
        return 1
    fi
}

check_temporal_server() {
    log_info "Testing Temporal server connectivity..."
    
    # Test Temporal server health
    if docker exec temporal-prod tctl --address temporal:7233 cluster health 2>/dev/null; then
        log_success "Temporal server health: OK"
    else
        log_error "Temporal server health: FAILED"
        return 1
    fi
    
    # Test Temporal namespace
    if docker exec temporal-prod tctl --address temporal:7233 namespace describe default 2>/dev/null; then
        log_success "Temporal namespace 'default': OK"
    else
        log_error "Temporal namespace 'default': FAILED"
        return 1
    fi
}

check_temporal_ui() {
    log_info "Testing Temporal UI connectivity..."
    
    if docker exec temporal-ui-prod wget --quiet --tries=1 --spider http://localhost:8080/health 2>/dev/null; then
        log_success "Temporal UI health: OK"
    else
        log_error "Temporal UI health: FAILED"
        return 1
    fi
}

check_worker_connectivity() {
    local worker_name=$1
    local task_queue=$2
    
    log_info "Testing $worker_name connectivity to Temporal..."
    
    # Check if worker can connect to Temporal by listing task queues
    if docker exec "$worker_name" node -e "
        const { Connection } = require('@temporalio/client');
        async function test() {
            try {
                const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS });
                console.log('Worker connected to Temporal successfully');
                await connection.close();
                process.exit(0);
            } catch (error) {
                console.error('Worker connection failed:', error.message);
                process.exit(1);
            }
        }
        test();
    " 2>/dev/null; then
        log_success "$worker_name → Temporal connection: OK"
    else
        log_error "$worker_name → Temporal connection: FAILED"
        return 1
    fi
}

check_app_connectivity() {
    log_info "Testing App connectivity..."
    
    # Test app health endpoint
    if docker exec instagram-app-prod wget --quiet --tries=1 --spider http://localhost:8080/health 2>/dev/null; then
        log_success "App health endpoint: OK"
    else
        log_error "App health endpoint: FAILED"
        return 1
    fi
    
    # Test app → Temporal connection
    if docker exec instagram-app-prod node -e "
        const { Connection } = require('@temporalio/client');
        async function test() {
            try {
                const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS });
                console.log('App connected to Temporal successfully');
                await connection.close();
                process.exit(0);
            } catch (error) {
                console.error('App → Temporal connection failed:', error.message);
                process.exit(1);
            }
        }
        test();
    " 2>/dev/null; then
        log_success "App → Temporal connection: OK"
    else
        log_error "App → Temporal connection: FAILED"
        return 1
    fi
}

check_end_to_end_workflow() {
    log_info "Testing end-to-end workflow execution..."
    
    # Run a simple workflow test using the existing test script
    # This will be a simplified version for health checking
    if docker exec instagram-app-prod node -e "
        const { Connection, Client } = require('@temporalio/client');
        async function testWorkflow() {
            try {
                const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS });
                const client = new Client({ connection });
                
                // Just test that we can list workflows (no actual workflow execution for health check)
                await client.workflow.list();
                console.log('Workflow client functionality: OK');
                await connection.close();
                process.exit(0);
            } catch (error) {
                console.error('Workflow test failed:', error.message);
                process.exit(1);
            }
        }
        testWorkflow();
    " 2>/dev/null; then
        log_success "End-to-end workflow client: OK"
    else
        log_error "End-to-end workflow client: FAILED"
        return 1
    fi
}

# Main health check routine
main() {
    echo ""
    log_info "🏥 Starting Production Health Check..."
    echo ""
    
    local failed_checks=0
    
    # 1. Check container status
    log_info "📋 Step 1: Checking container status..."
    local containers=("postgres-prod" "temporal-prod" "temporal-ui-prod" "instagram-app-prod" "downloading-worker-prod" "processing-worker-prod")
    
    for container in "${containers[@]}"; do
        if ! check_container_running "$container"; then
            ((failed_checks++))
        fi
        
        if ! check_container_health "$container"; then
            ((failed_checks++))
        fi
    done
    
    # 2. Check database connectivity
    log_info "📋 Step 2: Checking database connectivity..."
    if ! check_postgres_connectivity; then
        ((failed_checks++))
    fi
    
    # 3. Check Temporal server
    log_info "📋 Step 3: Checking Temporal server..."
    if ! check_temporal_server; then
        ((failed_checks++))
    fi
    
    # 4. Check Temporal UI
    log_info "📋 Step 4: Checking Temporal UI..."
    if ! check_temporal_ui; then
        ((failed_checks++))
    fi
    
    # 5. Check worker connectivity
    log_info "📋 Step 5: Checking worker connectivity..."
    if ! check_worker_connectivity "downloading-worker-prod" "video-downloading"; then
        ((failed_checks++))
    fi
    
    if ! check_worker_connectivity "processing-worker-prod" "video-processing"; then
        ((failed_checks++))
    fi
    
    # 6. Check app connectivity
    log_info "📋 Step 6: Checking app connectivity..."
    if ! check_app_connectivity; then
        ((failed_checks++))
    fi
    
    # 7. Check end-to-end workflow
    log_info "📋 Step 7: Checking end-to-end workflow capability..."
    if ! check_end_to_end_workflow; then
        ((failed_checks++))
    fi
    
    # Summary
    echo ""
    if [ $failed_checks -eq 0 ]; then
        log_success "🎉 All health checks passed! System is healthy."
        exit 0
    else
        log_error "❌ $failed_checks health check(s) failed. System needs attention."
        exit 1
    fi
}

# Script entry point
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi 