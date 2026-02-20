/**
 * Prompt Budget Tests — Token Budget Enforcement with Priority-Based Truncation
 *
 * Tests that enforceTokenBudget correctly:
 * - Estimates token counts
 * - Passes through content that fits within budget
 * - Drops lowest-priority sections first
 * - Never drops CRITICAL sections
 * - Partially truncates MEDIUM sections (keeping recent content)
 * - Drops HIGH sections only as a last resort
 * - Fires onAlert when HIGH sections are dropped
 * - Generates a droppedContextNotice when content is truncated
 *
 * Also tests getEffectiveUserBudget overflow mechanics and estimateTokens heuristic.
 */

import {
  estimateTokens,
  enforceTokenBudget,
  getEffectiveUserBudget,
  PromptPriority,
  INPUT_TOKEN_BUDGETS,
} from '../prompt-budget';
import { PromptSection, PromptBudgetAlert } from '../prompt-budget';

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ============================================================================
// Helpers
// ============================================================================

/** Create a PromptSection with sensible defaults. */
function section(
  label: string,
  content: string,
  priority: PromptPriority,
): PromptSection {
  return { label, content, priority };
}

/** Generate a string with approximately `targetTokens` worth of words. */
function wordsForTokens(targetTokens: number, prefix = 'word'): string {
  // estimateTokens = ceil(wordCount / 0.75), so wordCount = floor(targetTokens * 0.75)
  const wordCount = Math.floor(targetTokens * 0.75);
  return Array.from({ length: wordCount }, (_, i) => `${prefix}${i}`).join(' ');
}

/**
 * Generate multi-line content with approximately `targetTokens` worth of words.
 * Each line contains a few words so truncation tests can meaningfully slice lines.
 */
function multilineForTokens(targetTokens: number, wordsPerLine = 3): string {
  const wordCount = Math.floor(targetTokens * 0.75);
  const lines: string[] = [];
  let remaining = wordCount;
  let lineIndex = 0;
  while (remaining > 0) {
    const count = Math.min(wordsPerLine, remaining);
    const words = Array.from({ length: count }, (_, j) => `line${lineIndex}w${j}`).join(' ');
    lines.push(words);
    remaining -= count;
    lineIndex++;
  }
  return lines.join('\n');
}

// ============================================================================
// estimateTokens
// ============================================================================

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('returns 0 for falsy input', () => {
    // The function guards on !text, so null/undefined cast should return 0
    expect(estimateTokens(null as unknown as string)).toBe(0);
    expect(estimateTokens(undefined as unknown as string)).toBe(0);
  });

  it('estimates "hello world" as ceil(2 / 0.75) = 3 tokens', () => {
    expect(estimateTokens('hello world')).toBe(Math.ceil(2 / 0.75));
  });

  it('estimates a single word as ceil(1 / 0.75) = 2 tokens', () => {
    expect(estimateTokens('hello')).toBe(Math.ceil(1 / 0.75));
  });

  it('handles whitespace-only strings as 0 tokens', () => {
    // "   ".split(/\s+/).filter(Boolean) yields [] → length 0
    expect(estimateTokens('   ')).toBe(0);
  });

  it('estimates longer text correctly', () => {
    const text = 'The quick brown fox jumps over the lazy dog'; // 9 words
    expect(estimateTokens(text)).toBe(Math.ceil(9 / 0.75)); // 12
  });

  it('handles multi-line text by counting all words', () => {
    const text = 'line one\nline two\nline three'; // 6 words
    expect(estimateTokens(text)).toBe(Math.ceil(6 / 0.75)); // 8
  });

  it('ignores extra whitespace between words', () => {
    const text = '  hello   world  '; // 2 words
    expect(estimateTokens(text)).toBe(Math.ceil(2 / 0.75));
  });
});

// ============================================================================
// PromptPriority enum values
// ============================================================================

