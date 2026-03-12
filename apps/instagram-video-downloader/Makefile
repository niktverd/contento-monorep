# ====================================
# Instagram Video Downloader – Local Development Makefile
# ====================================

# Container engine auto-detection (Docker by default, Podman if present)
CONTAINER_ENGINE ?= $(shell command -v podman >/dev/null 2>&1 && echo "podman" || echo "docker")

# Compose command selection
ifeq ($(CONTAINER_ENGINE),podman)
    COMPOSE_CMD = $(shell podman compose version >/dev/null 2>&1 && echo "podman compose" || echo "podman-compose")
else
    COMPOSE_CMD = docker compose
endif

# Development compose file and env vars
COMPOSE_FILE_PATH = docker-compose.dev.yml
ENV_FILE_PATH     = .env.development
COMPOSE           = $(COMPOSE_CMD) -f $(COMPOSE_FILE_PATH) --env-file $(ENV_FILE_PATH)

.PHONY: help dev dev-app stop restart \
        logs logs-app logs-temporal logs-follow \
        build clean status health \
        shell-app shell-temporal db-shell db-logs

# ------------------------------------
# Help
# ------------------------------------
help:
	@echo "Local development commands:"
	@echo "  make dev           – Start infra (Postgres + Temporal)"
	@echo "  make dev-app       – Start app only (no Temporal)"
	@echo "  make stop          – Stop containers"
	@echo "  make restart       – Stop & start again"
	@echo "  make logs          – Show logs for all services"
	@echo "  make logs-follow   – Follow logs"
	@echo "  make build         – Build images"
	@echo "  make clean         – Remove containers / volumes"
	@echo "  make status        – Container status"
	@echo "  make health        – Quick health check"
	@echo "  make shell-app     – Bash into app container"
	@echo "  make shell-temporal– Bash into temporal container"
	@echo "  make db-shell      – psql into DB"
	@echo "  make db-logs       – Show PostgreSQL logs"

# ------------------------------------
# Core dev targets
# ------------------------------------

dev:
	@echo "🚀 Starting Postgres + Temporal containers..."
	$(COMPOSE) --profile temporal up -d postgresql temporal temporal-ui


# Start without Temporal (app + workers only)
dev-app:
	@echo "🚀 Starting app services..."
	$(COMPOSE) up -d app downloading-worker processing-worker


# Stop / restart
stop:
	@echo "🛑 Stopping containers..."
	$(COMPOSE) --profile temporal down

restart: stop dev


# ------------------------------------
# Logs
# ------------------------------------

logs:
	$(COMPOSE) --profile temporal logs --tail=100

logs-app:
	$(COMPOSE) logs app downloading-worker processing-worker --tail=100

logs-temporal:
	$(COMPOSE) logs postgresql temporal temporal-ui --tail=100

logs-follow:
	$(COMPOSE) --profile temporal logs -f


# ------------------------------------
# Maintenance
# ------------------------------------

build:
	$(COMPOSE) build --no-cache

clean:
	$(COMPOSE) --profile temporal down -v --remove-orphans
	$(CONTAINER_ENGINE) system prune -f

status:
	$(COMPOSE) --profile temporal ps

health:
	@$(COMPOSE) --profile temporal ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@curl -s -o /dev/null -w "API Status: %{http_code}\n" http://localhost:3030/api/ping || true


# ------------------------------------
# Shell helpers
# ------------------------------------

shell-app:
	$(COMPOSE) exec app /bin/bash

shell-temporal:
	$(COMPOSE) exec temporal /bin/bash


# ------------------------------------
# Database helpers
# ------------------------------------

db-logs:
	$(COMPOSE) logs postgresql --tail=100

db-shell:
	$(COMPOSE) exec postgresql psql -U temporal -d temporal
