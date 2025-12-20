# Initiative 3: Pedagogical Evaluators

**Timeline**: Weeks 30-31 (2 weeks)
**Priority**: 🟡 High
**Budget**: $32,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Current SAM may provide correct answers but doesn't consistently follow evidence-based teaching methodologies:
- No Bloom's Taxonomy alignment
- Lacks proper scaffolding (simple → complex progression)
- Poor example-to-explanation ratio
- Doesn't use Socratic methods effectively
- Ignores Zone of Proximal Development (ZPD)

**The Solution**: Implement pedagogical evaluation agents that ensure SAM follows research-backed teaching methodologies, including Bloom's Taxonomy, scaffolding techniques, and ZPD targeting.

**Impact**:
- **Teaching Quality Score**: >85% (expert-level pedagogy)
- **Learning Retention**: +40% improvement
- **Student Engagement**: +50% increase
- **Pedagogical Alignment**: >90% adherence to best practices

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Pedagogical evaluation latency <800ms
- ✅ Bloom's alignment detection accuracy >85%
- ✅ Scaffolding detection accuracy >80%
- ✅ ZPD targeting accuracy >85%

### Quality Metrics
- ✅ Teaching quality score >85/100
- ✅ Bloom's Taxonomy adherence >90%
- ✅ Scaffolding present in 80%+ of explanations
- ✅ Example-explanation balance >75%

### User Experience Metrics
- ✅ "Well taught" rating >90%
- ✅ Learning retention increase by 40%
- ✅ Student engagement increase by 50%
- ✅ "Understood on first try" rating >75%

### Business Metrics
- ✅ Course completion rate increase by 40%
- ✅ Teacher approval of AI teaching >85%
- ✅ Student success rate increase by 30%

---

## 🏗️ Architecture Design

### Pedagogical Evaluation System

```
┌─────────────────────────────────────────────────────────────┐
│           Pedagogical Evaluation Pipeline                    │
└─────────────────────────────────────────────────────────────┘

Response (post-quality gates) → Pedagogical Evaluators
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
            ▼                            ▼                            ▼
    ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
    │   Bloom's    │           │  Scaffolding │           │     ZPD      │
    │  Taxonomy    │           │  Evaluator   │           │  Targeting   │
    │  Aligner     │           │              │           │  Evaluator   │
    └──────────────┘           └──────────────┘           └──────────────┘
            │                            │                            │
            │                            ▼                            │
            │                   ┌──────────────┐                     │
            │                   │   Socratic   │                     │
            │                   │   Method     │                     │
            │                   │  Evaluator   │                     │
            │                   └──────────────┘                     │
            │                            │                            │
            └────────────────────────────┼────────────────────────────┘
                                         │
                                         ▼
                            ┌──────────────────────────┐
                            │  Aggregate Pedagogical   │
                            │  Score & Recommendations │
                            └──────────────────────────┘
                                         │
                                         ▼
                            Teaching Quality Score >85%?
                                    │         │
                                   YES       NO
                                    │         │
                                    │         └─→ Enhance pedagogy
                                    │
                                    ▼
                            Deliver Response
```

### Pedagogical Frameworks

**Bloom's Taxonomy (6 Levels)**:
```
REMEMBER    → Recall facts and basic concepts
UNDERSTAND  → Explain ideas or concepts
APPLY       → Use information in new situations
ANALYZE     → Draw connections among ideas
EVALUATE    → Justify a decision or stance
CREATE      → Produce new or original work
```

**Scaffolding Principles**:
```
1. Start with student's current knowledge
2. Break complex tasks into manageable steps
3. Provide temporary support (remove as mastery increases)
4. Gradually increase difficulty
5. Connect new concepts to prior knowledge
```

**Zone of Proximal Development (ZPD)**:
```
Too Easy    → Below ZPD (bored, disengaged)
Just Right  → Within ZPD (challenged, learning)
Too Hard    → Above ZPD (frustrated, overwhelmed)
```

---

## 🔧 Implementation Plan

### Week 30: Core Pedagogical Evaluators

#### Day 1-2: Bloom's Taxonomy Aligner