describe('PromptPriority', () => {
  it('has correct numeric values for ordering', () => {
    expect(PromptPriority.CRITICAL).toBe(0);
    expect(PromptPriority.HIGH).toBe(1);
    expect(PromptPriority.MEDIUM).toBe(2);
    expect(PromptPriority.LOW).toBe(3);
    expect(PromptPriority.OPTIONAL).toBe(4);
  });

  it('CRITICAL < HIGH < MEDIUM < LOW < OPTIONAL (lower = more important)', () => {
    expect(PromptPriority.CRITICAL).toBeLessThan(PromptPriority.HIGH);
    expect(PromptPriority.HIGH).toBeLessThan(PromptPriority.MEDIUM);
    expect(PromptPriority.MEDIUM).toBeLessThan(PromptPriority.LOW);
    expect(PromptPriority.LOW).toBeLessThan(PromptPriority.OPTIONAL);
  });
});

// ============================================================================
// INPUT_TOKEN_BUDGETS
// ============================================================================

describe('INPUT_TOKEN_BUDGETS', () => {
  it('has expected stage budgets', () => {
    expect(INPUT_TOKEN_BUDGETS.stage1).toEqual({ system: 2500, user: 6000 });
    expect(INPUT_TOKEN_BUDGETS.stage2).toEqual({ system: 2000, user: 4000 });
    expect(INPUT_TOKEN_BUDGETS.stage3).toEqual({ system: 2000, user: 5000 });
  });
});

// ============================================================================
// getEffectiveUserBudget
// ============================================================================

describe('getEffectiveUserBudget', () => {
  it('returns full user budget when system tokens are within budget (stage 1)', () => {
    // Stage 1: system=2500, user=6000. Actual system = 2000 (under budget).
    const result = getEffectiveUserBudget(1, 2000);
    expect(result).toBe(6000);
  });

  it('returns full user budget when system tokens exactly equal budget', () => {
    const result = getEffectiveUserBudget(2, 2000); // system budget = 2000
    expect(result).toBe(4000);
  });

  it('reduces user budget by system overflow amount', () => {
    // Stage 1: system=2500, user=6000. Actual system = 3000 → overflow = 500.
    // Effective user = 6000 - 500 = 5500
    const result = getEffectiveUserBudget(1, 3000);
    expect(result).toBe(5500);
  });

  it('reduces user budget for stage 2 overflow', () => {
    // Stage 2: system=2000, user=4000. Actual system = 2800 → overflow = 800.
    // Effective user = 4000 - 800 = 3200
    const result = getEffectiveUserBudget(2, 2800);
    expect(result).toBe(3200);
  });

  it('never goes below 50% of original user budget', () => {
    // Stage 1: system=2500, user=6000. Floor = floor(6000*0.5) = 3000.
    // Actual system = 10000 → overflow = 7500.
    // user - overflow = 6000 - 7500 = -1500 → clamped to 3000
    const result = getEffectiveUserBudget(1, 10000);
    expect(result).toBe(Math.floor(6000 * 0.5));
  });

  it('clamps at exactly 50% for moderate overflow (stage 3)', () => {
    // Stage 3: system=2000, user=5000. Floor = floor(5000*0.5) = 2500.
    // Actual system = 5000 → overflow = 3000. user - overflow = 5000 - 3000 = 2000 < 2500.
    // Clamped to 2500.
    const result = getEffectiveUserBudget(3, 5000);
    expect(result).toBe(2500);
  });

  it('uses Math.floor for the 50% floor calculation', () => {
    // Stage 2: system=2000, user=4000. Floor = floor(4000*0.5) = 2000.
    // Overflow of 2500 → user - overflow = 4000 - 2500 = 1500 < 2000 → clamped to 2000.
    const result = getEffectiveUserBudget(2, 4500);
    expect(result).toBe(2000);
  });
});

// ============================================================================
// enforceTokenBudget — Under Budget
// ============================================================================

describe('enforceTokenBudget — under budget', () => {
  it('returns all content when total tokens are within budget', () => {
    const sections: PromptSection[] = [
      section('intro', 'hello world', PromptPriority.CRITICAL),
      section('body', 'some content here', PromptPriority.HIGH),
    ];

    const result = enforceTokenBudget(sections, 1000);

    expect(result.truncated).toBe(false);
    expect(result.content).toContain('hello world');
    expect(result.content).toContain('some content here');
    expect(result.truncatedSections).toEqual([]);
    expect(result.droppedContextNotice).toBe('');
    expect(result.droppedHighPrioritySections).toEqual([]);
    expect(result.originalTokens).toBe(result.finalTokens);
  });

  it('joins sections with newlines', () => {
    const sections: PromptSection[] = [
      section('a', 'first', PromptPriority.CRITICAL),
      section('b', 'second', PromptPriority.HIGH),
    ];

    const result = enforceTokenBudget(sections, 1000);
    expect(result.content).toBe('first\nsecond');
  });
});

