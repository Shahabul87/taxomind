# Git Workflow Guide for Taxomind

This document outlines the Git workflow and deployment process for the Taxomind project.

## 📋 Table of Contents

1. [Branch Strategy](#branch-strategy)
2. [Development Workflow](#development-workflow)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Pre-commit Hooks](#pre-commit-hooks)
5. [Deployment Process](#deployment-process)
6. [Environment Configuration](#environment-configuration)
7. [Quick Commands](#quick-commands)

## 🌳 Branch Strategy

### Main Branches
- **`main`** - Production branch (protected)
  - Automatically deploys to Railway production
  - Requires PR with approvals
  - All tests must pass

- **`dev`** - Development branch
  - Integration branch for features
  - Automatically deploys to Railway staging
  - Regular testing ground

### Feature Branches
- Create from `dev` branch
- Naming: `feature/description` or `fix/issue-description`
- Delete after merging

## 🔄 Development Workflow

### 1. Start New Feature
```bash
# Switch to dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes
```bash
# Make your code changes
# Run linting
npm run lint

# Run tests
npm run test

# Build to verify
npm run build
```

### 3. Commit Changes
```bash
# Stage changes
git add .

# Commit (pre-commit hooks will run automatically)
git commit -m "feat: add new feature description"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions/changes
- `chore:` Maintenance tasks

### 4. Push to GitHub
```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request
1. Go to GitHub repository
2. Click "New Pull Request"
3. Base: `dev` ← Compare: `feature/your-feature-name`
4. Fill PR template with details
5. Request reviews if needed

## 🚀 CI/CD Pipeline

### Automated Checks
When you push code or create a PR, these checks run automatically:

1. **Lint & Type Check**
   - ESLint validation
   - TypeScript compilation check

2. **Tests**
   - Unit tests with Jest
   - Coverage requirements (70% minimum)

3. **Build Verification**
   - Next.js production build
   - Bundle size analysis

4. **Security Scan**
   - npm audit
   - Dependency vulnerability check

### Pipeline Status
Check GitHub Actions tab for pipeline status:
- ✅ Green = All checks passed
- ❌ Red = Checks failed (fix required)

## 🪝 Pre-commit Hooks

Automatic checks before each commit:

1. **Lint-staged**
   - ESLint fixes
   - Prettier formatting
   - TypeScript validation

2. **Console.log Detection**
   - Prevents debug statements in commits

3. **Test Related Files**
   - Runs tests for changed files

**If pre-commit fails:**
```bash
# Fix the issues, then
git add .
git commit -m "your message"
```

## 📦 Deployment Process

### Development → Staging
```bash
# Merge feature to dev
git checkout dev
git merge feature/your-feature-name
git push origin dev

# Automatic deployment to staging
```

### Staging → Production
```bash
# Create PR from dev to main
# After approval and merge
# Automatic deployment to production
```

### Deployment Environments

| Environment | Branch | URL | Database |
|------------|--------|-----|----------|
| Local | any | http://localhost:3000 | PostgreSQL (port 5433) |
| Staging | dev | https://taxomind-staging.railway.app | Railway PostgreSQL |
| Production | main | https://taxomind.railway.app | Railway PostgreSQL |

## ⚙️ Environment Configuration

### Local Development (.env.local)
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5433/taxomind_dev
NEXTAUTH_URL=http://localhost:3000
# Add other env variables
```

### GitHub Secrets (for CI/CD)
Set these in GitHub Settings → Secrets:
- `RAILWAY_TOKEN` - Production deployment
- `RAILWAY_STAGING_TOKEN` - Staging deployment
- `SLACK_WEBHOOK` - Deployment notifications (optional)
- `SNYK_TOKEN` - Security scanning (optional)

### Railway Environment Variables
Configure in Railway dashboard:
- Production and staging environments
- Database URLs auto-configured
- Add API keys and secrets

## 🚀 Quick Commands

### Daily Development
```bash
# Start local development
npm run dev

# Run all checks before committing
npm run lint && npm run test && npm run build

# Open Prisma Studio
npm run dev:db:studio
```

### Database Management
```bash
# Reset local database
npm run dev:setup

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push
```

### Docker PostgreSQL
```bash
# Start local database
npm run dev:docker:start

# Stop local database
npm run dev:docker:stop

# Reset database container
npm run dev:docker:reset
```

## 📊 Monitoring

### Check Deployment Status
1. **GitHub Actions**: Check workflow runs
2. **Railway Dashboard**: Monitor deployments
3. **Application Logs**: View in Railway

### Rollback if Needed
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or use Railway dashboard to redeploy previous version
```

## 🆘 Troubleshooting

### Build Fails Locally
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps
npm run dev:docker:start
```

### Type Errors
```bash
# Regenerate Prisma types
npx prisma generate
npm run build
```

### Pre-commit Hook Issues
```bash
# Skip hooks temporarily (use sparingly)
git commit --no-verify -m "emergency fix"
```

## 🎯 Best Practices

1. **Always pull latest `dev` before creating feature branch**
2. **Keep commits small and focused**
3. **Write descriptive commit messages**
4. **Run tests before pushing**
5. **Review your own PR before requesting reviews**
6. **Keep `main` branch stable at all times**
7. **Document breaking changes**
8. **Update tests when changing functionality**

---

For questions or issues, check the project documentation or create an issue in GitHub.