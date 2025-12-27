# SAM Evaluation System Improvement Plan

**Version**: 2.0.0
**Created**: December 2025
**Status**: ✅ COMPLETED - All 10 Priorities Implemented
**Priority**: Critical
**Timeline**: 8 weeks (10 priorities) - COMPLETED

---

## Executive Summary

This plan addresses critical architectural gaps in SAM AI Tutor's evaluation system. Our analysis identified **engine fragmentation**, **missing quality gates**, **permissive parsing patterns**, and **lack of calibration loops** that collectively risk evaluation drift and unreliable content quality in production.

### Key Findings

| Issue | Severity | Impact | Location |
|-------|----------|--------|----------|
| Bloom's Engine Fragmentation | Critical | Inconsistent cognitive analysis | `packages/core` vs `packages/educational` |
| Quality Gates Not Wired | High | Unvalidated content delivery | Phase 3 - Not Started |
| Permissive JSON Parsing | High | Silent quality degradation | `evaluation-engine.ts:~L300-350` |
| No Calibration Loops | Medium | Evaluation drift over time | Not Implemented |
| Pedagogical Evaluators Missing | Medium | No scaffolding/ZPD validation | Phase 3 - Not Started |
| Orchestrator Integration Gap | High | Engines not connected | `sam-orchestrator.ts` |
| Memory Loop Not Closed | High | Evaluations don't update profiles | `blooms-engine.ts` hooks unused |
| Single-Pass Grading | Medium | Inconsistent assessment scoring | `evaluation-engine.ts` |
| No Prompt/Model Versioning | Medium | Silent evaluation drift | Not Implemented |
| No Safety/Fairness Checks | High | Bias and discouraging feedback | Not Implemented |

---

## 1. Current State Analysis

### 1.1 Bloom's Taxonomy Engines (Fragmented)

**Two Competing Implementations**:

#### `packages/core/src/engines/blooms.ts` (~400 lines)
- **Type**: Fast keyword-only classifier
- **Method**: Regex matching against `BLOOMS_KEYWORDS` constant
- **Strengths**:
  - Zero latency, no AI calls
  - Good for quick tagging
- **Weaknesses**:
  - Brittle to synonyms and phrasing
  - Defaults to synthetic distribution when no keywords match
  - Cannot understand context or nuance

```typescript
// Example: Keyword-based classification
const BLOOMS_KEYWORDS = {
  REMEMBER: ['define', 'list', 'recall', 'identify', ...],
  UNDERSTAND: ['explain', 'describe', 'summarize', ...],
  // ...
};

// Problem: "Walk me through how X works" won't match
// "explain" keyword, so gets synthetic fallback
```

#### `packages/educational/src/engines/blooms-engine.ts` (~1200 lines)
- **Type**: AI+DB hybrid engine with depth modes
- **Method**: Uses Claude Haiku for analysis, stores in DB
- **Strengths**:
  - Semantic understanding
  - Multiple analysis depths (quick/standard/comprehensive)
  - Course-level analysis with chapters/sections
  - Cognitive profiling, learning pathways, spaced repetition
- **Weaknesses**:
  - Higher latency (API calls)
  - Not integrated with core orchestrator
  - No fallback to keyword engine

```typescript
// Educational engine capabilities
interface CourseBloomsAnalysisResult {
  courseId: string;
  overallDistribution: BloomsDistribution;
  cognitiveProfile: CognitiveProfile;
  learningPathway: LearningPathway;
  recommendations: BloomsRecommendation[];
  // ... much richer analysis
}
```

**Fragmentation Risk**: Different parts of SAM use different engines, leading to inconsistent Bloom's classification for the same content.

---

### 1.2 Evaluation Engine (`evaluation-engine.ts`)

**Purpose**: LLM-based grading and assessment generation (~1150 lines)

**Critical Pattern - Permissive JSON Parsing**:

```typescript
// Current implementation (lines ~300-350)
const jsonMatch = content.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('No JSON found in response');
}
const parsed = JSON.parse(jsonMatch[0]);

return {
  score: Math.min(parsed.score ?? 0, context.maxPoints),
  feedback: parsed.feedback ?? 'No feedback provided',
  strengths: parsed.strengths ?? [],
  improvements: parsed.improvements ?? [],
  // Every field has a fallback - masks quality issues!
};
```

**Problems**:
1. No schema validation (Zod not used)
2. Fallback values mask when AI returns garbage
3. Partial responses treated as valid
4. No quality thresholds before accepting

**Current Capabilities**:
- `evaluateSubjectiveResponse()` - Essay/open-ended grading
- `evaluateObjectiveAnswer()` - MCQ/true-false checking
- `generateAssessment()` - Create quizzes
- `generateAdaptiveQuestion()` - Next question based on performance
- `getStudentProgress()` - Aggregate performance metrics

---

