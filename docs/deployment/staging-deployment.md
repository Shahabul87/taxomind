# Staging Environment Deployment Guide

## Overview

The staging environment serves as a pre-production testing ground that mirrors production configuration while allowing for thorough testing and validation before release.

## Prerequisites

### Access Requirements
- SSH access to staging servers
- AWS/Cloud provider console access
- Database admin credentials
- Container registry access
- CI/CD pipeline permissions
- VPN access (if required)

### Tools Required
```bash
# Required CLI tools
aws --version      # AWS CLI
kubectl version    # Kubernetes CLI (if using K8s)
docker --version   # Docker CLI
psql --version     # PostgreSQL client
redis-cli --version # Redis client
```

## Environment Configuration

### Staging Environment Variables

```env
# Application Configuration
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.taxomind.com

# CRITICAL: Enable strict environment mode for staging
STRICT_ENV_MODE=true
BLOCK_CROSS_ENV=true
AUDIT_ENABLED=true

# Database Configuration (Managed PostgreSQL)
DATABASE_URL="postgresql://taxomind_staging:${DB_PASSWORD}@staging-db.taxomind.internal:5432/taxomind_staging?schema=public&sslmode=require"

# Authentication (NextAuth.js v5)
NEXTAUTH_URL=https://staging.taxomind.com
AUTH_SECRET=${STAGING_AUTH_SECRET}
NEXTAUTH_SECRET=${STAGING_AUTH_SECRET}

# TOTP/MFA Encryption
ENCRYPTION_MASTER_KEY=${STAGING_ENCRYPTION_KEY}

# Admin MFA Enforcement
ADMIN_MFA_ENFORCEMENT_ENABLED=true
ADMIN_MFA_GRACE_PERIOD_DAYS=3
ADMIN_MFA_WARNING_PERIOD_DAYS=1

# Redis Cache
UPSTASH_REDIS_REST_URL=${STAGING_REDIS_URL}
UPSTASH_REDIS_REST_TOKEN=${STAGING_REDIS_TOKEN}

# External Services
CLOUDINARY_API_KEY=${STAGING_CLOUDINARY_KEY}
CLOUDINARY_API_SECRET=${STAGING_CLOUDINARY_SECRET}
OPENAI_API_KEY=${STAGING_OPENAI_KEY}

# Monitoring
SENTRY_DSN=${STAGING_SENTRY_DSN}
NEW_RELIC_APP_NAME=taxomind-staging
NEW_RELIC_LICENSE_KEY=${STAGING_NEW_RELIC_KEY}

# Feature Flags
ENABLE_EXPERIMENTAL_FEATURES=true
ENABLE_DEBUG_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
```

## Pre-Deployment Checklist

### Code Validation
```bash
# 1. Validate environment configuration
npm run validate:env:staging

# 2. Run comprehensive tests
npm run test:ci              # All unit tests
npm run test:integration     # Integration tests
npm run test:performance     # Performance benchmarks

# 3. Security validation
npm run security:audit       # Security audit
npm run pentest             # Penetration testing framework
npm run validate:csp        # CSP validation

# 4. Build validation
npm run build:validate      # Build with all validations
npm run performance:check   # Check bundle sizes

# 5. Enterprise deployment validation
npm run enterprise:validate
npm run enterprise:health
```

### Database Preparation
```bash
# 1. Backup current staging database
pg_dump -h staging-db.taxomind.internal -U taxomind_staging -d taxomind_staging > staging_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify migrations
npx prisma migrate status

# 3. Test migrations locally with staging data
npx prisma migrate dev --preview-feature
```

## Deployment Process

### Step 1: Prepare Deployment Package

```bash
# 1. Create deployment branch from staging
git checkout staging
git pull origin staging
git checkout -b deploy/staging-$(date +%Y%m%d)

# 2. Validate branch state
git status
npm run lint              # CRITICAL: Must pass all ESLint rules
npm run typecheck        # TypeScript validation

# 3. Update version
npm version prerelease --preid=staging

# 4. Build optimized application
NODE_ENV=staging npm run build:optimized

# 5. Create Docker image with proper build args
docker build \
  --build-arg NODE_ENV=staging \
  --build-arg NEXT_PUBLIC_APP_URL=https://staging.taxomind.com \
  -t taxomind:staging-$(git rev-parse --short HEAD) .

# 6. Test image locally
docker run --rm -p 3000:3000 \
  taxomind:staging-$(git rev-parse --short HEAD) \
  npm run validate:startup

# 7. Push to registry
docker tag taxomind:staging-$(git rev-parse --short HEAD) registry.taxomind.com/taxomind:staging-latest
docker push registry.taxomind.com/taxomind:staging-latest
```

