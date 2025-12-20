# Initiative 2: Content Quality Gates

**Timeline**: Weeks 28-29 (2 weeks)
**Priority**: 🔴 Critical
**Budget**: $28,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Even with self-critique loops, some responses that are factually correct may still be:
- Too vague or incomplete
- Missing critical examples
- Inappropriate difficulty for student level
- Lacking proper structure
- Insufficient depth or detail

**The Solution**: Implement multi-layered quality gates that validate response completeness, clarity, example quality, appropriate difficulty, and overall pedagogical value before delivery.

**Impact**:
- **Quality Rejection Rate**: 5-10% of responses improved before delivery
- **Student Comprehension**: 35% increase
- **"Clear Explanation" Rating**: >90%
- **First-Time Understanding**: 75% (up from 50%)

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Quality gate processing latency <500ms
- ✅ Gate accuracy >90% (correctly identifies quality issues)
- ✅ False positive rate <8% (good content incorrectly rejected)
- ✅ Multi-gate integration success >99%

### Quality Metrics
- ✅ Completeness score >85% for all delivered responses
- ✅ Example quality score >80%
- ✅ Difficulty appropriateness >90% match
- ✅ Structural quality >85%

### User Experience Metrics
- ✅ "Clear explanation" rating >90%
- ✅ "Complete answer" rating >85%
- ✅ First-time understanding rate >75%
- ✅ Follow-up question rate reduction by 40%

### Business Metrics
- ✅ Student satisfaction increase to >4.7/5
- ✅ Learning efficiency improvement by 30%
- ✅ Teacher override rate <5% (teachers rarely need to correct)

---

## 🏗️ Architecture Design

### Multi-Layer Quality Gate System

```
┌─────────────────────────────────────────────────────────────┐
│              Quality Gate Pipeline                           │
└─────────────────────────────────────────────────────────────┘

Response (post-critique) → Quality Gate 1: Completeness
                                    │
                            Pass ✓  │  Fail ✗
                                    │      │
                                    │      └─→ Regenerate with
                                    │          completion prompt
                                    ▼
                    Quality Gate 2: Example Quality
                                    │
                            Pass ✓  │  Fail ✗
                                    │      │
                                    │      └─→ Add/improve examples
                                    │
                                    ▼
                    Quality Gate 3: Difficulty Match
                                    │
                            Pass ✓  │  Fail ✗
                                    │      │
                                    │      └─→ Adjust difficulty level
                                    │
                                    ▼
                    Quality Gate 4: Structure & Organization
                                    │
                            Pass ✓  │  Fail ✗
                                    │      │
                                    │      └─→ Restructure response
                                    │
                                    ▼
                    Quality Gate 5: Depth & Detail
                                    │
                            Pass ✓  │  Fail ✗
                                    │      │
                                    │      └─→ Add necessary depth
                                    │
                                    ▼
                        All Gates Passed ✓
                                    │
                                    ▼
                            Deliver Response
```

### Quality Gate Schema

```prisma
model QualityGateResult {
  id              String   @id @default(uuid())
  responseId      String

  // Gate results
  completeness    Json     // { passed, score, issues }
  exampleQuality  Json     // { passed, score, issues }
  difficultyMatch Json     // { passed, score, issues }
  structure       Json     // { passed, score, issues }
  depth           Json     // { passed, score, issues }

  // Overall
  allGatesPassed  Boolean  @default(false)
  overallScore    Float    // 0-100
  iterations      Int      @default(0)

  createdAt       DateTime @default(now())

  @@index([responseId])
}

model QualityMetrics {
  id              String   @id @default(uuid())
  date            DateTime @default(now())

  // Daily metrics
  totalResponses  Int
  gateRejections  Int
  averageScore    Float

  // Per-gate stats
  completenessFailRate    Float
  exampleQualityFailRate  Float
  difficultyMismatchRate  Float
  structureFailRate       Float
  depthFailRate           Float

  @@index([date])
}
```

