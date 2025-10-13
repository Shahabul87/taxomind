# Agent Prompt: Fix Enterprise Authentication Separation

## 🎯 Mission Critical Objective
Transform the Taxomind authentication system to achieve **COMPLETE SEPARATION** between admin and user authentication flows, meeting enterprise-grade security standards with zero shared components.

## 🚨 Critical Context
The codebase has PARTIAL separation (Phase 1 & 2 complete) but FAILS enterprise requirements due to:
- Shared database tables between admin and users
- Shared JWT token structures
- Incomplete session isolation
- Mixed cookie implementations

## ⚡ Success Criteria
1. **ZERO shared components** between admin and user authentication
2. **Separate database tables** for all auth-related data
3. **Distinct JWT structures** with different encoding/claims
4. **Isolated session management** with separate cookies
5. **Independent auth instances** that cannot cross-authenticate
6. **Pass enterprise security audit** (SOC2, ISO 27001 compliance)

## 📊 Current Architecture Analysis

### Already Implemented (DO NOT DUPLICATE):
```
✅ /admin/auth/login page exists
✅ actions/admin/login.ts exists
✅ auth.admin.ts configuration exists
✅ AdminLoginForm component exists
✅ AdminAuditLog table exists
✅ AdminSessionMetrics table exists
✅ Admin role verification in place
✅ 4-hour session for admins configured
```

### Critical Gaps to Fix:
```
❌ Shared Account table (userId references both)
❌ Shared ActiveSession table
❌ Shared TwoFactorConfirmation table
❌ Same JWT token encoding
❌ Incomplete cookie separation
❌ Session tokens not isolated
```

## 🔧 Implementation Strategy

### Phase 1: Database Schema Separation (PRIORITY 1)

#### 1.1 Create Admin-Specific Tables
```prisma
// Add to prisma/schema.prisma

model AdminAccount {
  id                String  @id @default(cuid())
  adminId           String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  admin User @relation("AdminAccounts", fields: [adminId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([provider, providerAccountId])
  @@index([adminId])
}

model AdminActiveSession {
  id           String   @id @default(cuid())
  adminId      String
  sessionToken String   @unique
  ipAddress    String
  userAgent    String?
  deviceInfo   String?
  location     String?
  expiresAt    DateTime
  isActive     Boolean  @default(true)

  admin User @relation("AdminActiveSessions", fields: [adminId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([adminId])
  @@index([sessionToken])
  @@index([expiresAt])
}

model AdminTwoFactorConfirmation {
  id      String @id @default(cuid())
  adminId String @unique
  admin   User   @relation("AdminTwoFactorConfirmation", fields: [adminId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
}

model AdminVerificationToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}

model AdminPasswordResetToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}

model AdminTwoFactorToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}
```

#### 1.2 Update User Model Relations
```prisma
// Update User model to include admin-specific relations
model User {
  // ... existing fields ...

  // Admin-specific relations (only populated for ADMIN role)
  adminAccounts         AdminAccount[]              @relation("AdminAccounts")
  adminActiveSessions   AdminActiveSession[]        @relation("AdminActiveSessions")
  adminTwoFactorConf    AdminTwoFactorConfirmation? @relation("AdminTwoFactorConfirmation")

  // ... existing relations ...
}
```

### Phase 2: Adapter Separation (PRIORITY 1)

#### 2.1 Create Admin Prisma Adapter
Create `lib/auth/admin-prisma-adapter.ts`:
```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { Adapter } from "next-auth/adapters";

/**
 * Custom Prisma Adapter for Admin Authentication
 * Maps NextAuth operations to admin-specific tables
 */
export function AdminPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(db);

  return {
    ...baseAdapter,

    // Override account operations to use AdminAccount
    async createUser(user) {
      // Ensure user has ADMIN role
      const adminUser = await db.user.create({
        data: {
          ...user,
          role: 'ADMIN',
        },
      });
      return adminUser;
    },

    async linkAccount(account) {
      await db.adminAccount.create({
        data: {
          adminId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db.adminAccount.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },

    // Override session operations to use AdminActiveSession
    async createSession(session) {
      const adminSession = await db.adminActiveSession.create({
        data: {
          adminId: session.userId,
          sessionToken: session.sessionToken,
          expiresAt: session.expires,
          ipAddress: 'unknown', // Will be updated by middleware
          isActive: true,
        },
      });
      return {
        ...adminSession,
        userId: adminSession.adminId,
        expires: adminSession.expiresAt,
      };
    },

    async getSessionAndUser(sessionToken) {
      const adminSession = await db.adminActiveSession.findUnique({
        where: { sessionToken },
        include: { admin: true },
      });

      if (!adminSession || !adminSession.admin) return null;

      // Verify session is not expired and is active
      if (adminSession.expiresAt < new Date() || !adminSession.isActive) {
        return null;
      }

      return {
        session: {
          sessionToken: adminSession.sessionToken,
          userId: adminSession.adminId,
          expires: adminSession.expiresAt,
        },
        user: adminSession.admin,
      };
    },

    async deleteSession(sessionToken) {
      await db.adminActiveSession.delete({
        where: { sessionToken },
      });
    },

    // Override verification token operations
    async createVerificationToken(verificationToken) {
      const token = await db.adminVerificationToken.create({
        data: {
          email: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        },
      });
      return {
        identifier: token.email,
        token: token.token,
        expires: token.expires,
      };
    },

    async useVerificationToken({ identifier, token }) {
      const verificationToken = await db.adminVerificationToken.findUnique({
        where: {
          email_token: {
            email: identifier,
            token,
          },
        },
      });

      if (!verificationToken) return null;

      await db.adminVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      return {
        identifier: verificationToken.email,
        token: verificationToken.token,
        expires: verificationToken.expires,
      };
    },
  };
}
```

