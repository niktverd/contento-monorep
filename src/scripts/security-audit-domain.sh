#!/bin/bash

# ===============================================
# Security Audit Domain Helper Script
# ===============================================
# Runs security audit with domain from environment
# Usage: ./scripts/security-audit-domain.sh

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Load environment variables
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

# Main function
main() {
    log_info "Security Audit with Domain Configuration"
    log_info "========================================"
    
    # Load environment
    load_env_config
    
    # Check if domain is configured
    if [[ "${CERTBOT_DOMAIN}" == "your-domain.com" ]]; then
        log_error "CERTBOT_DOMAIN not configured in .env.production"
        log_info "Please set CERTBOT_DOMAIN=your-actual-domain.com"
        log_info "Running audit without domain-specific tests..."
        exec "$SCRIPT_DIR/security-audit.sh"
    else
        log_info "Running security audit for domain: ${CERTBOT_DOMAIN}"
        exec "$SCRIPT_DIR/security-audit.sh" "${CERTBOT_DOMAIN}"
    fi
}

main "$@" 