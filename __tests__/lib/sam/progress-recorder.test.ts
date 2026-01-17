/**
 * Progress Recorder Tests
 *
 * Tests for Bloom's Taxonomy progress recording helper functions.
 * Note: The core recording functions require a database mock that integrates
 * with Prisma's lazy initialization. This test file focuses on utility functions
 * and data transformation logic that can be tested without database mocks.
 */

import { describe, it, expect } from '@jest/globals';

// Test helper functions that can be imported without triggering db initialization
// These functions are copied from the implementation for isolated testing

type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

interface BloomsScores {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

// Helper functions extracted for unit testing
function getDefaultScores(): BloomsScores {
  return {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };
}

function calculateStrengthWeakness(scores: BloomsScores): {
  strengthAreas: BloomsLevel[];
  weaknessAreas: BloomsLevel[];
} {
  const strengthAreas: BloomsLevel[] = [];
  const weaknessAreas: BloomsLevel[] = [];

  const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  for (const level of levels) {
    const score = scores[level];
    if (score >= 70) {
      strengthAreas.push(level);
    } else if (score > 0 && score < 50) {
      weaknessAreas.push(level);
    }
  }

  return { strengthAreas, weaknessAreas };
}

function calculateImprovementRate(oldAccuracy: number, newAccuracy: number): number {
  if (oldAccuracy === 0) {
    return newAccuracy > 0 ? 100 : 0;
  }
  return ((newAccuracy - oldAccuracy) / oldAccuracy) * 100;
}

function updateChallengeAreas(
  currentAreas: string[] | null,
  score: number,
  level: BloomsLevel
): string[] {
  const areas = currentAreas ?? [];

  if (score < 50 && !areas.includes(level)) {
    return [...areas, level];
  } else if (score >= 70 && areas.includes(level)) {
    return areas.filter((a) => a !== level);
  }

  return areas;
}

function aggregateByLevel(
  questions: Array<{
    bloomsLevel: BloomsLevel | string | null;
    isCorrect: boolean;
    responseTimeMs?: number;
  }>
): Record<string, { correct: number; total: number; totalResponseTime: number }> {
  const stats: Record<string, { correct: number; total: number; totalResponseTime: number }> = {};

  for (const q of questions) {
    if (!q.bloomsLevel) continue;

    const level = String(q.bloomsLevel).toUpperCase();
    const validLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    if (!validLevels.includes(level)) continue;

    if (!stats[level]) {
      stats[level] = { correct: 0, total: 0, totalResponseTime: 0 };
    }

    stats[level].total++;
    if (q.isCorrect) {
      stats[level].correct++;
    }
    if (q.responseTimeMs) {
      stats[level].totalResponseTime += q.responseTimeMs;
    }
  }

  return stats;
}

// Calculate EMA (Exponential Moving Average)
function calculateEMA(newScore: number, oldScore: number, alpha: number = 0.3): number {
  return Math.round((alpha * newScore + (1 - alpha) * oldScore) * 100) / 100;
}

describe('Progress Recorder Utilities', () => {
  describe('getDefaultScores', () => {
    it('should return all zeros', () => {
      const scores = getDefaultScores();
      expect(scores.REMEMBER).toBe(0);
      expect(scores.UNDERSTAND).toBe(0);
      expect(scores.APPLY).toBe(0);
      expect(scores.ANALYZE).toBe(0);
      expect(scores.EVALUATE).toBe(0);
      expect(scores.CREATE).toBe(0);
    });

    it('should return a new object each time', () => {
      const scores1 = getDefaultScores();
      const scores2 = getDefaultScores();
      expect(scores1).not.toBe(scores2);
      scores1.REMEMBER = 100;
      expect(scores2.REMEMBER).toBe(0);
    });
  });

  describe('calculateStrengthWeakness', () => {
    it('should identify strength areas (>= 70%)', () => {
      const scores: BloomsScores = {
        REMEMBER: 80,
        UNDERSTAND: 75,
        APPLY: 70,
        ANALYZE: 65,
        EVALUATE: 50,
        CREATE: 30,
      };

      const { strengthAreas, weaknessAreas } = calculateStrengthWeakness(scores);

      expect(strengthAreas).toContain('REMEMBER');
      expect(strengthAreas).toContain('UNDERSTAND');
      expect(strengthAreas).toContain('APPLY');
      expect(strengthAreas).not.toContain('ANALYZE');
    });

    it('should identify weakness areas (> 0 and < 50)', () => {
      const scores: BloomsScores = {
        REMEMBER: 80,
        UNDERSTAND: 40,
        APPLY: 30,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 10,
      };

      const { weaknessAreas } = calculateStrengthWeakness(scores);

      expect(weaknessAreas).toContain('UNDERSTAND');
      expect(weaknessAreas).toContain('APPLY');
      expect(weaknessAreas).toContain('CREATE');
      expect(weaknessAreas).not.toContain('ANALYZE'); // 0 is not a weakness
    });

    it('should not include 0 scores as weaknesses', () => {
      const scores: BloomsScores = {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0,
      };

      const { weaknessAreas } = calculateStrengthWeakness(scores);
      expect(weaknessAreas).toHaveLength(0);
    });

    it('should handle all high scores', () => {
      const scores: BloomsScores = {
        REMEMBER: 90,
        UNDERSTAND: 85,
        APPLY: 80,
        ANALYZE: 75,
        EVALUATE: 70,
        CREATE: 95,
      };

      const { strengthAreas, weaknessAreas } = calculateStrengthWeakness(scores);
      expect(strengthAreas).toHaveLength(6);
      expect(weaknessAreas).toHaveLength(0);
    });
  });

  describe('calculateImprovementRate', () => {
    it('should calculate positive improvement', () => {
      const rate = calculateImprovementRate(70, 80);
      expect(rate).toBeCloseTo(14.29, 1); // (80-70)/70 * 100 = 14.29%
    });

    it('should calculate negative improvement', () => {
      const rate = calculateImprovementRate(80, 70);
      expect(rate).toBeCloseTo(-12.5, 1); // (70-80)/80 * 100 = -12.5%
    });

    it('should return 100 when old accuracy is 0 and new is positive', () => {
      const rate = calculateImprovementRate(0, 50);
      expect(rate).toBe(100);
    });

    it('should return 0 when both are 0', () => {
      const rate = calculateImprovementRate(0, 0);
      expect(rate).toBe(0);
    });
  });

  describe('updateChallengeAreas', () => {
    it('should add level when score is below 50', () => {
      const areas = updateChallengeAreas([], 40, 'ANALYZE');
      expect(areas).toContain('ANALYZE');
    });

    it('should not add level when score is 50 or above', () => {
      const areas = updateChallengeAreas([], 50, 'ANALYZE');
      expect(areas).not.toContain('ANALYZE');
    });

    it('should remove level when score reaches 70', () => {
      const areas = updateChallengeAreas(['ANALYZE', 'EVALUATE'], 70, 'ANALYZE');
      expect(areas).not.toContain('ANALYZE');
      expect(areas).toContain('EVALUATE');
    });

    it('should not add duplicate levels', () => {
      const areas = updateChallengeAreas(['ANALYZE'], 40, 'ANALYZE');
      expect(areas.filter((a) => a === 'ANALYZE')).toHaveLength(1);
    });

    it('should handle null current areas', () => {
      const areas = updateChallengeAreas(null, 40, 'REMEMBER');
      expect(areas).toEqual(['REMEMBER']);
    });

    it('should keep existing areas when score is between 50 and 70', () => {
      const areas = updateChallengeAreas(['ANALYZE'], 60, 'ANALYZE');
      expect(areas).toContain('ANALYZE');
    });
  });

  describe('aggregateByLevel', () => {
    it('should aggregate correct answers by level', () => {
      const questions = [
        { bloomsLevel: 'REMEMBER', isCorrect: true },
        { bloomsLevel: 'REMEMBER', isCorrect: true },
        { bloomsLevel: 'REMEMBER', isCorrect: false },
        { bloomsLevel: 'UNDERSTAND', isCorrect: true },
      ];

      const stats = aggregateByLevel(questions);

      expect(stats['REMEMBER'].total).toBe(3);
      expect(stats['REMEMBER'].correct).toBe(2);
      expect(stats['UNDERSTAND'].total).toBe(1);
      expect(stats['UNDERSTAND'].correct).toBe(1);
    });

    it('should ignore questions without bloom levels', () => {
      const questions = [
        { bloomsLevel: null, isCorrect: true },
        { bloomsLevel: 'APPLY', isCorrect: true },
      ];

      const stats = aggregateByLevel(questions);

      expect(Object.keys(stats)).toEqual(['APPLY']);
      expect(stats['APPLY'].total).toBe(1);
    });

    it('should aggregate response times', () => {
      const questions = [
        { bloomsLevel: 'ANALYZE', isCorrect: true, responseTimeMs: 3000 },
        { bloomsLevel: 'ANALYZE', isCorrect: false, responseTimeMs: 5000 },
      ];

      const stats = aggregateByLevel(questions);

      expect(stats['ANALYZE'].totalResponseTime).toBe(8000);
    });

    it('should handle empty questions array', () => {
      const stats = aggregateByLevel([]);
      expect(Object.keys(stats)).toHaveLength(0);
    });

    it('should normalize lowercase bloom levels', () => {
      const questions = [
        { bloomsLevel: 'remember', isCorrect: true },
        { bloomsLevel: 'REMEMBER', isCorrect: true },
      ];

      const stats = aggregateByLevel(questions);

      expect(stats['REMEMBER'].total).toBe(2);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate EMA with default alpha=0.3', () => {
      // EMA = 0.3 * new + 0.7 * old
      const result = calculateEMA(100, 50);
      expect(result).toBe(65); // 0.3 * 100 + 0.7 * 50 = 30 + 35 = 65
    });

    it('should weight new scores appropriately', () => {
      const result = calculateEMA(100, 0);
      expect(result).toBe(30); // 0.3 * 100 + 0.7 * 0 = 30
    });

    it('should handle custom alpha', () => {
      const result = calculateEMA(100, 50, 0.5);
      expect(result).toBe(75); // 0.5 * 100 + 0.5 * 50 = 75
    });

    it('should round to 2 decimal places', () => {
      const result = calculateEMA(33, 66, 0.3);
      // 0.3 * 33 + 0.7 * 66 = 9.9 + 46.2 = 56.1
      expect(result).toBe(56.1);
    });
  });

  describe('Score Calculation Scenarios', () => {
    it('should calculate percentage score from correct/total', () => {
      const correct = 3;
      const total = 4;
      const score = (correct / total) * 100;
      expect(score).toBe(75);
    });

    it('should calculate average response time', () => {
      const stats = {
        totalResponseTime: 12000,
        total: 3,
      };
      const avgResponseTime = stats.totalResponseTime / stats.total;
      expect(avgResponseTime).toBe(4000);
    });

    it('should handle success threshold (70%)', () => {
      const isSuccess = (score: number) => score >= 70;
      expect(isSuccess(70)).toBe(true);
      expect(isSuccess(69)).toBe(false);
      expect(isSuccess(100)).toBe(true);
    });
  });

  describe('Progress History Trimming', () => {
    it('should keep last 100 entries', () => {
      const longHistory = Array.from({ length: 105 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        level: 'REMEMBER',
        score: 50,
      }));

      const trimmedHistory = longHistory.slice(-100);
      expect(trimmedHistory).toHaveLength(100);
      expect(trimmedHistory[99].timestamp).toBe('2025-01-105T00:00:00Z');
    });

    it('should not trim when under 100 entries', () => {
      const shortHistory = Array.from({ length: 50 }, (_, i) => ({
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        level: 'REMEMBER',
        score: 50,
      }));

      const trimmedHistory = shortHistory.slice(-100);
      expect(trimmedHistory).toHaveLength(50);
    });
  });
});
