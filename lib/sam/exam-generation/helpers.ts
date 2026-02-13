/**
 * Exam Generation Helpers
 *
 * Parsing, fallback generation, and quality scoring for the agentic exam builder.
 * These helpers are used by the orchestrator to parse AI responses and ensure
 * robustness when AI output is malformed.
 */

import type { BloomsLevel } from '@prisma/client';
import { logger } from '@/lib/logger';
import type {
  DecomposedConcept,
  PlannedQuestion,
  GeneratedQuestion,
  AssemblyValidation,
  AssemblyValidationCheck,
  CognitiveProfileTemplate,
  ExamQualityScore,
  ExamPurpose,
  QuestionFormat,
  ExamBuilderParams,
} from './agentic-types';
import { QUALITY_WEIGHTS, BLOOMS_LEVELS } from './agentic-types';

// =============================================================================
// BLOOM'S DISTRIBUTION PROFILES (from gold standard)
// =============================================================================

export const BLOOM_DISTRIBUTION_PROFILES: Record<
  ExamPurpose,
  Record<BloomsLevel, number>
> = {
  diagnostic: {
    REMEMBER: 15,
    UNDERSTAND: 20,
    APPLY: 25,
    ANALYZE: 20,
    EVALUATE: 15,
    CREATE: 5,
  },
  mastery: {
    REMEMBER: 5,
    UNDERSTAND: 10,
    APPLY: 20,
    ANALYZE: 25,
    EVALUATE: 25,
    CREATE: 15,
  },
  placement: {
    REMEMBER: 20,
    UNDERSTAND: 20,
    APPLY: 20,
    ANALYZE: 20,
    EVALUATE: 10,
    CREATE: 10,
  },
  'research-readiness': {
    REMEMBER: 5,
    UNDERSTAND: 10,
    APPLY: 15,
    ANALYZE: 20,
    EVALUATE: 25,
    CREATE: 25,
  },
};

// =============================================================================
// QUESTION TYPE MATRIX (which formats work for each Bloom's level)
// =============================================================================

export const QUESTION_TYPE_MATRIX: Record<BloomsLevel, QuestionFormat[]> = {
  REMEMBER: ['mcq', 'short_answer'],
  UNDERSTAND: ['mcq', 'short_answer', 'long_answer'],
  APPLY: ['mcq', 'short_answer', 'code_challenge'],
  ANALYZE: ['mcq', 'long_answer', 'design_problem'],
  EVALUATE: ['long_answer', 'design_problem', 'mcq'],
  CREATE: ['design_problem', 'long_answer', 'code_challenge'],
};

// =============================================================================
// BLOOM'S LEVEL CONFIG
// =============================================================================

export const BLOOMS_LEVEL_CONFIG: Record<
  BloomsLevel,
  {
    signalVerbs: string[];
    estimatedTimeSeconds: number;
    defaultPoints: number;
    questionPatterns: string[];
    distractorLogic: string[];
  }
