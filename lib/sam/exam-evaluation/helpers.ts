/**
 * Exam Evaluation Helpers
 *
 * Parsing, fallback generation, scoring, and aggregation functions for
 * the DIAGNOSE exam evaluation pipeline.
 */

import type { BloomsLevel } from '@prisma/client';
import { logger } from '@/lib/logger';
import type {
  AnswerDiagnosis,
  AnswerScores,
  EchoBack,
  CognitiveProfile,
  ImprovementRoadmap,
  ReasoningPath,
  TripleAccuracyDiagnosis,
  GapSeverity,
  BloomsMasteryStatus,
  MisconceptionEntry,
} from './agentic-types';
import {
  BLOOMS_LEVELS,
  BLOOMS_LEVEL_ORDER,
  SCORING_WEIGHTS,
} from './agentic-types';
import { MISCONCEPTION_TAXONOMY, GAP_TO_ARROW_PHASES } from './diagnose-system-prompt';

// =============================================================================
// JSON EXTRACTION
// =============================================================================

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const fenced = trimmed.replace(/```json|```/g, '').trim();
  if (fenced.startsWith('{') || fenced.startsWith('[')) return fenced;
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function safeJsonParse<T>(raw: string, label: string): T | null {
  try {
    return JSON.parse(extractJson(raw)) as T;
  } catch (error) {
    logger.warn(`[EvalHelpers] Failed to parse ${label}`, {
      error: error instanceof Error ? error.message : String(error),
      rawLength: raw.length,
    });
    return null;
  }
}

// =============================================================================
// BLOOM&apos;S GAP CALCULATION
// =============================================================================

export function calculateBloomsGap(target: BloomsLevel, demonstrated: BloomsLevel): number {
  return BLOOMS_LEVEL_ORDER[target] - BLOOMS_LEVEL_ORDER[demonstrated];
}

export function gapToSeverity(gap: number): GapSeverity {
  if (gap < 0) return 'exceeded';
  if (gap === 0) return 'met';
  if (gap === 1) return 'close';
  if (gap <= 3) return 'struggling';
  return 'fundamental';
}

// =============================================================================
// TRIPLE ACCURACY DIAGNOSIS
// =============================================================================

export function diagnoseTripleAccuracy(
  factual: boolean,
  logical: boolean,
  structural: boolean
): TripleAccuracyDiagnosis {
  if (factual && logical && structural) return 'MASTERY';
  if (factual && logical && !structural) return 'LEVEL_MISMATCH';
  if (factual && !logical && structural) return 'REASONING_GAP';
  if (!factual && logical && structural) return 'KNOWLEDGE_GAP';
  if (factual && !logical && !structural) return 'MEMORIZER';
  if (!factual && logical && !structural) return 'INTUITIVE_THINKER';
  if (!factual && !logical && structural) return 'SHAPE_WITHOUT_SUBSTANCE';
  return 'STARTING_POINT';
}

// =============================================================================
// SCORING
// =============================================================================

export function calculateCompositeScore(scores: AnswerScores): number {
  const composite =
    scores.factualAccuracyScore * SCORING_WEIGHTS.factualAccuracy +
    scores.logicalCoherenceScore * SCORING_WEIGHTS.logicalCoherence +
    scores.bloomsLevelMatchScore * SCORING_WEIGHTS.bloomsLevelMatch +
    scores.depthScore * SCORING_WEIGHTS.depth +
    scores.communicationScore * SCORING_WEIGHTS.communication;
  return Math.round(composite * 10) / 10;
}

// =============================================================================
// PARSING: Per-Answer Diagnosis
// =============================================================================

