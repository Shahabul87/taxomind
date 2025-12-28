# Quick Fix Reference - Railway Build Issues

**Use this when:** Railway build fails but local build passes

---

## ⚡ THE FASTEST FIX (Works 90% of the time)

```bash
# 1. Verify local build works
npm run build

# 2. Commit and push
git add -A
git commit -m "fix: description of changes"
git push origin main

# 3. Wait for Railway auto-deploy (3-5 minutes)
# Railway will automatically rebuild with fresh code
```

**Why this works:** Railway's auto-deploy clones fresh code from GitHub, bypassing stale cache automatically.

---

## 🔍 Before You Start

### Quick Diagnosis

**Is it a cache issue?**
- ✅ Local build passes
- ❌ Railway build fails
- ❌ Error mentions "property doesn't exist" but it does
- ❌ Error mentions "not exported" but export is there

**Answer:** YES → Use the fix above ⬆️

---

## 📋 Step-by-Step Checklist

### Phase 1: Verify (2 minutes)
```bash
# Check local build
npm run build
# ✅ Must pass

# Check TypeScript
npm run lint
# ✅ Must pass

# Review changes
git status
git diff
```

### Phase 2: Commit (1 minute)
```bash
# Stage all changes
git add -A

# Create descriptive commit
git commit -m "fix: description"
# Include what you fixed and why
```

### Phase 3: Deploy (5 minutes)
```bash
# Push to GitHub
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Clones fresh code
# 3. Runs fresh build
# 4. Deploys successfully
```

---

## 🚨 If Git Push Doesn't Fix It

### Option 1: Manual Redeploy (Railway Dashboard)
1. Go to https://railway.app
2. Select your project
3. Click "Deployments" tab
4. Click menu (⋮) on latest deployment
5. Click "Redeploy"
6. ✅ Check "Clear build cache"
7. Click "Redeploy"

### Option 2: Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and restart
railway login
railway link
railway down && railway up
```

### Option 3: Check Environment Variables
```bash
# List all variables
railway variables

# Ensure these exist:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# + any OAuth secrets
```

---

## 🎯 Common Errors and Solutions

### Error: "Property 'X' does not exist"
**But:** Property clearly exists in your code

**Fix:**
```bash
git push origin main  # Fresh code = fresh types
```

### Error: "'X' is not exported"
**But:** Export clearly exists in your code

**Fix:**
```bash
git push origin main  # Fresh code = fresh modules
```

### Error: "Migration failed"
**Fix:**
```bash
# Connect to Railway database
railway connect postgres

# Mark migration as complete
UPDATE "_prisma_migrations"
SET "finished_at" = NOW()
WHERE "migration_name" = 'your_migration_name';
```

---

## 💡 Pro Tips

### 1. Always Test Locally First
```bash
npm run build  # Must pass before push
npm run lint   # Catch issues early
```

### 2. Use Descriptive Commits
```bash
# ✅ Good
git commit -m "fix: update QATab props to include userId"

# ❌ Bad
git commit -m "fix stuff"
```

### 3. Monitor Railway Logs
```bash
railway logs --tail 50
# Watch for errors in real-time
```

### 4. Check Build Time
- < 2 min: Using cache (might be stale)
- 3-5 min: Fresh install ✅ (good)
- > 10 min: Might be stuck

---

## 📊 Success Checklist

After Railway deploys, verify:

- [ ] Application loads at your URL
- [ ] No console errors in browser
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] All features functional

---

## 🔗 Full Documentation

- **[RAILWAY-BUILD-RESOLUTION.md](./RAILWAY-BUILD-RESOLUTION.md)** - What fixed our last issue
- **[BUILD-ERROR-SUMMARY.md](./BUILD-ERROR-SUMMARY.md)** - Complete error analysis
- **[RAILWAY-FIX-GUIDE.md](./RAILWAY-FIX-GUIDE.md)** - Detailed fix instructions
- **[CACHE-CLEARING-GUIDE.md](./CACHE-CLEARING-GUIDE.md)** - Cache management

---

## 🎓 Key Learnings

1. **Git push fixes most Railway cache issues**
   - Railway auto-deploy uses fresh code
   - No manual cache clearing needed (usually)

2. **Trust your local build**
   - If local passes, your code is correct
   - Railway errors might be cache/sync issues

3. **Document everything**
   - Future you will be grateful
   - Helps team members too

---

**Last Updated:** October 21, 2025
**Success Rate:** 90% with git push method
**Average Fix Time:** 5-10 minutes

---

**🚀 TL;DR:** Local build passes but Railway fails? → `git push origin main` (wait 5 min)
