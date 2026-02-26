---
name: nextjs-lms-audit
description: >
  Comprehensive audit skill for Next.js LMS platforms (specifically Taxomind). Performs deep
  analysis across 6 domains: performance, bundle optimization, security vulnerabilities,
  React optimization, database/Prisma efficiency, and API health. Use this skill whenever the
  user mentions "audit", "performance check", "security scan", "optimization review", "bundle
  analysis", "React profiling", "Prisma optimization", "API audit", "code quality check",
  "production readiness", "deploy review", or any variation of checking/improving their Next.js
  application health. Also trigger for phrases like "is my app optimized", "find bottlenecks",
  "what's slowing down my app", "check for vulnerabilities", "review my codebase". This skill
  is stack-aware for: Next.js 16+, React 18, Prisma, NextAuth, Stripe, TipTap, Socket.io,
  Redis/BullMQ, SAM AI packages, Sentry, OpenTelemetry, and Tailwind CSS.
---

# Next.js LMS Platform Audit Skill

## Overview

This skill performs a **systematic, multi-domain audit** of a Next.js-based LMS platform. It produces actionable findings ranked by severity (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low) with fix-it code snippets.

## Quick Start

When triggered, follow this sequence:

1. **Discover** → Scan the project structure, `package.json`, `next.config.*`, `tsconfig.json`
2. **Classify** → Determine which audit domains are relevant to the user's request
3. **Execute** → Run the audit checks (see domain references below)
4. **Report** → Generate a prioritized findings report as a Markdown artifact

If the user says "full audit" or "audit everything", run ALL 6 domains. If they say something specific like "check my performance", run only that domain.

---

## Audit Domains

### Domain 1: 🚀 Performance Audit
**Reference:** `references/performance.md`

Covers: Core Web Vitals risks, SSR/SSG misuse, image optimization, font loading, script loading strategy, middleware overhead, route segment config, caching headers, streaming/suspense usage.

### Domain 2: 📦 Bundle & Build Optimization
**Reference:** `references/bundle.md`

Covers: Bundle size analysis, tree-shaking failures, duplicate dependencies, dynamic import opportunities, barrel file anti-patterns, webpack/turbopack config, `next/dynamic` usage, dead code detection, package bloat (e.g., lodash full import vs lodash-es).

### Domain 3: 🔒 Security Vulnerability Audit
**Reference:** `references/security.md`

Covers: Dependency CVEs (npm audit), NextAuth misconfiguration, CSRF/XSS vectors, CSP headers, API route authentication gaps, Prisma injection risks, environment variable exposure, rate limiting coverage, Stripe webhook verification, sensitive data in client bundles.

### Domain 4: ⚛️ React Optimization Audit
**Reference:** `references/react-optimization.md`

Covers: Unnecessary re-renders, missing/incorrect memoization, context provider placement, state management patterns (Zustand usage), component composition, React Server Components vs Client Components boundary, `use client` directive overuse, hydration mismatches, effect cleanup, ref patterns.

### Domain 5: 🗄️ Database & Prisma Audit
**Reference:** `references/database.md`

Covers: N+1 query detection, missing indexes, Prisma `include`/`select` optimization, connection pooling, transaction patterns, migration health, schema design review, query performance, read replica usage.

### Domain 6: 🌐 API & Integration Audit
**Reference:** `references/api.md`

Covers: API route patterns, error handling consistency, rate limiting, caching strategy, Socket.io configuration, Redis connection management, BullMQ queue patterns, external API timeout/retry, OpenTelemetry instrumentation coverage.

---

## Execution Protocol

### Step 1: Project Discovery

```bash
# Run these commands to understand the project structure
find . -maxdepth 1 -type f -name "*.config.*" -o -name "*.json" -o -name ".env*" | head -20
cat package.json | head -50
ls -la app/ 2>/dev/null || ls -la src/app/ 2>/dev/null
cat next.config.* 2>/dev/null
cat tsconfig.json 2>/dev/null
```

### Step 2: Domain-Specific Checks

