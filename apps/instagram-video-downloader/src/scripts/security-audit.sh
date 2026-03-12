#!/bin/bash

# ===============================================
# Security Audit Script
# ===============================================
# Comprehensive security analysis for production deployment
# Usage: ./scripts/security-audit.sh [domain]

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
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
}

log_section() {
    echo -e "${PURPLE}[===]${NC} $1"
}

log_detail() {
    echo -e "${CYAN}     ${NC} $1"
}

# Global counters
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# Helper functions
increment_pass() { ((PASS_COUNT++)) || true; }
increment_warn() { ((WARN_COUNT++)) || true; }
increment_fail() { ((FAIL_COUNT++)) || true; }

# Help function
show_help() {
    echo "Security Audit Script"
    echo "===================="
    echo ""
    echo "Usage: $0 [DOMAIN]"
    echo ""
    echo "Arguments:"
    echo "  DOMAIN  - Your domain name to test (optional)"
    echo ""
    echo "Examples:"
    echo "  $0                        # Audit local configuration"
    echo "  $0 example.com            # Audit domain and SSL"
    echo ""
    echo "This script will audit:"
    echo "  • Port exposure and network security"
    echo "  • SSL/TLS configuration"
    echo "  • Security headers"
    echo "  • Authentication mechanisms"
    echo "  • Container security"
    echo "  • NGINX configuration"
    echo "  • Docker security settings"
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"
    
    # Check if docker is available
    if command -v docker >/dev/null 2>&1; then
        log_success "Docker is available"
        increment_pass
    else
        log_error "Docker is not installed"
        increment_fail
    fi
    
    # Check if docker-compose is available
    if docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose is available"
        increment_pass
    else
        log_error "Docker Compose is not available"
        increment_fail
    fi
    
    # Check if curl is available
    if command -v curl >/dev/null 2>&1; then
        log_success "curl is available for testing"
        increment_pass
    else
        log_warning "curl not available - some tests will be skipped"
        increment_warn
    fi
    
    # Check if openssl is available
    if command -v openssl >/dev/null 2>&1; then
        log_success "OpenSSL is available for SSL testing"
        increment_pass
    else
        log_warning "OpenSSL not available - SSL tests will be limited"
        increment_warn
    fi
}

# Audit port exposure
audit_port_exposure() {
    log_section "Port Exposure Analysis"
    
    log_info "Checking which ports are exposed externally..."
    
    # Check docker-compose for exposed ports
    local exposed_ports
    exposed_ports=$(grep -A 5 "ports:" "$DOCKER_COMPOSE_FILE" | grep -E "^\s*-\s*['\"]?[0-9]+" || true)
    
    if [[ -n "$exposed_ports" ]]; then
        log_detail "Exposed ports found:"
        echo "$exposed_ports" | while read -r port; do
            port_clean=$(echo "$port" | sed 's/^[^0-9]*//' | sed 's/[^0-9:].*//')
            if [[ "$port_clean" == "80:80" || "$port_clean" == "443:443" ]]; then
                log_success "Port $port_clean (NGINX - Expected)"
                increment_pass
            else
                log_error "Unexpected port exposure: $port_clean"
                increment_fail
            fi
        done
    else
        log_error "No port configuration found in docker-compose"
        increment_fail
    fi
    
    # Check for any services without internal network isolation
    log_info "Checking for services without network isolation..."
    
    local services_with_ports=0
    for service in postgresql temporal temporal-ui app downloading-worker processing-worker; do
        if grep -A 20 "^  $service:" "$DOCKER_COMPOSE_FILE" | grep -q "ports:"; then
            log_error "Service $service has exposed ports (should be internal only)"
            increment_fail
            ((services_with_ports++))
        else
            log_success "Service $service is properly isolated"
            increment_pass
        fi
    done
    
    if [[ $services_with_ports -eq 0 ]]; then
        log_success "All internal services are properly network-isolated"
        increment_pass
    fi
}