#### 2.2 Update auth.admin.ts to Use Admin Adapter
```typescript
// In auth.admin.ts, replace:
// adapter: PrismaAdapter(db),
// With:
import { AdminPrismaAdapter } from "@/lib/auth/admin-prisma-adapter";
// ...
adapter: AdminPrismaAdapter(),
```

### Phase 3: JWT & Session Separation (PRIORITY 2)

#### 3.1 Create Separate JWT Encoding
Create `lib/auth/admin-jwt.ts`:
```typescript
import jwt from "jsonwebtoken";
import { JWT } from "next-auth/jwt";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.AUTH_SECRET + '-admin';
const ADMIN_JWT_ALGORITHM = 'HS512'; // Different from user JWT (HS256)

export const adminJwtConfig = {
  // Custom encode function for admin JWTs
  async encode({ secret, token, maxAge }: any) {
    if (!token) return null;

    // Add admin-specific claims
    const adminToken = {
      ...token,
      aud: 'taxomind-admin',        // Audience claim
      iss: 'taxomind-admin-auth',   // Issuer claim
      adminAuth: true,              // Admin flag
      sessionType: 'ADMIN',         // Session type
    };

    return jwt.sign(adminToken, ADMIN_JWT_SECRET, {
      algorithm: ADMIN_JWT_ALGORITHM,
      expiresIn: maxAge || 14400, // 4 hours default
    });
  },

  // Custom decode function for admin JWTs
  async decode({ secret, token }: any) {
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET, {
        algorithms: [ADMIN_JWT_ALGORITHM],
        audience: 'taxomind-admin',
        issuer: 'taxomind-admin-auth',
      }) as JWT;

      // Verify admin claims
      if (decoded.adminAuth !== true || decoded.sessionType !== 'ADMIN') {
        console.error('[admin-jwt] Invalid admin JWT claims');
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('[admin-jwt] JWT verification failed:', error);
      return null;
    }
  },
};
```

#### 3.2 Update auth.config.admin.ts
```typescript
// In auth.config.admin.ts
import { adminJwtConfig } from "@/lib/auth/admin-jwt";

export default {
  // ... existing config ...

  jwt: {
    ...adminJwtConfig,
    maxAge: 4 * 60 * 60, // 4 hours for admin sessions
  },

  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 hours
    updateAge: 30 * 60,  // Update every 30 minutes
  },

  cookies: {
    sessionToken: {
      name: `__Secure-admin-session-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",   // Stricter than user cookies
        path: "/",
        secure: true,
        domain: process.env.NODE_ENV === "production" ? ".taxomind.com" : undefined,
      },
    },
  },
};
```

### Phase 4: Middleware Enhancement (PRIORITY 2)

#### 4.1 Update middleware.ts
```typescript
// Add to middleware.ts

// Separate session detection for admin
const hasAdminSession = (() => {
  const adminCookie = req.cookies.get('__Secure-admin-session-token') ||
                      req.cookies.get('admin-session-token');

  if (!adminCookie) return false;

  // Verify it's a valid admin JWT (basic check)
  try {
    const tokenParts = adminCookie.value.split('.');
    if (tokenParts.length !== 3) return false;

    // Decode payload (base64)
    const payload = JSON.parse(
      Buffer.from(tokenParts[1], 'base64').toString()
    );

    return payload.adminAuth === true && payload.sessionType === 'ADMIN';
  } catch {
    return false;
  }
})();

// Separate session detection for regular users
const hasUserSession = (() => {
  const userCookie = req.cookies.get('__Secure-next-auth.session-token') ||
                    req.cookies.get('next-auth.session-token');

  if (!userCookie) return false;

  // Verify it's NOT an admin JWT
  try {
    const tokenParts = userCookie.value.split('.');
    if (tokenParts.length !== 3) return false;

    const payload = JSON.parse(
      Buffer.from(tokenParts[1], 'base64').toString()
    );

    return !payload.adminAuth && payload.sessionType !== 'ADMIN';
  } catch {
    return true; // Default user session
  }
})();

