# Initiative 1: Self-Critique Loops

**Timeline**: Weeks 25-27 (3 weeks)
**Priority**: 🔴 Critical
**Budget**: $35,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Current SAM generates responses without validating their quality, accuracy, or pedagogical soundness. This leads to:
- Hallucinations and factual errors slipping through
- Poorly explained concepts reaching students
- No quality control before response delivery
- Inability to self-correct mistakes

**The Solution**: Implement multi-agent self-critique loops where SAM validates its own responses using separate AI agents before delivering them to students. Each response goes through factual validation, pedagogical review, and clarity checks.

**Impact**:
- **Hallucination Reduction**: From 5% → <1%
- **Response Quality**: 40% improvement
- **Self-Correction**: 95%+ of issues fixed automatically
- **Student Trust**: Confidence in SAM increases to >4.7/5

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Self-critique latency <2 seconds (added to response time)
- ✅ Critique accuracy >90% (correctly identifies issues)
- ✅ False positive rate <5% (good content incorrectly flagged)
- ✅ Self-correction success rate >95%

### Quality Metrics
- ✅ Factual accuracy improvement from 95% → 99%+
- ✅ Hallucination rate reduction from 5% → <1%
- ✅ Pedagogical quality score >85%
- ✅ Clarity rating >90%

### User Experience Metrics
- ✅ Student trust rating >4.7/5
- ✅ "Accurate information" confidence >95%
- ✅ Teacher satisfaction with AI quality >90%
- ✅ Error report rate reduction by 80%

### Business Metrics
- ✅ Student complaints about errors reduction by 90%
- ✅ Teacher intervention rate reduction by 70%
- ✅ Platform credibility score increase

---

## 🏗️ Architecture Design

### Multi-Agent Critique System

```
┌─────────────────────────────────────────────────────────────┐
│              Self-Critique Loop Architecture                 │
└─────────────────────────────────────────────────────────────┘

Student Query → SAM Generator → Draft Response
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   Parallel Critique      │
                        │   (3 Agents)            │
                        └──────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   Factual    │         │ Pedagogical  │         │   Clarity    │
    │   Validator  │         │   Reviewer   │         │   Evaluator  │
    └──────────────┘         └──────────────┘         └──────────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │  Aggregate Critique      │
                        │  • Identify issues       │
                        │  • Confidence scoring    │
                        │  • Severity ranking      │
                        └──────────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                   Issues Found?               No Issues
                        │                           │
                       YES                          │
                        │                           │
                        ▼                           ▼
            ┌──────────────────────┐      ┌──────────────┐
            │   Self-Correction    │      │  Deliver     │
            │   • Regenerate       │      │  Response    │
            │   • Fix issues       │      │              │
            │   • Re-validate      │      └──────────────┘
            └──────────────────────┘
                        │
                        ▼
            Re-run critique loop (max 2 iterations)
```

### Critique Agent Specializations

```typescript
enum CritiqueType {
  FACTUAL = 'FACTUAL',           // Verify facts, detect hallucinations
  PEDAGOGICAL = 'PEDAGOGICAL',   // Check teaching quality
  CLARITY = 'CLARITY',           // Assess explanation clarity
}

interface CritiqueResult {
  critiqueType: CritiqueType;
  passedValidation: boolean;
  confidence: number;            // 0-1
  issues: CritiqueIssue[];
  suggestions: string[];
}

interface CritiqueIssue {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  type: string;                  // 'hallucination', 'unclear', 'poor_pedagogy'
  location: string;              // Where in response
  description: string;
  suggestedFix?: string;
}
```

---

## 🔧 Implementation Plan

### Week 25: Factual Validator Agent

#### Day 1-3: Factual Validation System