### 1.3 Quality Gates & Pedagogical Evaluators

**Status**: Documented in Phase 3, **NOT IMPLEMENTED**

| Component | Location | Status |
|-----------|----------|--------|
| Content Quality Gates | `phase-3-advanced/02-content-quality-gates.md` | Not Started |
| Pedagogical Evaluators | `phase-3-advanced/03-pedagogical-evaluators.md` | Not Started |
| Self-Critique Loops | `phase-3-advanced/01-self-critique-loops.md` | Not Started |

**Planned Quality Gates (Not Built)**:
1. Completeness Gate
2. Example Quality Gate
3. Difficulty Match Gate
4. Structure Gate
5. Depth Gate

**Planned Pedagogical Evaluators (Not Built)**:
1. Bloom's Aligner - Ensures content matches cognitive objectives
2. Scaffolding Evaluator - Validates progressive complexity
3. ZPD Evaluator - Checks Zone of Proximal Development targeting
4. Socratic Evaluator - Validates questioning methodology

---

### 1.4 Orchestrator Integration

**Current State** (`packages/core/src/sam-orchestrator.ts`):
- Orchestrator exists with engine registry
- Evaluation engines are NOT registered
- No content validation pipeline before delivery
- Quality gates not wired into request flow

```typescript
// Current orchestrator - missing evaluation integration
class SAMOrchestrator {
  private engines: Map<string, SAMEngine>;

  async processRequest(request: SAMRequest): Promise<SAMResponse> {
    // 1. Route to appropriate engine
    // 2. Get response
    // 3. MISSING: Quality gate validation
    // 4. MISSING: Pedagogical evaluation
    // 5. Return response
  }
}
```

---

## 2. Prioritized Implementation Roadmap

### Priority 1: Unify Bloom's Engines (Week 1-2)

**Goal**: Single source of truth for Bloom's classification

**Approach**: Hybrid architecture using both engines

```typescript
// New unified interface
interface UnifiedBloomsEngine {
  // Quick classification (keyword-based, <10ms)
  quickClassify(content: string): BloomsLevel;

  // Full analysis (AI-powered, cached)
  analyze(content: string, options?: AnalysisOptions): Promise<BloomsAnalysis>;

  // Course-level analysis (comprehensive)
  analyzeCourse(courseId: string): Promise<CourseBloomsAnalysisResult>;
}

class HybridBloomsEngine implements UnifiedBloomsEngine {
  private keywordEngine: KeywordBloomsEngine;  // from packages/core
  private aiEngine: BloomsEngine;              // from packages/educational
  private cache: BloomsCache;

  async analyze(content: string, options?: AnalysisOptions): Promise<BloomsAnalysis> {
    // 1. Check cache first
    const cached = await this.cache.get(content);
    if (cached) return cached;

    // 2. Quick keyword classification
    const quickResult = this.keywordEngine.classify(content);

    // 3. If low confidence or complex content, use AI engine
    if (quickResult.confidence < 0.7 || options?.requireAI) {
      const aiResult = await this.aiEngine.analyze(content);
      await this.cache.set(content, aiResult);
      return aiResult;
    }

    return quickResult;
  }
}
```

**Deliverables**:
- [ ] `packages/educational/src/engines/unified-blooms-engine.ts`
- [ ] Migration guide for existing code
- [ ] Unit tests with coverage >90%
- [ ] Performance benchmarks

---

### Priority 2: Implement Content Quality Gates (Week 2-3)

**Goal**: Validate all AI-generated content before delivery

**Implementation Path**:

```typescript
// Quality gate pipeline
interface QualityGatePipeline {
  gates: QualityGate[];
  threshold: number;  // Minimum score to pass (default: 75)
  maxIterations: number;  // Max enhancement attempts (default: 2)
}

class ContentQualityGatePipeline {
  private gates: QualityGate[] = [
    new CompletenessGate(),
    new ExampleQualityGate(),
    new DifficultyMatchGate(),
    new StructureGate(),
    new DepthGate(),
  ];

  async validate(content: GeneratedContent): Promise<ValidationResult> {
    const results = await Promise.all(
      this.gates.map(gate => gate.evaluate(content))
    );

    const overallScore = this.calculateWeightedScore(results);
    const failedGates = results.filter(r => !r.passed);

    if (failedGates.length === 0) {
      return { passed: true, score: overallScore, content };
    }

    // Attempt enhancement
    const enhanced = await this.enhance(content, failedGates);
    return this.validate(enhanced);  // Re-validate enhanced content
  }
}
```

**Deliverables**:
- [ ] `lib/sam/quality-gates/completeness-gate.ts`
- [ ] `lib/sam/quality-gates/example-quality-gate.ts`
- [ ] `lib/sam/quality-gates/difficulty-gate.ts`
- [ ] `lib/sam/quality-gates/structure-gate.ts`
- [ ] `lib/sam/quality-gates/depth-gate.ts`
- [ ] `lib/sam/quality-gates/pipeline.ts`
- [ ] Integration tests

