# ====================================
# Instagram Video Downloader - Development Makefile
# ====================================

# ====================================
# Container Engine Auto-Detection
# ====================================

# Auto-detect container engine (Docker or Podman)
CONTAINER_ENGINE ?= $(shell command -v podman >/dev/null 2>&1 && echo "podman" || echo "docker")

# Set compose command based on container engine
ifeq ($(CONTAINER_ENGINE),podman)
    # Check if modern 'podman compose' is available, otherwise use podman-compose
    COMPOSE_CMD = $(shell podman compose version >/dev/null 2>&1 && echo "podman compose" || echo "podman-compose")
else
    COMPOSE_CMD = docker compose
endif

# Development compose file
COMPOSE_FILE_PATH = docker-compose.dev.yml

# Environment file for development
ENV_FILE_PATH = .env.development

# Helper variable: compose command with file and env args
COMPOSE = $(COMPOSE_CMD) -f $(COMPOSE_FILE_PATH) --env-file $(ENV_FILE_PATH)

.PHONY: help dev dev-app stop logs logs-temporal logs-app build clean status health dev-start verify-communication auth-list auth-add auth-remove auth-change-password auth-help ssl-status ssl-renew ssl-init ssl-test ssl-logs ssl-backup ssl-check-config ssl-restart ssl-help security-audit security-audit-domain security-help

# Default target
help:
	@echo "======================================"
	@echo "Instagram Video Downloader - Make Commands"
	@echo "======================================"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev         - Start full stack (app + temporal stack)"
	@echo "  make dev-app     - Start app only (without temporal)"
	@echo "  make stop        - Stop all containers"
	@echo "  make restart     - Restart all containers"
	@echo "  make dev-start   - Start development using script"
	@echo ""
	@echo "Logging Commands:"
	@echo "  make logs        - Show logs for all services"
	@echo "  make logs-app    - Show logs for app services only"
	@echo "  make logs-temporal - Show logs for temporal services only"
	@echo "  make logs-follow - Follow logs for all services"
	@echo ""
	@echo "Maintenance Commands:"
	@echo "  make build       - Build application images"
	@echo "  make clean       - Stop containers and remove volumes"
	@echo "  make status      - Show container status"
	@echo "  make health      - Check health of all services"
	@echo ""
	@echo "Production Commands:"
	@echo "  make verify-communication - Test inter-container communication"
	@echo ""
	@echo "Security Commands:"
	@echo "  make security-audit      - Run comprehensive security audit"
	@echo "  make security-help       - Show detailed security audit help"
	@echo ""
	@echo "Authentication Commands:"
	@echo "  make auth-list   - List NGINX authentication users"
	@echo "  make auth-add    - Add authentication user (prompts for details)"
	@echo "  make auth-remove - Remove authentication user (interactive)"
	@echo "  make auth-change-password - Change password for authentication user (interactive)"
	@echo "  make auth-help   - Show detailed authentication help"
	@echo ""
	@echo "SSL Certificate Commands:"
	@echo "  make ssl-status  - Check SSL certificate status"
	@echo "  make ssl-init    - Initialize SSL certificates (first-time setup)"
	@echo "  make ssl-renew   - Force SSL certificate renewal"
	@echo "  make ssl-test    - Test SSL configuration"
	@echo "  make ssl-logs    - Show SSL/Certbot logs"
	@echo "  make ssl-help    - Show detailed SSL management help"
	@echo ""
	@echo "Examples:"
	@echo "  make dev                    # Full development stack"
	@echo "  make dev-app                # App-only development"
	@echo "  make logs-follow            # Watch real-time logs"
	@echo "  make clean && make dev      # Clean restart"
	@echo "  make security-audit         # Run security audit"
	@echo "  make auth-list              # List authentication users"
	@echo "  make ssl-status             # Check SSL certificate status"

# ====================================
# Development Commands
# ====================================

dev:
	@echo "🚀 Starting full development stack (app + temporal)..."
	$(COMPOSE) --profile temporal up -d
	@echo "✅ Full stack started!"
	@echo ""
	@echo "🌐 Services available at:"
	@echo "  • API: http://localhost:3030"
	@echo "  • Temporal UI: http://localhost:8080"
	@echo ""
	@echo "📋 Use 'make logs' to see logs or 'make status' to check containers"

dev-app:
	@echo "🚀 Starting app-only development (no temporal stack)..."
	$(COMPOSE) up app downloading-worker processing-worker -d
	@echo "✅ App services started!"
	@echo ""
	@echo "🌐 API available at: http://localhost:3030"
	@echo "⚠️  Temporal workers need external Temporal server"
	@echo "   Set TEMPORAL_ADDRESS=your-external-temporal:7233"

stop:
	@echo "🛑 Stopping all containers..."
	$(COMPOSE) --profile temporal down
	@echo "✅ All containers stopped"

restart:
	@echo "🔄 Restarting all containers..."
	$(MAKE) stop
	$(MAKE) dev

