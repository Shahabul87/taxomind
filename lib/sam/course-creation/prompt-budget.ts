/**
 * Prompt Budget — Token Budget Enforcement with Priority-Based Truncation
 *
 * Ensures AI prompts stay within token limits by:
 * 1. Tagging each prompt section with a priority
 * 2. Estimating token count per section
 * 3. Truncating lowest-priority sections first when over budget
 *
 * This prevents input token budget overruns on long courses with many chapters
 * (where previousChaptersSummary or conceptTracker can grow very large).
 */

import { logger } from '@/lib/logger';

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Estimate the number of tokens in a text string.
 *
 * Uses a conservative heuristic of ~1 token per 0.75 words for English text.
 * This slightly over-estimates, which is safer than under-estimating when
 * enforcing budget limits.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 0.75);
}

// ============================================================================
// Priority Levels
// ============================================================================

/**
 * Priority levels for prompt sections (lower number = higher priority).
 *
 * CRITICAL sections are never truncated.
 * When over budget, OPTIONAL sections are dropped first, then LOW, then MEDIUM.
 * HIGH and CRITICAL are preserved as long as possible.
 */
export enum PromptPriority {
  /** Course context, current chapter/section requirements, output schema */
  CRITICAL = 0,
  /** Blueprint data, objectives, key concepts, Bloom's level */
  HIGH = 1,
  /** Previous chapter summaries, concept tracker, scaffolding guidance */
  MEDIUM = 2,
  /** Memory recall, adaptive guidance, bridge content, domain enhancements */
  LOW = 3,
  /** Category-specific extras, template blocks, position guidance details */
  OPTIONAL = 4,
}

// ============================================================================
// Section and Budget Types
// ============================================================================

/** A labeled, prioritized section of a prompt */
export interface PromptSection {
  /** Human-readable label for logging which sections were truncated */
  label: string;
  /** The actual text content */
  content: string;
  /** Truncation priority (lower = more important = dropped last) */
  priority: PromptPriority;
}

/** Per-stage token budgets for user prompts */
export const INPUT_TOKEN_BUDGETS = {
  /** Stage 1: Chapter generation — user prompt budget */
  stage1: { system: 2500, user: 6000 },
  /** Stage 2: Section generation — user prompt budget */
  stage2: { system: 2000, user: 4000 },
  /** Stage 3: Detail generation — user prompt budget */
  stage3: { system: 2000, user: 5000 },
} as const;

/**
 * Returns the effective user-prompt token budget after accounting for
 * system prompt overflow. If the system prompt exceeds its allocated
 * budget, the excess is deducted from the user budget.
 *
 * This prevents the combined (system + user) prompt from exceeding
 * the model's context window.
 */
export function getEffectiveUserBudget(
  stage: 1 | 2 | 3,
  actualSystemTokens: number,
): number {
  const budgets = INPUT_TOKEN_BUDGETS[`stage${stage}`];
  const systemOverflow = Math.max(0, actualSystemTokens - budgets.system);
  const effectiveUser = Math.max(
    Math.floor(budgets.user * 0.5), // Floor: never go below 50% of original
    budgets.user - systemOverflow,
  );

  if (systemOverflow > 0) {
    logger.debug('[PromptBudget] System prompt overflow detected', {
      stage,
      systemBudget: budgets.system,
      actualSystemTokens,
      overflow: systemOverflow,
      originalUserBudget: budgets.user,
      effectiveUserBudget: effectiveUser,
    });
  }

  return effectiveUser;
}

/** Result of enforcing a token budget on prompt sections */
export interface BudgetResult {
  /** The final assembled prompt content */
  content: string;
  /** Whether any sections were truncated or dropped */
  truncated: boolean;
  /** Token count before truncation */
  originalTokens: number;
  /** Token count after truncation */
  finalTokens: number;
  /** Labels of sections that were truncated or dropped */
  truncatedSections: string[];
}

// ============================================================================
// Budget Enforcement
// ============================================================================

/**
 * Enforce a token budget on a list of prioritized prompt sections.
 *
 * Algorithm:
 * 1. Calculate total tokens across all sections.
 * 2. If under budget, join all sections and return.
 * 3. If over budget, sort sections by priority (lowest priority first).
 * 4. Drop entire sections from lowest priority until under budget.
 * 5. For MEDIUM-priority sections (like previousChaptersSummary): if still
 *    over budget after dropping all lower-priority sections, truncate by
 *    keeping only the most recent content (last N lines).
 * 6. Log a warning on truncation but never throw.
 */