**File: `lib/sam/pedagogy/blooms-aligner.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

enum BloomLevel {
  REMEMBER = 'REMEMBER',
  UNDERSTAND = 'UNDERSTAND',
  APPLY = 'APPLY',
  ANALYZE = 'ANALYZE',
  EVALUATE = 'EVALUATE',
  CREATE = 'CREATE',
}

interface BloomsAlignment {
  passed: boolean;
  score: number;                    // 0-100
  targetLevel: BloomLevel;
  actualLevel: BloomLevel;
  aligned: boolean;
  recommendations: string[];
}

export class BloomsAligner {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Evaluate Bloom's Taxonomy alignment
   */
  async evaluate(
    query: string,
    response: string,
    targetLevel?: BloomLevel
  ): Promise<BloomsAlignment> {
    // Infer target level from query if not provided
    const inferredTarget = targetLevel || await this.inferTargetLevel(query);

    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate this educational response using Bloom's Taxonomy.

BLOOM'S TAXONOMY LEVELS:
1. REMEMBER: Recall facts (define, list, name)
2. UNDERSTAND: Explain concepts (describe, explain, summarize)
3. APPLY: Use in new situations (calculate, solve, demonstrate)
4. ANALYZE: Draw connections (compare, contrast, examine)
5. EVALUATE: Justify decisions (assess, judge, critique)
6. CREATE: Produce original work (design, construct, develop)

TARGET LEVEL: ${inferredTarget}
QUERY: ${query}
RESPONSE: ${response}

Analyze:
1. What Bloom's level does the RESPONSE target?
2. Does it match the expected level for the QUERY?
3. Are the cognitive verbs appropriate?
4. Does it scaffold properly to reach the target level?

Return JSON:
{
  "actualLevel": "REMEMBER/UNDERSTAND/APPLY/ANALYZE/EVALUATE/CREATE",
  "score": 0-100,
  "aligned": true/false,
  "reasoning": "why it matches or doesn't",
  "recommendations": ["how to better align with ${inferredTarget}"]
}

Score guide:
90-100: Perfect alignment with target level
75-89: Good alignment, minor improvements
60-74: Partial alignment
<60: Poor alignment

Return ONLY the JSON.`,
        },
      ],
    });

    const text = evaluation.content[0].type === 'text' ? evaluation.content[0].text : '{}';

    try {
      const result = JSON.parse(text);

      return {
        passed: result.score >= 75,
        score: result.score || 0,
        targetLevel: inferredTarget,
        actualLevel: result.actualLevel || inferredTarget,
        aligned: result.aligned || false,
        recommendations: result.recommendations || [],
      };
    } catch {
      return {
        passed: false,
        score: 0,
        targetLevel: inferredTarget,
        actualLevel: BloomLevel.REMEMBER,
        aligned: false,
        recommendations: ['Failed to evaluate Bloom\'s alignment'],
      };
    }
  }

  /**
   * Infer target Bloom's level from query
   */
  private async inferTargetLevel(query: string): Promise<BloomLevel> {
    const lowerQuery = query.toLowerCase();

    // Keyword-based inference
    if (lowerQuery.match(/what is|define|list|name|identify/)) {
      return BloomLevel.REMEMBER;
    }

    if (lowerQuery.match(/explain|describe|summarize|why|how does/)) {
      return BloomLevel.UNDERSTAND;
    }

    if (lowerQuery.match(/solve|calculate|demonstrate|apply|use/)) {
      return BloomLevel.APPLY;
    }

    if (lowerQuery.match(/analyze|compare|contrast|examine|differentiate/)) {
      return BloomLevel.ANALYZE;
    }

    if (lowerQuery.match(/evaluate|assess|judge|critique|argue/)) {
      return BloomLevel.EVALUATE;
    }

    if (lowerQuery.match(/create|design|construct|develop|propose/)) {
      return BloomLevel.CREATE;
    }

    // Default to UNDERSTAND for most questions
    return BloomLevel.UNDERSTAND;
  }

  /**
   * Generate enhancement prompt for Bloom's alignment
   */
  generateEnhancementPrompt(
    query: string,
    response: string,
    alignment: BloomsAlignment
  ): string {
    return `Enhance this response to better align with Bloom's Taxonomy level: ${alignment.targetLevel}

TARGET LEVEL: ${alignment.targetLevel}
CURRENT LEVEL: ${alignment.actualLevel}

QUERY: ${query}
CURRENT RESPONSE: ${response}

RECOMMENDATIONS:
${alignment.recommendations.map(r => `- ${r}`).join('\n')}

Generate an enhanced response that:
1. Targets the correct Bloom's level
2. Uses appropriate cognitive verbs
3. Scaffolds properly to reach the target level
4. Maintains accuracy and clarity`;
  }
}
```

#### Day 3: Scaffolding Evaluator

**File: `lib/sam/pedagogy/scaffolding-evaluator.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ScaffoldingResult {
  passed: boolean;
  score: number;
  hasScaffolding: boolean;
  progression: 'PROPER' | 'PARTIAL' | 'NONE';
  elements: {
    startsWithKnown: boolean;
    breaksDownConcepts: boolean;
    gradualDifficulty: boolean;
    connectsToPrior: boolean;
  };
  recommendations: string[];
}

