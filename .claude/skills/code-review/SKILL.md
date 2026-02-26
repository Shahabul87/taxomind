---
name: code-review
description: Review code for TypeScript errors, security vulnerabilities, enterprise standards compliance, and React best practices. Use when reviewing PRs, after implementing features, or when the user asks to review code quality.
argument-hint: [file-or-directory]
allowed-tools: Read, Grep, Glob, Bash
---

# Enterprise Code Review

Review the specified code ($ARGUMENTS) against Taxomind enterprise standards. If no path is given, review all staged/modified files.

## Step 1: Identify Files to Review

If `$ARGUMENTS` is provided, review those files. Otherwise:

```bash
git diff --name-only HEAD
git diff --cached --name-only
```

Only review `.ts`, `.tsx`, `.js`, `.jsx`, and `.prisma` files.

## Step 2: Run Automated Checks

Run these checks and report results:

```bash
npm run lint 2>&1 | tail -40
npm run typecheck:parallel 2>&1 | tail -40
```

## Step 3: Manual Code Review Checklist

For each file, check against these categories:

### TypeScript Strictness
- [ ] No `any` or `unknown` types without type guards
- [ ] No null assertions (`!`) on optional values - use `??` instead
- [ ] Proper return types on all exported functions
- [ ] Interfaces/types defined for all data structures

### React Best Practices
- [ ] No `// eslint-disable-next-line react-hooks/exhaustive-deps`
- [ ] All `useEffect`/`useCallback` dependencies are complete
- [ ] Mutable values in callbacks use `useRef`, not `useState`
- [ ] Uses `next/image` instead of `<img>`
- [ ] HTML entities used (`&apos;`, `&quot;`) instead of raw quotes
- [ ] Loading/error states handled in async components
- [ ] Image `onError` handlers or fallback URLs present

### Security (OWASP Top 10)
- [ ] All inputs validated with Zod schemas
- [ ] No SQL injection (parameterized queries only)
- [ ] No XSS vulnerabilities (no `dangerouslySetInnerHTML` without sanitization)
- [ ] No secrets or API keys hardcoded
- [ ] Auth checks present on protected API routes
- [ ] Rate limiting on AI/expensive endpoints

### API Routes
- [ ] Standard `ApiResponse<T>` format used
- [ ] Zod validation on request body
- [ ] Authentication check (`currentUser()`)
- [ ] Authorization check (role-based)
- [ ] Error messages don&apos;t leak internals
- [ ] `take` limit on all `findMany` queries
- [ ] AI routes use `withRetryableTimeout` and `withRateLimit`

### AI/SAM Integration
- [ ] All AI calls go through `@/lib/sam/ai-provider` (never direct imports)
- [ ] Correct capability type used (`chat`, `course`, `analysis`, `code`, `skill-roadmap`)
- [ ] `handleAIAccessError` used in catch blocks
- [ ] No hardcoded provider names

### Prisma/Database
- [ ] New fields are optional (`?`) or have `@default()`
- [ ] Relations use exact capitalized model names (`Enrollment`, not `enrollment`)
- [ ] Transactions used for multi-step writes
- [ ] No unbounded `findMany` (must include `take`)

### Clean Code
- [ ] No `_enhanced`, `_updated`, `_new` file suffixes
- [ ] No disabled ESLint rules
- [ ] Functions follow Single Responsibility Principle
- [ ] No deep nesting (max 3 levels)
- [ ] Meaningful variable/function names

## Step 4: Output Report

Format your review as:

```
## Code Review Report

**Files Reviewed**: [count]
**Automated Checks**: lint [PASS/FAIL] | types [PASS/FAIL]

### Critical Issues (Must Fix)
1. [file:line] - [issue description]

### Warnings (Should Fix)
1. [file:line] - [issue description]

### Suggestions (Nice to Have)
1. [file:line] - [suggestion]

### Summary
[Overall assessment: APPROVED / NEEDS CHANGES / BLOCKED]
[Brief explanation of most important findings]
```

## Rules

- Be specific: always include file path and line number
- Prioritize: security issues > type safety > code quality > style
- Don&apos;t nitpick formatting if Prettier handles it
- Don&apos;t suggest adding comments to self-explanatory code
- Focus on actual bugs and standards violations, not preferences
