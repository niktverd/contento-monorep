# NGINX Configuration for Production

This directory contains NGINX configuration files for the Instagram Video Downloader production deployment.

## Files

- `nginx.conf` - Production NGINX configuration with SSL termination, reverse proxy, and security features
- `nginx.dev.conf` - Development NGINX configuration (HTTP only, no authentication)
- `.htpasswd` - Basic authentication file for protecting Temporal UI access

## Features

### Production (`nginx.conf`)

- **SSL Termination**: Automatic HTTPS with Let's Encrypt certificates
- **Security Headers**: XSS protection, HSTS, Content Security Policy
- **Rate Limiting**: API (10 req/s), Temporal UI (5 req/s)
- **Basic Authentication**: Protects Temporal UI routes
- **Reverse Proxy**: Routes traffic to internal services
- **Performance**: Gzip compression, connection pooling, caching

### Development (`nginx.dev.conf`)

- **HTTP Only**: No SSL configuration
- **No Authentication**: Direct access to all services
- **Simple Proxy**: Basic reverse proxy setup

## Authentication Management

### Default Credentials

- **Username**: `admin`
- **Password**: `temporal`

⚠️ **Change these credentials in production!**

### Managing Users

Use the provided script to manage authentication:

```bash
# List all users
./scripts/manage-nginx-auth.sh list

# Add a new user (prompts for password)
./scripts/manage-nginx-auth.sh add johndoe

# Add a user with specified password
./scripts/manage-nginx-auth.sh add johndoe securepass123

# Change password for existing user
./scripts/manage-nginx-auth.sh change-password admin

# Remove a user
./scripts/manage-nginx-auth.sh remove johndoe

# Generate a secure password
./scripts/manage-nginx-auth.sh generate-secure-password

# Verify credentials (Linux only)
./scripts/manage-nginx-auth.sh verify admin temporal
```

### Manual Management

You can also manage the `.htpasswd` file manually using `htpasswd`:

```bash
# Add/update user with bcrypt hashing (recommended)
htpasswd -B docker/nginx/.htpasswd username

# Remove user
htpasswd -D docker/nginx/.htpasswd username

# Create new file (overwrites existing)
htpasswd -c -B docker/nginx/.htpasswd username
```

## SSL Certificates

### Production Setup

1. Update `nginx.conf` with your actual domain name
2. Set environment variables for Certbot:
   ```bash
   export CERTBOT_EMAIL=your-email@domain.com
   export CERTBOT_DOMAIN=your-domain.com
   ```
3. Let's Encrypt certificates are automatically generated and renewed

### Certificate Locations

- **Certificates**: `/etc/letsencrypt/live/your-domain.com/`
- **Webroot**: `/var/www/certbot/` (for ACME challenge)

## Routes

### Production Routes

- `GET /` → Express.js API root
- `GET /api/*` → Express.js API endpoints (rate limited)
- `GET /health` → Health check endpoint
- `GET /metrics` → Metrics endpoint
- `GET /temporal/*` → Temporal UI (basic auth protected, rate limited)

### Security

- Only ports 80 and 443 are exposed externally
- All internal services communicate via private network
- Basic authentication protects administrative interfaces
- Rate limiting prevents abuse
- Security headers protect against common attacks

## Environment Variables

Key NGINX-related variables in `.env.production`:

```bash
# Domain configuration
NGINX_HOST=your-domain.com
CERTBOT_EMAIL=admin@your-domain.com
CERTBOT_DOMAIN=your-domain.com

# Service configuration
API_PORT=8080
TEMPORAL_UI_PORT=8080
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**

   ```bash
   # Check certificate status
   docker-compose exec nginx ls -la /etc/letsencrypt/live/your-domain.com/

   # Force certificate renewal
   docker-compose exec certbot certbot renew --force-renewal
   ```

2. **Authentication Issues**

   ```bash
   # Verify .htpasswd file exists and is readable
   docker-compose exec nginx cat /etc/nginx/.htpasswd

   # Check NGINX error logs
   docker-compose logs nginx
   ```

3. **Rate Limiting Issues**
   ```bash
   # Check if rate limiting is triggering
   docker-compose exec nginx tail -f /var/log/nginx/error.log | grep limit_req
   ```

### Logs

- **Access Logs**: `/var/log/nginx/access.log`
- **Error Logs**: `/var/log/nginx/error.log`
- **Certificate Logs**: `/var/log/letsencrypt/letsencrypt.log`

```bash
# View NGINX logs
docker-compose logs -f nginx

# View certificate logs
docker-compose logs -f certbot
```

## Testing

### Local Testing

```bash
# Test configuration syntax
docker-compose exec nginx nginx -t

# Reload configuration without restart
docker-compose exec nginx nginx -s reload

# Test authentication
curl -u admin:temporal https://your-domain.com/temporal/
```

### Health Checks

```bash
# NGINX health
curl http://localhost/health

# SSL configuration test
curl -I https://your-domain.com/

# Rate limiting test
for i in {1..15}; do curl -w "%{http_code}\n" -o /dev/null -s http://localhost/api/; done
```

## Security Considerations

1. **Change Default Credentials**: Update admin password immediately
2. **Restrict Access**: Consider IP whitelisting for admin interfaces
3. **Monitor Logs**: Set up log monitoring for security events
4. **Update Regularly**: Keep NGINX and certificates up to date
5. **Backup Configuration**: Include `.htpasswd` in backups

## Performance Tuning

The configuration includes production-ready performance optimizations:

- **Worker Processes**: Auto-scaled to CPU cores
- **Connection Pooling**: Upstream keepalive connections
- **Compression**: Gzip for text-based content
- **Caching**: Static asset caching headers
- **HTTP/2**: Enabled for better performance

For high-traffic scenarios, consider:

- Increasing worker connections
- Tuning rate limits
- Adding load balancer upstream
- Implementing caching layer
