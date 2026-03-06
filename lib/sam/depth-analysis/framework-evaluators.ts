/**
 * Agentic Depth Analysis - Multi-Framework Evaluators
 *
 * Unifies rule-based evaluators from @sam-ai/pedagogy
 * with AI-powered deep analysis from the orchestrator.
 *
 * The blended approach uses rules as fast validation
 * and AI for nuanced, context-aware classification.
 */

import { logger } from '@/lib/logger';
import { createBloomsAligner } from '@sam-ai/pedagogy';
import type { PedagogicalContent, BloomsLevel as PedBloomsLevel, BloomsAlignerResult } from '@sam-ai/pedagogy';
import type { BloomsLevel, BloomsDistribution, FrameworkScores } from './types';

export interface MultiFrameworkResult {
  bloomsDistribution: BloomsDistribution;
  dominantBloomsLevel: BloomsLevel;
  frameworkScores: FrameworkScores;
  ruleBasedBloomsScore: number;
  aiBloomsScore: number | null;
  blendedBloomsScore: number;
  confidence: number;
  verbAnalysis: string[];
}

export interface BlendConfig {
  aiWeight: number;      // 0-1, weight for AI results (default 0.7)
  rulesWeight: number;   // 0-1, weight for rule-based results (default 0.3)
  conflictThreshold: number; // Score diff that triggers a flag (default 25)
}

const DEFAULT_BLEND_CONFIG: BlendConfig = {
  aiWeight: 0.7,
  rulesWeight: 0.3,
  conflictThreshold: 25,
};

/**
 * Runs rule-based Bloom's classification using @sam-ai/pedagogy.
 * Fast, deterministic - used as validation baseline.
 */
export async function evaluateBloomsRuleBased(
  sectionContent: string,
  objectives: string[],
  targetLevel?: BloomsLevel
): Promise<{
  distribution: BloomsDistribution;
  dominantLevel: BloomsLevel;
  alignmentScore: number;
  verbAnalysis: string[];
}> {
  try {
    const aligner = createBloomsAligner();
    const content: PedagogicalContent = {
      content: sectionContent,
      targetBloomsLevel: (targetLevel ?? 'UNDERSTAND') as PedBloomsLevel,
      objectives,
    };

    const result: BloomsAlignerResult = await aligner.evaluate(content);

    const distribution: BloomsDistribution = {
      REMEMBER: result.distribution?.REMEMBER ?? 0,
      UNDERSTAND: result.distribution?.UNDERSTAND ?? 0,
      APPLY: result.distribution?.APPLY ?? 0,
      ANALYZE: result.distribution?.ANALYZE ?? 0,
      EVALUATE: result.distribution?.EVALUATE ?? 0,
      CREATE: result.distribution?.CREATE ?? 0,
    };

    // Normalize to 100%
    const total = Object.values(distribution).reduce((s, v) => s + v, 0);
    if (total > 0 && Math.abs(total - 100) > 1) {
      const factor = 100 / total;
      for (const key of Object.keys(distribution) as BloomsLevel[]) {
        distribution[key] = Math.round(distribution[key] * factor);
      }
    }

    // If pedagogy library returned all zeros, fall back to verb-based analysis
    if (total === 0) {
      logger.info('[FrameworkEvaluators] Pedagogy library returned empty distribution, using verb-based fallback');
      const verbFallback = classifyBloomsByVerbs(sectionContent);
      for (const key of Object.keys(verbFallback) as BloomsLevel[]) {
        distribution[key] = verbFallback[key];
      }
    }

    const verbAnalysis = result.verbAnalysis?.verbs?.map(
      (v: { verb: string; level: string }) => `${v.verb} (${v.level})`
    ) ?? [];

    return {
      distribution,
      dominantLevel: (result.detectedLevel as BloomsLevel) ?? findDominantLevel(distribution),
      alignmentScore: result.alignmentScore ?? 60,
      verbAnalysis,
    };
  } catch (error) {
    logger.warn('[FrameworkEvaluators] Rule-based Bloom\'s evaluation failed', { error });
    return {
      distribution: { REMEMBER: 25, UNDERSTAND: 30, APPLY: 20, ANALYZE: 15, EVALUATE: 5, CREATE: 5 },
      dominantLevel: 'UNDERSTAND',
      alignmentScore: 50,
      verbAnalysis: [],
    };
  }
}

/**
 * Blends rule-based and AI results into a single coherent result.
 * AI is weighted more heavily (0.7) but rule-based provides calibration.
 * When results conflict significantly, both are flagged for review.
 */
