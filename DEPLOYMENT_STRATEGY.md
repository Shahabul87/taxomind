# 🚀 Multi-Environment Deployment Strategy for Enhanced Authentication

## Overview
This document outlines the deployment strategy for the enhanced authentication system across three environments:
- **Development** (Local) → **Staging** (Railway) → **Production** (Railway)

## 🌍 Environment Architecture

```mermaid
graph LR
    A[Local Dev] -->|Push| B[GitHub]
    B -->|Auto Deploy| C[Staging/Railway]
    C -->|Manual Promote| D[Production/Railway]
    
    E[Dev DB<br/>PostgreSQL:5433] --> A
    F[Staging DB<br/>Railway PostgreSQL] --> C
    G[Production DB<br/>Railway PostgreSQL] --> D
```

## 📁 Environment Configuration Files

### 1. Environment Variables Structure

```bash
# .env.development (Local)
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5433/taxomind_dev"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="dev-secret-change-in-production"
STRICT_ENV_MODE=false
ENABLE_AUDIT_LOGS=false

# .env.staging (Railway Staging)
NODE_ENV=staging
DATABASE_URL="${{ RAILWAY_DATABASE_URL }}"
NEXTAUTH_URL="https://staging.taxomind.railway.app"
AUTH_SECRET="${{ STAGING_AUTH_SECRET }}"
STRICT_ENV_MODE=true
ENABLE_AUDIT_LOGS=true
ENABLE_RATE_LIMITING=true
REDIS_URL="${{ RAILWAY_REDIS_URL }}"

# .env.production (Railway Production)
NODE_ENV=production
DATABASE_URL="${{ RAILWAY_DATABASE_URL }}"
NEXTAUTH_URL="https://taxomind.railway.app"
AUTH_SECRET="${{ PRODUCTION_AUTH_SECRET }}"
STRICT_ENV_MODE=true
ENABLE_AUDIT_LOGS=true
ENABLE_RATE_LIMITING=true
REDIS_URL="${{ RAILWAY_REDIS_URL }}"
SENTRY_DSN="${{ SENTRY_DSN }}"
```

## 🔄 Migration Strategy

### Phase 1: Development Environment

```bash
# 1. Test schema changes locally
cd /path/to/taxomind
git checkout -b feature/enhanced-auth

# 2. Backup current schema
cp prisma/schema.prisma prisma/schema.backup.prisma

# 3. Apply schema changes (already done)
# 4. Generate migration
npx prisma migrate dev --name enhanced-auth-system

# 5. Test migration
npm run dev:db:reset
npx tsx scripts/migrate-auth.ts

# 6. Run tests
npm run test:auth
npm run test:permissions
```

### Phase 2: Staging Deployment

```bash
# 1. Push to staging branch
git add .
git commit -m "feat: enhanced authentication system"
git push origin feature/enhanced-auth

# 2. Create PR to staging branch
gh pr create --base staging --title "Enhanced Authentication System"

# 3. Railway Staging Auto-Deploy
# Railway will automatically:
# - Run build process
# - Apply migrations
# - Deploy application
```

### Phase 3: Production Deployment

```bash
# 1. After staging validation (minimum 48 hours)
git checkout main
git merge staging

# 2. Tag release
git tag -a v2.0.0-auth -m "Enhanced Authentication System"
git push origin v2.0.0-auth

# 3. Railway Production Deploy
# Manual trigger in Railway dashboard
# OR via Railway CLI:
railway up --environment production
```

## 🛠️ Railway Configuration

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build:production"
  },
  "deploy": {
    "numReplicas": {
      "staging": 1,
      "production": 2
    },
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "environments": {
    "staging": {
      "branch": "staging",
      "variables": {
        "NODE_ENV": "staging",
        "ENABLE_DEBUG": "true"
      }
    },
    "production": {
      "branch": "main",
      "variables": {
        "NODE_ENV": "production",
        "ENABLE_DEBUG": "false"
      }
    }
  }
}
```

## 📊 Database Migration Scripts

### Safe Migration Script for Each Environment

```typescript
// scripts/migrate-auth-safe.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

interface MigrationOptions {
  dryRun?: boolean;
  environment: 'development' | 'staging' | 'production';
}

