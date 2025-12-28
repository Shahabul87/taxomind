# Memory Optimization Guide for TypeScript & ESLint

## Problem
Large Next.js projects can run out of memory when running `tsc --noEmit` or `npm run lint`, causing `FATAL ERROR: JavaScript heap out of memory`.

## ✅ PERMANENT SOLUTIONS IMPLEMENTED

### 1. **Increased Memory Limits** (Already Updated)

The following commands now use 16GB memory allocation:

```json
{
  "scripts": {
    "tsc": "NODE_OPTIONS='--max-old-space-size=16384' tsc",
    "tsc:noEmit": "NODE_OPTIONS='--max-old-space-size=16384' tsc --noEmit"
  }
}
```

### 2. **Optimized TypeCheck Scripts** (Already Configured)

Use the optimized typecheck script for different scenarios:

```bash
# Fast check (6GB memory) - Quick iteration
npm run typecheck:fast

# Standard check (12GB memory) - Pre-commit
npm run typecheck:standard

# Full check (16GB memory) - CI/CD pipelines
npm run typecheck:full

# Watch mode (6GB memory) - Continuous feedback
npm run typecheck:watch

# Clean cache if issues persist
npm run typecheck:clean
```

### 3. **Quick Check for Small Changes** (NEW)

For checking only the files you just modified:

```bash
# Check only changed files (uses 4GB memory)
npm run check:quick
```

This script:
- Only checks files modified in git
- Uses minimal memory (4GB)
- Perfect for quick validation before commit

## 🚀 RECOMMENDED WORKFLOW

### During Development

```bash
# 1. Use VS Code for real-time feedback (no memory issues)
#    VS Code's TypeScript server is optimized for incremental checking

# 2. For manual checks during development:
npm run typecheck:fast

# 3. For quick validation of your changes:
npm run check:quick
```

### Before Commit

```bash
# Run standard typecheck
npm run typecheck:standard

# Or use the existing lint:changed command
npm run lint:changed
```

### Full Validation

```bash
# Only when absolutely necessary (uses 16GB memory)
npm run typecheck:full
```

## 📊 Memory Allocation by Command

| Command | Memory | Use Case |
|---------|--------|----------|
| `typecheck:fast` | 6GB | Quick iteration during development |
| `typecheck:standard` | 12GB | Pre-commit checks |
| `typecheck:full` | 16GB | CI/CD pipelines, full validation |
| `typecheck:watch` | 6GB | Continuous feedback while coding |
| `check:quick` | 4GB | Only changed files |
| `lint:changed` | 8GB | Lint only changed files |

## 🔧 Additional Solutions

### Option 1: Use VS Code Instead

VS Code has optimized TypeScript checking that doesn't run out of memory:
- Real-time error detection
- Incremental checking
- No memory issues
- **Recommended for daily development**

### Option 2: Incremental Build Info

The optimized scripts already use `--incremental` flag which creates a `.tsbuildinfo` file for faster subsequent checks.

If you encounter issues, clean the cache:

```bash
npm run typecheck:clean
```

### Option 3: Check Specific Directories

For targeted checking:

```bash
# Check only app directory
NODE_OPTIONS='--max-old-space-size=4096' npx tsc --noEmit --project tsconfig.json
```

### Option 4: Environment Variables

Add to your `.bashrc`, `.zshrc`, or `.env.local`:

```bash
# Set default Node memory limit to 16GB
export NODE_OPTIONS="--max-old-space-size=16384"
```

Then run commands without prefixes:

```bash
tsc --noEmit
npm run lint
```

## 🐛 Troubleshooting

### Still Running Out of Memory?

1. **Close other applications** - Free up system RAM

2. **Clean caches**:
```bash
npm run typecheck:clean
npm run lint:clear-cache
rm -rf .next
```

3. **Check system memory**:
```bash
# macOS
sysctl hw.memsize

# Should be at least 16GB for full typecheck
```

4. **Use fast mode** for development:
```bash
npm run typecheck:fast
```

5. **Split the check** - Check different parts separately:
```bash
# Check app directory only
NODE_OPTIONS='--max-old-space-size=4096' npx tsc --noEmit app/**/*.{ts,tsx}

# Check components only
NODE_OPTIONS='--max-old-space-size=4096' npx tsc --noEmit components/**/*.{ts,tsx}
```

## 📝 ESLint Issues

For ESLint memory issues, use:

```bash
# Fast lint (cached)
npm run lint:fast

# Lint only changed files
npm run lint:changed

# Clear cache if needed
npm run lint:clear-cache
```

## ✨ Best Practices

1. **Use VS Code** for day-to-day development
2. **Use `check:quick`** before commits
3. **Use `typecheck:fast`** for quick validation
4. **Use `typecheck:standard`** for thorough pre-commit checks
5. **Reserve `typecheck:full`** for CI/CD or major changes
6. **Clean caches** if you encounter persistent issues

## 🎯 Summary

You have multiple optimized options:

- ✅ **Fast checks** (6GB) - Quick iteration
- ✅ **Standard checks** (12GB) - Pre-commit validation
- ✅ **Full checks** (16GB) - Complete validation
- ✅ **Quick checks** (4GB) - Only changed files
- ✅ **VS Code** (optimized) - Daily development

**Recommendation**: Use VS Code for development, `npm run check:quick` for quick validation, and `npm run typecheck:standard` before commits.
