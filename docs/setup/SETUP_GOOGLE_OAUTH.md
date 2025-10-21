# Google OAuth Setup Guide for Taxomind

**Date**: January 15, 2025
**Purpose**: Enable "Sign in with Google" functionality
**Status**: Ready to configure

---

## Prerequisites

- Google Account (Gmail)
- Access to Google Cloud Console
- Taxomind application running locally and in production

---

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
- Navigate to: https://console.cloud.google.com/
- Sign in with your Google account

### 1.2 Create New Project
1. Click the project dropdown (top left)
2. Click "New Project"
3. Enter project details:
   - **Project Name**: `Taxomind`
   - **Organization**: (leave blank or select if you have one)
4. Click "Create"
5. Wait for project creation (takes ~30 seconds)
6. Select the newly created project from the dropdown

---

## Step 2: Configure OAuth Consent Screen

### 2.1 Navigate to OAuth Consent Screen
1. In Google Cloud Console, go to:
   - **APIs & Services** → **OAuth consent screen**
   - Or direct link: https://console.cloud.google.com/apis/credentials/consent

### 2.2 Choose User Type
- Select **External** (allows any Google user to sign in)
- Click "Create"

### 2.3 Configure OAuth Consent Screen - App Information

**Page 1: App Information**

| Field | Value |
|-------|-------|
| **App name** | `Taxomind` |
| **User support email** | Your email (select from dropdown) |
| **App logo** | (Optional) Upload Taxomind logo |
| **Application homepage** | `https://taxomind.railway.app` |
| **Application privacy policy** | `https://taxomind.railway.app/privacy` |
| **Application terms of service** | `https://taxomind.railway.app/terms` |
| **Authorized domains** | `taxomind.railway.app`<br>`railway.app` |
| **Developer contact email** | Your email |

Click "Save and Continue"

**Page 2: Scopes**

Add these scopes (click "Add or Remove Scopes"):
- ✅ `openid` - OpenID Connect
- ✅ `email` - View email address
- ✅ `profile` - View basic profile info

Click "Update" → "Save and Continue"

**Page 3: Test Users** (Optional for development)

Add test users if you want to test before publishing:
- Click "Add Users"
- Enter email addresses (comma-separated)
- Click "Add"
- Click "Save and Continue"

**Page 4: Summary**

Review all information and click "Back to Dashboard"

---

## Step 3: Create OAuth Credentials

### 3.1 Navigate to Credentials
1. Go to: **APIs & Services** → **Credentials**
2. Or direct link: https://console.cloud.google.com/apis/credentials

### 3.2 Create OAuth Client ID
1. Click **"+ Create Credentials"** (top of page)
2. Select **"OAuth client ID"**

### 3.3 Configure OAuth Client

**Application type**: Web application

**Name**: `Taxomind Web Client`

**Authorized JavaScript origins** (click "Add URI"):
```
http://localhost:3000
https://taxomind.railway.app
https://taxomind-staging.railway.app
```

**Authorized redirect URIs** (click "Add URI"):
```
http://localhost:3000/api/auth/callback/google
https://taxomind.railway.app/api/auth/callback/google
https://taxomind-staging.railway.app/api/auth/callback/google
```

**Important Notes**:
- Must include `/api/auth/callback/google` path
- Must match your NextAuth URL exactly
- Add all environments (local, staging, production)

### 3.4 Create and Save Credentials

1. Click "Create"
2. A dialog will appear with your credentials:
   - **Client ID**: `1234567890-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxx`
3. Click "Download JSON" (optional, for backup)
4. Click "OK"

**⚠️ IMPORTANT**: Copy these credentials immediately - you'll need them in the next step!

---

## Step 4: Add Credentials to Environment Files

### 4.1 Local Development (`.env.local`)

Open `.env.local` and add (or update) these lines:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_SECRET_HERE"
```

**Example**:
```bash
# Google OAuth
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-1a2b3c4d5e6f7g8h9i0j"
```

### 4.2 Staging Environment (`.env.staging`)

Open `.env.staging` and add:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_SECRET_HERE"
```

### 4.3 Production Environment (`.env.production`)

Open `.env.production` and add:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_SECRET_HERE"
```

### 4.4 Railway Dashboard (Production/Staging)

**CRITICAL**: Railway doesn't load `.env` files automatically. You must set variables manually:

1. Go to: https://railway.app
2. Select your Taxomind project
3. Click "Variables" tab
4. Add these variables:
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: Your Client ID
   - **Key**: `GOOGLE_CLIENT_SECRET`
   - **Value**: Your Client Secret
5. Click "Deploy" to reload with new variables

---

## Step 5: Verify Configuration

### 5.1 Check Environment Variables

```bash
# In your project root
cat .env.local | grep GOOGLE