---

### Priority 3: Add Strict JSON Schema Validation (Week 3)

**Goal**: Replace permissive parsing with Zod validation

**Before (Dangerous)**:
```typescript
const parsed = JSON.parse(jsonMatch[0]);
return {
  score: parsed.score ?? 0,  // Accepts anything!
  feedback: parsed.feedback ?? 'No feedback',
};
```

**After (Safe)**:
```typescript
import { z } from 'zod';

const EvaluationResponseSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(10),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;

function parseEvaluationResponse(content: string): EvaluationResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new EvaluationParsingError('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const result = EvaluationResponseSchema.safeParse(parsed);

  if (!result.success) {
    // Log detailed error for debugging
    logger.error('Evaluation response validation failed', {
      errors: result.error.flatten(),
      rawContent: content,
    });
    throw new EvaluationValidationError(result.error);
  }

  return result.data;
}
```

**Deliverables**:
- [ ] Zod schemas for all evaluation responses
- [ ] Error tracking for validation failures
- [ ] Retry logic with different prompts on failure
- [ ] Dashboard for monitoring validation rates

---

### Priority 4: Wire Engines into Orchestrator (Week 4-5)

**Goal**: Connect evaluation engines to request pipeline

**Current Flow**:
```
Request → Orchestrator → Engine → Response → Deliver
```

**Target Flow**:
```
Request → Orchestrator → Engine → Response
                                     ↓
                              Quality Gates
                                     ↓
                          Pedagogical Evaluators
                                     ↓
                          [Enhance if needed]
                                     ↓
                              Final Delivery
```

**Implementation**:

```typescript
// Updated orchestrator
class SAMOrchestrator {
  private qualityPipeline: ContentQualityGatePipeline;
  private bloomsEvaluator: UnifiedBloomsEngine;

  async processRequest(request: SAMRequest): Promise<SAMResponse> {
    // 1. Generate initial response
    const engine = this.getEngine(request.type);
    const initialResponse = await engine.process(request);

    // 2. Run quality gates
    const qualityResult = await this.qualityPipeline.validate(initialResponse);
    if (!qualityResult.passed) {
      // Log and potentially regenerate
      await this.handleQualityFailure(request, qualityResult);
    }

    // 3. Bloom's analysis for educational content
    if (request.requiresBloomsAlignment) {
      const bloomsAnalysis = await this.bloomsEvaluator.analyze(
        qualityResult.content,
        { targetLevel: request.targetBloomsLevel }
      );

      if (!this.isBloomsAligned(bloomsAnalysis, request.targetBloomsLevel)) {
        return this.adjustForBloomsLevel(qualityResult.content, request);
      }
    }

    // 4. Return validated, aligned response
    return this.buildResponse(qualityResult.content, {
      qualityScore: qualityResult.score,
      bloomsAnalysis,
    });
  }
}
```

**Deliverables**:
- [ ] Updated `sam-orchestrator.ts` with pipeline integration
- [ ] Quality gate hooks in request flow
- [ ] Bloom's alignment validation
- [ ] Integration tests for full pipeline

---

### Priority 5: Implement Pedagogical Evaluators (Week 5-6)

**Goal**: Validate educational effectiveness of content

**Components**:

#### 5.1 Bloom's Aligner
```typescript
class BloomsAligner {
  async evaluate(content: string, target: BloomsLevel): Promise<AlignmentResult> {
    const analysis = await this.bloomsEngine.analyze(content);
    const dominant = analysis.dominantLevel;

    return {
      aligned: dominant === target || this.isAcceptableVariation(dominant, target),
      currentLevel: dominant,
      targetLevel: target,
      adjustment: this.suggestAdjustment(dominant, target),
    };
  }
}
```

#### 5.2 Scaffolding Evaluator
```typescript
class ScaffoldingEvaluator {
  async evaluate(content: string, priorKnowledge: string[]): Promise<ScaffoldingResult> {
    // Check if content builds on prior knowledge
    // Verify progressive complexity
    // Ensure no knowledge gaps
  }
}
```

#### 5.3 ZPD (Zone of Proximal Development) Evaluator
```typescript
class ZPDEvaluator {
  async evaluate(
    content: string,
    studentProfile: StudentProfile
  ): Promise<ZPDResult> {
    // Check if content is in student's ZPD
    // Not too easy (boring) or too hard (frustrating)
    // Just right for learning
  }
}
```

**Deliverables**:
- [ ] `lib/sam/pedagogical/blooms-aligner.ts`
- [ ] `lib/sam/pedagogical/scaffolding-evaluator.ts`
- [ ] `lib/sam/pedagogical/zpd-evaluator.ts`
- [ ] Integration with student profiles