dev-start:
	@echo "🚀 Starting development environment using script..."
	./scripts/dev-start.sh

# ====================================
# Logging Commands
# ====================================

logs:
	@echo "📋 Showing logs for all services..."
	$(COMPOSE) --profile temporal logs --tail=100

logs-app:
	@echo "📋 Showing logs for app services..."
	$(COMPOSE) logs app downloading-worker processing-worker --tail=100

logs-temporal:
	@echo "📋 Showing logs for temporal services..."
	$(COMPOSE) logs postgresql temporal temporal-ui --tail=100

logs-follow:
	@echo "📋 Following logs for all services (Ctrl+C to exit)..."
	$(COMPOSE) --profile temporal logs -f

# ====================================
# Maintenance Commands
# ====================================

build:
	@echo "🔨 Building application images..."
	$(COMPOSE) build --no-cache
	@echo "✅ Images built successfully"

clean:
	@echo "🧹 Cleaning up containers, networks and volumes..."
	$(COMPOSE) --profile temporal down -v --remove-orphans
	$(CONTAINER_ENGINE) system prune -f
	@echo "✅ Cleanup completed"

status:
	@echo "📊 Container status:"
	@echo ""
	$(COMPOSE) --profile temporal ps

health:
	@echo "🏥 Checking service health..."
	@echo ""
	@echo "=== Container Status ==="
	$(COMPOSE) --profile temporal ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "=== API Health Check ==="
	@curl -s -o /dev/null -w "API Status: %{http_code}\n" http://localhost:3030/api/ping || echo "API: Not responding"
	@echo ""
	@echo "=== Temporal UI Health Check ==="
	@curl -s -o /dev/null -w "Temporal UI Status: %{http_code}\n" http://localhost:8080 || echo "Temporal UI: Not responding"

# ====================================
# Advanced Development Commands
# ====================================

dev-build:
	@echo "🔨 Building and starting development stack..."
	$(MAKE) build
	$(MAKE) dev

shell-app:
	@echo "🐚 Opening shell in app container..."
	$(COMPOSE) exec app /bin/bash

shell-temporal:
	@echo "🐚 Opening shell in temporal container..."
	$(COMPOSE) exec temporal /bin/bash

# ====================================
# Database Commands
# ====================================

db-logs:
	@echo "📋 Showing PostgreSQL logs..."
	$(COMPOSE) logs postgresql --tail=100

db-shell:
	@echo "🐚 Opening PostgreSQL shell..."
	$(COMPOSE) exec postgresql psql -U temporal -d temporal

# ====================================
# Testing Commands
# ====================================

test-connectivity:
	@echo "🔌 Testing connectivity between services..."
	@echo ""
	@echo "Testing app → temporal connection:"
	$(COMPOSE) exec app nc -zv temporal 7233 || echo "❌ App cannot reach Temporal"
	@echo ""
	@echo "Testing worker → temporal connection:"
	$(COMPOSE) exec downloading-worker nc -zv temporal 7233 || echo "❌ Worker cannot reach Temporal"

# ====================================
# Production Commands
# ====================================

verify-communication:
	@echo "🔍 Starting communication verification..."
	@echo "This will test all inter-container communication paths"
	@if command -v tsx >/dev/null 2>&1; then \
		tsx scripts/verify-communication.ts; \
	else \
		echo "❌ tsx not found. Installing..."; \
		npm install -g tsx; \
		tsx scripts/verify-communication.ts; \
	fi

# ====================================
# Authentication Management Commands
# ====================================

auth-list:
	@echo "👥 Listing NGINX authentication users..."
	@./scripts/manage-nginx-auth.sh list

auth-add:
	@echo "➕ Adding new NGINX authentication user..."
	@read -p "Enter username: " username; \
	if [ -n "$$username" ]; then \
		./scripts/manage-nginx-auth.sh add "$$username"; \
	else \
		echo "❌ Username cannot be empty"; \
	fi

auth-remove:
	@echo "🗑️  Removing NGINX authentication user..."
	@read -p "Enter username to remove: " username; \
	if [ -n "$$username" ]; then \
		./scripts/manage-nginx-auth.sh remove "$$username"; \
	else \
		echo "❌ Username cannot be empty"; \
	fi

auth-change-password:
	@echo "🔑 Changing password for NGINX authentication user..."
	@read -p "Enter username: " username; \
	if [ -n "$$username" ]; then \
		./scripts/manage-nginx-auth.sh change-password "$$username"; \
	else \
		echo "❌ Username cannot be empty"; \
	fi

auth-generate-password:
	@echo "🎲 Generating secure password..."
	@./scripts/manage-nginx-auth.sh generate-secure-password