# Audit container security
audit_container_security() {
    log_section "Container Security Analysis"
    
    log_info "Checking container security configurations..."
    
    # Check for non-root users in Dockerfile
    if [[ -f "$PROJECT_ROOT/Dockerfile.prod" ]]; then
        if grep -q "USER.*appuser" "$PROJECT_ROOT/Dockerfile.prod"; then
            log_success "Application runs as non-root user"
            increment_pass
        else
            log_error "Application may be running as root user"
            increment_fail
        fi
        
        # Check for security hardening
        if grep -q "tini" "$PROJECT_ROOT/Dockerfile.prod"; then
            log_success "Init system (tini) is used for proper signal handling"
            increment_pass
        else
            log_warning "No init system detected - potential signal handling issues"
            increment_warn
        fi
        
        # Check for health checks
        if grep -q "HEALTHCHECK" "$PROJECT_ROOT/Dockerfile.prod"; then
            log_success "Health checks are configured"
            increment_pass
        else
            log_warning "No health checks found in Dockerfile"
            increment_warn
        fi
    else
        log_warning "Dockerfile.prod not found - skipping container security checks"
        increment_warn
    fi
    
    # Check docker-compose security settings
    log_info "Checking docker-compose security settings..."
    
    # Check for resource limits
    if grep -q "deploy:" "$DOCKER_COMPOSE_FILE" && grep -q "limits:" "$DOCKER_COMPOSE_FILE"; then
        log_success "Resource limits are configured"
        increment_pass
    else
        log_warning "Resource limits not found - potential DoS vulnerability"
        increment_warn
    fi
    
    # Check for restart policies
    if grep -q "restart:" "$DOCKER_COMPOSE_FILE"; then
        log_success "Restart policies are configured"
        increment_pass
    else
        log_warning "No restart policies found"
        increment_warn
    fi
}

# Audit NGINX configuration
audit_nginx_config() {
    log_section "NGINX Security Configuration"
    
    local nginx_conf="$PROJECT_ROOT/docker/nginx/nginx.conf"
    
    if [[ ! -f "$nginx_conf" ]]; then
        log_error "NGINX configuration file not found"
        increment_fail
        return
    fi
    
    log_info "Analyzing NGINX security configuration..."
    
    # Check for security headers
    local security_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Content-Security-Policy"
    )
    
    for header in "${security_headers[@]}"; do
        if grep -q "$header" "$nginx_conf"; then
            log_success "Security header configured: $header"
            increment_pass
        else
            log_error "Missing security header: $header"
            increment_fail
        fi
    done
    
    # Check for SSL/TLS configuration
    if grep -q "ssl_protocols TLSv1.2 TLSv1.3" "$nginx_conf"; then
        log_success "Modern TLS protocols only (1.2, 1.3)"
        increment_pass
    else
        log_error "Weak or missing TLS protocol configuration"
        increment_fail
    fi
    
    # Check for HTTP to HTTPS redirect
    if grep -q "return 301 https" "$nginx_conf"; then
        log_success "HTTP to HTTPS redirect configured"
        increment_pass
    else
        log_error "Missing HTTP to HTTPS redirect"
        increment_fail
    fi
    
    # Check for rate limiting
    if grep -q "limit_req_zone" "$nginx_conf"; then
        log_success "Rate limiting is configured"
        increment_pass
    else
        log_error "No rate limiting found"
        increment_fail
    fi
    
    # Check for authentication on Temporal UI
    if grep -A 5 "location /temporal/" "$nginx_conf" | grep -q "auth_basic"; then
        log_success "Basic authentication on Temporal UI"
        increment_pass
    else
        log_error "Temporal UI is not protected with authentication"
        increment_fail
    fi
    
    # Check for server tokens hiding
    if grep -q "server_tokens off" "$nginx_conf"; then
        log_success "Server version information is hidden"
        increment_pass
    else
        log_warning "Server version information may be exposed"
        increment_warn
    fi
}

