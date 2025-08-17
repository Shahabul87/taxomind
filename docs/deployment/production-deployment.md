# Production Deployment Guide

## Critical Production Requirements

### Pre-Deployment Authorization
- **Change Advisory Board (CAB) Approval**: Required for all production deployments
- **Deployment Window**: Scheduled maintenance windows only (typically 2-6 AM UTC)
- **Rollback Plan**: Documented and tested rollback procedure required
- **Stakeholder Notification**: 48-hour advance notice to all stakeholders

### Access Control
- **Multi-Factor Authentication**: Required for all production access
- **Privileged Access Management (PAM)**: Time-limited elevated permissions
- **Audit Trail**: All actions logged and monitored
- **Approval Chain**: Two-person authorization for critical operations

## Production Environment Configuration

### Environment Variables (Secured in Vault)
```env
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.taxomind.com

# CRITICAL: Enterprise security features MUST be enabled
STRICT_ENV_MODE=true
BLOCK_CROSS_ENV=true
AUDIT_ENABLED=true

# Database Configuration (High Availability PostgreSQL Cluster)
DATABASE_URL="postgresql://${PROD_DB_USER}:${PROD_DB_PASS}@prod-db-primary.taxomind.internal:5432/taxomind_prod?schema=public&sslmode=require&connection_limit=50"

# Authentication (NextAuth.js v5)
NEXTAUTH_URL=https://app.taxomind.com
AUTH_SECRET=${PROD_AUTH_SECRET}  # 32+ characters, rotated monthly
NEXTAUTH_SECRET=${PROD_AUTH_SECRET}

# TOTP/MFA Encryption (64 hex characters)
ENCRYPTION_MASTER_KEY=${PROD_ENCRYPTION_KEY}

# Admin MFA Enforcement (MANDATORY)
ADMIN_MFA_ENFORCEMENT_ENABLED=true
ADMIN_MFA_GRACE_PERIOD_DAYS=0
ADMIN_MFA_IMMEDIATE_ENFORCEMENT=true

# Redis Cluster
REDIS_CLUSTER_NODES=${PROD_REDIS_NODES}
REDIS_PASSWORD=${PROD_REDIS_PASSWORD}

# Security
ENCRYPTION_KEY=${PROD_ENCRYPTION_KEY}
JWT_SIGNING_KEY=${PROD_JWT_KEY}
API_RATE_LIMIT=100
SESSION_TIMEOUT=3600

# Monitoring
SENTRY_DSN=${PROD_SENTRY_DSN}
NEW_RELIC_APP_NAME=taxomind-production
NEW_RELIC_LICENSE_KEY=${PROD_NEW_RELIC_KEY}
DATADOG_API_KEY=${PROD_DATADOG_KEY}

# Feature Flags
ENABLE_MAINTENANCE_MODE=false
ENABLE_EMERGENCY_SHUTDOWN=false
ENABLE_RATE_LIMITING=true
ENABLE_WAF=true
```

## Pre-Production Checklist

### Code Validation
```bash
# 1. Environment validation
NODE_ENV=production npm run validate:env:production
npm run validate:startup

# 2. Enterprise deployment validation
npm run enterprise:validate
npm run enterprise:health
npm run enterprise:audit

# 3. Security validation
npm run security:audit        # Security audit framework
npm run pentest              # Penetration testing
npm run owasp:scan           # OWASP vulnerability scan
npm run validate:csp         # CSP header validation

# 4. Compliance validation
npm run compliance:check     # Full compliance check
npm run compliance:gdpr      # GDPR compliance report
npm run compliance:soc2      # SOC2 compliance report

# 5. Performance validation
npm run test:performance:benchmark  # Performance benchmarks
npm run bundle:analyze              # Bundle size analysis
npm run performance:check           # Performance metrics

# 6. Build validation
NODE_ENV=production npm run build:safe
```

### Approval Gates
```yaml
approvals:
  - name: "QA Sign-off"
    approver: qa-lead@taxomind.com
    criteria:
      - All test cases passed
      - No critical bugs
      - Performance benchmarks met
  
  - name: "Security Review"
    approver: security@taxomind.com
    criteria:
      - Security scan passed
      - No high-risk vulnerabilities
      - Compliance requirements met
  
  - name: "Business Approval"
    approver: product-owner@taxomind.com
    criteria:
      - Feature complete
      - User acceptance testing passed
      - Business requirements met
  
  - name: "Final Approval"
    approver: cto@taxomind.com
    criteria:
      - All previous approvals obtained
      - Risk assessment completed
      - Rollback plan approved
```

## Production Deployment Process

### Phase 1: Preparation (T-2 Hours)