interface RawDiagnosis {
  targetBloomsLevel?: string;
  demonstratedLevel?: string;
  bloomsEvidence?: string;
  reasoningPath?: string;
  reasoningPathEvidence?: string;
  forkPoint?: string;
  factualAccuracy?: boolean;
  logicalAccuracy?: boolean;
  structuralAccuracy?: boolean;
  accuracyDetails?: string;
  breakdownPoint?: string;
  solidFoundation?: string[];
  breakdownType?: string;
  contaminatedSteps?: string[];
  misconceptions?: Array<{ id?: string; name?: string; category?: string; description?: string }>;
  currentState?: string;
  targetState?: string;
  interventionSteps?: Array<{ step?: number; action?: string; arrowPhase?: string; successCriteria?: string }>;
  verificationQuestion?: string;
  scores?: {
    factualAccuracyScore?: number;
    logicalCoherenceScore?: number;
    bloomsLevelMatchScore?: number;
    depthScore?: number;
    communicationScore?: number;
  };
  feedback?: string;
  strengths?: string[];
}

function isValidBloomsLevel(level: string | undefined): level is BloomsLevel {
  return !!level && (BLOOMS_LEVELS as readonly string[]).includes(level.toUpperCase());
}

function normalizeBloomsLevel(level: string | undefined): BloomsLevel {
  if (!level) return 'REMEMBER';
  const upper = level.toUpperCase();
  if ((BLOOMS_LEVELS as readonly string[]).includes(upper)) return upper as BloomsLevel;
  return 'REMEMBER';
}

const VALID_REASONING_PATHS = new Set<ReasoningPath>([
  'expert', 'valid_alternative', 'fragile', 'partial', 'wrong_model', 'guessing',
]);

function normalizeReasoningPath(path: string | undefined): ReasoningPath {
  if (!path) return 'guessing';
  const lower = path.toLowerCase().replace(/\s+/g, '_');
  if (VALID_REASONING_PATHS.has(lower as ReasoningPath)) return lower as ReasoningPath;
  return 'guessing';
}

export function parseDiagnosis(raw: string, questionId: string, targetLevel: BloomsLevel): AnswerDiagnosis {
  const parsed = safeJsonParse<RawDiagnosis>(raw, 'diagnosis');
  if (!parsed) return buildFallbackDiagnosis(questionId, targetLevel);

  const demonstratedLevel = normalizeBloomsLevel(parsed.demonstratedLevel);
  const gap = calculateBloomsGap(targetLevel, demonstratedLevel);
  const factual = parsed.factualAccuracy ?? false;
  const logical = parsed.logicalAccuracy ?? false;
  const structural = parsed.structuralAccuracy ?? false;

  const scores: AnswerScores = {
    factualAccuracyScore: clampScore(parsed.scores?.factualAccuracyScore ?? 5),
    logicalCoherenceScore: clampScore(parsed.scores?.logicalCoherenceScore ?? 5),
    bloomsLevelMatchScore: clampScore(parsed.scores?.bloomsLevelMatchScore ?? 5),
    depthScore: clampScore(parsed.scores?.depthScore ?? 5),
    communicationScore: clampScore(parsed.scores?.communicationScore ?? 5),
    composite: 0,
  };
  scores.composite = calculateCompositeScore(scores);

  const misconceptions: MisconceptionEntry[] = (parsed.misconceptions ?? [])
    .filter((m) => m.id && m.name)
    .map((m) => ({
      id: m.id ?? 'UNKNOWN',
      name: m.name ?? 'Unknown',
      category: (m.category as MisconceptionEntry['category']) ?? 'factual',
      description: m.description ?? '',
    }));

  return {
    questionId,
    targetBloomsLevel: targetLevel,
    demonstratedLevel,
    bloomsGap: gap,
    gapSeverity: gapToSeverity(gap),
    bloomsEvidence: parsed.bloomsEvidence ?? 'No evidence provided',
    reasoningPath: normalizeReasoningPath(parsed.reasoningPath),
    reasoningPathEvidence: parsed.reasoningPathEvidence ?? '',
    forkPoint: parsed.forkPoint,
    factualAccuracy: factual,
    logicalAccuracy: logical,
    structuralAccuracy: structural,
    tripleAccuracyDiagnosis: diagnoseTripleAccuracy(factual, logical, structural),
    accuracyDetails: parsed.accuracyDetails ?? '',
    breakdownPoint: parsed.breakdownPoint,
    solidFoundation: parsed.solidFoundation ?? [],
    breakdownType: parsed.breakdownType as AnswerDiagnosis['breakdownType'],
    contaminatedSteps: parsed.contaminatedSteps ?? [],
    misconceptions,
    currentState: parsed.currentState ?? 'Unable to determine',
    targetState: parsed.targetState ?? 'Unable to determine',
    interventionSteps: (parsed.interventionSteps ?? []).map((s, i) => ({
      step: s.step ?? i + 1,
      action: s.action ?? '',
      arrowPhase: s.arrowPhase,
      successCriteria: s.successCriteria ?? '',
    })),
    verificationQuestion: parsed.verificationQuestion ?? '',
    scores,
    feedback: parsed.feedback ?? 'Evaluation completed.',
    strengths: parsed.strengths ?? [],
  };
}

