# Authentication Troubleshooting Guide

## NextAuth.js v5 and MFA Issues

This guide helps you diagnose and resolve authentication-related issues in Taxomind, including NextAuth.js v5 configuration, Multi-Factor Authentication (MFA), and Single Sign-On (SSO) problems.

## Table of Contents
- [Environment Configuration Issues](#environment-configuration-issues)
- [Session and Token Problems](#session-and-token-problems)
- [OAuth Provider Issues](#oauth-provider-issues)
- [MFA/TOTP Issues](#mfatotp-issues)
- [Role-Based Access Control Issues](#role-based-access-control-issues)
- [Middleware and Route Protection](#middleware-and-route-protection)
- [Production Authentication Issues](#production-authentication-issues)

---

## Environment Configuration Issues

### Error: "NEXTAUTH_SECRET is not defined"

**Symptoms:**
```
[auth][error] MissingSecret: Please define NEXTAUTH_SECRET environment variable
```

**Solutions:**

1. **Generate and set secret:**
```bash
# Generate secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

2. **Verify environment loading:**
```typescript
// app/api/test-env/route.ts
export async function GET() {
  return NextResponse.json({
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    hasUrl: !!process.env.NEXTAUTH_URL,
    env: process.env.NODE_ENV,
  });
}
```

### Error: "NEXTAUTH_URL mismatch"

**Symptoms:**
```
Error: The provided callbackUrl is not allowed by the redirect callback handler
```

**Solutions:**

1. **Set correct URLs per environment:**
```env
# Development (.env.local)
NEXTAUTH_URL=http://localhost:3000

# Staging (.env.staging)
NEXTAUTH_URL=https://staging.taxomind.com

# Production (.env.production)
NEXTAUTH_URL=https://taxomind.com
```

2. **Handle dynamic URLs:**
```typescript
// auth.ts
import { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
};
```

---

## Session and Token Problems

### Error: "Session is null after login"

**Symptoms:**
```typescript
// User logs in successfully but:
const session = await auth(); // Returns null
```

**Solutions:**

1. **Check auth configuration callbacks:**
```typescript
// auth.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt', // Important for serverless
  },
  callbacks: {
    async session({ session, token }) {
      // Attach user ID to session
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.role = user.role;
        token.provider = account.provider;
      }
      return token;
    },
  },
});
```

2. **Verify session in Server Components:**
```typescript
// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  return <Dashboard user={session.user} />;
}
```

3. **Use session in Client Components:**
```typescript
// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}

// components/user-menu.tsx
'use client';

import { useSession } from 'next-auth/react';

export function UserMenu() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <Skeleton />;
  if (!session) return <LoginButton />;
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### Error: "Token expired" or "Invalid token"

**Solutions:**

1. **Configure token expiration:**
```typescript
// auth.ts
export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account }) {
      // Refresh token logic
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      
      // Return token if still valid
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }
      
      // Refresh the token
      return refreshAccessToken(token);
    },
  },
};
```

2. **Implement token refresh:**
```typescript
async function refreshAccessToken(token: any) {
  try {
    // Provider-specific refresh logic
    const response = await fetch('https://oauth2.provider.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.OAUTH_CLIENT_ID!,
        client_secret: process.env.OAUTH_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });
    
    const refreshed = await response.json();
    
    if (!response.ok) throw refreshed;
    
    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { ...token, error: 'RefreshTokenError' };
  }
}
```

---

## OAuth Provider Issues

### Error: "Invalid redirect_uri" (Google/GitHub)

**Solutions:**

1. **Configure OAuth app correctly:**

**Google Console:**
```
Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google (development)
- https://taxomind.com/api/auth/callback/google (production)
```

**GitHub Settings:**
```
Authorization callback URL:
- http://localhost:3000/api/auth/callback/github
```

2. **Configure providers in auth.ts:**
```typescript
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
};
```

### Error: "Account already linked to another user"

**Solutions:**

1. **Handle account linking:**
```typescript
// auth.ts
callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.provider === 'google') {
      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
        include: { accounts: true },
      });
      
      if (existingUser) {
        // Check if this provider is already linked
        const isLinked = existingUser.accounts.some(
          acc => acc.provider === account.provider
        );
        
        if (!isLinked) {
          // Link the account
          await db.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              // ... other account fields
            },
          });
        }
        return true;
      }
    }
    return true;
  },
}
```

---

## MFA/TOTP Issues

### Error: "Invalid TOTP code"

**Solutions:**

1. **Check time synchronization:**
```typescript
// lib/auth/totp.ts
import { authenticator } from 'otplib';

// Allow for time drift
authenticator.options = {
  window: 2, // Allow 2 intervals before/after
};

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({
      token,
      secret,
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}
```

2. **Debug TOTP generation:**
```typescript
// app/api/auth/mfa/debug/route.ts
export async function POST(req: Request) {
  const { secret } = await req.json();
  
  // Generate multiple codes for debugging
  const codes = [];
  for (let i = -2; i <= 2; i++) {
    const time = Date.now() + (i * 30000); // 30 second intervals
    codes.push({
      offset: i,
      code: authenticator.generate(secret, time),
      time: new Date(time).toISOString(),
    });
  }
  
  return NextResponse.json({ codes });
}
```

### Error: "MFA required but not configured"

**Solutions:**

1. **Implement MFA flow:**
```typescript
// middleware.ts
import { auth } from '@/auth';

export default async function middleware(req: NextRequest) {
  const session = await auth();
  
  // Check if MFA is required
  if (session?.user && !session.user.mfaEnabled) {
    const protectedPaths = ['/admin', '/settings/security'];
    
    if (protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/auth/setup-mfa', req.url));
    }
  }
  
  return NextResponse.next();
}
```

2. **MFA setup component:**
```typescript
// app/auth/setup-mfa/page.tsx
'use client';

import { useState } from 'react';
import QRCode from 'qrcode';

export default function SetupMFAPage() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  const generateSecret = async () => {
    const response = await fetch('/api/auth/mfa/totp/setup', {
      method: 'POST',
    });
    
    const data = await response.json();
    setSecret(data.secret);
    
    // Generate QR code
    const otpauth = `otpauth://totp/Taxomind:${data.email}?secret=${data.secret}&issuer=Taxomind`;
    const qr = await QRCode.toDataURL(otpauth);
    setQrCode(qr);
  };
  
  const verifyAndEnable = async () => {
    const response = await fetch('/api/auth/mfa/totp/verify', {
      method: 'POST',
      body: JSON.stringify({ 
        secret, 
        token: verificationCode 
      }),
    });
    
    if (response.ok) {
      // MFA enabled successfully
      window.location.href = '/dashboard';
    }
  };
  
  return (
    <div>
      {qrCode && <img src={qrCode} alt="MFA QR Code" />}
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="Enter 6-digit code"
      />
      <button onClick={verifyAndEnable}>Verify and Enable</button>
    </div>
  );
}
```

---

## Role-Based Access Control Issues

### Error: "Unauthorized - Insufficient permissions"

**Solutions:**

1. **Implement proper role checking:**
```typescript
// lib/auth/permissions.ts
export const ROLE_PERMISSIONS = {
  ADMIN: ['manage_users', 'manage_courses', 'view_analytics', 'manage_billing'],
  TEACHER: ['create_courses', 'manage_own_courses', 'view_students'],
  USER: ['view_courses', 'purchase_courses', 'view_own_progress'],
} as const;

