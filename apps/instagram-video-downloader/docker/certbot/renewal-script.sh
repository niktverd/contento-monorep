#!/bin/bash

# ========================================
# Certbot Certificate Renewal Daemon
# ========================================
# Intelligent certificate renewal service that:
# - Handles initial certificate generation
# - Performs smart renewal checks
# - Notifies NGINX of certificate updates
# - Provides comprehensive logging

set -euo pipefail

# Configuration from environment variables
DOMAIN="${CERTBOT_DOMAIN:-your-domain.com}"
EMAIL="${CERTBOT_EMAIL:-admin@example.com}"
RENEWAL_INTERVAL="${RENEWAL_INTERVAL:-12h}"
WEBROOT_PATH="/var/www/certbot"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/letsencrypt/renewal-daemon.log
}

log_info() {
    log "INFO: $1"
}

log_warn() {
    log "WARN: $1"
}

log_error() {
    log "ERROR: $1"
}

log_success() {
    log "SUCCESS: $1"
}

# Check if domain and email are properly configured
check_configuration() {
    if [[ "$DOMAIN" == "your-domain.com" ]]; then
        log_error "CERTBOT_DOMAIN environment variable not set or using default placeholder"
        log_error "Please set CERTBOT_DOMAIN to your actual domain name"
        return 1
    fi
    
    if [[ "$EMAIL" == "admin@example.com" ]]; then
        log_error "CERTBOT_EMAIL environment variable not set or using default placeholder"
        log_error "Please set CERTBOT_EMAIL to your actual email address"
        return 1
    fi
    
    log_info "Configuration validated:"
    log_info "  Domain: $DOMAIN"
    log_info "  Email: $EMAIL"
    log_info "  Renewal interval: $RENEWAL_INTERVAL"
    log_info "  Webroot path: $WEBROOT_PATH"
    
    return 0
}

# Check if certificates already exist
certificates_exist() {
    if [[ -f "$CERT_PATH/fullchain.pem" && -f "$CERT_PATH/privkey.pem" ]]; then
        log_info "Certificates found for $DOMAIN"
        return 0
    else
        log_info "No certificates found for $DOMAIN"
        return 1
    fi
}

# Get certificate expiration date
get_certificate_expiry() {
    if [[ -f "$CERT_PATH/fullchain.pem" ]]; then
        openssl x509 -enddate -noout -in "$CERT_PATH/fullchain.pem" | cut -d= -f2
    else
        echo "No certificate found"
    fi
}

# Check if certificate needs renewal (expires in less than 30 days)
needs_renewal() {
    if ! certificates_exist; then
        log_info "No certificates exist, initial generation needed"
        return 0
    fi
    
    local expiry_date
    expiry_date=$(get_certificate_expiry)
    
    if [[ "$expiry_date" == "No certificate found" ]]; then
        log_warn "Certificate file exists but cannot read expiry date"
        return 0
    fi
    
    local expiry_epoch
    expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch
    current_epoch=$(date +%s)
    local days_until_expiry
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    log_info "Certificate expires on: $expiry_date"
    log_info "Days until expiry: $days_until_expiry"
    
    if [[ $days_until_expiry -le 30 ]]; then
        log_info "Certificate expires in $days_until_expiry days, renewal needed"
        return 0
    else
        log_info "Certificate expires in $days_until_expiry days, renewal not needed"
        return 1
    fi
}