---

### Priority 6: Add Calibration Loop (Week 6-8)

**Goal**: Continuous improvement through human feedback

**Architecture**:

```typescript
interface CalibrationLoop {
  // Collect evaluation samples
  collectSample(evaluation: Evaluation, humanReview?: HumanReview): void;

  // Analyze drift between AI and human ratings
  analyzeDrift(): DriftAnalysis;

  // Adjust evaluation parameters
  calibrate(): CalibrationResult;
}

class EvaluationCalibrator implements CalibrationLoop {
  private sampleStore: CalibrationSampleStore;
  private driftThreshold = 0.15;  // 15% drift triggers alert

  async collectSample(evaluation: Evaluation, humanReview?: HumanReview) {
    await this.sampleStore.save({
      evaluationId: evaluation.id,
      aiScore: evaluation.score,
      humanScore: humanReview?.score,
      timestamp: new Date(),
      context: evaluation.context,
    });
  }

  async analyzeDrift(): Promise<DriftAnalysis> {
    const samples = await this.sampleStore.getRecentWithHumanReview(100);

    const correlation = this.calculateCorrelation(
      samples.map(s => s.aiScore),
      samples.map(s => s.humanScore)
    );

    const meanDrift = this.calculateMeanDrift(samples);

    return {
      correlation,
      meanDrift,
      driftExceedsThreshold: meanDrift > this.driftThreshold,
      samplesAnalyzed: samples.length,
      recommendations: this.generateRecommendations(correlation, meanDrift),
    };
  }

  async calibrate(): Promise<CalibrationResult> {
    const drift = await this.analyzeDrift();

    if (drift.driftExceedsThreshold) {
      // Adjust scoring parameters
      // Update prompts
      // Notify team
    }

    return {
      calibrated: true,
      adjustments: this.getAdjustments(),
      nextCalibration: this.scheduleNext(),
    };
  }
}
```

**Human Review Interface**:
- Teacher dashboard for reviewing AI evaluations
- Easy override with reason capture
- Feedback loop to calibration system

**Deliverables**:
- [ ] `lib/sam/calibration/calibrator.ts`
- [ ] `lib/sam/calibration/sample-store.ts`
- [ ] Teacher review UI component
- [ ] Drift monitoring dashboard
- [ ] Weekly calibration job

---

### Priority 7: Close the Loop with Memory + Personalization (Week 7-8)

**Goal**: Evaluation outcomes must update student profiles and guide future instruction

**Problem**: The educational Bloom's engine has update hooks (`updateCognitiveProgress`, `recordIntervention`), but these aren't consistently called, and results don't persist reliably.

**Implementation**:

```typescript
class EvaluationMemoryIntegration {
  private memoryEngine: MemoryEngine;
  private studentProfileStore: StudentProfileStore;

  async recordEvaluationOutcome(
    studentId: string,
    evaluation: EvaluationResult
  ): Promise<void> {
    // 1. Update mastery levels based on evaluation
    await this.studentProfileStore.updateMastery(studentId, {
      topicId: evaluation.topicId,
      bloomsLevel: evaluation.bloomsLevel,
      score: evaluation.score,
      timestamp: new Date(),
    });

    // 2. Adjust learning pathway
    const profile = await this.studentProfileStore.get(studentId);
    const adjustedPathway = this.recalculatePathway(profile, evaluation);
    await this.studentProfileStore.updatePathway(studentId, adjustedPathway);

    // 3. Update spaced repetition schedule
    if (evaluation.score < 70) {
      await this.scheduleReview(studentId, evaluation.topicId, 'soon');
    } else {
      await this.scheduleReview(studentId, evaluation.topicId, 'standard');
    }

    // 4. Store in long-term memory for context
    await this.memoryEngine.store({
      userId: studentId,
      type: 'EVALUATION_OUTCOME',
      content: evaluation,
      importance: this.calculateImportance(evaluation),
    });
  }
}
```

**Deliverables**:
- [ ] `lib/sam/memory/evaluation-memory-integration.ts`
- [ ] Student profile update triggers
- [ ] Pathway recalculation logic
- [ ] Spaced repetition schedule updates

---

### Priority 8: Harden Assessment Reliability (Week 8)

**Goal**: Ensure grading consistency through dual-pass scoring and calibration anchors

**Problem**: `evaluation-engine.ts` relies on single LLM pass without verification, risking inconsistent grading.

**Implementation**:

```typescript
class HardenedAssessmentEvaluator {
  async evaluateWithVerification(
    response: StudentResponse,
    rubric: Rubric
  ): Promise<VerifiedEvaluation> {
    // 1. Primary LLM evaluation
    const primaryScore = await this.llmEvaluate(response, rubric);

    // 2. Rules-based scoring for objective components
    const rulesScore = this.rulesBasedScore(response, rubric);

    // 3. Check agreement
    const scoreDifference = Math.abs(primaryScore.score - rulesScore.score);

    if (scoreDifference > this.toleranceThreshold) {
      // 4. Dual-pass: Second LLM evaluation with different prompt
      const secondaryScore = await this.llmEvaluateAlternate(response, rubric);

      // 5. Use median or flag for human review
      if (this.needsHumanReview(primaryScore, secondaryScore, rulesScore)) {
        return this.flagForReview(response, { primaryScore, secondaryScore, rulesScore });
      }

      return this.aggregateScores(primaryScore, secondaryScore, rulesScore);
    }

    return primaryScore;
  }

  // Adversarial testing for answer-key verification
  async verifyAnswerKey(
    question: Question,
    expectedAnswer: string
  ): Promise<AnswerKeyVerification> {
    // Generate adversarial variations
    const variations = await this.generateAdversarialAnswers(question, expectedAnswer);

    // Score each variation
    const results = await Promise.all(
      variations.map(v => this.scoreAnswer(question, v))
    );

    // Check for false positives/negatives
    return this.analyzeAnswerKeyReliability(results);
  }
}
```

**Deliverables**:
- [ ] `lib/sam/evaluation/hardened-evaluator.ts`
- [ ] Dual-pass scoring logic
- [ ] Rules-based scoring module
- [ ] Adversarial test generator
- [ ] Human review flagging system

---

### Priority 9: Prevent Evaluation Drift (Week 8)

**Goal**: Freeze prompts/model versions and add regression tests

**Problem**: Model updates can silently alter grading behavior without detection.

**Implementation**:

```typescript
// Versioned evaluation configuration
interface EvaluationConfig {
  version: string;
  modelId: string;          // e.g., 'claude-3-5-sonnet-20241022'
  promptVersion: string;    // Semantic version of prompts
  rubricVersion: string;
  frozenAt: Date;
}

class EvaluationVersionController {
  private configs: Map<string, EvaluationConfig>;

  // Lock configuration for production
  freezeConfig(configId: string): void {
    const config = this.configs.get(configId);
    if (!config) throw new Error('Config not found');

    config.frozenAt = new Date();
    this.saveToDatabase(config);
  }

  // Regression test suite
  async runRegressionTests(configId: string): Promise<RegressionReport> {
    const config = this.configs.get(configId);
    const testCases = await this.loadGoldenTestCases();

    const results = await Promise.all(
      testCases.map(async tc => ({
        testCase: tc,
        expectedScore: tc.expectedScore,
        actualScore: await this.evaluate(tc.input, config),
      }))
    );

    const drift = this.calculateDrift(results);

    if (drift > this.driftThreshold) {
      await this.alertTeam('Evaluation drift detected', { configId, drift, results });
    }

    return { configId, drift, passed: drift <= this.driftThreshold, results };
  }
}

// Golden test cases for regression
interface GoldenTestCase {
  id: string;
  input: StudentResponse;
  rubric: Rubric;
  expectedScore: number;
  expectedFeedback: string[];
  tolerance: number;  // Acceptable deviation
}
```

**Deliverables**:
- [ ] `lib/sam/evaluation/version-controller.ts`
- [ ] Prompt versioning system
- [ ] Golden test case repository
- [ ] Regression test runner
- [ ] Drift alerting system

---

### Priority 10: Safety + Fairness Checks (Week 8)

**Goal**: Ensure evaluation feedback avoids bias and discouraging language

**Problem**: AI-generated feedback may contain implicit bias or demotivating phrasing.

**Implementation**:

```typescript
class FairnessSafetyValidator {
  private biasPatterns: RegExp[];
  private discouragingPhrases: string[];

  async validateFeedback(feedback: EvaluationFeedback): Promise<SafetyResult> {
    const issues: SafetyIssue[] = [];

    // 1. Check for discouraging language
    const discouraging = this.checkDiscouragingLanguage(feedback.text);
    if (discouraging.found) {
      issues.push({
        type: 'DISCOURAGING_LANGUAGE',
        severity: 'HIGH',
        details: discouraging.matches,
        suggestion: this.suggestPositiveAlternative(discouraging.matches),
      });
    }

    // 2. Check for demographic bias indicators
    const biasCheck = await this.checkForBias(feedback);
    if (biasCheck.detected) {
      issues.push({
        type: 'POTENTIAL_BIAS',
        severity: 'CRITICAL',
        details: biasCheck.indicators,
      });
    }

    // 3. Check accessibility (reading level, clarity)
    const accessibility = this.checkAccessibility(feedback.text);
    if (!accessibility.passed) {
      issues.push({
        type: 'ACCESSIBILITY',
        severity: 'MEDIUM',
        details: accessibility.issues,
      });
    }

    // 4. Ensure constructive framing
    const constructive = this.checkConstructiveFraming(feedback);
    if (!constructive.passed) {
      issues.push({
        type: 'NON_CONSTRUCTIVE',
        severity: 'MEDIUM',
        details: constructive.issues,
      });
    }

    return {
      passed: issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0,
      issues,
      recommendations: this.generateRecommendations(issues),
    };
  }

  // Periodic fairness audit
  async runFairnessAudit(evaluations: Evaluation[]): Promise<FairnessAuditReport> {
    // Group by demographic indicators if available
    // Check for score distribution disparities
    // Analyze feedback sentiment by group
    // Generate recommendations
  }
}
```

