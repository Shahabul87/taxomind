# OAuth Debug Guide for Production Issues

## 🔍 Debug Test Endpoints

### 1. Domain Configuration Check
```
https://www.bdgenai.com/api/debug/domain-check
```
**What it checks:** Domain matching between current URL and environment variables
**Expected result:** `"allMatch": true`

### 2. OAuth Configuration Check
```
https://www.bdgenai.com/api/debug/oauth-config
```
**What it checks:** Environment variables presence and format
**Expected result:** `"allRequiredPresent": true`

### 3. NextAuth Routes Test
```
https://www.bdgenai.com/api/debug/nextauth-routes
```
**What it checks:** All NextAuth API endpoints accessibility
**Expected result:** All endpoints should show `"accessible": true`

### 4. Auth Handlers Test
```
https://www.bdgenai.com/api/debug/auth-handlers
```
**What it checks:** NextAuth configuration and handlers
**Expected result:** All tests should show `"AVAILABLE"`

### 5. Auth Test (General)
```
https://www.bdgenai.com/api/debug/auth-test
```
**What it checks:** Overall authentication system health
**Expected result:** No errors, empty recommendations array

---

## 🚨 Common Issues & Solutions

### Issue 1: Domain Mismatch (Most Common)
**Symptoms:**
- `"allMatch": false` in domain-check
- All NextAuth routes return 404
- Google OAuth shows 404 error

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update these variables:
   ```
   NEXTAUTH_URL=https://www.bdgenai.com
   NEXT_PUBLIC_APP_URL=https://www.bdgenai.com
   ```
3. Make sure they're set for **Production** environment
4. **Redeploy** your application

### Issue 2: Environment Variables Not Applied
**Symptoms:**
- Variables look correct in Vercel dashboard
- But debug endpoints show wrong values

**Solution:**
1. Force redeploy from Vercel dashboard
2. Go to Deployments → Click "Redeploy" on latest deployment
3. Wait for deployment to complete
4. Test debug endpoints again

### Issue 3: Google OAuth Configuration
**Requirements:**
- **Authorized JavaScript origins**: `https://www.bdgenai.com`
- **Authorized redirect URIs**: `https://www.bdgenai.com/api/auth/callback/google`

### Issue 4: Wrong Environment Scope
**Solution:**
- Ensure environment variables are set for **Production** (not just Preview/Development)
- Variables must be exactly: `https://www.bdgenai.com` (no extra spaces or quotes)

---

## 📋 Quick Test Checklist

### ✅ Before Testing OAuth:
- [ ] Domain check shows `"allMatch": true`
- [ ] OAuth config shows `"allRequiredPresent": true`
- [ ] NextAuth routes all show `"accessible": true`
- [ ] Auth handlers all show `"AVAILABLE"`

### ✅ Environment Variables Required:
- [ ] `NEXTAUTH_URL=https://www.bdgenai.com`
- [ ] `NEXT_PUBLIC_APP_URL=https://www.bdgenai.com`
- [ ] `AUTH_SECRET=your_secret_here`
- [ ] `GOOGLE_CLIENT_ID=your_google_client_id`
- [ ] `GOOGLE_CLIENT_SECRET=your_google_secret`

### ✅ Google Cloud Console Settings:
- [ ] Authorized JavaScript origins: `https://www.bdgenai.com`
- [ ] Authorized redirect URIs: `https://www.bdgenai.com/api/auth/callback/google`

---

## 🔧 Troubleshooting Steps

### Step 1: Check Domain Configuration
1. Visit: `https://www.bdgenai.com/api/debug/domain-check`
2. Look for `"allMatch": true`
3. If false, update Vercel environment variables

### Step 2: Verify NextAuth Routes
1. Visit: `https://www.bdgenai.com/api/debug/nextauth-routes`
2. All endpoints should show `"accessible": true`
3. If 404 errors, domain mismatch is the issue

### Step 3: Test OAuth Configuration
1. Visit: `https://www.bdgenai.com/api/debug/oauth-config`
2. Check `"allRequiredPresent": true`
3. Verify `"googleClientIdFormat": "VALID"`

### Step 4: Test Google Login
1. Only after all above tests pass
2. Go to login page and click "Login with Google"
3. Should redirect to Google OAuth properly

---

## 🚀 Quick Copy-Paste URLs

### Test All Endpoints:
```
https://www.bdgenai.com/api/debug/domain-check
https://www.bdgenai.com/api/debug/oauth-config
https://www.bdgenai.com/api/debug/nextauth-routes
https://www.bdgenai.com/api/debug/auth-handlers
https://www.bdgenai.com/api/debug/auth-test
```

---

## 🎯 Success Indicators

### ✅ Everything Working:
- Domain check: `"allMatch": true`
- OAuth config: `"allRequiredPresent": true`
- NextAuth routes: All `"accessible": true`
- Auth handlers: All `"AVAILABLE"`
- Google login: Redirects to Google OAuth (no 404)

### ❌ Still Broken:
- Any debug endpoint returns 404
- Domain check shows `"allMatch": false`
- NextAuth routes show `"accessible": false`
- Google login shows 404 error page

---

*Last updated: 2025-06-21*
*For production domain: https://www.bdgenai.com* 