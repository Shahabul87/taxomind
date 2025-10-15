# GitHub OAuth Setup Guide for Taxomind

**Date**: January 15, 2025
**Purpose**: Enable "Sign in with GitHub" functionality
**Status**: Ready to configure

---

## Prerequisites

- GitHub Account
- Taxomind application running locally and in production
- Admin access to your GitHub account settings

---

## Step 1: Create GitHub OAuth App

### 1.1 Navigate to GitHub Developer Settings

1. **Sign in to GitHub**: https://github.com
2. **Click your profile photo** (top right)
3. **Select "Settings"** from dropdown
4. **Scroll to bottom** → Click **"Developer settings"** (left sidebar)
5. **Click "OAuth Apps"** (left sidebar)
6. **Click "New OAuth App"** (or "Register a new application")

**Direct Link**: https://github.com/settings/developers

---

## Step 2: Configure OAuth Application

### 2.1 Fill in Application Details

On the "Register a new OAuth application" page, enter:

| Field | Value |
|-------|-------|
| **Application name** | `Taxomind` |
| **Homepage URL** | `https://taxomind.com` |
| **Application description** | `Intelligent Learning Management System with AI-powered adaptive learning` (optional) |
| **Authorization callback URL** | `http://localhost:3000/api/auth/callback/github` |

**Important Notes**:
- Application name is shown to users during OAuth consent
- Homepage URL must be a valid URL (https required for production)
- Authorization callback URL is critical - must match exactly

### 2.2 Add Multiple Callback URLs

GitHub only allows **ONE** callback URL in the registration form. After creating the app, you'll add more.

**Initial Setup**: Use localhost for development
```
http://localhost:3000/api/auth/callback/github
```

Click **"Register application"**

---

## Step 3: Get Your Credentials

After registration, you'll see your OAuth app details:

### 3.1 Copy Client ID
- **Client ID**: Displayed immediately (example: `Ov23liAaBbCcDdEeFfGg`)
- **Copy this value** - you'll need it