Read the relevant `references/*.md` file for the domain being audited. Each reference file contains:
- **What to check** (specific files, patterns, configs)
- **How to check** (bash commands, grep patterns, AST queries)
- **What good looks like** (expected patterns)
- **What bad looks like** (anti-patterns with severity)
- **How to fix** (code snippets and migration guides)

### Step 3: Report Generation

Generate a structured Markdown report with:

```markdown
# 🔍 [Platform Name] Audit Report
**Date:** YYYY-MM-DD
**Domains Audited:** [list]
**Overall Health Score:** X/100

## Executive Summary
[2-3 sentence overview of findings]

## Critical Findings (Fix Immediately)
### [Finding Title]
- **Severity:** 🔴 Critical
- **Domain:** [Performance/Security/etc]
- **Location:** `path/to/file.ts:L42`
- **Issue:** [description]
- **Impact:** [what happens if unfixed]
- **Fix:**
```[language]
// before
...
// after
...
```

## High Priority Findings
...

## Medium Priority Findings
...

## Low Priority / Recommendations
...

## Metrics Summary Table
| Metric | Current | Target | Status |
|--------|---------|--------|--------|

## Next Steps
1. ...
2. ...
```

---

## Stack-Specific Knowledge

This skill is pre-configured for the following stack. Use this knowledge to avoid false positives and give precise recommendations:

### Core Framework
- **Next.js 16+** with App Router, Turbopack, `--turbo` dev mode
- **React 18** (not 19 — no `use()` hook, no React Compiler)
- **TypeScript 5.9+** with project references (`tsconfig.build.json`)
- **Tailwind CSS 3.x** with `tailwindcss-animate`

### Auth & Payments
- **NextAuth v5 beta** (`next-auth@5.0.0-beta.25`) — check for beta-specific issues
- **Stripe** (`stripe` + `@stripe/stripe-js`) — webhook signature verification matters

### Data Layer
- **Prisma 6.x** with custom schema merge/split workflow (`scripts/merge-schema.ts`)
- **PostgreSQL** with pgvector extension
- **Redis** via `ioredis` + `@upstash/redis` (dual connection pattern)
- **BullMQ** for job queues

### AI/ML
- **Anthropic SDK** (`@anthropic-ai/sdk`) — check for streaming patterns
- **OpenAI SDK** (`openai`) — check for timeout handling
- **SAM AI packages** (workspace packages `@sam-ai/*`) — monorepo internal

### Rich Content
- **TipTap** editor (extensive extensions) — check bundle size impact
- **Monaco Editor** — must be dynamically imported
- **React Markdown + KaTeX** — check SSR compatibility

### Real-time
- **Socket.io** (client + server) — check CORS and transport config
- **Yjs** collaboration — check WebSocket connection management

### Observability
- **Sentry** (`@sentry/nextjs`) — check source maps, error boundary coverage
- **OpenTelemetry** (full stack) — check instrumentation overhead
- **prom-client** for Prometheus metrics

### Monorepo
- **npm workspaces** (`packages/*`) — check for hoisting issues
- **SAM AI packages** built via `scripts/sam-build-all.sh`

---

## Severity Classification Guide

| Severity | Criteria | Examples |
|----------|----------|---------|
| 🔴 Critical | Security breach risk, data loss, app crashes in production | Exposed secrets, SQL injection, unhandled auth bypass |
| 🟠 High | Significant performance degradation, UX impact, potential security issue | 2MB+ JS bundle on first load, missing rate limiting on auth endpoints |
| 🟡 Medium | Suboptimal patterns, moderate performance impact | Full lodash import, missing React.memo on list items |
| 🟢 Low | Best practice suggestions, minor optimizations | Console.log in production, missing aria labels |

---

## Important Notes

- **Never modify production code** during an audit — only read and analyze
- **Check `.env.example` not `.env`** — never expose actual secrets in reports
- **Focus on actionable findings** — skip theoretical issues without evidence
- **Respect the monorepo** — SAM AI packages have their own build/test cycle
- **Account for Next.js 16 specifics** — some patterns from Next.js 14/15 guides don't apply