export class ScaffoldingEvaluator {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Evaluate scaffolding quality
   */
  async evaluate(
    response: string,
    studentLevel: string = 'INTERMEDIATE'
  ): Promise<ScaffoldingResult> {
    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate the scaffolding in this educational response.

STUDENT LEVEL: ${studentLevel}
RESPONSE: ${response}

SCAFFOLDING PRINCIPLES:
1. **Starts with Known**: Begins with student's current knowledge
2. **Breaks Down**: Complex concepts broken into steps
3. **Gradual Difficulty**: Increases complexity gradually
4. **Connects to Prior**: Links new concepts to prior knowledge

Evaluate each principle (true/false) and overall quality:

Return JSON:
{
  "score": 0-100,
  "progression": "PROPER/PARTIAL/NONE",
  "startsWithKnown": true/false,
  "breaksDownConcepts": true/false,
  "gradualDifficulty": true/false,
  "connectsToPrior": true/false,
  "recommendations": ["how to improve scaffolding"]
}

Score guide:
90-100: Excellent scaffolding
75-89: Good scaffolding
60-74: Partial scaffolding
<60: Poor or no scaffolding

Return ONLY the JSON.`,
        },
      ],
    });

    const text = evaluation.content[0].type === 'text' ? evaluation.content[0].text : '{}';

    try {
      const result = JSON.parse(text);

      const hasScaffolding = result.score >= 60;

      return {
        passed: result.score >= 75,
        score: result.score || 0,
        hasScaffolding,
        progression: result.progression || 'NONE',
        elements: {
          startsWithKnown: result.startsWithKnown || false,
          breaksDownConcepts: result.breaksDownConcepts || false,
          gradualDifficulty: result.gradualDifficulty || false,
          connectsToPrior: result.connectsToPrior || false,
        },
        recommendations: result.recommendations || [],
      };
    } catch {
      return {
        passed: false,
        score: 0,
        hasScaffolding: false,
        progression: 'NONE',
        elements: {
          startsWithKnown: false,
          breaksDownConcepts: false,
          gradualDifficulty: false,
          connectsToPrior: false,
        },
        recommendations: ['Failed to evaluate scaffolding'],
      };
    }
  }
}
```

#### Day 4-5: ZPD Targeting & Socratic Method Evaluators

**File: `lib/sam/pedagogy/zpd-evaluator.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ZPDResult {
  passed: boolean;
  score: number;
  zone: 'TOO_EASY' | 'JUST_RIGHT' | 'TOO_HARD';
  appropriateness: number;  // 0-100
  recommendations: string[];
}

export class ZPDEvaluator {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Evaluate Zone of Proximal Development targeting
   */
  async evaluate(
    response: string,
    studentLevel: string = 'INTERMEDIATE',
    studentMastery?: number  // 0-1 from student memory
  ): Promise<ZPDResult> {
    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate if this response targets the student's Zone of Proximal Development (ZPD).

STUDENT LEVEL: ${studentLevel}
${studentMastery !== undefined ? `MASTERY: ${(studentMastery * 100).toFixed(0)}%` : ''}

RESPONSE: ${response}

ZONE OF PROXIMAL DEVELOPMENT:
- TOO_EASY: Below ZPD (student already knows this → bored)
- JUST_RIGHT: Within ZPD (challenging but achievable → optimal learning)
- TOO_HARD: Above ZPD (too difficult → frustrated)

Assess:
1. Challenge level relative to student ability
2. Support provided for new concepts
3. Balance of familiar vs. new information

Return JSON:
{
  "score": 0-100,
  "zone": "TOO_EASY/JUST_RIGHT/TOO_HARD",
  "appropriateness": 0-100,
  "recommendations": ["how to adjust to ZPD"]
}

Score guide:
90-100: Perfect ZPD targeting
75-89: Good ZPD targeting
60-74: Partially in ZPD
<60: Outside ZPD

Return ONLY the JSON.`,
        },
      ],
    });

    const text = evaluation.content[0].type === 'text' ? evaluation.content[0].text : '{}';

    try {
      const result = JSON.parse(text);

      return {
        passed: result.score >= 75 && result.zone === 'JUST_RIGHT',
        score: result.score || 0,
        zone: result.zone || 'JUST_RIGHT',
        appropriateness: result.appropriateness || 0,
        recommendations: result.recommendations || [],
      };
    } catch {
      return {
        passed: false,
        score: 0,
        zone: 'JUST_RIGHT',
        appropriateness: 0,
        recommendations: ['Failed to evaluate ZPD targeting'],
      };
    }
  }
}
```

**File: `lib/sam/pedagogy/socratic-evaluator.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface SocraticResult {
  passed: boolean;
  score: number;
  usesSocraticMethod: boolean;
  elements: {
    posesQuestions: boolean;
    encouragesThinking: boolean;
    guidesDiscovery: boolean;
    avoidsDirectAnswers: boolean;
  };
  recommendations: string[];
}

