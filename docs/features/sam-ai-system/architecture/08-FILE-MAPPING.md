# SAM AI Tutor - Complete File & Folder Mapping

**Last Updated**: 2025-01-12
**Total Files**: 150+ SAM-related files
**Purpose**: Comprehensive file location guide for npm package preparation

---

## 📋 Table of Contents

1. [Core Engine Files](#core-engine-files)
2. [API Route Files](#api-route-files)
3. [React Component Files](#react-component-files)
4. [Hook Files](#hook-files)
5. [Type Definition Files](#type-definition-files)
6. [Utility & Helper Files](#utility--helper-files)
7. [Test Files](#test-files)
8. [Package Structure](#package-structure)

---

## 🔧 Core Engine Files

**Location**: `lib/`

### Base & Integration Engines

| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| `sam-base-engine.ts` | Abstract base class for all engines | 217 | Initialization, caching, performance monitoring, error handling |
| `sam-engine-integration.ts` | Engine orchestration and coordination | - | Unified engine access, multi-engine workflows |
| `sam-master-integration.ts` | Master integration layer | - | Cross-engine communication, shared state |

### Educational Analysis Engines

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-blooms-engine.ts` | Bloom's Taxonomy cognitive analysis | 6-level classification, content analysis, learning pathways |
| `sam-personalization-engine.ts` | Individual learning personalization | Learning style detection, cognitive load optimization, emotional state recognition |
| `sam-analytics-engine.ts` | Learning analytics and metrics | Engagement tracking, performance analysis, trend detection |
| `sam-predictive-engine.ts` | Student outcome predictions | Completion likelihood, dropout risk, performance forecasting |

### Content Generation Engines

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-generation-engine.ts` | AI content generation | Course creation, chapter generation, resource creation |
| `sam-course-architect.ts` | Course structure design | Learning path design, prerequisite mapping, difficulty progression |
| `sam-exam-engine.ts` | Assessment generation | Question generation, adaptive difficulty, study guides |
| `sam-course-guide-engine.ts` | Course guidance system | Recommendations, insights, navigation assistance |

### Resource & Media Engines

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-resource-engine.ts` | Learning resource management | Resource curation, relevance scoring, distribution |
| `sam-multimedia-engine.ts` | Multimedia content processing | Video analysis, image processing, audio transcription |
| `sam-research-engine.ts` | Academic research integration | Paper recommendations, citation management, research trends |

### Social & Collaboration Engines

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-collaboration-engine.ts` | Collaborative learning | Study groups, peer matching, knowledge sharing |
| `sam-social-engine.ts` | Social learning features | Community engagement, discussion facilitation, social motivation |
| `sam-achievement-engine.ts` | Gamification & achievements | Points, badges, streaks, leaderboards |

### Business Intelligence Engines

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-financial-engine.ts` | Financial intelligence | Pricing optimization, revenue forecasting, student ROI |
| `sam-market-engine.ts` | Market analysis | Competitive intelligence, trend analysis, demand forecasting |
| `sam-enterprise-engine.ts` | Enterprise features | Multi-tenant support, advanced analytics, compliance |
| `sam-innovation-engine.ts` | Innovation tracking | Feature adoption, innovation metrics, trend spotting |

### News & Trends Engines

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-news-engine.ts` | AI news aggregation | News fetching, relevance filtering, summarization |
| `sam-news-fetcher.ts` | News data fetcher | API integration, data normalization |
| `sam-news-ranking-engine.ts` | News ranking algorithm | Relevance scoring, personalization, deduplication |
| `sam-real-news-fetcher.ts` | Real news source integration | Live news feeds, fact checking |
| `sam-trends-engine.ts` | Trend analysis | Pattern detection, trending topics, forecast |
| `sam-trends-engine-improved.ts` | Enhanced trend analysis | Advanced algorithms, ML integration |

### Support & Memory Systems

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-memory-engine.ts` | Conversation memory | Context retention, history management, recall |
| `sam-memory-system.ts` | Memory infrastructure | Storage, retrieval, expiration |
| `sam-context.ts` | Context management | Current state, session data, user preferences |
| `sam-enhanced-context.ts` | Enhanced context system | Multi-level context, smart caching |
| `sam-contextual-intelligence.ts` | Intelligent context processing | Context inference, relevance determination |

### Utility Engines

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-achievements.ts` | Achievement definitions | Badge types, point rules, milestone definitions |
| `sam-database.ts` | Database utilities | SAM-specific queries, data access patterns |
| `sam-rate-limiter.ts` | Rate limiting | API throttling, quota management |

---

## 🌐 API Route Files

**Location**: `app/api/sam/`

### AI Tutor Core APIs

| Endpoint | File | Method | Purpose |
|----------|------|--------|---------|
| `/sam/ai-tutor/chat` | `ai-tutor/chat/route.ts` | POST | Real-time chat with SAM |
| `/sam/ai-tutor/track` | `ai-tutor/track/route.ts` | POST | Track interactions |
| `/sam/ai-tutor/achievements` | `ai-tutor/achievements/route.ts` | GET/POST | Achievement management |
| `/sam/ai-tutor/content-analysis` | `ai-tutor/content-analysis/route.ts` | POST | Analyze content quality |
| `/sam/ai-tutor/adaptive-content` | `ai-tutor/adaptive-content/route.ts` | POST | Generate adaptive content |
| `/sam/ai-tutor/assessment-engine` | `ai-tutor/assessment-engine/route.ts` | POST | Generate assessments |

### Personalization APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/ai-tutor/detect-learning-style` | `ai-tutor/detect-learning-style/route.ts` | Detect student learning style |
| `/sam/ai-tutor/detect-emotion` | `ai-tutor/detect-emotion/route.ts` | Recognize emotional state |
| `/sam/ai-tutor/motivation-engine` | `ai-tutor/motivation-engine/route.ts` | Motivation analysis |
| `/sam/personalization` | `personalization/route.ts` | Apply personalization |
| `/sam/learning-profile` | `learning-profile/route.ts` | Learning profile management |

### Analytics & Insights APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/ai-tutor/student-insights` | `ai-tutor/student-insights/route.ts` | Student analytics |
| `/sam/ai-tutor/teacher-insights` | `ai-tutor/teacher-insights/route.ts` | Instructor analytics |
| `/sam/analytics/comprehensive` | `analytics/comprehensive/route.ts` | Comprehensive analytics |
| `/sam/stats` | `stats/route.ts` | Statistics dashboard |
| `/sam/predictive-learning` | `predictive-learning/route.ts` | Predictive analytics |

### Bloom's Taxonomy APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/blooms-analysis` | `blooms-analysis/route.ts` | Analyze cognitive levels |
| `/sam/blooms-analysis/student` | `blooms-analysis/student/route.ts` | Student-specific analysis |
| `/sam/blooms-recommendations` | `blooms-recommendations/route.ts` | Cognitive recommendations |
| `/sam/integrated-analysis` | `integrated-analysis/route.ts` | Integrated cognitive analysis |

### Content Generation APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/content-generation` | `content-generation/route.ts` | Generate educational content |
| `/sam/generate-course-structure-complete` | `generate-course-structure-complete/route.ts` | Complete course generation |
| `/sam/title-suggestions` | `title-suggestions/route.ts` | Suggest content titles |
| `/sam/overview-suggestions` | `overview-suggestions/route.ts` | Generate overviews |
| `/sam/suggestions` | `suggestions/route.ts` | General content suggestions |
| `/sam/learning-objectives` | `learning-objectives/route.ts` | Generate learning objectives |

### Exam & Assessment APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/exam-engine` | `exam-engine/route.ts` | Generate exams |
| `/sam/exam-engine/adaptive` | `exam-engine/adaptive/route.ts` | Adaptive assessments |
| `/sam/exam-engine/question-bank` | `exam-engine/question-bank/route.ts` | Question bank management |
| `/sam/exam-engine/study-guide` | `exam-engine/study-guide/route.ts` | Study guide generation |
| `/sam/ai-tutor/practice-problems` | `ai-tutor/practice-problems/route.ts` | Practice problem generation |

### Gamification APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/gamification/achievements` | `gamification/achievements/route.ts` | Achievement tracking |
| `/sam/gamification/challenges` | `gamification/challenges/route.ts` | Challenge management |
| `/sam/gamification/challenges/start` | `gamification/challenges/start/route.ts` | Start challenge |
| `/sam/gamification/stats` | `gamification/stats/route.ts` | Gamification statistics |
| `/sam/badges` | `badges/route.ts` | Badge management |
| `/sam/points` | `points/route.ts` | Points system |
| `/sam/streaks` | `streaks/route.ts` | Learning streaks |
| `/sam/ai-tutor/leaderboard` | `ai-tutor/leaderboard/route.ts` | Leaderboard rankings |
| `/sam/track-achievement` | `track-achievement/route.ts` | Achievement tracking |

### Course Assistance APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/course-assistant` | `course-assistant/route.ts` | Course-specific assistant |
| `/sam/course-assistant-enhanced` | `course-assistant-enhanced/route.ts` | Enhanced course assistant |
| `/sam/course-guide` | `course-guide/route.ts` | Course navigation guide |
| `/sam/course-guide/insights` | `course-guide/insights/route.ts` | Course insights |
| `/sam/course-guide/recommendations` | `course-guide/recommendations/route.ts` | Course recommendations |

### Chat & Conversation APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/chat` | `chat/route.ts` | Basic chat interface |
| `/sam/chat-enhanced` | `chat-enhanced/route.ts` | Enhanced chat with context |
| `/sam/conversation` | `conversation/route.ts` | Conversation management |
| `/sam/conversations/[id]` | `conversations/[conversationId]/route.ts` | Specific conversation |
| `/sam/conversations/[id]/messages` | `conversations/[conversationId]/messages/route.ts` | Conversation messages |
| `/sam/conversations/summaries` | `conversations/summaries/route.ts` | Conversation summaries |

### Assistant APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/intelligent-assistant` | `intelligent-assistant/route.ts` | Context-aware assistant |
| `/sam/context-aware-assistant` | `context-aware-assistant/route.ts` | Enhanced context assistant |
| `/sam/unified-assistant` | `unified-assistant/route.ts` | Unified SAM interface |
| `/sam/enhanced-universal-assistant` | `enhanced-universal-assistant/route.ts` | Universal assistant |

### Business Intelligence APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/financial-intelligence` | `financial-intelligence/route.ts` | Financial analytics |
| `/sam/course-market-analysis` | `course-market-analysis/route.ts` | Market analysis |
| `/sam/course-market-analysis/competitors` | `course-market-analysis/competitors/route.ts` | Competitor analysis |
| `/sam/enterprise-intelligence` | `enterprise-intelligence/route.ts` | Enterprise analytics |
| `/sam/innovation-features` | `innovation-features/route.ts` | Innovation tracking |

### Media & Research APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/multimedia-analysis` | `multimedia-analysis/route.ts` | Multimedia processing |
| `/sam/ai-tutor/visual-processor` | `ai-tutor/visual-processor/route.ts` | Visual content processing |
| `/sam/ai-research` | `ai-research/route.ts` | Research integration |
| `/sam/resource-intelligence` | `resource-intelligence/route.ts` | Resource curation |

### News & Trends APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/ai-news` | `ai-news/route.ts` | AI news aggregation |
| `/sam/ai-trends` | `ai-trends/route.ts` | Trend analysis |
| `/sam/ai-trends/route-secure` | `ai-trends/route-secure.ts` | Secure trend access |

### Collaboration APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/collaboration-analytics` | `collaboration-analytics/route.ts` | Collaboration metrics |
| `/sam/ai-tutor/socratic` | `ai-tutor/socratic/route.ts` | Socratic teaching method |

### Specialized Teaching APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/ai-tutor/lesson-planner` | `ai-tutor/lesson-planner/route.ts` | Lesson plan generation |
| `/sam/ai-tutor/create-rubric` | `ai-tutor/create-rubric/route.ts` | Rubric creation |
| `/sam/ai-tutor/content-companion` | `ai-tutor/content-companion/route.ts` | Content companion |
| `/sam/ai-tutor/challenges` | `ai-tutor/challenges/route.ts` | Learning challenges |

### Utility APIs

| Endpoint | File | Purpose |
|----------|------|---------|
| `/sam/validate` | `validate/route.ts` | Input validation |
| `/sam/interactions` | `interactions/route.ts` | Interaction recording |
| `/sam/form-synchronization` | `form-synchronization/route.ts` | Form state sync |

---

## ⚛️ React Component Files

### Global Providers & Context

**Location**: `app/(protected)/teacher/_components/`

| File | Purpose | Key Features |
|------|---------|--------------|
| `sam-ai-tutor-provider.tsx` | Main SAM context provider | Global state, initialization |
| `global-sam-provider.tsx` | Global provider wrapper | App-wide access |
| `comprehensive-sam-provider.tsx` | Comprehensive provider | All SAM features |

### Page-Level Components

**Location**: `app/(protected)/teacher/courses/[courseId]/_components/`

| File | Purpose | Integration Level |
|------|---------|------------------|
| `course-page-sam-integration.tsx` | Course page integration | Full course context |
| `intelligent-sam-integration.tsx` | Intelligent course integration | Context-aware |
| `sam-form-integration-example.tsx` | Form integration example | Form sync demo |
| `sam-integration-example.tsx` | General integration example | Basic integration |

### Chat & Assistant Components

**Location**: `app/(protected)/teacher/courses/[courseId]/_components/`

| File | Purpose | Features |
|------|---------|----------|
| `enterprise-sam-assistant.tsx` | Enterprise assistant | Advanced features |
| `enterprise-sam-assistant-v2.tsx` | Enhanced enterprise assistant | Latest version |
| `intelligent-sam-assistant.tsx` | Intelligent assistant | Context awareness |
| `improved-sam-assistant.tsx` | Improved assistant | Better UX |
| `form-aware-sam-assistant.tsx` | Form-aware assistant | Form integration |
| `sam-course-assistant.tsx` | Course assistant | Course-specific |
| `sam-floating-chatbot.tsx` | Floating chat widget | Always accessible |

**Location**: `app/(protected)/teacher/_components/`

| File | Purpose |
|------|---------|
| `sam-ai-tutor-assistant.tsx` | General AI tutor assistant |
| `context-aware-sam-assistant.tsx` | Context-aware assistant |
| `sam-enhanced-course-page-example.tsx` | Enhanced course page |

### Course Creation Components

**Location**: `app/(protected)/teacher/create/`

| File | Purpose |
|------|---------|
| `_components/sam-course-creator-modal.tsx` | Course creation modal |
| `ai-creator/components/sam-complete-generation-modal.tsx` | Complete generation modal |
| `ai-creator/components/sam-learning-design-assistance.tsx` | Learning design helper |
| `ai-creator/components/sam-wizard/sam-assistant-panel.tsx` | Wizard assistant panel |

### Chapter Integration Components

**Location**: `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/_components/`

| File | Purpose |
|------|---------|
| `chapter-sam-integration.tsx` | Chapter-level SAM integration |

### Shared SAM Components

**Location**: `components/sam/`

| File | Purpose |
|------|---------|
| `sam-global-assistant.tsx` | Global assistant component |
| `sam-global-provider.tsx` | Global provider |
| `sam-contextual-chat.tsx` | Context-aware chat |
| `sam-engine-powered-chat.tsx` | Engine-powered chat |
| `sam-course-integration.tsx` | Course integration |
| `sam-analytics-dashboard.tsx` | Analytics dashboard |
| `sam-analytics-tracker.tsx` | Analytics tracking |
| `sam-gamification-dashboard.tsx` | Gamification UI |
| `sam-conversation-history.tsx` | Conversation history |
| `sam-context-manager.tsx` | Context management |
| `sam-mobile-responsive.tsx` | Mobile responsive UI |
| `sam-quick-access.tsx` | Quick access menu |
| `sam-role-config.tsx` | Role-based configuration |
| `sam-standards-info.tsx` | Standards information |
| `sam-tiptap-integration.tsx` | Tiptap editor integration |

### Editor Components

**Location**: `components/tiptap/`

| File | Purpose |
|------|---------|
| `sam-enhanced-editor.tsx` | SAM-enhanced rich text editor |

### UI Components

**Location**: `components/ui/`

| File | Purpose |
|------|---------|
| `sam-error-boundary.tsx` | Error boundary for SAM |
| `sam-loading-state.tsx` | Loading states |

### Dashboard Components

**Location**: `app/dashboard/user/_components/smart-dashboard/`

| File | Purpose |
|------|---------|
| `SAMInnovationFeatures.tsx` | Innovation features dashboard |

---

## 🎣 Hook Files

**Location**: `hooks/`

| File | Purpose | Key Features |
|------|---------|--------------|
| `use-sam-context.ts` | SAM context hook | Access SAM state, methods |
| `use-sam-cache.ts` | Caching hook | Client-side caching |
| `use-sam-debounce.ts` | Debounce hook | Rate limiting, optimization |

**Location**: `app/(protected)/teacher/_components/`

| File | Purpose |
|------|---------|
| `use-page-sam-context.tsx` | Page-level SAM context |
| `use-sam-page-context.tsx` | SAM page context hook |

**Location**: `app/(protected)/teacher/create/ai-creator/hooks/`

| File | Purpose |
|------|---------|
| `use-sam-complete-generation.ts` | Complete content generation |
| `use-sam-wizard.ts` | SAM wizard functionality |

---

## 📝 Type Definition Files

**Location**: `lib/types/`

| File | Purpose | Key Types |
|------|---------|-----------|
| `sam-engine-types.ts` | Core engine types | Engine interfaces, response types |

**Location**: `app/(protected)/teacher/create/ai-creator/types/`

| File | Purpose |
|------|---------|
| `sam-creator.types.ts` | SAM creator types |

---

## 🛠️ Utility & Helper Files

**Location**: `lib/validators/`

| File | Purpose |
|------|---------|
| `sam-validators.ts` | Input validation schemas |

**Location**: `lib/auth/`

| File | Purpose |
|------|---------|
| `saml-provider.ts` | SAML authentication (not SAM AI Tutor) |

---

## 🧪 Test Files

**Location**: `__tests__/unit/lib/`

| File | Tests |
|------|-------|
| `sam-blooms-engine.test.ts` | Bloom's engine tests |

**Location**: `__tests__/unit/lib/auth/`

| File | Tests |
|------|-------|
| `saml-provider.test.ts` | SAML auth tests |

---

## 📦 Package Structure (Proposed for npm)

### Recommended Package Organization

```
@taxomind/sam-ai-tutor/
├── core/
│   ├── sam-base-engine.ts
│   ├── sam-engine-integration.ts
│   └── sam-master-integration.ts
│
├── engines/
│   ├── educational/
│   │   ├── blooms/
│   │   │   └── sam-blooms-engine.ts
│   │   ├── personalization/
│   │   │   └── sam-personalization-engine.ts
│   │   ├── analytics/
│   │   │   └── sam-analytics-engine.ts
│   │   └── predictive/
│   │       └── sam-predictive-engine.ts
│   │
│   ├── content/
│   │   ├── generation/
│   │   │   └── sam-generation-engine.ts
│   │   ├── architect/
│   │   │   └── sam-course-architect.ts
│   │   └── exam/
│   │       └── sam-exam-engine.ts
│   │
│   ├── resources/
│   │   ├── resource/
│   │   │   └── sam-resource-engine.ts
│   │   ├── multimedia/
│   │   │   └── sam-multimedia-engine.ts
│   │   └── research/
│   │       └── sam-research-engine.ts
│   │
│   ├── social/
│   │   ├── collaboration/
│   │   │   └── sam-collaboration-engine.ts
│   │   ├── social/
│   │   │   └── sam-social-engine.ts
│   │   └── achievement/
│   │       └── sam-achievement-engine.ts
│   │
│   ├── business/
│   │   ├── financial/
│   │   │   └── sam-financial-engine.ts
│   │   ├── market/
│   │   │   └── sam-market-engine.ts
│   │   └── enterprise/
│   │       └── sam-enterprise-engine.ts
│   │
│   └── news/
│       ├── sam-news-engine.ts
│       ├── sam-news-fetcher.ts
│       └── sam-trends-engine.ts
│
├── react/
│   ├── providers/
│   │   ├── sam-ai-tutor-provider.tsx
│   │   └── global-sam-provider.tsx
│   ├── assistants/
│   │   ├── enterprise-sam-assistant.tsx
│   │   └── intelligent-sam-assistant.tsx
│   ├── components/
│   │   ├── sam-contextual-chat.tsx
│   │   ├── sam-analytics-dashboard.tsx
│   │   └── sam-gamification-dashboard.tsx
│   └── hooks/
│       ├── use-sam-context.ts
│       ├── use-sam-cache.ts
│       └── use-sam-debounce.ts
│
├── types/
│   ├── index.ts
│   ├── engines.ts
│   ├── analytics.ts
│   ├── personalization.ts
│   └── gamification.ts
│
├── utils/
│   ├── sam-database.ts
│   ├── sam-rate-limiter.ts
│   └── sam-validators.ts
│
└── api/
    ├── routes.ts (route definitions)
    └── handlers/ (API implementation)
```

### Package Entry Points

```json
{
  "name": "@taxomind/sam-ai-tutor",
  "version": "1.0.0",
  "exports": {
    ".": "./dist/index.js",
    "./core": "./dist/core/index.js",
    "./engines/*": "./dist/engines/*/index.js",
    "./react": "./dist/react/index.js",
    "./react/*": "./dist/react/*/index.js",
    "./types": "./dist/types/index.js",
    "./utils": "./dist/utils/index.js"
  },
  "typesVersions": {
    "*": {
      "*": ["./dist/*"]
    }
  }
}
```

---

## 📊 File Statistics

### By Category

| Category | File Count | Purpose |
|----------|------------|---------|
| **Core Engines** | 35+ | Business logic, AI integration |
| **API Routes** | 80+ | RESTful endpoints |
| **React Components** | 30+ | UI components |
| **Hooks** | 5+ | React hooks |
| **Types** | 2+ | TypeScript definitions |
| **Utils** | 3+ | Helper functions |
| **Tests** | 2+ | Unit tests |
| **Total** | **150+** | Complete SAM system |

### By Technology

| Technology | File Count | Usage |
|------------|------------|-------|
| **TypeScript** | 140+ | Core logic, types |
| **TSX (React)** | 35+ | UI components |
| **Test Files** | 2+ | Quality assurance |

### File Size Distribution

| Size Range | Count | Examples |
|------------|-------|----------|
| **Small** (< 200 lines) | 50+ | Utility files, simple components |
| **Medium** (200-500 lines) | 60+ | API routes, components |
| **Large** (500-1000 lines) | 30+ | Complex engines, providers |
| **Very Large** (> 1000 lines) | 10+ | Bloom's engine, personalization engine |

---

## 🔍 Quick File Lookup

### Find Engine Files
```bash
find lib -name "sam-*-engine.ts" | sort
```

### Find API Routes
```bash
find app/api/sam -name "route.ts" | sort
```

### Find React Components
```bash
find . -name "*sam*.tsx" | grep -v node_modules | grep -v ".next" | sort
```

### Find Hook Files
```bash
find hooks -name "use-sam*.ts" | sort
```

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [02-CORE-ENGINES.md](./02-CORE-ENGINES.md) - Core engine abstractions
- [04-API-ROUTES.md](./04-API-ROUTES.md) - API endpoint documentation
- [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md) - Package preparation guide

---

**Maintained by**: Taxomind Development Team
**Status**: ✅ Complete File Mapping
**Last Indexed**: 2025-01-12