```bash
#!/bin/bash
# prepare-production.sh

# 0. Run enterprise deployment script
NODE_ENV=production npm run enterprise:deploy:production

# 1. Enable maintenance mode
kubectl set env deployment/taxomind-web ENABLE_MAINTENANCE_MODE=true --namespace=production

# 2. Full database backup
pg_dump -h prod-db-primary.taxomind.internal \
  -U $PROD_DB_USER \
  -d taxomind_prod \
  --format=custom \
  --verbose \
  --file=backup_prod_$(date +%Y%m%d_%H%M%S).dump

# 3. Backup verification
pg_restore --list backup_prod_*.dump > /dev/null || exit 1

# 4. Store backup in S3
aws s3 cp backup_prod_*.dump s3://taxomind-backups/production/

# 5. Take application snapshot
kubectl create snapshot production-snapshot-$(date +%Y%m%d_%H%M%S) \
  --namespace=production

# 6. Clear CDN cache
aws cloudfront create-invalidation \
  --distribution-id $PROD_CDN_ID \
  --paths "/*"
```

### Phase 2: Database Migration (T-1 Hour)

```bash
#!/bin/bash
# migrate-production.sh

# 1. Test migration on replica
psql -h prod-db-replica.taxomind.internal \
  -U $PROD_DB_RO_USER \
  -d taxomind_prod_test \
  -f migrations.sql

# 2. Execute migration on primary
npx prisma migrate deploy --schema=./prisma/schema.prisma

# 3. Verify migration
npx prisma migrate status

# 4. Run data integrity checks
npm run db:verify:production

# 5. Update database statistics
psql -h prod-db-primary.taxomind.internal \
  -U $PROD_DB_USER \
  -d taxomind_prod \
  -c "ANALYZE;"
```

### Phase 3: Blue-Green Deployment (T-0)

```bash
#!/bin/bash
# deploy-production.sh

# 1. Deploy to green environment
kubectl apply -f k8s/production/deployment-green.yaml

# 2. Wait for green environment to be ready
kubectl wait --for=condition=ready pod \
  -l app=taxomind,version=green \
  --namespace=production \
  --timeout=600s

# 3. Run health checks on green
curl -f https://green.taxomind.internal/api/health || exit 1

# 4. Run smoke tests on green
npm run test:smoke:production:green

# 5. Switch traffic to green (canary 10%)
kubectl patch service taxomind-service \
  -p '{"spec":{"selector":{"version":"green"}}}' \
  --namespace=production \
  --dry-run=client -o yaml | \
  kubectl apply -f - --weight=10

# 6. Monitor metrics (5 minutes)
sleep 300
./scripts/check-metrics.sh || exit 1

# 7. Increase traffic to green (50%)
kubectl set traffic taxomind-service --weight=50

# 8. Monitor metrics (10 minutes)
sleep 600
./scripts/check-metrics.sh || exit 1

# 9. Full traffic switch to green
kubectl set traffic taxomind-service --weight=100

# 10. Mark blue as previous version
kubectl label deployment taxomind-blue version=previous --overwrite

# 11. Update green to current
kubectl label deployment taxomind-green version=current --overwrite
```

### Phase 4: Post-Deployment Validation

```bash
#!/bin/bash
# validate-production.sh

# 1. Comprehensive health check
./scripts/health-check-all.sh

# 2. Run production test suite
npm run test:production

# 3. Verify critical user journeys
npm run test:critical-paths:production

# 4. Check performance metrics
npm run metrics:performance:production

# 5. Verify monitoring and alerting
./scripts/verify-monitoring.sh

# 6. Disable maintenance mode
kubectl set env deployment/taxomind-web ENABLE_MAINTENANCE_MODE=false --namespace=production

# 7. Send deployment notification
./scripts/notify-deployment-complete.sh
```

## Rollback Procedures

### Automatic Rollback Triggers
```yaml
triggers:
  - metric: error_rate
    threshold: 5%
    window: 5m
    action: automatic_rollback
  
  - metric: response_time_p99
    threshold: 2000ms
    window: 5m
    action: automatic_rollback
  
  - metric: success_rate
    threshold: 95%
    operator: less_than
    window: 5m
    action: automatic_rollback
```