> = {
  REMEMBER: {
    signalVerbs: [
      'define',
      'list',
      'name',
      'identify',
      'recall',
      'recognize',
      'state',
      'match',
      'label',
    ],
    estimatedTimeSeconds: 30,
    defaultPoints: 1,
    questionPatterns: [
      'What is the definition of ___?',
      'Which of the following is ___?',
      'Name the ___ that ___.',
      'Identify the ___.',
    ],
    distractorLogic: [
      'Commonly confused terms',
      'Plausible but incorrect definitions',
      'Partial truths missing key element',
      'Items from adjacent categories',
    ],
  },
  UNDERSTAND: {
    signalVerbs: [
      'explain',
      'describe',
      'summarize',
      'classify',
      'compare',
      'interpret',
      'discuss',
      'distinguish',
      'predict',
    ],
    estimatedTimeSeconds: 60,
    defaultPoints: 2,
    questionPatterns: [
      'Explain why ___.',
      'Compare ___ and ___.',
      'What would happen if ___?',
      'Summarize the key differences between ___.',
    ],
    distractorLogic: [
      'Surface-level vs deeper interpretation',
      'Partially correct but missing core idea',
      'Reversed relationships',
      'Predictions based on misconceptions',
    ],
  },
  APPLY: {
    signalVerbs: [
      'apply',
      'solve',
      'demonstrate',
      'use',
      'implement',
      'calculate',
      'show',
      'execute',
      'operate',
    ],
    estimatedTimeSeconds: 90,
    defaultPoints: 3,
    questionPatterns: [
      'Given ___, calculate ___.',
      'Apply ___ to solve ___.',
      'How would you implement ___?',
      'Use ___ to demonstrate ___.',
    ],
    distractorLogic: [
      'Wrong procedure applied',
      'Common calculation errors',
      'Works for similar but different problems',
      'Right method applied incorrectly',
    ],
  },
  ANALYZE: {
    signalVerbs: [
      'analyze',
      'compare',
      'contrast',
      'examine',
      'differentiate',
      'investigate',
      'categorize',
      'deconstruct',
    ],
    estimatedTimeSeconds: 120,
    defaultPoints: 4,
    questionPatterns: [
      'Analyze the relationship between ___.',
      'What patterns emerge from ___?',
      'Examine the evidence and identify ___.',
      'Differentiate between ___ and ___.',
    ],
    distractorLogic: [
      'Surface patterns missing deeper structure',
      'Correct components but wrong relationships',
      'Confusion of correlation with causation',
      'Conclusions from incomplete evidence',
    ],
  },
  EVALUATE: {
    signalVerbs: [
      'evaluate',
      'judge',
      'critique',
      'justify',
      'argue',
      'defend',
      'assess',
      'rate',
      'prioritize',
      'recommend',
    ],
    estimatedTimeSeconds: 150,
    defaultPoints: 5,
    questionPatterns: [
      'Evaluate the effectiveness of ___.',
      'Which approach is best and why?',
      'Critique the following ___.',
      'Justify your recommendation for ___.',
    ],
    distractorLogic: [
      'Judgment based on single criteria ignoring trade-offs',
      'Evaluation applying wrong criteria',
      'Opinion confused with evidence-based judgment',
      'Missing critical flaws or overweighting minor issues',
    ],
  },
  CREATE: {
    signalVerbs: [
      'create',
      'design',
      'develop',
      'propose',
      'formulate',
      'construct',
      'invent',
      'compose',
      'plan',
      'synthesize',
    ],
    estimatedTimeSeconds: 180,
    defaultPoints: 6,
    questionPatterns: [
      'Design a ___ that ___.',
      'Propose a solution for ___.',
      'Develop a framework for ___.',
      'Create an original ___ that addresses ___.',
    ],
    distractorLogic: [
      'Mere recombination without novelty',
      'Solves wrong problem',
      'Meets some requirements but misses key constraints',
      'Lacks feasibility or internal consistency',
    ],
  },
};

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

function extractJsonFromResponse(raw: string): unknown {
  const trimmed = raw.trim();

  // Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to extraction
  }

  // Remove markdown code fences
  const fenced = trimmed.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '');
  try {
    return JSON.parse(fenced);
  } catch {
    // Continue
  }

  // Extract array or object
  const arrayMatch = fenced.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // Continue
    }
  }

  const objMatch = fenced.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      // Continue
    }
  }

  return null;
}

/** Parse Stage 1: Topic Decomposition response into concepts */
export function parseConceptDecomposition(raw: string): DecomposedConcept[] {
  const parsed = extractJsonFromResponse(raw);
  if (!parsed || !Array.isArray(parsed)) {
    logger.warn('[ExamHelpers] Failed to parse concept decomposition');
    return [];
  }

  return parsed
    .map((item: Record<string, unknown>): DecomposedConcept | null => {
      const name = String(item.name ?? '').trim();
      if (!name) return null;

      return {
        name,
        description: String(item.description ?? ''),
        prerequisites: Array.isArray(item.prerequisites)
          ? (item.prerequisites as string[])
          : [],
        commonMisconceptions: Array.isArray(item.commonMisconceptions)
          ? (item.commonMisconceptions as string[])
          : [],
        importance:
          item.importance === 'core' ||
          item.importance === 'supporting' ||
          item.importance === 'advanced'
            ? item.importance
            : 'supporting',
      };
    })
    .filter((c): c is DecomposedConcept => c !== null);
}

