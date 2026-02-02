/**
 * Mode-Aware Intent Classifier
 *
 * Heuristic-based mode relevance scoring (Tier 1) with optional
 * AI-powered fallback (Tier 2) for ambiguous messages.
 *
 * Uses keyword vocabularies, natural language patterns, page context signals,
 * and conversation history to score each mode against the current message.
 *
 * Used by the validation stage to determine if a mode switch
 * should be suggested to the user.
 */

import { logger } from '@/lib/logger';
import type { ModeClassificationResult, ModeRelevanceScore } from '@/lib/sam/pipeline/types';
import { SAM_MODE_IDS } from './types';
import type { SAMModeId } from './types';
import { NATURAL_LANGUAGE_VOCABULARIES } from './natural-language-patterns';
// NOTE: The async AI-powered variant (classifyModeRelevanceAsync) lives in
// ./intent-classifier-async.ts to avoid pulling server-only deps into client bundles.

// =============================================================================
// KEYWORD VOCABULARIES (weighted)
// =============================================================================

interface WeightedKeyword {
  pattern: RegExp;
  weight: number;
}

const MODE_VOCABULARIES: Partial<Record<SAMModeId, WeightedKeyword[]>> = {
  'blooms-analyzer': [
    { pattern: /\bbloom('?s)?\b/i, weight: 3 },
    { pattern: /\bcognitive\s+level/i, weight: 2 },
    { pattern: /\btaxonomy\b/i, weight: 2 },
    { pattern: /\bremember|understand|apply|analyze|evaluate|create\b/i, weight: 1 },
    { pattern: /\bcognitive\s+depth\b/i, weight: 2 },
  ],
  'content-creator': [
    { pattern: /\b(generate|create|write|draft|build)\s+(content|lesson|module|material)/i, weight: 3 },
    { pattern: /\bcurriculum\b/i, weight: 2 },
    { pattern: /\blearning\s+(objective|outcome)/i, weight: 2 },
  ],
  'exam-builder': [
    { pattern: /\b(create|build|make|generate)\s+(exam|quiz|test|assessment)/i, weight: 3 },
    { pattern: /\brubric\b/i, weight: 2 },
    { pattern: /\bmcq|multiple\s+choice/i, weight: 2 },
    { pattern: /\bquestion\s+(bank|set)/i, weight: 2 },
  ],
  'practice-problems': [
    { pattern: /\bpractice\s+(problem|exercise|question)/i, weight: 3 },
    { pattern: /\bworked\s+example/i, weight: 2 },
    { pattern: /\bdrill\b/i, weight: 2 },
  ],
  'socratic-tutor': [
    { pattern: /\bsocratic\b/i, weight: 3 },
    { pattern: /\bguide\s+me\b/i, weight: 2 },
    { pattern: /\bhelp\s+me\s+understand\b/i, weight: 1.5 },
    { pattern: /\bdon('?t)\s+give\s+me\s+the\s+answer\b/i, weight: 2 },
    { pattern: /\bask\s+me\s+questions\b/i, weight: 2 },
  ],
  'study-planner': [
    { pattern: /\bstudy\s+(plan|schedule|routine)/i, weight: 3 },
    { pattern: /\bdeadline\b/i, weight: 1.5 },
    { pattern: /\bhow\s+(long|much\s+time)\b/i, weight: 1 },
    { pattern: /\bprepare\s+for\b/i, weight: 1 },
  ],
  'research-assistant': [
    { pattern: /\bresearch\b/i, weight: 2 },
    { pattern: /\b(find|search)\s+(papers|articles|studies)/i, weight: 3 },
    { pattern: /\bcite|citation|reference/i, weight: 2 },
    { pattern: /\bliterature\s+review\b/i, weight: 3 },
  ],
  'resource-finder': [
    { pattern: /\b(find|recommend|suggest)\s+(resource|video|article|book|tutorial)/i, weight: 3 },
    { pattern: /\bwhere\s+can\s+i\s+(learn|study|read)\b/i, weight: 2 },
    { pattern: /\bresources?\s+(for|about|on)\b/i, weight: 2 },
  ],
  'learning-coach': [
    { pattern: /\b(struggling|stuck|confused|don('?t)\s+understand)\b/i, weight: 2 },
    { pattern: /\bhelp\s+me\s+learn\b/i, weight: 2 },
    { pattern: /\bcoach\b/i, weight: 2 },
    { pattern: /\bwhat\s+should\s+i\s+(focus|work)\s+on\b/i, weight: 2 },
  ],
  'knowledge-graph': [
    { pattern: /\bprerequisite/i, weight: 2 },
    { pattern: /\bconcept\s+(map|graph|relationship)/i, weight: 3 },
    { pattern: /\bdependenc(y|ies)\b/i, weight: 1.5 },
    { pattern: /\blearning\s+(path|sequence|order)\b/i, weight: 2 },
  ],
  'depth-analysis': [
    { pattern: /\bdepth\s+(of\s+knowledge|analysis)/i, weight: 3 },
    { pattern: /\bwebb('?s)?\b/i, weight: 3 },
    { pattern: /\bsolo\s+taxonomy\b/i, weight: 3 },
    { pattern: /\bmulti-framework\b/i, weight: 2 },
  ],
  'mastery-tracker': [
    { pattern: /\b(my\s+)?mastery\b/i, weight: 2 },
    { pattern: /\bprogress\b/i, weight: 1.5 },
    { pattern: /\bwhat\s+(do\s+i|have\s+i)\s+(know|learned|mastered)\b/i, weight: 2 },
    { pattern: /\bskill\s+level\b/i, weight: 2 },
  ],
  'evaluation': [
    { pattern: /\b(evaluate|assess|grade|check)\s+(my|this)\s+(answer|response|work)\b/i, weight: 3 },
    { pattern: /\bfeedback\b/i, weight: 1 },
    { pattern: /\bis\s+this\s+(correct|right)\b/i, weight: 2 },
  ],
  'course-architect': [
    { pattern: /\bdesign\s+(a\s+)?(course|curriculum)\b/i, weight: 3 },
    { pattern: /\bcourse\s+(structure|outline|framework)\b/i, weight: 3 },
    { pattern: /\bbackward\s+design\b/i, weight: 2 },
  ],
  'adaptive-content': [
    { pattern: /\badapt(ive)?\b/i, weight: 1.5 },
    { pattern: /\bpersonalize\b/i, weight: 2 },
    { pattern: /\bmy\s+(level|pace|style)\b/i, weight: 2 },
    { pattern: /\btoo\s+(easy|hard|difficult|simple)\b/i, weight: 2 },
  ],
  'spaced-repetition': [
    { pattern: /\bspaced\s+repetition\b/i, weight: 3 },
    { pattern: /\breview\s+schedule\b/i, weight: 2 },
    { pattern: /\bwhen\s+should\s+i\s+review\b/i, weight: 2 },
    { pattern: /\bretention\b/i, weight: 1.5 },
  ],
  'analytics': [
    { pattern: /\banalytics\b/i, weight: 2 },
    { pattern: /\b(learning|performance)\s+data\b/i, weight: 2 },
    { pattern: /\bmetrics\b/i, weight: 1.5 },
    { pattern: /\btrends?\b/i, weight: 1 },
  ],
};

// =============================================================================
// PAGE CONTEXT BONUSES
// =============================================================================

const PAGE_TYPE_BONUSES: Record<string, Partial<Record<SAMModeId, number>>> = {
  learning: { 'learning-coach': 1, 'adaptive-content': 0.5, 'socratic-tutor': 0.5 },
  'course-learning': { 'learning-coach': 1, 'adaptive-content': 0.5 },
  'section-learning': { 'learning-coach': 0.5, 'mastery-tracker': 0.5 },
  exam: { 'exam-builder': 1, 'practice-problems': 0.5, 'evaluation': 0.5 },
  'exam-results': { 'evaluation': 1, 'mastery-tracker': 0.5 },
  'course-create': { 'course-architect': 1, 'content-creator': 0.5 },
  'course-detail': { 'content-creator': 0.5, 'course-architect': 0.5 },
  'section-detail': { 'content-creator': 0.5, 'blooms-analyzer': 0.5 },
};

// =============================================================================
// CLASSIFIER (TIER 1 — SYNCHRONOUS)
// =============================================================================

/**
 * Classify mode relevance for a message in context of the current mode.
 *
 * Algorithm:
 * 1. Score each mode via keyword vocabulary hits
 * 2. Score each mode via natural language pattern hits (expanded dictionaries)
 * 3. Apply page context bonus
 * 4. Apply conversation history boost
 * 5. If current mode scores < 0.4 AND another mode scores > 0.7, suggest switch
 */
export function classifyModeRelevance(
  message: string,
  currentModeId: string,
  pageType: string,
  options?: {
    conversationHistory?: Array<{ role: string; content: string }>;
  },
): ModeClassificationResult {
  const scores: ModeRelevanceScore[] = [];
  const lowerMessage = message.toLowerCase();

  // Conversation history mode boost: detect repeated patterns
  const historyBoosts = computeConversationHistoryBoosts(options?.conversationHistory);

  for (const modeId of SAM_MODE_IDS) {
    const vocabulary = MODE_VOCABULARIES[modeId];
    const naturalLangVocab = NATURAL_LANGUAGE_VOCABULARIES[modeId];

    let totalScore = 0;
    let naturalLanguageMatches = 0;
    const matchedSignals: string[] = [];

    // Tier 1a: Keyword vocabulary scoring
    if (vocabulary) {
      for (const kw of vocabulary) {
        if (kw.pattern.test(lowerMessage)) {
          totalScore += kw.weight;
          matchedSignals.push(kw.pattern.source);
        }
      }
    }

    // Tier 1b: Natural language pattern scoring (expanded dictionaries)
    if (naturalLangVocab) {
      for (const kw of naturalLangVocab) {
        if (kw.pattern.test(message)) {
          totalScore += kw.weight;
          naturalLanguageMatches++;
          matchedSignals.push(`nl:${kw.pattern.source.substring(0, 30)}`);
        }
      }
    }

    // Page context bonus
    const pageBonus = PAGE_TYPE_BONUSES[pageType]?.[modeId] ?? 0;
    if (pageBonus > 0) {
      totalScore += pageBonus;
      matchedSignals.push(`page:${pageType}`);
    }

    // Conversation history boost
    const historyBoost = historyBoosts.get(modeId) ?? 0;
    if (historyBoost > 0) {
      totalScore += historyBoost;
      matchedSignals.push(`history:+${historyBoost}`);
    }

    // Normalize score to 0-1 range (max reasonable total ~10 with NL patterns)
    const normalizedScore = Math.min(totalScore / 10, 1);
    const confidence: 'high' | 'medium' | 'low' =
      normalizedScore >= 0.7 ? 'high' : normalizedScore >= 0.4 ? 'medium' : 'low';

    scores.push({
      modeId,
      score: normalizedScore,
      matchedSignals,
      confidence,
      naturalLanguageMatches,
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const currentModeEntry = scores.find((s) => s.modeId === currentModeId);
  const currentModeScore = currentModeEntry?.score ?? 0;

  const topMode = scores[0];
  const shouldSuggestSwitch =
    topMode &&
    topMode.modeId !== currentModeId &&
    currentModeScore < 0.4 &&
    topMode.score > 0.7;

  return {
    currentModeScore,
    suggestedMode: shouldSuggestSwitch ? topMode.modeId : null,
    suggestedModeScore: topMode?.score ?? 0,
    topModes: scores.slice(0, 3),
    shouldSuggestSwitch,
    reason: shouldSuggestSwitch
      ? `Message matches "${topMode.modeId}" (${(topMode.score * 100).toFixed(0)}%) better than current "${currentModeId}" (${(currentModeScore * 100).toFixed(0)}%)`
      : currentModeScore >= 0.4
        ? `Current mode "${currentModeId}" is relevant (${(currentModeScore * 100).toFixed(0)}%)`
        : 'No strong mode match detected',
  };
}

// =============================================================================
// CONVERSATION HISTORY ANALYSIS
// =============================================================================

/**
 * Analyze recent conversation history to detect repeated patterns
 * that indicate a mode preference. If the last 3 user messages
 * consistently match a mode, boost that mode's score.
 */
function computeConversationHistoryBoosts(
  history?: Array<{ role: string; content: string }>,
): Map<string, number> {
  const boosts = new Map<string, number>();
  if (!history || history.length < 3) return boosts;

  // Take last 3 user messages
  const recentUserMessages = history
    .filter((m) => m.role === 'user')
    .slice(-3);

  if (recentUserMessages.length < 3) return boosts;

  // Score each mode against recent messages
  const modeHits = new Map<string, number>();

  for (const msg of recentUserMessages) {
    for (const modeId of SAM_MODE_IDS) {
      const vocab = MODE_VOCABULARIES[modeId];
      const nlVocab = NATURAL_LANGUAGE_VOCABULARIES[modeId];
      if (!vocab && !nlVocab) continue;

      let hasMatch = false;
      for (const kw of (vocab ?? [])) {
        if (kw.pattern.test(msg.content)) { hasMatch = true; break; }
      }
      if (!hasMatch) {
        for (const kw of (nlVocab ?? [])) {
          if (kw.pattern.test(msg.content)) { hasMatch = true; break; }
        }
      }

      if (hasMatch) {
        modeHits.set(modeId, (modeHits.get(modeId) ?? 0) + 1);
      }
    }
  }

  // Boost modes that appeared in all 3 recent messages
  for (const [modeId, hits] of modeHits.entries()) {
    if (hits >= 3) {
      boosts.set(modeId, 2); // Strong history boost
    } else if (hits >= 2) {
      boosts.set(modeId, 1); // Moderate history boost
    }
  }

  return boosts;
}