---

## 🔧 Implementation Plan

### Week 28: Core Quality Gates

#### Day 1-2: Completeness Gate

**File: `lib/sam/quality-gates/completeness-gate.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface CompletenessResult {
  passed: boolean;
  score: number;           // 0-100
  missingElements: string[];
  suggestions: string[];
}

export class CompletenessGate {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Validate response completeness
   */
  async validate(
    query: string,
    response: string,
    expectedElements?: string[]
  ): Promise<CompletenessResult> {
    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate if this educational response completely answers the student's question.

STUDENT QUESTION: ${query}

RESPONSE: ${response}

Check for:
1. **Direct Answer**: Does it directly answer the question?
2. **Key Concepts**: Are all relevant concepts covered?
3. **Explanation**: Is there sufficient explanation?
4. **Examples**: Are examples provided when needed?
5. **Context**: Is necessary context included?

${expectedElements ? `REQUIRED ELEMENTS: ${expectedElements.join(', ')}` : ''}

Return JSON:
{
  "score": 0-100,
  "directAnswer": true/false,
  "keyConcepts": true/false,
  "explanation": true/false,
  "examples": true/false,
  "context": true/false,
  "missingElements": ["what's missing"],
  "suggestions": ["how to complete it"]
}

Score guide:
90-100: Complete and thorough
75-89: Mostly complete, minor gaps
60-74: Somewhat incomplete
<60: Significantly incomplete

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
        missingElements: result.missingElements || [],
        suggestions: result.suggestions || [],
      };
    } catch {
      return {
        passed: false,
        score: 0,
        missingElements: ['Failed to evaluate completeness'],
        suggestions: [],
      };
    }
  }

  /**
   * Generate completion prompt for regeneration
   */
  generateCompletionPrompt(
    query: string,
    incompleteResponse: string,
    missingElements: string[]
  ): string {
    return `The previous response was incomplete. Generate a complete response that includes:

MISSING ELEMENTS:
${missingElements.map(e => `- ${e}`).join('\n')}

ORIGINAL QUERY: ${query}

PREVIOUS RESPONSE:
${incompleteResponse}

Generate a COMPLETE response that addresses all missing elements while maintaining accuracy.`;
  }
}
```

#### Day 3: Example Quality Gate

**File: `lib/sam/quality-gates/example-quality-gate.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ExampleQualityResult {
  passed: boolean;
  score: number;
  hasExamples: boolean;
  exampleCount: number;
  exampleQuality: 'EXCELLENT' | 'GOOD' | 'POOR' | 'NONE';
  issues: string[];
  suggestions: string[];
}

export class ExampleQualityGate {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Validate example quality in response
   */
  async validate(
    query: string,
    response: string,
    conceptComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' = 'MODERATE'
  ): Promise<ExampleQualityResult> {
    const requiredExamples = this.getRequiredExampleCount(conceptComplexity);

    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate the quality and quantity of examples in this educational response.

CONCEPT COMPLEXITY: ${conceptComplexity}
RECOMMENDED EXAMPLES: At least ${requiredExamples}

RESPONSE: ${response}

Evaluate:
1. **Quantity**: Are there enough examples?
2. **Relevance**: Are examples relevant to the concept?
3. **Clarity**: Are examples clear and easy to understand?
4. **Diversity**: Do examples show different aspects?
5. **Progression**: Do examples go from simple to complex?

Return JSON:
{
  "score": 0-100,
  "exampleCount": number,
  "exampleQuality": "EXCELLENT/GOOD/POOR/NONE",
  "hasExamples": true/false,
  "issues": ["problems with examples"],
  "suggestions": ["how to improve examples"]
}

Score guide:
90-100: Excellent examples, perfect quantity/quality
75-89: Good examples, adequate
60-74: Examples present but could be better
<60: Poor or missing examples

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
        hasExamples: result.hasExamples || false,
        exampleCount: result.exampleCount || 0,
        exampleQuality: result.exampleQuality || 'NONE',
        issues: result.issues || [],
        suggestions: result.suggestions || [],
      };
    } catch {
      return {
        passed: false,
        score: 0,
        hasExamples: false,
        exampleCount: 0,
        exampleQuality: 'NONE',
        issues: ['Failed to evaluate examples'],
        suggestions: [],
      };
    }
  }

  /**
   * Get required example count based on complexity
   */
  private getRequiredExampleCount(complexity: string): number {
    switch (complexity) {
      case 'SIMPLE': return 1;
      case 'MODERATE': return 2;
      case 'COMPLEX': return 3;
      default: return 2;
    }
  }

  /**
   * Generate prompt to add/improve examples
   */
  generateExamplePrompt(
    query: string,
    response: string,
    suggestions: string[]
  ): string {
    return `Enhance this response by adding or improving examples.

