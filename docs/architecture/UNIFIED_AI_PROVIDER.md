# Unified AI Provider Architecture

> **Single entry point:** `lib/sam/ai-provider.ts`
>
> Every route and service that needs AI **MUST** import from this module.

---

## Why This Exists

Before this architecture, Taxomind had 3 separate AI call patterns across ~65 call sites:

| Pattern | Import | Problem |
|---------|--------|---------|
| `runSAMChatWithPreference()` | `@/lib/sam/ai-provider` | Working, but only returned text |
| `aiClient.chat()` | `@/lib/ai/enterprise-client` | Inconsistent entry point, leaked internals |
| `getCoreAIAdapter()` | `@/lib/sam/integration-adapters` | Bypassed user preferences and rate limiting |

Now everything goes through **one module**: `lib/sam/ai-provider.ts`.

---

## Exports at a Glance

```typescript
import {
  runSAMChatWithPreference,  // → string
  runSAMChatWithMetadata,    // → { content, provider, model }
  runSAMChatStream,          // → AsyncGenerator<AIChatStreamChunk>
  getSAMAdapter,             // → CoreAIAdapter (user-scoped)
  getSAMAdapterSystem,       // → CoreAIAdapter | null (system-level)
  handleAIAccessError,       // → NextResponse | null (error helper)
  AIAccessDeniedError,       // → Error class for catch blocks
} from '@/lib/sam/ai-provider';
```

---

## Which Function to Use

```
Do you need AI text generation?
├── Yes → Do you need provider/model metadata in the response?
│   ├── No  → runSAMChatWithPreference()    (returns string)
│   └── Yes → runSAMChatWithMetadata()       (returns {content, provider, model})
│
Do you need SSE streaming?
└── Yes → runSAMChatStream()                 (returns AsyncGenerator)

Do you need a CoreAIAdapter for SAM engines?
├── Do you have a userId?
│   ├── Yes → getSAMAdapter({ userId, capability })
│   └── No  → getSAMAdapterSystem()          (health checks only)
```

### Quick Reference

| Function | Returns | When to Use |
|----------|---------|-------------|
| `runSAMChatWithPreference()` | `string` | Most API routes — just need AI text |
| `runSAMChatWithMetadata()` | `{content, provider, model}` | Routes that return provider info to the client |
| `runSAMChatStream()` | `AsyncGenerator<AIChatStreamChunk>` | SSE streaming endpoints |
| `getSAMAdapter()` | `CoreAIAdapter` | SAM engines needing the adapter interface |
| `getSAMAdapterSystem()` | `CoreAIAdapter \| null` | System health checks (no userId) |
| `handleAIAccessError()` | `NextResponse \| null` | Catch blocks for rate limit / subscription errors |

---

## Common Options

All chat functions accept the same options:

```typescript
interface SAMChatOptions {
  userId: string;                    // Required — authenticated user ID
  capability: AICapability;          // 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap'
  messages: AIMessage[];             // Chat messages array
  systemPrompt?: string;             // System prompt
  maxTokens?: number;                // Default: 2000
  temperature?: number;              // Default: 0.7
  extended?: boolean;                // Extended timeout for long operations (180s vs 60s)
}
```

The `capability` field determines:
1. Which per-capability provider the user has selected (e.g., "use DeepSeek for courses, Anthropic for chat")
2. Which rate limit bucket the request counts against
3. Usage tracking categorization

---

## Provider Resolution Order

Every call goes through this resolution chain:

```
1. User preference (global provider → per-capability provider)
2. Platform default (from PlatformAISettings in DB)
3. Factory default (DeepSeek → Anthropic → OpenAI → Gemini → Mistral)
```

Additionally:
- **Maintenance mode** is checked first — throws `AIMaintenanceModeError` if active
- **Rate limits** are enforced based on subscription tier — throws `AIAccessDeniedError` if exceeded
- **Automatic fallback** to secondary providers on failure

---

## Usage Examples

### 1. Simple route (content only)

```typescript
// app/api/sam/validate/route.ts
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';

export async function POST(req: NextRequest) {
  try {
    const { userId, message } = await req.json();

    const content = await runSAMChatWithPreference({
      userId,
      capability: 'chat',
      messages: [{ role: 'user', content: message }],
      systemPrompt: 'You are a helpful tutor.',
    });

    return NextResponse.json({ success: true, content });
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 2. Route returning provider metadata

```typescript
// app/api/ai/lesson-generator/route.ts
import { runSAMChatWithMetadata, handleAIAccessError } from '@/lib/sam/ai-provider';

export async function POST(req: NextRequest) {
  try {
    const { userId, prompt } = await req.json();

    const completion = await runSAMChatWithMetadata({
      userId,
      capability: 'course',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4000,
      extended: true,
    });

    return NextResponse.json({
      content: completion.content,
      metadata: {
        provider: completion.provider,
        model: completion.model,
      },
    });
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    throw error;
  }
}
```

### 3. Streaming endpoint

```typescript
import { runSAMChatStream } from '@/lib/sam/ai-provider';

