# SAM Portability Guide

This guide explains how to reuse the SAM packages in another app and what still needs app-specific wiring.

## What Is Portable Today
- `@sam-ai/core`: orchestrator, state machine, base engines, adapter contracts.
- `@sam-ai/educational`: engines (Blooms, exams, research, trends, etc).
- `@sam-ai/api`: Next.js-friendly handlers for chat/analyze/gamification/profile.
- `@sam-ai/react`: React hooks and provider.
- `@sam-ai/adapter-prisma`: Prisma implementation of `SAMDatabaseAdapter`.
- `@sam-ai/quality`, `@sam-ai/pedagogy`, `@sam-ai/memory`, `@sam-ai/safety`: standalone logic.

## What Is App-Specific
- Authentication and user context (who is calling SAM and what they can see).
- Database adapter (Prisma is provided, other DBs need a new adapter).
- Any domain-specific context builders (course/entity fetchers).
- API routes and UI wiring (route protection, rate limits, logging, telemetry).

## Minimal Integration (Next.js + Prisma)
1) Install packages:
```bash
npm install @sam-ai/core @sam-ai/educational @sam-ai/api @sam-ai/react @sam-ai/adapter-prisma
```

If this repo is the app, remove local workspaces for `packages/*` so npm resolves published packages instead of local workspace links.

2) Create a SAM config:
```ts
// lib/sam-config.ts
import { createSAMConfig, createAnthropicAdapter, createMemoryCache } from '@sam-ai/core';
import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';
import type { PrismaClient } from '@prisma/client';

export function buildSAMConfig(prisma: PrismaClient) {
  return createSAMConfig({
    ai: createAnthropicAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: 'claude-sonnet-4-5-20250929',
    }),
    database: createPrismaSAMAdapter(prisma),
    cache: createMemoryCache(),
  });
}
```

3) Create an API route using `@sam-ai/api`:
```ts
// app/api/sam/chat/route.ts
import { NextRequest } from 'next/server';
import { createChatHandler } from '@sam-ai/api';
import { createNextSAMHandler } from '@/lib/sam-api/next-handler';
import { buildSAMConfig } from '@/lib/sam-config';
import { db } from '@/lib/db';

const handler = createChatHandler(buildSAMConfig(db));

export const POST = createNextSAMHandler(handler);
```

4) Use the React provider:
```tsx
// app/providers.tsx
import { SAMProvider } from '@sam-ai/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SAMProvider
      transport="api"
      api={{
        endpoint: '/api/sam/chat',
        streamEndpoint: '/api/sam/chat/stream',
      }}
    >
      {children}
    </SAMProvider>
  );
}
```

## Optional: Custom Database Adapter
If you are not using Prisma, implement `SAMDatabaseAdapter` from `@sam-ai/core` and pass it into `createSAMConfig`.

## Portability Checklist
- LLM adapter is created via `@sam-ai/core` (`createAnthropicAdapter` or your own).
- Database adapter is not app-specific (Prisma or custom).
- Routes use `@sam-ai/api` handlers or call the orchestrator directly.
- UI uses `@sam-ai/react` or a thin wrapper around `@sam-ai/core`.
- No direct imports from app-specific modules inside `@sam-ai/*` packages.
