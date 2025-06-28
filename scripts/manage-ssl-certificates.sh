#!/bin/bash

# ===============================================
# SSL Certificate Management Script
# ===============================================
# Manual management operations for SSL certificates
# Usage: ./scripts/manage-ssl-certificates.sh [command] [options]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Help function
show_help() {
    echo "SSL Certificate Management"
    echo "=========================="
    echo ""
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  status           - Show certificate status and expiration"
    echo "  renew            - Force certificate renewal"
    echo "  test             - Test SSL configuration"
    echo "  logs             - Show certbot logs"
    echo "  restart-certbot  - Restart certbot service"
    echo "  backup           - Backup certificates"
    echo "  restore          - Restore certificates from backup"
    echo "  check-config     - Validate environment configuration"
    echo ""
    echo "Examples:"
    echo "  $0 status                    # Check certificate status"
    echo "  $0 renew                     # Force certificate renewal"
    echo "  $0 test https://example.com  # Test SSL configuration"
    echo "  $0 logs                      # View certbot logs"
    echo "  $0 backup /path/to/backup    # Backup certificates"
    echo ""
    echo "Environment Variables:"
    echo "  CERTBOT_DOMAIN - Domain name for certificates"
    echo "  CERTBOT_EMAIL  - Email for Let's Encrypt registration"
}

# Check if docker-compose is available
check_docker_compose() {
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose is not available"
        exit 1
    fi
}

# Get environment variables from .env.production
load_env_config() {
    local env_file="$PROJECT_ROOT/.env.production"
    
    if [[ -f "$env_file" ]]; then
        # Source the env file to get variables
        set -a
        source "$env_file"
        set +a
        log_info "Loaded configuration from $env_file"
    else
        log_warning "No .env.production file found, using defaults"
    fi
    
    # Set defaults if not already set
    export CERTBOT_DOMAIN="${CERTBOT_DOMAIN:-your-domain.com}"
    export CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@example.com}"
}

# Check certificate status
certificate_status() {
    log_info "Checking SSL certificate status..."
    
    local domain="${CERTBOT_DOMAIN:-your-domain.com}"
    
    # Check if certbot container is running
    if ! docker compose -f "$DOCKER_COMPOSE_FILE" ps certbot | grep -q "Up"; then
        log_warning "Certbot container is not running"
        log_info "Start it with: docker compose -f $DOCKER_COMPOSE_FILE up -d certbot"
        return 1
    fi
    
    # Check certificate files
    log_info "Certificate files for domain: $domain"
    docker compose -f "$DOCKER_COMPOSE_FILE" exec certbot \
        sh -c "
            if [ -f /etc/letsencrypt/live/$domain/fullchain.pem ]; then
                echo 'Certificate files found:'
                ls -la /etc/letsencrypt/live/$domain/
                echo ''
                echo 'Certificate details:'
                openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -text -noout | grep -A 2 'Validity'
                echo ''
                echo 'Certificate expiration:'
                openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -enddate -noout
            else
                echo 'No certificate files found for domain: $domain'
                exit 1
            fi
        "
    
    if [[ $? -eq 0 ]]; then
        log_success "Certificate status check completed"
    else
        log_error "Certificate files not found or inaccessible"
        return 1
    fi
}

# Force certificate renewal
force_renewal() {
    log_info "Forcing SSL certificate renewal..."
    
    local domain="${CERTBOT_DOMAIN:-your-domain.com}"
    local email="${CERTBOT_EMAIL:-admin@example.com}"
    
    if [[ "$domain" == "your-domain.com" || "$email" == "admin@example.com" ]]; then
        log_error "Please set CERTBOT_DOMAIN and CERTBOT_EMAIL environment variables"
        return 1
    fi
    
    log_info "Domain: $domain"
    log_info "Email: $email"
    
    # Run certbot renewal
    docker run --rm \
        -v letsencrypt-certs:/etc/letsencrypt \
        -v certbot-webroot:/var/www/certbot \
        certbot/certbot \
        certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        --force-renewal \
        --domains "$domain"
    
    if [[ $? -eq 0 ]]; then
        log_success "Certificate renewal completed"
        
        # Reload NGINX
        log_info "Reloading NGINX..."
        docker compose -f "$DOCKER_COMPOSE_FILE" exec nginx nginx -s reload
        log_success "NGINX reloaded"
    else
        log_error "Certificate renewal failed"
        return 1
    fi
}

# Test SSL configuration
test_ssl() {
    local url="${1:-}"
    
    if [[ -z "$url" ]]; then
        url="https://${CERTBOT_DOMAIN:-your-domain.com}"
    fi
    
    log_info "Testing SSL configuration for: $url"
    
    # Test HTTPS connection
    if command -v curl >/dev/null 2>&1; then
        log_info "Testing HTTPS connection..."
        if curl -s -I "$url" >/dev/null; then
            log_success "HTTPS connection successful"
        else
            log_error "HTTPS connection failed"
            return 1
        fi
        
        # Get certificate info
        log_info "Certificate information:"
        curl -s -I "$url" | grep -i "server\|date"
    else
        log_warning "curl not available for SSL testing"
    fi
    
    # Test with openssl
    if command -v openssl >/dev/null 2>&1; then
        local hostname
        hostname=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
        
        log_info "Testing SSL certificate with openssl..."
        echo | openssl s_client -servername "$hostname" -connect "$hostname:443" 2>/dev/null | \
            openssl x509 -noout -dates
    else
        log_warning "openssl not available for certificate testing"
    fi
}