/** Parse Stage 2: Bloom&apos;s Distribution Planning response */
export function parseBloomsDistribution(
  raw: string,
  params: ExamBuilderParams
): PlannedQuestion[] {
  const parsed = extractJsonFromResponse(raw);
  if (!parsed || !Array.isArray(parsed)) {
    logger.warn('[ExamHelpers] Failed to parse Bloom&apos;s distribution');
    return [];
  }

  return parsed
    .map((item: Record<string, unknown>): PlannedQuestion | null => {
      const concept = String(item.concept ?? '').trim();
      const bloomsLevel = String(item.bloomsLevel ?? '') as BloomsLevel;

      if (!concept || !BLOOMS_LEVELS.includes(bloomsLevel as typeof BLOOMS_LEVELS[number])) {
        return null;
      }

      const config = BLOOMS_LEVEL_CONFIG[bloomsLevel];

      // Map question format
      let questionFormat = String(item.questionFormat ?? 'mcq') as QuestionFormat;
      const validFormats: QuestionFormat[] = [
        'mcq',
        'short_answer',
        'long_answer',
        'design_problem',
        'code_challenge',
      ];
      if (!validFormats.includes(questionFormat)) {
        questionFormat = 'mcq';
      }

      // Filter to allowed formats
      if (!params.questionFormats.includes(questionFormat)) {
        questionFormat = params.questionFormats[0] ?? 'mcq';
      }

      const diff = Number(item.difficulty);
      const difficulty = (diff >= 1 && diff <= 5 ? diff : 3) as 1 | 2 | 3 | 4 | 5;

      return {
        concept,
        bloomsLevel,
        questionFormat,
        difficulty,
        estimatedTimeSeconds:
          Number(item.estimatedTimeSeconds) || config.estimatedTimeSeconds,
        points: Number(item.points) || config.defaultPoints,
      };
    })
    .filter((q): q is PlannedQuestion => q !== null);
}

/** Parse Stage 3: Generated question response */
export function parseGeneratedQuestion(
  raw: string,
  plan: PlannedQuestion
): GeneratedQuestion | null {
  const parsed = extractJsonFromResponse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    logger.warn('[ExamHelpers] Failed to parse generated question');
    return null;
  }

  const item = parsed as Record<string, unknown>;
  const stem = String(item.stem ?? item.question ?? '').trim();
  if (!stem) return null;

  const config = BLOOMS_LEVEL_CONFIG[plan.bloomsLevel];

  // Parse options for MCQ
  let options: GeneratedQuestion['options'];
  if (Array.isArray(item.options)) {
    options = (item.options as Array<Record<string, unknown>>).map((opt) => ({
      text: String(opt.text ?? ''),
      isCorrect: Boolean(opt.isCorrect),
      diagnosticNote: String(opt.diagnosticNote ?? ''),
    }));
  }

  return {
    id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    stem,
    bloomsLevel: plan.bloomsLevel,
    concept: plan.concept,
    questionType: plan.questionFormat,
    difficulty: plan.difficulty,
    points: plan.points,
    estimatedTimeSeconds: plan.estimatedTimeSeconds,
    options,
    correctAnswer: String(item.correctAnswer ?? ''),
    reasoningTrace: String(item.reasoningTrace ?? ''),
    diagnosticNotes: String(item.diagnosticNotes ?? ''),
    explanation: String(item.explanation ?? ''),
    hint: item.hint ? String(item.hint) : undefined,
    remediationSuggestion: String(item.remediationSuggestion ?? ''),
    cognitiveSkills: Array.isArray(item.cognitiveSkills)
      ? (item.cognitiveSkills as string[])
      : config.signalVerbs.slice(0, 2),
    relatedConcepts: Array.isArray(item.relatedConcepts)
      ? (item.relatedConcepts as string[])
      : [],
    signalVerbs: Array.isArray(item.signalVerbs)
      ? (item.signalVerbs as string[])
      : [],
  };
}

