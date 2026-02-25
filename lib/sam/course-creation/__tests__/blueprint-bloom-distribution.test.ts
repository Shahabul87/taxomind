/**
 * Tests for blueprint/bloom-distribution.ts
 *
 * Verifies computeBloomsDistribution, formatBloomsAssignments,
 * and the BLOOMS_ORDER constant.
 */

import {
  computeBloomsDistribution,
  formatBloomsAssignments,
  BLOOMS_ORDER,
  BLOOMS_ARTIFACT_GUIDANCE,
  BLOOMS_GOAL_VERBS,
} from '../blueprint/bloom-distribution';

describe('BLOOMS_ORDER', () => {
  it('should contain 6 Bloom taxonomy levels', () => {
    expect(BLOOMS_ORDER).toHaveLength(6);
  });

  it('should be in correct ascending order', () => {
    expect(BLOOMS_ORDER).toEqual([
      'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE',
    ]);
  });
});

describe('computeBloomsDistribution', () => {
  it('should distribute single level across all chapters', () => {
    const result = computeBloomsDistribution(['APPLY'], 5);
    expect(result).toHaveLength(5);
    expect(result.every((l) => l === 'APPLY')).toBe(true);
  });

  it('should return UNDERSTAND for empty bloomsFocus', () => {
    const result = computeBloomsDistribution([], 3);
    expect(result).toEqual(['UNDERSTAND', 'UNDERSTAND', 'UNDERSTAND']);
  });

  it('should progressively escalate levels', () => {
    const result = computeBloomsDistribution(['APPLY', 'ANALYZE'], 4);
    expect(result).toHaveLength(4);
    // Earlier chapters should have lower Bloom's level
    const firstHalfIdx = BLOOMS_ORDER.indexOf(result[0] as typeof BLOOMS_ORDER[number]);
    const lastIdx = BLOOMS_ORDER.indexOf(result[result.length - 1] as typeof BLOOMS_ORDER[number]);
    expect(lastIdx).toBeGreaterThanOrEqual(firstHalfIdx);
  });

  it('should fill cognitive gaps between non-adjacent levels', () => {
    const result = computeBloomsDistribution(['UNDERSTAND', 'ANALYZE'], 6);
    expect(result).toHaveLength(6);
    // APPLY should be inserted between UNDERSTAND and ANALYZE
    expect(result).toContain('APPLY');
  });

  it('should handle duplicate levels', () => {
    const result = computeBloomsDistribution(['APPLY', 'APPLY', 'APPLY'], 3);
    expect(result).toEqual(['APPLY', 'APPLY', 'APPLY']);
  });

  it('should handle full range of levels', () => {
    const result = computeBloomsDistribution(
      ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'],
      6,
    );
    expect(result).toHaveLength(6);
    expect(result[0]).toBe('REMEMBER');
    expect(result[result.length - 1]).toBe('CREATE');
  });

  it('should sort selected levels by taxonomy order', () => {
    const result = computeBloomsDistribution(['EVALUATE', 'UNDERSTAND'], 4);
    expect(result).toHaveLength(4);
    // First chapter should not be EVALUATE
    expect(result[0]).not.toBe('EVALUATE');
  });
});

describe('formatBloomsAssignments', () => {
  it('should format distribution as markdown list', () => {
    const result = formatBloomsAssignments(['UNDERSTAND', 'APPLY', 'ANALYZE']);
    expect(result).toContain('Chapter 1: **UNDERSTAND**');
    expect(result).toContain('Chapter 2: **APPLY**');
    expect(result).toContain('Chapter 3: **ANALYZE**');
  });

  it('should handle empty distribution', () => {
    const result = formatBloomsAssignments([]);
    expect(result).toBe('');
  });
});

describe('BLOOMS_ARTIFACT_GUIDANCE', () => {
  it('should have guidance for all 6 levels', () => {
    for (const level of BLOOMS_ORDER) {
      expect(BLOOMS_ARTIFACT_GUIDANCE[level]).toBeDefined();
      expect(BLOOMS_ARTIFACT_GUIDANCE[level].length).toBeGreaterThan(0);
    }
  });
});

describe('BLOOMS_GOAL_VERBS', () => {
  it('should have verbs for all 6 levels', () => {
    for (const level of BLOOMS_ORDER) {
      expect(BLOOMS_GOAL_VERBS[level]).toBeDefined();
    }
  });
});