// Use separate auth detection
const isAdminLoggedIn = hasAdminSession;
const isUserLoggedIn = hasUserSession;

// Enforce strict separation
if (pathname.startsWith('/admin')) {
  if (isUserLoggedIn && !isAdminLoggedIn) {
    // User trying to access admin with user session
    return NextResponse.redirect(new URL('/auth/error?error=InvalidSession', nextUrl));
  }
}

if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/admin')) {
  if (isAdminLoggedIn && !isUserLoggedIn) {
    // Admin trying to access user area with admin session
    return NextResponse.redirect(new URL('/dashboard/admin', nextUrl));
  }
}
```

### Phase 5: Data Migration (PRIORITY 3)

#### 5.1 Create Migration Script
Create `scripts/migrate-admin-auth-data.ts`:
```typescript
import { db } from "@/lib/db";

async function migrateAdminAuthData() {
  console.log('Starting admin auth data migration...');

  // 1. Get all admin users
  const adminUsers = await db.user.findMany({
    where: { role: 'ADMIN' },
    include: {
      accounts: true,
      sessions: true,
      twoFactorConfirmation: true,
    },
  });

  console.log(`Found ${adminUsers.length} admin users to migrate`);

  for (const admin of adminUsers) {
    // 2. Migrate accounts
    for (const account of admin.accounts) {
      await db.adminAccount.create({
        data: {
          adminId: admin.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      }).catch(e => console.log(`Account already migrated for ${admin.email}`));
    }

    // 3. Migrate active sessions
    const activeSessions = await db.activeSession.findMany({
      where: { userId: admin.id },
    });

    for (const session of activeSessions) {
      await db.adminActiveSession.create({
        data: {
          adminId: admin.id,
          sessionToken: session.sessionToken,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          isActive: true,
        },
      }).catch(e => console.log(`Session already migrated`));
    }

    // 4. Migrate 2FA confirmation
    if (admin.twoFactorConfirmation) {
      await db.adminTwoFactorConfirmation.create({
        data: {
          adminId: admin.id,
        },
      }).catch(e => console.log(`2FA confirmation already migrated`));
    }

    console.log(`✅ Migrated admin: ${admin.email}`);
  }

  console.log('Migration complete!');

  // 5. Optional: Clean up old admin data from shared tables
  // WARNING: Only do this after verifying migration success
  // await db.account.deleteMany({ where: { userId: { in: adminUsers.map(a => a.id) } } });
  // await db.activeSession.deleteMany({ where: { userId: { in: adminUsers.map(a => a.id) } } });
}

migrateAdminAuthData()
  .catch(console.error)
  .finally(() => process.exit());
```

### Phase 6: Testing & Validation (PRIORITY 3)

#### 6.1 Create Validation Script
Create `scripts/validate-auth-separation.ts`:
```typescript
import { db } from "@/lib/db";

async function validateAuthSeparation() {
  console.log('🔍 Validating Authentication Separation...\n');

  const results = {
    passed: [] as string[],
    failed: [] as string[],
  };

  // Test 1: Check admin tables exist
  try {
    await db.adminAccount.count();
    results.passed.push('✅ AdminAccount table exists');
  } catch {
    results.failed.push('❌ AdminAccount table missing');
  }

  try {
    await db.adminActiveSession.count();
    results.passed.push('✅ AdminActiveSession table exists');
  } catch {
    results.failed.push('❌ AdminActiveSession table missing');
  }

  // Test 2: Verify no admin data in user tables
  const adminUsers = await db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  const adminIds = adminUsers.map(u => u.id);

  const sharedAccounts = await db.account.count({
    where: { userId: { in: adminIds } },
  });

  if (sharedAccounts === 0) {
    results.passed.push('✅ No admin data in shared Account table');
  } else {
    results.failed.push(`❌ Found ${sharedAccounts} admin accounts in shared table`);
  }

  const sharedSessions = await db.activeSession.count({
    where: { userId: { in: adminIds } },
  });

  if (sharedSessions === 0) {
    results.passed.push('✅ No admin sessions in shared ActiveSession table');
  } else {
    results.failed.push(`❌ Found ${sharedSessions} admin sessions in shared table`);
  }

  // Test 3: Verify admin data exists in admin tables
  const adminAccounts = await db.adminAccount.count();
  const adminSessions = await db.adminActiveSession.count();

  if (adminAccounts > 0) {
    results.passed.push(`✅ ${adminAccounts} admin accounts in AdminAccount table`);
  } else {
    results.failed.push('❌ No admin accounts found in AdminAccount table');
  }

  // Print results
  console.log('PASSED TESTS:');
  results.passed.forEach(r => console.log(r));

  console.log('\nFAILED TESTS:');
  results.failed.forEach(r => console.log(r));

  const score = results.passed.length / (results.passed.length + results.failed.length) * 100;
  console.log(`\n📊 Score: ${score.toFixed(0)}%`);

  if (score === 100) {
    console.log('🎉 Authentication separation is COMPLETE!');
  } else {
    console.log('⚠️ Authentication separation is INCOMPLETE');
  }
}

validateAuthSeparation()
  .catch(console.error)
  .finally(() => process.exit());
```

## 📋 Implementation Checklist

### Database Layer
- [ ] Create admin-specific tables in schema.prisma
- [ ] Run `npx prisma migrate dev --name add-admin-auth-tables`
- [ ] Update User model with admin relations
- [ ] Verify tables created with `npx prisma studio`

### Authentication Layer
- [ ] Create AdminPrismaAdapter
- [ ] Update auth.admin.ts to use AdminPrismaAdapter
- [ ] Create admin-jwt.ts with custom encoding
- [ ] Update auth.config.admin.ts with JWT config
- [ ] Test admin login flow end-to-end

### Middleware Layer
- [ ] Add separate session detection logic
- [ ] Enforce strict session isolation
- [ ] Prevent cross-authentication
- [ ] Test both admin and user flows

### Data Migration
- [ ] Run migration script for existing admins
- [ ] Verify data in admin tables
- [ ] Clean up shared tables (after verification)
- [ ] Update any hardcoded references

### Validation
- [ ] Run validation script
- [ ] Achieve 100% separation score
- [ ] Test security boundaries
- [ ] Document changes

## 🚨 Critical Security Notes

1. **NEVER allow cross-authentication** between admin and user sessions
2. **ALWAYS verify JWT claims** for admin sessions
3. **ENFORCE strict cookie separation** with different names and domains
4. **MAINTAIN separate audit logs** for admin actions
5. **IMPLEMENT IP whitelisting** for admin access (future enhancement)
6. **REQUIRE MFA** for all admin accounts (already implemented)
7. **USE shorter session duration** for admins (4 hours vs 30 days)
8. **MONITOR for suspicious activity** in admin auth attempts

## 🎯 Success Metrics

After implementation, the system should:
1. **Pass validation script** with 100% score
2. **Block user sessions** from accessing admin areas
3. **Block admin sessions** from accessing user areas
4. **Maintain separate audit trails** for admin vs user actions
5. **Use different JWT signatures** verifiable only by respective auth instances
6. **Store zero admin data** in shared authentication tables
7. **Pass security penetration testing** for session hijacking attempts

## 📝 Testing Scenarios

### Scenario 1: User → Admin Attempt
1. Login as regular user
2. Try to access /admin/dashboard
3. **Expected**: Redirect to error page with "InvalidSession"

### Scenario 2: Admin → User Area
1. Login as admin
2. Try to access /dashboard (user area)
3. **Expected**: Redirect to /dashboard/admin

### Scenario 3: Cookie Manipulation
1. Login as user, copy session cookie
2. Try to use user cookie on admin endpoints
3. **Expected**: Invalid session, redirect to admin login

### Scenario 4: JWT Tampering
1. Login as user, modify JWT to add adminAuth claim
2. Try to access admin area
3. **Expected**: JWT verification fails, access denied

### Scenario 5: Concurrent Sessions
1. Login as admin in one browser
2. Login as user in another browser
3. **Expected**: Both sessions work independently

## 🔄 Rollback Plan

If issues arise:
1. **Immediate**: Revert middleware changes (fastest recovery)
2. **Short-term**: Switch adapter back to shared tables
3. **Long-term**: Keep admin tables but dual-write until stable
4. **Emergency**: Restore from database backup before migration

## 📚 References

- [NextAuth.js Custom Adapters](https://next-auth.js.org/adapters/overview)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [SOC2 Authentication Requirements](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/socforserviceorganizations)

## ✅ Definition of Done

The authentication separation is complete when:
1. ✅ All admin auth data is in admin-specific tables
2. ✅ No admin data exists in shared auth tables
3. ✅ Admin and user sessions cannot cross-authenticate
4. ✅ Different JWT encoding/claims for admin vs user
5. ✅ Separate cookies with distinct names
6. ✅ Validation script shows 100% separation
7. ✅ All test scenarios pass
8. ✅ Security audit confirms enterprise-grade separation

---

**Priority**: 🔴 CRITICAL
**Estimated Effort**: 16-24 hours
**Risk Level**: Medium (with proper testing and rollback plan)
**Business Impact**: High (Required for enterprise compliance)