/** Parse Stage 4: Assembly validation response */
export function parseAssemblyValidation(raw: string): AssemblyValidation {
  const parsed = extractJsonFromResponse(raw);
  const defaultCheck: AssemblyValidationCheck = {
    passed: true,
    message: 'Not validated',
  };

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return buildDefaultValidation();
  }

  const item = parsed as Record<string, unknown>;

  function parseCheck(
    val: unknown
  ): AssemblyValidationCheck {
    if (!val || typeof val !== 'object') return defaultCheck;
    const v = val as Record<string, unknown>;
    return {
      passed: Boolean(v.passed ?? true),
      message: String(v.message ?? ''),
    };
  }

  const answerIndep = item.answerIndependence as Record<string, unknown> | undefined;
  const timeBudget = item.timeBudget as Record<string, unknown> | undefined;
  const bloomsMatch = item.bloomsDistributionMatch as Record<string, unknown> | undefined;

  return {
    conceptCoverage: parseCheck(item.conceptCoverage),
    bloomsDistributionMatch: {
      ...parseCheck(item.bloomsDistributionMatch),
      deviation: Number(bloomsMatch?.deviation ?? 0),
    },
    difficultyCurve: parseCheck(item.difficultyCurve),
    answerIndependence: {
      ...parseCheck(item.answerIndependence),
      leaks: Array.isArray(answerIndep?.leaks)
        ? (answerIndep.leaks as string[])
        : [],
    },
    timeBudget: {
      ...parseCheck(item.timeBudget),
      totalMinutes: Number(timeBudget?.totalMinutes ?? 0),
      limitMinutes:
        timeBudget?.limitMinutes != null
          ? Number(timeBudget.limitMinutes)
          : null,
    },
    formatVariety: parseCheck(item.formatVariety),
    cognitiveLoadBalance: parseCheck(item.cognitiveLoadBalance),
  };
}

/** Parse Stage 5: Cognitive profile template response */
export function parseCognitiveProfile(raw: string): CognitiveProfileTemplate {
  const parsed = extractJsonFromResponse(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return buildDefaultCognitiveProfile();
  }

  const item = parsed as Record<string, unknown>;

  // Parse bloomsLevelScoring
  const scoring: CognitiveProfileTemplate['bloomsLevelScoring'] = {} as CognitiveProfileTemplate['bloomsLevelScoring'];
  const rawScoring = item.bloomsLevelScoring as Record<string, unknown> | undefined;

  for (const level of BLOOMS_LEVELS) {
    const levelData = rawScoring?.[level] as Record<string, unknown> | undefined;
    scoring[level as BloomsLevel] = {
      questionIds: Array.isArray(levelData?.questionIds)
        ? (levelData.questionIds as string[])
        : [],
      maxPoints: Number(levelData?.maxPoints ?? 0),
    };
  }

  // Parse remediationMap
  const remediation: Record<BloomsLevel, string> = {} as Record<BloomsLevel, string>;
  const rawRemediation = item.remediationMap as Record<string, unknown> | undefined;
  for (const level of BLOOMS_LEVELS) {
    remediation[level as BloomsLevel] = String(
      rawRemediation?.[level] ?? `Review ${level.toLowerCase()}-level concepts`
    );
  }

  return {
    bloomsLevelScoring: scoring,
    ceilingLevelThreshold: Number(item.ceilingLevelThreshold ?? 80),
    growthEdgeLogic: String(
      item.growthEdgeLogic ??
        'The growth edge is the highest Bloom&apos;s level where the student scores above the ceiling threshold'
    ),
    remediationMap: remediation,
  };
}

// =============================================================================
// FALLBACK GENERATORS
// =============================================================================

/** Fallback concepts when AI response is unparseable */
export function buildFallbackConcepts(
  topic: string,
  subtopics: string[]
): DecomposedConcept[] {
  if (subtopics.length === 0) {
    return [
      {
        name: topic,
        description: `Core concepts of ${topic}`,
        prerequisites: [],
        commonMisconceptions: [],
        importance: 'core',
      },
    ];
  }

  return subtopics.map((sub, idx) => ({
    name: sub,
    description: `${sub} within the context of ${topic}`,
    prerequisites: idx > 0 ? [subtopics[idx - 1]] : [],
    commonMisconceptions: [],
    importance: (idx === 0 ? 'core' : 'supporting') as 'core' | 'supporting',
  }));
}