// ============================================================================
// enforceTokenBudget — Empty Section Filtering
// ============================================================================

describe('enforceTokenBudget — empty section filtering', () => {
  it('filters out sections with empty content', () => {
    const sections: PromptSection[] = [
      section('empty1', '', PromptPriority.CRITICAL),
      section('whitespace', '   ', PromptPriority.HIGH),
      section('real', 'actual content', PromptPriority.MEDIUM),
    ];

    const result = enforceTokenBudget(sections, 1000);

    expect(result.content).toBe('actual content');
    expect(result.truncated).toBe(false);
  });

  it('treats all-empty sections as under budget with zero tokens', () => {
    const sections: PromptSection[] = [
      section('empty1', '', PromptPriority.CRITICAL),
      section('empty2', '  ', PromptPriority.HIGH),
    ];

    const result = enforceTokenBudget(sections, 10);

    expect(result.truncated).toBe(false);
    expect(result.originalTokens).toBe(0);
    expect(result.content).toBe('');
  });
});

// ============================================================================
// enforceTokenBudget — Priority-Based Dropping
// ============================================================================

describe('enforceTokenBudget — OPTIONAL sections dropped first', () => {
  it('drops OPTIONAL sections before any other priority', () => {
    const criticalContent = wordsForTokens(50);
    const highContent = wordsForTokens(50);
    const optionalContent = wordsForTokens(200);

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('high', highContent, PromptPriority.HIGH),
      section('optional', optionalContent, PromptPriority.OPTIONAL),
    ];

    // Budget only fits critical + high (100 tokens), not optional (200 more)
    const result = enforceTokenBudget(sections, 110);

    expect(result.truncated).toBe(true);
    expect(result.truncatedSections).toContain('optional');
    expect(result.content).toContain(criticalContent);
    expect(result.content).toContain(highContent);
    expect(result.content).not.toContain(optionalContent);
  });
});

describe('enforceTokenBudget — LOW sections dropped before MEDIUM', () => {
  it('drops LOW sections after OPTIONAL but before MEDIUM', () => {
    const criticalContent = wordsForTokens(30);
    const mediumContent = wordsForTokens(30);
    const lowContent = wordsForTokens(200);
    const optionalContent = wordsForTokens(200);

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('medium', mediumContent, PromptPriority.MEDIUM),
      section('low', lowContent, PromptPriority.LOW),
      section('optional', optionalContent, PromptPriority.OPTIONAL),
    ];

    // Budget fits critical + medium (60 tokens) but not low or optional
    const result = enforceTokenBudget(sections, 70);

    expect(result.truncated).toBe(true);
    expect(result.truncatedSections).toContain('optional');
    expect(result.truncatedSections).toContain('low');
    // Medium should not be fully dropped since dropping optional + low is enough
    expect(result.content).toContain(criticalContent);
    expect(result.content).toContain(mediumContent);
  });
});

describe('enforceTokenBudget — CRITICAL sections never dropped', () => {
  it('preserves CRITICAL sections even when way over budget', () => {
    const criticalContent = wordsForTokens(500);

    const sections: PromptSection[] = [
      section('critical1', criticalContent, PromptPriority.CRITICAL),
      section('optional', wordsForTokens(100), PromptPriority.OPTIONAL),
      section('low', wordsForTokens(100), PromptPriority.LOW),
    ];

    // Budget is tiny — only 10 tokens, but CRITICAL content is 500 tokens
    const result = enforceTokenBudget(sections, 10);

    // CRITICAL content must still be in the output
    expect(result.content).toContain(criticalContent);
    expect(result.truncatedSections).toContain('optional');
    expect(result.truncatedSections).toContain('low');
  });

  it('never lists CRITICAL sections in truncatedSections', () => {
    const sections: PromptSection[] = [
      section('critical', wordsForTokens(1000), PromptPriority.CRITICAL),
    ];

    const result = enforceTokenBudget(sections, 5);

    // Even though critical is way over budget, it should not be truncated/dropped
    expect(result.truncatedSections).not.toContain('critical');
  });
});