SUGGESTIONS:
${suggestions.map(s => `- ${s}`).join('\n')}

ORIGINAL QUERY: ${query}

CURRENT RESPONSE:
${response}

Generate an enhanced version with better examples that:
1. Are clear and relevant
2. Progress from simple to complex
3. Show different aspects of the concept
4. Help students understand better`;
  }
}
```

#### Day 4-5: Difficulty Match & Structure Gates

**File: `lib/sam/quality-gates/difficulty-gate.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface DifficultyMatchResult {
  passed: boolean;
  score: number;
  targetLevel: string;
  actualLevel: string;
  mismatch: boolean;
  adjustment: 'SIMPLIFY' | 'DEEPEN' | 'NONE';
}

export class DifficultyGate {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Validate difficulty appropriateness
   */
  async validate(
    response: string,
    targetLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    studentProfile?: any
  ): Promise<DifficultyMatchResult> {
    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate if this response matches the target difficulty level.

TARGET LEVEL: ${targetLevel}

RESPONSE: ${response}

Assess:
1. **Vocabulary**: Appropriate for level?
2. **Concept Depth**: Matches expected depth?
3. **Prerequisites**: Assumes correct background?
4. **Complexity**: Right level of complexity?

Return JSON:
{
  "score": 0-100,
  "actualLevel": "BEGINNER/INTERMEDIATE/ADVANCED",
  "mismatch": true/false,
  "adjustment": "SIMPLIFY/DEEPEN/NONE",
  "reasoning": "why it matches or doesn't"
}

Score guide:
90-100: Perfect difficulty match
75-89: Close match, minor adjustment
60-74: Moderate mismatch
<60: Significant mismatch

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
        targetLevel,
        actualLevel: result.actualLevel || targetLevel,
        mismatch: result.mismatch || false,
        adjustment: result.adjustment || 'NONE',
      };
    } catch {
      return {
        passed: false,
        score: 0,
        targetLevel,
        actualLevel: 'UNKNOWN',
        mismatch: true,
        adjustment: 'NONE',
      };
    }
  }
}
```

**File: `lib/sam/quality-gates/structure-gate.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface StructureResult {
  passed: boolean;
  score: number;
  hasIntroduction: boolean;
  hasBody: boolean;
  hasConclusion: boolean;
  logicalFlow: boolean;
  issues: string[];
}

export class StructureGate {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Validate response structure and organization
   */
  async validate(response: string): Promise<StructureResult> {
    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate the structure and organization of this educational response.

RESPONSE: ${response}

Check for:
1. **Introduction**: Clear opening/context
2. **Body**: Main content organized logically
3. **Conclusion**: Summary or wrap-up
4. **Flow**: Logical progression of ideas
5. **Transitions**: Smooth connections between sections

Return JSON:
{
  "score": 0-100,
  "hasIntroduction": true/false,
  "hasBody": true/false,
  "hasConclusion": true/false,
  "logicalFlow": true/false,
  "issues": ["structural problems"]
}

Score guide:
90-100: Excellent structure
75-89: Good structure
60-74: Acceptable structure
<60: Poor structure

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
        hasIntroduction: result.hasIntroduction || false,
        hasBody: result.hasBody || false,
        hasConclusion: result.hasConclusion || false,
        logicalFlow: result.logicalFlow || false,
        issues: result.issues || [],
      };
    } catch {
      return {
        passed: false,
        score: 0,
        hasIntroduction: false,
        hasBody: false,
        hasConclusion: false,
        logicalFlow: false,
        issues: ['Failed to evaluate structure'],
      };
    }
  }
}
```

