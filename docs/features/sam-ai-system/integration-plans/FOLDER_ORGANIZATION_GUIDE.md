# SAM AI Tutor - Folder Organization Guide

**Version**: 1.0.0
**Created**: January 18, 2025
**Purpose**: Complete guide for SAM file organization and structure

---

## 📋 Table of Contents

1. [Organization Philosophy](#organization-philosophy)
2. [Folder Structure Details](#folder-structure-details)
3. [File Naming Conventions](#file-naming-conventions)
4. [Where to Put New Files](#where-to-put-new-files)
5. [Migration Status](#migration-status)
6. [Import Path Guide](#import-path-guide)

---

## 🎯 Organization Philosophy

### Core Principles

1. **Single Source of Truth**: All SAM-related files in one centralized location
2. **Logical Grouping**: Files organized by purpose (engines, components, docs)
3. **Scalability**: Easy to add new engines, components, and features
4. **Discoverability**: Clear naming and structure for quick file location
5. **Maintainability**: Related files grouped together for easier updates

### Benefits

✅ **Easier Onboarding** - New developers know exactly where to find SAM files
✅ **Faster Development** - No hunting across multiple directories
✅ **Better Documentation** - All docs in one place
✅ **Cleaner Codebase** - SAM isolated from other system components
✅ **NPM Package Ready** - Structure ready for npm publish

---

## 📂 Folder Structure Details

### Root: `sam-ai-tutor/`

```
sam-ai-tutor/
├── README.md                  # Main entry point, navigation
├── FOLDER_ORGANIZATION_GUIDE.md  # This file
└── (subfolders below)
```

---

### 1. Documentation: `docs/`

**Purpose**: All SAM documentation, guides, and references

#### Structure

```
docs/
├── architecture/              # System architecture documentation
│   ├── 00-OVERVIEW.md         # Complete system overview
│   ├── 02-CORE-ENGINES.md     # Core engine patterns
│   ├── 03-SPECIALIZED-ENGINES.md  # Individual engine docs
│   ├── 07-WORKFLOWS.md        # System workflows
│   └── 08-FILE-MAPPING.md     # Complete file mapping
│
├── implementation/            # Implementation guides
│   ├── SAM_IMPLEMENTATION_COMPLETE_GUIDE.md
│   ├── SAM_MIGRATION_GUIDE.md
│   ├── CONTEXT_AWARE_SAM_IMPLEMENTATION.md
│   ├── SAM_ENGINES_INTEGRATION_GUIDE.md
│   ├── SAM_ENGINES_FINAL_INTEGRATION.md
│   ├── SAM_CONTEXTUAL_INTELLIGENCE_IMPLEMENTATION.md
│   ├── SAM_FORM_POPULATION_COMPLETE_GUIDE.md
│   └── SAM_COLOR_DESIGN_SUMMARY.md
│
├── guides/                    # User & developer guides
│   ├── SAM_USER_GUIDE.md
│   ├── SAM_DEVELOPMENT_GUIDE.md
│   ├── SAM_QUICK_REFERENCE.md
│   ├── SAM_AI_FRONTEND_INTEGRATION_GUIDE.md
│   ├── SAM_ENGINES_USER_GUIDE.md
│   └── SAM_ENGINES_PRODUCTION_GUIDE.md
│
├── api-reference/             # API documentation
│   ├── SAM_API_DOCUMENTATION.md
│   └── SAM_AI_TUTOR_API_REFERENCE.md
│
├── troubleshooting/           # Problem-solving guides
│   └── SAM_AI_TUTOR_TROUBLESHOOTING.md
│
├── user-guides/               # End-user documentation
│   ├── SAM_ENGINES_USER_GUIDE.md
│   └── SAM_EVALUATION_STANDARDS_DOCUMENTATION.md
│
└── reports/                   # Analysis and reports
    ├── SAM_AI_TEACHER_POWER_ANALYSIS_REPORT.md
    ├── SAM_AI_ENGINE_COMPREHENSIVE_ARCHITECTURE.md
    ├── SAM_ENGINE_GAPS_AND_IMPROVEMENTS.md
    └── SAM_ENGINE_REUSABILITY_GUIDE.md
```

#### What Goes Here

- ✅ Architecture documentation
- ✅ Implementation guides
- ✅ API references
- ✅ User guides
- ✅ Troubleshooting docs
- ✅ Analysis reports

#### Naming Convention

- **Architecture**: `{NUMBER}-{TOPIC}.md` (e.g., `00-OVERVIEW.md`)
- **Implementation**: `SAM_{TOPIC}_GUIDE.md`
- **Reports**: `SAM_{TOPIC}_REPORT.md`

---

### 2. Engines: `engines/`

**Purpose**: All SAM AI engine implementations

#### Structure

```
engines/
├── core/                      # Core engine foundation
│   ├── sam-base-engine.ts     # Abstract base class
│   ├── sam-engine-integration.ts
│   └── sam-master-integration.ts
│
├── educational/               # Educational intelligence (6 engines)
│   ├── sam-blooms-engine.ts
│   ├── sam-personalization-engine.ts
│   ├── sam-analytics-engine.ts
│   ├── sam-predictive-engine.ts
│   ├── sam-achievement-engine.ts
│   └── sam-contextual-intelligence.ts
│
├── content/                   # Content generation (4 engines)
│   ├── sam-generation-engine.ts
│   ├── sam-course-architect.ts
│   ├── sam-exam-engine.ts
│   └── sam-multimedia-engine.ts
│
├── business/                  # Business intelligence (3 engines)
│   ├── sam-financial-engine.ts
│   ├── sam-market-engine.ts
│   └── sam-enterprise-engine.ts
│
├── social/                    # Social learning (3 engines)
│   ├── sam-collaboration-engine.ts
│   ├── sam-social-engine.ts
│   └── sam-course-guide-engine.ts
│
└── advanced/                  # Advanced AI (10+ engines)
    ├── sam-memory-engine.ts
    ├── sam-memory-system.ts
    ├── sam-enhanced-context.ts
    ├── sam-innovation-engine.ts
    ├── sam-news-engine.ts
    ├── sam-news-fetcher.ts
    ├── sam-news-ranking-engine.ts
    ├── sam-real-news-fetcher.ts
    ├── sam-trends-engine.ts
    ├── sam-trends-engine-improved.ts
    ├── sam-research-engine.ts
    └── sam-resource-engine.ts
```

#### Engine Categories

1. **Core** - Foundation classes (3 files)
2. **Educational** - Learning intelligence (6 engines)
3. **Content** - Content generation (4 engines)
4. **Business** - Business intelligence (3 engines)
5. **Social** - Social learning (3 engines)
6. **Advanced** - Advanced AI features (10+ engines)

**Total**: 35+ engines

#### Naming Convention

- Format: `sam-{name}-engine.ts`
- Examples: `sam-blooms-engine.ts`, `sam-financial-engine.ts`

---

### 3. Components: `components/`

**Purpose**: React components for SAM UI

#### Structure

```
components/
├── global/                    # Global components
│   ├── sam-global-provider.tsx
│   ├── sam-global-assistant.tsx
│   └── sam-context-manager.tsx
│
├── contextual/                # Context-aware components
│   ├── sam-contextual-chat.tsx
│   ├── sam-course-integration.tsx
│   ├── sam-engine-powered-chat.tsx
│   ├── sam-conversation-history.tsx
│   └── sam-quick-access.tsx
│
├── integration/               # Integration components
│   ├── sam-analytics-dashboard.tsx
│   ├── sam-analytics-tracker.tsx
│   ├── sam-gamification-dashboard.tsx
│   ├── sam-tiptap-integration.tsx
│   ├── sam-mobile-responsive.tsx
│   └── sam-standards-info.tsx
│
└── ui/                        # UI utility components
    ├── sam-error-boundary.tsx
    ├── sam-loading-state.tsx
    └── sam-role-config.tsx
```

#### Component Categories

1. **Global** - App-wide components (3 components)
2. **Contextual** - Context-aware components (5 components)
3. **Integration** - Feature integrations (6 components)
4. **UI** - Utility components (3 components)

**Total**: 17+ components

#### Naming Convention

- Format: `sam-{purpose}-{type}.tsx`
- Examples: `sam-global-provider.tsx`, `sam-analytics-dashboard.tsx`

---

### 4. API Routes: `api/`

**Purpose**: API endpoint implementations

#### Structure

```
api/                           # Symbolic link to app/api/sam/
├── ai-tutor/                  # AI tutoring (20+ endpoints)
│   ├── chat/
│   ├── achievements/
│   ├── adaptive-content/
│   └── ...
│
├── blooms-analysis/           # Cognitive analysis
├── personalization/           # Adaptive learning
├── analytics/                 # Analytics
├── gamification/              # Achievements
├── exam-engine/               # Assessment
├── financial-intelligence/    # Business intelligence
└── ... (80+ total endpoints)
```

**Note**: This is a symbolic link to the actual API location (`app/api/sam/`) for centralized documentation purposes.

---

### 5. Hooks: `hooks/`

**Purpose**: Custom React hooks for SAM

#### Structure

```
hooks/
├── use-sam-context.ts         # SAM context hook
├── use-sam-cache.ts           # Caching hook
└── use-sam-debounce.ts        # Debounce utility
```

#### Naming Convention

- Format: `use-sam-{purpose}.ts`
- Examples: `use-sam-context.ts`, `use-sam-cache.ts`

---

### 6. Tests: `tests/`

**Purpose**: SAM-specific test files

#### Structure

```
tests/
├── unit/                      # Unit tests
│   ├── engines/
│   │   └── sam-blooms-engine.test.ts
│   ├── components/
│   └── utils/
│
└── integration/               # Integration tests
    ├── api/
    └── workflows/
```

#### Naming Convention

- Format: `{filename}.test.ts` or `{filename}.spec.ts`

---

### 7. Types: `types/`

**Purpose**: TypeScript type definitions

#### Structure

```
types/
└── sam-engine-types.ts        # All SAM-related types
```

#### What Goes Here

- ✅ Engine interfaces
- ✅ API request/response types
- ✅ Component prop types
- ✅ Shared type definitions

---

### 8. Utils: `utils/`

**Purpose**: Utility functions and helpers

#### Structure

```
utils/
├── sam-database.ts            # Database utilities
├── sam-rate-limiter.ts        # Rate limiting
└── sam-validators.ts          # Input validation
```

#### Naming Convention

- Format: `sam-{purpose}.ts`

---

### 9. Config: `config/`

**Purpose**: Configuration files

#### Structure

```
config/
├── sam-context.ts             # Context configuration
└── sam-achievements.ts        # Achievement definitions
```

---

## 📝 File Naming Conventions

### General Rules

1. **Lowercase with dashes**: `sam-example-file.ts`
2. **Prefix with "sam-"**: All files start with `sam-`
3. **Descriptive names**: Name should explain purpose
4. **Consistent extensions**: `.ts` for logic, `.tsx` for React, `.md` for docs

### Examples by Type

**Engines**:
- ✅ `sam-blooms-engine.ts`
- ✅ `sam-personalization-engine.ts`
- ❌ `bloomsEngine.ts` (missing prefix)
- ❌ `sam_blooms_engine.ts` (underscores instead of dashes)

**Components**:
- ✅ `sam-global-assistant.tsx`
- ✅ `sam-analytics-dashboard.tsx`
- ❌ `GlobalAssistant.tsx` (missing prefix)

**Documentation**:
- ✅ `SAM_IMPLEMENTATION_GUIDE.md`
- ✅ `00-OVERVIEW.md` (architecture docs)
- ❌ `sam_guide.md` (lowercase for docs)

**Hooks**:
- ✅ `use-sam-context.ts`
- ✅ `use-sam-cache.ts`
- ❌ `useSamContext.ts` (camelCase filename)

---

## 🗂️ Where to Put New Files

### Decision Tree

```
New SAM file to add?
├── Is it an AI engine? → engines/{category}/sam-{name}-engine.ts
├── Is it a React component? → components/{category}/sam-{name}.tsx
├── Is it documentation? → docs/{category}/{NAME}.md
├── Is it an API endpoint? → app/api/sam/{category}/route.ts
├── Is it a React hook? → hooks/use-sam-{name}.ts
├── Is it a type definition? → types/sam-engine-types.ts
├── Is it a utility function? → utils/sam-{purpose}.ts
├── Is it a test file? → tests/{unit|integration}/
└── Is it configuration? → config/sam-{purpose}.ts
```

### Examples

**Adding a new "Translation" engine**:
```
engines/advanced/sam-translation-engine.ts
```

**Adding a "Course Analytics" component**:
```
components/integration/sam-course-analytics.tsx
```

**Adding "Deployment" documentation**:
```
docs/implementation/SAM_DEPLOYMENT_GUIDE.md
```

**Adding a caching hook**:
```
hooks/use-sam-cache.ts
```

---

## 🔄 Migration Status

### Files to Move

#### From `lib/` to `engines/`

**Core**:
- [ ] `lib/sam-base-engine.ts` → `engines/core/`
- [ ] `lib/sam-engine-integration.ts` → `engines/core/`
- [ ] `lib/sam-master-integration.ts` → `engines/core/`

**Educational** (6 files):
- [ ] `lib/sam-blooms-engine.ts` → `engines/educational/`
- [ ] `lib/sam-personalization-engine.ts` → `engines/educational/`
- [ ] `lib/sam-analytics-engine.ts` → `engines/educational/`
- [ ] `lib/sam-predictive-engine.ts` → `engines/educational/`
- [ ] `lib/sam-achievement-engine.ts` → `engines/educational/`
- [ ] `lib/sam-contextual-intelligence.ts` → `engines/educational/`

**Content** (4 files):
- [ ] `lib/sam-generation-engine.ts` → `engines/content/`
- [ ] `lib/sam-course-architect.ts` → `engines/content/`
- [ ] `lib/sam-exam-engine.ts` → `engines/content/`
- [ ] `lib/sam-multimedia-engine.ts` → `engines/content/`

**Business** (3 files):
- [ ] `lib/sam-financial-engine.ts` → `engines/business/`
- [ ] `lib/sam-market-engine.ts` → `engines/business/`
- [ ] `lib/sam-enterprise-engine.ts` → `engines/business/`

**Social** (3 files):
- [ ] `lib/sam-collaboration-engine.ts` → `engines/social/`
- [ ] `lib/sam-social-engine.ts` → `engines/social/`
- [ ] `lib/sam-course-guide-engine.ts` → `engines/social/`

**Advanced** (10+ files):
- [ ] `lib/sam-memory-engine.ts` → `engines/advanced/`
- [ ] `lib/sam-memory-system.ts` → `engines/advanced/`
- [ ] `lib/sam-enhanced-context.ts` → `engines/advanced/`
- [ ] `lib/sam-innovation-engine.ts` → `engines/advanced/`
- [ ] `lib/sam-news-engine.ts` → `engines/advanced/`
- [ ] `lib/sam-news-fetcher.ts` → `engines/advanced/`
- [ ] `lib/sam-news-ranking-engine.ts` → `engines/advanced/`
- [ ] `lib/sam-real-news-fetcher.ts` → `engines/advanced/`
- [ ] `lib/sam-trends-engine.ts` → `engines/advanced/`
- [ ] `lib/sam-trends-engine-improved.ts` → `engines/advanced/`
- [ ] `lib/sam-research-engine.ts` → `engines/advanced/`
- [ ] `lib/sam-resource-engine.ts` → `engines/advanced/`

**Utils**:
- [ ] `lib/sam-database.ts` → `utils/`
- [ ] `lib/sam-rate-limiter.ts` → `utils/`
- [ ] `lib/sam-context.ts` → `config/`
- [ ] `lib/sam-achievements.ts` → `config/`

#### From `components/sam/` to `components/`

**Global**:
- [ ] `components/sam/sam-global-provider.tsx` → `components/global/`
- [ ] `components/sam/sam-global-assistant.tsx` → `components/global/`
- [ ] `components/sam/sam-context-manager.tsx` → `components/global/`

**Contextual**:
- [ ] `components/sam/sam-contextual-chat.tsx` → `components/contextual/`
- [ ] `components/sam/sam-course-integration.tsx` → `components/contextual/`
- [ ] `components/sam/sam-engine-powered-chat.tsx` → `components/contextual/`
- [ ] `components/sam/sam-conversation-history.tsx` → `components/contextual/`
- [ ] `components/sam/sam-quick-access.tsx` → `components/contextual/`

**Integration**:
- [ ] `components/sam/sam-analytics-dashboard.tsx` → `components/integration/`
- [ ] `components/sam/sam-analytics-tracker.tsx` → `components/integration/`
- [ ] `components/sam/sam-gamification-dashboard.tsx` → `components/integration/`
- [ ] `components/sam/sam-tiptap-integration.tsx` → `components/integration/`
- [ ] `components/sam/sam-mobile-responsive.tsx` → `components/integration/`
- [ ] `components/sam/sam-standards-info.tsx` → `components/integration/`

**UI**:
- [ ] `components/ui/sam-error-boundary.tsx` → `components/ui/`
- [ ] `components/ui/sam-loading-state.tsx` → `components/ui/`
- [ ] `components/sam/sam-role-config.tsx` → `components/ui/`

#### From `docs/` to `docs/`

**Architecture**:
- [ ] `docs/architecture/sam-ai-tutor/*.md` → `docs/architecture/`

**Implementation**:
- [ ] `docs/features/sam-ai-system/implementation/*.md` → `docs/implementation/`

**Guides**:
- [ ] `docs/features/sam-ai-system/*.md` → `docs/guides/` or `docs/api-reference/`

**Reports**:
- [ ] `SAM_AI_TEACHER_POWER_ANALYSIS_REPORT.md` → `docs/reports/`
- [ ] `docs/SAM_*.md` → `docs/reports/`

#### From `hooks/` to `hooks/`

- [ ] `hooks/use-sam-context.ts` → `hooks/`
- [ ] `hooks/use-sam-cache.ts` → `hooks/`
- [ ] `hooks/use-sam-debounce.ts` → `hooks/`

---

## 🔗 Import Path Guide

### Before Migration

```typescript
// Old import paths
import { SAMBloomsEngine } from '@/lib/sam-blooms-engine';
import { SAMGlobalProvider } from '@/components/sam/sam-global-provider';
import { useSAMContext } from '@/hooks/use-sam-context';
```

### After Migration

```typescript
// New import paths
import { SAMBloomsEngine } from '@/sam-ai-tutor/engines/educational/sam-blooms-engine';
import { SAMGlobalProvider } from '@/sam-ai-tutor/components/global/sam-global-provider';
import { useSAMContext } from '@/sam-ai-tutor/hooks/use-sam-context';
```

### Using Path Aliases

**Option 1**: Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/sam/*": ["./sam-ai-tutor/*"]
    }
  }
}
```

**Then import**:
```typescript
import { SAMBloomsEngine } from '@/sam/engines/educational/sam-blooms-engine';
```

**Option 2**: Keep current structure with symbolic links (recommended for gradual migration)

---

## ✅ Migration Checklist

### Phase 1: Documentation (Complete First)

- [ ] Create folder structure
- [ ] Move all docs to `sam-ai-tutor/docs/`
- [ ] Update README.md with navigation
- [ ] Create FOLDER_ORGANIZATION_GUIDE.md

### Phase 2: Core Files (Do Second)

- [ ] Move engines to categorized folders
- [ ] Move components to categorized folders
- [ ] Move hooks
- [ ] Move types
- [ ] Move utils

### Phase 3: Update References (Do Third)

- [ ] Update import paths in components
- [ ] Update import paths in API routes
- [ ] Update import paths in pages
- [ ] Update tsconfig.json paths

### Phase 4: Testing (Do Fourth)

- [ ] Run TypeScript check
- [ ] Run linting
- [ ] Run tests
- [ ] Test SAM functionality
- [ ] Verify all imports work

### Phase 5: Cleanup (Do Last)

- [ ] Remove old file locations
- [ ] Update documentation links
- [ ] Archive old structure
- [ ] Create migration notes

---

## 📞 Support

**Questions**: File an issue in project repository
**Migration Help**: Contact development team
**Documentation**: See README.md in root folder

---

**Version**: 1.0.0
**Created**: January 18, 2025
**Status**: ✅ Active Guide

---

*This guide will be updated as the migration progresses.*
