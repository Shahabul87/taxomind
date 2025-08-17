# Authentication Issues Runbook

## Overview
This runbook provides procedures for diagnosing and resolving authentication issues in the Taxomind application using NextAuth.js v5.

## Quick Reference
- **Auth Library**: NextAuth.js v5
- **Session Strategy**: JWT
- **Providers**: Google, GitHub, Credentials
- **Auth Config**: `auth.ts`
- **Middleware**: `middleware.ts`
- **Routes Config**: `routes.ts`

## Common Issues and Resolutions

### 1. Login Failures

#### Symptoms
- "Invalid credentials" error
- OAuth redirect failures
- Session not created after login
- Infinite redirect loops
- MFA/TOTP verification failures

#### Quick Diagnostics
```bash
# Check auth configuration
cat auth.ts | grep -E "providers|callbacks"

# Verify environment variables
npm run validate:env
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# Check OAuth credentials
echo $GOOGLE_CLIENT_ID
echo $GITHUB_CLIENT_ID

# Test auth endpoint
curl -I https://taxomind.com/api/auth/session

# Check middleware logs
tail -f logs/middleware.log | grep auth
```

#### Resolution Steps

1. **Verify Environment Configuration**
```bash
# Required environment variables
NEXTAUTH_URL=https://taxomind.com
NEXTAUTH_SECRET=your-secret-key-here
DATABASE_URL=postgresql://...

# OAuth providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Validate all variables
npm run enterprise:validate
```

2. **Fix Credentials Login**
```typescript
// Check login action in actions/login.ts
import { signIn } from '@/auth';

export const login = async (values: LoginSchema) => {
  const validatedFields = LoginSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }
  
  const { email, password, code } = validatedFields.data;
  
  try {
    // Check if user exists
    const existingUser = await getUserByEmail(email);
    
    if (!existingUser || !existingUser.email || !existingUser.password) {
      return { error: "Email does not exist!" };
    }
    
    // Verify email if required
    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(email);
      await sendVerificationEmail(email, verificationToken.token);
      return { success: "Confirmation email sent!" };
    }
    
    // Check 2FA
    if (existingUser.isTwoFactorEnabled) {
      if (code) {
        const twoFactorToken = await getTwoFactorTokenByEmail(email);
        if (!twoFactorToken || twoFactorToken.token !== code) {
          return { error: "Invalid code!" };
        }
        
        await db.twoFactorToken.delete({
          where: { id: twoFactorToken.id }
        });
      } else {
        const twoFactorToken = await generateTwoFactorToken(email);
        await sendTwoFactorTokenEmail(email, twoFactorToken.token);
        return { twoFactor: true };
      }
    }
    
    // Attempt sign in
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
    
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};
```

3. **Fix OAuth Provider Issues**
```typescript
// In auth.ts - ensure proper OAuth configuration
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") return true;
      
      const existingUser = await getUserById(user.id);
      
      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;
      
      // Check if 2FA is enabled
      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );
        
        if (!twoFactorConfirmation) return false;
        
        // Delete two factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id }
        });
      }
      
      return true;
    },
  },
});
```

4. **Fix MFA/TOTP Issues**
```typescript
// Verify TOTP setup in app/api/auth/mfa/totp/verify/route.ts
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { token } = await request.json();
    
    // Get user's TOTP secret
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { totpSecret: true }
    });
    
    if (!user?.totpSecret) {
      return NextResponse.json({ error: "TOTP not configured" }, { status: 400 });
    }
    
    // Verify TOTP token
    const verified = verifyTOTP(token, user.totpSecret);
    
    if (!verified) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    
    // Update session
    await db.user.update({
      where: { id: session.user.id },
      data: { 
        isTwoFactorEnabled: true,
        totpVerifiedAt: new Date()
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
```

### 2. Session Management Issues

#### Symptoms
- User logged out unexpectedly
- Session not persisting across pages
- Role-based redirects not working
- Session data outdated

#### Quick Diagnostics
```bash
# Check session endpoint
curl https://taxomind.com/api/auth/session \
  -H "Cookie: next-auth.session-token=..."

# Verify JWT secret
echo $NEXTAUTH_SECRET | wc -c  # Should be at least 32 characters

# Check session cookies
curl -I https://taxomind.com | grep -i "set-cookie"

# Monitor session callbacks
tail -f logs/auth.log | grep session
```

#### Resolution Steps

1. **Fix Session Callbacks**
```typescript
// In auth.ts - ensure proper session handling
export const authConfig = {
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.isOAuth = token.isOAuth as boolean;
      }
      
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      
      const existingUser = await getUserById(token.sub);
      
      if (!existingUser) return token;
      
      const existingAccount = await getAccountByUserId(existingUser.id);
      
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
      
      return token;
    },
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

2. **Fix Middleware Protection**
```typescript
// In middleware.ts - ensure proper route protection
import { auth } from "@/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  
  if (isApiAuthRoute) {
    return null;
  }
  
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }
  
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    
    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }
  
  return null;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

3. **Implement Session Refresh**
```typescript
// Create a session refresh hook
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function useSessionRefresh(intervalMs = 1000 * 60 * 5) {
  const { update } = useSession();
  
  useEffect(() => {
    const interval = setInterval(() => {
      update();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs, update]);
}
```

### 3. OAuth Configuration Issues

#### Symptoms
- "Callback URL mismatch" errors
- OAuth providers not working
- Missing user data from OAuth
- Redirect URI errors