### Manual Rollback Process
```bash
#!/bin/bash
# rollback-production.sh

# 1. Declare rollback
echo "INITIATING PRODUCTION ROLLBACK at $(date)"

# 2. Switch traffic to blue (previous version)
kubectl patch service taxomind-service \
  -p '{"spec":{"selector":{"version":"previous"}}}' \
  --namespace=production

# 3. Verify blue environment health
curl -f https://app.taxomind.com/api/health || exit 1

# 4. Revert database if needed
if [ "$REVERT_DB" = "true" ]; then
  psql -h prod-db-primary.taxomind.internal \
    -U $PROD_DB_USER \
    -d taxomind_prod \
    -f rollback.sql
fi

# 5. Clear cache
redis-cli -h prod-redis.taxomind.internal FLUSHALL

# 6. Invalidate CDN
aws cloudfront create-invalidation \
  --distribution-id $PROD_CDN_ID \
  --paths "/*"

# 7. Notify stakeholders
./scripts/notify-rollback.sh

echo "ROLLBACK COMPLETED at $(date)"
```

## Monitoring and Alerting

### Real-Time Monitoring Dashboard
```typescript
// monitoring-config.ts
export const productionMonitoring = {
  metrics: {
    // Application metrics
    requestRate: { threshold: 10000, unit: 'req/min' },
    errorRate: { threshold: 1, unit: 'percent' },
    responseTime: {
      p50: { threshold: 200, unit: 'ms' },
      p95: { threshold: 500, unit: 'ms' },
      p99: { threshold: 1000, unit: 'ms' }
    },
    
    // Infrastructure metrics
    cpuUsage: { threshold: 70, unit: 'percent' },
    memoryUsage: { threshold: 80, unit: 'percent' },
    diskUsage: { threshold: 85, unit: 'percent' },
    
    // Business metrics
    activeUsers: { min: 100 },
    transactionRate: { min: 10, unit: 'per_minute' },
    conversionRate: { min: 2, unit: 'percent' }
  },
  
  alerts: {
    channels: ['pagerduty', 'slack', 'email'],
    escalation: {
      level1: { delay: 0, contacts: ['oncall@taxomind.com'] },
      level2: { delay: 15, contacts: ['senior-oncall@taxomind.com'] },
      level3: { delay: 30, contacts: ['engineering-lead@taxomind.com'] },
      level4: { delay: 60, contacts: ['cto@taxomind.com'] }
    }
  }
};
```

### Critical Alert Configuration
```yaml
# alerts.yaml
alerts:
  - name: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
      team: platform
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }}"
      runbook: "https://runbook.taxomind.com/high-error-rate"
  
  - name: DatabaseConnectionPool
    expr: pg_stat_database_numbackends / pg_stat_database_max_connections > 0.8
    for: 5m
    labels:
      severity: warning
      team: database
    annotations:
      summary: "Database connection pool near limit"
      description: "Connection usage at {{ $value | humanizePercentage }}"
  
  - name: DiskSpaceLow
    expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.15
    for: 10m
    labels:
      severity: critical
      team: infrastructure
    annotations:
      summary: "Low disk space"
      description: "Only {{ $value | humanizePercentage }} disk space remaining"
```

## Security Protocols

### Production Security Checklist
```bash
# 1. Verify SSL/TLS configuration
nmap --script ssl-enum-ciphers -p 443 app.taxomind.com

# 2. Check security headers
curl -I https://app.taxomind.com | grep -E "Strict-Transport|X-Frame-Options|Content-Security-Policy"

# 3. Verify WAF is active
curl -X POST https://app.taxomind.com/test-waf-block

# 4. Check rate limiting
for i in {1..200}; do curl https://app.taxomind.com/api/test; done

# 5. Verify audit logging
tail -f /var/log/taxomind/audit.log

# 6. Test intrusion detection
./scripts/run-ids-test.sh
```

### Data Protection Measures
```typescript
// data-protection.ts
export const dataProtection = {
  encryption: {
    atRest: 'AES-256-GCM',
    inTransit: 'TLS 1.3',
    keyRotation: '30 days'
  },
  
  backup: {
    frequency: 'hourly',
    retention: '30 days',
    encryption: true,
    offsite: true,
    tested: 'weekly'
  },
  
  pii: {
    masking: true,
    tokenization: true,
    retention: '90 days',
    rightToErasure: true
  },
  
  compliance: {
    gdpr: true,
    ccpa: true,
    hipaa: false,
    pciDss: true
  }
};
```

## Disaster Recovery

### RTO and RPO Targets
- **RTO (Recovery Time Objective)**: 2 hours
- **RPO (Recovery Point Objective)**: 15 minutes

### DR Procedures
```bash
#!/bin/bash
# disaster-recovery.sh

# 1. Assess damage
./scripts/assess-failure.sh

# 2. Activate DR site
kubectl config use-context dr-cluster
kubectl apply -f k8s/dr/activate.yaml

# 3. Restore database from backup
pg_restore -h dr-db.taxomind.internal \
  -U $DR_DB_USER \
  -d taxomind_dr \
  --clean \
  --if-exists \
  backup_prod_latest.dump

# 4. Verify DR site
curl -f https://dr.taxomind.com/api/health

# 5. Update DNS to point to DR
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://dns-failover.json

# 6. Monitor DR site
./scripts/monitor-dr.sh
```

