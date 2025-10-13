# 🚀 Quick Reference Guide

**Project**: Taxomind - Intelligent Learning Platform
**Last Updated**: 2025-01-12

---

## 📁 Where to Find Things

### Documentation
```bash
docs/admin/          # Admin features & fixes
docs/auth/           # Authentication documentation
docs/enterprise/     # Enterprise architecture
docs/fixes/          # Bug fixes & solutions
docs/design/         # UI/UX design documents
docs/phases/         # Project phase reports
docs/testing/        # Test documentation
docs/implementation/ # Implementation guides
```

### Images
```bash
screenshots/admin/   # Admin UI screenshots
screenshots/testing/ # Test screenshots
screenshots/ui/      # UI flow screenshots
```

### Tests
```bash
__tests__/unit/         # Unit tests
__tests__/integration/  # Integration tests
__tests__/components/   # Component tests
__tests__/hooks/        # Hook tests
__tests__/actions/      # Server action tests
```

### Cleanup
```bash
_cleanup/jest-configs/  # Old Jest configurations
_cleanup/test-scripts/  # Temporary test scripts
_cleanup/logs/          # Log files & HTML dumps
```

---

## 🔍 Quick Search Commands

### Find documentation by topic
```bash
# Find auth docs
grep -r "authentication" docs/

# Find bug fixes
grep -r "hydration" docs/fixes/

# Find design docs
ls -la docs/design/
```

### Find test files
```bash
# Find all tests for a feature
find __tests__ -name "*auth*"

# Run specific tests
npm test __tests__/actions/auth.test.ts
```

### Search in code
```bash
# Find where something is used
grep -r "useAuth" app/

# Find component usage
grep -r "Button" components/
```

---

## 📝 Common Tasks

### Need Authentication Docs?
```bash
# Location: docs/auth/
# Key files:
# - AUTHENTICATION_FLOW_AUDIT_REPORT.md
# - COMPREHENSIVE_AUTH_AUDIT_REPORT.md
```

### Need to Fix a Bug?
```bash
# Check: docs/fixes/
# Common fixes:
# - Hydration: HYDRATION_ERROR_FIX.md
# - JWT: JWT_ERROR_PROGRAMMATIC_SOLUTIONS.md
# - Webpack: WEBPACK_CHUNK_LOADING_FIX.md
```

### Need Design Guidelines?
```bash
# Check: docs/design/
# Key files:
# - DYNAMIC_LAYOUT_SYSTEM.md
# - MODAL_DESIGN_SUMMARY.md
```

### Need Test Information?
```bash
# Check: docs/testing/TEST_ORGANIZATION.md
# Test structure: __tests__/
```

---

## 🎯 Custom Commands

### Use /find-docs
```
/find-docs auth       # Find auth documentation
/find-docs admin      # Find admin documentation
/find-docs tests      # Find test information
```

---

## 📚 Important Files

### Project Documentation
- `CLAUDE.md` - Project instructions
- `ROOT_DIRECTORY_ORGANIZATION.md` - Complete file mapping
- `docs/testing/TEST_ORGANIZATION.md` - Test structure guide

### Configuration (Root Directory)
- `package.json` - Dependencies
- `next.config.js` - Next.js config
- `tsconfig.json` - TypeScript config
- `jest.config.working.js` - Jest config (recommended)
- `tailwind.config.ts` - Tailwind config

---

## 🚦 Quick Start for New Developers

1. **Read First**: `CLAUDE.md` - Project instructions
2. **Understand Structure**: `ROOT_DIRECTORY_ORGANIZATION.md`
3. **Find Documentation**: Use `/find-docs` command
4. **Run Tests**: `npm test`
5. **Start Development**: `npm run dev`

---

## 📞 Need Help?

| Question | Where to Look |
|----------|---------------|
| How to authenticate? | `docs/auth/` |
| How to fix a bug? | `docs/fixes/` |
| Where are tests? | `__tests__/` or `docs/testing/` |
| Design guidelines? | `docs/design/` |
| Enterprise patterns? | `docs/enterprise/` |
| What changed in Phase X? | `docs/phases/` |

---

## 💡 Pro Tips

1. **Use grep** for quick searches across all docs
2. **Check _cleanup/** before deleting - verify files are obsolete
3. **Tests are co-located** with components in some cases (intentional)
4. **Auth configs** in root are essential - don't move them
5. **Use /find-docs** for quick navigation

---

**Remember**: This is a living document. Update it as the project evolves!