**File: `lib/sam/critique/factual-validator.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { VectorSearch } from '../rag/vector-search';

interface FactualValidationResult {
  passedValidation: boolean;
  confidence: number;
  issues: FactualIssue[];
  verifiedClaims: VerifiedClaim[];
}

interface FactualIssue {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  claim: string;
  reason: string;
  suggestedCorrection?: string;
}

interface VerifiedClaim {
  claim: string;
  verified: boolean;
  sources: string[];
  confidence: number;
}

export class FactualValidator {
  private anthropic: Anthropic;
  private vectorSearch: VectorSearch;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.vectorSearch = new VectorSearch();
  }

  /**
   * Validate factual accuracy of response
   */
  async validate(
    response: string,
    query: string,
    courseId: string
  ): Promise<FactualValidationResult> {
    // Extract claims from response
    const claims = await this.extractClaims(response);

    // Verify each claim against course content
    const verifiedClaims = await this.verifyClaims(claims, courseId);

    // Detect hallucinations
    const hallucinations = this.detectHallucinations(verifiedClaims);

    // Check for contradictions
    const contradictions = await this.detectContradictions(response);

    // Aggregate issues
    const issues: FactualIssue[] = [
      ...hallucinations,
      ...contradictions,
    ];

    // Calculate confidence
    const confidence = this.calculateConfidence(verifiedClaims);

    return {
      passedValidation: issues.length === 0,
      confidence,
      issues,
      verifiedClaims,
    };
  }

  /**
   * Extract factual claims from response
   */
  private async extractClaims(response: string): Promise<string[]> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Extract all factual claims from this educational response. Return as JSON array of strings.

RESPONSE:
${response}

Return ONLY a JSON array: ["claim 1", "claim 2", ...]`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';

    try {
      return JSON.parse(text);
    } catch {
      // Fallback: split by sentences
      return response
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
    }
  }

  /**
   * Verify claims against course content
   */
  private async verifyClaims(
    claims: string[],
    courseId: string
  ): Promise<VerifiedClaim[]> {
    const verified: VerifiedClaim[] = [];

    for (const claim of claims) {
      // Search course content for supporting evidence
      const evidence = await this.vectorSearch.search(claim, {
        courseId,
        topK: 3,
      });

      // Use Claude to verify claim against evidence
      const isVerified = await this.verifyClaimWithEvidence(claim, evidence);

      verified.push({
        claim,
        verified: isVerified.verified,
        sources: evidence.map(e => e.metadata.sectionId || 'unknown'),
        confidence: isVerified.confidence,
      });
    }

    return verified;
  }

  /**
   * Verify a single claim against evidence
   */
  private async verifyClaimWithEvidence(
    claim: string,
    evidence: any[]
  ): Promise<{ verified: boolean; confidence: number }> {
    if (evidence.length === 0) {
      return { verified: false, confidence: 0 };
    }

    const evidenceText = evidence.map(e => e.content).join('\n\n---\n\n');

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Does the following evidence support or contradict this claim?

CLAIM: ${claim}

EVIDENCE:
${evidenceText}

Return JSON:
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

    try {
      const result = JSON.parse(text);
      return {
        verified: result.verified || false,
        confidence: result.confidence || 0,
      };
    } catch {
      return { verified: false, confidence: 0 };
    }
  }

  /**
   * Detect hallucinations (unverified claims)
   */
  private detectHallucinations(
    verifiedClaims: VerifiedClaim[]
  ): FactualIssue[] {
    const hallucinations: FactualIssue[] = [];

    for (const claim of verifiedClaims) {
      if (!claim.verified && claim.confidence < 0.5) {
        hallucinations.push({
          severity: claim.sources.length === 0 ? 'CRITICAL' : 'MAJOR',
          claim: claim.claim,
          reason: 'No supporting evidence found in course materials',
          suggestedCorrection: 'Remove or verify this claim before delivery',
        });
      }
    }

    return hallucinations;
  }

  /**
   * Detect internal contradictions
   */
  private async detectContradictions(response: string): Promise<FactualIssue[]> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Analyze this educational response for internal contradictions or inconsistencies.

RESPONSE:
${response}

Return JSON array of contradictions:
[
  {
    "statement1": "first contradicting statement",
    "statement2": "second contradicting statement",
    "severity": "CRITICAL/MAJOR/MINOR"
  }
]

Return ONLY the JSON array. If no contradictions, return [].`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';

    try {
      const contradictions = JSON.parse(text);

      return contradictions.map((c: any) => ({
        severity: c.severity || 'MAJOR',
        claim: `${c.statement1} vs ${c.statement2}`,
        reason: 'Internal contradiction detected',
        suggestedCorrection: 'Resolve contradiction before delivery',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(verifiedClaims: VerifiedClaim[]): number {
    if (verifiedClaims.length === 0) return 0;

    const totalConfidence = verifiedClaims.reduce(
      (sum, claim) => sum + (claim.verified ? claim.confidence : 0),
      0
    );

    return totalConfidence / verifiedClaims.length;
  }
}
```

#### Day 4-5: Pedagogical Reviewer Agent

**File: `lib/sam/critique/pedagogical-reviewer.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface PedagogicalReviewResult {
  passedValidation: boolean;
  overallScore: number;      // 0-100
  issues: PedagogicalIssue[];
  strengths: string[];
}

interface PedagogicalIssue {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  category: string;          // 'scaffolding', 'examples', 'clarity', 'bloom_alignment'
  description: string;
  suggestedImprovement: string;
}

export class PedagogicalReviewer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Review pedagogical quality of response
   */
  async review(
    response: string,
    query: string,
    studentLevel: string = 'INTERMEDIATE'
  ): Promise<PedagogicalReviewResult> {
    const review = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `You are an expert pedagogy evaluator. Review this educational response for teaching quality.