# Should show:
# GOOGLE_CLIENT_ID="..."
# GOOGLE_CLIENT_SECRET="..."
```

### 5.2 Restart Development Server

```bash
# Stop current server (Ctrl+C)

# Start fresh
npm run dev
```

### 5.3 Check Server Logs

Look for confirmation that Google provider is loaded:
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
✓ Ready in 2.5s
```

No errors about missing `GOOGLE_CLIENT_ID` means it's configured correctly!

---

## Step 6: Test Google OAuth

### 6.1 Test Locally

1. Open: http://localhost:3000/auth/login
2. You should see a "Sign in with Google" button
3. Click the button
4. Google OAuth consent screen should appear
5. Select your Google account
6. Grant permissions
7. Should redirect to Taxomind dashboard
8. Check user is logged in

### 6.2 Test in Production

1. Open: https://taxomind.railway.app/auth/login
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify login successful

---

## Step 7: Check Login Button (Optional)

If you don't see the "Sign in with Google" button, check your login form:

**File**: `app/(auth)/auth/login/page.tsx` or `components/auth/login-form.tsx`

Should have social login buttons:

```typescript
<Social /> // This component should render Google/GitHub buttons
```

Let me check your login form to ensure social buttons are present.

---

## Troubleshooting

### Issue 1: "Error: Configuration" on Login Page

**Cause**: Missing or invalid `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`

**Solution**:
1. Verify environment variables are set correctly
2. Restart development server
3. Check for typos in Client ID/Secret
4. Ensure no extra spaces or quotes

---

### Issue 2: "Redirect URI Mismatch" Error

**Error Message**:
```
Error 400: redirect_uri_mismatch
The redirect URI in the request: http://localhost:3000/api/auth/callback/google
does not match the ones authorized for the OAuth client.
```

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Click your OAuth Client ID
3. Verify "Authorized redirect URIs" includes EXACTLY:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Save and try again (may take a few minutes to propagate)

---

### Issue 3: OAuth Consent Screen Shows "Unverified App"

**Warning Message**: "This app isn't verified"

**This is NORMAL for development!**

**Solution**:
- For development/testing: Click "Advanced" → "Go to Taxomind (unsafe)"
- For production: Submit app for verification (see Step 8)

**Verification is optional** if you're only using with known users.

---

### Issue 4: User Can't Sign In After OAuth

**Symptoms**:
- OAuth flow completes successfully
- Redirects to error page
- User not logged in

**Debug Steps**:

1. **Check Database**:
   ```bash
   # Open Prisma Studio
   npm run dev:db:studio

   # Check if Account was created
   # Look in Account table for provider: "google"
   ```

2. **Check Server Logs**:
   ```bash
   # Look for:
   [NextAuth] Error: ...
   linkAccount event triggered
   signIn callback triggered: { provider: 'google', userId: '...' }
   ```

3. **Verify Email in Database**:
   - User's email from Google must not conflict with existing user
   - Check `User` table for email address

**Solution**:
- If email already exists with password: Use "Link Account" feature
- If OAuth provider not linked: Check `Account` table in database
- If error in logs: Check NextAuth configuration in `auth.config.ts`

---

### Issue 5: "Access Blocked" by Google

**Error**: "This app has not been verified yet by Google"

**Cause**: App is in testing mode and user is not added as test user

**Solutions**:

**Option A**: Add user as test user (quick fix)
1. Go to OAuth Consent Screen
2. Add user's email to "Test users"
3. Save
4. User can now sign in

**Option B**: Publish app (for production)
1. Go to OAuth Consent Screen
2. Click "Publish App"
3. Submit for verification (optional)
4. All users can sign in (verification takes 1-6 weeks)

---

## Step 8: Publish OAuth App (Optional - For Production)

### When to Publish

- ✅ You're ready for public users
- ✅ App is stable and tested
- ✅ Privacy policy and Terms of Service are live
- ⏸️ Don't need to publish if only you/team will use it

### How to Publish

1. **Prepare Requirements**:
   - ✅ Privacy Policy URL: https://taxomind.railway.app/privacy
   - ✅ Terms of Service URL: https://taxomind.railway.app/terms
   - ✅ App homepage: https://taxomind.railway.app
   - ✅ App logo (recommended 120x120px)

