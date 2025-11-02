# Authentication Flow Diagrams

**Last Updated**: January 2025
**Version**: 1.0

---

## 1. Credentials Login Flow

```
[User] → [Login Form] → [actions/login.ts]
  ↓
[Rate Limit Check] (lib/rate-limit-server.ts)
  ↓
[Email Verified?]
  → NO → [Generate Token] → [Queue Email with Tracking] → [Return Error with Resend Link]
  ↓ YES
[MFA Enabled?]
  → YES → [TOTP/Email 2FA] → [Verify Code] → [Create 2FA Confirmation] → [Create Session]
  ↓ NO
[Verify Password] → [Create Auth Audit Log]
  ↓
[Create Session] → [Redirect to Dashboard]
```

**Key Files:**
- `actions/login.ts` (lines 29-255)
- `lib/rate-limit-server.ts` - Rate limiting
- `lib/queue/email-queue-simple.ts` - Email sending with retry
- `lib/queue/email-tracking.ts` - Email delivery tracking
- `lib/auth/totp.ts` - TOTP verification

---

## 2. OAuth Login Flow (Google/GitHub)

```
[User] → [Click OAuth Button] → [Redirect to Provider]
  ↓
[User Approves on Provider]
  ↓
[Provider Redirects] → [/api/auth/callback/{provider}]
  ↓
[proxy.ts validates callback] (Line 117 - allows OAuth callbacks)
  ↓
[auth.ts signIn callback] (Lines 101-118)
  ↓
[Check Provider Type]
  → OAuth Provider → [Always Allow] (Line 115)
  → Credentials → [Verify with DB]
  ↓
[Link/Create Account] → [Set emailVerified to now()] → [Create Session]
  ↓
[Redirect to Dashboard]
```

**Key Files:**
- `auth.ts` (NextAuth configuration)
- `auth.config.ts` (OAuth providers: Google, GitHub)
- `proxy.ts` (Next.js 16 auth routing)
- `lib/security/cookie-config.ts` (sameSite: 'lax' for OAuth)

**Security Note**:
- `allowDangerousEmailAccountLinking: false` prevents account takeover
- Cookie sameSite='lax' required for OAuth callbacks

---

## 3. Email Verification Flow (with Retry Logic)

```
[User Registers] → [actions/register.ts]
  ↓
[Create User] → [Generate Verification Token]
  ↓
[queueVerificationEmail] → [lib/queue/email-tracking.ts]
  ↓
[Create EmailLog (status: QUEUED)]
  ↓
[Attempt 1] → [Update status: SENDING] → [Send via Resend API]
  → Success? → [Update status: SENT, sentAt: now()]
  → Failed? → [Exponential Backoff 1s] → [Attempt 2]
  ↓
[Attempt 2] → [Backoff 2s] → [Attempt 3]
  ↓
[Attempt 3] → [All Failed?] → [Update status: FAILED, lastError: "..."]
```

**User Experience:**
- Login attempt → "Email not verified" error
- Error includes clickable resend link
- Resend page has email pre-filled
- Rate limited: 3 attempts per 15 minutes
- Duplicate prevention: 2-minute check

**Key Files:**
- `actions/resend-verification.ts` - Rate-limited resend
- `lib/queue/email-tracking.ts` - Retry logic with tracking
- `components/auth/resend-verification-form.tsx` - User-friendly form
- `prisma/domains/02-auth.prisma` - EmailLog model

---

## 4. Session Fingerprinting & Risk Analysis

```
[Login Success] → [SessionManager.createSession]
  ↓
[Extract Device Fingerprint]
  - User Agent (Browser, OS, Device)
  - IP Address
  - Screen Resolution
  - Timezone Offset
  - Accept Language
  ↓
[Generate Fingerprint Hash (SHA-256)]
  ↓
[Check for Trusted Device] (by device ID)
  → YES → [Set trustLevel: TRUSTED]
  → NO → [Calculate Risk Based on New vs. Existing]
  ↓
[Create Session Record]
  - fingerprint hash
  - device metadata
  - initial risk level: LOW
  - trusted device ID (if applicable)
```

**Subsequent Requests:**

```
[User Request] → [SessionManager.validateSessionFingerprint]
  ↓
[Compare Current Fingerprint with Stored]
  ↓
[Calculate Similarity Score]
  - User Agent match: 40%
  - IP match: 30%
  - Resolution match: 20%
  - Other factors: 10%
  ↓
[Determine Risk Level]
  - 90%+ → LOW (continue normally)
  - 70-89% → MEDIUM (log event, allow with monitoring)
  - 50-69% → HIGH (alert user via email)
  - <50% → CRITICAL (terminate session + force re-auth)
```