/** Fallback distribution when AI response is unparseable */
export function buildFallbackDistribution(
  params: ExamBuilderParams,
  concepts: DecomposedConcept[]
): PlannedQuestion[] {
  const profile =
    params.bloomsDistribution !== 'auto'
      ? params.bloomsDistribution
      : BLOOM_DISTRIBUTION_PROFILES[params.examPurpose];

  const plan: PlannedQuestion[] = [];
  let remaining = params.questionCount;

  // Distribute questions across levels based on profile
  for (const level of BLOOMS_LEVELS) {
    const bl = level as BloomsLevel;
    const percentage = profile[bl] ?? 0;
    const count = Math.round((percentage / 100) * params.questionCount);
    const config = BLOOMS_LEVEL_CONFIG[bl];

    for (let i = 0; i < count && remaining > 0; i++) {
      const concept = concepts[i % concepts.length];
      const allowedFormats = QUESTION_TYPE_MATRIX[bl].filter((f) =>
        params.questionFormats.includes(f)
      );
      const format = allowedFormats[i % allowedFormats.length] ?? params.questionFormats[0] ?? 'mcq';

      plan.push({
        concept: concept.name,
        bloomsLevel: bl,
        questionFormat: format,
        difficulty: Math.min(
          5,
          Math.max(1, BLOOMS_LEVELS.indexOf(level) + 1)
        ) as 1 | 2 | 3 | 4 | 5,
        estimatedTimeSeconds: config.estimatedTimeSeconds,
        points: config.defaultPoints,
      });
      remaining--;
    }
  }

  return plan;
}