export class SocraticEvaluator {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Evaluate use of Socratic method
   */
  async evaluate(
    query: string,
    response: string
  ): Promise<SocraticResult> {
    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate if this response uses the Socratic method effectively.

QUERY: ${query}
RESPONSE: ${response}

SOCRATIC METHOD ELEMENTS:
1. **Poses Questions**: Asks guiding questions
2. **Encourages Thinking**: Prompts student to reason
3. **Guides Discovery**: Helps student discover answers
4. **Avoids Direct Answers**: Doesn't just give answers (when appropriate)

Note: Not all questions require Socratic method (e.g., factual queries).

Return JSON:
{
  "score": 0-100,
  "appropriate": true/false,
  "posesQuestions": true/false,
  "encouragesThinking": true/false,
  "guidesDiscovery": true/false,
  "avoidsDirectAnswers": true/false,
  "recommendations": ["how to better use Socratic method"]
}

Score guide:
90-100: Excellent Socratic teaching
75-89: Good use when appropriate
60-74: Some Socratic elements
<60: Minimal Socratic method

Return ONLY the JSON.`,
        },
      ],
    });

    const text = evaluation.content[0].type === 'text' ? evaluation.content[0].text : '{}';

    try {
      const result = JSON.parse(text);

      return {
        passed: result.score >= 70,
        score: result.score || 0,
        usesSocraticMethod: result.score >= 60,
        elements: {
          posesQuestions: result.posesQuestions || false,
          encouragesThinking: result.encouragesThinking || false,
          guidesDiscovery: result.guidesDiscovery || false,
          avoidsDirectAnswers: result.avoidsDirectAnswers || false,
        },
        recommendations: result.recommendations || [],
      };
    } catch {
      return {
        passed: false,
        score: 0,
        usesSocraticMethod: false,
        elements: {
          posesQuestions: false,
          encouragesThinking: false,
          guidesDiscovery: false,
          avoidsDirectAnswers: false,
        },
        recommendations: ['Failed to evaluate Socratic method'],
      };
    }
  }
}
```

### Week 31: Integration & Orchestration

**File: `lib/sam/pedagogy/pedagogy-orchestrator.ts`**

```typescript
import { BloomsAligner } from './blooms-aligner';
import { ScaffoldingEvaluator } from './scaffolding-evaluator';
import { ZPDEvaluator } from './zpd-evaluator';
import { SocraticEvaluator } from './socratic-evaluator';

interface PedagogicalReport {
  overallPassed: boolean;
  teachingQualityScore: number;  // 0-100
  blooms: BloomsAlignment;
  scaffolding: ScaffoldingResult;
  zpd: ZPDResult;
  socratic: SocraticResult;
  recommendedAction: 'DELIVER' | 'ENHANCE_PEDAGOGY';
  enhancementPrompt?: string;
}

export class PedagogyOrchestrator {
  private bloomsAligner: BloomsAligner;
  private scaffoldingEvaluator: ScaffoldingEvaluator;
  private zpdEvaluator: ZPDEvaluator;
  private socraticEvaluator: SocraticEvaluator;

  constructor() {
    this.bloomsAligner = new BloomsAligner();
    this.scaffoldingEvaluator = new ScaffoldingEvaluator();
    this.zpdEvaluator = new ZPDEvaluator();
    this.socraticEvaluator = new SocraticEvaluator();
  }

  /**
   * Run all pedagogical evaluations
   */
  async evaluate(
    query: string,
    response: string,
    studentLevel: string = 'INTERMEDIATE',
    studentMastery?: number
  ): Promise<PedagogicalReport> {
    // Run all evaluations in parallel
    const [blooms, scaffolding, zpd, socratic] = await Promise.all([
      this.bloomsAligner.evaluate(query, response),
      this.scaffoldingEvaluator.evaluate(response, studentLevel),
      this.zpdEvaluator.evaluate(response, studentLevel, studentMastery),
      this.socraticEvaluator.evaluate(query, response),
    ]);

    // Calculate teaching quality score (weighted average)
    const teachingQualityScore = this.calculateTeachingQuality({
      blooms,
      scaffolding,
      zpd,
      socratic,
    });

    // Determine if all passed
    const overallPassed = teachingQualityScore >= 85;

    // Determine action
    const recommendedAction = overallPassed ? 'DELIVER' : 'ENHANCE_PEDAGOGY';

    // Generate enhancement prompt if needed
    const enhancementPrompt = recommendedAction === 'ENHANCE_PEDAGOGY'
      ? this.generatePedagogicalEnhancement(query, response, {
          blooms,
          scaffolding,
          zpd,
          socratic,
        })
      : undefined;

    return {
      overallPassed,
      teachingQualityScore,
      blooms,
      scaffolding,
      zpd,
      socratic,
      recommendedAction,
      enhancementPrompt,
    };
  }

  /**
   * Calculate overall teaching quality score
   */
  private calculateTeachingQuality(evals: {
    blooms: BloomsAlignment;
    scaffolding: ScaffoldingResult;
    zpd: ZPDResult;
    socratic: SocraticResult;
  }): number {
    const weights = {
      blooms: 0.35,
      scaffolding: 0.30,
      zpd: 0.25,
      socratic: 0.10,
    };

    return (
      evals.blooms.score * weights.blooms +
      evals.scaffolding.score * weights.scaffolding +
      evals.zpd.score * weights.zpd +
      evals.socratic.score * weights.socratic
    );
  }

  /**
   * Generate pedagogical enhancement prompt
   */
  private generatePedagogicalEnhancement(
    query: string,
    response: string,
    evals: any
  ): string {
    const improvements: string[] = [];

    if (!evals.blooms.passed) {
      improvements.push(`BLOOM'S TAXONOMY: ${evals.blooms.recommendations.join(', ')}`);
    }

