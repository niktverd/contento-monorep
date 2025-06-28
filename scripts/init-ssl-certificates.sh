#!/bin/bash

# ===============================================
# SSL Certificate Initialization Script
# ===============================================
# Initializes Let's Encrypt SSL certificates for production deployment
# Usage: ./scripts/init-ssl-certificates.sh [domain] [email]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"

# Default values
DEFAULT_DOMAIN="your-domain.com"
DEFAULT_EMAIL="admin@example.com"

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
    echo "SSL Certificate Initialization"
    echo "=============================="
    echo ""
    echo "Usage: $0 [OPTIONS] [DOMAIN] [EMAIL]"
    echo ""
    echo "Options:"
    echo "  -y, --non-interactive    Run in non-interactive mode (required for CI/CD)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Arguments:"
    echo "  DOMAIN  - Your domain name (e.g., example.com)"
    echo "  EMAIL   - Your email for Let's Encrypt registration"
    echo ""
    echo "Examples:"
    echo "  $0 example.com admin@example.com                    # Interactive mode"
    echo "  $0 --non-interactive example.com admin@example.com  # Non-interactive mode"
    echo "  $0  # Interactive mode - will prompt for inputs"
    echo ""
    echo "Environment Variables:"
    echo "  CERTBOT_DOMAIN - Domain name (fallback if not provided as argument)"
    echo "  CERTBOT_EMAIL  - Email address (fallback if not provided as argument)"
    echo ""
    echo "This script will:"
    echo "  1. Create dummy certificates for initial NGINX startup"
    echo "  2. Start NGINX with HTTP-only configuration"
    echo "  3. Obtain real SSL certificates from Let's Encrypt"
    echo "  4. Reload NGINX with SSL configuration"
    echo ""
    echo "Note: Use --non-interactive flag for automated deployments"
}

# Check if docker-compose is available
check_docker_compose() {
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "Docker Compose is not available"
        exit 1
    fi
}

