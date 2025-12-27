# @sam-ai/core - Phase 2 Documentation

## Overview

Phase 2 migrates existing SAM AI engines from the taxomind codebase to the unified `@sam-ai/core` package architecture. This phase creates three new engines: ContentEngine, AssessmentEngine, and PersonalizationEngine.

## What Was Completed

### 1. Engine Migration Summary

| Original Engine | New Engine | Status |
|----------------|------------|--------|
| CourseGuideEngine | ContentEngine | Migrated |
| AdvancedExamEngine | AssessmentEngine | Migrated |
| SAMPersonalizationEngine | PersonalizationEngine | Migrated |
| BloomsAnalysisEngine | UnifiedBloomsEngine (@sam-ai/educational) | Completed in Phase 1 |
| N/A | ContextEngine | Completed in Phase 1 |
| N/A | ResponseEngine | Completed in Phase 1 |

### 2. New Engines

#### ContentEngine (`engines/content.ts`)

Generates and analyzes educational content, guides, and materials.

```typescript
interface ContentEngineOutput {
  metrics: ContentMetrics;
  suggestions: ContentSuggestion[];
  generatedContent?: GeneratedContent[];
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  overallScore: number;
}

interface ContentMetrics {
  depth: {
    contentRichness: number;      // 0-100
    topicCoverage: number;
    assessmentQuality: number;
    learningPathClarity: number;
  };
  engagement: {
    estimatedCompletionRate: number;
    interactionDensity: number;
    varietyScore: number;
  };
  quality: {
    structureScore: number;
    coherenceScore: number;
    accessibilityScore: number;
  };
}

interface ContentSuggestion {
  type: 'improvement' | 'addition' | 'restructure' | 'enhancement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  targetSection?: string;
  estimatedImpact: number;
}

interface GeneratedContent {
  type: ContentType;
  title: string;
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    bloomsLevel: BloomsLevel;
    targetAudience: string;
  };
}
```

**Features:**
- Content quality analysis with depth, engagement, and quality metrics
- AI-powered content generation for various content types
- Bloom's Taxonomy integration for cognitive level targeting
- Actionable improvement suggestions
- SWOT-style insights (strengths, weaknesses, opportunities)

**Usage:**
```typescript
import { createContentEngine } from '@sam-ai/core';

const contentEngine = createContentEngine(config);

// Analyze content
const result = await contentEngine.execute({
  context: samContext,
  query: 'Analyze this course for content quality',
});

// Generate content
const generated = await contentEngine.execute({
  context: samContext,
  query: 'Generate a lesson on calculus',
});
```

---

#### AssessmentEngine (`engines/assessment.ts`)

Generates adaptive assessments aligned with Bloom's Taxonomy.

```typescript
interface AssessmentEngineOutput {
  questions: GeneratedQuestion[];
  analysis: AssessmentAnalysis;
  studyGuide?: StudyGuide;
  metadata: {
    generationTime: number;
    totalQuestions: number;
    bloomsDistribution: Record<BloomsLevel, number>;
    difficultyDistribution: Record<string, number>;
  };
}

interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  bloomsLevel: BloomsLevel;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  hints?: string[];
  tags: string[];
}

interface AssessmentConfig {
  questionCount: number;
  bloomsDistribution?: Partial<Record<BloomsLevel, number>>;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypes?: QuestionType[];
  topic?: string;
  timeLimit?: number;
  includeStudyGuide?: boolean;
}

interface AssessmentAnalysis {
  bloomsCoverage: {
    distribution: Record<BloomsLevel, number>;
    gaps: BloomsLevel[];
    recommendations: string[];
  };
  difficultyAnalysis: {
    distribution: { easy: number; medium: number; hard: number };
    isBalanced: boolean;
  };
}

interface StudyGuide {
  focusAreas: Array<{
    topic: string;
    importance: 'critical' | 'important' | 'helpful';
    description: string;
    resources: string[];
  }>;
  practiceQuestions: GeneratedQuestion[];
  keyConceptsSummary: string[];
  studyTips: string[];
}
```

**Features:**
- AI-powered question generation
- Support for multiple question types (MCQ, true/false, short answer, essay, matching, fill-blank)
- Bloom's Taxonomy alignment with configurable distribution
- Difficulty distribution targeting
- Automatic study guide generation
- Comprehensive assessment analysis

**Usage:**
```typescript
import { createAssessmentEngine } from '@sam-ai/core';

const assessmentEngine = createAssessmentEngine(config);

const result = await assessmentEngine.execute({
  context: samContext,
  query: 'Generate 10 questions on machine learning',
  config: {
    questionCount: 10,
    bloomsDistribution: {
      REMEMBER: 20,
      UNDERSTAND: 30,
      APPLY: 25,
      ANALYZE: 15,
      EVALUATE: 10,
    },
    includeStudyGuide: true,
  },
});
```