STUDENT LEVEL: ${studentLevel}
QUERY: ${query}
RESPONSE: ${response}

Evaluate based on:
1. **Scaffolding**: Does it build from simple to complex?
2. **Examples**: Are examples clear, relevant, and sufficient?
3. **Clarity**: Is the explanation easy to understand?
4. **Bloom's Taxonomy**: Does it match the appropriate cognitive level?
5. **Engagement**: Does it maintain student interest?

Return JSON:
{
  "overallScore": 0-100,
  "issues": [
    {
      "severity": "CRITICAL/MAJOR/MINOR",
      "category": "scaffolding/examples/clarity/bloom_alignment/engagement",
      "description": "what's wrong",
      "suggestedImprovement": "how to fix it"
    }
  ],
  "strengths": ["what was done well"]
}

CRITICAL = Prevents learning
MAJOR = Significantly impairs learning
MINOR = Could be improved but acceptable

Return ONLY the JSON.`,
        },
      ],
    });

    const text = review.content[0].type === 'text' ? review.content[0].text : '{}';

    try {
      const result = JSON.parse(text);

      return {
        passedValidation: result.overallScore >= 70 && !this.hasCriticalIssues(result.issues),
        overallScore: result.overallScore || 0,
        issues: result.issues || [],
        strengths: result.strengths || [],
      };
    } catch (error) {
      console.error('Failed to parse pedagogical review:', error);
      return {
        passedValidation: false,
        overallScore: 0,
        issues: [],
        strengths: [],
      };
    }
  }

  /**
   * Check if there are critical issues
   */
  private hasCriticalIssues(issues: PedagogicalIssue[]): boolean {
    return issues.some(issue => issue.severity === 'CRITICAL');
  }
}
```

### Week 26: Clarity Evaluator & Aggregator

#### Day 1-2: Clarity Evaluator

**File: `lib/sam/critique/clarity-evaluator.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ClarityEvaluationResult {
  passedValidation: boolean;
  clarityScore: number;      // 0-100
  issues: ClarityIssue[];
}

interface ClarityIssue {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  type: 'jargon' | 'complexity' | 'structure' | 'length';
  description: string;
  suggestedFix: string;
}

export class ClarityEvaluator {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Evaluate clarity of response
   */
  async evaluate(response: string, studentLevel: string = 'INTERMEDIATE'): Promise<ClarityEvaluationResult> {
    const evaluation = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate the clarity of this educational response for a ${studentLevel} student.

RESPONSE:
${response}

Check for:
1. **Jargon**: Unexplained technical terms
2. **Complexity**: Overly complex sentences
3. **Structure**: Logical flow and organization
4. **Length**: Appropriate length (not too long or short)

Return JSON:
{
  "clarityScore": 0-100,
  "issues": [
    {
      "severity": "CRITICAL/MAJOR/MINOR",
      "type": "jargon/complexity/structure/length",
      "description": "what's unclear",
      "suggestedFix": "how to make it clearer"
    }
  ]
}

Score guide:
90-100: Crystal clear
70-89: Mostly clear
50-69: Somewhat unclear
<50: Very unclear

Return ONLY the JSON.`,
        },
      ],
    });

    const text = evaluation.content[0].type === 'text' ? evaluation.content[0].text : '{}';

    try {
      const result = JSON.parse(text);

      return {
        passedValidation: result.clarityScore >= 70,
        clarityScore: result.clarityScore || 0,
        issues: result.issues || [],
      };
    } catch {
      return {
        passedValidation: false,
        clarityScore: 0,
        issues: [],
      };
    }
  }
}
```

#### Day 3-5: Critique Aggregator & Self-Corrector

**File: `lib/sam/critique/critique-orchestrator.ts`**

```typescript
import { FactualValidator } from './factual-validator';
import { PedagogicalReviewer } from './pedagogical-reviewer';
import { ClarityEvaluator } from './clarity-evaluator';
import Anthropic from '@anthropic-ai/sdk';

interface CritiqueReport {
  overallPassed: boolean;
  confidence: number;
  factual: FactualValidationResult;
  pedagogical: PedagogicalReviewResult;
  clarity: ClarityEvaluationResult;
  criticalIssues: CritiqueIssue[];
  recommendedAction: 'DELIVER' | 'REGENERATE' | 'MANUAL_REVIEW';
}