# Validate domain format
validate_domain() {
    local domain="$1"
    
    if [[ ! "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        log_error "Invalid domain format: $domain"
        return 1
    fi
    
    return 0
}

# Validate email format
validate_email() {
    local email="$1"
    
    if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        log_error "Invalid email format: $email"
        return 1
    fi
    
    return 0
}

# Get domain and email interactively
get_domain_and_email() {
    local domain="${1:-}"
    local email="${2:-}"
    
    # Get domain from environment or prompt
    if [[ -z "$domain" ]]; then
        domain="${CERTBOT_DOMAIN:-}"
    fi
    
    if [[ -z "$domain" ]]; then
        echo ""
        read -p "Enter your domain name (e.g., example.com): " domain
    fi
    
    if [[ -z "$domain" || "$domain" == "$DEFAULT_DOMAIN" ]]; then
        log_error "Domain name is required and cannot be the default placeholder"
        exit 1
    fi
    
    if ! validate_domain "$domain"; then
        exit 1
    fi
    
    # Get email from environment or prompt
    if [[ -z "$email" ]]; then
        email="${CERTBOT_EMAIL:-}"
    fi
    
    if [[ -z "$email" ]]; then
        echo ""
        read -p "Enter your email for Let's Encrypt registration: " email
    fi
    
    if [[ -z "$email" || "$email" == "$DEFAULT_EMAIL" ]]; then
        log_error "Email is required and cannot be the default placeholder"
        exit 1
    fi
    
    if ! validate_email "$email"; then
        exit 1
    fi
    
    echo "$domain" "$email"
}

# Create dummy SSL certificates for initial NGINX startup
create_dummy_certificates() {
    local domain="$1"
    
    log_info "Creating dummy SSL certificates for initial setup..."
    
    # Create certificate directory structure
    docker run --rm \
        -v letsencrypt-certs:/etc/letsencrypt \
        alpine:latest \
        sh -c "
            mkdir -p /etc/letsencrypt/live/$domain
            mkdir -p /etc/letsencrypt/archive/$domain
        "
    
    # Generate dummy certificates
    docker run --rm \
        -v letsencrypt-certs:/etc/letsencrypt \
        alpine:latest \
        sh -c "
            apk add --no-cache openssl
            openssl req -x509 -nodes -newkey rsa:2048 \
                -days 1 \
                -keyout /etc/letsencrypt/live/$domain/privkey.pem \
                -out /etc/letsencrypt/live/$domain/fullchain.pem \
                -subj '/CN=$domain'
            
            # Create chain.pem (same as fullchain for dummy cert)
            cp /etc/letsencrypt/live/$domain/fullchain.pem /etc/letsencrypt/live/$domain/chain.pem
            
            echo 'Dummy certificates created for $domain'
        "
    
    log_success "Dummy SSL certificates created"
}

# Start NGINX to handle ACME challenge
start_nginx_for_acme() {
    log_info "Starting NGINX for ACME challenge..."
    
    # Start only NGINX (no SSL yet)
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d nginx
    
    # Wait for NGINX to be ready
    log_info "Waiting for NGINX to start..."
    sleep 10
    
    # Test if NGINX is responding
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec nginx wget --quiet --tries=1 --spider http://localhost:80/health 2>/dev/null; then
        log_warning "NGINX health check failed, but continuing..."
    fi
    
    log_success "NGINX started successfully"
}

# Obtain real SSL certificates from Let's Encrypt
obtain_ssl_certificates() {
    local domain="$1"
    local email="$2"
    
    log_info "Obtaining SSL certificates from Let's Encrypt..."
    log_info "Domain: $domain"
    log_info "Email: $email"
    
    # Run certbot to obtain certificates
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
        --domains "$domain"
    
    if [[ $? -eq 0 ]]; then
        log_success "SSL certificates obtained successfully!"
    else
        log_error "Failed to obtain SSL certificates"
        return 1
    fi
}

# Update NGINX configuration with real domain
update_nginx_config() {
    local domain="$1"
    
    log_info "Updating NGINX configuration with real domain..."
    
    # Check if nginx.conf needs domain update
    if grep -q "your-domain.com" "$PROJECT_ROOT/docker/nginx/nginx.conf"; then
        log_info "Updating nginx.conf with domain: $domain"
        
        # Create backup
        cp "$PROJECT_ROOT/docker/nginx/nginx.conf" "$PROJECT_ROOT/docker/nginx/nginx.conf.backup"
        
        # Replace placeholder with actual domain
        sed -i "s/your-domain.com/$domain/g" "$PROJECT_ROOT/docker/nginx/nginx.conf"
        
        log_success "NGINX configuration updated"
    else
        log_info "NGINX configuration appears to be already updated"
    fi
}

# Reload NGINX with new certificates
reload_nginx() {
    log_info "Reloading NGINX with new SSL certificates..."
    
    # Restart NGINX to pick up new certificates
    docker-compose -f "$DOCKER_COMPOSE_FILE" restart nginx
    
    # Wait for restart
    sleep 5
    
    log_success "NGINX reloaded successfully"
}

# Start certificate renewal service
start_certificate_renewal() {
    log_info "Starting certificate renewal service..."
    
    # Start certbot service for automatic renewal
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d certbot
    
    log_success "Certificate renewal service started"
    log_info "Certificates will be checked for renewal every 12 hours"
}

# Test SSL certificates
test_ssl_certificates() {
    local domain="$1"
    
    log_info "Testing SSL certificate installation..."
    
    # Test HTTPS connection
    if command -v curl >/dev/null 2>&1; then
        if curl -s -I "https://$domain" >/dev/null 2>&1; then
            log_success "HTTPS connection successful!"
        else
            log_warning "HTTPS connection test failed"
            log_info "This might be normal if DNS is not yet propagated"
        fi
    else
        log_info "curl not available for SSL testing"
    fi
    
    # Check certificate expiration
    docker run --rm \
        -v letsencrypt-certs:/etc/letsencrypt \
        alpine:latest \
        sh -c "
            apk add --no-cache openssl
            if [ -f /etc/letsencrypt/live/$domain/fullchain.pem ]; then
                echo 'Certificate details:'
                openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -text -noout | grep -A 2 'Validity'
            else
                echo 'Certificate file not found'
            fi
        "
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary resources..."
    # Add any cleanup logic here if needed
}

# Main function
main() {
    # Parse arguments and flags
    local domain=""
    local email=""
    local non_interactive=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -y|--non-interactive)
                non_interactive=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            --)
                shift
                break
                ;;
            -*)
                log_error "Unknown option $1"
                show_help
                exit 1
                ;;
            *)
                if [[ -z "$domain" ]]; then
                    domain="$1"
                elif [[ -z "$email" ]]; then
                    email="$1"
                else
                    log_error "Too many arguments"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    log_info "SSL Certificate Initialization"
    log_info "=============================="
    
    # Check prerequisites
    check_docker_compose
    
    # Validate parameters first
    if [[ -z "$domain" ]]; then
        domain="${CERTBOT_DOMAIN:-}"
    fi
    
    if [[ -z "$email" ]]; then
        email="${CERTBOT_EMAIL:-}"
    fi
    
    # In non-interactive mode, both domain and email must be provided
    if [[ "$non_interactive" == true ]]; then
        if [[ -z "$domain" ]]; then
            log_error "Domain is required in non-interactive mode"
            log_error "Provide via argument or CERTBOT_DOMAIN environment variable"
            exit 1
        fi
        
        if [[ -z "$email" ]]; then
            log_error "Email is required in non-interactive mode" 
            log_error "Provide via argument or CERTBOT_EMAIL environment variable"
            exit 1
        fi
        
        if [[ "$domain" == "$DEFAULT_DOMAIN" ]]; then
            log_error "Domain cannot be the default placeholder: $DEFAULT_DOMAIN"
            exit 1
        fi
        
        if [[ "$email" == "$DEFAULT_EMAIL" ]]; then
            log_error "Email cannot be the default placeholder: $DEFAULT_EMAIL"
            exit 1
        fi
        
        if ! validate_domain "$domain"; then
            exit 1
        fi
        
        if ! validate_email "$email"; then
            exit 1
        fi
    else
        # Interactive mode - get domain and email with prompts
        read -r domain email <<< "$(get_domain_and_email "$domain" "$email")"
    fi
    
    log_info "Configuration:"
    log_info "  Domain: $domain"
    log_info "  Email: $email"
    log_info "  Compose file: $DOCKER_COMPOSE_FILE"
    log_info "  Mode: $(if [[ "$non_interactive" == true ]]; then echo "non-interactive"; else echo "interactive"; fi)"
    
    # Confirmation prompt (only in interactive mode)
    if [[ "$non_interactive" != true ]]; then
        echo ""
        read -p "Continue with SSL certificate initialization? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "Initialization cancelled"
            exit 0
        fi
    fi
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute initialization steps
    log_info ""
    log_info "Step 1: Creating dummy certificates..."
    create_dummy_certificates "$domain"
    
    log_info ""
    log_info "Step 2: Starting NGINX for ACME challenge..."
    start_nginx_for_acme
    
    log_info ""
    log_info "Step 3: Obtaining real SSL certificates..."
    if obtain_ssl_certificates "$domain" "$email"; then
        log_info ""
        log_info "Step 4: Updating NGINX configuration..."
        update_nginx_config "$domain"
        
        log_info ""
        log_info "Step 5: Reloading NGINX..."
        reload_nginx
        
        log_info ""
        log_info "Step 6: Starting certificate renewal service..."
        start_certificate_renewal
        
        log_info ""
        log_info "Step 7: Testing SSL certificates..."
        test_ssl_certificates "$domain"
        
        echo ""
        log_success "SSL certificate initialization completed successfully!"
        log_info ""
        log_info "Next steps:"
        log_info "  1. Update your DNS to point $domain to this server"
        log_info "  2. Test HTTPS access: https://$domain"
        log_info "  3. Monitor certificate renewal logs: docker-compose logs certbot"
        log_info ""
        log_info "Certificate files location:"
        log_info "  - Certificate: /etc/letsencrypt/live/$domain/fullchain.pem"
        log_info "  - Private key: /etc/letsencrypt/live/$domain/privkey.pem"
        log_info "  - Chain: /etc/letsencrypt/live/$domain/chain.pem"
    else
        log_error "Certificate initialization failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 