// =============================================================================
// PARSING: Echo-Back
// =============================================================================

interface RawEchoBack {
  hereIsWhatYouDid?: string;
  hereIsWhereItBroke?: string;
  hereIsHowExpertThinks?: string;
  keyInsight?: string;
  patternRecognition?: string;
  practiceQuestion?: string;
}

export function parseEchoBack(raw: string, questionId: string): EchoBack {
  const parsed = safeJsonParse<RawEchoBack>(raw, 'echo-back');
  if (!parsed) return buildFallbackEchoBack(questionId);

  return {
    questionId,
    hereIsWhatYouDid: parsed.hereIsWhatYouDid ?? '',
    hereIsWhereItBroke: parsed.hereIsWhereItBroke ?? '',
    hereIsHowExpertThinks: parsed.hereIsHowExpertThinks ?? '',
    keyInsight: parsed.keyInsight ?? '',
    patternRecognition: parsed.patternRecognition ?? '',
    practiceQuestion: parsed.practiceQuestion ?? '',
  };
}

// =============================================================================
// PARSING: Cognitive Profile
// =============================================================================

interface RawCognitiveProfile {
  bloomsCognitiveMap?: Record<string, { score?: number; status?: string; keyFinding?: string }>;
  cognitiveCeiling?: string;
  growthEdge?: string;
  criticalGap?: string;
  thinkingPatternAnalysis?: {
    dominantStyle?: string;
    description?: string;
    limitations?: string[];
  };
  reasoningPathDistribution?: Record<string, number>;
  strengthMap?: string[];
  vulnerabilityMap?: string[];
  misconceptionSummary?: Array<{ id?: string; name?: string; frequency?: number }>;
}

export function parseCognitiveProfile(raw: string): CognitiveProfile | null {
  const parsed = safeJsonParse<RawCognitiveProfile>(raw, 'cognitive-profile');
  if (!parsed) return null;

  const bloomsMap: CognitiveProfile['bloomsCognitiveMap'] = {} as CognitiveProfile['bloomsCognitiveMap'];
  for (const level of BLOOMS_LEVELS) {
    const entry = parsed.bloomsCognitiveMap?.[level];
    bloomsMap[level] = {
      score: clampScore(entry?.score ?? 0),
      status: normalizeStatus(entry?.status),
      keyFinding: entry?.keyFinding ?? '',
    };
  }

  return {
    bloomsCognitiveMap: bloomsMap,
    cognitiveCeiling: normalizeBloomsLevel(parsed.cognitiveCeiling),
    growthEdge: normalizeBloomsLevel(parsed.growthEdge),
    criticalGap: isValidBloomsLevel(parsed.criticalGap) ? normalizeBloomsLevel(parsed.criticalGap) : undefined,
    thinkingPatternAnalysis: {
      dominantStyle: parsed.thinkingPatternAnalysis?.dominantStyle ?? 'Unknown',
      description: parsed.thinkingPatternAnalysis?.description ?? '',
      limitations: parsed.thinkingPatternAnalysis?.limitations ?? [],
    },
    reasoningPathDistribution: normalizeReasoningDistribution(parsed.reasoningPathDistribution),
    strengthMap: parsed.strengthMap ?? [],
    vulnerabilityMap: parsed.vulnerabilityMap ?? [],
    misconceptionSummary: (parsed.misconceptionSummary ?? []).map((m) => ({
      id: m.id ?? 'UNKNOWN',
      name: m.name ?? 'Unknown',
      frequency: m.frequency ?? 1,
    })),
  };
}

