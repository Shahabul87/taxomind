# Railway Docker Build Optimization — BuildKit Cache Mounts

## Problem Statement

Every `git push` to Railway triggered a **full Docker build from scratch**:
- `pnpm install`: 3-5 min (re-downloading all packages)
- `next build`: 5-8 min (full Turbopack compilation)
- **Total: 8-13 min per deploy**

Two root causes:
1. `COPY packages ./packages` before `pnpm install` — any source code change in any of the 17 workspace packages invalidated the install layer
2. No BuildKit cache mounts — pnpm store and Next.js build cache discarded after every build

## Solution: Enterprise-Grade Docker Layer Caching

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ DOCKER LAYER CACHING + BUILDKIT CACHE MOUNTS                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stage: deps-dev (Install)                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. COPY package.json + pnpm-lock.yaml                │  │
│  │ 2. COPY packages/*/package.json (manifests only!)     │  │
│  │ 3. pnpm install --frozen-lockfile                     │  │
│  │    └─ with --mount=type=cache (pnpm store persists)   │  │
│  └───────────────────────────────────────────────────────┘  │
│  Layer invalidates ONLY when package.json or lockfile       │
│  changes. Source code changes = layer CACHED.               │
│                                                             │
│  Stage: builder (Compile)                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. COPY node_modules from deps-dev                    │  │
│  │ 2. COPY . . (all source, filtered by .dockerignore)   │  │
│  │ 3. COPY packages from deps-dev (workspace node_modules│  │
│  │ 4. prisma generate                                    │  │
│  │ 5. next build                                         │  │
│  │    └─ with --mount=type=cache (.next/cache persists)  │  │
│  └───────────────────────────────────────────────────────┘  │
│  Turbopack reuses compilation cache between builds.         │
│  Only changed modules recompile.                            │
│                                                             │
│  Stage: runner (Production)                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Minimal standalone output (~150 MB vs ~2 GB)          │  │
│  │ Non-root user, health check, env injection            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Technique: Manifest-Only Copy for Install Layer

```dockerfile
# ❌ BEFORE — Any source change invalidates install layer
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# ✅ AFTER — Only manifest changes invalidate install layer
COPY packages/adapter-prisma/package.json ./packages/adapter-prisma/
COPY packages/core/package.json ./packages/core/
# ... (17 packages total)
RUN --mount=type=cache,id=s/<SERVICE_ID>-pnpm,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --frozen-lockfile
```

**Why this works**: `pnpm install` only needs `package.json` files for dependency resolution. Source code is irrelevant. By copying only manifests, the install layer stays cached across all source-only changes.

**Why tsconfig paths make this safe**: The `tsconfig.json` maps all `@sam-ai/*` imports directly to `./packages/*/src/` paths. Webpack/Turbopack resolves workspace packages via these filesystem paths — NOT through `node_modules` symlinks that pnpm creates. So the build works even though `node_modules/@sam-ai/*` symlinks resolve to manifest-only directories from deps-dev.

### Railway-Specific: Cache Mount ID Format

Railway's Metal builder requires cache mount IDs prefixed with `s/<service-id>`:

```dockerfile
# ❌ FAILS on Railway
RUN --mount=type=cache,id=pnpm-store,target=/path

# ✅ Works on Railway
RUN --mount=type=cache,id=s/a5806e45-63e0-4877-a422-d32ba4db7551-pnpm,target=/path
```

**Service ID**: `a5806e45-63e0-4877-a422-d32ba4db7551` (Taxomind production)

To find your service ID:
```bash
railway status                    # Verify connected project
railway variables 2>&1 | grep RAILWAY_SERVICE_ID
```

### Simplified Builder Stage

```dockerfile
# ❌ BEFORE — 15+ individual COPY commands (no caching benefit)
COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
# ... 12 more directories + 8 config file COPYs

# ✅ AFTER — Single COPY, .dockerignore handles exclusions
COPY . .
```

Docker layers are sequential — any invalidated layer invalidates ALL subsequent layers. Individual COPY commands give zero caching benefit in the builder stage since source changes are the common trigger. `.dockerignore` already excludes `node_modules`, `.next`, `.env`, tests, docs, etc.

## Performance Impact

| Phase | Before (Cold) | After (Cached) | Savings |
|-------|---------------|----------------|---------|
| pnpm install | 3-5 min | CACHED (0s) or <30s | ~95% |
| prisma generate | ~15s | ~15s | — |
| next build | 5-8 min | 1-3 min (incremental) | ~60% |
| **Total** | **8-13 min** | **1.5-3.5 min** | **~70%** |

- **Source-only changes** (most common): Install layer fully cached, build uses incremental cache
- **Lockfile changes**: Install re-runs but pnpm store cache makes it ~30s instead of 3-5 min
- **First build after Dockerfile change**: Full cold build (one-time cost)

## Files

| File | Purpose |
|------|---------|
| `Dockerfile.railway` | Optimized multi-stage build with cache mounts |
| `railway.json` | Railway builder config (DOCKERFILE mode) |
| `.dockerignore` | Build context exclusions |

## Verification

```bash
# Local build test
DOCKER_BUILDKIT=1 docker build -f Dockerfile.railway -t taxomind-test --progress=plain .

# Railway deploy
git push origin main              # Auto-deploys (if not paused)
railway up --detach               # Manual deploy via CLI

# Check Railway build logs for cache hits:
# - "CACHED" on install layers = layer caching working
# - Fast next build = .next/cache mount working
```

## Troubleshooting

### "Builds are paused due to an incident"
Caused by aborted or failed builds. Unpause from Railway dashboard manually.

### "missing the cacheKey prefix from its id"
Cache mount IDs must use `id=s/<service-id>-<name>` format. See Railway-Specific section above.

### "# syntax=docker/dockerfile:1" hangs locally
Remove the syntax directive. Docker 23+ has native BuildKit support — the directive is only needed for older Docker versions and causes unnecessary image pulls.

### OOM during next build
The Dockerfile uses `--max-old-space-size=4096` + `EXPERIMENTAL_CPUS=1` + `--experimental-build-mode compile` to stay within Railway's ~8 GB container. See comments in `Dockerfile.railway` for detailed memory tuning.

---

*Created: February 2026*
*Related: `codebase-memory/build-optimization/TYPESCRIPT_MEMORY_SOLUTION.md`*