**Key Files:**
- `lib/security/session-manager.ts` - Session fingerprinting
- `lib/security/device-fingerprint.ts` - Device tracking
- `prisma/domains/02-auth.prisma` - AuthSession model

---

## 5. MFA Enforcement Flow (Admins Only)

```
[Admin Created] → [createdAt timestamp recorded]
  ↓
[Admin Logs In] → [shouldEnforceMFAOnSignIn check] (auth.ts:140)
  ↓
[Calculate Days Since Account Created]
  ↓
[Enforcement Level Decision]
  - Days 7-4: [SOFT - Allow Login + No Banner]
  - Days 3-1: [WARNING - Show Warning Banner + Allow Login]
  - Day 0: [HARD - Block Login + Redirect to Setup]
  ↓
[Warning Period Active?]
  → YES → [Display MFA Warning Banner]
           - Red (1 day): "Action Required"
           - Amber (2-3 days): "Important"
           - Blue (4-7 days): "Reminder"
  → NO (Hard Enforcement) → [Block Login] → [Redirect: /admin/mfa-setup]
```

**MFA Setup Process:**

```
[Admin] → [/admin/mfa-setup]
  ↓
[TOTP Tutorial Component Displayed]
  - What is MFA explanation
  - Step-by-step guide
  - Recommended apps (Google, Microsoft, 1Password, Authy)
  ↓
[Generate TOTP Secret] → [Encrypt Secret] → [Display QR Code]
  ↓
[Admin Scans QR with App]
  ↓
[Admin Enters 6-Digit Code] → [Verify TOTP Token]
  ↓ Valid
[Generate 10 Recovery Codes] → [Encrypt Codes] → [Display Once]
  ↓
[Admin Saves Recovery Codes] → [Confirm Saved]
  ↓
[Update User Record]
  - totpEnabled: true
  - totpVerified: true
  - totpSecret: (encrypted)
  - recoveryCodes: (encrypted array)
  ↓
[MFA Active] → [All Future Logins Require 2FA]
```

**Key Files:**
- `lib/auth/mfa-enforcement.ts` - Grace period logic
- `components/admin/mfa-warning-banner.tsx` - Warning UI
- `components/admin/totp-tutorial.tsx` - Setup guide
- `lib/auth/totp.ts` - TOTP generation & verification

---

## 6. Session Timeout & Extension

```
[Admin Logs In] → [JWT Created with 4-hour expiry]
  ↓
[User Works on Dashboard]
  ↓
[SessionTimer Component Active] (checks every 1s)
  ↓
[Time Remaining < 5 minutes?]
  → YES → [Show Warning Banner]
          - Amber (5-2 min): "Session Timeout Warning"
          - Red (<1 min): "Session Expiring Soon! Save work!"
  ↓
[User Clicks "Extend Session"]
  → [useSession().update()] → [Refresh JWT] → [Reset Timer]
  ↓
[User Ignores Warning]
  → [Time Remaining = 0] → [Auto-redirect: /auth/login?session_expired=true]
```

**Key Files:**
- `components/auth/session-timer.tsx` - Real-time countdown
- `auth.ts` (session strategy: 'jwt')
- `auth.config.ts` (maxAge configuration)

---

## 7. GDPR Data Handling

### Data Export

```
[User] → [/settings/privacy] → [Click "Export My Data"]
  ↓
[POST /api/user/data-export]
  ↓
[Authenticate User] → [Query Database]
  - User profile
  - Accounts (OAuth)
  - Enrollments
  - Courses created
  - Posts, Comments, Articles, Blogs
  ↓
[Format as JSON]
  - Include export timestamp
  - Include export version
  ↓
[Return as Download]
  - Filename: taxomind-data-export-{userId}-{timestamp}.json
  - Content-Type: application/json
```

### Account Deletion

```
[User] → [/settings/privacy] → [Click "Delete Account"]
  ↓
[Show Confirmation Modal]
  - Enter email to confirm
  - Enter password (if credentials user)
  ↓
[POST /api/user/delete-account]
  ↓
[Validate Credentials] → [Begin Transaction]
  ↓
[Delete Personal Data]
  - Delete: Sessions, OAuth accounts, tokens
  - Anonymize: User record
    - name → "[Deleted User]"
    - email → "deleted_{id}_{timestamp}@example.com"
    - password → null
    - image → null
  ↓
[Keep for Audit]
  - role (for analytics)
  - createdAt (for retention analysis)
  - Anonymized content (posts, courses)
  ↓
[Commit Transaction] → [Log User Out] → [Redirect: /]
```