// =============================================================================
// PARSING: Improvement Roadmap
// =============================================================================

interface RawImprovementRoadmap {
  priorities?: Array<{
    priority?: number;
    title?: string;
    arrowPhases?: string[];
    actions?: string[];
    successMetric?: string;
  }>;
  verificationQuestions?: Array<{ forGap?: string; question?: string }>;
  estimatedTimeToNextLevel?: string;
}

export function parseImprovementRoadmap(raw: string): ImprovementRoadmap | null {
  const parsed = safeJsonParse<RawImprovementRoadmap>(raw, 'improvement-roadmap');
  if (!parsed) return null;

  return {
    priorities: (parsed.priorities ?? []).map((p, i) => ({
      priority: p.priority ?? i + 1,
      title: p.title ?? '',
      arrowPhases: p.arrowPhases ?? [],
      actions: p.actions ?? [],
      successMetric: p.successMetric ?? '',
    })),
    verificationQuestions: (parsed.verificationQuestions ?? []).map((q) => ({
      forGap: q.forGap ?? '',
      question: q.question ?? '',
    })),
    estimatedTimeToNextLevel: parsed.estimatedTimeToNextLevel ?? 'Unable to estimate',
  };
}

// =============================================================================
// FALLBACK GENERATORS
// =============================================================================

export function buildFallbackDiagnosis(questionId: string, targetLevel: BloomsLevel): AnswerDiagnosis {
  return {
    questionId,
    targetBloomsLevel: targetLevel,
    demonstratedLevel: 'REMEMBER',
    bloomsGap: BLOOMS_LEVEL_ORDER[targetLevel],
    gapSeverity: 'struggling',
    bloomsEvidence: 'AI evaluation could not parse response; defaulting to baseline.',
    reasoningPath: 'guessing',
    reasoningPathEvidence: 'Unable to determine reasoning path from AI response.',
    factualAccuracy: false,
    logicalAccuracy: false,
    structuralAccuracy: false,
    tripleAccuracyDiagnosis: 'STARTING_POINT',
    accuracyDetails: 'Fallback evaluation — could not fully analyze student answer.',
    solidFoundation: [],
    contaminatedSteps: [],
    misconceptions: [],
    currentState: 'Unknown — evaluation parse failed',
    targetState: `Demonstrate ${targetLevel}-level understanding`,
    interventionSteps: [
      { step: 1, action: 'Review core concepts', arrowPhase: 'Acquire', successCriteria: 'Can define key terms' },
    ],
    verificationQuestion: 'Please try answering again with more detail.',
    scores: {
      factualAccuracyScore: 3,
      logicalCoherenceScore: 3,
      bloomsLevelMatchScore: 2,
      depthScore: 2,
      communicationScore: 3,
      composite: 2.6,
    },
    feedback: 'The evaluation could not fully parse the AI analysis. A baseline score has been assigned.',
    strengths: [],
  };
}

export function buildFallbackEchoBack(questionId: string): EchoBack {
  return {
    questionId,
    hereIsWhatYouDid: 'Unable to generate detailed echo-back for this answer.',
    hereIsWhereItBroke: '',
    hereIsHowExpertThinks: '',
    keyInsight: '',
    patternRecognition: '',
    practiceQuestion: '',
  };
}