## Performance Optimization

### Production Performance Tuning
```nginx
# nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Caching
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:100m max_size=10g inactive=60m;
    
    # Compression
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Connection settings
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Buffer settings
    client_body_buffer_size 16K;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 16k;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
}
```

### Database Performance
```sql
-- Performance tuning parameters
ALTER SYSTEM SET shared_buffers = '8GB';
ALTER SYSTEM SET effective_cache_size = '24GB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '20MB';
ALTER SYSTEM SET min_wal_size = '2GB';
ALTER SYSTEM SET max_wal_size = '8GB';

-- Reload configuration
SELECT pg_reload_conf();
```

## Production Maintenance

### Scheduled Maintenance Windows
```yaml
maintenance_windows:
  regular:
    schedule: "Every Sunday 02:00-06:00 UTC"
    activities:
      - Security patches
      - Dependency updates
      - Database optimization
      - Log rotation
  
  emergency:
    approval: "CTO or VP Engineering"
    notification: "2 hours minimum"
    duration: "As needed"
```

### Zero-Downtime Operations
```bash
# Rolling restart
kubectl rollout restart deployment/taxomind-web --namespace=production

# Scale operations
kubectl scale deployment/taxomind-web --replicas=10 --namespace=production

# Configuration updates
kubectl set env deployment/taxomind-web NEW_CONFIG=value --namespace=production
```

## Compliance and Auditing

### Audit Log Format
```json
{
  "timestamp": "2025-01-17T10:30:00Z",
  "action": "DEPLOYMENT",
  "actor": {
    "id": "user-123",
    "email": "devops@taxomind.com",
    "role": "ADMIN"
  },
  "resource": {
    "type": "APPLICATION",
    "id": "taxomind-web",
    "version": "2.5.0"
  },
  "result": "SUCCESS",
  "metadata": {
    "environment": "production",
    "deployment_id": "deploy-456",
    "duration_ms": 180000
  }
}
```

### Compliance Reporting
```bash
# Generate compliance report
npm run compliance:report:production

# Security audit
npm run security:audit:production

# Access review
npm run access:review:production

# Data retention audit
npm run data:retention:audit
```

## Emergency Procedures

### Emergency Contacts
```yaml
contacts:
  primary_oncall: "+1-555-0100"
  secondary_oncall: "+1-555-0101"
  engineering_lead: "+1-555-0102"
  cto: "+1-555-0103"
  security_team: "+1-555-0104"
  
escalation_matrix:
  severity_1:
    - primary_oncall: immediate
    - engineering_lead: 15_minutes
    - cto: 30_minutes
  
  severity_2:
    - primary_oncall: immediate
    - secondary_oncall: 30_minutes
  
  severity_3:
    - primary_oncall: 1_hour
```

### Emergency Shutdown
```bash
#!/bin/bash
# emergency-shutdown.sh

echo "EMERGENCY SHUTDOWN INITIATED at $(date)"

# 1. Enable emergency mode
kubectl set env deployment/taxomind-web \
  ENABLE_EMERGENCY_SHUTDOWN=true \
  --namespace=production

# 2. Stop accepting new traffic
kubectl patch service taxomind-service \
  -p '{"spec":{"selector":{"version":"none"}}}' \
  --namespace=production

# 3. Preserve current state
kubectl create snapshot emergency-snapshot-$(date +%Y%m%d_%H%M%S) \
  --namespace=production

# 4. Notify all stakeholders
./scripts/emergency-notification.sh

echo "EMERGENCY SHUTDOWN COMPLETED at $(date)"
```

## Documentation Requirements

### Deployment Documentation
Every production deployment must include:
1. Release notes
2. Change log
3. Risk assessment
4. Rollback plan
5. Test results
6. Performance benchmarks
7. Security scan results
8. Approval signatures

### Post-Deployment Report
```markdown
# Production Deployment Report

**Date**: 2025-01-17
**Version**: 2.5.0
**Duration**: 45 minutes
**Result**: SUCCESS

## Changes Deployed
- Feature: Advanced AI course generation
- Fix: Memory leak in video processing
- Update: Security patches applied

## Metrics
- Deployment time: 45 minutes
- Downtime: 0 minutes
- Error rate: 0.01%
- Performance impact: +5% improvement

## Issues Encountered
- None

## Follow-up Actions
- Monitor memory usage for 48 hours
- Review performance metrics daily for 1 week

**Approved by**: John Smith (CTO)
**Deployed by**: DevOps Team
```

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Classification: CONFIDENTIAL*
*Environment: Production*