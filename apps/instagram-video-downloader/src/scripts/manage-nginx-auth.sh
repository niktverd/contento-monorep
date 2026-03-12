#!/bin/bash

# ==================================================
# NGINX Basic Authentication User Management Script
# ==================================================
# Manage users for Temporal UI basic authentication
# Usage: ./scripts/manage-nginx-auth.sh [add|remove|list|change-password] [username] [password]

set -euo pipefail

# Configuration
HTPASSWD_FILE="docker/nginx/.htpasswd"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HTPASSWD_PATH="$PROJECT_ROOT/$HTPASSWD_FILE"

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
    echo "NGINX Basic Authentication User Management"
    echo "=========================================="
    echo ""
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  add USERNAME [PASSWORD]     - Add a new user (prompts for password if not provided)"
    echo "  remove USERNAME             - Remove an existing user"
    echo "  list                       - List all users"
    echo "  change-password USERNAME   - Change password for existing user"
    echo "  verify USERNAME PASSWORD  - Verify user credentials"
    echo "  generate-secure-password  - Generate a secure random password"
    echo ""
    echo "Examples:"
    echo "  $0 add johndoe                    # Add user 'johndoe' (will prompt for password)"
    echo "  $0 add johndoe secretpass123      # Add user 'johndoe' with specified password"
    echo "  $0 remove johndoe                 # Remove user 'johndoe'"
    echo "  $0 list                           # List all users"
    echo "  $0 change-password johndoe        # Change password for 'johndoe'"
    echo "  $0 verify johndoe secretpass123   # Test if credentials are valid"
    echo ""
    echo "Default credentials:"
    echo "  Username: admin"
    echo "  Password: temporal"
    echo ""
    echo "File location: $HTPASSWD_FILE"
}

# Check if htpasswd is available
check_htpasswd() {
    if ! command -v htpasswd >/dev/null 2>&1; then
        log_error "htpasswd utility not found. Please install apache2-utils (Ubuntu/Debian) or httpd-tools (CentOS/RHEL)"
        exit 1
    fi
}

# Ensure .htpasswd file exists
ensure_htpasswd_file() {
    if [[ ! -f "$HTPASSWD_PATH" ]]; then
        log_warning "htpasswd file not found at $HTPASSWD_PATH"
        log_info "Creating new .htpasswd file with default admin user..."
        
        # Create directory if it doesn't exist
        mkdir -p "$(dirname "$HTPASSWD_PATH")"
        
        # Create file with default admin user
        echo 'temporal' | htpasswd -c -B -i "$HTPASSWD_PATH" admin
        log_success "Created .htpasswd file with default admin user (password: temporal)"
    fi
}

# Generate secure password
generate_password() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 12
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12)))"
    else
        # Fallback to simple method
        date +%s | sha256sum | base64 | head -c 12
    fi
}

# Add user
add_user() {
    local username="$1"
    local password="${2:-}"
    
    if [[ -z "$username" ]]; then
        log_error "Username is required"
        exit 1
    fi
    
    # Check if user already exists
    if grep -q "^$username:" "$HTPASSWD_PATH" 2>/dev/null; then
        log_error "User '$username' already exists. Use 'change-password' to update password."
        exit 1
    fi
    
    if [[ -z "$password" ]]; then
        log_info "Adding user '$username' (will prompt for password)..."
        htpasswd -B "$HTPASSWD_PATH" "$username"
    else
        log_info "Adding user '$username' with provided password..."
        echo "$password" | htpasswd -B -i "$HTPASSWD_PATH" "$username"
    fi
    
    log_success "User '$username' added successfully"
}

# Remove user
remove_user() {
    local username="$1"
    
    if [[ -z "$username" ]]; then
        log_error "Username is required"
        exit 1
    fi
    
    if ! grep -q "^$username:" "$HTPASSWD_PATH" 2>/dev/null; then
        log_error "User '$username' not found"
        exit 1
    fi
    
    htpasswd -D "$HTPASSWD_PATH" "$username"
    log_success "User '$username' removed successfully"
}

# List users
list_users() {
    if [[ ! -f "$HTPASSWD_PATH" ]]; then
        log_warning "No .htpasswd file found"
        return
    fi
    
    log_info "Users in $HTPASSWD_FILE:"
    echo ""
    
    while IFS=: read -r username _; do
        echo "  • $username"
    done < "$HTPASSWD_PATH"
}

# Change password
change_password() {
    local username="$1"
    
    if [[ -z "$username" ]]; then
        log_error "Username is required"
        exit 1
    fi
    
    if ! grep -q "^$username:" "$HTPASSWD_PATH" 2>/dev/null; then
        log_error "User '$username' not found"
        exit 1
    fi
    
    log_info "Changing password for user '$username'..."
    htpasswd -B "$HTPASSWD_PATH" "$username"
    log_success "Password changed for user '$username'"
}

# Verify credentials
verify_credentials() {
    local username="$1"
    local password="$2"
    
    if [[ -z "$username" || -z "$password" ]]; then
        log_error "Username and password are required"
        exit 1
    fi
    
    if ! grep -q "^$username:" "$HTPASSWD_PATH" 2>/dev/null; then
        log_error "User '$username' not found"
        exit 1
    fi
    
    # Extract hash from file
    local hash
    hash=$(grep "^$username:" "$HTPASSWD_PATH" | cut -d: -f2)
    
    # Verify password using openssl (works with bcrypt hashes)
    if command -v python3 >/dev/null 2>&1; then
        if python3 -c "
import crypt
import sys
result = crypt.crypt('$password', '$hash')
if result == '$hash':
    sys.exit(0)
else:
    sys.exit(1)
        " 2>/dev/null; then
            log_success "Credentials for user '$username' are valid"
        else
            log_error "Invalid credentials for user '$username'"
            exit 1
        fi
    else
        log_warning "Cannot verify credentials - Python3 not available"
        log_info "Credentials format appears correct for user '$username'"
    fi
}

# Main script logic
main() {
    check_htpasswd
    ensure_htpasswd_file
    
    local command="${1:-}"
    
    case "$command" in
        "add")
            add_user "${2:-}" "${3:-}"
            ;;
        "remove")
            remove_user "${2:-}"
            ;;
        "list")
            list_users
            ;;
        "change-password")
            change_password "${2:-}"
            ;;
        "verify")
            verify_credentials "${2:-}" "${3:-}"
            ;;
        "generate-secure-password")
            echo "Generated secure password: $(generate_password)"
            ;;
        "help"|"-h"|"--help"|"")
            show_help
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