### Step 2: Database Migration

```bash
# 1. Connect to staging database
psql -h staging-db.taxomind.internal -U taxomind_staging -d taxomind_staging

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify migration success
npx prisma migrate status

# 4. Run data validation scripts
npm run db:validate:staging
```

### Step 3: Deploy Application

#### Using Kubernetes
```bash
# 1. Update deployment configuration
kubectl set image deployment/taxomind-staging \
  taxomind=registry.taxomind.com/taxomind:staging-latest \
  --namespace=staging

# 2. Monitor rollout
kubectl rollout status deployment/taxomind-staging --namespace=staging

# 3. Verify pods are running
kubectl get pods --namespace=staging

# 4. Check application logs
kubectl logs -f deployment/taxomind-staging --namespace=staging
```

#### Using Docker Compose
```bash
# 1. SSH to staging server
ssh staging.taxomind.com

# 2. Pull latest image
docker-compose pull

# 3. Stop current containers
docker-compose down

# 4. Start new containers
docker-compose up -d

# 5. Verify containers
docker-compose ps

# 6. Check logs
docker-compose logs -f
```

#### Using PM2
```bash
# 1. SSH to staging server
ssh staging.taxomind.com

# 2. Pull latest code
git pull origin staging

# 3. Install dependencies
npm ci

# 4. Build application
npm run build

# 5. Restart PM2 process
pm2 reload ecosystem.staging.config.js

# 6. Monitor status
pm2 status
pm2 logs
```

### Step 4: Post-Deployment Verification

```bash
# 1. Health check
curl https://staging.taxomind.com/api/health

# 2. Run smoke tests
npm run test:smoke:staging

# 3. Verify critical endpoints
npm run test:api:staging

# 4. Check monitoring dashboards
npm run enterprise:health
```

## Deployment Scripts

### Automated Staging Deployment
```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "Starting staging deployment..."

# 1. Validation
npm run enterprise:validate

# 2. Build and test
npm run build
npm run test

# 3. Database backup
echo "Backing up database..."
pg_dump -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Deploy
npm run enterprise:deploy:staging

# 5. Health check
sleep 30
curl -f https://staging.taxomind.com/api/health || exit 1

echo "Staging deployment completed successfully!"
```

### Rollback Script
```bash
#!/bin/bash
# rollback-staging.sh

set -e

echo "Starting rollback..."

# 1. Get previous version
PREVIOUS_VERSION=$(kubectl get deployment taxomind-staging -o jsonpath='{.metadata.annotations.previous-version}')

# 2. Rollback deployment
kubectl set image deployment/taxomind-staging \
  taxomind=registry.taxomind.com/taxomind:$PREVIOUS_VERSION \
  --namespace=staging

# 3. Wait for rollback
kubectl rollout status deployment/taxomind-staging --namespace=staging

# 4. Verify health
curl -f https://staging.taxomind.com/api/health || exit 1

echo "Rollback completed successfully!"
```

## Monitoring and Validation

### Application Monitoring
```bash
# Check application metrics
curl https://staging.taxomind.com/api/metrics

# View real-time logs
kubectl logs -f deployment/taxomind-staging --namespace=staging --tail=100

# Check error rates
kubectl exec -it deployment/taxomind-staging -- npm run metrics:errors
```

### Database Monitoring
```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'taxomind_staging';

-- Check slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Testing
```bash
# Run load tests
npm run test:load:staging

# Check response times
ab -n 1000 -c 10 https://staging.taxomind.com/

# Monitor resource usage
kubectl top pods --namespace=staging
kubectl top nodes
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Deployment Fails
```bash
# Check deployment status
kubectl describe deployment taxomind-staging --namespace=staging

# View events
kubectl get events --namespace=staging --sort-by='.lastTimestamp'

# Check pod status
kubectl get pods --namespace=staging
kubectl describe pod <pod-name> --namespace=staging
```

#### 2. Database Migration Errors
```bash
# Check migration status
npx prisma migrate status

# Resolve pending migrations
npx prisma migrate resolve --applied <migration-name>

# Reset if needed (CAUTION: Data loss)
npx prisma migrate reset --skip-seed
```

