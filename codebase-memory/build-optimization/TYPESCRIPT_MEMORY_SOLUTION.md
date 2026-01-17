# TypeScript Memory Optimization for Large Codebases

## Problem Statement

Large TypeScript codebases (like Taxomind with 16+ packages) can exhaust memory during type checking:

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

Even with 8GB+ heap allocation, full project type-checking fails because TypeScript loads the entire dependency graph into memory.

## Industry-Standard Solution

### The Pattern Used by Microsoft, Google, Vercel, Meta

```
┌─────────────────────────────────────────────────────────────┐
│ DECOUPLE TYPE CHECKING FROM BUILD                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐   Real-time    ┌──────────────────────────┐  │
│  │  Editor  │ ─────────────► │ TypeScript Language      │  │
│  │ (VS Code)│   feedback     │ Server (per-file)        │  │
│  └──────────┘                └──────────────────────────┘  │
│                                                             │
│  ┌──────────┐   Incremental  ┌──────────────────────────┐  │
│  │  Build   │ ─────────────► │ Turbopack/Next.js        │  │
│  │ (Local)  │   compile      │ (transpile only)         │  │
│  └──────────┘                └──────────────────────────┘  │
│                                                             │
│  ┌──────────┐   Full check   ┌──────────────────────────┐  │
│  │    CI    │ ─────────────► │ ESLint + Project         │  │
│  │ Pipeline │   (cached)     │ References               │  │
│  └──────────┘                └──────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation in Taxomind

### 1. Project References Architecture

Each package has `composite: true` in its `tsconfig.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

Root `tsconfig.build.json` references all packages:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/react" },
    // ... all 16 packages
  ]
}
```

### 2. Commands Available

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run dev` | Development server | Daily development |
| `npm run build` | Production build (fast) | Local testing |
| `npm run build:strict` | Build with full type check | Before major releases |
| `npm run build:ci` | CI pipeline build | GitHub Actions/Railway |
| `npm run typecheck:parallel` | Incremental type check | After code changes |
| `npm run typecheck:parallel:force` | Full type rebuild | After major refactors |
| `npm run typecheck:parallel:watch` | Watch mode | Continuous development |
| `npm run lint` | ESLint checking | Before commits |

### 3. How Incremental Builds Work

```
First Run:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Package A   │───►│ Package B   │───►│ Package C   │
│ (compile)   │    │ (compile)   │    │ (compile)   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ .tsbuildinfo│    │ .tsbuildinfo│    │ .tsbuildinfo│
│ (cache)     │    │ (cache)     │    │ (cache)     │
└─────────────┘    └─────────────┘    └─────────────┘

Subsequent Runs (only Package B changed):
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Package A   │    │ Package B   │───►│ Package C   │
│ (SKIP)      │    │ (recompile) │    │ (recompile) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
   [cached]           [updated]          [updated]
```

### 4. Memory Usage Comparison

| Approach | Memory | Time | Use Case |
|----------|--------|------|----------|
| Full `tsc --noEmit` | 8GB+ (OOM) | N/A | ❌ Don't use |
| `tsc --build` (first) | ~2GB | ~30s | Initial setup |
| `tsc --build` (incremental) | ~500MB | ~5s | Daily use ✅ |
| Next.js build (skip tsc) | ~4GB | ~15s | Production ✅ |

## Best Practices

### DO ✅

1. **Use editor for real-time type checking** - VS Code's TypeScript server checks files as you edit
2. **Run incremental checks** - `npm run typecheck:parallel` after changes
3. **Let CI catch issues** - Full validation happens in GitHub Actions
4. **Clean cache periodically** - `npm run typecheck:parallel:clean` if issues arise

### DON'T ❌

1. **Don't run `npx tsc --noEmit`** on full project - Will OOM
2. **Don't increase heap beyond 8GB** - Diminishing returns
3. **Don't skip all type checking** - Use incremental instead
4. **Don't commit with ESLint errors** - These catch most issues

## Troubleshooting

### "Cannot find module" Errors

Package references may need updating:
```bash
npm run typecheck:parallel:clean
npm run typecheck:parallel:force
```

### Build Still OOMs

Use the fast build:
```bash
npm run build  # Skips TypeScript validation
```

### Need Full Type Check

Run in sections:
```bash
# Check specific package
cd packages/core && npx tsc --noEmit

# Or use project references
npm run typecheck:parallel:force
```

## Files Modified

| File | Changes |
|------|---------|
| `packages/*/tsconfig.json` | Added `composite`, `incremental` |
| `tsconfig.build.json` | New - project references |
| `package.json` | New scripts for parallel checking |
| `scripts/typecheck-parallel.js` | New - parallel check runner |
| `next.config.js` | `SKIP_TYPE_CHECK` support |

## References

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Vercel's Monorepo Guide](https://vercel.com/docs/monorepos)
- [Microsoft's TypeScript Build Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