---

#### PersonalizationEngine (`engines/personalization.ts`)

Adapts learning experiences based on user profiles and behavioral analysis.

```typescript
interface PersonalizationEngineOutput {
  learningStyle: LearningStyleProfile;
  emotionalProfile: EmotionalProfile;
  cognitiveLoad: CognitiveLoadProfile;
  motivationProfile: MotivationProfile;
  contentAdaptations: ContentAdaptation[];
  suggestedPath: PersonalizedLearningPath;
  overallProfile: {
    readiness: number;          // 0-100
    engagementLevel: number;
    recommendedApproach: string;
    nextBestActions: string[];
  };
}

interface LearningStyleProfile {
  primary: SAMLearningStyle | 'mixed';
  secondary: SAMLearningStyle | null;
  confidence: number;
  indicators: Array<{
    style: SAMLearningStyle;
    score: number;
    evidence: string[];
  }>;
  recommendations: string[];
}

interface EmotionalProfile {
  currentState: EmotionalState;
  confidence: number;
  trajectory: 'improving' | 'declining' | 'stable';
  triggers: string[];
  recommendedTone: SAMTone;
  interventions: string[];
}

interface CognitiveLoadProfile {
  currentLoad: CognitiveLoad;
  capacity: number;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }>;
  recommendations: string[];
}

interface MotivationProfile {
  level: 'high' | 'medium' | 'low';
  drivers: string[];
  barriers: string[];
  strategies: string[];
}

interface PersonalizedLearningPath {
  nodes: LearningPathNode[];
  estimatedDuration: number;
  adaptedFor: string;
  alternativePaths: Array<{
    name: string;
    description: string;
    duration: number;
  }>;
}
```

**Features:**
- Learning style detection and analysis (visual, auditory, kinesthetic, reading)
- Emotional state recognition with intervention suggestions
- Cognitive load assessment and management
- Motivation analysis with engagement strategies
- Adaptive content recommendations
- Personalized learning path generation
- Real-time profile adaptation

**Usage:**
```typescript
import { createPersonalizationEngine } from '@sam-ai/core';

const personalizationEngine = createPersonalizationEngine(config);

const result = await personalizationEngine.execute({
  context: samContext,
});

console.log('Learning Style:', result.data?.learningStyle.primary);
console.log('Current Emotional State:', result.data?.emotionalProfile.currentState);
console.log('Cognitive Load:', result.data?.cognitiveLoad.currentLoad);
console.log('Recommended Actions:', result.data?.overallProfile.nextBestActions);
```

---

### 3. Updated Exports

The main `@sam-ai/core` package now exports all Phase 2 engines:

```typescript
// New engine exports
export {
  ContentEngine,
  createContentEngine,
  AssessmentEngine,
  createAssessmentEngine,
  PersonalizationEngine,
  createPersonalizationEngine,
} from './engines';

// New type exports
export type {
  // Content engine types
  ContentEngineOutput,
  ContentMetrics,
  ContentSuggestion,
  GeneratedContent,
  // Assessment engine types
  AssessmentEngineOutput,
  AssessmentConfig,
  AssessmentAnalysis,
  GeneratedQuestion,
  StudyGuide,
  // Personalization engine types
  PersonalizationEngineOutput,
  LearningStyleProfile,
  EmotionalProfile,
  EmotionalState,
  CognitiveLoadProfile,
  CognitiveLoad,
  MotivationProfile,
  ContentAdaptation,
  PersonalizedLearningPath,
  LearningPathNode,
} from './engines';
```

---

## Architecture

### Engine Dependency Graph

```
Tier 1 (no dependencies):
├── ContextEngine

Tier 2 (depends on context):
├── ContentEngine
└── PersonalizationEngine

Tier 3 (depends on context + optional Bloom analysis input):
├── AssessmentEngine

Tier 4 (aggregates all):
└── ResponseEngine

Note: Bloom's analysis is now handled by UnifiedBloomsEngine from `@sam-ai/educational`.
It runs alongside the core orchestrator instead of being registered as a core engine.
```

### Engine Base Pattern

All engines follow the `BaseEngine` abstract class pattern:

```typescript
class ContentEngine extends BaseEngine<ContentEngineOutput> {
  constructor(config: SAMConfig) {
    super({
      config,
      name: 'content',
      version: '1.0.0',
      dependencies: ['context'],  // Runs after context engine
      timeout: 45000,
      retries: 2,
      cacheEnabled: true,
      cacheTTL: 30 * 60 * 1000,   // 30 minutes
    });
  }

  protected async process(input: EngineInput): Promise<ContentEngineOutput> {
    // Engine-specific logic
  }

  protected getCacheKey(input: EngineInput): string {
    // Cache key generation
  }
}
```

