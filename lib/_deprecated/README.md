# Deprecated Engines

**Deprecated on**: January 2026

These legacy engines have been superseded by the SAM Agentic AI system packages. They are kept here for reference and potential rollback only.

## Replacement Packages

| Legacy Engine | New Package | Factory Function |
|--------------|-------------|------------------|
| **sam-engines/advanced/** | | |
| `sam-analytics-engine.ts` | `@sam-ai/educational` | `createAnalyticsEngine()` |
| `sam-innovation-engine.ts` | `@sam-ai/educational` | `createInnovationEngine()` |
| `sam-memory-engine.ts` | `@sam-ai/educational` + `@sam-ai/memory` | `createMemoryEngine()` |
| `sam-news-ranking-engine.ts` | Deprecated - use external APIs | N/A |
| `sam-predictive-engine.ts` | `@sam-ai/educational` | `createPredictiveEngine()` |
| `sam-research-engine.ts` | `@sam-ai/educational` | `createResearchEngine()` |
| `sam-trends-engine*.ts` | `@sam-ai/educational` | `createTrendsEngine()` |
| **sam-engines/educational/** | | |
| `sam-blooms-engine.ts` | `@sam-ai/educational` | `createBloomsAnalysisEngine()` |
| `sam-exam-engine.ts` | `@sam-ai/educational` | `createExamEngine()` |
| `sam-evaluation-engine.ts` | `@sam-ai/educational` | `createEvaluationEngine()` |
| `sam-personalization-engine.ts` | `@sam-ai/educational` | `createPersonalizationEngine()` |
| `sam-course-guide-engine.ts` | `@sam-ai/educational` | `createCourseGuideEngine()` |
| `sam-achievement-engine.ts` | `@sam-ai/educational` | `createAchievementEngine()` |
| `sam-integrity-engine.ts` | `@sam-ai/educational` | `createIntegrityEngine()` |
| `enhanced-depth-engine.ts` | `@sam-ai/educational` | `createEnhancedDepthAnalysisEngine()` |
| `cat-irt-engine.ts` | `@sam-ai/educational` | `createExamEngine()` (includes CAT/IRT) |
| `deterministic-rubric-engine.ts` | `@sam-ai/educational` | See `analyzers/` module |
| **sam-engines/business/** | | |
| `sam-enterprise-engine.ts` | Future: `@sam-ai/enterprise` | N/A |
| `sam-financial-engine.ts` | `@sam-ai/educational` | `createFinancialEngine()` |
| `sam-market-engine.ts` | `@sam-ai/educational` | `createMarketEngine()` |
| **sam-engines/content/** | | |
| `sam-generation-engine.ts` | `@sam-ai/educational` | `createContentGenerationEngine()` |
| `sam-multimedia-engine.ts` | `@sam-ai/educational` | `createMultimediaEngine()` |
| `sam-news-engine.ts` | Deprecated - use external APIs | N/A |
| `sam-resource-engine.ts` | `@sam-ai/educational` | `createResourceEngine()` |
| **sam-engines/core/** | | |
| `sam-base-engine.ts` | `@sam-ai/core` | Core package |
| `sam-engine-integration.ts` | `lib/sam/taxomind-context.ts` | Use TaxomindContext |
| **sam-engines/social/** | | |
| `sam-collaboration-engine.ts` | `@sam-ai/educational` | `createCollaborationEngine()` |
| `sam-social-engine.ts` | `@sam-ai/educational` | `createSocialEngine()` |
| **standalone/** | | |
| `content-reordering-engine.ts` | `@sam-ai/educational` | `createAdaptiveContentEngine()` |
| `reordering-engine.ts` | `@sam-ai/educational` | `createAdaptiveContentEngine()` |
| `microlearning-engine.ts` | `@sam-ai/educational` | `createMicrolearningEngine()` |
| `knowledge-graph-engine.ts` | `@sam-ai/educational` | `createKnowledgeGraphEngine()` |
| `spaced-repetition-engine.ts` | `@sam-ai/memory` | `SpacedRepetitionScheduler` |
| `peer-review-engine.ts` | `@sam-ai/educational` | `createPeerLearningEngine()` |
| `proctor-engine.ts` | `@sam-ai/educational` | `createIntegrityEngine()` |
| `job-market-engine.ts` | `@sam-ai/educational` | `createMarketEngine()` |

## Migration Guide

### Before (Legacy)
```typescript
import { BloomsAnalysisEngine } from '@/lib/sam-engines/educational/sam-blooms-engine';
const engine = new BloomsAnalysisEngine();
```

### After (SAM Agentic)
```typescript
import { createBloomsAnalysisEngine } from '@sam-ai/educational';
const engine = createBloomsAnalysisEngine();
```

### With TaxomindContext (Recommended)
```typescript
import { getTaxomindContext } from '@/lib/sam/taxomind-context';
const { stores } = getTaxomindContext();
// Access stores for persistence
```

## DO NOT USE

These files will be removed in a future version. Do not import from this directory.