export function buildFallbackCognitiveProfile(diagnoses: AnswerDiagnosis[]): CognitiveProfile {
  const bloomsMap = aggregateBloomsMap(diagnoses);
  const ceiling = findCognitiveCeiling(bloomsMap);
  const distribution = calculateReasoningDistribution(diagnoses);

  const strengths: string[] = [];
  const vulnerabilities: string[] = [];
  for (const level of BLOOMS_LEVELS) {
    const entry = bloomsMap[level];
    if (entry.status === 'mastery' || entry.status === 'solid') {
      strengths.push(`${level}: ${entry.keyFinding || 'Performing well'}`);
    } else if (entry.status === 'gap' || entry.status === 'emerging') {
      vulnerabilities.push(`${level}: ${entry.keyFinding || 'Needs work'}`);
    }
  }

  const misconceptionCounts = new Map<string, { name: string; count: number }>();
  for (const d of diagnoses) {
    for (const m of d.misconceptions) {
      const existing = misconceptionCounts.get(m.id);
      if (existing) {
        existing.count++;
      } else {
        misconceptionCounts.set(m.id, { name: m.name, count: 1 });
      }
    }
  }

  return {
    bloomsCognitiveMap: bloomsMap,
    cognitiveCeiling: ceiling,
    growthEdge: findGrowthEdge(ceiling),
    thinkingPatternAnalysis: {
      dominantStyle: getDominantStyle(distribution),
      description: 'Generated from answer-level analysis aggregation.',
      limitations: [],
    },
    reasoningPathDistribution: distribution,
    strengthMap: strengths,
    vulnerabilityMap: vulnerabilities,
    misconceptionSummary: Array.from(misconceptionCounts.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      frequency: data.count,
    })),
  };
}

export function buildFallbackRoadmap(profile: CognitiveProfile): ImprovementRoadmap {
  const priorities: ImprovementRoadmap['priorities'] = [];
  let priority = 1;

  for (const level of BLOOMS_LEVELS) {
    const entry = profile.bloomsCognitiveMap[level];
    if (entry.status === 'gap' || entry.status === 'emerging') {
      const arrowPhases = GAP_TO_ARROW_PHASES[entry.status === 'gap' ? 'fundamental' : 'struggling'] ?? ['Acquire'];
      priorities.push({
        priority: priority++,
        title: `Strengthen ${level} skills`,
        arrowPhases,
        actions: [`Review ${level}-level concepts`, `Practice with targeted exercises`],
        successMetric: `Score >= 60% on ${level}-level questions`,
      });
    }
    if (priority > 5) break;
  }

  const verificationQuestions = profile.misconceptionSummary.slice(0, 3).map((m) => ({
    forGap: m.name,
    question: `Can you explain the difference between your understanding and the correct concept for ${m.name}?`,
  }));

  return {
    priorities,
    verificationQuestions,
    estimatedTimeToNextLevel: 'Variable — depends on practice frequency',
  };
}

// =============================================================================
// PROFILE AGGREGATION
// =============================================================================

export function aggregateBloomsMap(
  diagnoses: AnswerDiagnosis[]
): CognitiveProfile['bloomsCognitiveMap'] {
  const map: CognitiveProfile['bloomsCognitiveMap'] = {} as CognitiveProfile['bloomsCognitiveMap'];

  for (const level of BLOOMS_LEVELS) {
    const levelDiagnoses = diagnoses.filter((d) => d.targetBloomsLevel === level);
    if (levelDiagnoses.length === 0) {
      map[level] = { score: 0, status: 'gap', keyFinding: 'No questions at this level' };
      continue;
    }

    const avgScore =
      levelDiagnoses.reduce((sum, d) => sum + d.scores.composite, 0) / levelDiagnoses.length;
    const normalizedScore = Math.round(avgScore * 10); // /10 -> /100

    map[level] = {
      score: normalizedScore,
      status: scoreToStatus(normalizedScore),
      keyFinding: summarizeLevelFindings(levelDiagnoses),
    };
  }

  return map;
}