**Deliverables**:
- [x] `lib/sam/safety/fairness-validator.ts` ✅ COMPLETED
- [x] Discouraging language detector (`lib/sam/safety/discouraging-language-detector.ts`) ✅ COMPLETED
- [x] Bias pattern library (`lib/sam/safety/bias-detector.ts`) ✅ COMPLETED
- [x] Accessibility checker (`lib/sam/safety/accessibility-checker.ts`) ✅ COMPLETED
- [x] Constructive framing checker (`lib/sam/safety/constructive-framing-checker.ts`) ✅ COMPLETED
- [x] Periodic fairness audit job (`lib/sam/safety/fairness-auditor.ts`) ✅ COMPLETED
- [x] Types and module exports (`lib/sam/safety/types.ts`, `lib/sam/safety/index.ts`) ✅ COMPLETED
- [ ] Dashboard for safety metrics (UI - Future)

---

## 3. Architecture Decisions

### 3.1 Unified vs Separate Engines

**Decision**: Hybrid approach - unified interface with pluggable backends

**Rationale**:
- Keyword engine for speed (<10ms)
- AI engine for accuracy (when needed)
- Single interface for consumers
- Gradual migration path

### 3.2 Quality Gate Ordering

**Decision**: Run gates in parallel, not serial

**Rationale**:
- Faster overall validation
- All issues identified at once
- Single enhancement pass with all feedback

### 3.3 Schema Validation Strategy

**Decision**: Strict validation with retry

**Rationale**:
- Fail fast on bad responses
- Retry with modified prompt before failing
- Never deliver unvalidated content

### 3.4 Calibration Frequency

**Decision**: Weekly automated + trigger-based

**Rationale**:
- Weekly catches gradual drift
- Triggers catch sudden changes
- Human review sampled, not exhaustive

---

## 4. Success Criteria

### Technical Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Bloom's Classification Consistency | Unknown | >95% | Same content = same level |
| Quality Gate Pass Rate | N/A | 85% | First-pass approval |
| JSON Validation Failure Rate | Unknown | <2% | Schema validation failures |
| Quality Gate Latency | N/A | <500ms | All gates combined |
| Evaluation Drift | Unknown | <10% | AI vs human correlation |
| Regression Test Pass Rate | N/A | 100% | Golden test cases |
| Dual-Pass Agreement Rate | N/A | >90% | LLM vs rules scoring |

### Quality Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Content Completeness | Unknown | >90% | Gate scores |
| Example Quality | Unknown | >85% | Gate scores |
| Bloom's Alignment | Unknown | >90% | Aligner scores |
| Student Comprehension | Unknown | +35% | User surveys |

### Pedagogical KPIs (from standards docs)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Bloom's Alignment Rate | Unknown | >90% | Content matches target level |
| Scaffolding Presence | Unknown | >85% | Progressive complexity detected |
| ZPD Targeting | Unknown | >80% | Content in student's ZPD |
| Grading Consistency | Unknown | >95% | Same answer = same score |
| Assessment Validity | Unknown | >90% | Questions measure intended skills |

### Safety & Fairness Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Discouraging Language | Unknown | 0% | Automated detection |
| Bias Incidents | Unknown | 0 | Fairness audit findings |
| Accessibility Score | Unknown | >90% | Reading level appropriateness |
| Constructive Feedback Rate | Unknown | >95% | Positive framing analysis |

### Business Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Teacher Override Rate | Unknown | <5% | Manual corrections |
| Student Satisfaction | Unknown | >4.7/5 | NPS/ratings |
| Support Tickets (Quality) | Unknown | -50% | Ticket analysis |
| Profile Update Rate | Unknown | 100% | Evaluations update student data |

---

## 5. Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| Performance degradation from gates | Parallel execution, caching, timeouts |
| AI API costs increase | Gate early with cheap checks, cache aggressively |
| False rejections frustrate users | Tunable thresholds, gradual rollout |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| Schema changes break parsing | Version schemas, graceful degradation |
| Calibration data insufficient | Incentivize teacher reviews |
| Engine migration breaks existing code | Adapter pattern, deprecation warnings |

### Low Risk