#### 3. Application Crashes
```bash
# Check logs
kubectl logs deployment/taxomind-staging --namespace=staging --previous

# Increase resources if needed
kubectl set resources deployment/taxomind-staging \
  --limits=memory=2Gi,cpu=2 \
  --requests=memory=1Gi,cpu=500m \
  --namespace=staging
```

#### 4. Performance Issues
```bash
# Check resource usage
kubectl top pods --namespace=staging

# Scale horizontally
kubectl scale deployment taxomind-staging --replicas=3 --namespace=staging

# Clear cache
redis-cli -h staging-redis.taxomind.internal FLUSHALL
```

## Security Considerations

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name staging.taxomind.com;
    
    ssl_certificate /etc/ssl/certs/staging.taxomind.com.crt;
    ssl_certificate_key /etc/ssl/private/staging.taxomind.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Access Control
```bash
# Restrict staging access by IP
iptables -A INPUT -p tcp --dport 443 -s <allowed-ip-range> -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j DROP

# Enable basic authentication
htpasswd -c /etc/nginx/.htpasswd staging_user
```

### Audit Logging
```bash
# Enable audit logging
export ENABLE_AUDIT_LOG=true

# View audit logs
npm run enterprise:audit

# Archive audit logs
tar -czf audit_logs_$(date +%Y%m%d).tar.gz /var/log/taxomind/audit/
```

## Staging-Specific Features

### Feature Flags
```typescript
// Feature flag configuration for staging
const stagingFeatures = {
  enableBetaFeatures: true,
  enableDebugMode: true,
  enablePerformanceMonitoring: true,
  enableExperimentalAI: true,
  mockPaymentGateway: true,
  verboseLogging: true
};
```

### Test Data Management
```bash
# Seed staging with test data
npm run db:seed:staging

# Reset staging data
npm run db:reset:staging

# Import production snapshot (sanitized)
npm run db:import:staging --source=prod-sanitized.sql
```

## Validation Procedures

### Functional Testing
```bash
# Run functional test suite
npm run test:functional:staging

# Test user workflows
npm run test:e2e:staging

# API contract testing
npm run test:contract:staging
```

### Performance Validation
```bash
# Load testing
npm run test:load:staging -- --users=100 --duration=5m

# Stress testing
npm run test:stress:staging -- --users=500 --duration=10m

# Endurance testing
npm run test:endurance:staging -- --users=50 --duration=1h
```

### Security Validation
```bash
# Run security scan
npm run security:scan:staging

# Penetration testing
npm run pentest:staging

# Vulnerability assessment
npm run vulnerability:check:staging
```

## Staging Maintenance

### Regular Tasks
```bash
# Daily
- Monitor error logs
- Check disk usage
- Verify backups

# Weekly
- Update dependencies
- Run security scans
- Performance analysis

# Monthly
- Database optimization
- Clean up old logs
- Update SSL certificates
```

### Cleanup Scripts
```bash
#!/bin/bash
# cleanup-staging.sh

# Remove old logs
find /var/log/taxomind -type f -mtime +30 -delete

# Clean Docker images
docker image prune -a --filter "until=168h"

# Vacuum database
psql -h staging-db.taxomind.internal -U taxomind_staging -d taxomind_staging -c "VACUUM ANALYZE;"

# Clear Redis cache
redis-cli -h staging-redis.taxomind.internal FLUSHDB
```

## Documentation

### Deployment Log Template
```markdown
## Deployment Log - [Date]

**Version**: x.x.x-staging.x
**Deployed By**: [Name]
**Start Time**: [Time]
**End Time**: [Time]

### Changes
- Feature: [Description]
- Fix: [Description]
- Update: [Description]

### Validation
- [ ] Build successful
- [ ] Tests passed
- [ ] Database migrated
- [ ] Health check passed
- [ ] Smoke tests passed

### Issues
- None / [Description]

### Notes
[Any additional notes]
```

## Support and Escalation

### Contact Information
- DevOps Team: devops@taxomind.com
- Staging Environment Lead: staging-lead@taxomind.com
- Emergency Hotline: +1-xxx-xxx-xxxx

### Escalation Path
1. Level 1: DevOps Engineer on-call
2. Level 2: Senior DevOps Engineer
3. Level 3: Infrastructure Lead
4. Level 4: CTO

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Environment: Staging*