/** Fallback question when AI response is unparseable */
export function buildFallbackQuestion(plan: PlannedQuestion): GeneratedQuestion {
  const config = BLOOMS_LEVEL_CONFIG[plan.bloomsLevel];
  const verb = config.signalVerbs[0] ?? 'explain';

  return {
    id: `eq-fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    stem: `${verb.charAt(0).toUpperCase() + verb.slice(1)} the concept of ${plan.concept}.`,
    bloomsLevel: plan.bloomsLevel,
    concept: plan.concept,
    questionType: plan.questionFormat,
    difficulty: plan.difficulty,
    points: plan.points,
    estimatedTimeSeconds: plan.estimatedTimeSeconds,
    correctAnswer: `A comprehensive response demonstrating ${plan.bloomsLevel.toLowerCase()}-level understanding of ${plan.concept}.`,
    reasoningTrace: `The student should ${verb} ${plan.concept} at the ${plan.bloomsLevel} cognitive level.`,
    diagnosticNotes: `If the student cannot ${verb} this concept, they may lack foundational understanding of ${plan.concept}.`,
    explanation: `This question tests ${plan.bloomsLevel.toLowerCase()}-level cognition for ${plan.concept}.`,
    remediationSuggestion: `Review the fundamentals of ${plan.concept} and practice ${plan.bloomsLevel.toLowerCase()}-level tasks.`,
    cognitiveSkills: config.signalVerbs.slice(0, 2),
    relatedConcepts: [],
    signalVerbs: [verb],
  };
}

// =============================================================================
// QUALITY SCORING
// =============================================================================

/** Score a generated question against its plan */
export function scoreQuestion(
  question: GeneratedQuestion,
  plan: PlannedQuestion
): ExamQualityScore {
  const config = BLOOMS_LEVEL_CONFIG[plan.bloomsLevel];

  // Bloom&apos;s Alignment (30%): Check signal verbs and level match
  let bloomsAlignment = 50;
  if (question.bloomsLevel === plan.bloomsLevel) bloomsAlignment += 20;
  if (question.signalVerbs.length > 0) {
    const matchingVerbs = question.signalVerbs.filter((v) =>
      config.signalVerbs.includes(v.toLowerCase())
    );
    bloomsAlignment += Math.min(30, matchingVerbs.length * 10);
  }
  if (question.reasoningTrace.length > 50) bloomsAlignment += 10;
  bloomsAlignment = Math.min(100, bloomsAlignment);

  // Clarity (20%): Stem length, no double negatives, clear language
  let clarity = 60;
  if (question.stem.length > 20 && question.stem.length < 500) clarity += 15;
  if (question.stem.endsWith('?') || question.stem.endsWith('.')) clarity += 10;
  if (!question.stem.includes('not not') && !question.stem.includes('n&apos;t not')) {
    clarity += 15;
  }
  clarity = Math.min(100, clarity);

  // Distractor Quality (20%): For MCQ, check diagnostic notes
  let distractorQuality = 70; // default for non-MCQ
  if (question.questionType === 'mcq' && question.options) {
    distractorQuality = 40;
    const withDiagnostic = question.options.filter(
      (o) => !o.isCorrect && o.diagnosticNote.length > 10
    );
    const wrongOptions = question.options.filter((o) => !o.isCorrect);
    if (wrongOptions.length > 0) {
      distractorQuality += Math.round(
        (withDiagnostic.length / wrongOptions.length) * 40
      );
    }
    if (question.options.filter((o) => o.isCorrect).length === 1) {
      distractorQuality += 20;
    }
  }
  distractorQuality = Math.min(100, distractorQuality);

  // Diagnostic Value (15%): Reasoning trace and diagnostic notes
  let diagnosticValue = 30;
  if (question.reasoningTrace.length > 30) diagnosticValue += 25;
  if (question.diagnosticNotes.length > 20) diagnosticValue += 20;
  if (question.remediationSuggestion.length > 10) diagnosticValue += 15;
  if (question.explanation.length > 30) diagnosticValue += 10;
  diagnosticValue = Math.min(100, diagnosticValue);

  // Cognitive Rigor (15%): Appropriate for difficulty and Bloom&apos;s level
  let cognitiveRigor = 50;
  if (question.difficulty === plan.difficulty) cognitiveRigor += 20;
  if (question.points === plan.points) cognitiveRigor += 10;
  if (question.cognitiveSkills.length > 0) cognitiveRigor += 10;
  if (question.relatedConcepts.length > 0) cognitiveRigor += 10;
  cognitiveRigor = Math.min(100, cognitiveRigor);

  // Weighted overall
  const overall = Math.round(
    bloomsAlignment * QUALITY_WEIGHTS.bloomsAlignment +
      clarity * QUALITY_WEIGHTS.clarity +
      distractorQuality * QUALITY_WEIGHTS.distractorQuality +
      diagnosticValue * QUALITY_WEIGHTS.diagnosticValue +
      cognitiveRigor * QUALITY_WEIGHTS.cognitiveRigor
  );

  return {
    bloomsAlignment,
    clarity,
    distractorQuality,
    diagnosticValue,
    cognitiveRigor,
    overall,
  };
}

// =============================================================================
// DEFAULTS
// =============================================================================

function buildDefaultValidation(): AssemblyValidation {
  const ok: AssemblyValidationCheck = { passed: true, message: 'Validation skipped (AI parse failure)' };
  return {
    conceptCoverage: ok,
    bloomsDistributionMatch: { ...ok, deviation: 0 },
    difficultyCurve: ok,
    answerIndependence: { ...ok, leaks: [] },
    timeBudget: { ...ok, totalMinutes: 0, limitMinutes: null },
    formatVariety: ok,
    cognitiveLoadBalance: ok,
  };
}

function buildDefaultCognitiveProfile(): CognitiveProfileTemplate {
  const scoring: CognitiveProfileTemplate['bloomsLevelScoring'] =
    {} as CognitiveProfileTemplate['bloomsLevelScoring'];
  const remediation: Record<BloomsLevel, string> = {} as Record<BloomsLevel, string>;

  for (const level of BLOOMS_LEVELS) {
    scoring[level as BloomsLevel] = { questionIds: [], maxPoints: 0 };
    remediation[level as BloomsLevel] = `Review ${level.toLowerCase()}-level concepts`;
  }

  return {
    bloomsLevelScoring: scoring,
    ceilingLevelThreshold: 80,
    growthEdgeLogic:
      'The growth edge is the highest Bloom&apos;s level where the student scores above the ceiling threshold',
    remediationMap: remediation,
  };
}
