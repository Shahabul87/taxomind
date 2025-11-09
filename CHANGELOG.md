# Changelog

All notable changes to Taxomind LMS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **CRITICAL**: Fixed 500 error on `/teacher/courses` in production caused by database schema mismatch
  - Added missing `isFree` and `priceType` columns to production Course table
  - Enhanced error logging with step-by-step debugging output
  - Added comprehensive documentation in `TROUBLESHOOTING.md` and `docs/incidents/`
  - Created Railway CLI fix script for emergency database repairs
  - Forced dynamic rendering on teacher courses page
  - See incident report: `docs/incidents/2025-11-09-teacher-courses-500-error.md`

### Added
- Comprehensive error handling in `app/(protected)/teacher/courses/page.tsx`
- Production debugging logging with `[CoursesPage]` tagged messages
- `TROUBLESHOOTING.md` - Troubleshooting guide for common issues
- `fix-production-db.sql` - SQL script for database schema fixes
- `fix-production-railway.sh` - Automated Railway CLI fix script
- Documentation for proper Prisma migration workflow

### Changed
- Enhanced Server Component rendering with explicit error boundaries
- Improved Date serialization validation before toISOString() calls
- Added explicit TypeScript typing for serialized course data

## [1.0.0] - 2025-11-09

### Production Hotfix
- Emergency fix for production database schema mismatch
- Restored `/teacher/courses` functionality for all teachers
- Zero data loss, zero downtime for end users (only affected teacher dashboard)

### Migration Notes
When adding new fields to Prisma schema:
1. ✅ Edit `prisma/schema.prisma`
2. ✅ Run `npx prisma migrate dev --name descriptive_name`
3. ✅ Commit both schema and migration files
4. ✅ Push to GitHub - Railway will auto-apply migrations

**Never skip step 2** - schema changes without migrations cause production failures.

---

## Categories

### Added
For new features.

### Changed
For changes in existing functionality.

### Deprecated
For soon-to-be removed features.

### Removed
For now removed features.

### Fixed
For any bug fixes.

### Security
In case of vulnerabilities.

---

## Version History

- **1.0.0** (2025-11-09) - Initial production release with hotfix
- **Unreleased** - Current development version

---

**Maintained by**: Taxomind Development Team
**Last Updated**: November 9, 2025
