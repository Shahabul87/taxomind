# Taxomind Advanced Exam Evaluation System

## Overview

The Taxomind Advanced Exam Evaluation System is a comprehensive, enterprise-grade assessment platform that implements international standards for academic integrity, accessibility, and interoperability. This document provides detailed documentation on all system components and their usage.

---

## Table of Contents

1. [Academic Integrity (Plagiarism Detection)](#1-academic-integrity-plagiarism-detection)
2. [LMS Interoperability](#2-lms-interoperability)
3. [WCAG Accessibility Compliance](#3-wcag-accessibility-compliance)
4. [Proctoring System](#4-proctoring-system)
5. [Computer Adaptive Testing (CAT/IRT)](#5-computer-adaptive-testing-catirt)
6. [Peer Review Workflow](#6-peer-review-workflow)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)

---

## 1. Academic Integrity (Plagiarism Detection)

### Overview

The SAM Integrity Engine (`sam-integrity-engine.ts`) provides comprehensive plagiarism detection and AI-generated content analysis using multiple detection methods.

### Features

- **Text Similarity Detection**: Compares submissions against internal database and external sources
- **AI Content Detection**: Identifies AI-generated text using perplexity and burstiness analysis
- **Code Plagiarism Detection**: AST-based structural similarity for code submissions
- **Self-Plagiarism Detection**: Checks against student's own previous submissions
- **Multi-Language Support**: Supports 50+ languages with proper tokenization

### Usage

```typescript
import { SAMIntegrityEngine, createIntegrityEngine } from '@/lib/sam-engines/educational/sam-integrity-engine';

// Create engine instance
const engine = createIntegrityEngine({
  similarityThreshold: 0.3,      // 30% similarity threshold
  aiDetectionEnabled: true,
  selfPlagiarismCheck: true,
  externalSourceCheck: true,
  storeResults: true
});

// Analyze a submission
const report = await engine.analyzeSubmission({
  submissionId: 'sub_123',
  studentId: 'user_456',
  examId: 'exam_789',
  content: 'Student submission text...',
  submissionType: 'essay',
  metadata: {
    wordCount: 1500,
    submittedAt: new Date()
  }
});

// Report structure
console.log(report.overallRisk);        // 'low' | 'medium' | 'high' | 'critical'
console.log(report.plagiarism.score);   // 0-1 similarity score
console.log(report.aiDetection.isLikelyAI); // boolean
console.log(report.recommendations);    // Array of action items
```

### Risk Levels

| Level | Similarity | Action |
|-------|------------|--------|
| Low | < 15% | No action required |
| Medium | 15-30% | Review recommended |
| High | 30-50% | Investigation required |
| Critical | > 50% | Academic integrity violation |

### Database Model

```prisma
model IntegrityReport {
  id                String   @id @default(cuid())
  submissionId      String
  studentId         String
  examId            String
  overallRisk       RiskLevel
  similarityScore   Float?
  aiProbability     Float?
  // ... see full schema
}
```

---

## 2. LMS Interoperability

### Overview

The interoperability module provides standards-compliant integration with external Learning Management Systems through three protocols:

- **xAPI 1.0.3** (Experience API / Tin Can)
- **QTI 2.1** (Question and Test Interoperability)
- **SCORM 2004 4th Edition**

### 2.1 xAPI Client

The xAPI client tracks learning activities and sends statements to a Learning Record Store (LRS).

```typescript
import { getxAPIService, XAPI_VERBS, XAPI_ACTIVITY_TYPES } from '@/lib/interoperability';

// Initialize service
const xapi = getxAPIService({
  endpoint: 'https://lrs.example.com/xapi',
  username: 'api_key',
  password: 'api_secret',
  version: '1.0.3'
});

// Track exam completion
await xapi.trackExamAttempt(
  'user_123',                    // Actor
  'exam_456',                    // Exam ID
  'completed',                   // Verb
  {
    score: { scaled: 0.85, raw: 85, min: 0, max: 100 },
    success: true,
    duration: 'PT45M30S'         // ISO 8601 duration
  }
);

// Query statements
const statements = await xapi.getStatements({
  agent: { mbox: 'mailto:student@example.com' },
  verb: XAPI_VERBS.COMPLETED,
  since: '2024-01-01T00:00:00Z'
});
```

### 2.2 QTI 2.1 Export/Import

Export and import questions/exams in IMS QTI 2.1 format.

```typescript
import { createQTIExporter, createQTIImporter } from '@/lib/interoperability';

// Export exam to QTI
const exporter = createQTIExporter();
const qtiPackage = await exporter.exportExam({
  examId: 'exam_123',
  title: 'Final Examination',
  questions: [
    {
      id: 'q1',
      type: 'choice',
      prompt: 'What is 2+2?',
      choices: [
        { id: 'a', text: '3', correct: false },
        { id: 'b', text: '4', correct: true },
        { id: 'c', text: '5', correct: false }
      ],
      points: 10
    }
  ]
}, {
  includeMetadata: true,
  includeRubrics: true
});

// Import QTI package
const importer = createQTIImporter();
const importedExam = await importer.importPackage(qtiXmlContent);
```

### 2.3 SCORM 2004 Wrapper

Full SCORM 2004 4th Edition implementation for content packaging and runtime.

```typescript
import { taxomindSCORM, SCORMManifestGenerator } from '@/lib/interoperability';

// Initialize SCORM session
const scorm = taxomindSCORM.createSession({
  userId: 'user_123',
  examId: 'exam_456',
  organizationId: 'org_789'
});

// Start session
await scorm.initialize();

// Track progress
scorm.setProgress(0.5);              // 50% complete
scorm.setScore(75, 0, 100);          // Score: 75/100
scorm.setCompletionStatus('incomplete');
scorm.setSuccessStatus('unknown');

// Record interaction
scorm.recordInteraction({
  id: 'q1',
  type: 'choice',
  learnerResponse: 'b',
  result: 'correct',
  latency: 'PT30S'
});

// Commit data to LMS
await scorm.commit();

// Generate manifest for content packaging
const manifest = new SCORMManifestGenerator();
const imsManifest = manifest.generate({
  identifier: 'taxomind_course_123',
  title: 'Introduction to Mathematics',
  version: '1.0',
  scos: [
    { id: 'sco1', title: 'Module 1', href: 'module1/index.html' },
    { id: 'sco2', title: 'Module 2', href: 'module2/index.html' }
  ]
});
```

---

## 3. WCAG Accessibility Compliance

### Overview

The accessibility module (`wcag-utils.ts`) provides WCAG 2.1 Level AA compliance utilities for creating accessible exam interfaces.

### 3.1 Color Contrast

```typescript
import { WCAGColorContrast } from '@/lib/accessibility';

const contrast = new WCAGColorContrast();

// Check contrast ratio
const ratio = contrast.getContrastRatio('#000000', '#FFFFFF'); // 21:1

// Validate WCAG compliance
const isAACompliant = contrast.meetsWCAG('#333333', '#FFFFFF', 'AA', 'normal');
const isAAACompliant = contrast.meetsWCAG('#333333', '#FFFFFF', 'AAA', 'large');

// Find accessible alternatives
const suggestions = contrast.suggestAccessibleColors('#777777', '#FFFFFF');
```

### 3.2 Screen Reader Utilities

```typescript
import { ScreenReaderUtils } from '@/lib/accessibility';

const sr = new ScreenReaderUtils();

// Generate ARIA labels
const label = sr.generateAriaLabel('question', {
  number: 5,
  total: 20,
  type: 'multiple-choice',
  required: true,
  timeRemaining: 300
});
// Output: "Question 5 of 20, multiple-choice, required, 5 minutes remaining"

// Create live region announcements
const announcement = sr.createLiveRegion('Your answer has been saved', 'polite');
```

### 3.3 Keyboard Navigation

```typescript
import { KeyboardNavigationUtils } from '@/lib/accessibility';

const keyboard = new KeyboardNavigationUtils();

// Create focus trap for modal dialogs
const trap = keyboard.createFocusTrap(modalElement);
trap.activate();
// ... user interacts with modal
trap.deactivate();

// Generate keyboard shortcuts help
const shortcuts = keyboard.getKeyboardShortcuts('exam');
// Returns array of { key, description, action }
```

### 3.4 Time Accommodations

```typescript
import { TimeAccommodationCalculator } from '@/lib/accessibility';

const calculator = new TimeAccommodationCalculator();

// Calculate extended time
const accommodation = calculator.calculateAccommodation({
  baseTime: 60,              // 60 minutes
  accommodationType: 'extended_time',
  multiplier: 1.5,           // 50% extra time
  breakTime: 10              // 10 min break allowance
});
// Result: { totalTime: 100, examTime: 90, breakTime: 10, ... }
```

### 3.5 Accessibility Audit

```typescript
import { AccessibilityAuditor } from '@/lib/accessibility';

const auditor = new AccessibilityAuditor();

// Audit exam content
const report = await auditor.auditExam(examElement);

console.log(report.score);           // 0-100 accessibility score
console.log(report.violations);      // Array of WCAG violations
console.log(report.warnings);        // Potential issues
console.log(report.recommendations); // Improvement suggestions
```

---

## 4. Proctoring System

### Overview

The Proctoring Engine (`proctor-engine.ts`) provides comprehensive exam monitoring with browser lockdown, violation detection, and integrity verification.

### Features

- **Browser Lockdown**: Prevents tab switching, copy/paste, and external resources
- **Violation Detection**: Monitors for suspicious behavior
- **System Checks**: Verifies hardware and browser requirements
- **Session Recording**: Maintains audit trail of all events

### Usage

```typescript
import { ProctorEngine, ProctorSystemCheck } from '@/lib/proctoring';

// Run system check before exam
const systemCheck = new ProctorSystemCheck();
const checkResult = await systemCheck.runFullCheck();

if (!checkResult.passed) {
  console.log('System requirements not met:', checkResult.failures);
  return;
}

// Initialize proctoring
const proctor = new ProctorEngine({
  sessionId: 'session_123',
  userId: 'user_456',
  examId: 'exam_789',
  config: {
    browserLockdown: true,
    tabSwitchDetection: true,
    copyPasteBlocking: true,
    rightClickDisabled: true,
    screenshotDetection: true,
    idleDetection: true,
    idleTimeout: 300,           // 5 minutes
    maxViolations: 3,
    autoTerminate: true
  }
});

// Start proctoring session
await proctor.startSession();

// Listen for violations
proctor.on('violation', (violation) => {
  console.log(`Violation: ${violation.type} - ${violation.severity}`);
  // Types: TAB_SWITCH, COPY_ATTEMPT, PASTE_ATTEMPT, RIGHT_CLICK,
  //        SCREENSHOT, IDLE, DEVTOOLS, EXTERNAL_DISPLAY
});

proctor.on('terminated', (reason) => {
  console.log(`Session terminated: ${reason}`);
});

// End session
const report = await proctor.endSession();
console.log(report.violations);
console.log(report.integrityScore);
```

### Violation Severity Levels

| Severity | Examples | Points |
|----------|----------|--------|
| Low | Right-click attempt | 1 |
| Medium | Tab switch, copy attempt | 3 |
| High | Screenshot, DevTools | 5 |
| Critical | Multiple displays | 10 |

### Generating Reports

```typescript
import { ProctorReportGenerator } from '@/lib/proctoring';

const reportGen = new ProctorReportGenerator();
const report = await reportGen.generateReport('session_123');

// Report includes:
// - Session timeline with all events
// - Violation summary with severity breakdown
// - Integrity score (0-100)
// - Recommendations for review
// - Evidence collection
```

---

## 5. Computer Adaptive Testing (CAT/IRT)

### Overview

The CAT/IRT Engine (`cat-irt-engine.ts`) implements Computer Adaptive Testing using Item Response Theory with the 3-Parameter Logistic (3PL) model.

### Key Concepts

- **IRT 3PL Model**: Estimates probability of correct response based on ability (θ), difficulty (b), discrimination (a), and guessing (c)
- **EAP Estimation**: Expected A-Posteriori ability estimation
- **Adaptive Selection**: Selects questions maximizing information at current ability level

### Usage

```typescript
import { CATEngine, IRTCalibration } from '@/lib/sam-engines/educational/cat-irt-engine';

// Initialize CAT engine
const cat = new CATEngine({
  itemBankId: 'bank_123',
  minItems: 10,
  maxItems: 30,
  minSE: 0.3,                // Stop when SE < 0.3
  maxTime: 3600,             // 60 minutes max
  contentBalancing: true,
  exposureControl: true
});

// Start adaptive session
const session = await cat.startSession('user_123', 'exam_456');

// Get next question (adaptively selected)
const nextQuestion = await cat.getNextItem(session.id);

// Submit response
const result = await cat.submitResponse(session.id, {
  itemId: nextQuestion.id,
  response: 'b',
  responseTime: 45000        // 45 seconds
});

console.log(result.currentAbility);   // θ estimate (-3 to +3)
console.log(result.standardError);    // Measurement precision
console.log(result.isComplete);       // Whether test should end

// Get final score
const score = await cat.getScore(session.id);
console.log(score.theta);             // Final ability estimate
console.log(score.percentile);        // Percentile rank
console.log(score.scaledScore);       // Scaled score (e.g., 200-800)
```

### Item Calibration

```typescript
// Calibrate items using response data
const calibration = new IRTCalibration();
const calibratedItems = await calibration.calibrateItems(
  responseData,               // Historical response matrix
  {
    model: '3PL',
    convergenceCriterion: 0.001,
    maxIterations: 100
  }
);

// Update item bank with calibrated parameters
for (const item of calibratedItems) {
  console.log(`Item ${item.id}: a=${item.discrimination}, b=${item.difficulty}, c=${item.guessing}`);
}
```

### Scoring and Reporting

```typescript
// Generate comprehensive score report
const report = await cat.generateScoreReport(session.id);

// Report includes:
// - Final theta estimate with confidence interval
// - Percentile rank
// - Scaled score transformation
// - Domain/subdomain breakdowns
// - Item-level analysis
// - Growth trajectory (if prior assessments exist)
```

---

## 6. Peer Review Workflow

### Overview

The Peer Review Engine (`peer-review-engine.ts`) implements a comprehensive peer assessment system with double-blind review, calibration training, and inter-rater reliability tracking.

### Features

- **Double-Blind Review**: Anonymous matching of reviewers and submissions
- **Calibration Training**: Train reviewers with reference submissions
- **Inter-Rater Reliability**: Track and ensure consistency across reviewers
- **Dispute Resolution**: Handle disagreements with moderator escalation
- **Reviewer Profiles**: Track expertise and performance metrics

### Usage

```typescript
import { PeerReviewEngine } from '@/lib/peer-review';

const engine = new PeerReviewEngine({
  reviewsPerSubmission: 3,
  calibrationRequired: true,
  minCalibrationScore: 0.7,
  disputeThreshold: 2.0,      // Standard deviations
  anonymousReview: true
});

// Create rubric for assignment
const rubric = await engine.createRubric({
  assignmentId: 'assignment_123',
  title: 'Essay Evaluation Rubric',
  criteria: [
    {
      id: 'thesis',
      name: 'Thesis Statement',
      description: 'Clear, arguable thesis',
      maxPoints: 20,
      levels: [
        { score: 20, description: 'Excellent thesis' },
        { score: 15, description: 'Good thesis' },
        { score: 10, description: 'Adequate thesis' },
        { score: 5, description: 'Weak thesis' },
        { score: 0, description: 'No thesis' }
      ]
    },
    // ... more criteria
  ]
});

// Assign reviewers (double-blind)
const assignments = await engine.assignReviewers({
  assignmentId: 'assignment_123',
  submissions: submissionIds,
  reviewers: studentIds,
  reviewsPerSubmission: 3
});

// Submit peer review
const review = await engine.submitReview({
  assignmentId: assignments[0].id,
  reviewerId: 'user_456',
  scores: [
    { criterionId: 'thesis', score: 18, feedback: 'Strong thesis statement' },
    // ... more scores
  ],
  overallFeedback: 'Well-written essay with minor issues...',
  privateNotes: 'Consider for exemplar'
});

// Get aggregated score
const finalScore = await engine.getAggregatedScore('submission_123');
console.log(finalScore.score);           // Weighted average
console.log(finalScore.confidence);      // Based on inter-rater agreement
console.log(finalScore.outliers);        // Flagged reviews
```

### Calibration Training

```typescript
// Create calibration session
const calibration = await engine.createCalibrationSession({
  assignmentId: 'assignment_123',
  referenceSubmissions: [
    {
      submissionId: 'ref_1',
      expertScores: { thesis: 18, evidence: 15, ... },
      expertFeedback: '...'
    }
  ]
});

// Reviewer completes calibration
const calibrationResult = await engine.submitCalibrationReview({
  sessionId: calibration.id,
  reviewerId: 'user_456',
  submissionId: 'ref_1',
  scores: { thesis: 17, evidence: 14, ... }
});

console.log(calibrationResult.passed);   // Based on agreement with expert
console.log(calibrationResult.feedback); // Training feedback
```

### Dispute Resolution

```typescript
// Flag review for dispute
const dispute = await engine.createDispute({
  reviewId: 'review_123',
  submitterId: 'user_456',
  reason: 'Score significantly lower than other reviews',
  evidence: 'Reviewer 3 gave 50/100 while others gave 85/100'
});

// Moderator resolves dispute
await engine.resolveDispute({
  disputeId: dispute.id,
  moderatorId: 'admin_123',
  resolution: 'upheld',          // or 'rejected', 'partial'
  adjustedScore: 78,
  notes: 'Adjusted to align with consensus'
});
```

---

## 7. Database Schema

### Entity Relationship Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │────▶│ IntegrityReport │────▶│  IntegrityMatch │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │               ┌───────┴───────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│  ProctorSession │ │  CATSession │ │ PeerReview  │
└─────────────────┘ └─────────────┘ └─────────────┘
        │                   │               │
        ▼                   ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│ProctorViolation │ │ CATResponse │ │ ReviewScore │
└─────────────────┘ └─────────────┘ └─────────────┘
```

### Key Models

See `prisma/domains/19-exam-evaluation.prisma` for complete schema definitions.

---

## 8. API Reference

### Integrity API

```typescript
// POST /api/integrity/analyze
// Analyze submission for plagiarism and AI content
{
  submissionId: string;
  content: string;
  contentType: 'essay' | 'code' | 'short_answer';
}

// GET /api/integrity/report/:submissionId
// Get integrity report for submission

// POST /api/integrity/appeal
// Submit appeal for integrity finding
{
  reportId: string;
  reason: string;
  evidence?: string;
}
```

### Proctoring API

```typescript
// POST /api/proctoring/start
// Start proctoring session
{
  examId: string;
  userId: string;
}

// POST /api/proctoring/violation
// Report violation (client-side)
{
  sessionId: string;
  type: string;
  severity: string;
  metadata?: object;
}

// POST /api/proctoring/end
// End proctoring session
{
  sessionId: string;
}

// GET /api/proctoring/report/:sessionId
// Get proctoring report
```

### CAT API

```typescript
// POST /api/cat/start
// Start CAT session
{
  examId: string;
  userId: string;
  itemBankId: string;
}

// GET /api/cat/next-item/:sessionId
// Get next adaptive item

// POST /api/cat/respond
// Submit response
{
  sessionId: string;
  itemId: string;
  response: string;
  responseTime: number;
}

// GET /api/cat/score/:sessionId
// Get final score and report
```

### Peer Review API

```typescript
// POST /api/peer-review/assign
// Create review assignments
{
  assignmentId: string;
  reviewsPerSubmission: number;
}

// POST /api/peer-review/submit
// Submit peer review
{
  assignmentId: string;
  scores: Array<{ criterionId: string; score: number; feedback: string }>;
  overallFeedback: string;
}

// GET /api/peer-review/score/:submissionId
// Get aggregated peer review score

// POST /api/peer-review/dispute
// Create dispute for review
```

---

## Integration Examples

### Complete Exam Flow

```typescript
// 1. Pre-exam system check
const systemCheck = await proctorSystemCheck.runFullCheck();
if (!systemCheck.passed) {
  showSystemRequirements(systemCheck.failures);
  return;
}

// 2. Apply accessibility accommodations
const accommodations = await getStudentAccommodations(userId);
const adjustedTime = timeCalculator.calculateAccommodation({
  baseTime: examTime,
  accommodationType: accommodations.type,
  multiplier: accommodations.multiplier
});

// 3. Start proctoring
const proctorSession = await proctor.startSession();

// 4. Start CAT session (if adaptive)
const catSession = await cat.startSession(userId, examId);

// 5. Exam loop
while (!catSession.isComplete) {
  const question = await cat.getNextItem(catSession.id);
  displayQuestion(question);

  const response = await waitForResponse();
  await cat.submitResponse(catSession.id, response);
}

// 6. End proctoring
const proctorReport = await proctor.endSession();

// 7. Generate score report
const scoreReport = await cat.generateScoreReport(catSession.id);

// 8. Track to LRS (xAPI)
await xapi.trackExamAttempt(userId, examId, 'completed', {
  score: scoreReport.scaledScore,
  duration: scoreReport.duration
});
```

---

## Configuration

### Environment Variables

```env
# xAPI Configuration
XAPI_ENDPOINT=https://lrs.example.com/xapi
XAPI_USERNAME=api_key
XAPI_PASSWORD=api_secret

# Proctoring
PROCTORING_ENABLED=true
PROCTORING_MAX_VIOLATIONS=3
PROCTORING_AUTO_TERMINATE=true

# CAT Configuration
CAT_DEFAULT_MIN_ITEMS=10
CAT_DEFAULT_MAX_ITEMS=30
CAT_MIN_STANDARD_ERROR=0.3

# Peer Review
PEER_REVIEW_CALIBRATION_REQUIRED=true
PEER_REVIEW_MIN_CALIBRATION_SCORE=0.7
```

---

## Standards Compliance

| Feature | Standard | Version |
|---------|----------|---------|
| xAPI | IEEE 9274.1.1 | 1.0.3 |
| QTI | IMS Global | 2.1 |
| SCORM | ADL | 2004 4th Ed |
| Accessibility | W3C WCAG | 2.1 AA |
| IRT | Educational Measurement | 3PL |

---

## Support

For technical support or feature requests, please contact the Taxomind development team.

---

*Last Updated: December 2024*
*Version: 1.0.0*