# Test SSL/TLS configuration
test_ssl_config() {
    local domain="${1:-}"
    
    if [[ -z "$domain" ]]; then
        log_section "SSL/TLS Configuration (Skipped - No Domain)"
        log_info "Provide a domain name to test SSL configuration"
        log_info "Usage: $0 your-domain.com"
        return
    fi
    
    log_section "SSL/TLS Security Testing"
    log_info "Testing SSL configuration for: $domain"
    
    # Test SSL connection
    if command -v openssl >/dev/null 2>&1; then
        # Test SSL certificate
        log_info "Testing SSL certificate..."
        if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text >/dev/null 2>&1; then
            log_success "SSL certificate is valid and accessible"
            increment_pass
            
            # Get certificate details
            local cert_info
            cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
            if [[ -n "$cert_info" ]]; then
                log_detail "Certificate validity: $cert_info"
            fi
        else
            log_error "SSL certificate test failed"
            increment_fail
        fi
        
        # Test TLS versions
        log_info "Testing TLS protocol support..."
        
        # Test TLS 1.0 (should fail)
        if echo | openssl s_client -tls1 -connect "$domain:443" >/dev/null 2>&1; then
            log_error "TLS 1.0 is supported (insecure)"
            increment_fail
        else
            log_success "TLS 1.0 is properly disabled"
            increment_pass
        fi
        
        # Test TLS 1.1 (should fail)
        if echo | openssl s_client -tls1_1 -connect "$domain:443" >/dev/null 2>&1; then
            log_error "TLS 1.1 is supported (insecure)"
            increment_fail
        else
            log_success "TLS 1.1 is properly disabled"
            increment_pass
        fi
        
        # Test TLS 1.2 (should work)
        if echo | openssl s_client -tls1_2 -connect "$domain:443" >/dev/null 2>&1; then
            log_success "TLS 1.2 is supported"
            increment_pass
        else
            log_warning "TLS 1.2 support test failed"
            increment_warn
        fi
        
        # Test TLS 1.3 (should work)
        if echo | openssl s_client -tls1_3 -connect "$domain:443" >/dev/null 2>&1; then
            log_success "TLS 1.3 is supported"
            increment_pass
        else
            log_info "TLS 1.3 not supported (acceptable for older setups)"
        fi
    else
        log_warning "OpenSSL not available - SSL tests skipped"
        increment_warn
    fi
}

# Test security headers
test_security_headers() {
    local domain="${1:-localhost}"
    local protocol="http"
    
    if [[ "$domain" != "localhost" ]]; then
        protocol="https"
    fi
    
    log_section "Security Headers Testing"
    log_info "Testing security headers for: $protocol://$domain"
    
    if command -v curl >/dev/null 2>&1; then
        local headers
        headers=$(curl -s -I "$protocol://$domain" 2>/dev/null || true)
        
        if [[ -n "$headers" ]]; then
            # Test for security headers
            local security_checks=(
                "X-Frame-Options:DENY|SAMEORIGIN"
                "X-Content-Type-Options:nosniff"
                "X-XSS-Protection:1"
                "Strict-Transport-Security:max-age"
                "Content-Security-Policy:default-src"
            )
            
            for check in "${security_checks[@]}"; do
                local header_name="${check%%:*}"
                local expected_value="${check##*:}"
                
                if echo "$headers" | grep -i "$header_name" | grep -q "$expected_value"; then
                    log_success "Security header present: $header_name"
                    increment_pass
                else
                    log_error "Missing or incorrect security header: $header_name"
                    increment_fail
                fi
            done
            
            # Check for dangerous headers
            if echo "$headers" | grep -qi "server:.*nginx"; then
                log_warning "Server version information exposed"
                increment_warn
            else
                log_success "Server version information is hidden"
                increment_pass
            fi
            
        else
            log_error "Unable to retrieve headers from $protocol://$domain"
            increment_fail
        fi
    else
        log_warning "curl not available - header tests skipped"
        increment_warn
    fi
}