auth-help:
	@echo "🔐 NGINX Basic Authentication Management"
	@echo "========================================="
	@echo ""
	@echo "Default credentials:"
	@echo "  Username: admin"
	@echo "  Password: temporal"
	@echo ""
	@echo "⚠️  CHANGE THESE CREDENTIALS IN PRODUCTION!"
	@echo ""
	@echo "Available commands:"
	@echo "  make auth-list              - List all users"
	@echo "  make auth-add               - Add new user (interactive)"
	@echo "  make auth-remove            - Remove user (interactive)"
	@echo "  make auth-change-password   - Change user password (interactive)"
	@echo "  make auth-generate-password - Generate secure password"
	@echo ""
	@echo "Direct script usage:"
	@echo "  ./scripts/manage-nginx-auth.sh list"
	@echo "  ./scripts/manage-nginx-auth.sh add username password"
	@echo "  ./scripts/manage-nginx-auth.sh remove username"
	@echo "  ./scripts/manage-nginx-auth.sh change-password username"
	@echo ""
	@echo "File location: docker/nginx/.htpasswd"
	@echo ""
	@echo "This protects the Temporal UI at /temporal/ route"

# ====================================
# SSL Certificate Management Commands
# ====================================

ssl-status:
	@echo "🔒 Checking SSL certificate status..."
	@./scripts/manage-ssl-certificates.sh status

ssl-init:
	@echo "🚀 Initializing SSL certificates..."
	@echo "This will set up SSL certificates for first-time deployment"
	@./scripts/init-ssl-certificates.sh

ssl-renew:
	@echo "🔄 Forcing SSL certificate renewal..."
	@./scripts/manage-ssl-certificates.sh renew

ssl-test:
	@echo "🧪 Testing SSL configuration..."
	@./scripts/manage-ssl-certificates.sh test

ssl-logs:
	@echo "📋 Showing SSL/Certbot logs..."
	@./scripts/manage-ssl-certificates.sh logs

ssl-backup:
	@echo "💾 Backing up SSL certificates..."
	@./scripts/manage-ssl-certificates.sh backup

ssl-check-config:
	@echo "⚙️  Checking SSL configuration..."
	@./scripts/manage-ssl-certificates.sh check-config

ssl-restart:
	@echo "🔄 Restarting Certbot service..."
	@./scripts/manage-ssl-certificates.sh restart-certbot

ssl-help:
	@echo "🔐 SSL Certificate Management"
	@echo "=============================="
	@echo ""
	@echo "SSL certificate management for production deployment"
	@echo ""
	@echo "Available commands:"
	@echo "  make ssl-status         - Check certificate status and expiration"
	@echo "  make ssl-init           - Initialize SSL certificates (first-time setup)"
	@echo "  make ssl-renew          - Force certificate renewal"
	@echo "  make ssl-test           - Test SSL configuration and connectivity"
	@echo "  make ssl-logs           - Show Certbot and renewal logs"
	@echo "  make ssl-backup         - Backup SSL certificates"
	@echo "  make ssl-check-config   - Validate SSL configuration"
	@echo "  make ssl-restart        - Restart Certbot service"
	@echo ""
	@echo "Prerequisites:"
	@echo "  1. Set CERTBOT_DOMAIN and CERTBOT_EMAIL in .env.production"
	@echo "  2. Update docker/nginx/nginx.conf with your domain"
	@echo "  3. Ensure DNS points to your server"
	@echo ""
	@echo "Environment Variables (set in .env.production):"
	@echo "  CERTBOT_DOMAIN=your-domain.com"
	@echo "  CERTBOT_EMAIL=admin@your-domain.com"
	@echo ""
	@echo "Certificate renewal happens automatically every 12 hours"
	@echo "Certificates are renewed when they expire in less than 30 days"
	@echo ""
	@echo "For manual operations:"
	@echo "  ./scripts/manage-ssl-certificates.sh [command]"
	@echo "  ./scripts/init-ssl-certificates.sh [domain] [email]"

# ====================================
# Security Commands
# ====================================

security-audit:
	@echo "🔍 Running comprehensive security audit..."
	@./scripts/security-audit.sh

security-audit-domain:
	@echo "🔍 Running security audit for domain..."
	@./scripts/security-audit-domain.sh

security-help:
	@echo "🔐 Security Audit Management"
	@echo "=============================="
	@echo ""
	@echo "Security audit management for production deployment"
	@echo ""
	@echo "Available commands:"
	@echo "  make security-audit         - Run comprehensive security audit"
	@echo "  make security-audit-domain  - Run security audit for domain"
	@echo ""
	@echo "Prerequisites:"
	@echo "  1. Set CERTBOT_DOMAIN and CERTBOT_EMAIL in .env.production"
	@echo "  2. Update docker/nginx/nginx.conf with your domain"
	@echo "  3. Ensure DNS points to your server"
	@echo ""
	@echo "Environment Variables (set in .env.production):"
	@echo "  CERTBOT_DOMAIN=your-domain.com"
	@echo "  CERTBOT_EMAIL=admin@your-domain.com"
	@echo ""
	@echo "This helps ensure the security of your deployment"
	@echo ""
	@echo "For manual operations:"
	@echo "  ./scripts/security-audit.sh"
	@echo "  ./scripts/security-audit-domain.sh"
