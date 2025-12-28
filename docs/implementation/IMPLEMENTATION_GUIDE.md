# Taxomind Authentication Implementation Guide

## Quick Start

This guide helps you implement the new Google-style authentication system in Taxomind.

## 1. Database Setup

### Run Migration
```bash
# Create capability tables
npx prisma migrate dev --name add_user_capabilities

# Or run the SQL migration directly
psql -U your_user -d your_database -f prisma/migrations/add_user_capabilities.sql

# Generate Prisma client
npx prisma generate
```

### Verify Migration
```bash
# Open Prisma Studio to verify tables
npx prisma studio

# Check for:
# - UserCapability table
# - UserContext table
# - Existing User data migrated
```

## 2. Environment Configuration

### Required Environment Variables
```env
# Admin Configuration
FIRST_USER_IS_ADMIN=true           # First user becomes admin (dev only)
ADMIN_EMAILS=admin@example.com     # Comma-separated admin emails
DEFAULT_ADMIN_EMAIL=admin@taxomind.com
DEFAULT_ADMIN_PASSWORD=SecurePassword123!

# Security
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5433/taxomind
```

## 3. Initialize First Admin

### Option 1: CLI Method (Recommended)
```bash
# Interactive setup
npm run admin:init

# Or direct creation
npm run admin:create -- --email admin@example.com --name "Admin Name" --password "SecurePass123"
```

### Option 2: First User Registration
```bash
# Set environment variable
echo "FIRST_USER_IS_ADMIN=true" >> .env.local

# Start the application
npm run dev

# Register first user at /auth/register
# This user will automatically become admin
```

### Option 3: Environment-based
```bash
# Set admin emails in environment
echo "ADMIN_EMAILS=admin@example.com,owner@example.com" >> .env.local

# Users registering with these emails become admins
```

## 4. Update Application Files

### Step 1: Backup Current Files
```bash
# Create backup directory
mkdir -p backups/auth-migration

# Backup critical files
cp middleware.ts backups/auth-migration/
cp auth.ts backups/auth-migration/
cp routes.ts backups/auth-migration/
cp app/dashboard/_components/UnifiedDashboard.tsx backups/auth-migration/
```

### Step 2: Apply New Files
```bash
# Replace middleware
mv middleware.new.ts middleware.ts

# Replace UnifiedDashboard
mv app/dashboard/_components/UnifiedDashboard.new.tsx \
   app/dashboard/_components/UnifiedDashboard.tsx
```

### Step 3: Update Imports
Update any files importing from the old system:

```typescript
// Old imports (remove these)
import { isTeacher, isAffiliate } from "@/lib/user-checks";

// New imports (use these)
import { hasCapability, UserCapability } from "@/lib/auth/capabilities";
import { getCurrentContext } from "@/lib/auth/context-manager";
```

## 5. Testing the Implementation

### Test Admin Creation
```bash
# List current admins
npm run admin:list

# Promote a user
npm run admin:promote -- --email user@example.com

# Verify admin access
# 1. Login as admin
# 2. Navigate to /admin or /dashboard/admin
# 3. Should see admin dashboard
```

### Test Capability System
```typescript
// Test in browser console or create test file
async function testCapabilities() {
  // Get current capabilities
  const response = await fetch('/api/auth/capabilities');
  const data = await response.json();
  console.log('Current capabilities:', data);
  
  // Grant teacher capability
  const grant = await fetch('/api/auth/capabilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability: 'TEACHER' })
  });
  console.log('Grant result:', await grant.json());
}
```

### Test Context Switching
```typescript
// Test context switching
async function testContextSwitch() {
  // Get current context
  const current = await fetch('/api/auth/context');
  console.log('Current context:', await current.json());
  
  // Switch to teacher context
  const switchReq = await fetch('/api/auth/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: 'TEACHER' })
  });
  console.log('Switch result:', await switchReq.json());
}
```

## 6. Migration Checklist

### Backend Migration
- [ ] Run database migration
- [ ] Generate Prisma client
- [ ] Copy new auth files to lib/auth/
- [ ] Update middleware.ts
- [ ] Update auth.ts callbacks
- [ ] Create API endpoints
- [ ] Test admin CLI commands

