# Comprehensive Exam & Evaluation System Plan

## Executive Summary

This document outlines a comprehensive exam and evaluation system for Taxomind that supports two primary use cases:

1. **Self-Learning Mode**: Students create courses for themselves, and the system generates personalized exams to reinforce learning and track cognitive skill development.

2. **Course Creation Mode**: Teachers/creators manually create courses and exams with AI assistance from SAM, with built-in quality evaluation and Bloom's Taxonomy alignment.

The system is designed around **cognitive skill development** using Bloom's Taxonomy, ensuring students progress through all six cognitive levels: Remember, Understand, Apply, Analyze, Evaluate, and Create.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Dual-Mode Question Creation](#2-dual-mode-question-creation)
3. [Cognitive Skill Development Framework](#3-cognitive-skill-development-framework)
4. [Intelligent Evaluation System](#4-intelligent-evaluation-system)
5. [Student Analytics & Progress Tracking](#5-student-analytics--progress-tracking)
6. [SAM AI Integration](#6-sam-ai-integration)
7. [Database Schema Extensions](#7-database-schema-extensions)
8. [UI/UX Design](#8-uiux-design)
9. [Implementation Phases](#9-implementation-phases)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXAM & EVALUATION SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │  QUESTION       │     │  COGNITIVE      │     │  EVALUATION     │   │
│  │  CREATION       │     │  SKILL ENGINE   │     │  ENGINE         │   │
│  │  MODULE         │     │                 │     │                 │   │
│  ├─────────────────┤     ├─────────────────┤     ├─────────────────┤   │
│  │ • Manual Mode   │     │ • Bloom's       │     │ • Auto-grading  │   │
│  │ • AI Mode (SAM) │     │   Analysis      │     │ • Rubric-based  │   │
│  │ • Hybrid Mode   │     │ • Skill Mapping │     │ • AI Evaluation │   │
│  │ • Question Bank │     │ • Gap Detection │     │ • Feedback Gen  │   │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘   │
│           │                       │                       │             │
│           └───────────────────────┼───────────────────────┘             │
│                                   │                                      │
│                    ┌──────────────▼──────────────┐                      │
│                    │     ANALYTICS ENGINE        │                      │
│                    ├─────────────────────────────┤                      │
│                    │ • Progress Tracking         │                      │
│                    │ • Cognitive Growth Maps     │                      │
│                    │ • Predictive Insights       │                      │
│                    │ • Personalized Learning     │                      │
│                    └─────────────────────────────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
Content Creation → Bloom's Analysis → Question Generation → Student Attempt
                                                                    ↓
Personalized Feedback ← AI Evaluation ← Answer Submission ← Exam Taking
                                                                    ↓
                         Analytics Dashboard ← Progress Tracking ←──┘
```

---

## 2. Dual-Mode Question Creation

### 2.1 Manual Question Creation

Teachers can create questions with full control over:

#### Question Builder Interface

```typescript
interface ManualQuestionCreator {
  // Basic Question Fields
  questionText: string;
  questionType: QuestionType;
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';

  // Bloom's Taxonomy Integration
  bloomsLevel: BloomsLevel;
  cognitiveSkillTags: string[];
  learningObjectiveLink: string; // Link to section learning objective

  // Answer Configuration
  options?: AnswerOption[]; // For MCQ, True/False, Matching
  correctAnswer: string | string[];
  acceptableVariations?: string[]; // For short answer
  rubric?: EvaluationRubric; // For essay questions

  // Hints & Explanations
  hint?: string;
  explanation: string;
  commonMisconceptions?: string[];

  // Metadata
  estimatedTime: number; // seconds
  prerequisites?: string[];
  relatedConcepts?: string[];
}
```

#### Bloom's Level Guidance

When creating questions, show teachers:

```typescript
interface BloomsGuidance {
  level: BloomsLevel;
  description: string;
  questionStarters: string[];
  verbsToUse: string[];
  exampleQuestion: string;
  appropriateQuestionTypes: QuestionType[];
}

const BLOOMS_GUIDANCE: BloomsGuidance[] = [
  {
    level: 'REMEMBER',
    description: 'Recall facts and basic concepts',
    questionStarters: ['What is...', 'Define...', 'List...', 'Name...'],
    verbsToUse: ['define', 'identify', 'list', 'name', 'recall', 'recognize'],
    exampleQuestion: 'What is the capital of France?',
    appropriateQuestionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK']
  },
  {
    level: 'UNDERSTAND',
    description: 'Explain ideas or concepts',
    questionStarters: ['Explain...', 'Describe...', 'Summarize...', 'Compare...'],
    verbsToUse: ['describe', 'explain', 'summarize', 'paraphrase', 'classify'],
    exampleQuestion: 'Explain why photosynthesis is important for life on Earth.',
    appropriateQuestionTypes: ['SHORT_ANSWER', 'MULTIPLE_CHOICE', 'MATCHING']
  },
  {
    level: 'APPLY',
    description: 'Use information in new situations',
    questionStarters: ['How would you use...', 'Solve...', 'Apply...', 'Demonstrate...'],
    verbsToUse: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute'],
    exampleQuestion: 'Calculate the area of a triangle with base 5cm and height 3cm.',
    appropriateQuestionTypes: ['SHORT_ANSWER', 'MULTIPLE_CHOICE', 'ORDERING']
  },
  {
    level: 'ANALYZE',
    description: 'Draw connections among ideas',
    questionStarters: ['Why...', 'What is the relationship...', 'Compare and contrast...'],
    verbsToUse: ['analyze', 'compare', 'contrast', 'differentiate', 'examine', 'investigate'],
    exampleQuestion: 'Compare and contrast aerobic and anaerobic respiration.',
    appropriateQuestionTypes: ['ESSAY', 'SHORT_ANSWER', 'MATCHING']
  },
  {
    level: 'EVALUATE',
    description: 'Justify a decision or course of action',
    questionStarters: ['Do you agree...', 'What is your opinion...', 'Evaluate...', 'Assess...'],
    verbsToUse: ['evaluate', 'assess', 'judge', 'critique', 'justify', 'argue'],
    exampleQuestion: 'Evaluate the effectiveness of renewable energy sources.',
    appropriateQuestionTypes: ['ESSAY', 'SHORT_ANSWER']
  },
  {
    level: 'CREATE',
    description: 'Produce new or original work',
    questionStarters: ['Design...', 'Create...', 'Propose...', 'Develop...'],
    verbsToUse: ['create', 'design', 'develop', 'formulate', 'construct', 'produce'],
    exampleQuestion: 'Design an experiment to test plant growth under different light conditions.',
    appropriateQuestionTypes: ['ESSAY', 'SHORT_ANSWER']
  }
];
```

### 2.2 AI-Powered Question Creation (SAM)

#### SAM Question Generator Interface

```typescript
interface SAMQuestionGeneratorConfig {
  // Content Source
  sourceContent: {
    sectionContent: string;
    learningObjectives: string[];
    sectionDescription: string;
    additionalMaterials?: string; // Uploaded PDFs, notes
  };

  // Generation Parameters
  questionCount: number;
  targetBloomsDistribution: BloomsDistribution;
  difficultyDistribution: DifficultyDistribution;
  questionTypes: QuestionType[];

  // Personalization
  studentProfile?: {
    currentBloomsStrengths: BloomsDistribution;
    strugglingAreas: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };

  // Quality Settings
  includeExplanations: boolean;
  includeHints: boolean;
  includeMisconceptions: boolean;
  alignWithLearningObjectives: boolean;

  // Advanced Options
  creativity: number; // 0-10, higher = more creative questions
  realWorldContext: boolean; // Use real-world scenarios
  crossTopicIntegration: boolean; // Questions spanning multiple concepts
}
```

#### SAM Generation Modes

1. **Quick Generate**:
   - One-click generation based on section content
   - Uses optimal Bloom's distribution automatically
   - Best for self-learners

2. **Guided Generate**:
   - Step-by-step wizard
   - Teacher selects specific topics and cognitive levels
   - Preview and edit before saving

3. **Adaptive Generate**:
   - Analyzes student's current progress
   - Focuses on cognitive gaps
   - Personalizes difficulty based on performance

4. **Gap-Filling Generate**:
   - Analyzes existing exam questions
   - Identifies missing Bloom's levels
   - Generates questions to fill gaps

### 2.3 Hybrid Mode

Combine manual and AI creation:

```typescript
interface HybridQuestionWorkflow {
  // Step 1: AI generates draft questions
  aiGeneratedQuestions: Question[];

  // Step 2: Teacher reviews and edits
  teacherEdits: {
    approved: string[]; // Question IDs
    modified: { questionId: string; changes: Partial<Question> }[];
    rejected: string[];
    addedManually: Question[];
  };

  // Step 3: SAM validates final exam
  validation: {
    bloomsAlignment: number; // 0-100
    difficultyBalance: number;
    coverageScore: number;
    suggestions: string[];
  };
}
```

---

## 3. Cognitive Skill Development Framework

### 3.1 Learning Pathway Design

```typescript
interface CognitiveLearningPathway {
  // Student's Current State
  currentProfile: {
    bloomsPerformance: BloomsDistribution;
    cognitiveDepth: number; // 0-100
    strengths: BloomsLevel[];
    weaknesses: BloomsLevel[];
    masteredConcepts: string[];
    strugglingConcepts: string[];
  };

  // Target State
  targetProfile: {
    bloomsTarget: BloomsDistribution;
    cognitiveDepthGoal: number;
    timeframe: number; // days
  };

  // Pathway Steps
  pathway: PathwayStep[];
}

interface PathwayStep {
  stepNumber: number;
  focusBloomsLevel: BloomsLevel;
  activities: LearningActivity[];
  assessments: MiniAssessment[];
  estimatedDuration: number;
  prerequisites: string[];
  successCriteria: {
    minScore: number;
    requiredAttempts?: number;
    timeLimit?: number;
  };
}

interface LearningActivity {
  type: 'READ' | 'WATCH' | 'PRACTICE' | 'DISCUSS' | 'CREATE';
  content: string;
  bloomsLevel: BloomsLevel;
  estimatedTime: number;
  resources: Resource[];
}
```

### 3.2 Cognitive Skill Assessment Matrix

```typescript
interface CognitiveSkillMatrix {
  // For each learning objective
  objective: string;

  // Assessment across Bloom's levels
  assessments: {
    REMEMBER: {
      questions: Question[];
      masteryThreshold: number;
      currentMastery: number;
    };
    UNDERSTAND: {
      questions: Question[];
      masteryThreshold: number;
      currentMastery: number;
    };
    APPLY: {
      questions: Question[];
      masteryThreshold: number;
      currentMastery: number;
    };
    ANALYZE: {
      questions: Question[];
      masteryThreshold: number;
      currentMastery: number;
    };
    EVALUATE: {
      questions: Question[];
      masteryThreshold: number;
      currentMastery: number;
    };
    CREATE: {
      questions: Question[];
      masteryThreshold: number;
      currentMastery: number;
    };
  };

  // Overall mastery
  overallMastery: number;
  readyForNextLevel: boolean;
}
```

### 3.3 Adaptive Difficulty System

```typescript
interface AdaptiveDifficultyEngine {
  // Input: Student's recent performance
  analyzePerformance(attempts: ExamAttempt[]): PerformanceAnalysis;

  // Adjust difficulty based on Zone of Proximal Development (ZPD)
  calculateOptimalDifficulty(
    currentLevel: number,
    recentAccuracy: number,
    confidenceLevel: number
  ): DifficultyRecommendation;

  // Generate next question based on adaptive algorithm
  selectNextQuestion(
    questionBank: Question[],
    studentProfile: StudentProfile,
    examProgress: ExamProgress
  ): Question;
}

interface DifficultyRecommendation {
  suggestedDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  suggestedBloomsLevel: BloomsLevel;
  rationale: string;
  confidenceBoostNeeded: boolean;
  challengeIncrease: boolean;
}
```

---

## 4. Intelligent Evaluation System

### 4.1 Multi-Type Answer Evaluation

#### Objective Questions (Auto-graded)

```typescript
interface ObjectiveEvaluator {
  // Multiple Choice
  evaluateMultipleChoice(
    userAnswer: string,
    correctAnswer: string
  ): EvaluationResult;

  // True/False
  evaluateTrueFalse(
    userAnswer: boolean,
    correctAnswer: boolean
  ): EvaluationResult;

  // Fill in the Blank
  evaluateFillInBlank(
    userAnswer: string,
    correctAnswer: string,
    acceptableVariations: string[],
    caseSensitive: boolean
  ): EvaluationResult;

  // Matching
  evaluateMatching(
    userPairs: [string, string][],
    correctPairs: [string, string][]
  ): EvaluationResult;

  // Ordering
  evaluateOrdering(
    userOrder: string[],
    correctOrder: string[],
    partialCreditEnabled: boolean
  ): EvaluationResult;
}
```

#### Subjective Questions (AI-Evaluated)

```typescript
interface SubjectiveEvaluator {
  // Short Answer Evaluation
  evaluateShortAnswer(
    question: Question,
    userAnswer: string,
    rubric: ShortAnswerRubric
  ): Promise<SubjectiveEvaluationResult>;

  // Essay Evaluation
  evaluateEssay(
    question: Question,
    userAnswer: string,
    rubric: EssayRubric
  ): Promise<SubjectiveEvaluationResult>;
}

interface ShortAnswerRubric {
  keyPoints: {
    point: string;
    weight: number;
    alternativePhrases: string[];
  }[];

  partialCreditEnabled: boolean;
  minimumLength?: number;
  maximumLength?: number;
}

interface EssayRubric {
  criteria: {
    name: string; // e.g., "Content Accuracy", "Critical Thinking", "Organization"
    description: string;
    weight: number;
    levels: {
      score: number;
      description: string;
    }[];
  }[];

  bloomsLevelExpectation: BloomsLevel;
  minimumWordCount?: number;
  requiredElements?: string[];
}

interface SubjectiveEvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;

  // Detailed breakdown
  criteriaScores: {
    criterion: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];

  // Cognitive assessment
  demonstratedBloomsLevel: BloomsLevel;
  cognitiveStrengths: string[];
  areasForImprovement: string[];

  // Feedback
  overallFeedback: string;
  suggestions: string[];
  exemplarResponse?: string; // Show what a perfect answer looks like

  // Confidence
  evaluationConfidence: number; // 0-100
  flagForHumanReview: boolean;
}
```

### 4.2 SAM Evaluation Engine

```typescript
interface SAMEvaluationEngine {
  // Comprehensive answer evaluation
  evaluateAnswer(params: {
    question: Question;
    studentAnswer: string;
    rubric?: EvaluationRubric;
    previousAttempts?: StudentAnswer[];
    learningContext?: {
      sectionContent: string;
      learningObjectives: string[];
    };
  }): Promise<ComprehensiveEvaluation>;
}

interface ComprehensiveEvaluation {
  // Scoring
  score: number;
  maxScore: number;

  // Bloom's Analysis
  bloomsAnalysis: {
    targetLevel: BloomsLevel;
    demonstratedLevel: BloomsLevel;
    levelMatch: boolean;
    cognitiveEvidence: string[];
  };

  // Content Analysis
  contentAnalysis: {
    accuracy: number; // 0-100
    completeness: number; // 0-100
    relevance: number; // 0-100
    depth: number; // 0-100
  };

  // Learning Insights
  learningInsights: {
    conceptsUnderstood: string[];
    conceptsMisunderstood: string[];
    misconceptions: string[];
    knowledgeGaps: string[];
  };

  // Personalized Feedback
  feedback: {
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
    encouragement: string;
  };

  // Recommendations
  recommendations: {
    reviewTopics: string[];
    practiceQuestions: string[];
    resources: Resource[];
  };
}
```

### 4.3 Plagiarism & Integrity Check

```typescript
interface IntegrityChecker {
  // Check for copied content
  checkPlagiarism(answer: string, database: string[]): PlagiarismResult;

  // Check for AI-generated content (if needed)
  checkAIGenerated(answer: string): AIDetectionResult;

  // Check answer consistency with student's profile
  checkConsistency(
    answer: string,
    studentProfile: StudentProfile,
    previousAnswers: string[]
  ): ConsistencyResult;
}
```

---

## 5. Student Analytics & Progress Tracking

### 5.1 Cognitive Growth Dashboard

```typescript
interface CognitiveGrowthDashboard {
  // Overview Metrics
  overview: {
    overallCognitiveDepth: number;
    cognitiveGrowthRate: number; // % improvement over time
    totalExamsCompleted: number;
    totalStudyTime: number;
    currentStreak: number;
  };

  // Bloom's Taxonomy Radar Chart Data
  bloomsRadar: {
    level: BloomsLevel;
    currentScore: number;
    targetScore: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  }[];

  // Progress Timeline
  progressTimeline: {
    date: Date;
    cognitiveDepth: number;
    examScore: number;
    bloomsLevelReached: BloomsLevel;
    milestone?: string;
  }[];

  // Skill Mastery Grid
  skillMastery: {
    concept: string;
    bloomsLevels: {
      level: BloomsLevel;
      mastered: boolean;
      attempts: number;
      bestScore: number;
    }[];
  }[];
}
```

### 5.2 Learning Analytics Metrics

```typescript
interface LearningAnalytics {
  // Performance Metrics
  performance: {
    averageScore: number;
    scoreDistribution: { range: string; count: number }[];
    improvementRate: number;
    consistencyScore: number;
  };

  // Time Analytics
  timeAnalytics: {
    averageTimePerQuestion: Record<BloomsLevel, number>;
    timeVsAccuracy: { time: number; accuracy: number }[];
    optimalStudyTime: string;
    productivityPattern: { hour: number; efficiency: number }[];
  };

  // Cognitive Patterns
  cognitivePatterns: {
    strongestBloomsLevel: BloomsLevel;
    weakestBloomsLevel: BloomsLevel;
    learningVelocity: Record<BloomsLevel, number>;
    retentionRate: Record<BloomsLevel, number>;
    commonMistakes: { mistake: string; frequency: number }[];
  };

  // Predictive Insights
  predictions: {
    nextMilestone: string;
    estimatedTimeToGoal: number;
    riskOfStagnation: number;
    recommendedFocus: BloomsLevel;
  };
}
```

### 5.3 Teacher/Creator Analytics

```typescript
interface CreatorAnalytics {
  // Exam Effectiveness
  examEffectiveness: {
    averageScore: number;
    completionRate: number;
    questionDifficultyAccuracy: number; // How well difficulty matches actual performance
    bloomsAlignmentScore: number;
  };

  // Question Analysis
  questionAnalysis: {
    questionId: string;
    questionText: string;
    bloomsLevel: BloomsLevel;
    difficulty: string;

    metrics: {
      attemptCount: number;
      correctRate: number;
      avgTimeSpent: number;
      discriminationIndex: number; // How well it separates high/low performers
      distractorAnalysis?: { option: string; selectedRate: number }[];
    };

    suggestions: string[];
  }[];

  // Class Performance by Bloom's Level
  classBloomsPerformance: {
    level: BloomsLevel;
    classAverage: number;
    topPerformers: number;
    strugglingStudents: number;
    improvementTrend: 'UP' | 'DOWN' | 'STABLE';
  }[];

  // Content Gap Analysis
  contentGaps: {
    concept: string;
    strugglingStudentCount: number;
    suggestedActions: string[];
  }[];
}
```

### 5.4 New Analytics Features to Add

```typescript
interface EnhancedAnalytics {
  // 1. Cognitive Journey Map
  cognitiveJourney: {
    startingLevel: BloomsLevel;
    currentLevel: BloomsLevel;
    targetLevel: BloomsLevel;
    milestones: {
      date: Date;
      achievement: string;
      bloomsLevel: BloomsLevel;
    }[];
    projectedCompletion: Date;
  };

  // 2. Spaced Repetition Insights
  spacedRepetition: {
    conceptsNeedingReview: {
      concept: string;
      lastReviewed: Date;
      retentionDecay: number;
      urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    }[];
    optimalReviewSchedule: {
      date: Date;
      concepts: string[];
    }[];
  };

  // 3. Comparative Analytics
  comparativeAnalytics: {
    vsClassAverage: {
      metric: string;
      studentValue: number;
      classAverage: number;
      percentile: number;
    }[];
    vsPreviousSelf: {
      metric: string;
      currentValue: number;
      previousValue: number;
      improvement: number;
    }[];
  };

  // 4. Learning Style Analysis
  learningStyleAnalysis: {
    preferredQuestionTypes: QuestionType[];
    optimalDifficulty: string;
    bestPerformanceTime: string;
    attentionPattern: 'FOCUSED' | 'SCATTERED' | 'IMPROVING';
  };

  // 5. Intervention Recommendations
  interventions: {
    type: 'ENCOURAGEMENT' | 'CHALLENGE' | 'SUPPORT' | 'REVIEW';
    trigger: string;
    recommendation: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    resources: Resource[];
  }[];
}
```

---

## 6. SAM AI Integration

### 6.1 SAM Package Architecture

Since SAM is designed as a separate package, ensure clean interfaces:

```typescript
// packages/sam-ai/src/index.ts
export interface SAMExamService {
  // Question Generation
  generateQuestions(config: QuestionGenerationConfig): Promise<GeneratedQuestion[]>;

  // Question Validation
  validateQuestion(question: Question): Promise<QuestionValidation>;

  // Exam Validation
  validateExam(exam: Exam): Promise<ExamValidation>;

  // Answer Evaluation
  evaluateAnswer(params: EvaluationParams): Promise<EvaluationResult>;

  // Feedback Generation
  generateFeedback(params: FeedbackParams): Promise<PersonalizedFeedback>;

  // Study Guide Generation
  generateStudyGuide(params: StudyGuideParams): Promise<StudyGuide>;

  // Analytics Insights
  generateInsights(data: AnalyticsData): Promise<AIInsights>;
}

// Clean interfaces for external use
export interface SAMConfig {
  aiAdapter: AIAdapter;
  storageAdapter?: StorageAdapter;
  cacheEnabled?: boolean;
  defaultBloomsDistribution?: BloomsDistribution;
}
```

### 6.2 SAM Conversation Modes for Exam

```typescript
interface SAMExamAssistantModes {
  // Mode 1: Question Creation Assistant
  questionCreation: {
    suggestQuestions(topic: string, bloomsLevel: BloomsLevel): Promise<Question[]>;
    improveQuestion(question: Question): Promise<QuestionImprovement>;
    validateBloomsAlignment(question: Question): Promise<BloomsValidation>;
  };

  // Mode 2: Exam Review Assistant
  examReview: {
    analyzeExam(exam: Exam): Promise<ExamAnalysis>;
    suggestImprovements(exam: Exam): Promise<ExamImprovement[]>;
    balanceBloomsCoverage(exam: Exam): Promise<BalancedExam>;
  };

  // Mode 3: Student Tutoring Mode
  studentTutor: {
    explainWrongAnswer(question: Question, wrongAnswer: string): Promise<Explanation>;
    provideHint(question: Question, currentProgress: string): Promise<Hint>;
    generatePracticeQuestions(weakness: string): Promise<Question[]>;
  };

  // Mode 4: Analytics Interpreter
  analyticsInterpreter: {
    explainProgress(analytics: StudentAnalytics): Promise<ProgressExplanation>;
    recommendNextSteps(profile: StudentProfile): Promise<Recommendation[]>;
    identifyPatterns(history: LearningHistory): Promise<Pattern[]>;
  };
}
```

### 6.3 SAM Prompts for Exam System

```typescript
const SAM_EXAM_PROMPTS = {
  // Question Generation
  generateQuestion: `
    Based on the following content, generate a {questionType} question at the {bloomsLevel} cognitive level.

    Content: {sectionContent}
    Learning Objectives: {learningObjectives}

    Requirements:
    - Question must test {bloomsLevel} level thinking
    - Use action verbs: {bloomsVerbs}
    - Include explanation for correct answer
    - Include common misconceptions students might have
    - Difficulty: {difficulty}

    Output format: JSON with question, options, correctAnswer, explanation, hints, misconceptions
  `,

  // Answer Evaluation
  evaluateAnswer: `
    Evaluate the student's answer based on Bloom's Taxonomy level {bloomsLevel}.

    Question: {question}
    Expected Answer Elements: {rubric}
    Student Answer: {studentAnswer}

    Evaluate for:
    1. Content accuracy (key concepts covered)
    2. Cognitive depth (does it demonstrate {bloomsLevel} thinking?)
    3. Completeness
    4. Common misconceptions

    Provide:
    - Score (0-{maxScore})
    - Detailed feedback
    - Identified strengths
    - Areas for improvement
    - Next learning steps
  `,

  // Feedback Generation
  generateFeedback: `
    Generate personalized learning feedback for this student:

    Student Profile: {studentProfile}
    Recent Performance: {recentScores}
    Cognitive Strengths: {strengths}
    Cognitive Weaknesses: {weaknesses}

    Provide:
    1. Encouraging summary of progress
    2. Specific areas to focus on
    3. Recommended practice activities
    4. Next cognitive level to work towards
    5. Motivational message
  `
};
```

---

## 7. Database Schema Extensions

### 7.1 New Models Required

```prisma
// Add to prisma/domains/03-learning.prisma

// Enhanced Question Model
model EnhancedQuestion {
  id                String   @id @default(cuid())
  examId            String?
  questionBankId    String?

  // Basic Info
  question          String   @db.Text
  questionType      QuestionType
  points            Int      @default(1)
  order             Int      @default(0)

  // Answer Configuration
  options           Json?    // For MCQ, matching, etc.
  correctAnswer     String   @db.Text
  acceptableVariations Json? // Alternative correct answers
  rubric            Json?    // For essay/short answer

  // Bloom's Taxonomy
  bloomsLevel       BloomsLevel
  cognitiveSkills   String[] // Tags like "critical-thinking", "problem-solving"
  learningObjectiveId String? // Link to section learning objective

  // Hints & Explanations
  hint              String?  @db.Text
  explanation       String   @db.Text
  commonMisconceptions Json? // Array of misconceptions

  // Metadata
  difficulty        Difficulty @default(MEDIUM)
  estimatedTime     Int?     // seconds
  prerequisites     String[] // Concept prerequisites
  relatedConcepts   String[] // Related topics

  // Analytics
  totalAttempts     Int      @default(0)
  correctAttempts   Int      @default(0)
  avgTimeSpent      Float?   // seconds
  discriminationIndex Float? // Statistical measure

  // Relations
  exam              Exam?    @relation(fields: [examId], references: [id], onDelete: Cascade)
  questionBank      QuestionBank? @relation(fields: [questionBankId], references: [id])
  learningObjective LearningObjective? @relation(fields: [learningObjectiveId], references: [id])
  answers           StudentAnswer[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([bloomsLevel])
  @@index([difficulty])
  @@index([questionType])
}

// Learning Objective Model (link questions to objectives)
model LearningObjective {
  id                String   @id @default(cuid())
  sectionId         String

  objective         String   @db.Text
  bloomsLevel       BloomsLevel
  order             Int      @default(0)

  // Relations
  section           Section  @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  questions         EnhancedQuestion[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([sectionId])
}

// Cognitive Skill Progress (per student per concept)
model CognitiveSkillProgress {
  id                String   @id @default(cuid())
  userId            String
  conceptId         String   // Could be sectionId or custom concept

  // Bloom's Level Mastery
  rememberMastery   Float    @default(0) // 0-100
  understandMastery Float    @default(0)
  applyMastery      Float    @default(0)
  analyzeMastery    Float    @default(0)
  evaluateMastery   Float    @default(0)
  createMastery     Float    @default(0)

  // Overall
  overallMastery    Float    @default(0)
  currentBloomsLevel BloomsLevel @default(REMEMBER)

  // Tracking
  totalAttempts     Int      @default(0)
  lastAttemptDate   DateTime?

  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([userId, conceptId])
  @@index([userId])
}

// Spaced Repetition Schedule
model SpacedRepetitionSchedule {
  id                String   @id @default(cuid())
  userId            String
  conceptId         String

  // Scheduling
  nextReviewDate    DateTime
  easeFactor        Float    @default(2.5) // SM-2 algorithm
  interval          Int      @default(1)   // days
  repetitions       Int      @default(0)

  // Performance
  lastScore         Float?
  retentionEstimate Float    @default(100)

  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([userId, conceptId])
  @@index([userId, nextReviewDate])
}

// AI Evaluation Record
model AIEvaluationRecord {
  id                String   @id @default(cuid())
  answerId          String

  // Evaluation Details
  score             Float
  maxScore          Float

  // Bloom's Analysis
  targetBloomsLevel BloomsLevel
  demonstratedLevel BloomsLevel
  bloomsEvidence    Json?    // Evidence for level determination

  // Content Analysis
  accuracy          Float    // 0-100
  completeness      Float    // 0-100
  relevance         Float    // 0-100
  depth             Float    // 0-100

  // Insights
  conceptsUnderstood Json?   // Array of strings
  misconceptions    Json?    // Array of identified misconceptions
  knowledgeGaps     Json?    // Array of gaps

  // Feedback
  feedback          String   @db.Text
  strengths         Json?
  improvements      Json?
  nextSteps         Json?

  // Metadata
  evaluationModel   String   // Which AI model was used
  confidence        Float    // 0-100
  flaggedForReview  Boolean  @default(false)

  // Relations
  answer            UserAnswer @relation(fields: [answerId], references: [id], onDelete: Cascade)

  createdAt         DateTime @default(now())

  @@index([answerId])
}

// Study Guide Model
model StudyGuide {
  id                String   @id @default(cuid())
  userId            String
  examId            String?
  sectionId         String?

  // Content
  title             String
  content           String   @db.Text

  // Structure
  focusAreas        Json     // Array of focus areas
  practiceQuestions Json     // Array of practice question IDs
  resources         Json     // Array of resource links

  // Personalization
  basedOnPerformance Json?   // Performance data used to generate
  targetBloomsLevels Json    // Levels to focus on

  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  exam              Exam?    @relation(fields: [examId], references: [id])
  section           Section? @relation(fields: [sectionId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId])
}
```

### 7.2 Enum Extensions

```prisma
// Add to prisma/domains/01-enums.prisma

enum CognitiveSkillType {
  CRITICAL_THINKING
  PROBLEM_SOLVING
  CREATIVE_THINKING
  ANALYTICAL_THINKING
  LOGICAL_REASONING
  METACOGNITION
  INFORMATION_PROCESSING
  DECISION_MAKING
}

enum LearningActivityType {
  READ_CONTENT
  WATCH_VIDEO
  PRACTICE_QUESTIONS
  DISCUSSION
  CREATE_PROJECT
  PEER_REVIEW
  REFLECTION
}

enum InterventionType {
  ENCOURAGEMENT
  CHALLENGE_INCREASE
  SUPPORT_NEEDED
  REVIEW_REQUIRED
  CELEBRATION
  GUIDANCE
}
```

---

## 8. UI/UX Design

### 8.1 Exam Creation Interface

#### Tab Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Exam                                                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Manual   │ │ AI       │ │ Question │ │ Settings │           │
│  │ Creation │ │ Generate │ │ Bank     │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Tab Content Area]                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Manual Creation Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Add Question                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Question Type: [MCQ ▼] [True/False ▼] [Short ▼] [Essay ▼]     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Question Text                                                ││
│  │ ____________________________________________________________││
│  │ ____________________________________________________________││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Bloom's Level:                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ○ Remember  ○ Understand  ○ Apply                          │ │
│  │ ○ Analyze   ○ Evaluate    ○ Create                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💡 Tip: For "Analyze" level, use verbs like: compare,          │
│     contrast, differentiate, examine...                          │
│                                                                  │
│  [Answer Options Section - varies by question type]              │
│                                                                  │
│  Difficulty: ○ Easy  ● Medium  ○ Hard                           │
│                                                                  │
│  Points: [5 ▼]  Estimated Time: [60 ▼] seconds                  │
│                                                                  │
│  ┌─ Advanced Options ─────────────────────────────────────────┐ │
│  │ ☑ Include Hint                                              │ │
│  │ ☑ Include Explanation                                       │ │
│  │ ☐ Link to Learning Objective                                │ │
│  │ ☐ Add to Question Bank                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Cancel]                              [Save Question]           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### AI Generation Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Question Generator                                [SAM AI]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Content Source ───────────────────────────────────────────┐ │
│  │ ● Use Section Content                                       │ │
│  │ ○ Upload Custom Material [Choose File]                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Number of Questions: [10 ▼]                                     │
│                                                                  │
│  ┌─ Bloom's Distribution ─────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Remember     [███░░░░░░░] 15%                              │ │
│  │  Understand   [█████░░░░░] 25%                              │ │
│  │  Apply        [█████░░░░░] 25%                              │ │
│  │  Analyze      [████░░░░░░] 20%                              │ │
│  │  Evaluate     [██░░░░░░░░] 10%                              │ │
│  │  Create       [█░░░░░░░░░] 5%                               │ │
│  │                                                              │ │
│  │  [Auto-Balance] [Reset to Default]                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Question Types ───────────────────────────────────────────┐ │
│  │ ☑ Multiple Choice  ☑ True/False  ☑ Short Answer           │ │
│  │ ☐ Essay           ☐ Fill Blank   ☐ Matching               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Advanced Options ─────────────────────────────────────────┐ │
│  │ Creativity Level: [═══════●══] 7/10                         │ │
│  │ ☑ Include Explanations                                      │ │
│  │ ☑ Include Hints                                             │ │
│  │ ☑ Real-World Scenarios                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Generate Questions ✨]                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Student Exam Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  Exam: Performance Optimization Techniques    ⏱️ 45:00 remaining │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Question 3 of 15                              [Analyze] 🧠      │
│  ━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Compare and contrast the Virtual DOM approach in React with     │
│  direct DOM manipulation. What are the trade-offs?               │
│                                                                  │
│  Points: 5  |  Estimated Time: 3 min                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │ Your Answer:                                                 ││
│  │ ____________________________________________________________││
│  │ ____________________________________________________________││
│  │ ____________________________________________________________││
│  │                                                              ││
│  │ Word Count: 45                                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  💡 [Show Hint] (Will deduct 1 point)                           │
│                                                                  │
│  [← Previous]                    [Flag for Review]    [Next →]  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Question Navigator:                                             │
│  [1✓][2✓][3●][4○][5○][6○][7○][8○][9○][10○][11○][12○][13○][14○][15○]│
│                                                                  │
│  ✓ Answered  ● Current  ○ Not Answered  🚩 Flagged              │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Results & Feedback Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  Exam Results                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     🎉 Great Job!                            ││
│  │                                                              ││
│  │         Score: 78/100 (78%)          Time: 38:45            ││
│  │                                                              ││
│  │         Status: PASSED ✅                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ Cognitive Performance (Bloom's Levels) ───────────────────┐ │
│  │                                                              │ │
│  │       Remember  ████████████████████░░░░  85%  ✓            │ │
│  │     Understand  ██████████████████░░░░░░  75%  ✓            │ │
│  │          Apply  ████████████████░░░░░░░░  70%  ✓            │ │
│  │        Analyze  ██████████████░░░░░░░░░░  60%  ⚠️           │ │
│  │       Evaluate  ████████░░░░░░░░░░░░░░░░  40%  ⚠️           │ │
│  │         Create  Not Assessed                                 │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ AI Insights ──────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │ 💪 Strengths:                                                │ │
│  │ • Strong recall of React fundamentals                        │ │
│  │ • Good understanding of component lifecycle                  │ │
│  │                                                              │ │
│  │ 🎯 Areas to Improve:                                         │ │
│  │ • Practice analyzing performance trade-offs                  │ │
│  │ • Work on evaluating architectural decisions                 │ │
│  │                                                              │ │
│  │ 📚 Recommended Next Steps:                                   │ │
│  │ • Review: Performance Optimization Patterns                  │ │
│  │ • Practice: 5 Analysis-level questions                       │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [View Detailed Answers]  [Generate Study Guide]  [Retry Exam]  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Cognitive Progress Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  My Cognitive Journey                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Overall Progress ─────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Cognitive Depth Score: 72/100                              │ │
│  │  [████████████████████████████████████░░░░░░░░░░░░░░░░] 72% │ │
│  │                                                              │ │
│  │  Current Level: Analyze     Target: Evaluate                 │ │
│  │  🔥 12-day streak!          📈 +15% this month              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Bloom's Radar Chart ──────────────────────────────────────┐ │
│  │                                                              │ │
│  │              Remember                                        │ │
│  │                 ●                                            │ │
│  │                /|\                                           │ │
│  │     Create ●  / | \  ● Understand                           │ │
│  │             \/  |  \/                                        │ │
│  │             /\  |  /\                                        │ │
│  │   Evaluate ●  \ | /  ● Apply                                │ │
│  │                \|/                                           │ │
│  │                 ●                                            │ │
│  │              Analyze                                         │ │
│  │                                                              │ │
│  │     ─── Current  .... Target                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Skills Mastery Grid ──────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Concept          Rem  Und  App  Ana  Eva  Cre              │ │
│  │  ─────────────────────────────────────────────              │ │
│  │  React Basics     ✅   ✅   ✅   ⚡   ○    ○               │ │
│  │  State Mgmt       ✅   ✅   ⚡   ○    ○    ○               │ │
│  │  Performance      ✅   ⚡   ○    ○    ○    ○               │ │
│  │  Testing          ⚡   ○    ○    ○    ○    ○               │ │
│  │                                                              │ │
│  │  ✅ Mastered  ⚡ In Progress  ○ Not Started                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Recommended Actions ──────────────────────────────────────┐ │
│  │                                                              │ │
│  │  🎯 Focus Area: Analysis Skills                              │ │
│  │                                                              │ │
│  │  [Practice Analysis Questions]  [Review Weak Concepts]      │ │
│  │  [Take Adaptive Quiz]          [Generate Study Guide]       │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

#### 1.1 Database Schema Updates
- [ ] Add new Prisma models (EnhancedQuestion, LearningObjective, CognitiveSkillProgress, etc.)
- [ ] Run migrations
- [ ] Update seed data

#### 1.2 Core Engine Updates
- [ ] Enhance BloomsAnalysisEngine with new cognitive skill mapping
- [ ] Update AssessmentEngine with improved question generation
- [ ] Add SubjectiveEvaluator for essay/short answer AI evaluation

#### 1.3 API Routes
- [ ] Create `/api/exams/generate` endpoint for AI generation
- [ ] Create `/api/exams/evaluate` endpoint for AI evaluation
- [ ] Update existing exam routes with new features

### Phase 2: Question Creation (Weeks 4-6)

#### 2.1 Manual Question Creator
- [ ] Build question creation form with Bloom's guidance
- [ ] Add question type-specific editors (MCQ, Essay, etc.)
- [ ] Implement question preview and validation

#### 2.2 AI Question Generator
- [ ] Build AI generation interface with Bloom's distribution controls
- [ ] Implement question review and editing workflow
- [ ] Add bulk generation with quality filters

#### 2.3 Question Bank
- [ ] Build question bank browser with filters
- [ ] Add question import/export functionality
- [ ] Implement question versioning

### Phase 3: Evaluation System (Weeks 7-9)

#### 3.1 Auto-Grading Engine
- [ ] Implement objective question evaluators
- [ ] Add partial credit logic
- [ ] Build answer validation rules

#### 3.2 AI Evaluation Engine
- [ ] Implement SAM-powered essay evaluation
- [ ] Build rubric-based scoring system
- [ ] Add confidence scoring and human review flags

#### 3.3 Feedback Generation
- [ ] Create personalized feedback templates
- [ ] Implement strength/weakness detection
- [ ] Build recommendation engine

### Phase 4: Analytics & Progress (Weeks 10-12)

#### 4.1 Student Dashboard
- [ ] Build cognitive growth dashboard
- [ ] Create Bloom's radar chart visualization
- [ ] Implement skills mastery grid

#### 4.2 Teacher Analytics
- [ ] Build exam effectiveness analytics
- [ ] Create question-level insights
- [ ] Implement class performance by Bloom's level

#### 4.3 Predictive Features
- [ ] Add learning path recommendations
- [ ] Implement spaced repetition scheduling
- [ ] Build intervention alert system

### Phase 5: Polish & Optimization (Weeks 13-14)

#### 5.1 Performance
- [ ] Optimize database queries
- [ ] Add caching for analytics
- [ ] Implement lazy loading for large exams

#### 5.2 UX Improvements
- [ ] Add keyboard shortcuts
- [ ] Implement autosave
- [ ] Add progress indicators

#### 5.3 Testing & Documentation
- [ ] Write comprehensive tests
- [ ] Create API documentation
- [ ] Write user guides

---

## 10. Future Enhancements

### 10.1 Advanced Features

1. **Peer Assessment**
   - Students evaluate each other's essays
   - Calibration against expert scores
   - Build critical evaluation skills

2. **Gamification**
   - Achievement badges for Bloom's level progression
   - Leaderboards (optional, privacy-respecting)
   - Daily challenges

3. **Collaborative Exams**
   - Group projects with individual accountability
   - Real-time collaboration features
   - Role-based contributions

4. **Voice & Video Responses**
   - Oral exam capabilities
   - Video presentation assessments
   - AI transcription and analysis

### 10.2 Integration Possibilities

1. **LMS Integration**
   - Export SCORM packages
   - QTI question format support
   - Grade sync with external systems

2. **Accessibility**
   - Screen reader optimization
   - High contrast mode
   - Extended time accommodations

3. **Mobile App**
   - Native exam taking experience
   - Offline mode support
   - Push notifications for study reminders

### 10.3 AI Advancements

1. **Adaptive Testing (CAT)**
   - Item Response Theory implementation
   - Real-time difficulty adjustment
   - Shorter, more accurate assessments

2. **Multi-Modal Understanding**
   - Image-based questions
   - Diagram analysis
   - Code execution evaluation

3. **Emotional Intelligence**
   - Frustration detection
   - Encouragement timing
   - Stress reduction features

---

## Summary

This comprehensive plan provides a roadmap for building a world-class exam and evaluation system that:

1. **Supports dual modes** - Both self-learners and course creators
2. **Develops cognitive skills** - Systematic progression through Bloom's Taxonomy
3. **Leverages AI** - SAM AI for question generation, evaluation, and personalized feedback
4. **Provides deep analytics** - Track cognitive growth and identify learning gaps
5. **Enables quality exams** - Built-in validation and Bloom's alignment scoring

The system is designed to be modular, allowing SAM AI to be packaged separately for use in other applications while maintaining tight integration with Taxomind's learning management features.

---

*Document Version: 1.0*
*Created: December 2024*
*Author: Claude AI Assistant*
*Status: Planning Phase*