# Show certbot logs
show_logs() {
    log_info "Showing certbot logs..."
    
    # Show container logs
    log_info "=== Container Logs ==="
    docker compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50 certbot
    
    # Show renewal daemon logs if available
    log_info ""
    log_info "=== Renewal Daemon Logs ==="
    if docker compose -f "$DOCKER_COMPOSE_FILE" exec certbot test -f /var/log/letsencrypt/renewal-daemon.log; then
        docker compose -f "$DOCKER_COMPOSE_FILE" exec certbot tail -n 50 /var/log/letsencrypt/renewal-daemon.log
    else
        log_info "No renewal daemon logs found"
    fi
    
    # Show letsencrypt logs if available
    log_info ""
    log_info "=== Let's Encrypt Logs ==="
    docker compose -f "$DOCKER_COMPOSE_FILE" exec certbot \
        sh -c "if [ -d /var/log/letsencrypt ]; then find /var/log/letsencrypt -name '*.log' -exec tail -n 10 {} \; 2>/dev/null || echo 'No Let'\''s Encrypt logs found'; else echo 'Log directory not found'; fi"
}

# Restart certbot service
restart_certbot() {
    log_info "Restarting certbot service..."
    
    docker compose -f "$DOCKER_COMPOSE_FILE" restart certbot
    
    # Wait for restart
    sleep 5
    
    # Check if it's running
    if docker compose -f "$DOCKER_COMPOSE_FILE" ps certbot | grep -q "Up"; then
        log_success "Certbot service restarted successfully"
    else
        log_error "Failed to restart certbot service"
        return 1
    fi
}

# Backup certificates
backup_certificates() {
    local backup_path="${1:-}"
    
    if [[ -z "$backup_path" ]]; then
        backup_path="$PROJECT_ROOT/ssl-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    fi
    
    log_info "Backing up certificates to: $backup_path"
    
    # Create backup
    docker run --rm \
        -v letsencrypt-certs:/etc/letsencrypt \
        -v "$(dirname "$backup_path"):/backup" \
        alpine:latest \
        tar czf "/backup/$(basename "$backup_path")" -C /etc/letsencrypt .
    
    if [[ $? -eq 0 ]]; then
        log_success "Certificates backed up successfully"
        log_info "Backup location: $backup_path"
    else
        log_error "Certificate backup failed"
        return 1
    fi
}

# Restore certificates
restore_certificates() {
    local backup_path="${1:-}"
    
    if [[ -z "$backup_path" ]]; then
        log_error "Backup file path is required"
        log_info "Usage: $0 restore /path/to/backup.tar.gz"
        return 1
    fi
    
    if [[ ! -f "$backup_path" ]]; then
        log_error "Backup file not found: $backup_path"
        return 1
    fi
    
    log_info "Restoring certificates from: $backup_path"
    log_warning "This will overwrite existing certificates"
    
    read -p "Continue with certificate restore? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Certificate restore cancelled"
        return 0
    fi
    
    # Restore backup
    docker run --rm \
        -v letsencrypt-certs:/etc/letsencrypt \
        -v "$(dirname "$backup_path"):/backup" \
        alpine:latest \
        tar xzf "/backup/$(basename "$backup_path")" -C /etc/letsencrypt
    
    if [[ $? -eq 0 ]]; then
        log_success "Certificates restored successfully"
        
        # Restart services to pick up restored certificates
        log_info "Restarting services..."
        docker compose -f "$DOCKER_COMPOSE_FILE" restart nginx certbot
        
        log_success "Services restarted"
    else
        log_error "Certificate restore failed"
        return 1
    fi
}

# Check configuration
check_config() {
    log_info "Checking SSL configuration..."
    
    load_env_config
    
    log_info "Current configuration:"
    log_info "  Domain: ${CERTBOT_DOMAIN}"
    log_info "  Email: ${CERTBOT_EMAIL}"
    log_info "  Compose file: $DOCKER_COMPOSE_FILE"
    
    # Check if required variables are set
    if [[ "${CERTBOT_DOMAIN}" == "your-domain.com" ]]; then
        log_error "CERTBOT_DOMAIN is not set or using default placeholder"
        return 1
    fi
    
    if [[ "${CERTBOT_EMAIL}" == "admin@example.com" ]]; then
        log_error "CERTBOT_EMAIL is not set or using default placeholder"
        return 1
    fi
    
    # Check if NGINX configuration has been updated
    if grep -q "your-domain.com" "$PROJECT_ROOT/docker/nginx/nginx.conf"; then
        log_warning "NGINX configuration still contains placeholder domain"
        log_info "Please update docker/nginx/nginx.conf to use your actual domain"
    fi
    
    # Check if services are running
    log_info "Checking service status..."
    docker compose -f "$DOCKER_COMPOSE_FILE" ps nginx certbot
    
    log_success "Configuration check completed"
}

# Main function
main() {
    local command="${1:-}"
    
    # Show help if no command or help requested
    if [[ -z "$command" || "$command" == "help" || "$command" == "-h" || "$command" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # Check prerequisites
    check_docker_compose
    load_env_config
    
    # Execute command
    case "$command" in
        "status")
            certificate_status
            ;;
        "renew")
            force_renewal
            ;;
        "test")
            test_ssl "${2:-}"
            ;;
        "logs")
            show_logs
            ;;
        "restart-certbot")
            restart_certbot
            ;;
        "backup")
            backup_certificates "${2:-}"
            ;;
        "restore")
            restore_certificates "${2:-}"
            ;;
        "check-config")
            check_config
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 