### Frontend Migration
- [ ] Update UnifiedDashboard component
- [ ] Update navigation components
- [ ] Add context switcher UI
- [ ] Update permission checks
- [ ] Test dashboard switching
- [ ] Verify capability requests

### Testing
- [ ] Admin can access admin routes
- [ ] Users cannot access admin routes
- [ ] Teacher capability works
- [ ] Affiliate capability works
- [ ] Context switching works
- [ ] Capability grant/revoke works
- [ ] Audit logs are created

## 7. Common Issues and Solutions

### Issue: Cannot create first admin
**Solution:**
```bash
# Check if admin exists
npm run admin:list

# If no output, create admin
npm run admin:init
```

### Issue: Context switching not working
**Solution:**
```typescript
// Verify user has capability
const caps = await fetch('/api/auth/capabilities');
console.log(await caps.json());

// Grant missing capability
await fetch('/api/auth/capabilities', {
  method: 'POST',
  body: JSON.stringify({ capability: 'TEACHER' })
});
```

### Issue: Middleware blocking access
**Solution:**
```typescript
// Check middleware.ts for correct imports
import { UserCapability } from "@/lib/auth/capabilities";

// Verify capability routes are defined
const CAPABILITY_ROUTES = {
  '/teacher': [UserCapability.TEACHER],
  // ...
};
```

### Issue: Database migration fails
**Solution:**
```bash
# Reset database (CAUTION: deletes data)
npx prisma db push --force-reset

# Run migration again
npx prisma migrate dev

# Seed with test data
npm run dev:db:seed
```

## 8. Production Deployment

### Pre-deployment Checklist
- [ ] Set production environment variables
- [ ] Disable FIRST_USER_IS_ADMIN
- [ ] Configure ADMIN_EMAILS properly
- [ ] Enable MFA for admins
- [ ] Test all authentication flows
- [ ] Verify audit logging works
- [ ] Check security headers

### Deployment Steps
```bash
# 1. Build application
npm run build:production

# 2. Run migrations
npx prisma migrate deploy

# 3. Create production admin
NODE_ENV=production npm run admin:init

# 4. Start application
npm run start:production

# 5. Verify health
curl https://your-domain.com/api/health
```

### Post-deployment Verification
```bash
# Check admin access
curl -X GET https://your-domain.com/api/admin/create

# Check capability system
curl -X GET https://your-domain.com/api/auth/capabilities \
  -H "Cookie: your-session-cookie"

# Check audit logs
npm run enterprise:audit
```

## 9. Rollback Plan

If issues occur, rollback to previous version:

```bash
# 1. Restore backup files
cp backups/auth-migration/* .

# 2. Revert database (if needed)
npx prisma migrate reset

# 3. Rebuild application
npm run build

# 4. Restart services
npm run start
```

## 10. Support and Troubleshooting

### Debug Commands
```bash
# Check user capabilities
npm run capability:list -- --user user@example.com

# View audit logs
npm run enterprise:audit

# Health check
npm run enterprise:health

# Database status
npx prisma studio
```

### Logging
Check logs for authentication issues:
```typescript
// Enable debug logging
process.env.DEBUG = 'auth:*,capability:*,context:*';

// Check console for:
// - [AUTH] messages
// - [CAPABILITY] messages
// - [CONTEXT] messages
// - [ADMIN] messages
```

### Getting Help
1. Check documentation in `/docs/AUTHENTICATION_ARCHITECTURE.md`
2. Review test files in `__tests__/auth/`
3. Check audit logs for recent changes
4. Enable debug logging for detailed information

## Appendix: SQL Queries for Verification

```sql
-- Check admins
SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN';

-- Check user capabilities
SELECT u.email, uc.capability, uc."isActive", uc."activatedAt"
FROM "UserCapability" uc
JOIN "User" u ON u.id = uc."userId"
ORDER BY u.email, uc.capability;

-- Check audit logs
SELECT * FROM "AuditLog" 
WHERE action LIKE '%ADMIN%' OR action LIKE '%CAPABILITY%'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Check context preferences
SELECT u.email, c."activeCapability", c."lastSwitchedAt"
FROM "UserContext" c
JOIN "User" u ON u.id = c."userId";
```

---

This implementation guide provides a complete roadmap for migrating to the new authentication system. Follow the steps carefully and test thoroughly before deploying to production.