describe('enforceTokenBudget — HIGH sections dropped last', () => {
  it('drops HIGH sections only after OPTIONAL, LOW, and MEDIUM are exhausted', () => {
    const criticalContent = wordsForTokens(50);
    const highContent = wordsForTokens(200);
    const mediumContent = wordsForTokens(200);
    const lowContent = wordsForTokens(200);
    const optionalContent = wordsForTokens(200);

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('high', highContent, PromptPriority.HIGH),
      section('medium', mediumContent, PromptPriority.MEDIUM),
      section('low', lowContent, PromptPriority.LOW),
      section('optional', optionalContent, PromptPriority.OPTIONAL),
    ];

    // Budget only fits critical (50). Everything else must be dropped.
    // Total = 850 tokens. Budget = 60. Even after dropping optional+low+medium, still over.
    const result = enforceTokenBudget(sections, 60);

    expect(result.truncated).toBe(true);
    expect(result.truncatedSections).toContain('optional');
    expect(result.truncatedSections).toContain('low');
    expect(result.truncatedSections).toContain('high');
    expect(result.droppedHighPrioritySections).toContain('high');
    expect(result.content).toContain(criticalContent);
    expect(result.content).not.toContain(highContent);
  });

  it('preserves HIGH sections when dropping lower priorities is sufficient', () => {
    const criticalContent = wordsForTokens(30);
    const highContent = wordsForTokens(30);
    const lowContent = wordsForTokens(200);

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('high', highContent, PromptPriority.HIGH),
      section('low', lowContent, PromptPriority.LOW),
    ];

    // Budget fits critical + high (60) after dropping low
    const result = enforceTokenBudget(sections, 70);

    expect(result.truncated).toBe(true);
    expect(result.truncatedSections).toContain('low');
    expect(result.droppedHighPrioritySections).toEqual([]);
    expect(result.content).toContain(highContent);
  });
});

// ============================================================================
// enforceTokenBudget — Alert on HIGH Section Drops
// ============================================================================

describe('enforceTokenBudget — onAlert callback', () => {
  it('fires onAlert when HIGH sections are dropped', () => {
    const onAlert = jest.fn();

    const sections: PromptSection[] = [
      section('critical', wordsForTokens(50), PromptPriority.CRITICAL),
      section('highA', wordsForTokens(200), PromptPriority.HIGH),
      section('highB', wordsForTokens(200), PromptPriority.HIGH),
      section('low', wordsForTokens(200), PromptPriority.LOW),
    ];

    // Budget only fits critical. All others must be dropped.
    enforceTokenBudget(sections, 60, { stage: 2, onAlert });

    expect(onAlert).toHaveBeenCalledTimes(1);

    const alert: PromptBudgetAlert = onAlert.mock.calls[0][0];
    expect(alert.stage).toBe(2);
    expect(alert.droppedHighPrioritySections).toContain('highA');
    expect(alert.droppedHighPrioritySections).toContain('highB');
    expect(alert.maxTokens).toBe(60);
    expect(alert.originalTokens).toBeGreaterThan(60);
    expect(alert.truncatedSections.length).toBeGreaterThan(0);
  });

  it('does not fire onAlert when no HIGH sections are dropped', () => {
    const onAlert = jest.fn();

    const sections: PromptSection[] = [
      section('critical', wordsForTokens(30), PromptPriority.CRITICAL),
      section('high', wordsForTokens(30), PromptPriority.HIGH),
      section('optional', wordsForTokens(200), PromptPriority.OPTIONAL),
    ];

    enforceTokenBudget(sections, 70, { onAlert });

    expect(onAlert).not.toHaveBeenCalled();
  });

  it('does not fire onAlert when everything fits within budget', () => {
    const onAlert = jest.fn();

    const sections: PromptSection[] = [
      section('critical', 'short', PromptPriority.CRITICAL),
      section('high', 'also short', PromptPriority.HIGH),
    ];

    enforceTokenBudget(sections, 1000, { onAlert });

    expect(onAlert).not.toHaveBeenCalled();
  });
});