# Test authentication
test_authentication() {
    local domain="${1:-localhost}"
    local protocol="http"
    
    if [[ "$domain" != "localhost" ]]; then
        protocol="https"
    fi
    
    log_section "Authentication Security Testing"
    log_info "Testing authentication mechanisms..."
    
    if command -v curl >/dev/null 2>&1; then
        # Test Temporal UI protection
        log_info "Testing Temporal UI authentication..."
        local temporal_response
        temporal_response=$(curl -s -o /dev/null -w "%{http_code}" "$protocol://$domain/temporal/" 2>/dev/null || true)
        
        if [[ "$temporal_response" == "401" ]]; then
            log_success "Temporal UI is protected with authentication"
            increment_pass
        elif [[ "$temporal_response" == "403" ]]; then
            log_success "Temporal UI access is forbidden (protected)"
            increment_pass
        else
            log_error "Temporal UI may not be properly protected (HTTP $temporal_response)"
            increment_fail
        fi
        
        # Test API endpoints (should be accessible without auth)
        log_info "Testing API endpoint accessibility..."
        local api_response
        api_response=$(curl -s -o /dev/null -w "%{http_code}" "$protocol://$domain/api/" 2>/dev/null || true)
        
        if [[ "$api_response" == "200" || "$api_response" == "404" ]]; then
            log_success "API endpoints are accessible without authentication"
            increment_pass
        else
            log_warning "API endpoints returned unexpected status: $api_response"
            increment_warn
        fi
        
    else
        log_warning "curl not available - authentication tests skipped"
        increment_warn
    fi
}

# Check environment security
audit_environment_security() {
    log_section "Environment Security"
    
    log_info "Checking environment configuration security..."
    
    # Check if .env.production exists and has proper permissions
    local env_file="$PROJECT_ROOT/.env.production"
    if [[ -f "$env_file" ]]; then
        local perms
        perms=$(stat -f "%A" "$env_file" 2>/dev/null || stat -c "%a" "$env_file" 2>/dev/null || echo "unknown")
        
        if [[ "$perms" == "600" || "$perms" == "640" ]]; then
            log_success "Environment file has secure permissions ($perms)"
            increment_pass
        else
            log_warning "Environment file permissions may be too open ($perms)"
            increment_warn
        fi
        
        # Check for placeholder values
        if grep -q "your-domain.com\|admin@example.com\|changeme\|password123" "$env_file" 2>/dev/null; then
            log_error "Environment file contains placeholder/weak values"
            increment_fail
        else
            log_success "No obvious placeholder values in environment file"
            increment_pass
        fi
    else
        log_warning "Production environment file not found"
        increment_warn
    fi
    
    # Check for secrets in version control
    log_info "Checking for sensitive files in version control..."
    if [[ -f "$PROJECT_ROOT/.gitignore" ]]; then
        if grep -q "\.env" "$PROJECT_ROOT/.gitignore"; then
            log_success "Environment files are ignored by git"
            increment_pass
        else
            log_error "Environment files may be tracked by git"
            increment_fail
        fi
    else
        log_warning ".gitignore file not found"
        increment_warn
    fi
}