2. **Submit for Publishing**:
   - Go to OAuth Consent Screen
   - Click "Publish App"
   - Confirm publishing
   - App will be in "Pending Verification" status

3. **Optional: Submit for Verification**:
   - Required only if using sensitive scopes
   - For `openid`, `email`, `profile`: Verification not required!
   - Verification takes 1-6 weeks

### App Status Meanings

| Status | Meaning | User Experience |
|--------|---------|-----------------|
| **Testing** | Only test users can sign in | Shows "Unverified app" warning |
| **Published** | Any user can sign in | Shows "Unverified app" warning |
| **Verified** | Verified by Google | No warning, trusted badge |

**For Taxomind**: Published status is sufficient! Verification is optional.

---

## Step 9: Monitor OAuth Usage

### Check OAuth Activity

1. **Google Cloud Console**:
   - Go to: APIs & Services → OAuth consent screen
   - View: User activity, consent grants

2. **Taxomind Database**:
   ```bash
   npm run dev:db:studio

   # Check Account table
   # Filter by: provider = "google"
   # See all Google OAuth users
   ```

3. **Audit Logs**:
   - Check: `AuthAuditLog` table
   - Look for: `action = "OAUTH_SUCCESS"`
   - Provider: `google`

---

## Security Best Practices

### 1. Protect Client Secret

**❌ NEVER**:
- Commit `.env.local`, `.env.production` to git
- Share Client Secret publicly
- Use same credentials across multiple apps

**✅ ALWAYS**:
- Add `.env*` to `.gitignore`
- Use different credentials for dev/prod (if possible)
- Rotate secrets if leaked

### 2. Validate Redirect URIs

**Only allow**:
- Your own domains
- Localhost for development
- No wildcards (security risk)

### 3. Limit OAuth Scopes

**Current scopes** (minimal, secure):
- `openid` - User identity
- `email` - Email address
- `profile` - Name, picture

**Don't request** unless needed:
- Drive access
- Calendar access
- Other sensitive permissions

### 4. Monitor for Suspicious Activity

**Check for**:
- Unusual login patterns
- Multiple failed OAuth attempts
- Unknown redirect URIs in error logs

---

## Complete Checklist

### Development
- [ ] Google Cloud Project created
- [ ] OAuth Consent Screen configured
- [ ] OAuth Client ID created
- [ ] Redirect URIs added (localhost)
- [ ] Credentials added to `.env.local`
- [ ] Development server restarted
- [ ] "Sign in with Google" button appears
- [ ] OAuth flow works locally
- [ ] User account created in database
- [ ] User logged in successfully

### Staging
- [ ] Credentials added to `.env.staging`
- [ ] Redirect URIs added (staging domain)
- [ ] Deployed to Railway staging
- [ ] Tested on staging URL
- [ ] OAuth flow works in staging

### Production
- [ ] Credentials added to Railway Variables
- [ ] Redirect URIs added (production domain)
- [ ] Deployed to Railway production
- [ ] OAuth Consent Screen published (optional)
- [ ] Tested on production URL
- [ ] OAuth flow works in production
- [ ] Monitoring enabled

---

## Summary

### What You Get

✅ **"Sign in with Google" button** on login page
✅ **One-click registration** for new users
✅ **Automatic email verification** (Google verifies emails)
✅ **Profile data** (name, email, picture) from Google
✅ **Secure authentication** (OAuth 2.0 standard)
✅ **No password management** for users

### What Happens When User Signs In

1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. User grants permissions
4. Google redirects back to Taxomind
5. NextAuth creates/links account in database
6. User logged in automatically
7. Redirected to dashboard

### Database Tables Used

1. **User** - Stores user profile
2. **Account** - Stores OAuth connection
   - `provider`: "google"
   - `providerAccountId`: User's Google ID
   - `access_token`: (optional) Google access token
3. **Session** - Stores active sessions
4. **AuthAuditLog** - Logs OAuth events

---

## Next Steps

After setting up Google OAuth:

1. **Set up GitHub OAuth** (similar process)
2. **Test both providers** work correctly
3. **Add account linking** (allow users to link multiple providers)
4. **Monitor usage** in audit logs
5. **Consider verification** if going fully public

---

## Support

If you encounter issues:

1. **Check logs**: Railway logs or local console
2. **Verify credentials**: Double-check Client ID/Secret
3. **Test redirect URIs**: Must match exactly
4. **Review OAuth consent screen**: Ensure properly configured
5. **Check database**: Verify Account records are created

---

**Setup Guide Complete**
**Ready for**: Google OAuth activation
**Next**: Create Google Cloud credentials and add to environment