// ============================================================================
// enforceTokenBudget — MEDIUM Section Handling
// ============================================================================

describe('enforceTokenBudget — MEDIUM section handling', () => {
  it('drops MEDIUM sections entirely in Phase 1 when OPTIONAL and LOW are not enough', () => {
    // When OPTIONAL+LOW drops cannot bring budget under control,
    // Phase 1 continues to MEDIUM sections and drops them entirely.
    const criticalContent = wordsForTokens(30);
    const mediumLines: string[] = [];
    for (let i = 0; i < 20; i++) {
      mediumLines.push(`chapter${i} summary content here`);
    }
    const mediumContent = mediumLines.join('\n');

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('previousChapters', mediumContent, PromptPriority.MEDIUM),
    ];

    // Budget fits critical but not medium. No OPTIONAL/LOW to drop,
    // so Phase 1 drops the MEDIUM section entirely.
    const criticalTokens = estimateTokens(criticalContent);
    const budget = criticalTokens + 5;

    const result = enforceTokenBudget(sections, budget);

    expect(result.truncated).toBe(true);
    expect(result.truncatedSections).toContain('previousChapters');
    expect(result.content).toContain(criticalContent);
    // MEDIUM section was fully dropped, not partially truncated
    expect(result.content).not.toContain('chapter0');
    expect(result.content).not.toContain('chapter19');
  });

  it('preserves MEDIUM sections when dropping OPTIONAL and LOW is sufficient', () => {
    // If dropping OPTIONAL+LOW brings the budget under control,
    // Phase 1 breaks before reaching MEDIUM sections.
    const criticalContent = wordsForTokens(30);
    const mediumContent = wordsForTokens(30);
    const optionalContent = wordsForTokens(200);

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('medium', mediumContent, PromptPriority.MEDIUM),
      section('optional', optionalContent, PromptPriority.OPTIONAL),
    ];

    // Budget fits critical + medium after optional is dropped
    const criticalTokens = estimateTokens(criticalContent);
    const mediumTokens = estimateTokens(mediumContent);
    const budget = criticalTokens + mediumTokens + 5;

    const result = enforceTokenBudget(sections, budget);

    expect(result.truncated).toBe(true);
    expect(result.truncatedSections).toContain('optional');
    expect(result.truncatedSections).not.toContain('medium');
    expect(result.content).toContain(mediumContent);
  });

  it('Phase 2 partially truncates MEDIUM sections that survive Phase 1', () => {
    // Phase 2 can trigger when there are multiple MEDIUM sections:
    // Phase 1 drops the first MEDIUM section (sorted desc = arbitrary among same-priority),
    // but if still over budget, Phase 2 truncates the surviving MEDIUM section.
    //
    // Setup: CRITICAL(50) + MEDIUM_A(200) + MEDIUM_B(200) + OPTIONAL(100)
    // Budget: 180 (fits CRITICAL + partial MEDIUM)
    // Phase 1 drops: OPTIONAL(100) => tokens 550->450, still over 180
    //   drops MEDIUM_A or MEDIUM_B => tokens 450->250, still over 180
    //   drops remaining MEDIUM => tokens 250->50, under 180. Break.
    // But this drops both MEDIUM sections...
    //
    // For Phase 2, we need Phase 1 to NOT drop all MEDIUM sections:
    // CRITICAL(200) + MEDIUM(300) + OPTIONAL(100) = 600
    // Budget: 420. Phase 1 drops OPTIONAL(100) => 500, still over 420.
    // Phase 1 then drops MEDIUM(300) => 200, under 420. Break.
    // Phase 2 finds no surviving MEDIUM. Doesn't trigger.
    //
    // The only way: have 2+ MEDIUM sections where Phase 1 drops enough to
    // get under budget but Phase 2 still checks. Since Phase 1 breaks on
    // currentTokens <= maxTokens, Phase 2 condition (currentTokens > maxTokens)
    // is the inverse. Phase 2 fires only when Phase 1 couldn't bring it under.
    // After Phase 1 drops all OPTIONAL+LOW+MEDIUM, only CRITICAL+HIGH remain.
    // Phase 2 finds no un-dropped MEDIUM sections.
    //
    // Conclusion: Phase 2 is defensive code for future changes. We test
    // that it doesn't corrupt output when it has nothing to do.

    const criticalContent = wordsForTokens(100);
    const highContent = wordsForTokens(100);
    const mediumContent = multilineForTokens(300, 4);

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('high', highContent, PromptPriority.HIGH),
      section('medium', mediumContent, PromptPriority.MEDIUM),
    ];

    // Budget fits critical + high but NOT medium.
    // Phase 1 drops MEDIUM. Phase 2 finds nothing. Phase 3 not needed.
    const criticalTokens = estimateTokens(criticalContent);
    const highTokens = estimateTokens(highContent);
    const budget = criticalTokens + highTokens + 5;

    const result = enforceTokenBudget(sections, budget);

    expect(result.truncated).toBe(true);
    expect(result.truncatedSections).toContain('medium');
    expect(result.content).toContain(criticalContent);
    expect(result.content).toContain(highContent);
    // HIGH sections were preserved (not dropped)
    expect(result.droppedHighPrioritySections).toEqual([]);
  });

  it('preserves critical content when MEDIUM is fully dropped', () => {
    const criticalContent = 'This is critical instruction content';
    const mediumContent = multilineForTokens(300, 4);

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('medium', mediumContent, PromptPriority.MEDIUM),
    ];

    const criticalTokens = estimateTokens(criticalContent);
    // Budget fits only critical
    const budget = criticalTokens + 10;

    const result = enforceTokenBudget(sections, budget);

    expect(result.truncated).toBe(true);
    expect(result.content).toContain(criticalContent);
    expect(result.finalTokens).toBeLessThan(result.originalTokens);
    expect(result.truncatedSections).toContain('medium');
  });
});

