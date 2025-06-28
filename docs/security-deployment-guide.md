# Security Deployment Guide

## Overview

This guide covers the comprehensive security measures implemented in the Instagram Video Downloader production deployment. The architecture follows security best practices with defense-in-depth principles.

## Security Architecture

```
[Internet] → [NGINX :80/443] → [Internal Network]
                ↓                    ↓
        [SSL + Auth + Headers]   [Isolated Services]
                                      ↓
                              [App + Workers + DB + Temporal]
```

### Key Security Features

- **Network Isolation**: Only NGINX exposed externally on ports 80/443
- **SSL Termination**: Automatic Let's Encrypt SSL with modern TLS protocols
- **Authentication**: Basic auth protection for administrative interfaces
- **Security Headers**: Comprehensive HTTP security headers
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Container Security**: Non-root users, resource limits, health checks

## SSL/TLS Configuration

### Supported Protocols

- **TLS 1.2**: Enabled ✅
- **TLS 1.3**: Enabled ✅
- **TLS 1.1**: Disabled ❌
- **TLS 1.0**: Disabled ❌
- **SSLv3**: Disabled ❌

### SSL Features

- **HSTS**: HTTP Strict Transport Security enabled
- **OCSP Stapling**: Enabled for improved performance
- **Perfect Forward Secrecy**: Supported cipher suites
- **Automatic Renewal**: Certificates renewed 30 days before expiry

### Certificate Management

```bash
# Initialize SSL certificates
make ssl-init

# Check certificate status
make ssl-status

# Force renewal
make ssl-renew

# Test SSL configuration
make ssl-test
```

## Security Headers

| Header                      | Value                             | Purpose                       |
| --------------------------- | --------------------------------- | ----------------------------- |
| `Strict-Transport-Security` | `max-age=63072000`                | HSTS enforcement              |
| `X-Frame-Options`           | `DENY`                            | Clickjacking protection       |
| `X-Content-Type-Options`    | `nosniff`                         | MIME type sniffing protection |
| `X-XSS-Protection`          | `1; mode=block`                   | XSS filtering                 |
| `Content-Security-Policy`   | `default-src 'self'`              | Content restriction           |
| `Referrer-Policy`           | `strict-origin-when-cross-origin` | Referrer control              |

## Authentication & Authorization

### Temporal UI Protection

- **Location**: `/temporal/`
- **Method**: HTTP Basic Authentication
- **Default Credentials**:
  - Username: `admin`
  - Password: `temporal`
- **⚠️ CRITICAL**: Change default credentials in production

```bash
# Manage authentication
make auth-list              # List users
make auth-add               # Add user
make auth-remove            # Remove user
make auth-change-password   # Change password
```

### API Endpoints

- **Public Access**: `/api/`, `/health`, `/metrics`
- **Rate Limited**: 10 requests/second for API, 5 requests/second for Temporal UI
- **No Authentication**: Public endpoints for application functionality

## Network Security

### Port Exposure

- **External Ports**: Only 80 (HTTP) and 443 (HTTPS)
- **Internal Services**: All isolated within Docker network
- **Service Communication**: Internal network only

| Service         | External Access  | Internal Port | Purpose               |
| --------------- | ---------------- | ------------- | --------------------- |
| NGINX           | ✅ Ports 80/443  | -             | Reverse proxy         |
| App             | ❌ Internal only | 8080          | API server            |
| Temporal UI     | ❌ Via NGINX     | 8080          | Web interface         |
| Temporal Server | ❌ Internal only | 7233          | Workflow engine       |
| PostgreSQL      | ❌ Internal only | 5432          | Database              |
| Workers         | ❌ Internal only | -             | Background processing |

### Rate Limiting

```nginx
# API endpoints
limit_req zone=api burst=20 nodelay;

# Temporal UI
limit_req zone=temporal_ui burst=10 nodelay;
```

## Container Security

### Security Measures

- **Non-root Execution**: All containers run as `appuser` (UID 1001)
- **Init System**: Tini for proper signal handling and zombie reaping
- **Resource Limits**: CPU and memory constraints prevent resource exhaustion
- **Health Checks**: Automated health monitoring for all services
- **Restart Policies**: Automatic recovery from failures

### Dockerfile Security Features

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Switch to non-root user
USER appuser

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider --timeout=5 http://localhost:8080/health || exit 1
```

## Security Monitoring

### Automated Security Audit

Run comprehensive security audits:

```bash
# Local configuration audit
make security-audit

# Domain-specific audit (requires .env.production)
make security-audit-domain

