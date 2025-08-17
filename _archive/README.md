# Archive Directory

This directory contains archived files that were previously in the root directory but are not actively used in production.

## Directory Structure

### `/docs`
- Project documentation
- Implementation guides
- Security reports
- Architecture documents
- Build and deployment guides

### `/configs`
- Backup configuration files
- Old Next.js configs
- Previous middleware versions
- Sentry configuration files

### `/scripts-old`
- Migration scripts
- Fix scripts
- Batch processing scripts
- Old utility scripts

### `/deployment`
- Railway deployment files
- Docker configurations
- Vercel config
- Deployment failure logs
- Ecosystem configs

### `/testing`
- Jest configuration files
- Playwright config
- Test setup files
- Lighthouse config

## Important Notes

- These files are archived for reference only
- The main application doesn't depend on these files
- Keep for historical reference and rollback purposes
- Can be safely excluded from production builds

## Active Configuration Files (Still in Root)
The following essential files remain in the root directory:
- `.env` files (environment configurations)
- `package.json` (dependencies)
- `next.config.js` (Next.js configuration)
- `tsconfig.json` (TypeScript configuration)
- `middleware.ts` (authentication middleware)
- `auth.ts` (authentication setup)
- `CLAUDE.md` (AI assistant instructions)
- Essential config files (.eslintrc, .prettierrc, etc.)

---
*Archived on: January 2025*