export async function POST(req: NextRequest) {
  const { userId, messages } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of runSAMChatStream({
        userId,
        capability: 'chat',
        messages,
      })) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### 4. SAM engine needing adapter

```typescript
import { getSAMAdapter } from '@/lib/sam/ai-provider';

async function runAnalysis(userId: string) {
  const adapter = await getSAMAdapter({ userId, capability: 'analysis' });
  const engine = createSomeEngine({ aiAdapter: adapter });
  return engine.analyze(data);
}
```

### 5. System health check (no userId)

```typescript
import { getSAMAdapterSystem } from '@/lib/sam/ai-provider';

async function checkAIHealth() {
  const adapter = await getSAMAdapterSystem();
  return { aiAvailable: adapter !== null };
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes / Services                     │
│                                                                  │
│  import { runSAMChatWithPreference,                             │
│           runSAMChatWithMetadata,                                │
│           runSAMChatStream,                                      │
│           getSAMAdapter,                                         │
│           getSAMAdapterSystem,                                   │
│           handleAIAccessError } from '@/lib/sam/ai-provider'     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    lib/sam/ai-provider.ts                         │
│                  (Single Entry Point)                             │
│                                                                  │
│  runSAMChatWithPreference() ──┐                                  │
│  runSAMChatWithMetadata()  ───┼──▶ aiClient.chat()               │
│  runSAMChatStream()  ────────┼──▶ aiClient.stream()              │
│  getSAMAdapter()  ───────────┼──▶ createUserScopedAdapter()      │
│  getSAMAdapterSystem()  ─────┼──▶ getCoreAIAdapter()             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               lib/ai/enterprise-client.ts                        │
│                   (Internal Engine)                               │
│                                                                  │
│  ┌──────────────────────────────────────────────┐                │
│  │           Provider Resolution                 │                │
│  │  1. User preference (DB: UserAIPreferences)   │                │
│  │  2. Platform default (DB: PlatformAISettings)  │               │
│  │  3. Factory default (API keys available)       │               │
│  └──────────────────┬───────────────────────────┘                │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────┐                │
│  │         Rate Limiting + Usage Tracking         │               │
│  │  checkAIAccess() → recordAIUsage()            │                │
│  └──────────────────┬───────────────────────────┘                │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────┐                │
│  │         Adapter Creation + Caching             │               │
│  │  SDK clients cached for 10min per provider     │               │
│  └──────────────────┬───────────────────────────┘                │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────┐                │
│  │         Automatic Fallback                     │               │
│  │  Primary fails → Fallback provider → Next...   │               │
│  └──────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Provider SDKs                               │
│                                                                  │
│  ┌───────────┐  ┌──────────┐  ┌────────┐  ┌────────┐  ┌───────┐│
│  │ DeepSeek  │  │Anthropic │  │ OpenAI │  │ Gemini │  │Mistral││
│  └───────────┘  └──────────┘  └────────┘  └────────┘  └───────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling

All AI functions can throw `AIAccessDeniedError` when rate limits or subscription restrictions are hit. Use the re-exported `handleAIAccessError()` helper:

```typescript
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';

try {
  const content = await runSAMChatWithPreference({ ... });
} catch (error) {
  // Returns a proper 429/503 NextResponse, or null if not an access error
  const accessResponse = handleAIAccessError(error);
  if (accessResponse) return accessResponse;

  // Handle other errors
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
```

The helper returns:
- **429** with upgrade info when rate-limited
- **503** when AI service is in maintenance mode
- **null** when the error is not access-related (caller handles it)

---

## Deprecated Patterns

These patterns still work but should NOT be used in new code:

| Deprecated | Replacement |
|-----------|-------------|
| `import { aiClient } from '@/lib/ai/enterprise-client'` | `import { runSAMChatWithPreference } from '@/lib/sam/ai-provider'` |
| `getUserScopedAIAdapter(userId, cap)` from taxomind-context | `getSAMAdapter({ userId, capability })` from ai-provider |
| `getCoreAIAdapter()` from integration-adapters | `getSAMAdapterSystem()` from ai-provider |
| `handleAIAccessError` from route-helper | `handleAIAccessError` from ai-provider |

---

## File Reference

| File | Role |
|------|------|
| `lib/sam/ai-provider.ts` | **Single entry point** — all routes import from here |
| `lib/ai/enterprise-client.ts` | Internal engine — provider resolution, caching, fallback |
| `lib/ai/user-scoped-adapter.ts` | Creates CoreAIAdapter backed by enterprise client |
| `lib/ai/route-helper.ts` | `createAIRoute()` factory + `handleAIAccessError()` definition |
| `lib/sam/integration-adapters.ts` | Legacy system-level adapter with circuit breaker |
| `lib/ai/subscription-enforcement.ts` | Rate limiting and subscription tier checks |
| `lib/sam/providers/ai-factory.ts` | SDK adapter creation (Anthropic, OpenAI, DeepSeek, etc.) |
| `lib/sam/providers/ai-registry.ts` | Provider availability checks and configuration |

---

*Last updated: February 2026*
*Architecture version: 2.0 (Unified)*
