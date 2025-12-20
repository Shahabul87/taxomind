# SAM AI Deprecated Code

> **DO NOT USE** - This folder contains deprecated SAM AI code that has been replaced by the new unified system.

## Why This Exists

The old SAM system had several issues:
- **5 nested providers** causing hydration and state issues
- **7 fragmented engines** running without dependency awareness
- **80+ API routes** scattered across the codebase
- **No unified orchestration** - engines ran in parallel causing rate limits

## New System Location

The new unified SAM system is located at:

```
packages/core/src/           # @sam-ai/core package
components/sam/              # Active SAM components
app/api/sam/unified/         # Unified API endpoint
lib/sam/                     # SAM utilities
```

## Contents of This Folder

### /sam-ai-tutor-legacy/
Old engine implementations and components from the legacy SAM system:
- `engines/` - 40+ old engine files (context, blooms, content, etc.)
- `components/` - Old SAM UI components
- `hooks/` - Old React hooks

### /teacher-sam-components/
Old provider implementations:
- `comprehensive-sam-provider.tsx` - Old 5-provider wrapper
- `sam-ai-tutor-provider.tsx` - Old tutor provider
- `sam-ai-tutor-wrapper.tsx` - Old wrapper component

### /old-providers/
Additional old provider files:
- `global-sam-provider.tsx` - Old global provider
- `use-sam-page-context.tsx` - Old context hook

### /old-docs/sam-ai-tutor/
Old architecture documentation (11 markdown files):
- `00-OVERVIEW.md` through `09-NPM-PACKAGE-GUIDE.md`
- `README.md`

### sam-assistant-panel.backup.tsx
Backup of old SAM assistant panel before unification.

## Active vs Deprecated

| Feature | Deprecated Location | Active Location |
|---------|--------------------|-----------------|
| Orchestrator | N/A (didn't exist) | `packages/core/src/orchestrator.ts` |
| Context Engine | `sam-ai-tutor-legacy/engines/` | `packages/core/src/engines/context/` |
| Blooms Engine | `sam-ai-tutor-legacy/engines/` | `packages/core/src/engines/blooms/` |
| Content Engine | `sam-ai-tutor-legacy/engines/` | `packages/core/src/engines/content/` |
| Providers | `teacher-sam-components/` | `components/sam/sam-global-provider.tsx` |
| API Routes | 80+ scattered routes | `app/api/sam/unified/route.ts` |
| Documentation | `old-docs/` | `docs/features/sam-ai-system/` |

## Do Not Delete Yet

This folder is kept for:
1. **Reference** - Understanding how the old system worked
2. **Migration support** - In case any edge cases need old logic
3. **Documentation** - Historical context

## When to Delete

This folder can be safely deleted after:
- [ ] New system has been in production for 30+ days
- [ ] No reported issues requiring old code reference
- [ ] Team has confirmed no edge cases need old logic

---

*Created: December 2024*
*Reason: SAM AI Unification Phase 4 Complete*