export function blendFrameworkResults(
  ruleBasedDistribution: BloomsDistribution,
  ruleBasedScore: number,
  aiDistribution: BloomsDistribution | null,
  aiScore: number | null,
  config: BlendConfig = DEFAULT_BLEND_CONFIG
): MultiFrameworkResult {
  let blendedDistribution: BloomsDistribution;
  let blendedScore: number;
  let confidence: number;

  if (aiDistribution && aiScore !== null) {
    // Blend AI + rules
    blendedDistribution = {
      REMEMBER: Math.round(aiDistribution.REMEMBER * config.aiWeight + ruleBasedDistribution.REMEMBER * config.rulesWeight),
      UNDERSTAND: Math.round(aiDistribution.UNDERSTAND * config.aiWeight + ruleBasedDistribution.UNDERSTAND * config.rulesWeight),
      APPLY: Math.round(aiDistribution.APPLY * config.aiWeight + ruleBasedDistribution.APPLY * config.rulesWeight),
      ANALYZE: Math.round(aiDistribution.ANALYZE * config.aiWeight + ruleBasedDistribution.ANALYZE * config.rulesWeight),
      EVALUATE: Math.round(aiDistribution.EVALUATE * config.aiWeight + ruleBasedDistribution.EVALUATE * config.rulesWeight),
      CREATE: Math.round(aiDistribution.CREATE * config.aiWeight + ruleBasedDistribution.CREATE * config.rulesWeight),
    };

    blendedScore = Math.round(aiScore * config.aiWeight + ruleBasedScore * config.rulesWeight);

    // Confidence drops when AI and rules disagree significantly
    const scoreDiff = Math.abs(aiScore - ruleBasedScore);
    confidence = scoreDiff > config.conflictThreshold
      ? Math.max(0.4, 0.9 - (scoreDiff / 100))
      : 0.85;
  } else {
    // Rule-based only (AI call failed or not available)
    blendedDistribution = { ...ruleBasedDistribution };
    blendedScore = ruleBasedScore;
    confidence = 0.5; // Lower confidence without AI
  }

  // Normalize distribution to 100%
  const total = Object.values(blendedDistribution).reduce((s, v) => s + v, 0);
  if (total > 0 && Math.abs(total - 100) > 2) {
    const factor = 100 / total;
    for (const key of Object.keys(blendedDistribution) as BloomsLevel[]) {
      blendedDistribution[key] = Math.round(blendedDistribution[key] * factor);
    }
  }

  // Determine dominant level
  const dominantBloomsLevel = (Object.entries(blendedDistribution) as [BloomsLevel, number][])
    .sort(([, a], [, b]) => b - a)[0][0];

  return {
    bloomsDistribution: blendedDistribution,
    dominantBloomsLevel,
    frameworkScores: {
      blooms: blendedScore,
    },
    ruleBasedBloomsScore: ruleBasedScore,
    aiBloomsScore: aiScore,
    blendedBloomsScore: blendedScore,
    confidence,
    verbAnalysis: [],
  };
}

// =============================================================================
// VERB-BASED BLOOM'S CLASSIFICATION (fallback)
// =============================================================================

const BLOOMS_VERB_MAP: Record<BloomsLevel, string[]> = {
  REMEMBER: ['define', 'list', 'recall', 'identify', 'name', 'state', 'recognize', 'describe', 'label', 'match'],
  UNDERSTAND: ['explain', 'summarize', 'interpret', 'classify', 'discuss', 'paraphrase', 'translate', 'compare'],
  APPLY: ['apply', 'demonstrate', 'implement', 'solve', 'use', 'execute', 'practice', 'calculate', 'show'],
  ANALYZE: ['analyze', 'compare', 'contrast', 'examine', 'differentiate', 'organize', 'deconstruct', 'distinguish'],
  EVALUATE: ['evaluate', 'assess', 'judge', 'critique', 'justify', 'argue', 'defend', 'prioritize', 'recommend'],
  CREATE: ['create', 'design', 'develop', 'construct', 'produce', 'build', 'compose', 'formulate', 'invent'],
};

function classifyBloomsByVerbs(content: string): BloomsDistribution {
  const lowerContent = content.toLowerCase();
  const counts: Record<BloomsLevel, number> = {
    REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
  };

  for (const [level, verbs] of Object.entries(BLOOMS_VERB_MAP) as [BloomsLevel, string[]][]) {
    for (const verb of verbs) {
      const regex = new RegExp(`\\b${verb}\\w*\\b`, 'gi');
      const matches = lowerContent.match(regex);
      counts[level] += matches?.length ?? 0;
    }
  }

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;
  return {
    REMEMBER: Math.round((counts.REMEMBER / total) * 100),
    UNDERSTAND: Math.round((counts.UNDERSTAND / total) * 100),
    APPLY: Math.round((counts.APPLY / total) * 100),
    ANALYZE: Math.round((counts.ANALYZE / total) * 100),
    EVALUATE: Math.round((counts.EVALUATE / total) * 100),
    CREATE: Math.round((counts.CREATE / total) * 100),
  };
}

function findDominantLevel(dist: BloomsDistribution): BloomsLevel {
  return (Object.entries(dist) as [BloomsLevel, number][])
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'UNDERSTAND';
}
