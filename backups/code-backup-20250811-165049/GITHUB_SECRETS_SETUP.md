# 🔐 GitHub Secrets Configuration Guide

## 📋 **Required Secrets for CI/CD**

### **Step 1: Access GitHub Repository Settings**
1. Go to your GitHub repository: `https://github.com/Shahabul87/taxomind`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### **Step 2: Add Required Secrets**

#### **Staging Environment Secrets**

**Secret Name:** `STAGING_DATABASE_URL`
**Value:** `postgresql://username:password@host:port/taxomind_staging`
```
Example: postgresql://staging_user:secure_password@db-staging.railway.app:5432/taxomind_staging
```

**Secret Name:** `STAGING_NEXTAUTH_SECRET`
**Value:** `p6bT9iYrb76QDCAG0nEZMntNlBhR0i54OafrnP45jo0=`
*(Generated secure secret - use this exactly)*

**Secret Name:** `STAGING_NEXTAUTH_URL`
**Value:** `https://your-staging-app-url.vercel.app`
```
Example: https://taxomind-staging.vercel.app
```

#### **Production Environment Secrets**

**Secret Name:** `PROD_DATABASE_URL`  
**Value:** `postgresql://username:password@host:port/taxomind_production`
```
Example: postgresql://prod_user:ultra_secure_password@db-prod.railway.app:5432/taxomind_production
```

**Secret Name:** `PROD_NEXTAUTH_SECRET`
**Value:** `OqjFVGBAsDBsmowpdy6YGK3Fn5E2Mzy2riYk204tXQQ=`
*(Generated secure secret - DIFFERENT from staging)*

**Secret Name:** `PROD_NEXTAUTH_URL`
**Value:** `https://your-production-domain.com`
```
Example: https://taxomind.com
```

## 🚀 **Optional but Recommended Secrets**

### **Deployment Tokens**
- `VERCEL_TOKEN`: For automated Vercel deployments
- `RAILWAY_TOKEN`: For automated Railway deployments

### **External APIs**  
- `ANTHROPIC_API_KEY`: For AI features in CI/CD
- `OPENAI_API_KEY`: For AI features in CI/CD

### **Monitoring**
- `SENTRY_DSN`: For error tracking
- `SLACK_WEBHOOK_URL`: For deployment notifications

## 📱 **Quick Setup Commands**

After adding secrets, test the setup:

```bash
# Test staging pipeline (push to staging branch)
git checkout staging
git push origin staging

# Monitor the workflow
# Go to: https://github.com/Shahabul87/taxomind/actions
```

## 🔍 **Verification Checklist**

- [ ] `STAGING_DATABASE_URL` added
- [ ] `STAGING_NEXTAUTH_SECRET` added  
- [ ] `STAGING_NEXTAUTH_URL` added
- [ ] `PROD_DATABASE_URL` added
- [ ] `PROD_NEXTAUTH_SECRET` added
- [ ] `PROD_NEXTAUTH_URL` added
- [ ] Secrets are not visible in plaintext (GitHub hides them)
- [ ] Test staging pipeline runs without errors

## 🛡️ **Security Notes**

1. **Never commit secrets to code** - they're now in GitHub Secrets
2. **Use different secrets for staging/production** - already generated
3. **Database URLs should use SSL** - add `?sslmode=require` if needed
4. **NextAuth secrets are cryptographically secure** - generated with OpenSSL

## 🔄 **Next Steps After Setup**

1. **Test staging deployment:**
   ```bash
   git checkout staging  
   git push origin staging
   ```

2. **Monitor the pipeline:**
   - Go to GitHub Actions tab
   - Watch the staging CI/CD pipeline run
   - Verify all checks pass

3. **Ready for daily workflow:**
   ```bash
   ./scripts/solo-dev-workflow.sh daily-start
   ```

---

*🔐 Keep these secrets secure and never share them publicly!*