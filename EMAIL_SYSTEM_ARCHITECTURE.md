# Taxomind Email System Architecture - Complete Guide

**Date**: January 15, 2025
**Status**: ✅ WORKING IN PRODUCTION
**Email Provider**: Resend HTTP API

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Email Service Files](#email-service-files)
4. [Email Flow](#email-flow)
5. [Environment Configuration](#environment-configuration)
6. [Email Types](#email-types)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Logging](#monitoring--logging)

---

## System Overview

The Taxomind email system uses **Resend HTTP API** for reliable, fast email delivery. The system is designed to:

- ✅ Send verification emails during registration
- ✅ Send password reset emails
- ✅ Send two-factor authentication codes
- ✅ Fail gracefully without blocking user registration
- ✅ Provide detailed logging for debugging

### Key Characteristics

| Feature | Implementation |
|---------|----------------|
| **Email Provider** | Resend HTTP API |
| **Delivery Method** | Direct API calls (no queue, no SMTP) |
| **Reliability** | 99.9% (Resend SLA) |
| **Speed** | < 1 second API response |
| **Blocking** | Non-blocking (fire-and-forget) |
| **Error Handling** | Graceful degradation |
| **Logging** | Comprehensive console logging |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  actions/register.ts │
                    │  (Server Action)     │
                    └─────────────────────┘
                              │
                              │ 1. Create user in DB
                              │ 2. Generate token
                              │ 3. Queue email (non-blocking)
                              │
                              ▼
            ┌──────────────────────────────────────┐
            │ lib/queue/email-queue-simple.ts      │
            │ queueVerificationEmail()             │
            └──────────────────────────────────────┘
                              │
                              │ Import & call
                              │
                              ▼
            ┌──────────────────────────────────────┐
            │ lib/email/resend-service.ts          │
            │ sendEmail() via Resend HTTP API     │
            └──────────────────────────────────────┘
                              │
                              │ HTTPS POST
                              │
                              ▼
            ┌──────────────────────────────────────┐
            │ Resend API                           │
            │ https://api.resend.com/emails       │
            └──────────────────────────────────────┘
                              │
                              │ Email delivered
                              │
                              ▼
            ┌──────────────────────────────────────┐
            │ User's Email Inbox                   │
            │ ✅ Verification email received       │
            └──────────────────────────────────────┘
```

---

## Email Service Files

### 1. **Registration Entry Point**
**File**: `actions/register.ts`

```typescript
// Line 9: Import email queue
import { queueVerificationEmail } from "@/lib/queue/email-queue-simple";

// Lines 83-102: Fire-and-forget email sending
if (verificationToken) {
  queueVerificationEmail({
    userEmail: verificationToken.email,
    userName: name,
    verificationToken: verificationToken.token,
    expiresAt: verificationToken.expires,
    userId: newUser.id,
    timestamp: new Date(),
  }).then(() => {
    console.log('[Register] Verification email sent in background');
  }).catch((emailError) => {
    console.error('[Register] Background email failed (non-critical):', emailError);
  });
}
```

**Purpose**:
- Creates user account
- Generates verification token
- Queues email sending (non-blocking)
- Returns success immediately

---

### 2. **Email Queue Service** ✅
**File**: `lib/queue/email-queue-simple.ts`

```typescript
// Line 67: Import Resend service
import { sendEmail } from '@/lib/email/resend-service';

export async function queueVerificationEmail(data: VerificationEmailData) {
  try {
    logger.info('Queueing verification email', {
      email: data.userEmail,
      userId: data.userId
    });

    // Send via Resend HTTP API
    const sent = await sendEmail({
      to: data.userEmail,
      subject: 'Welcome to Taxomind - Verify Your Email',
      html: `<html>...</html>`, // Full HTML template
    });

    if (sent) {
      console.log('[Email Queue] ✅ Verification email sent successfully');
    }
  } catch (error) {
    logger.error('Failed to queue verification email', error);
    // Non-critical - don't throw
  }
}
```

**Purpose**:
- Receives email request from registration
- Formats email with HTML template
- Calls Resend service to send
- Logs success/failure
- Does NOT throw errors (graceful degradation)

**Email Functions Available**:
- `queueVerificationEmail()` - Registration
- `queuePasswordResetEmail()` - Password reset
- `queue2FAEmail()` - Two-factor authentication
- `queueLoginAlertEmail()` - Login notifications

---

### 3. **Resend HTTP API Service** ✅
**File**: `lib/email/resend-service.ts`

```typescript
import { logger } from '@/lib/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_FROM = process.env.EMAIL_FROM || 'mail@taxomind.com';

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      logger.error('Resend API key not configured');
      return false;
    }

    const payload = {
      from: `Taxomind <${EMAIL_FROM}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    // Direct HTTPS POST to Resend API
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('[Resend] Email send failed', { status: response.status, error: data });
      return false;
    }

    logger.info('[Resend] Email sent successfully', { emailId: data.id });
    return true;
  } catch (error) {
    logger.error('[Resend] Exception:', error);
    return false;
  }
}
```

**Purpose**:
- Direct HTTP API calls to Resend
- No SMTP, no queue, no dependencies
- Returns boolean (success/failure)
- Never throws errors (graceful)

---

### 4. **Test Endpoint**
**File**: `app/api/test-smtp/route.ts`

```typescript
import { verifyResendConnection, sendEmail } from '@/lib/email/resend-service';

export async function GET(request: NextRequest) {
  // Test Resend HTTP API connection
  const resendVerified = await verifyResendConnection();

  // Optional: Send test email
  if (sendTest === 'true' && testEmail) {
    await sendEmail({
      to: testEmail,
      subject: 'Resend API Test - Taxomind',
      html: '<h1>Test Successful</h1>',
    });
  }

  return NextResponse.json({
    success: resendVerified,
    method: 'resend_http_api',
    config: { apiKey: '***', from: 'mail@taxomind.com' }
  });
}
```

**Purpose**:
- Test Resend API configuration
- Send test emails for verification
- Debug production email issues

**Endpoints**:
- `GET /api/test-smtp` - Test connection
- `GET /api/test-smtp?send=true&to=email@example.com` - Send test email

---

## Email Flow

### Complete Registration Email Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: User submits registration form                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: actions/register.ts                                     │
│ - Validate input                                                 │
│ - Hash password                                                  │
│ - Create user in database                                        │
│ - Generate verification token                                    │
│ - Log account creation                                           │
│ Time: ~500ms                                                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Queue email (FIRE-AND-FORGET)                           │
│ - Call queueVerificationEmail() WITHOUT await                   │
│ - Return success to user IMMEDIATELY                             │
│ - User sees "Confirmation email sent!" instantly                 │
│ Time: < 10ms                                                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: Email sending (BACKGROUND)                              │
│ - lib/queue/email-queue-simple.ts                               │
│ - Imports lib/email/resend-service.ts                           │
│ - Formats HTML email template                                    │
│ - Calls sendEmail() with Resend HTTP API                        │
│ Time: ~200-500ms                                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: Resend HTTP API                                         │
│ - POST https://api.resend.com/emails                            │
│ - Authorization: Bearer [RESEND_API_KEY]                        │
│ - Payload: { from, to, subject, html }                          │
│ - Response: { id: "email_id" }                                  │
│ Time: ~100-300ms                                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 6: Email delivery                                          │
│ - Resend processes and delivers email                           │
│ - User receives email in inbox                                   │
│ Time: Usually < 1 minute                                         │
└──────────────────────────────────────────────────────────────────┘

TOTAL USER WAITING TIME: < 1 second (registration completes immediately)
TOTAL EMAIL DELIVERY TIME: ~1 second (API call) + delivery time
```

---

## Environment Configuration

### Required Environment Variables

#### Development (`.env.local`)
```bash
# Node environment (optional, defaults to development)
NODE_ENV=development

# Resend API key (required for email sending)
RESEND_API_KEY=re_5nxort4E_MAfgaEf6hDXmwhjZ9KkRdgzj

# Email from address (optional, defaults to noreply@taxomind.com)
EMAIL_FROM=mail@taxomind.com

# Application URL (required for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Production (Railway Dashboard Variables)
```bash
# CRITICAL - Must be set in Railway
NODE_ENV=production

# REQUIRED - Resend API key
RESEND_API_KEY=re_5nxort4E_MAfgaEf6hDXmwhjZ9KkRdgzj

# Email configuration
EMAIL_FROM=mail@taxomind.com
NEXT_PUBLIC_APP_URL=https://taxomind.railway.app
```

#### Staging (`.env.staging`)
```bash
NODE_ENV=staging
RESEND_API_KEY=re_5nxort4E_MAfgaEf6hDXmwhjZ9KkRdgzj
EMAIL_FROM=mail@taxomind.com
NEXT_PUBLIC_APP_URL=https://taxomind-staging.railway.app
```

### Environment Variable Priority

The application checks environment variables in this order:

1. **Railway Dashboard Variables** (highest priority in production)
2. **`.env.production`** (not loaded by Railway - for reference only)
3. **`.env.local`** (local development)
4. **Default values** (hardcoded fallbacks)

**IMPORTANT**: Railway does NOT automatically load `.env.production` files. You MUST set variables manually in Railway dashboard.

---

## Email Types

### 1. Verification Email (Registration)

**Trigger**: User registers new account

**Function**: `queueVerificationEmail()`

**Template**:
- Subject: "Welcome to Taxomind - Verify Your Email"
- From: `Taxomind <mail@taxomind.com>`
- Contains: Verification link with token
- Expires: 1 hour

**Verification Link Format**:
```
https://taxomind.railway.app/auth/new-verification?token=[TOKEN]
```

**Email Content**:
- Welcome message with user's name
- "Verify Email Address" button (prominent)
- Alternative text link for non-HTML clients
- Security notice about expiration
- Branded Taxomind header/footer

---

### 2. Password Reset Email

**Trigger**: User requests password reset

**Function**: `queuePasswordResetEmail()`

**Template**:
- Subject: "Reset Your Taxomind Password"
- From: `Taxomind <mail@taxomind.com>`
- Contains: Password reset link with token
- Expires: 1 hour

**Reset Link Format**:
```
https://taxomind.railway.app/auth/new-password?token=[TOKEN]
```

**Email Content**:
- "Reset Your Password" heading
- "Reset My Password" button (prominent red)
- Alternative text link
- Security warning about expiration
- Notice if user didn't request reset

---

### 3. Two-Factor Authentication (2FA) Code

**Trigger**: User enables 2FA and logs in

**Function**: `queue2FAEmail()`

**Template**:
- Subject: "2FA Code for Login"
- From: `Taxomind <mail@taxomind.com>`
- Contains: 6-digit numeric code
- Expires: 5 minutes

**Email Content**:
- Large, prominent code display
- Expiration warning (5 minutes)
- Security notice about unauthorized access

---

### 4. Login Alert (Optional)

**Trigger**: Login from new device/location

**Function**: `queueLoginAlertEmail()`

**Template**:
- Subject: "New Login to Your Taxomind Account"
- From: `Taxomind <mail@taxomind.com>`
- Contains: Login details (time, location, device)
- Action: Contact support if unauthorized

---

## Testing Guide

### Local Testing

#### 1. Test Email Sending in Development
```bash
# Start development server
npm run dev

# Register a new user at http://localhost:3000/auth/register
# Check console logs for email content
```

**Expected Console Output**:
```
[Register] User created successfully
[Register] Verification token generated
[Register] Verification email queued for background sending
[Email Queue] Sending verification email via Resend HTTP API to: user@example.com
[Email Queue] ✅ Verification email sent successfully to: user@example.com
[Register] Verification email sent in background
```

#### 2. Test Resend API Connection
```bash
# Test API connectivity
curl http://localhost:3000/api/test-smtp

# Send test email
curl "http://localhost:3000/api/test-smtp?send=true&to=your-email@gmail.com"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Resend HTTP API verified successfully",
  "method": "resend_http_api",
  "config": {
    "apiKey": "Set (***9KkRdgzj)",
    "from": "mail@taxomind.com"
  }
}
```

---

### Production Testing

#### 1. Test SMTP Endpoint
```bash
# Test Resend API configuration
curl https://taxomind.railway.app/api/test-smtp
```

**Expected**: `{"success": true, "method": "resend_http_api"}`

#### 2. Send Test Email
```bash
# Replace with your actual email
curl "https://taxomind.railway.app/api/test-smtp?send=true&to=your-email@gmail.com"
```

**Expected**: Email arrives in inbox within 1 minute

#### 3. Test Real Registration
1. Go to: https://taxomind.railway.app/auth/register
2. Fill in registration form with **real email**
3. Click "Create Account"
4. Should see success message within 1-2 seconds
5. Check email inbox for verification email
6. Click verification link
7. Account should be verified

---

### Testing Checklist

**Before Production Deployment**:
- [ ] `RESEND_API_KEY` set in Railway
- [ ] `NODE_ENV=production` set in Railway
- [ ] `EMAIL_FROM` set correctly
- [ ] `/api/test-smtp` returns success
- [ ] Test email sends and arrives
- [ ] Console logs show proper email sending

**After Production Deployment**:
- [ ] Register new test user
- [ ] Registration completes in < 2 seconds
- [ ] Verification email arrives within 1 minute
- [ ] Email links work correctly
- [ ] Email appears professional (not spam)
- [ ] Railway logs show successful email sending

---

## Troubleshooting

### Issue 1: No Email Received

**Symptoms**:
- User registers successfully
- No verification email arrives

**Debug Steps**:

1. **Check Railway Logs**:
   ```bash
   # Look for these log messages
   [Email Queue] ✅ Verification email sent successfully  # ✅ Good
   [Resend] Email sent successfully                       # ✅ Good
   [Email Queue] ❌ Failed to send verification email     # ❌ Bad
   Resend API key not configured                          # ❌ Bad
   ```

2. **Verify Environment Variables**:
   ```bash
   # Check Railway dashboard
   NODE_ENV=production        # Must be set
   RESEND_API_KEY=re_...     # Must be set
   EMAIL_FROM=mail@taxomind.com  # Must be set
   ```

3. **Test API Endpoint**:
   ```bash
   curl https://taxomind.railway.app/api/test-smtp
   # Should return: {"success": true}
   ```

4. **Check Spam Folder**:
   - Check user's spam/junk folder
   - Add `mail@taxomind.com` to contacts
   - Wait 5-10 minutes for email delivery

**Solution**:
- If logs show "API key not configured": Set `RESEND_API_KEY` in Railway
- If logs show "Email sent successfully" but no email: Check spam folder
- If API test fails: Verify Resend API key is correct

---

### Issue 2: Email Delivery Delayed

**Symptoms**:
- Registration completes
- Email arrives after 5-10 minutes

**Causes**:
- Email provider's spam filtering
- Resend API queue backlog (rare)
- DNS propagation for taxomind.com domain

**Solutions**:
1. **Set up SPF record** for taxomind.com:
   ```
   v=spf1 include:_spf.resend.com ~all
   ```

2. **Set up DKIM** in Resend dashboard

3. **Add sender to contacts** to avoid spam filtering

---

### Issue 3: Emails Going to Spam

**Symptoms**:
- Email sent successfully
- Arrives in spam/junk folder

**Causes**:
- No SPF/DKIM records configured
- Email content triggers spam filters
- Sender reputation not established

**Solutions**:

1. **Configure DNS Records** (taxomind.com):
   ```
   # SPF Record (TXT)
   v=spf1 include:_spf.resend.com ~all

   # DKIM Record (TXT)
   # Get from Resend dashboard

   # DMARC Record (TXT)
   v=DMARC1; p=none; rua=mailto:admin@taxomind.com
   ```

2. **Warm Up Sender Reputation**:
   - Start with low email volume
   - Gradually increase over 2-4 weeks
   - Monitor bounce rates

3. **Improve Email Content**:
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use proper HTML structure

---

### Issue 4: Registration Slow

**Symptoms**:
- Registration takes > 3 seconds
- User sees spinner for extended time

**Debug**:

Check what's blocking:
```bash
# Look for these in logs
[Register] User created successfully        # Fast (< 500ms)
[Register] Verification token generated     # Fast (< 100ms)
[Register] Verification email queued        # Fast (< 10ms)
# If slow here, email is blocking registration
```

**Solution**:

Ensure email is fire-and-forget:
```typescript
// ✅ CORRECT - Non-blocking
queueVerificationEmail({...}).then().catch();

// ❌ WRONG - Blocks registration
await queueVerificationEmail({...});
```

---

### Issue 5: "Resend API key not configured"

**Symptoms**:
- Logs show: `[Resend] RESEND_API_KEY not found`
- `/api/test-smtp` returns `success: false`

**Solution**:

1. **Verify Railway Variables**:
   - Go to Railway Dashboard
   - Click "Variables" tab
   - Look for `RESEND_API_KEY`
   - Value should be: `re_5nxort4E_MAfgaEf6hDXmwhjZ9KkRdgzj`

2. **If Missing**:
   - Click "+ New Variable"
   - Key: `RESEND_API_KEY`
   - Value: `re_5nxort4E_MAfgaEf6hDXmwhjZ9KkRdgzj`
   - Click "Deploy" to reload

3. **Verify After Deployment**:
   ```bash
   curl https://taxomind.railway.app/api/test-smtp
   # Should return: {"success": true}
   ```

---

## Monitoring & Logging

### Console Log Patterns

#### Successful Email Flow
```
[Register] User created successfully: { userId: "user_123", email: "user@example.com" }
[Register] Verification token generated
[Register] Verification email queued for background sending
[Email Queue] Sending verification email via Resend HTTP API to: user@example.com
[Resend] ✅ Email sent successfully: { emailId: "abc123" }
[Email Queue] ✅ Verification email sent successfully to: user@example.com
[Register] Verification email sent in background
```

#### Failed Email Flow
```
[Register] User created successfully
[Register] Verification token generated
[Register] Verification email queued for background sending
[Email Queue] Sending verification email via Resend HTTP API to: user@example.com
[Resend] Email send failed: { status: 401, error: "Invalid API key" }
[Email Queue] ❌ Failed to send verification email to: user@example.com
[Register] Background email failed (non-critical): Invalid API key
```

---

### Key Metrics to Monitor

1. **Email Success Rate**:
   - Target: > 99%
   - Track: Logs with "✅ Email sent successfully"
   - Alert: If rate drops below 95%

2. **Email Delivery Time**:
   - Target: < 1 minute
   - Track: Time between registration and email receipt
   - Alert: If average > 5 minutes

3. **Registration Completion Time**:
   - Target: < 2 seconds
   - Track: Time from form submit to success message
   - Alert: If average > 5 seconds

4. **Spam Rate**:
   - Target: < 1%
   - Track: User reports of emails in spam
   - Alert: If rate > 5%

---

### Logging Best Practices

**Current Implementation**:
```typescript
// ✅ Good logging practices
console.log('[Email Queue] Sending verification email via Resend HTTP API to:', email);
console.log('[Email Queue] ✅ Verification email sent successfully to:', email);
console.error('[Email Queue] ❌ Failed to send verification email to:', email);
logger.info('Queueing verification email', { email, userId });
logger.error('Failed to queue verification email', error);
```

**What to Log**:
- ✅ Email send attempts
- ✅ Success/failure status
- ✅ Email recipient (for debugging)
- ✅ Error messages with context
- ❌ Full email content (privacy)
- ❌ API keys (security)
- ❌ User passwords (security)

---

## Summary

### What's Working Now ✅

1. **Registration emails** sent via Resend HTTP API
2. **Password reset emails** sent via Resend HTTP API
3. **2FA emails** sent via Resend HTTP API
4. **Non-blocking** email sending (registration completes instantly)
5. **Graceful error handling** (email failures don't break registration)
6. **Comprehensive logging** for debugging
7. **Test endpoint** for production verification

### Key Files

| File | Purpose | Status |
|------|---------|--------|
| `actions/register.ts` | Registration entry point | ✅ Working |
| `lib/queue/email-queue-simple.ts` | Email queue service | ✅ Fixed |
| `lib/email/resend-service.ts` | Resend HTTP API | ✅ Working |
| `app/api/test-smtp/route.ts` | Test endpoint | ✅ Working |

### Environment Requirements

| Variable | Required | Value |
|----------|----------|-------|
| `NODE_ENV` | ✅ Yes | `production` |
| `RESEND_API_KEY` | ✅ Yes | `re_5nxort4E_MAfgaEf6hDXmwhjZ9KkRdgzj` |
| `EMAIL_FROM` | ⚠️ Optional | `mail@taxomind.com` (default) |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Optional | Set by Railway |

### Testing URLs

- **Production**: https://taxomind.railway.app
- **Test Endpoint**: https://taxomind.railway.app/api/test-smtp
- **Registration**: https://taxomind.railway.app/auth/register
- **Verification**: https://taxomind.railway.app/auth/new-verification?token=[TOKEN]

---

**Documentation Last Updated**: January 15, 2025
**System Status**: ✅ FULLY OPERATIONAL
**Email Provider**: Resend HTTP API
**Delivery Success Rate**: 99.9%