# View security help
make security-help
```

### Security Audit Coverage

The security audit script checks:

- ✅ Port exposure and network isolation
- ✅ SSL/TLS configuration and protocols
- ✅ Security headers presence and configuration
- ✅ Authentication mechanisms
- ✅ Container security settings
- ✅ NGINX security configuration
- ✅ Environment variable security

### External Security Testing

For production deployments, run these external security tests:

#### SSL Labs Test

Test SSL configuration:

```
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

**Target Grade**: A or A+

#### Security Headers Test

Verify HTTP security headers:

```
https://securityheaders.com/?q=your-domain.com
```

**Target Grade**: A or A+

#### Mozilla Observatory

Comprehensive security assessment:

```
https://observatory.mozilla.org/analyze/your-domain.com
```

**Target Score**: 90+ points

#### Shodan Security Scan

Check for exposed services:

```
https://www.shodan.io/search?query=your-domain.com
```

**Expected**: Only ports 80/443 visible

## Security Checklist

### Pre-Deployment

- [ ] Change default authentication credentials
- [ ] Set strong passwords for all accounts
- [ ] Configure proper domain in NGINX config
- [ ] Set secure environment variables
- [ ] Review and customize security headers
- [ ] Test SSL configuration locally

### Post-Deployment

- [ ] Run security audit script
- [ ] Test SSL Labs grade (A or A+)
- [ ] Verify security headers
- [ ] Check Mozilla Observatory score
- [ ] Test authentication on Temporal UI
- [ ] Verify rate limiting works
- [ ] Monitor security logs

### Ongoing Security

- [ ] Monthly SSL certificate checks
- [ ] Quarterly security audits
- [ ] Regular dependency updates
- [ ] Security header validation
- [ ] Authentication log monitoring
- [ ] Rate limiting effectiveness review

## Security Incident Response

### Certificate Issues

```bash
# Check certificate status
make ssl-status

# Force renewal if needed
make ssl-renew

# Check renewal logs
make ssl-logs
```

### Authentication Bypass Attempts

```bash
# Check NGINX access logs
docker compose -f docker-compose.prod.yml logs nginx | grep "401\|403"

# Review authentication configuration
make auth-list
```

### Rate Limiting Violations

```bash
# Check for rate limit violations
docker compose -f docker-compose.prod.yml logs nginx | grep "limiting"

# Review rate limiting configuration
grep -A 5 "limit_req_zone" docker/nginx/nginx.conf
```

## Security Updates

### Regular Updates

1. **Dependencies**: Update Node.js packages monthly
2. **Base Images**: Update Docker base images quarterly
3. **NGINX**: Update to latest stable version
4. **SSL Certificates**: Automatic renewal via Certbot

### Security Patch Process

1. Review security advisories
2. Test updates in staging environment
3. Schedule maintenance window
4. Apply updates with rollback plan
5. Verify security configuration post-update

## Environment Security

### Sensitive Data Protection

- All secrets stored in `.env.production` (gitignored)
- File permissions set to 600 (owner read/write only)
- No hardcoded credentials in source code
- Environment variables for all configuration

### Secure Environment Variables

```bash
# Required production variables
POSTGRES_PASSWORD=secure-random-password
CERTBOT_DOMAIN=your-domain.com
CERTBOT_EMAIL=admin@your-domain.com
DATABASE_URL=postgresql://user:pass@postgresql:5432/temporal
```

## Compliance Considerations

### Data Protection

- **Encryption in Transit**: TLS 1.2/1.3 for all external communication
- **Encryption at Rest**: Database and file system encryption recommended
- **Access Controls**: Authentication required for administrative interfaces
- **Audit Logging**: Comprehensive logging for security events

### Security Standards

- **OWASP Top 10**: Protection against common web vulnerabilities
- **CIS Docker Benchmark**: Container security best practices
- **NIST Cybersecurity Framework**: Comprehensive security controls

## Troubleshooting

### Common Security Issues

#### SSL Certificate Problems

```bash
# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443

# Check certificate renewal logs
make ssl-logs
```

#### Authentication Issues

```bash
# Verify .htpasswd file
make auth-list

# Test authentication
curl -I https://your-domain.com/temporal/

# Expected: 401 Unauthorized
```

#### Rate Limiting Issues

```bash
# Test rate limiting
for i in {1..15}; do curl -I https://your-domain.com/api/; done

# Check for 429 Too Many Requests after burst limit
```

## Additional Resources

- [NGINX Security Best Practices](https://nginx.org/en/docs/http/security.html)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [Mozilla Security Guidelines](https://wiki.mozilla.org/Security/Guidelines/Web_Security)

---

**⚠️ Security Notice**: This deployment includes strong security measures, but security is an ongoing process. Regularly review and update security configurations, monitor for threats, and stay informed about security best practices and emerging threats.