export function enforceTokenBudget(
  sections: PromptSection[],
  maxTokens: number,
): BudgetResult {
  // Filter out empty sections
  const nonEmpty = sections.filter(s => s.content.trim().length > 0);

  const originalTokens = nonEmpty.reduce((sum, s) => sum + estimateTokens(s.content), 0);

  // Under budget — join everything and return
  if (originalTokens <= maxTokens) {
    return {
      content: nonEmpty.map(s => s.content).join('\n'),
      truncated: false,
      originalTokens,
      finalTokens: originalTokens,
      truncatedSections: [],
    };
  }

  // Over budget — need to truncate
  const truncatedLabels: string[] = [];

  // Work with a mutable copy sorted by priority descending (lowest priority = highest number first)
  const sorted = [...nonEmpty].sort((a, b) => b.priority - a.priority);

  // Track which sections to keep (by label, preserving original order)
  const droppedLabels = new Set<string>();
  let currentTokens = originalTokens;

  // Phase 1: Drop entire sections from lowest priority first
  for (const section of sorted) {
    if (currentTokens <= maxTokens) break;

    // Never drop CRITICAL sections
    if (section.priority === PromptPriority.CRITICAL) continue;

    // Never drop HIGH sections in Phase 1 — try partial truncation first
    if (section.priority === PromptPriority.HIGH) continue;

    const sectionTokens = estimateTokens(section.content);
    droppedLabels.add(section.label);
    truncatedLabels.push(section.label);
    currentTokens -= sectionTokens;
  }

  // Phase 2: If still over budget, try truncating MEDIUM sections
  // (keep the most recent content — last N lines)
  if (currentTokens > maxTokens) {
    const mediumSections = sorted.filter(
      s => s.priority === PromptPriority.MEDIUM && !droppedLabels.has(s.label),
    );

    for (const section of mediumSections) {
      if (currentTokens <= maxTokens) break;

      const sectionTokens = estimateTokens(section.content);
      const overshoot = currentTokens - maxTokens;
      const tokensToRemove = Math.min(sectionTokens - 50, overshoot); // Keep at least ~50 tokens

      if (tokensToRemove <= 0) continue;

      // Truncate from the beginning (keep most recent chapters/sections)
      const lines = section.content.split('\n');
      const targetTokens = sectionTokens - tokensToRemove;
      let keptTokens = 0;
      let keepFromIndex = lines.length;

      for (let i = lines.length - 1; i >= 0; i--) {
        const lineTokens = estimateTokens(lines[i]);
        if (keptTokens + lineTokens > targetTokens) break;
        keptTokens += lineTokens;
        keepFromIndex = i;
      }

      const truncatedContent = lines.slice(keepFromIndex).join('\n');
      section.content = `[Earlier content truncated for token budget]\n${truncatedContent}`;
      currentTokens -= (sectionTokens - estimateTokens(section.content));

      if (!truncatedLabels.includes(section.label)) {
        truncatedLabels.push(`${section.label} (partial)`);
      }
    }
  }

  // Phase 3: If STILL over budget, drop HIGH sections (last resort before CRITICAL)
  if (currentTokens > maxTokens) {
    const highSections = sorted.filter(
      s => s.priority === PromptPriority.HIGH && !droppedLabels.has(s.label),
    );

    for (const section of highSections) {
      if (currentTokens <= maxTokens) break;

      const sectionTokens = estimateTokens(section.content);
      droppedLabels.add(section.label);
      truncatedLabels.push(section.label);
      currentTokens -= sectionTokens;
    }
  }

  // Assemble final content preserving original order, excluding dropped sections
  const finalSections = nonEmpty.filter(s => !droppedLabels.has(s.label));
  const finalContent = finalSections.map(s => s.content).join('\n');
  const finalTokens = estimateTokens(finalContent);

  if (truncatedLabels.length > 0) {
    logger.warn('[PROMPT_BUDGET] Token budget enforced', {
      maxTokens,
      originalTokens,
      finalTokens,
      truncatedSections: truncatedLabels,
    });
  }

  return {
    content: finalContent,
    truncated: true,
    originalTokens,
    finalTokens,
    truncatedSections: truncatedLabels,
  };
}