export class CritiqueOrchestrator {
  private factualValidator: FactualValidator;
  private pedagogicalReviewer: PedagogicalReviewer;
  private clarityEvaluator: ClarityEvaluator;
  private anthropic: Anthropic;

  constructor() {
    this.factualValidator = new FactualValidator();
    this.pedagogicalReviewer = new PedagogicalReviewer();
    this.clarityEvaluator = new ClarityEvaluator();
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Run complete critique loop
   */
  async critique(
    response: string,
    query: string,
    courseId: string,
    studentLevel: string = 'INTERMEDIATE'
  ): Promise<CritiqueReport> {
    // Run all critiques in parallel
    const [factual, pedagogical, clarity] = await Promise.all([
      this.factualValidator.validate(response, query, courseId),
      this.pedagogicalReviewer.review(response, query, studentLevel),
      this.clarityEvaluator.evaluate(response, studentLevel),
    ]);

    // Aggregate results
    const criticalIssues = this.aggregateCriticalIssues(factual, pedagogical, clarity);

    // Determine action
    const recommendedAction = this.determineAction(factual, pedagogical, clarity, criticalIssues);

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(factual, pedagogical, clarity);

    return {
      overallPassed: recommendedAction === 'DELIVER',
      confidence,
      factual,
      pedagogical,
      clarity,
      criticalIssues,
      recommendedAction,
    };
  }

  /**
   * Self-correct response based on critique
   */
  async selfCorrect(
    originalResponse: string,
    query: string,
    critiqueReport: CritiqueReport
  ): Promise<string> {
    const issuesSummary = this.formatIssuesForCorrection(critiqueReport);

    const corrected = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are SAM, an AI tutor. Your previous response had issues. Generate a corrected version.

ORIGINAL QUERY: ${query}

ORIGINAL RESPONSE:
${originalResponse}

IDENTIFIED ISSUES:
${issuesSummary}

Generate a corrected response that fixes all issues while maintaining accuracy and pedagogical quality.`,
        },
      ],
    });

    return corrected.content[0].type === 'text' ? corrected.content[0].text : originalResponse;
  }

  /**
   * Aggregate critical issues from all critiques
   */
  private aggregateCriticalIssues(
    factual: FactualValidationResult,
    pedagogical: PedagogicalReviewResult,
    clarity: ClarityEvaluationResult
  ): CritiqueIssue[] {
    const issues: CritiqueIssue[] = [];

    // Add factual issues
    factual.issues
      .filter(i => i.severity === 'CRITICAL' || i.severity === 'MAJOR')
      .forEach(i => {
        issues.push({
          type: 'FACTUAL',
          severity: i.severity,
          description: i.reason,
          suggestedFix: i.suggestedCorrection || '',
        });
      });

    // Add pedagogical issues
    pedagogical.issues
      .filter(i => i.severity === 'CRITICAL' || i.severity === 'MAJOR')
      .forEach(i => {
        issues.push({
          type: 'PEDAGOGICAL',
          severity: i.severity,
          description: i.description,
          suggestedFix: i.suggestedImprovement,
        });
      });

    // Add clarity issues
    clarity.issues
      .filter(i => i.severity === 'CRITICAL' || i.severity === 'MAJOR')
      .forEach(i => {
        issues.push({
          type: 'CLARITY',
          severity: i.severity,
          description: i.description,
          suggestedFix: i.suggestedFix,
        });
      });

    return issues;
  }

  /**
   * Determine recommended action
   */
  private determineAction(
    factual: FactualValidationResult,
    pedagogical: PedagogicalReviewResult,
    clarity: ClarityEvaluationResult,
    criticalIssues: CritiqueIssue[]
  ): 'DELIVER' | 'REGENERATE' | 'MANUAL_REVIEW' {
    // Critical issues = regenerate
    if (criticalIssues.some(i => i.severity === 'CRITICAL')) {
      return 'REGENERATE';
    }

    // Multiple major issues = regenerate
    const majorIssues = criticalIssues.filter(i => i.severity === 'MAJOR');
    if (majorIssues.length >= 3) {
      return 'REGENERATE';
    }

    // Low factual confidence = manual review
    if (factual.confidence < 0.7) {
      return 'MANUAL_REVIEW';
    }

    // All passed = deliver
    if (factual.passedValidation && pedagogical.passedValidation && clarity.passedValidation) {
      return 'DELIVER';
    }

    // Minor issues = regenerate to improve
    if (majorIssues.length > 0) {
      return 'REGENERATE';
    }

    // Default: deliver
    return 'DELIVER';
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    factual: FactualValidationResult,
    pedagogical: PedagogicalReviewResult,
    clarity: ClarityEvaluationResult
  ): number {
    const factualWeight = 0.5;
    const pedagogicalWeight = 0.3;
    const clarityWeight = 0.2;

    return (
      factual.confidence * factualWeight +
      (pedagogical.overallScore / 100) * pedagogicalWeight +
      (clarity.clarityScore / 100) * clarityWeight
    );
  }

  /**
   * Format issues for correction prompt
   */
  private formatIssuesForCorrection(report: CritiqueReport): string {
    const parts: string[] = [];

    if (report.factual.issues.length > 0) {
      parts.push('FACTUAL ISSUES:');
      report.factual.issues.forEach(i => {
        parts.push(`- ${i.reason}: ${i.suggestedCorrection || 'Verify and correct'}`);
      });
    }

    if (report.pedagogical.issues.length > 0) {
      parts.push('\nPEDAGOGICAL ISSUES:');
      report.pedagogical.issues.forEach(i => {
        parts.push(`- ${i.description}: ${i.suggestedImprovement}`);
      });
    }

    if (report.clarity.issues.length > 0) {
      parts.push('\nCLARITY ISSUES:');
      report.clarity.issues.forEach(i => {
        parts.push(`- ${i.description}: ${i.suggestedFix}`);
      });
    }

    return parts.join('\n');
  }
}
```

### Week 27: Integration & Testing

**File: `lib/sam/engines/self-critique-engine.ts`**

```typescript
import { SAMBaseEngine } from './base-engine';
import { CritiqueOrchestrator } from '../critique/critique-orchestrator';

export class SelfCritiqueEngine extends SAMBaseEngine {
  private critiqueOrchestrator: CritiqueOrchestrator;
  private maxIterations = 2;

  constructor() {
    super();
    this.critiqueOrchestrator = new CritiqueOrchestrator();
  }

  /**
   * Generate response with self-critique validation
   */
  async generateWithCritique(
    userId: string,
    courseId: string,
    query: string,
    studentLevel: string = 'INTERMEDIATE'
  ): Promise<{
    response: string;
    critiqueReport: CritiqueReport;
    iterations: number;
  }> {
    let currentResponse = await this.generateResponse(query);
    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      // Critique current response
      const critiqueReport = await this.critiqueOrchestrator.critique(
        currentResponse,
        query,
        courseId,
        studentLevel
      );

      // If passed, deliver
      if (critiqueReport.recommendedAction === 'DELIVER') {
        return { response: currentResponse, critiqueReport, iterations };
      }

      // If manual review needed, deliver with warning
      if (critiqueReport.recommendedAction === 'MANUAL_REVIEW') {
        // Log for manual review
        await this.logForManualReview(currentResponse, critiqueReport);
        return { response: currentResponse, critiqueReport, iterations };
      }

      // Regenerate if issues found and not max iterations
      if (iterations < this.maxIterations) {
        currentResponse = await this.critiqueOrchestrator.selfCorrect(
          currentResponse,
          query,
          critiqueReport
        );
      }
    }

    // Max iterations reached - deliver with final critique
    const finalCritique = await this.critiqueOrchestrator.critique(
      currentResponse,
      query,
      courseId,
      studentLevel
    );

    return { response: currentResponse, critiqueReport: finalCritique, iterations };
  }

  private async logForManualReview(response: string, critique: CritiqueReport): Promise<void> {
    // Log to database or monitoring system
    console.warn('Response flagged for manual review:', {
      confidence: critique.confidence,
      issues: critique.criticalIssues.length,
    });
  }
}
```

---

## 📊 Metrics & Monitoring

```typescript
export const critiqueMetrics = {
  critiqueDuration: new client.Histogram({
    name: 'sam_critique_duration_seconds',
    help: 'Time to complete critique loop',
    buckets: [0.5, 1, 2, 3, 5],
  }),

  critiqueAccuracy: new client.Gauge({
    name: 'sam_critique_accuracy',
    help: 'Percentage of issues correctly identified',
  }),

  selfCorrectionRate: new client.Counter({
    name: 'sam_self_correction_total',
    help: 'Number of responses self-corrected',
    labelNames: ['iteration'],
  }),

  hallucinationDetectionRate: new client.Gauge({
    name: 'sam_hallucination_detection_rate',
    help: 'Percentage of hallucinations detected',
  }),
};
```

---

## ✅ Acceptance Criteria

- [ ] Critique latency <2s
- [ ] Critique accuracy >90%
- [ ] False positive rate <5%
- [ ] Self-correction success >95%
- [ ] Factual accuracy >99%
- [ ] Hallucination rate <1%

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