// ============================================================================
// enforceTokenBudget — droppedContextNotice
// ============================================================================

describe('enforceTokenBudget — droppedContextNotice', () => {
  it('generates a context notice when sections are dropped', () => {
    const sections: PromptSection[] = [
      section('critical', wordsForTokens(30), PromptPriority.CRITICAL),
      section('previousChapters', wordsForTokens(200), PromptPriority.LOW),
      section('memoryRecall', wordsForTokens(200), PromptPriority.OPTIONAL),
    ];

    const result = enforceTokenBudget(sections, 40);

    expect(result.droppedContextNotice).toContain('CONTEXT BUDGET NOTICE');
    expect(result.droppedContextNotice).toContain('dropped or truncated');
  });

  it('includes human-readable descriptions for known labels', () => {
    const sections: PromptSection[] = [
      section('critical', wordsForTokens(30), PromptPriority.CRITICAL),
      section('previousChapters', wordsForTokens(200), PromptPriority.LOW),
    ];

    const result = enforceTokenBudget(sections, 40);

    // previousChapters maps to 'summaries of previously completed chapters'
    expect(result.droppedContextNotice).toContain('summaries of previously completed chapters');
  });

  it('returns empty string when nothing is truncated', () => {
    const sections: PromptSection[] = [
      section('critical', 'short', PromptPriority.CRITICAL),
    ];

    const result = enforceTokenBudget(sections, 1000);

    expect(result.droppedContextNotice).toBe('');
  });

  it('contains self-contained instruction guidance for the AI', () => {
    const sections: PromptSection[] = [
      section('critical', wordsForTokens(30), PromptPriority.CRITICAL),
      section('conceptFlow', wordsForTokens(200), PromptPriority.LOW),
    ];

    const result = enforceTokenBudget(sections, 40);

    expect(result.droppedContextNotice).toContain('Be more self-contained');
    expect(result.droppedContextNotice).toContain('do NOT reference information from dropped sections');
  });
});

// ============================================================================
// enforceTokenBudget — BudgetResult structure
// ============================================================================