| Risk | Mitigation |
|------|------------|
| Gate ordering affects results | Parallel execution, order-independent |
| Bloom's levels subjective | Multiple evaluators, consensus |

---

## 6. Implementation Schedule

```
Week 1-2: Unified Bloom's Engine (Priority 1)
├── Day 1-2:   Design unified interface
├── Day 3-5:   Implement hybrid engine
├── Day 6-8:   Migrate existing consumers
└── Day 9-10:  Testing and documentation

Week 2-3: Content Quality Gates (Priority 2)
├── Day 1-2:   Completeness gate
├── Day 3:     Example quality gate
├── Day 4:     Difficulty gate
├── Day 5:     Structure gate
├── Day 6:     Depth gate
└── Day 7-10:  Pipeline orchestration

Week 3: JSON Schema Validation (Priority 3)
├── Day 1-2:   Define all Zod schemas
├── Day 3-4:   Replace parsing code
├── Day 5:     Error handling and retry
└── Day 6-7:   Monitoring dashboards

Week 4-5: Orchestrator Integration (Priority 4)
├── Day 1-3:   Wire quality gates
├── Day 4-6:   Wire Bloom's evaluator
├── Day 7-10:  Integration testing
└── Day 11-14: Performance optimization

Week 5-6: Pedagogical Evaluators (Priority 5)
├── Day 1-3:   Bloom's aligner
├── Day 4-6:   Scaffolding evaluator
├── Day 7-10:  ZPD evaluator
└── Day 11-14: Integration and testing

Week 6-7: Calibration Loop (Priority 6)
├── Day 1-5:   Calibrator implementation
├── Day 6-10:  Teacher review UI
├── Day 11-14: Drift monitoring
└── Day 15:    Testing

Week 7-8: Memory + Personalization (Priority 7)
├── Day 1-3:   Evaluation memory integration
├── Day 4-5:   Student profile update triggers
├── Day 6-7:   Pathway recalculation logic
└── Day 8-10:  Spaced repetition integration

Week 8: Hardening & Safety (Priorities 8-10)
├── Day 1-3:   Dual-pass scoring (Priority 8)
├── Day 4-5:   Version controller & regression tests (Priority 9)
├── Day 6-8:   Safety/fairness validator (Priority 10)
└── Day 9-10:  Final integration & launch
```

**Total Timeline**: 8 weeks (expanded from original 6-8 weeks estimate)

---

## 7. Dependencies

### Phase Dependencies

```
Priority 1 (Bloom's Unification)
    ↓
    └→ Enables Priority 5 (Pedagogical Evaluators)

Priority 2 (Quality Gates) + Priority 3 (Schema Validation)
    ↓
    └→ Enables Priority 4 (Orchestrator Integration)

Priority 4 (Orchestrator Integration)
    ↓
    ├→ Enables Priority 6 (Calibration Loop)
    └→ Enables Priority 7 (Memory Integration)

Priority 6 (Calibration Loop)
    ↓
    └→ Enables Priority 9 (Evaluation Drift Prevention)

Priority 3 (Schema Validation) + Priority 5 (Pedagogical Evaluators)
    ↓
    └→ Enables Priority 8 (Assessment Hardening)

Priority 4 (Orchestrator Integration)
    ↓
    └→ Enables Priority 10 (Safety/Fairness Checks)
```

### External Dependencies

- Claude API access (Anthropic)
- Redis for caching (already deployed)
- PostgreSQL for calibration data (already deployed)
- Student profile store (Phase 2 Memory System)

---

## 8. Related Documents

- [Phase 3 Overview](./phase-3-advanced/README.md)
- [Content Quality Gates Spec](./phase-3-advanced/02-content-quality-gates.md)
- [Pedagogical Evaluators Spec](./phase-3-advanced/03-pedagogical-evaluators.md)
- [Self-Critique Loops](./phase-3-advanced/01-self-critique-loops.md)
- [Master Roadmap](./00-MASTER-ROADMAP.md)

---

## 9. Appendix: Code Locations

### Existing Files (To Modify)

| Component | File Path |
|-----------|-----------|
| Core Bloom's Engine | `packages/core/src/engines/blooms.ts` |
| Educational Bloom's Engine | `packages/educational/src/engines/blooms-engine.ts` |
| Evaluation Engine | `packages/educational/src/engines/evaluation-engine.ts` |
| SAM Orchestrator | `packages/core/src/sam-orchestrator.ts` |
| Achievement Adapter | `lib/adapters/achievement-adapter.ts` |
| Specialized Adapters | `lib/adapters/specialized-adapters.ts` |
| Evaluation Standards Doc | `docs/features/sam-ai-system/guides/SAM_EVALUATION_STANDARDS_DOCUMENTATION.md` |
| Portability Plan | `docs/SAM_PORTABILITY_PLAN.md` |

### New Files (To Create)