export function calculateReasoningDistribution(
  diagnoses: AnswerDiagnosis[]
): Record<ReasoningPath, number> {
  const counts: Record<ReasoningPath, number> = {
    expert: 0,
    valid_alternative: 0,
    fragile: 0,
    partial: 0,
    wrong_model: 0,
    guessing: 0,
  };

  for (const d of diagnoses) {
    counts[d.reasoningPath]++;
  }

  const total = diagnoses.length || 1;
  const distribution: Record<ReasoningPath, number> = {} as Record<ReasoningPath, number>;
  for (const [path, count] of Object.entries(counts)) {
    distribution[path as ReasoningPath] = Math.round((count / total) * 100);
  }

  return distribution;
}

export function findCognitiveCeiling(
  bloomsMap: CognitiveProfile['bloomsCognitiveMap']
): BloomsLevel {
  let ceiling: BloomsLevel = 'REMEMBER';
  for (const level of BLOOMS_LEVELS) {
    if (bloomsMap[level].score >= 80) {
      ceiling = level;
    } else {
      break;
    }
  }
  return ceiling;
}

export function findGrowthEdge(ceiling: BloomsLevel): BloomsLevel {
  const idx = BLOOMS_LEVEL_ORDER[ceiling];
  const nextIdx = Math.min(idx + 1, BLOOMS_LEVELS.length - 1);
  return BLOOMS_LEVELS[nextIdx] as BloomsLevel;
}

// =============================================================================
// QUALITY SCORING (diagnosis quality, not answer quality)
// =============================================================================

export function scoreDiagnosisQuality(diagnosis: AnswerDiagnosis): number {
  let score = 0;
  const maxScore = 100;

  // Layer D: Bloom&apos;s detection (15 pts)
  if (diagnosis.bloomsEvidence.length > 20) score += 15;
  else if (diagnosis.bloomsEvidence.length > 5) score += 8;

  // Layer I: Reasoning path (15 pts)
  if (diagnosis.reasoningPathEvidence.length > 20) score += 15;
  else if (diagnosis.reasoningPath !== 'guessing') score += 8;

  // Layer A: Triple accuracy (10 pts)
  if (diagnosis.accuracyDetails.length > 20) score += 10;
  else score += 5;

  // Layer G: Gap-mapping (15 pts)
  if (diagnosis.solidFoundation.length > 0) score += 5;
  if (diagnosis.breakdownPoint) score += 5;
  if (diagnosis.breakdownType) score += 5;

  // Layer N: Misconceptions (10 pts)
  if (diagnosis.misconceptions.length > 0) score += 10;

  // Layer O: Improvement pathway (20 pts)
  if (diagnosis.interventionSteps.length > 0) score += 10;
  if (diagnosis.verificationQuestion.length > 10) score += 5;
  if (diagnosis.currentState.length > 10 && diagnosis.targetState.length > 10) score += 5;

  // Layer S: Scoring (15 pts)
  const { scores } = diagnosis;
  if (scores.composite > 0 && scores.composite <= 10) score += 10;
  if (diagnosis.feedback.length > 20) score += 5;

  return Math.min(score, maxScore);
}

// =============================================================================
// ECHO-BACK TARGET SELECTION
// =============================================================================

