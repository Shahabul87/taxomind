# Educational Engine Integration Analysis

**Generated:** 2026-01-17
**Scope:** Analysis of all 33 educational engines in `@sam-ai/educational` package
**Purpose:** Identify which engines are NOT properly integrated with frontend

---

## Executive Summary

| Category | Count |
|----------|-------|
| **Total Engines** | 33 |
| **Fully Integrated (API + Frontend)** | 23 |
| **API Only (No Frontend Usage)** | 5 |
| **NOT Integrated (No API Route)** | 5 |

---

## Engines NOT Connected to Frontend

### 1. AdaptiveContentEngine ❌

**Engine Location:** `packages/educational/src/engines/adaptive-content-engine.ts`

**Status:** NOT INTEGRATED

**Evidence:**
- Has frontend component `components/sam/AdaptiveContentWidget.tsx`
- Component uses `useSAMAdaptiveContent` hook from `@sam-ai/react`
- **NO API route imports `createAdaptiveContentEngine` from `@sam-ai/educational`**
- Hook makes mock/placeholder responses

**Grep Search Result:**
```
$ grep -r "createAdaptiveContentEngine" app/
No files found
```

**Impact:** The learning style detection and adaptive content features are NOT using the actual engine capabilities.

**Recommendation:** Create `/api/sam/adaptive-content/route.ts` using:
```typescript
import { createAdaptiveContentEngine } from '@sam-ai/educational';
```

---

### 2. SocialEngine ❌

**Engine Location:** `packages/educational/src/engines/social-engine.ts`

**Status:** NOT INTEGRATED

**Evidence:**
- Has frontend component `components/sam/SocialLearningFeed.tsx`
- API routes exist at `app/api/sam/agentic/social/feed/route.ts`
- **API does NOT use `createSocialEngine` - uses direct Prisma queries instead**
- Custom implementation exists at `lib/sam-engines/social/sam-social-engine.ts` but NOT used in API

**API Route Analysis (`app/api/sam/agentic/social/feed/route.ts:62-85`):**
```typescript
// Current implementation - Direct Prisma, NOT using engine
const [discussions, resources, achievements] = await Promise.all([
  db.groupDiscussion.findMany({...}),
  db.groupResource.findMany({...}),
  db.gamificationUserAchievement.findMany({...}),
]);
```

**Expected Implementation:**
```typescript
import { createSocialEngine } from '@sam-ai/educational';
const socialEngine = createSocialEngine(dbAdapter, aiAdapter);
const feed = await socialEngine.getSocialFeed(userId, options);
```

**Impact:** No AI-powered social learning recommendations, no learning buddy matching, no collaborative analytics.

---

### 3. KnowledgeGraphEngine ❌

**Engine Location:** `packages/educational/src/engines/knowledge-graph-engine.ts`

**Status:** NOT INTEGRATED

**Evidence:**
- Has frontend component `components/sam/KnowledgeGraphBrowser.tsx`
- API route exists at `app/api/sam/knowledge-graph/route.ts`
- **API uses custom implementation from `lib/sam/agentic-knowledge-graph.ts`**
- **Does NOT use `createKnowledgeGraphEngine` from `@sam-ai/educational`**

**API Route Analysis (`app/api/sam/knowledge-graph/route.ts:15-22`):**
```typescript
// Current implementation - Custom functions, NOT the engine
import {
  getKnowledgeGraphManager,
  getKGCourseGraph,
  getKGRelatedContent,
  getKGUserProfile,
  searchKGEntities,
} from '@/lib/sam/agentic-knowledge-graph';
```

**Local Stub Found (`lib/knowledge-graph/knowledge-graph-engine.ts`):**
```typescript
// This is just a stub, NOT the real engine
export class KnowledgeGraphEngine {
  async initialize(): Promise<void> {}
  async buildGraph(): Promise<void> {}
  async healthCheck(): Promise<{ status: string }> {
    return { status: 'healthy' };
  }
}
```

**Impact:** Missing advanced graph traversal, semantic search, and AI-powered concept relationships.

---

### 4. BloomsAnalysisEngine (Original) ❌

**Engine Location:** `packages/educational/src/engines/blooms-analysis-engine.ts`