# Generate security report
generate_report() {
    local domain="${1:-}"
    
    echo ""
    log_section "Security Audit Summary"
    echo ""
    
    local total_checks=$((PASS_COUNT + WARN_COUNT + FAIL_COUNT))
    
    echo -e "${GREEN}✓ Passed:${NC} $PASS_COUNT"
    echo -e "${YELLOW}⚠ Warnings:${NC} $WARN_COUNT"
    echo -e "${RED}✗ Failed:${NC} $FAIL_COUNT"
    echo -e "${CYAN}Total Checks:${NC} $total_checks"
    echo ""
    
    # Security score calculation
    local pass_percentage=0
    if [[ $total_checks -gt 0 ]]; then
        pass_percentage=$((PASS_COUNT * 100 / total_checks))
    fi
    
    echo -e "${CYAN}Security Score:${NC} $pass_percentage%"
    echo ""
    
    # Overall assessment
    if [[ $FAIL_COUNT -eq 0 && $WARN_COUNT -eq 0 ]]; then
        echo -e "${GREEN}🔒 EXCELLENT:${NC} All security checks passed!"
    elif [[ $FAIL_COUNT -eq 0 && $WARN_COUNT -le 3 ]]; then
        echo -e "${YELLOW}🔐 GOOD:${NC} No critical issues, minor warnings only"
    elif [[ $FAIL_COUNT -le 2 ]]; then
        echo -e "${YELLOW}⚠ FAIR:${NC} Some security issues need attention"
    else
        echo -e "${RED}🚨 POOR:${NC} Critical security issues found - immediate action required"
    fi
    
    echo ""
    
    # Recommendations
    if [[ $FAIL_COUNT -gt 0 || $WARN_COUNT -gt 0 ]]; then
        echo -e "${PURPLE}Recommendations:${NC}"
        echo ""
        
        if [[ $FAIL_COUNT -gt 0 ]]; then
            echo "🔴 Address all FAILED checks immediately"
        fi
        
        if [[ $WARN_COUNT -gt 0 ]]; then
            echo "🟡 Review and address WARNING items when possible"
        fi
        
        if [[ -n "$domain" ]]; then
            echo "🔍 Consider running external security scans:"
            echo "   • SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=$domain"
            echo "   • Security Headers: https://securityheaders.com/?q=$domain"
            echo "   • Mozilla Observatory: https://observatory.mozilla.org/analyze/$domain"
        fi
    fi
    
    echo ""
    log_info "Security audit completed. Review results above and address any issues."
}

# Save report to file
save_report() {
    local domain="${1:-localhost}"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$PROJECT_ROOT/security-audit-$timestamp.txt"
    
    {
        echo "Security Audit Report"
        echo "===================="
        echo "Date: $(date)"
        echo "Domain: $domain"
        echo "Auditor: Security Audit Script v1.0"
        echo ""
        echo "Summary:"
        echo "✓ Passed: $PASS_COUNT"
        echo "⚠ Warnings: $WARN_COUNT"
        echo "✗ Failed: $FAIL_COUNT"
        echo "Security Score: $((PASS_COUNT * 100 / (PASS_COUNT + WARN_COUNT + FAIL_COUNT)))%"
        echo ""
        echo "Generated by: $0"
    } > "$report_file"
    
    log_info "Report saved to: $report_file"
}

# Main function
main() {
    local domain="${1:-}"
    
    # Show help if requested
    if [[ "$domain" == "help" || "$domain" == "-h" || "$domain" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    echo -e "${PURPLE}================================================${NC}"
    echo -e "${PURPLE}          Security Audit Script${NC}"
    echo -e "${PURPLE}================================================${NC}"
    echo ""
    
    if [[ -n "$domain" ]]; then
        log_info "Auditing domain: $domain"
    else
        log_info "Auditing local configuration only"
        log_info "Provide domain name for complete SSL testing"
    fi
    
    echo ""
    
    # Run audit checks
    check_prerequisites
    echo ""
    
    audit_port_exposure
    echo ""
    
    audit_container_security
    echo ""
    
    audit_nginx_config
    echo ""
    
    audit_environment_security
    echo ""
    
    test_ssl_config "$domain"
    echo ""
    
    test_security_headers "$domain"
    echo ""
    
    test_authentication "$domain"
    echo ""
    
    # Generate final report
    generate_report "$domain"
    
    # Save report to file
    save_report "$domain"
    
    # Exit with appropriate code
    if [[ $FAIL_COUNT -gt 0 ]]; then
        exit 1
    elif [[ $WARN_COUNT -gt 0 ]]; then
        exit 2
    else
        exit 0
    fi
}

# Run main function with all arguments
main "$@" 