| Priority | Component | File Path |
|----------|-----------|-----------|
| 1 | Unified Bloom's Engine | `packages/educational/src/engines/unified-blooms-engine.ts` |
| 2 | Completeness Gate | `lib/sam/quality-gates/completeness-gate.ts` |
| 2 | Example Quality Gate | `lib/sam/quality-gates/example-quality-gate.ts` |
| 2 | Difficulty Gate | `lib/sam/quality-gates/difficulty-gate.ts` |
| 2 | Structure Gate | `lib/sam/quality-gates/structure-gate.ts` |
| 2 | Depth Gate | `lib/sam/quality-gates/depth-gate.ts` |
| 2 | Pipeline Orchestrator | `lib/sam/quality-gates/pipeline.ts` |
| 3 | Evaluation Schemas | `lib/sam/schemas/evaluation-schemas.ts` |
| 5 | Bloom's Aligner | `lib/sam/pedagogical/blooms-aligner.ts` |
| 5 | Scaffolding Evaluator | `lib/sam/pedagogical/scaffolding-evaluator.ts` |
| 5 | ZPD Evaluator | `lib/sam/pedagogical/zpd-evaluator.ts` |
| 6 | Calibrator | `lib/sam/calibration/calibrator.ts` |
| 6 | Sample Store | `lib/sam/calibration/sample-store.ts` |
| 7 | Memory Integration | `lib/sam/memory/evaluation-memory-integration.ts` |
| 8 | Hardened Evaluator | `lib/sam/evaluation/hardened-evaluator.ts` |
| 9 | Version Controller | `lib/sam/evaluation/version-controller.ts` |
| 10 | Fairness Validator | `lib/sam/safety/fairness-validator.ts` |

---

## 10. Traceability Matrix

### Mapping Analysis Recommendations to Implementation Priorities

| # | Recommendation (from Analysis) | Priority | Status |
|---|-------------------------------|----------|--------|
| 1 | Unify the Bloom engines | Priority 1 | ✅ Completed |
| 2 | Wire evaluation engines into orchestrator | Priority 4 | ✅ Completed |
| 3 | Add pedagogy-first quality gate | Priority 2, 5 | ✅ Completed |
| 4 | Make evaluation outputs schema-validated | Priority 3 | ✅ Completed |
| 5 | Build calibration + human-review loops | Priority 6 | ✅ Completed |
| 6 | Instrument with pedagogical KPIs | Success Criteria | ✅ Completed |
| 7 | Close the loop with memory + personalization | Priority 7 | ✅ Completed |
| 8 | Harden assessment reliability | Priority 8 | ✅ Completed |
| 9 | Prevent evaluation drift | Priority 9 | ✅ Completed |
| 10 | Safety + fairness checks | Priority 10 | ✅ Completed |

### Source Documents Referenced

| Document | Key Insights |
|----------|--------------|
| `packages/core/src/engines/blooms.ts` | Keyword-only classifier, brittle to synonyms |
| `packages/educational/src/engines/blooms-engine.ts` | AI+DB hybrid, isolated from orchestrator |
| `packages/educational/src/engines/evaluation-engine.ts` | Permissive JSON parsing, single-pass grading |
| `docs/SAM_EVALUATION_STANDARDS_DOCUMENTATION.md` | Multi-engine evaluation requirements |
| `docs/SAM_PORTABILITY_PLAN.md` | Engine fragmentation and isolation issues |
| `phase-3-advanced/02-content-quality-gates.md` | Quality gate specifications (not implemented) |
| `phase-3-advanced/03-pedagogical-evaluators.md` | Pedagogical evaluator specs (not implemented) |

---

**Document Status**: ✅ COMPLETED - All Priorities Implemented
**Last Updated**: December 2025
**Completed**: December 2025
**Owner**: AI/ML Engineering Team
**Reviewers**: Engineering Lead, Product Manager

---

## 11. Implementation Summary

All 10 priorities have been successfully implemented:

| Priority | Component | Location |
|----------|-----------|----------|
| 1 | Unified Bloom's Engine | `lib/sam/engine-presets.ts` |
| 2 | Content Quality Gates | `lib/sam/quality-gates/` |
| 3 | Schema Validation | `lib/sam/schemas/` |
| 4 | Enhanced Orchestrator | `lib/sam/orchestrator/` |
| 5 | Pedagogical Evaluators | `lib/sam/pedagogical/` |
| 6 | Calibration Loop | `lib/sam/calibration/` |
| 7 | Memory Integration | `lib/sam/memory/` |
| 8 | Hardened Evaluation | `lib/sam/evaluation/` |
| 9 | Version Control | `lib/sam/version-control/` |
| 10 | Safety + Fairness | `lib/sam/safety/` |

All modules are exported from `lib/sam/index.ts` for unified access.

---

*Implementation complete. This document serves as a reference for the architecture decisions and implementation details.*