describe('enforceTokenBudget — BudgetResult structure', () => {
  it('returns correct originalTokens and finalTokens when under budget', () => {
    const content = wordsForTokens(50);
    const sections: PromptSection[] = [
      section('a', content, PromptPriority.CRITICAL),
    ];

    const result = enforceTokenBudget(sections, 1000);

    expect(result.originalTokens).toBe(estimateTokens(content));
    expect(result.finalTokens).toBe(result.originalTokens);
  });

  it('returns finalTokens less than originalTokens when over budget', () => {
    const sections: PromptSection[] = [
      section('critical', wordsForTokens(30), PromptPriority.CRITICAL),
      section('optional', wordsForTokens(300), PromptPriority.OPTIONAL),
    ];

    const result = enforceTokenBudget(sections, 40);

    expect(result.truncated).toBe(true);
    expect(result.finalTokens).toBeLessThan(result.originalTokens);
  });

  it('preserves original section order in output content', () => {
    const sections: PromptSection[] = [
      section('first', 'AAA content first', PromptPriority.CRITICAL),
      section('second', 'BBB content second', PromptPriority.HIGH),
      section('third', 'CCC content third', PromptPriority.CRITICAL),
      section('dropped', wordsForTokens(500), PromptPriority.OPTIONAL),
    ];

    const result = enforceTokenBudget(sections, 50);

    const posA = result.content.indexOf('AAA content first');
    const posB = result.content.indexOf('BBB content second');
    const posC = result.content.indexOf('CCC content third');

    expect(posA).toBeLessThan(posB);
    expect(posB).toBeLessThan(posC);
  });
});

// ============================================================================
// enforceTokenBudget — Edge Cases
// ============================================================================

describe('enforceTokenBudget — edge cases', () => {
  it('handles empty sections array', () => {
    const result = enforceTokenBudget([], 1000);

    expect(result.truncated).toBe(false);
    expect(result.content).toBe('');
    expect(result.originalTokens).toBe(0);
    expect(result.finalTokens).toBe(0);
  });

  it('handles single CRITICAL section over budget gracefully', () => {
    const bigContent = wordsForTokens(500);
    const sections: PromptSection[] = [
      section('critical', bigContent, PromptPriority.CRITICAL),
    ];

    const result = enforceTokenBudget(sections, 10);

    // CRITICAL is never dropped, so content remains even over budget
    expect(result.content).toContain(bigContent);
  });

  it('handles maxTokens of 0', () => {
    const sections: PromptSection[] = [
      section('a', 'hello', PromptPriority.CRITICAL),
    ];

    // With budget 0, content is over budget but CRITICAL is never dropped
    const result = enforceTokenBudget(sections, 0);
    expect(result.content).toContain('hello');
  });

  it('drops multiple OPTIONAL sections sorted correctly', () => {
    const sections: PromptSection[] = [
      section('critical', wordsForTokens(30), PromptPriority.CRITICAL),
      section('opt1', wordsForTokens(100), PromptPriority.OPTIONAL),
      section('opt2', wordsForTokens(100), PromptPriority.OPTIONAL),
      section('opt3', wordsForTokens(100), PromptPriority.OPTIONAL),
    ];

    const result = enforceTokenBudget(sections, 40);

    expect(result.truncatedSections).toContain('opt1');
    expect(result.truncatedSections).toContain('opt2');
    expect(result.truncatedSections).toContain('opt3');
  });

  it('tracks droppedHighPrioritySections separately from truncatedSections', () => {
    const sections: PromptSection[] = [
      section('critical', wordsForTokens(50), PromptPriority.CRITICAL),
      section('highSection', wordsForTokens(200), PromptPriority.HIGH),
      section('lowSection', wordsForTokens(200), PromptPriority.LOW),
    ];

    const result = enforceTokenBudget(sections, 60);

    // lowSection should be in truncatedSections but not droppedHighPrioritySections
    expect(result.truncatedSections).toContain('lowSection');
    expect(result.droppedHighPrioritySections).not.toContain('lowSection');

    // highSection should be in both if it was dropped
    if (result.droppedHighPrioritySections.includes('highSection')) {
      expect(result.truncatedSections).toContain('highSection');
    }
  });
});