export async function migrateAuthentication(options: MigrationOptions) {
  const { dryRun = false, environment } = options;
  
  logger.info(`Starting authentication migration for ${environment}...`);
  
  // Check environment
  if (environment === 'production' && !process.env.ALLOW_PRODUCTION_MIGRATION) {
    throw new Error('Production migration not allowed without ALLOW_PRODUCTION_MIGRATION=true');
  }
  
  // Create transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    try {
      // Step 1: Backup critical data
      if (environment === 'production') {
        await backupCriticalData(tx);
      }
      
      // Step 2: Check for conflicts
      const conflicts = await checkMigrationConflicts(tx);
      if (conflicts.length > 0) {
        logger.error('Migration conflicts detected:', conflicts);
        if (!dryRun) {
          throw new Error('Migration conflicts detected');
        }
      }
      
      // Step 3: Migrate roles
      const roleUpdates = await migrateRoles(tx, dryRun);
      logger.info(`Role migration: ${roleUpdates} users updated`);
      
      // Step 4: Create permissions
      const permissions = await createPermissions(tx, dryRun);
      logger.info(`Permissions created: ${permissions}`);
      
      // Step 5: Verify migration
      const verification = await verifyMigration(tx);
      if (!verification.success) {
        throw new Error(`Migration verification failed: ${verification.errors}`);
      }
      
      if (dryRun) {
        logger.info('Dry run completed successfully');
        throw new Error('Dry run - rolling back');
      }
      
      // Step 6: Create audit log
      await tx.enhancedAuditLog.create({
        data: {
          action: 'AUTH_MIGRATION_COMPLETED',
          resource: 'SYSTEM',
          severity: 'INFO',
          metadata: {
            environment,
            rolesUpdated: roleUpdates,
            permissionsCreated: permissions,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      logger.info('Migration completed successfully');
      return { success: true, roleUpdates, permissions };
      
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }, {
    maxWait: 30000,    // 30 seconds
    timeout: 120000,   // 2 minutes
  });
}

async function backupCriticalData(tx: any) {
  // Create backup of user roles and permissions
  const backup = await tx.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
  
  // Store backup in audit log
  await tx.enhancedAuditLog.create({
    data: {
      action: 'PRE_MIGRATION_BACKUP',
      resource: 'USER_ROLES',
      severity: 'INFO',
      metadata: { backup, count: backup.length }
    }
  });
}

async function checkMigrationConflicts(tx: any): Promise<string[]> {
  const conflicts: string[] = [];
  
  // Check for active sessions
  const activeSessions = await tx.session.count({
    where: {
      expiresAt: { gt: new Date() },
      isActive: true
    }
  });
  
  if (activeSessions > 0) {
    conflicts.push(`${activeSessions} active sessions detected`);
  }
  
  // Check for in-progress transactions
  const pendingPurchases = await tx.purchase.count({
    where: {
      status: 'PENDING'
    }
  });
  
  if (pendingPurchases > 0) {
    conflicts.push(`${pendingPurchases} pending purchases detected`);
  }
  
  return conflicts;
}

async function migrateRoles(tx: any, dryRun: boolean): Promise<number> {
  if (dryRun) {
    const count = await tx.user.count({
      where: {
        role: { in: ['USER', 'STUDENT', 'TEACHER'] }
      }
    });
    return count;
  }
  
  let totalUpdated = 0;
  
  // Map old roles to new roles
  const roleMapping = {
    'USER': 'LEARNER',
    'STUDENT': 'LEARNER',
    'TEACHER': 'INSTRUCTOR'
  };
  
  for (const [oldRole, newRole] of Object.entries(roleMapping)) {
    const result = await tx.user.updateMany({
      where: { role: oldRole },
      data: { role: newRole }
    });
    totalUpdated += result.count;
  }
  
  return totalUpdated;
}

async function createPermissions(tx: any, dryRun: boolean): Promise<number> {
  if (dryRun) {
    return Object.keys(Permission).length;
  }
  
  const permissions = Object.values(Permission);
  let created = 0;
  
  for (const permission of permissions) {
    await tx.permission.upsert({
      where: { name: permission },
      update: {},
      create: {
        name: permission,
        category: getCategoryFromPermission(permission),
        description: `Permission for ${permission.toLowerCase().replace(/_/g, ' ')}`
      }
    });
    created++;
  }
  
  return created;
}

async function verifyMigration(tx: any): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Verify no old roles remain
  const oldRoles = await tx.user.count({
    where: {
      role: { in: ['USER', 'STUDENT', 'TEACHER'] }
    }
  });
  
  if (oldRoles > 0) {
    errors.push(`${oldRoles} users still have old roles`);
  }
  
  // Verify permissions exist
  const permissionCount = await tx.permission.count();
  if (permissionCount === 0) {
    errors.push('No permissions created');
  }
  
  // Verify admin users exist
  const adminCount = await tx.user.count({
    where: { role: 'ADMIN' }
  });
  
  if (adminCount === 0) {
    errors.push('No admin users found');
  }
  
  return {
    success: errors.length === 0,
    errors
  };
}
```

## 🔄 Rollback Procedures

### Immediate Rollback Script
```typescript
// scripts/rollback-auth.ts
export async function rollbackAuthentication() {
  logger.warn('Starting authentication rollback...');
  
  return await prisma.$transaction(async (tx) => {
    // Restore old roles
    await tx.user.updateMany({
      where: { role: 'LEARNER' },
      data: { role: 'USER' }
    });
    
    await tx.user.updateMany({
      where: { role: 'INSTRUCTOR' },
      data: { role: 'TEACHER' }
    });
    
    // Remove new tables (be careful!)
    // await tx.$executeRaw`DROP TABLE IF EXISTS "Permission" CASCADE`;
    // await tx.$executeRaw`DROP TABLE IF EXISTS "UserPermission" CASCADE`;
    
    logger.info('Rollback completed');
  });
}
```

## 🧪 Testing Strategy

### 1. Local Testing
```bash
# Unit tests
npm run test:unit:auth

# Integration tests
npm run test:integration:auth

# E2E tests
npm run test:e2e:auth
```

### 2. Staging Testing Checklist
- [ ] User login/logout works
- [ ] Role-based access control works
- [ ] API key generation works
- [ ] Rate limiting works
- [ ] Audit logs are created
- [ ] Password security validations work
- [ ] Session management works
- [ ] Permission checks work

### 3. Production Smoke Tests
```typescript
// scripts/smoke-tests.ts
export async function runSmokeTests() {
  const tests = [
    testUserLogin,
    testRoleAccess,
    testAPIKeyValidation,
    testRateLimiting,
    testAuditLogging
  ];
  
  for (const test of tests) {
    try {
      await test();
      console.log(`✅ ${test.name} passed`);
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
      throw error;
    }
  }
}
```

## 📊 Monitoring & Alerts

### Railway Monitoring Setup
```yaml
# railway.monitoring.yml
alerts:
  - name: auth-failures
    condition: error_rate > 0.05
    action: notify-slack
    
  - name: high-latency
    condition: p95_latency > 1000ms
    action: notify-pagerduty
    
  - name: database-connections
    condition: connection_count > 80
    action: scale-up

metrics:
  - authentication_attempts
  - permission_checks
  - api_key_usage
  - rate_limit_hits
```

## 🚀 Deployment Commands

### Development
```bash
# Start local environment
npm run dev

# Reset and seed database
npm run dev:db:reset
npm run dev:db:seed
```

### Staging
```bash
# Deploy to staging
git push origin staging

# Run migrations on staging
railway run --environment staging npx prisma migrate deploy
railway run --environment staging npx tsx scripts/migrate-auth-safe.ts --environment staging
```

### Production
```bash
# Pre-deployment checks
npm run build:production
npm run test:production

# Deploy to production (after staging validation)
railway up --environment production

# Run migrations on production
railway run --environment production npx prisma migrate deploy
railway run --environment production npx tsx scripts/migrate-auth-safe.ts --environment production --dry-run
railway run --environment production npx tsx scripts/migrate-auth-safe.ts --environment production
```

## ⚠️ Critical Considerations

1. **Database Backups**: Always backup before migrations
2. **Gradual Rollout**: Use feature flags for new auth features
3. **Session Handling**: Notify users before major auth changes
4. **Monitoring**: Watch error rates closely after deployment
5. **Rollback Plan**: Have rollback scripts ready and tested

## 📈 Success Metrics

- Authentication success rate > 99.5%
- Permission check latency < 50ms
- Zero data loss during migration
- No increase in support tickets
- All smoke tests passing

## 🔒 Security Checklist

- [ ] All secrets are in environment variables
- [ ] No hardcoded credentials in code
- [ ] Auth secret is different per environment
- [ ] Database URLs are secure
- [ ] HTTPS enforced in staging/production
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Security headers configured

---

*Last Updated: January 2025*
*Version: 1.0.0*