#### Quick Diagnostics
```bash
# Check OAuth callback URLs
echo $NEXTAUTH_URL/api/auth/callback/google
echo $NEXTAUTH_URL/api/auth/callback/github

# Verify provider configuration
curl https://accounts.google.com/.well-known/openid-configuration

# Test OAuth flow
curl -I "https://taxomind.com/api/auth/signin/google"
```

#### Resolution Steps

1. **Update OAuth Provider Settings**
```bash
# Google OAuth Console
# https://console.cloud.google.com/apis/credentials
# Add authorized redirect URIs:
# - https://taxomind.com/api/auth/callback/google
# - http://localhost:3000/api/auth/callback/google (dev)

# GitHub OAuth Apps
# https://github.com/settings/developers
# Update Authorization callback URL:
# - https://taxomind.com/api/auth/callback/github
```

2. **Handle OAuth Account Linking**
```typescript
// In auth.ts callbacks
async signIn({ user, account, profile }) {
  if (account?.provider === "google" || account?.provider === "github") {
    try {
      const existingUser = await db.user.findUnique({
        where: { email: user.email },
      });
      
      if (existingUser) {
        // Link account if not already linked
        const existingAccount = await db.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });
        
        if (!existingAccount) {
          await db.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error("OAuth sign in error:", error);
      return false;
    }
  }
  
  return true;
}
```

### 4. Role-Based Access Issues

#### Symptoms
- Users can access unauthorized pages
- Admin routes accessible by regular users
- Incorrect dashboard redirects
- Permission errors

#### Quick Diagnostics
```bash
# Check user roles in database
psql $DATABASE_URL -c "SELECT id, email, role FROM users;"

# Test role-based routes
curl -H "Cookie: $SESSION_COOKIE" https://taxomind.com/admin
curl -H "Cookie: $SESSION_COOKIE" https://taxomind.com/teacher

# Verify middleware logs
tail -f logs/middleware.log | grep "role"
```

#### Resolution Steps

1. **Implement Role Guards**
```typescript
// lib/auth-guards.ts
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function requireRole(role: UserRole) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized: No session");
  }
  
  if (session.user.role !== role) {
    throw new Error(`Unauthorized: Required role ${role}`);
  }
  
  return session;
}

// Usage in server components
export default async function AdminPage() {
  await requireRole("ADMIN");
  
  return <AdminDashboard />;
}
```

2. **Fix Role-Based Redirects**
```typescript
// In middleware.ts
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  
  // Admin route protection
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/login", nextUrl));
    }
    if (userRole !== "ADMIN") {
      return Response.redirect(new URL("/unauthorized", nextUrl));
    }
  }
  
  // Teacher route protection
  if (nextUrl.pathname.startsWith("/teacher")) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/login", nextUrl));
    }
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return Response.redirect(new URL("/unauthorized", nextUrl));
    }
  }
  
  return null;
});
```

## Security Best Practices

### 1. Session Security
```typescript
// Implement session fingerprinting
import { createHash } from 'crypto';

function generateFingerprint(req: Request) {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return createHash('sha256').update(fingerprint).digest('hex');
}

// Store and verify fingerprint in session
callbacks: {
  async jwt({ token, trigger, session, account }) {
    if (account) {
      token.fingerprint = generateFingerprint(req);
    }
    return token;
  },
  async session({ session, token }) {
    const currentFingerprint = generateFingerprint(req);
    if (token.fingerprint !== currentFingerprint) {
      throw new Error("Session fingerprint mismatch");
    }
    return session;
  }
}
```

### 2. Rate Limiting
```typescript
// Implement auth rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per minute
});

export async function rateLimitAuth(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `auth:${identifier}`
  );
  
  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in ${reset - Date.now()}ms`);
  }
  
  return { limit, reset, remaining };
}
```

## Prevention Measures

1. **Regular Security Audits**
```bash
# Check for vulnerable dependencies
npm audit

# Update auth library
npm update next-auth@latest

# Rotate secrets quarterly
openssl rand -base64 32  # Generate new NEXTAUTH_SECRET
```

2. **Monitor Auth Events**
```typescript
// Log authentication events
callbacks: {
  async signIn({ user, account, profile, email, credentials }) {
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "SIGN_IN",
        provider: account?.provider || "credentials",
        metadata: {
          email: user.email,
          timestamp: new Date(),
          ip: req.ip,
        },
      },
    });
    return true;
  },
}
```

## Escalation Procedures

### Level 1: Development Team
- Login form issues
- Session display problems
- UI/UX authentication issues

### Level 2: Backend Team
- OAuth configuration
- Database authentication issues
- Session management problems

### Level 3: Security Team
- Suspicious authentication patterns
- Potential security breaches
- Mass authentication failures

## Monitoring Dashboards

- **Auth Metrics**: http://monitoring.taxomind.com/auth
- **Failed Login Attempts**: http://security.taxomind.com/failed-logins
- **Session Analytics**: http://analytics.taxomind.com/sessions
- **OAuth Provider Status**: http://status.taxomind.com/oauth

## Emergency Contacts

- **Security Team**: security@taxomind.com
- **On-Call Engineer**: +1-xxx-xxx-xxxx
- **Auth Provider Support**: Listed in `/docs/vendor-contacts.md`

---
*Last Updated: January 2025*
*Version: 1.0*
*Next Review: February 2025*