**Status:** DEPRECATED/REPLACED

**Evidence:**
- Has been replaced by `UnifiedBloomsEngine` and `UnifiedBloomsAdapterEngine`
- No API routes import the original `createBloomsAnalysisEngine`
- All Bloom's functionality uses `createUnifiedBloomsEngine` instead

**Grep Search Result:**
```
$ grep -r "createBloomsAnalysisEngine" app/
No files found
```

**Note:** This is intentional - the unified engine is the correct approach.

---

### 5. SkillBuildTrackEngine ❌

**Engine Location:** `packages/educational/src/engines/skill-build-track-engine.ts`

**Status:** PARTIAL INTEGRATION

**Evidence:**
- API route exists at `app/api/sam/skill-build-track/route.ts`
- **Imports types but implementation uses direct Prisma queries**

**API Route Analysis:**
```typescript
// Imports types but NOT the engine factory
import {
  type SkillProgression,
  type SkillCategory,
  type SkillLevel,
} from '@sam-ai/educational';
// Uses direct Prisma queries instead of engine methods
```

---

## Engines with API Routes but Limited Frontend Usage

### 6. CollaborationEngine ⚠️

**Status:** API exists, frontend component exists, but LIMITED connection

**Files:**
- Engine: `packages/educational/src/engines/collaboration-engine.ts`
- API: `app/api/sam/collaboration-analytics/route.ts` ✅
- Component: `components/sam/CollaborationSpace.tsx`

**Issue:** Component makes limited API calls, doesn't utilize full engine capabilities.

---

### 7. IntegrityEngine ⚠️

**Status:** API exists, frontend exists, but NOT actively used

**Files:**
- Engine: `packages/educational/src/engines/integrity-engine.ts`
- API: `app/api/sam/integrity/route.ts` ✅
- Component: `components/sam/IntegrityChecker.tsx`

**Issue:** Component exists but is not rendered anywhere in the main app flow.

---

### 8. FinancialEngine ⚠️

**Status:** API exists, frontend exists, limited usage

**Files:**
- Engine: `packages/educational/src/engines/financial-engine.ts`
- API: `app/api/sam/financial-intelligence/route.ts` ✅
- Component: `components/sam/FinancialSimulator.tsx`

**Issue:** Component is available but not integrated into main dashboards.

---

### 9. InnovationEngine ⚠️

**Status:** API exists, frontend exists, limited visibility

**Files:**
- Engine: `packages/educational/src/engines/innovation-engine.ts`
- API: `app/api/sam/innovation-features/route.ts` ✅
- Component: `components/sam/InnovationLab.tsx`

**Issue:** Component exists but not prominently featured in navigation.

---

### 10. MarketEngine ⚠️

**Status:** API exists, no dedicated frontend component

**Files:**
- Engine: `packages/educational/src/engines/market-engine.ts`
- API: `app/api/sam/course-market-analysis/route.ts` ✅
- Frontend: NO dedicated component

**Issue:** Used internally for admin analytics, no user-facing component.

---

## Fully Integrated Engines ✅

The following engines have proper API routes AND frontend components actively using them:

