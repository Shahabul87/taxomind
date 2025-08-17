# ADR-0003: Implement NextAuth.js v5 for Authentication

## Status
Accepted

## Context
The Taxomind LMS requires a comprehensive authentication system that supports:
- Multiple authentication providers (Google, GitHub, credentials)
- Role-based access control (students, teachers, administrators)
- Secure session management
- Multi-factor authentication (MFA/2FA)
- Enterprise SSO capabilities (SAML, OIDC, LDAP)
- JWT token management
- Device trust and fingerprinting
- Audit logging for security compliance
- Password reset and account recovery flows

The authentication system must integrate seamlessly with Next.js 15 App Router and provide:
- Server-side session validation
- Client-side session access
- Protected route middleware
- Type-safe user data access

## Decision
We will use NextAuth.js v5 (Auth.js) as our authentication framework with custom extensions for enterprise features.

## Consequences

### Positive
- **Next.js Integration**: Deep integration with Next.js App Router and API routes
- **Provider Flexibility**: Support for 50+ authentication providers out of the box
- **Session Management**: Secure, encrypted sessions with JWT or database strategies
- **Type Safety**: Full TypeScript support with type augmentation
- **Security Best Practices**: CSRF protection, secure cookies, state parameter validation
- **Customizable**: Extensive callback system for custom logic
- **Database Adapters**: Prisma adapter for session persistence
- **Edge Compatible**: Works with Edge Runtime for global deployment
- **Active Development**: Well-maintained with regular security updates
- **Enterprise Ready**: Supports SAML, OIDC for enterprise SSO

### Negative
- **Version Migration**: v5 has breaking changes from v4, requiring careful migration
- **Documentation Gaps**: v5 documentation still evolving
- **Complexity**: Advanced features require deep understanding of OAuth flows
- **Custom MFA**: Multi-factor authentication requires custom implementation
- **Limited Built-in UI**: Need to build custom authentication pages
- **Session Size Limits**: JWT sessions have size constraints

## Alternatives Considered

### 1. Clerk
- **Pros**: Complete authentication solution with UI, better MFA support
- **Cons**: Vendor lock-in, subscription costs, less customization
- **Reason for rejection**: Need more control over authentication flow and data

### 2. Auth0
- **Pros**: Enterprise-grade features, extensive documentation, compliance certifications
- **Cons**: External dependency, costs scale with users, data sovereignty concerns
- **Reason for rejection**: Prefer self-hosted solution for data control

### 3. Supabase Auth
- **Pros**: Integrated with Supabase ecosystem, real-time subscriptions
- **Cons**: Tied to Supabase platform, less flexible for custom flows
- **Reason for rejection**: Want framework-agnostic authentication

### 4. Custom JWT Implementation
- **Pros**: Complete control, minimal dependencies
- **Cons**: Security risks, significant development time, maintenance burden
- **Reason for rejection**: Risk of security vulnerabilities too high

### 5. Firebase Auth
- **Pros**: Easy setup, good documentation, multiple providers
- **Cons**: Google vendor lock-in, limited customization, Firebase dependency
- **Reason for rejection**: Need more control and self-hosting capability

## Implementation Notes

### Configuration Structure
```typescript
// auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Custom validation logic with bcrypt
        // MFA verification if enabled
        // Return user object or null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add custom claims to JWT
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Populate session with custom data
      if (token && session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  }
})
```

### Middleware Protection
```typescript
// middleware.ts
import { auth } from "@/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.role === "ADMIN"
  
  // Role-based route protection logic
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl))
  }
  
  if (isAdminRoute && !isAdmin) {
    return Response.redirect(new URL("/unauthorized", nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
```

### MFA Implementation
```typescript
// Custom TOTP implementation
import { authenticator } from 'otplib'

// Setup MFA
const secret = authenticator.generateSecret()
const qrCodeUrl = authenticator.keyuri(email, 'Taxomind', secret)

// Verify TOTP
const isValid = authenticator.verify({ token, secret })
```

### Session Fingerprinting
```typescript
// Device trust implementation
const generateFingerprint = (req: Request) => {
  const ua = req.headers.get('user-agent')
  const ip = req.headers.get('x-forwarded-for')
  return crypto.createHash('sha256')
    .update(`${ua}${ip}`)
    .digest('hex')
}
```

### Enterprise SSO Extensions
```typescript
// SAML Provider
import { SAMLProvider } from '@/lib/auth/saml-provider'

// LDAP Integration
import { LDAPProvider } from '@/lib/auth/ldap-provider'

// OIDC Provider
import { OIDCProvider } from '@/lib/auth/oidc-provider'
```

### Security Enhancements
1. **Rate Limiting**: Implement login attempt throttling
2. **Account Lockout**: Temporary lockout after failed attempts
3. **Audit Logging**: Track all authentication events
4. **Password Policy**: Enforce strong password requirements
5. **Session Monitoring**: Track active sessions and allow revocation
6. **Recovery Codes**: Generate backup codes for MFA

### Database Schema Extensions
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String?
  role              Role      @default(USER)
  isTwoFactorEnabled Boolean  @default(false)
  twoFactorSecret   String?
  accounts          Account[]
  sessions          Session[]
  trustedDevices    TrustedDevice[]
}

model TrustedDevice {
  id          String   @id @default(cuid())
  userId      String
  fingerprint String
  name        String?
  lastUsed    DateTime
  user        User     @relation(fields: [userId], references: [id])
}
```

## Monitoring and Security
- Monitor failed login attempts
- Track session creation and destruction
- Alert on suspicious authentication patterns
- Regular security audits of authentication flow
- Implement CAPTCHA for repeated failures
- Log all privilege escalations

## References
- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Date
2024-01-17

## Authors
- Taxomind Architecture Team