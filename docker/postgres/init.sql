-- Initializes PostgreSQL with separate schemas for
--   • application tables (schema: app)
--   • Temporal workflow tables (schema: temporal)
-- This file is executed automatically by the official postgres image
-- when the database volume is first created (placed in
-- /docker-entrypoint-initdb.d/ by docker-compose).

-- Create schemas if they don't already exist
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS temporal;

-- Optional: make PUBLIC schema read-only (security hardening)
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Grant privileges to default database user (set via POSTGRES_USER env var)
-- so it can create objects inside our new schemas.
GRANT ALL ON SCHEMA app      TO :"POSTGRES_USER";
GRANT ALL ON SCHEMA temporal TO :"POSTGRES_USER";

-- Set search_path default for new connections (app first, then temporal)
ALTER DATABASE :"POSTGRES_DB" SET search_path = app, temporal, public; 