### Week 29: Integration & Orchestration

**File: `lib/sam/quality-gates/gate-orchestrator.ts`**

```typescript
import { CompletenessGate } from './completeness-gate';
import { ExampleQualityGate } from './example-quality-gate';
import { DifficultyGate } from './difficulty-gate';
import { StructureGate } from './structure-gate';
import Anthropic from '@anthropic-ai/sdk';

interface QualityGateReport {
  allPassed: boolean;
  overallScore: number;
  completeness: CompletenessResult;
  exampleQuality: ExampleQualityResult;
  difficultyMatch: DifficultyMatchResult;
  structure: StructureResult;
  recommendedAction: 'DELIVER' | 'REGENERATE' | 'ENHANCE';
  enhancementPrompt?: string;
}

export class QualityGateOrchestrator {
  private completenessGate: CompletenessGate;
  private exampleQualityGate: ExampleQualityGate;
  private difficultyGate: DifficultyGate;
  private structureGate: StructureGate;
  private anthropic: Anthropic;

  constructor() {
    this.completenessGate = new CompletenessGate();
    this.exampleQualityGate = new ExampleQualityGate();
    this.difficultyGate = new DifficultyGate();
    this.structureGate = new StructureGate();
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Run all quality gates
   */
  async runGates(
    query: string,
    response: string,
    targetLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'INTERMEDIATE',
    conceptComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' = 'MODERATE'
  ): Promise<QualityGateReport> {
    // Run all gates in parallel
    const [completeness, exampleQuality, difficultyMatch, structure] = await Promise.all([
      this.completenessGate.validate(query, response),
      this.exampleQualityGate.validate(query, response, conceptComplexity),
      this.difficultyGate.validate(response, targetLevel),
      this.structureGate.validate(response),
    ]);

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      completeness,
      exampleQuality,
      difficultyMatch,
      structure,
    });

    // Determine if all gates passed
    const allPassed =
      completeness.passed &&
      exampleQuality.passed &&
      difficultyMatch.passed &&
      structure.passed;

    // Determine action
    const recommendedAction = this.determineAction({
      completeness,
      exampleQuality,
      difficultyMatch,
      structure,
      overallScore,
    });

    // Generate enhancement prompt if needed
    const enhancementPrompt = recommendedAction === 'ENHANCE'
      ? this.generateEnhancementPrompt(query, response, {
          completeness,
          exampleQuality,
          difficultyMatch,
          structure,
        })
      : undefined;

    return {
      allPassed,
      overallScore,
      completeness,
      exampleQuality,
      difficultyMatch,
      structure,
      recommendedAction,
      enhancementPrompt,
    };
  }

  /**
   * Enhance response based on gate failures
   */
  async enhanceResponse(
    query: string,
    response: string,
    enhancementPrompt: string
  ): Promise<string> {
    const enhanced = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: enhancementPrompt,
        },
      ],
    });

    return enhanced.content[0].type === 'text' ? enhanced.content[0].text : response;
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(gates: {
    completeness: CompletenessResult;
    exampleQuality: ExampleQualityResult;
    difficultyMatch: DifficultyMatchResult;
    structure: StructureResult;
  }): number {
    const weights = {
      completeness: 0.35,
      exampleQuality: 0.25,
      difficultyMatch: 0.25,
      structure: 0.15,
    };

    return (
      gates.completeness.score * weights.completeness +
      gates.exampleQuality.score * weights.exampleQuality +
      gates.difficultyMatch.score * weights.difficultyMatch +
      gates.structure.score * weights.structure
    );
  }

  /**
   * Determine recommended action
   */
  private determineAction(params: {
    completeness: CompletenessResult;
    exampleQuality: ExampleQualityResult;
    difficultyMatch: DifficultyMatchResult;
    structure: StructureResult;
    overallScore: number;
  }): 'DELIVER' | 'REGENERATE' | 'ENHANCE' {
    const { completeness, exampleQuality, difficultyMatch, structure, overallScore } = params;

    // Critical failures = regenerate
    if (completeness.score < 60 || difficultyMatch.score < 60) {
      return 'REGENERATE';
    }

    // All passed = deliver
    if (
      completeness.passed &&
      exampleQuality.passed &&
      difficultyMatch.passed &&
      structure.passed
    ) {
      return 'DELIVER';
    }

    // Some failures but overall decent = enhance
    if (overallScore >= 70) {
      return 'ENHANCE';
    }

    // Otherwise regenerate
    return 'REGENERATE';
  }

  /**
   * Generate enhancement prompt
   */
  private generateEnhancementPrompt(
    query: string,
    response: string,
    gates: {
      completeness: CompletenessResult;
      exampleQuality: ExampleQualityResult;
      difficultyMatch: DifficultyMatchResult;
      structure: StructureResult;
    }
  ): string {
    const improvements: string[] = [];

    if (!gates.completeness.passed) {
      improvements.push(`COMPLETENESS (Score: ${gates.completeness.score}/100):`);
      improvements.push(...gates.completeness.suggestions.map(s => `- ${s}`));
    }

    if (!gates.exampleQuality.passed) {
      improvements.push(`\nEXAMPLES (Score: ${gates.exampleQuality.score}/100):`);
      improvements.push(...gates.exampleQuality.suggestions.map(s => `- ${s}`));
    }

    if (!gates.difficultyMatch.passed) {
      improvements.push(`\nDIFFICULTY: ${gates.difficultyMatch.adjustment}`);
    }

    if (!gates.structure.passed) {
      improvements.push(`\nSTRUCTURE (Score: ${gates.structure.score}/100):`);
      improvements.push(...gates.structure.issues.map(i => `- Fix: ${i}`));
    }

    return `Enhance this educational response based on quality gate feedback.