# Generate or renew certificates
obtain_certificate() {
    local action="renew"
    if ! certificates_exist; then
        action="obtain"
    fi
    
    log_info "Attempting to $action certificate for $DOMAIN"
    
    # Prepare certbot command
    local certbot_cmd=(
        "certbot" "certonly"
        "--webroot"
        "--webroot-path=$WEBROOT_PATH"
        "--email" "$EMAIL"
        "--agree-tos"
        "--no-eff-email"
        "--non-interactive"
        "--expand"
        "--domains" "$DOMAIN"
    )
    
    # Add staging flag for testing (uncomment for testing)
    # certbot_cmd+=("--staging")
    
    # Add force renewal if certificates exist but are being renewed
    if certificates_exist && needs_renewal; then
        certbot_cmd+=("--force-renewal")
    fi
    
    log_info "Running: ${certbot_cmd[*]}"
    
    # Execute certbot command
    if "${certbot_cmd[@]}" 2>&1 | tee -a /var/log/letsencrypt/renewal-daemon.log; then
        log_success "Certificate $action completed successfully"
        
        # Log certificate details
        if certificates_exist; then
            local expiry_date
            expiry_date=$(get_certificate_expiry)
            log_info "New certificate expires on: $expiry_date"
        fi
        
        # Signal NGINX to reload configuration
        reload_nginx
        
        return 0
    else
        log_error "Certificate $action failed"
        return 1
    fi
}

# Reload NGINX configuration to pick up new certificates
reload_nginx() {
    log_info "Reloading NGINX configuration..."
    
    # Try to reload NGINX using docker exec
    if docker exec nginx-prod nginx -s reload 2>/dev/null; then
        log_success "NGINX reloaded successfully"
    else
        log_warn "Failed to reload NGINX - it may not be running or accessible"
    fi
}

# Convert interval string to seconds
interval_to_seconds() {
    local interval="$1"
    
    case "$interval" in
        *h) echo $(( ${interval%h} * 3600 )) ;;
        *m) echo $(( ${interval%m} * 60 )) ;;
        *s) echo "${interval%s}" ;;
        *) echo 43200 ;; # Default to 12 hours
    esac
}

# Main renewal loop
renewal_daemon() {
    local interval_seconds
    interval_seconds=$(interval_to_seconds "$RENEWAL_INTERVAL")
    
    log_info "Starting certificate renewal daemon"
    log_info "Check interval: $RENEWAL_INTERVAL ($interval_seconds seconds)"
    
    # Initial certificate check/generation
    if ! certificates_exist || needs_renewal; then
        log_info "Performing initial certificate check..."
        obtain_certificate || log_error "Initial certificate operation failed"
    else
        log_info "Existing certificates are valid, no immediate action needed"
    fi
    
    # Main renewal loop
    while true; do
        log_info "Sleeping for $RENEWAL_INTERVAL before next check..."
        sleep "$interval_seconds"
        
        log_info "Performing periodic certificate renewal check"
        
        if needs_renewal; then
            log_info "Certificate renewal required"
            
            # Retry mechanism for renewal
            local retry_count=0
            local max_retries=3
            
            while [[ $retry_count -lt $max_retries ]]; do
                if obtain_certificate; then
                    log_success "Certificate renewal successful"
                    break
                else
                    retry_count=$((retry_count + 1))
                    log_warn "Certificate renewal attempt $retry_count/$max_retries failed"
                    
                    if [[ $retry_count -lt $max_retries ]]; then
                        local retry_delay=$((retry_count * 300)) # 5 minutes * retry count
                        log_info "Retrying in $retry_delay seconds..."
                        sleep "$retry_delay"
                    else
                        log_error "All renewal attempts failed"
                    fi
                fi
            done
        else
            log_info "Certificate is still valid, no renewal needed"
        fi
    done
}

# Signal handlers for graceful shutdown
cleanup() {
    log_info "Received shutdown signal, cleaning up..."
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT SIGQUIT

# Main execution
main() {
    log_info "========================================="
    log_info "Certbot Certificate Renewal Daemon"
    log_info "========================================="
    
    # Create log directory
    mkdir -p /var/log/letsencrypt
    
    # Check configuration
    if ! check_configuration; then
        log_error "Configuration check failed, exiting"
        exit 1
    fi
    
    # Start the daemon
    renewal_daemon
}

# Run main function
main "$@" 