| # | Engine | API Route | Frontend Component |
|---|--------|-----------|-------------------|
| 1 | ExamEngine | `/api/sam/exam-engine/route.ts` | Multiple exam components |
| 2 | EvaluationEngine | `/api/exams/evaluate/route.ts` | Exam evaluation UI |
| 3 | UnifiedBloomsEngine | `/api/sam/blooms-analysis/route.ts` | BloomsTaxonomySelector |
| 4 | PersonalizationEngine | `/api/sam/personalization/route.ts` | Multiple widgets |
| 5 | ContentGenerationEngine | `/api/sam/content-generation/route.ts` | AI generators |
| 6 | ResourceEngine | `/api/sam/resource-intelligence/route.ts` | ResourceIntelligenceContent |
| 7 | MultimediaEngine | `/api/sam/multimedia-analysis/route.ts` | MultimediaLibrary |
| 8 | PredictiveEngine | `/api/sam/predictive-learning/route.ts` | PredictiveInsights |
| 9 | AnalyticsEngine | `/api/sam/analytics/comprehensive/route.ts` | SAMAnalyticsDashboard |
| 10 | MemoryEngine | `/api/sam/conversations/summaries/route.ts` | ConversationHistory |
| 11 | ResearchEngine | `/api/sam/ai-research/route.ts` | ResearchAssistant |
| 12 | TrendsEngine | `/api/sam/ai-trends/route.ts` | TrendsExplorer |
| 13 | AchievementEngine | `/api/sam/gamification/*` | AchievementBadges, LeaderboardWidget |
| 14 | CourseGuideEngine | `/api/sam/course-guide/route.ts` | Course wizard components |
| 15 | PeerLearningEngine | `/api/sam/peer-learning/route.ts` | PeerLearningHub |
| 16 | SocraticTeachingEngine | `/api/sam/socratic/*` | SocraticDialogueWidget |
| 17 | MicrolearningEngine | `/api/sam/microlearning/route.ts` | MicrolearningWidget |
| 18 | MetacognitionEngine | `/api/sam/metacognition/route.ts` | MetacognitionPanel |
| 19 | CompetencyEngine | `/api/sam/competency/route.ts` | CompetencyDashboard |
| 20 | PracticeProblemsEngine | `/api/sam/practice-problems/*` | PracticeProblemsWidget |
| 21 | UnifiedBloomsAdapterEngine | `/api/sam/chat-enhanced/route.ts` | SAM Chat UI |
| 22 | EnhancedDepthAnalysisEngine | `/api/course-depth-analysis/route.ts` | Depth analyzer UI |
| 23 | MultimodalInputEngine | `/api/sam/multimodal/route.ts` | Chat with file upload |

---

## Priority Recommendations

### HIGH PRIORITY (Critical for user experience)

1. **AdaptiveContentEngine Integration**
   - Create proper API route using engine
   - Connect to learning style detection UI
   - Enable personalized content delivery

2. **SocialEngine Integration**
   - Refactor `/api/sam/agentic/social/feed/route.ts` to use engine
   - Add study buddy matching
   - Enable collaborative learning analytics

3. **KnowledgeGraphEngine Integration**
   - Refactor `/api/sam/knowledge-graph/route.ts` to use engine
   - Enable semantic search
   - Add AI-powered prerequisite recommendations

### MEDIUM PRIORITY (Enhanced features)

4. **SkillBuildTrackEngine Full Integration**
   - Use engine methods instead of direct Prisma queries
   - Enable AI-powered skill progression predictions

5. **IntegrityEngine Activation**
   - Add to content submission workflow
   - Enable AI plagiarism detection

### LOW PRIORITY (Admin/Advanced features)

6. **MarketEngine Frontend**
   - Create admin dashboard component
   - Display market analysis insights

---

## File References

### Engines NOT Integrated

| Engine | Package File | Should Create API |
|--------|--------------|-------------------|
| AdaptiveContentEngine | `packages/educational/src/engines/adaptive-content-engine.ts` | `/api/sam/adaptive-content/route.ts` |
| SocialEngine | `packages/educational/src/engines/social-engine.ts` | Refactor existing `/api/sam/agentic/social/` |
| KnowledgeGraphEngine | `packages/educational/src/engines/knowledge-graph-engine.ts` | Refactor `/api/sam/knowledge-graph/route.ts` |

### Existing Custom Implementations (Should be replaced)

| Custom File | Should Use |
|-------------|-----------|
| `lib/sam-engines/social/sam-social-engine.ts` | `createSocialEngine` from `@sam-ai/educational` |
| `lib/knowledge-graph/knowledge-graph-engine.ts` | `createKnowledgeGraphEngine` from `@sam-ai/educational` |
| `lib/sam/agentic-knowledge-graph.ts` | `createKnowledgeGraphEngine` from `@sam-ai/educational` |

---

## Conclusion

Out of 33 educational engines:
- **23 (70%)** are fully integrated with both API and frontend
- **5 (15%)** have API routes but limited frontend usage
- **5 (15%)** are NOT integrated and require immediate attention

The most critical gaps are **AdaptiveContentEngine**, **SocialEngine**, and **KnowledgeGraphEngine** which have frontend components expecting functionality that the backend is not providing through the actual engine implementations.
