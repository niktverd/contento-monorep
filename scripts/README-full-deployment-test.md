# Full Deployment Test

## Overview

The `full-deployment-test.ts` script validates all PRD success metrics for the deployment reliability initiative. It provides comprehensive end-to-end testing of the deployment infrastructure.

## What it Tests

The script validates all 8 success metrics from the PRD:

1. **health-check.sh exit code = 0** - Ensures health check passes
2. **e2e-deploy-test.ts failures = 0** - Validates E2E deployment tests
3. **Temporal UI shows active workers (≥2 queues)** - Checks worker registration
4. **Application connects to app_db** - Verifies app database connection via logs
5. **Temporal connects to temporal DB** - Ensures Temporal database connectivity
6. **All migrations applied** - Validates latest migration in knex_migrations table
7. **Deployment duration overhead < +90s** - Measures deployment time
8. **Database isolation verified** - Confirms app_user cannot access temporal DB

## Usage

### Local Testing (Development)

```bash
# Run without deployed containers (will show expected failures)
npx tsx scripts/full-deployment-test.ts
```

### Production Testing (After Deployment)

```bash
# Run after successful deployment to validate all metrics
export POSTGRES_PASSWORD="your-postgres-password"
export APP_POSTGRES_PASSWORD="your-app-postgres-password"
export DATABASE_URL="postgresql://temporal:${POSTGRES_PASSWORD}@postgresql:5432/temporal"
export APP_DATABASE_URL="postgresql://app_user:${APP_POSTGRES_PASSWORD}@postgresql:5432/app_db"

npx tsx scripts/full-deployment-test.ts
```

### CI/CD Integration

Add to your deployment pipeline after the deployment step:

```yaml
- name: Validate Deployment
  run: |
    export DATABASE_URL="postgresql://temporal:${{ secrets.POSTGRES_PASSWORD }}@postgresql:5432/temporal"
    export APP_DATABASE_URL="postgresql://app_user:${{ secrets.APP_POSTGRES_PASSWORD }}@postgresql:5432/app_db"
    npx tsx scripts/full-deployment-test.ts
```

## Expected Output

### Successful Deployment

```
🚀 Starting Full End-to-End Deployment Test
📊 Validating all PRD Success Metrics

✅ health-check.sh exit code: 0 (target: 0)
✅ e2e-deploy-test.ts failures: 0 (target: 0)
✅ Temporal UI shows active workers: 2 workers running (target: ≥2 queues active)
✅ Application connects to app_db: Connected to app_db (target: Verified via startup logs)
✅ Temporal connects to temporal DB: Temporal healthy (target: Verified via UI/health)
✅ All migrations applied: 20252201120000_create_cloud_run_scenario_executions_table applied (target: Latest migration ID in knex_migrations table)
✅ Deployment duration overhead: 12.3s (validation only) (target: < +90s versus current)
✅ Database isolation verified: Isolation working (target: app_user cannot access temporal DB)

================================================================================
📈 FULL DEPLOYMENT TEST REPORT
================================================================================

📊 Overall Result: ✅ PASSED (8/8 metrics)
🎉 All PRD success metrics passed! Deployment is healthy.
✅ Ready for production use.
```

### Failed Deployment

```
❌ Overall Result: ❌ FAILED (2/8 metrics)

❌ Some metrics failed. Review the results above and check:
   - Docker containers are running properly
   - Database connections are established
   - Migrations completed successfully
   - Temporal workers are registered
   - Database isolation is working
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**

   - Ensure `DATABASE_URL` and `APP_DATABASE_URL` are set
   - Verify `POSTGRES_PASSWORD` and `APP_POSTGRES_PASSWORD` are available

2. **Container Not Running**

   - Check `docker-compose -f docker-compose.prod.yml ps`
   - Verify all services are in 'running' state

3. **Database Connection Failed**

   - Check PostgreSQL container health
   - Verify database credentials and network connectivity

4. **Migration Issues**
   - Check migrations container logs: `docker-compose logs migrations`
   - Verify knexfile.js configuration

## Related Files

- `scripts/health-check.sh` - Individual health checks
- `scripts/e2e-deploy-test.ts` - End-to-end deployment tests
- `scripts/verify-db-isolation.ts` - Database isolation verification
- `docs/DEPLOYMENT_GUIDE.md` - Comprehensive deployment documentation

## Integration with Task Management

This script fulfills **Task 5.10** from the PRD deployment fix initiative:

- ✅ Run full end-to-end test deployment and verify all PRD success metrics