### 3.2 Generate Client Secret
1. Click **"Generate a new client secret"** button
2. **Client Secret** will be shown **ONCE** (example: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`)
3. **⚠️ COPY IT IMMEDIATELY** - you can't see it again!
4. If you lose it, you'll need to generate a new one

**Example Credentials**:
```
Client ID: Ov23liAaBbCcDdEeFfGg
Client Secret: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
```

---

## Step 4: Add Additional Callback URLs

### 4.1 Update Authorization Callback URLs

1. **On your OAuth App page**, scroll to **"Authorization callback URL"**
2. Click **"Update application"** or edit the callback URL
3. **Unfortunately, GitHub only supports ONE callback URL per OAuth App**

### 4.2 Solution for Multiple Environments

**Option A: Use ONE OAuth App with Dynamic Redirects** (Recommended)
- Use production domain as callback URL
- NextAuth will handle redirects for all environments

**Option B: Create Separate OAuth Apps** (More Control)
- **Taxomind Development** - for localhost
- **Taxomind Production** - for production domains

### 4.3 Recommended Setup (Option A)

**Single OAuth App Configuration**:

| Environment | Callback URL | Notes |
|-------------|-------------|-------|
| **Development** | `http://localhost:3000/api/auth/callback/github` | Set this as the callback URL |
| **Staging** | `https://taxomind-production.up.railway.app/api/auth/callback/github` | (Change when testing staging) |
| **Production** | `https://taxomind.com/api/auth/callback/github` | (Change when deploying prod) |

**Best Practice**: Create 3 separate OAuth Apps for proper environment isolation:

---

## Step 5: Create Separate OAuth Apps (Recommended for Production)

### 5.1 Development OAuth App

**Application name**: `Taxomind (Development)`
**Homepage URL**: `http://localhost:3000`
**Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

**Use credentials in**: `.env.local`

### 5.2 Production OAuth App

**Application name**: `Taxomind`
**Homepage URL**: `https://taxomind.com`
**Authorization callback URL**: `https://taxomind.com/api/auth/callback/github`

**Alternate callback URLs** (you'll need to create multiple apps or switch):
- `https://taxomind-production.up.railway.app/api/auth/callback/github`

**Use credentials in**: Railway Variables (production)

---

## Step 6: Add Credentials to Environment Files

### 6.1 Local Development (`.env.local`)

Open `.env.local` and add (or update) these lines:

```bash
# OAuth - GitHub Sign In
GITHUB_CLIENT_ID="Ov23liAaBbCcDdEeFfGg"
GITHUB_CLIENT_SECRET="1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"
```

**Replace with your actual credentials from Step 3**

### 6.2 Production Environment (`.env.production`)

Open `.env.production` and add:

```bash
# OAuth - GitHub Sign In
GITHUB_CLIENT_ID="Ov23liXxYyZzAaBbCcDd"
GITHUB_CLIENT_SECRET="9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g"
```

**Use production OAuth App credentials**

### 6.3 Railway Dashboard (Production)

**CRITICAL**: Railway doesn't load `.env` files automatically. You must set variables manually:

1. Go to: https://railway.app
2. Select your **Taxomind** project
3. Click **"Variables"** tab
4. Add these variables:
   - **Key**: `GITHUB_CLIENT_ID`
   - **Value**: Your Client ID (production app)
   - **Key**: `GITHUB_CLIENT_SECRET`
   - **Value**: Your Client Secret (production app)
5. Click **"Deploy"** to reload with new variables

---

## Step 7: Verify Configuration

### 7.1 Check Environment Variables

```bash
# In your project root
cat .env.local | grep GITHUB

# Should show:
# GITHUB_CLIENT_ID="..."
# GITHUB_CLIENT_SECRET="..."
```

### 7.2 Restart Development Server

```bash
# Stop current server (Ctrl+C)

# Start fresh
npm run dev
```

### 7.3 Check Server Logs

Look for confirmation that GitHub provider is loaded:
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
✓ Ready in 2.5s
```

No errors about missing `GITHUB_CLIENT_ID` means it's configured correctly!

---

## Step 8: Test GitHub OAuth

### 8.1 Test Locally

1. Open: http://localhost:3000/auth/login
2. You should see a **"Sign in with GitHub"** button
3. Click the button
4. GitHub authorization page should appear
5. Click **"Authorize [Your App Name]"**
6. Should redirect to Taxomind dashboard
7. Check user is logged in

### 8.2 Test in Production

1. Open: https://taxomind.com/auth/login
2. Click **"Sign in with GitHub"**
3. Complete OAuth flow
4. Verify login successful

---

## Step 9: Update OAuth App Settings (Optional)

### 9.1 Application Logo

1. Go to your OAuth App settings
2. Scroll to **"Application logo"**
3. Upload Taxomind logo (PNG, 200x200px recommended)
4. Click **"Update application"**

### 9.2 Application Description

Add a user-friendly description:
```
Taxomind is an intelligent learning management system with AI-powered
adaptive learning, personalized course recommendations, and real-time
progress tracking.
```

---

## Troubleshooting

### Issue 1: "Application Not Found" Error

**Cause**: Wrong Client ID or Client Secret

**Solution**:
1. Go to GitHub OAuth App settings
2. Verify Client ID matches your environment variable
3. Generate new Client Secret if needed
4. Update `.env.local` with new credentials
5. Restart development server

---

### Issue 2: "Redirect URI Mismatch" Error

**Error Message**:
```
The redirect_uri MUST match the registered callback URL for this application.
```

**Solution**:
1. Check your OAuth App **"Authorization callback URL"**
2. Verify it EXACTLY matches:
   - Development: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://taxomind.com/api/auth/callback/github`
3. No trailing slashes
4. Correct protocol (http vs https)
5. Save changes and try again

---

### Issue 3: User Can't Sign In After OAuth

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
   # Look in Account table for provider: "github"
   ```

2. **Check Server Logs**:
   ```bash
   # Look for:
   [NextAuth] Error: ...
   signIn callback triggered: { provider: 'github', userId: '...' }
   ```

3. **Verify Email in Database**:
   - User's email from GitHub must not conflict with existing user
   - Check `User` table for email address

**Solution**:
- If email already exists with password: Use "Link Account" feature
- If OAuth provider not linked: Check `Account` table in database
- If error in logs: Check NextAuth configuration in `auth.config.ts`

---

### Issue 4: GitHub Rate Limiting

**Error**: "You have been rate limited"

**Cause**: Too many OAuth requests in short time

**Solution**:
1. Wait 5-10 minutes
2. Try again
3. For development, use a GitHub test account
4. For production, rate limits are much higher

---

### Issue 5: Email Permission Not Granted

**Symptoms**:
- User signs in successfully
- But no email address in database
- User profile incomplete

**Cause**: GitHub user's email is private or not verified

**Solution**:
1. **User must verify email** in GitHub settings
2. **User must make email public** (or at least visible to apps)
3. Update OAuth app scope to request email explicitly

**Check User's GitHub Email Settings**:
- Go to: https://github.com/settings/emails
- **Uncheck** "Keep my email addresses private" (if they want to use GitHub OAuth)
- **Verify** at least one email address

---

## Security Best Practices

### 1. Protect Client Secret

**❌ NEVER**:
- Commit `.env.local`, `.env.production` to git
- Share Client Secret publicly on GitHub, forums, etc.
- Use same credentials across multiple apps
- Expose Client Secret in frontend code

**✅ ALWAYS**:
- Add `.env*` to `.gitignore` (already done in Taxomind)
- Use different credentials for dev/prod
- Rotate secrets if leaked or compromised
- Store production secrets in Railway Variables

### 2. Limit OAuth Scope

**Current scopes** (minimal, secure):
- `read:user` - Basic user profile
- `user:email` - Email address

**Don't request** unless needed:
- `repo` - Repository access
- `admin:org` - Organization admin
- `delete_repo` - Repository deletion
- Other sensitive permissions

### 3. Monitor for Suspicious Activity

**Check for**:
- Unusual login patterns
- Multiple failed OAuth attempts
- Unknown IP addresses in audit logs

### 4. Webhook Security (Advanced)

If you set up GitHub webhooks in the future:
- Always verify webhook signatures
- Use HTTPS endpoints only
- Validate payload structure
- Rate limit webhook endpoints

---

## Complete Checklist

### Development
- [ ] GitHub OAuth App created (Development)
- [ ] Client ID and Secret obtained
- [ ] Authorization callback URL set (`http://localhost:3000/api/auth/callback/github`)
- [ ] Credentials added to `.env.local`
- [ ] Development server restarted
- [ ] "Sign in with GitHub" button appears on login page
- [ ] OAuth flow works locally
- [ ] User account created in database
- [ ] User logged in successfully

### Production
- [ ] GitHub OAuth App created (Production) or callback URL updated
- [ ] Production credentials obtained
- [ ] Authorization callback URL set for production domain
- [ ] Credentials added to Railway Variables
- [ ] Deployed to Railway production
- [ ] Tested on production URL
- [ ] OAuth flow works in production
- [ ] Monitoring enabled (optional)

---

## Summary

### What You Get

✅ **"Sign in with GitHub" button** on login page
✅ **One-click registration** for new users with GitHub accounts
✅ **Automatic email verification** (if user's GitHub email is verified)
✅ **Profile data** (name, email, username, avatar) from GitHub
✅ **Secure authentication** (OAuth 2.0 standard)
✅ **No password management** for users choosing GitHub login

### What Happens When User Signs In

1. User clicks **"Sign in with GitHub"**
2. Redirected to GitHub authorization page
3. User clicks **"Authorize [App Name]"**
4. GitHub redirects back to Taxomind callback URL
5. NextAuth creates/links account in database:
   - **User** record with profile data
   - **Account** record with provider: "github"
   - **Session** created
6. User logged in automatically
7. Redirected to dashboard

### Database Tables Used

1. **User** - Stores user profile
   - `name`: From GitHub profile
   - `email`: From GitHub (if public/verified)
   - `image`: GitHub avatar URL

2. **Account** - Stores OAuth connection
   - `provider`: "github"
   - `providerAccountId`: User's GitHub ID
   - `access_token`: GitHub access token (for API calls)
   - `refresh_token`: (if applicable)

3. **Session** - Stores active sessions
   - Links to User record
   - Session expiry management

4. **AuthAuditLog** - Logs OAuth events
   - Login attempts
   - Success/failure tracking
   - IP addresses and timestamps

---

## GitHub vs Google OAuth Comparison

| Feature | GitHub OAuth | Google OAuth |
|---------|--------------|--------------|
| **Setup Complexity** | Easier (no consent screen) | More complex (consent screen required) |
| **Callback URLs** | ONE per app | Multiple allowed |
| **Email Access** | Requires public email or verified | Always provided |
| **User Base** | Developers, tech-savvy | General public, all users |
| **Profile Picture** | Always available (avatar) | Always available |
| **Username** | Unique GitHub handle | Email-based (no username) |
| **Use Case** | Developer-focused apps | General public apps |

---

## Next Steps

After setting up GitHub OAuth:

1. **Test both providers** (Google and GitHub) work correctly
2. **Test account linking** (user with email/password can link GitHub)
3. **Test conflict handling** (same email from different providers)
4. **Add provider badges** to user profile (show which providers are linked)
5. **Monitor usage** in audit logs
6. **Consider adding more providers** (Microsoft, Facebook, etc.)

---

## Advanced Configuration (Optional)

### 1. Request Additional Permissions

If you need more than basic profile data:

```typescript
// auth.config.ts
Github({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  authorization: {
    params: {
      scope: 'read:user user:email repo' // Add 'repo' for repository access
    }
  }
}),
```

### 2. Use GitHub API After Sign In

```typescript
// Access GitHub API using the access token
const account = await db.account.findFirst({
  where: {
    userId: user.id,
    provider: 'github'
  }
});

if (account?.access_token) {
  const response = await fetch('https://api.github.com/user/repos', {
    headers: {
      Authorization: `Bearer ${account.access_token}`
    }
  });
  const repos = await response.json();
}
```

### 3. Handle Multiple GitHub Accounts

```typescript
// Check if user already has a GitHub account linked
const existingAccount = await db.account.findFirst({
  where: {
    provider: 'github',
    userId: session.user.id
  }
});

if (existingAccount) {
  return { error: 'GitHub account already linked' };
}
```

---

## Support

If you encounter issues:

1. **Check logs**: Railway logs or local console
2. **Verify credentials**: Double-check Client ID/Secret
3. **Test callback URL**: Must match exactly (no trailing slash)
4. **Review OAuth app settings**: Ensure callback URL is correct
5. **Check database**: Verify Account records are created
6. **GitHub Status**: Check https://www.githubstatus.com/ for API issues

---

**Setup Guide Complete**
**Ready for**: GitHub OAuth activation
**Next**: Create GitHub OAuth App and add credentials to environment

---

## Quick Reference

### GitHub OAuth App Settings
- **URL**: https://github.com/settings/developers
- **Create**: New OAuth App
- **Callback**: `/api/auth/callback/github`

### Environment Variables
```bash
GITHUB_CLIENT_ID="Ov23liAaBbCcDdEeFfGg"
GITHUB_CLIENT_SECRET="1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"
```

### Testing URLs
- **Development**: http://localhost:3000/auth/login
- **Production**: https://taxomind.com/auth/login

### Useful Commands
```bash
# Check configuration
cat .env.local | grep GITHUB

# Restart server
npm run dev

# Check database
npm run dev:db:studio

# View logs
tail -f logs/auth.log
```

---

**Last Updated**: January 15, 2025
**Version**: 1.0.0
**Status**: Ready for implementation