export function hasPermission(
  userRole: string,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return permissions?.includes(permission) ?? false;
}
```

2. **Protect API routes:**
```typescript
// app/api/admin/users/route.ts
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Admin-only logic
  const users = await db.user.findMany();
  return NextResponse.json(users);
}
```

3. **Route-based protection:**
```typescript
// middleware.ts
const roleRoutes = {
  '/admin': ['ADMIN'],
  '/teacher': ['ADMIN', 'TEACHER'],
  '/dashboard': ['ADMIN', 'TEACHER', 'USER'],
};

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const path = req.nextUrl.pathname;
  
  // Find matching route
  for (const [route, roles] of Object.entries(roleRoutes)) {
    if (path.startsWith(route)) {
      if (!session || !roles.includes(session.user.role)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
  }
  
  return NextResponse.next();
}
```

---

## Middleware and Route Protection

### Error: "Redirect loop detected"

**Symptoms:**
```
ERR_TOO_MANY_REDIRECTS
```

**Solutions:**

1. **Fix middleware logic:**
```typescript
// middleware.ts
export default async function middleware(req: NextRequest) {
  const session = await auth();
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  
  // Prevent redirect loops
  if (!session && !isAuthPage) {
    // Not logged in, not on auth page -> redirect to login
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  
  if (session && isAuthPage) {
    // Logged in but on auth page -> redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
}

// Specify which routes to run middleware on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Error: "Middleware not protecting routes"

**Solutions:**

1. **Check matcher configuration:**
```typescript
// middleware.ts
export const config = {
  matcher: [
    // Include all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Include API routes that need protection
    '/api/((?!auth).*)', // Exclude auth API routes
  ],
};
```

2. **Debug middleware execution:**
```typescript
export default async function middleware(req: NextRequest) {
  console.log('Middleware executing for:', req.nextUrl.pathname);
  
  // Add debug headers
  const response = NextResponse.next();
  response.headers.set('x-middleware-executed', 'true');
  
  return response;
}
```

---

## Production Authentication Issues

### Error: "Authentication works locally but not in production"

**Diagnostic steps:**

1. **Verify environment variables:**
```typescript
// app/api/debug/auth-config/route.ts
export async function GET() {
  // Only in development!
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' });
  }
  
  return NextResponse.json({
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
    providers: {
      google: !!process.env.GOOGLE_CLIENT_ID,
      github: !!process.env.GITHUB_CLIENT_ID,
    },
    database: !!process.env.DATABASE_URL,
  });
}
```

2. **Check cookie settings:**
```typescript
// auth.ts
export const authConfig = {
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
```

3. **Verify HTTPS in production:**
```typescript
// Ensure NEXTAUTH_URL uses HTTPS in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
    throw new Error('NEXTAUTH_URL must use HTTPS in production');
  }
}
```

### Error: "CSRF token mismatch"

**Solutions:**

1. **Configure CSRF protection:**
```typescript
// auth.ts
export const authConfig = {
  providers: [...],
  callbacks: {...},
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  // Ensure CSRF tokens are properly handled
  csrf: {
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
};
```

2. **Handle in custom sign-in:**
```typescript
// app/auth/login/page.tsx
import { getCsrfToken } from 'next-auth/react';

export default async function LoginPage() {
  const csrfToken = await getCsrfToken();
  
  return (
    <form action="/api/auth/callback/credentials" method="POST">
      <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

## Authentication Debugging Tools

### Session Inspector

```typescript
// app/api/debug/session/route.ts
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  
  return NextResponse.json({
    session,
    cookies: req.cookies.getAll(),
    headers: {
      authorization: req.headers.get('authorization'),
      cookie: req.headers.get('cookie'),
    },
  });
}
```

### Auth Event Logger

```typescript
// auth.ts
export const authConfig = {
  events: {
    async signIn({ user, account }) {
      console.log('Sign in:', { user: user.email, provider: account?.provider });
    },
    async signOut({ session }) {
      console.log('Sign out:', session?.user?.email);
    },
    async createUser({ user }) {
      console.log('New user created:', user.email);
    },
    async linkAccount({ user, account }) {
      console.log('Account linked:', { user: user.email, provider: account.provider });
    },
  },
};
```

---

## Prevention Checklist

Before deploying authentication changes:

1. **Environment Variables:**
   - [ ] NEXTAUTH_SECRET is set and secure
   - [ ] NEXTAUTH_URL matches deployment URL
   - [ ] OAuth credentials are configured
   - [ ] Database URL is correct

2. **OAuth Providers:**
   - [ ] Callback URLs are added to provider
   - [ ] Client ID and Secret are correct
   - [ ] Scopes are properly configured

3. **Security:**
   - [ ] HTTPS is enforced in production
   - [ ] Cookies are secure and httpOnly
   - [ ] CSRF protection is enabled
   - [ ] Rate limiting is configured

4. **Testing:**
   - [ ] Login/logout works
   - [ ] OAuth providers connect
   - [ ] MFA flow completes
   - [ ] Role-based access works
   - [ ] Session persists correctly

---

## When to Escalate

Escalate authentication issues when:
- Security breach is suspected
- Mass authentication failures occur
- OAuth provider changes break login
- Session hijacking is detected
- MFA bypass is discovered

Include in escalation:
- Authentication logs
- Failed login attempts
- Session tokens (redacted)
- OAuth provider errors
- Timeline of issues

---

*Last Updated: January 2025*
*Auth Stack: NextAuth.js v5 + Prisma Adapter*