ORIGINAL QUERY: ${query}

CURRENT RESPONSE:
${response}

IMPROVEMENTS NEEDED:
${improvements.join('\n')}

Generate an enhanced response that addresses all the improvements while maintaining accuracy and clarity.`;
  }
}
```

---

## 📊 Metrics & Monitoring

```typescript
export const qualityGateMetrics = {
  gateProcessingDuration: new client.Histogram({
    name: 'sam_quality_gate_duration_seconds',
    help: 'Time to process all quality gates',
    buckets: [0.1, 0.3, 0.5, 1.0, 2.0],
  }),

  gateRejectionRate: new client.Gauge({
    name: 'sam_quality_gate_rejection_rate',
    help: 'Percentage of responses rejected by quality gates',
    labelNames: ['gate_type'],
  }),

  overallQualityScore: new client.Histogram({
    name: 'sam_quality_score',
    help: 'Overall quality score distribution',
    buckets: [50, 60, 70, 80, 90, 100],
  }),

  enhancementRate: new client.Counter({
    name: 'sam_enhancement_total',
    help: 'Number of responses enhanced by quality gates',
    labelNames: ['enhancement_type'],
  }),
};
```

---

## ✅ Acceptance Criteria

- [ ] Gate processing <500ms
- [ ] Gate accuracy >90%
- [ ] False positive rate <8%
- [ ] Rejection rate 5-10%
- [ ] Completeness score >85%
- [ ] Example quality >80%
- [ ] "Clear explanation" >90%

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