### Key Design Decisions

1. **Dependency Injection**: All engines receive configuration through constructor
2. **Lazy Initialization**: Engines initialize on first execution
3. **Caching**: Built-in caching with configurable TTL
4. **Error Handling**: Standardized error wrapping and recovery
5. **AI Integration**: Unified `callAI()` method for AI operations
6. **Type Safety**: Full TypeScript support with strict types

---

## Migration from Legacy Engines

### CourseGuideEngine to ContentEngine

| Legacy Feature | New Implementation |
|----------------|-------------------|
| `analyzeContent()` | `ContentEngine.process()` with analysis mode |
| `generateGuide()` | `ContentEngine.process()` with generation mode |
| `getRecommendations()` | Part of `ContentEngineOutput.suggestions` |
| Manual AI calls | Built-in `callAI()` method |

### AdvancedExamEngine to AssessmentEngine

| Legacy Feature | New Implementation |
|----------------|-------------------|
| `generateQuestions()` | `AssessmentEngine.process()` |
| `analyzeAssessment()` | Part of `AssessmentEngineOutput.analysis` |
| Bloom's targeting | `AssessmentConfig.bloomsDistribution` |
| Study guide generation | `AssessmentConfig.includeStudyGuide` |

### SAMPersonalizationEngine to PersonalizationEngine

| Legacy Feature | New Implementation |
|----------------|-------------------|
| `detectLearningStyle()` | `PersonalizationEngineOutput.learningStyle` |
| `analyzeEmotions()` | `PersonalizationEngineOutput.emotionalProfile` |
| `assessCognitiveLoad()` | `PersonalizationEngineOutput.cognitiveLoad` |
| `generatePath()` | `PersonalizationEngineOutput.suggestedPath` |

---

## Complete Engine Registration Example

```typescript
import {
  createOrchestrator,
  createContextEngine,
  createContentEngine,
  createAssessmentEngine,
  createPersonalizationEngine,
  createResponseEngine,
  createAnthropicAdapter,
  createMemoryCache,
  createSAMConfig,
  createDefaultContext,
} from '@sam-ai/core';
import { createUnifiedBloomsEngine } from '@sam-ai/educational';

// Create configuration
const config = createSAMConfig({
  ai: createAnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-haiku-20240307',
  }),
  cache: createMemoryCache(),
  logger: console,
});

// Create orchestrator and register all engines
const orchestrator = createOrchestrator(config);
const bloomsEngine = createUnifiedBloomsEngine({
  samConfig: config,
  defaultMode: 'standard',
  confidenceThreshold: 0.7,
  enableCache: true,
});

// Phase 1 engines
orchestrator.registerEngine(createContextEngine(config));
orchestrator.registerEngine(createResponseEngine(config));

// Phase 2 engines
orchestrator.registerEngine(createContentEngine(config));
orchestrator.registerEngine(createAssessmentEngine(config));
orchestrator.registerEngine(createPersonalizationEngine(config));

// Execute orchestration
const context = createDefaultContext({
  user: { id: 'user-123', role: 'student', name: 'Alice' },
  page: { type: 'course-detail', path: '/courses/math-101', entityId: 'math-101' },
});

const result = await orchestrator.orchestrate(
  context,
  'Help me understand calculus derivatives',
  { parallel: true }
);

const blooms = await bloomsEngine.analyze('Help me understand calculus derivatives');

console.log('Response:', result.response.message);
console.log('Blooms Level:', blooms.dominantLevel);
console.log('Learning Style:', result.results.personalization?.data?.learningStyle.primary);
```

---

## Testing

```bash
cd packages/core

# Type check
npx tsc --noEmit

# Build
npm run build

# Run tests (coming in Phase 3)
npm test
```

---

## Next Steps (Phase 3-4)

### Phase 3: @sam-ai/react
- React hooks (useSAM, useSAMEngine, useSAMPersonalization)
- Context providers for state management
- React-specific optimizations
- SSR support

### Phase 4: @sam-ai/api
- Next.js API route handlers
- Streaming support
- Rate limiting middleware
- WebSocket support for real-time updates

### Phase 5: @sam-ai/ui
- Floating SAM component
- Contextual panel
- Pre-built UI components
- Theme customization

---

## Version

- Package: @sam-ai/core
- Version: 0.2.0
- TypeScript: ES2022
- Module: ESNext

---

**Status**: Phase 2 Complete
**Date**: January 2025
