# Prisma Schema Domains

This directory contains the split Prisma schema organized by domain.

## 📊 Structure

- **00-base.prisma**: Core Prisma configuration (generators, datasources)
- **01-enums.prisma**: Shared enum definitions
- **02-auth.prisma**: Authentication & Security (25 models)
- **03-learning.prisma**: Core Learning (35 models)
- **04-content.prisma**: Content Management (26 models)
- **05-commerce.prisma**: Commerce & Billing (12 models)
- **06-analytics.prisma**: Analytics & Reporting (27 models)
- **07-social.prisma**: Social & Collaboration (37 models)
- **08-ai.prisma**: AI & Machine Learning (20 models)
- **09-admin.prisma**: Admin & Audit (28 models)
- **10-gamification.prisma**: Gamification & Achievements (18 models)
- **11-events.prisma**: Events & Calendar (10 models)

## 🔄 Building

These files are automatically merged into `prisma/schema.prisma` before builds.

Run: `npm run schema:merge` to merge manually.

## ⚠️ Important

- DO NOT edit `prisma/schema.prisma` directly
- Edit domain-specific files in this directory
- Run `npm run schema:merge` after changes
- Commit both domain files and merged schema

---

Generated: 2025-10-12T03:28:42.551Z
Total Models: 238
Total Lines: 5331