export function selectEchoBackTargets(
  diagnoses: AnswerDiagnosis[],
  n: number
): string[] {
  // Score each diagnosis by "impact value" for echo-back teaching
  const scored = diagnoses.map((d) => {
    let impactScore = 0;

    // Larger Bloom&apos;s gap = more impactful
    impactScore += Math.abs(d.bloomsGap) * 3;

    // Fragile correct answers are MOST dangerous
    if (d.reasoningPath === 'fragile') impactScore += 10;

    // Wrong model needs targeted correction
    if (d.reasoningPath === 'wrong_model') impactScore += 8;

    // Partial reasoning = good teaching opportunity
    if (d.reasoningPath === 'partial') impactScore += 5;

    // More misconceptions = higher priority
    impactScore += d.misconceptions.length * 3;

    // Lower composite scores = more room for improvement
    impactScore += (10 - d.scores.composite) * 2;

    return { questionId: d.questionId, impactScore };
  });

  scored.sort((a, b) => b.impactScore - a.impactScore);
  return scored.slice(0, n).map((s) => s.questionId);
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function clampScore(score: number | undefined): number {
  if (score === undefined || score === null || isNaN(score)) return 5;
  return Math.max(0, Math.min(10, score));
}

function scoreToStatus(score: number): BloomsMasteryStatus {
  if (score >= 80) return 'mastery';
  if (score >= 60) return 'solid';
  if (score >= 40) return 'developing';
  if (score >= 20) return 'emerging';
  return 'gap';
}

function normalizeStatus(status: string | undefined): BloomsMasteryStatus {
  if (!status) return 'gap';
  const lower = status.toLowerCase();
  if (lower === 'mastery') return 'mastery';
  if (lower === 'solid') return 'solid';
  if (lower === 'developing') return 'developing';
  if (lower === 'emerging') return 'emerging';
  return 'gap';
}

function normalizeReasoningDistribution(
  raw: Record<string, number> | undefined
): Record<ReasoningPath, number> {
  const base: Record<ReasoningPath, number> = {
    expert: 0,
    valid_alternative: 0,
    fragile: 0,
    partial: 0,
    wrong_model: 0,
    guessing: 0,
  };

  if (!raw) return base;

  for (const [key, value] of Object.entries(raw)) {
    const normalized = key.toLowerCase().replace(/\s+/g, '_');
    if (VALID_REASONING_PATHS.has(normalized as ReasoningPath)) {
      base[normalized as ReasoningPath] = typeof value === 'number' ? value : 0;
    }
  }

  return base;
}

function getDominantStyle(distribution: Record<ReasoningPath, number>): string {
  let maxPath: ReasoningPath = 'guessing';
  let maxPct = 0;
  for (const [path, pct] of Object.entries(distribution)) {
    if (pct > maxPct) {
      maxPct = pct;
      maxPath = path as ReasoningPath;
    }
  }
  const styleNames: Record<ReasoningPath, string> = {
    expert: 'Systematic Expert Reasoning',
    valid_alternative: 'Creative Alternative Thinking',
    fragile: 'Surface-Level Pattern Matching',
    partial: 'Developing Analytical Thinking',
    wrong_model: 'Misapplied Framework Reasoning',
    guessing: 'Unstructured Exploration',
  };
  return styleNames[maxPath];
}

function summarizeLevelFindings(diagnoses: AnswerDiagnosis[]): string {
  const avgComposite =
    diagnoses.reduce((sum, d) => sum + d.scores.composite, 0) / diagnoses.length;
  const paths = diagnoses.map((d) => d.reasoningPath);
  const dominantPath = getMostCommon(paths);
  const hasFragile = diagnoses.some((d) => d.reasoningPath === 'fragile');

  const parts: string[] = [];
  parts.push(`Avg score: ${avgComposite.toFixed(1)}/10`);
  parts.push(`Dominant path: ${dominantPath}`);
  if (hasFragile) parts.push('Fragile correct answers detected');

  return parts.join('. ');
}

function getMostCommon<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  let maxItem = arr[0];
  let maxCount = 0;
  for (const [item, count] of counts) {
    if (count > maxCount) {
      maxItem = item;
      maxCount = count;
    }
  }
  return maxItem;
}