    if (!evals.scaffolding.passed) {
      improvements.push(`SCAFFOLDING: ${evals.scaffolding.recommendations.join(', ')}`);
    }

    if (!evals.zpd.passed) {
      improvements.push(`ZPD TARGETING: ${evals.zpd.recommendations.join(', ')}`);
    }

    if (!evals.socratic.passed && evals.socratic.score > 0) {
      improvements.push(`SOCRATIC METHOD: ${evals.socratic.recommendations.join(', ')}`);
    }

    return `Enhance this response to improve its pedagogical quality.

QUERY: ${query}
CURRENT RESPONSE: ${response}

PEDAGOGICAL IMPROVEMENTS NEEDED:
${improvements.join('\n\n')}

Generate an enhanced response that:
1. Aligns with Bloom's Taxonomy
2. Uses proper scaffolding
3. Targets the student's ZPD
4. Incorporates Socratic elements when appropriate`;
  }
}
```

---

## 📊 Metrics & Monitoring

```typescript
export const pedagogyMetrics = {
  teachingQualityScore: new client.Histogram({
    name: 'sam_teaching_quality_score',
    help: 'Overall teaching quality score',
    buckets: [50, 60, 70, 80, 90, 100],
  }),

  bloomsAlignment: new client.Gauge({
    name: 'sam_blooms_alignment_rate',
    help: 'Percentage of responses aligned with Bloom\'s',
  }),

  scaffoldingPresence: new client.Gauge({
    name: 'sam_scaffolding_presence_rate',
    help: 'Percentage of responses with proper scaffolding',
  }),

  zpdTargeting: new client.Gauge({
    name: 'sam_zpd_targeting_rate',
    help: 'Percentage of responses in student ZPD',
  }),
};
```

---

## ✅ Acceptance Criteria

- [ ] Evaluation latency <800ms
- [ ] Bloom's alignment >85%
- [ ] Scaffolding detection >80%
- [ ] ZPD targeting >85%
- [ ] Teaching quality >85/100
- [ ] "Well taught" rating >90%

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
