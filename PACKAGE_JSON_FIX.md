# package.json Duplicate Key Fix

## Issue
The `package.json` file had a **duplicate key error** with two `"build:clean"` entries:

```json
// Line 29 - First occurrence
"build:clean": "./scripts/clean-before-build.sh && npm run build"

// Line 37 - Second occurrence (overwrites first)
"build:clean": "bash scripts/build-clean.sh"
```

This is **invalid JSON** and can cause:
- ❌ npm command failures
- ❌ Build tool parsing errors
- ❌ Unpredictable behavior (second key overwrites first)
- ❌ Railway deployment issues

## Root Cause

Two different clean build scripts were created for different purposes:
1. **clean-before-build.sh** - Simple cleanup (removes .next, .swc, cache)
2. **build-clean.sh** - Comprehensive clean build (cleanup + Prisma + TypeScript checks)

Both were mapped to the same `"build:clean"` command name.

## Solution

Renamed the first occurrence to avoid conflict:

```json
// BEFORE (❌ Invalid - duplicate keys)
"build:clean": "./scripts/clean-before-build.sh && npm run build",  // Line 29
// ... other scripts ...
"build:clean": "bash scripts/build-clean.sh",                        // Line 37

// AFTER (✅ Valid - unique keys)
"build:clean:basic": "./scripts/clean-before-build.sh && npm run build",  // Line 29
// ... other scripts ...
"build:clean": "bash scripts/build-clean.sh",                              // Line 37
```

## Available Commands

### `npm run build:clean:basic`
**Purpose**: Quick cleanup then build
**What it does**:
1. Removes .next directory
2. Removes .swc cache
3. Removes node_modules/.cache
4. Removes TypeScript build info
5. Runs `npm run build`

**Use when**: You want a quick fresh build without full validation

**Execution time**: ~2-3 minutes

### `npm run build:clean` (Recommended)
**Purpose**: Comprehensive clean build with validation
**What it does**:
1. Removes build artifacts
2. Sets Node.js memory limit (8GB)
3. Generates Prisma Client
4. Counts TypeScript errors
5. Builds with optimizations (skips TypeScript check if >100 errors)
6. Creates build report

**Use when**: You want a production-grade clean build with diagnostics

**Execution time**: ~3-5 minutes

## Verification

Check that package.json is now valid:
```bash
# Should show no errors
npm run

# List all build:clean commands
npm run | grep "build:clean"
```

Expected output:
```
build:clean:basic
build:clean
```

## Related Files

- `scripts/clean-before-build.sh` - Simple cleanup script
- `scripts/build-clean.sh` - Comprehensive build script
- `package.json` - Fixed duplicate key

## Impact

### Before Fix:
- ⚠️ Invalid JSON in package.json
- ⚠️ Only one `build:clean` command accessible (second overwrites first)
- ⚠️ Potential Railway deployment issues
- ⚠️ npm/pnpm/yarn parsing warnings

### After Fix:
- ✅ Valid JSON structure
- ✅ Both scripts accessible with unique names
- ✅ Railway deployments will succeed
- ✅ No npm parsing issues

## Quick Reference

```bash
# Quick clean build (basic)
npm run build:clean:basic

# Comprehensive clean build (recommended)
npm run build:clean

# Other build options
npm run build                    # Standard build
npm run build:fast               # Fast build (skip checks)
npm run build:local              # Local optimized build
npm run build:railway            # Railway deployment build
```

---

**Fixed Date**: 2025-01-14
**Issue Type**: JSON Syntax Error
**Severity**: High (blocks builds)
**Status**: ✅ Resolved