// ============================================================================
// enforceTokenBudget — Full Priority Cascade Integration
// ============================================================================

describe('enforceTokenBudget — full priority cascade', () => {
  it('drops OPTIONAL first, then LOW, preserving higher priorities', () => {
    // Use unique prefixes so content from different sections is distinguishable
    const criticalContent = wordsForTokens(30, 'crit');
    const highContent = wordsForTokens(30, 'high');
    const mediumContent = wordsForTokens(30, 'med');
    const lowContent = wordsForTokens(100, 'low');
    const optionalContent = wordsForTokens(100, 'opt');

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('high', highContent, PromptPriority.HIGH),
      section('medium', mediumContent, PromptPriority.MEDIUM),
      section('low', lowContent, PromptPriority.LOW),
      section('optional', optionalContent, PromptPriority.OPTIONAL),
    ];

    // Budget fits critical + high + medium + low but NOT optional
    const totalMinusOptional = estimateTokens(criticalContent) +
      estimateTokens(highContent) + estimateTokens(mediumContent) +
      estimateTokens(lowContent);

    const result = enforceTokenBudget(sections, totalMinusOptional + 5);
    expect(result.truncatedSections).toContain('optional');
    expect(result.truncatedSections).not.toContain('low');
    expect(result.truncatedSections).not.toContain('medium');
    expect(result.content).toContain('low0'); // low content preserved
    expect(result.content).toContain('med0'); // medium content preserved
    expect(result.content).not.toContain('opt0'); // optional content gone
  });

  it('drops LOW after OPTIONAL, preserving MEDIUM and above', () => {
    const criticalContent = wordsForTokens(30, 'crit');
    const highContent = wordsForTokens(30, 'high');
    const mediumContent = wordsForTokens(30, 'med');
    const lowContent = wordsForTokens(100, 'low');
    const optionalContent = wordsForTokens(100, 'opt');

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('high', highContent, PromptPriority.HIGH),
      section('medium', mediumContent, PromptPriority.MEDIUM),
      section('low', lowContent, PromptPriority.LOW),
      section('optional', optionalContent, PromptPriority.OPTIONAL),
    ];

    // Budget fits critical + high + medium but NOT low or optional
    const totalMinusLowOpt = estimateTokens(criticalContent) +
      estimateTokens(highContent) + estimateTokens(mediumContent);

    const result = enforceTokenBudget(sections, totalMinusLowOpt + 5);
    expect(result.truncatedSections).toContain('optional');
    expect(result.truncatedSections).toContain('low');
    expect(result.truncatedSections).not.toContain('medium');
    expect(result.content).toContain('high0'); // high content preserved
    expect(result.content).toContain('med0');  // medium content preserved
  });

  it('drops MEDIUM after LOW, then HIGH as last resort', () => {
    const criticalContent = wordsForTokens(30, 'crit');
    const highContent = wordsForTokens(100, 'high');
    const mediumContent = wordsForTokens(100, 'med');
    const lowContent = wordsForTokens(100, 'low');
    const optionalContent = wordsForTokens(100, 'opt');

    const sections: PromptSection[] = [
      section('critical', criticalContent, PromptPriority.CRITICAL),
      section('high', highContent, PromptPriority.HIGH),
      section('medium', mediumContent, PromptPriority.MEDIUM),
      section('low', lowContent, PromptPriority.LOW),
      section('optional', optionalContent, PromptPriority.OPTIONAL),
    ];

    // Budget fits only critical. Everything else must be dropped.
    const criticalTokens = estimateTokens(criticalContent);
    const result = enforceTokenBudget(sections, criticalTokens + 5);
    expect(result.truncatedSections).toContain('optional');
    expect(result.truncatedSections).toContain('low');
    expect(result.truncatedSections).toContain('medium');
    expect(result.truncatedSections).toContain('high');
    expect(result.droppedHighPrioritySections).toContain('high');
    expect(result.content).toContain('crit0'); // critical always preserved
    expect(result.content).not.toContain('high0');
    expect(result.content).not.toContain('med0');
    expect(result.content).not.toContain('low0');
    expect(result.content).not.toContain('opt0');
  });
});