**Key Files:**
- `app/api/user/data-export/route.ts` - GDPR export
- `app/api/user/delete-account/route.ts` - GDPR deletion

---

## 8. Rate Limiting Strategy

```
[Auth Request] → [rateLimitAuth(endpoint, identifier)]
  ↓
[Determine Endpoint Limits]
  - login: 5 attempts / 15 min
  - admin-login: 3 attempts / 15 min
  - register: 3 attempts / 60 min
  - reset: 3 attempts / 15 min
  - verify: 3 attempts / 15 min
  - twoFactor: 5 attempts / 15 min
  ↓
[Check Redis/Upstash]
  - Key: rate-limit:{endpoint}:{identifier}
  - Current count
  - TTL (time to live)
  ↓
[Limit Exceeded?]
  → YES → [Return Error]
           - error message
           - retryAfter (seconds)
           - remaining: 0
  → NO → [Increment Counter]
         - remaining: limit - current
         - reset: timestamp of TTL expiry
  ↓
[Return Success]
  - success: true
  - remaining: X attempts left
  - reset: timestamp
```

**Key Files:**
- `lib/rate-limit-server.ts` - Rate limiting logic
- `@upstash/ratelimit` - Redis-backed rate limiting

---

## 9. Email Reliability & Status Tracking

```
[Email Trigger] → [queueVerificationEmail/queue2FAEmail/etc.]
  ↓
[Create EmailLog Entry]
  - userId
  - email address
  - type: VERIFICATION | TWO_FACTOR | PASSWORD_RESET
  - status: QUEUED
  - attempts: 0
  ↓
[sendEmailWithTracking]
  ↓
[Attempt 1]
  - Update: status = SENDING, attempts = 1
  - Call: sendEmail() via Resend API
  → Success?
     - Update: status = SENT, sentAt = now()
     - DONE ✅
  → Failed?
     - Log error
     - Wait 1s (exponential backoff)
  ↓
[Attempt 2]
  - Update: attempts = 2
  - Wait 2s if failed
  ↓
[Attempt 3]
  - Update: attempts = 3
  → All Failed?
     - Update: status = FAILED, lastError = "..."
```

**Frontend Status Indicator:**

```
[User Dashboard] → [EmailStatusIndicator Component]
  ↓
[Poll /api/email-status every 5s]
  ↓
[Get Latest EmailLog for User]
  ↓
[Display Status]
  - QUEUED/SENDING: Blue clock icon "Sending email..."
  - SENT: Green checkmark "Email sent successfully"
  - FAILED: Red X "Email failed. Click to retry."
```

**Key Files:**
- `lib/queue/email-tracking.ts` - Tracking & retry
- `lib/queue/email-queue-simple.ts` - Email queueing
- `app/api/email-status/route.ts` - Status API
- `prisma/domains/02-auth.prisma` - EmailLog model

---

## Security Best Practices Implemented

✅ **Authentication**
- Rate limiting on all auth endpoints
- Email verification required before login
- Strong password requirements
- Session fingerprinting
- MFA enforcement for admins

✅ **Authorization**
- Role-based access control (ADMIN, USER)
- Admin-only MFA enforcement
- Separate admin auth instance
- Protected routes via middleware

✅ **Data Protection**
- GDPR-compliant data export
- GDPR-compliant account deletion
- Encrypted TOTP secrets
- Encrypted recovery codes
- Secure cookie configuration

✅ **Audit & Compliance**
- Auth audit logs (sign-in, 2FA, failures)
- Email delivery tracking
- Session risk analysis
- Failed attempt tracking

✅ **User Experience**
- Clear error messages (security-safe)
- MFA warning banners (progressive)
- Session timeout warnings
- Email resend with rate limiting
- TOTP tutorial for first-time users

---

## Testing Checklist

- [ ] Credentials login (with/without MFA)
- [ ] OAuth login (Google, GitHub)
- [ ] Email verification flow
- [ ] Email resend with rate limiting
- [ ] Session timeout warning
- [ ] Session extension
- [ ] MFA warning banner (admin)
- [ ] MFA setup (TOTP + recovery codes)
- [ ] GDPR data export
- [ ] GDPR account deletion
- [ ] Rate limiting (all endpoints)
- [ ] Email delivery tracking
- [ ] Session fingerprinting
- [ ] Failed login audit logs

---

**For Implementation Details**: See `AUTH_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md`
**For Security Audit**: See `AUTH_SYSTEM_AUDIT_REPORT.md`
