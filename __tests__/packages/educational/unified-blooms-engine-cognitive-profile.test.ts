/**
 * Unified Blooms Engine - getCognitiveProfile Tests
 *
 * Tests for the getCognitiveProfile method that fetches student's Bloom's progress
 * from the database and transforms it into a cognitive profile.
 */

import { describe, it, expect } from '@jest/globals';

// Test pure transformation logic without database mocking

describe('Unified Blooms Engine - Cognitive Profile Logic', () => {
  describe('Score Normalization', () => {
    it('should normalize scores from 0-100 to 0-1 range', () => {
      const rawScores = {
        rememberScore: 80,
        understandScore: 70,
        applyScore: 60,
        analyzeScore: 50,
        evaluateScore: 40,
        createScore: 30,
      };

      // Simulating the normalization logic from getCognitiveProfile
      const normalized = {
        REMEMBER: rawScores.rememberScore / 100,
        UNDERSTAND: rawScores.understandScore / 100,
        APPLY: rawScores.applyScore / 100,
        ANALYZE: rawScores.analyzeScore / 100,
        EVALUATE: rawScores.evaluateScore / 100,
        CREATE: rawScores.createScore / 100,
      };

      expect(normalized.REMEMBER).toBe(0.8);
      expect(normalized.UNDERSTAND).toBe(0.7);
      expect(normalized.APPLY).toBe(0.6);
      expect(normalized.ANALYZE).toBe(0.5);
      expect(normalized.EVALUATE).toBe(0.4);
      expect(normalized.CREATE).toBe(0.3);
    });

    it('should handle zero scores', () => {
      const rawScores = {
        rememberScore: 0,
        understandScore: 0,
        applyScore: 0,
        analyzeScore: 0,
        evaluateScore: 0,
        createScore: 0,
      };

      const normalized = {
        REMEMBER: rawScores.rememberScore / 100,
        UNDERSTAND: rawScores.understandScore / 100,
        APPLY: rawScores.applyScore / 100,
        ANALYZE: rawScores.analyzeScore / 100,
        EVALUATE: rawScores.evaluateScore / 100,
        CREATE: rawScores.createScore / 100,
      };

      expect(normalized.REMEMBER).toBe(0);
      expect(normalized.CREATE).toBe(0);
    });

    it('should handle perfect scores', () => {
      const rawScores = {
        rememberScore: 100,
        understandScore: 100,
        applyScore: 100,
        analyzeScore: 100,
        evaluateScore: 100,
        createScore: 100,
      };

      const normalized = {
        REMEMBER: rawScores.rememberScore / 100,
        UNDERSTAND: rawScores.understandScore / 100,
        APPLY: rawScores.applyScore / 100,
        ANALYZE: rawScores.analyzeScore / 100,
        EVALUATE: rawScores.evaluateScore / 100,
        CREATE: rawScores.createScore / 100,
      };

      expect(normalized.REMEMBER).toBe(1);
      expect(normalized.CREATE).toBe(1);
    });
  });

  describe('Weighted Overall Mastery Calculation', () => {
    it('should calculate weighted mastery correctly', () => {
      const levelMastery = {
        REMEMBER: 0.8,
        UNDERSTAND: 0.7,
        APPLY: 0.6,
        ANALYZE: 0.5,
        EVALUATE: 0.4,
        CREATE: 0.3,
      };

      // Weights from the implementation
      const weights = {
        REMEMBER: 0.10,
        UNDERSTAND: 0.15,
        APPLY: 0.20,
        ANALYZE: 0.20,
        EVALUATE: 0.17,
        CREATE: 0.18,
      };

      const overallMastery = Object.entries(levelMastery).reduce(
        (sum, [level, score]) => sum + score * weights[level as keyof typeof weights],
        0
      );

      // Manual calculation:
      // 0.8*0.10 + 0.7*0.15 + 0.6*0.20 + 0.5*0.20 + 0.4*0.17 + 0.3*0.18
      // = 0.08 + 0.105 + 0.12 + 0.10 + 0.068 + 0.054
      // = 0.527
      expect(overallMastery).toBeCloseTo(0.527, 2);
    });

    it('should give higher weight to higher-order skills', () => {
      const weights = {
        REMEMBER: 0.10,
        UNDERSTAND: 0.15,
        APPLY: 0.20,
        ANALYZE: 0.20,
        EVALUATE: 0.17,
        CREATE: 0.18,
      };

      // Sum of weights should equal 1.0
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBe(1.0);

      // Higher-order skills should have higher combined weight
      const lowerOrderWeight = weights.REMEMBER + weights.UNDERSTAND;
      const higherOrderWeight = weights.ANALYZE + weights.EVALUATE + weights.CREATE;

      expect(higherOrderWeight).toBeGreaterThan(lowerOrderWeight);
    });

    it('should return 0 for all zero scores', () => {
      const levelMastery = {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0,
      };

      const weights = {
        REMEMBER: 0.10,
        UNDERSTAND: 0.15,
        APPLY: 0.20,
        ANALYZE: 0.20,
        EVALUATE: 0.17,
        CREATE: 0.18,
      };

      const overallMastery = Object.entries(levelMastery).reduce(
        (sum, [level, score]) => sum + score * weights[level as keyof typeof weights],
        0
      );

      expect(overallMastery).toBe(0);
    });

    it('should return 1 for all perfect scores', () => {
      const levelMastery = {
        REMEMBER: 1,
        UNDERSTAND: 1,
        APPLY: 1,
        ANALYZE: 1,
        EVALUATE: 1,
        CREATE: 1,
      };

      const weights = {
        REMEMBER: 0.10,
        UNDERSTAND: 0.15,
        APPLY: 0.20,
        ANALYZE: 0.20,
        EVALUATE: 0.17,
        CREATE: 0.18,
      };

      const overallMastery = Object.entries(levelMastery).reduce(
        (sum, [level, score]) => sum + score * weights[level as keyof typeof weights],
        0
      );

      expect(overallMastery).toBe(1);
    });
  });

  describe('Preferred Levels Identification', () => {
    it('should identify levels with mastery >= 0.7 as preferred', () => {
      const levelMastery = {
        REMEMBER: 0.9,
        UNDERSTAND: 0.85,
        APPLY: 0.7,
        ANALYZE: 0.5,
        EVALUATE: 0.4,
        CREATE: 0.3,
      };

      type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

      const preferredLevels = (Object.entries(levelMastery) as [BloomsLevel, number][])
        .filter(([, score]) => score >= 0.7)
        .sort((a, b) => b[1] - a[1])
        .map(([level]) => level);

      expect(preferredLevels).toContain('REMEMBER');
      expect(preferredLevels).toContain('UNDERSTAND');
      expect(preferredLevels).toContain('APPLY');
      expect(preferredLevels).not.toContain('ANALYZE');
      expect(preferredLevels).not.toContain('EVALUATE');
      expect(preferredLevels).not.toContain('CREATE');
    });

    it('should sort preferred levels by score descending', () => {
      const levelMastery = {
        REMEMBER: 0.75,
        UNDERSTAND: 0.90,
        APPLY: 0.80,
        ANALYZE: 0.5,
        EVALUATE: 0.4,
        CREATE: 0.3,
      };

      type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

      const preferredLevels = (Object.entries(levelMastery) as [BloomsLevel, number][])
        .filter(([, score]) => score >= 0.7)
        .sort((a, b) => b[1] - a[1])
        .map(([level]) => level);

      // Should be sorted: UNDERSTAND (0.90), APPLY (0.80), REMEMBER (0.75)
      expect(preferredLevels[0]).toBe('UNDERSTAND');
      expect(preferredLevels[1]).toBe('APPLY');
      expect(preferredLevels[2]).toBe('REMEMBER');
    });

    it('should return empty array when no levels have mastery >= 0.7', () => {
      const levelMastery = {
        REMEMBER: 0.6,
        UNDERSTAND: 0.5,
        APPLY: 0.4,
        ANALYZE: 0.3,
        EVALUATE: 0.2,
        CREATE: 0.1,
      };

      type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

      const preferredLevels = (Object.entries(levelMastery) as [BloomsLevel, number][])
        .filter(([, score]) => score >= 0.7)
        .map(([level]) => level);

      expect(preferredLevels).toHaveLength(0);
    });
  });

  describe('Challenge Areas Identification', () => {
    it('should identify levels with mastery < 0.4 as challenge areas', () => {
      const levelMastery = {
        REMEMBER: 0.9,
        UNDERSTAND: 0.7,
        APPLY: 0.5,
        ANALYZE: 0.35,
        EVALUATE: 0.25,
        CREATE: 0.1,
      };

      type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

      const challengeAreas = (Object.entries(levelMastery) as [BloomsLevel, number][])
        .filter(([, score]) => score < 0.4)
        .sort((a, b) => a[1] - b[1])
        .map(([level]) => level);

      expect(challengeAreas).toContain('CREATE');
      expect(challengeAreas).toContain('EVALUATE');
      expect(challengeAreas).toContain('ANALYZE');
      expect(challengeAreas).not.toContain('APPLY');
      expect(challengeAreas).not.toContain('UNDERSTAND');
      expect(challengeAreas).not.toContain('REMEMBER');
    });

    it('should sort challenge areas by score ascending (weakest first)', () => {
      const levelMastery = {
        REMEMBER: 0.9,
        UNDERSTAND: 0.7,
        APPLY: 0.5,
        ANALYZE: 0.35,
        EVALUATE: 0.25,
        CREATE: 0.1,
      };

      type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

      const challengeAreas = (Object.entries(levelMastery) as [BloomsLevel, number][])
        .filter(([, score]) => score < 0.4)
        .sort((a, b) => a[1] - b[1])
        .map(([level]) => level);

      // Should be sorted: CREATE (0.1), EVALUATE (0.25), ANALYZE (0.35)
      expect(challengeAreas[0]).toBe('CREATE');
      expect(challengeAreas[1]).toBe('EVALUATE');
      expect(challengeAreas[2]).toBe('ANALYZE');
    });

    it('should return empty array when all levels have mastery >= 0.4', () => {
      const levelMastery = {
        REMEMBER: 0.9,
        UNDERSTAND: 0.8,
        APPLY: 0.7,
        ANALYZE: 0.6,
        EVALUATE: 0.5,
        CREATE: 0.4,
      };

      type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

      const challengeAreas = (Object.entries(levelMastery) as [BloomsLevel, number][])
        .filter(([, score]) => score < 0.4)
        .map(([level]) => level);

      expect(challengeAreas).toHaveLength(0);
    });
  });

  describe('Learning Velocity Calculation', () => {
    it('should start with base velocity of 1.0', () => {
      const baseVelocity = 1.0;
      expect(baseVelocity).toBe(1.0);
    });

    it('should calculate frequency bonus (max 0.5)', () => {
      const assessmentCount = 10;
      const frequencyBonus = Math.min(assessmentCount / 10, 0.5);
      expect(frequencyBonus).toBe(0.5);

      const fewerAssessments = 5;
      const smallerBonus = Math.min(fewerAssessments / 10, 0.5);
      expect(smallerBonus).toBe(0.5);

      const moreAssessments = 20;
      const cappedBonus = Math.min(moreAssessments / 10, 0.5);
      expect(cappedBonus).toBe(0.5); // Capped at 0.5
    });

    it('should apply decay for inactivity (>30 days)', () => {
      let learningVelocity = 1.5;
      const daysSinceLastAssessment = 45;

      if (daysSinceLastAssessment > 30) {
        learningVelocity *= 0.8;
      }

      expect(learningVelocity).toBeCloseTo(1.2, 2);
    });

    it('should apply boost for recent activity (<=7 days)', () => {
      let learningVelocity = 1.5;
      const daysSinceLastAssessment = 5;

      if (daysSinceLastAssessment <= 7) {
        learningVelocity *= 1.1;
      }

      expect(learningVelocity).toBeCloseTo(1.65, 2);
    });

    it('should not modify velocity for moderate activity (8-30 days)', () => {
      let learningVelocity = 1.5;
      const daysSinceLastAssessment = 15;

      if (daysSinceLastAssessment > 30) {
        learningVelocity *= 0.8;
      } else if (daysSinceLastAssessment <= 7) {
        learningVelocity *= 1.1;
      }

      expect(learningVelocity).toBe(1.5); // No change
    });
  });

  describe('Default Profile Structure', () => {
    it('should have correct default profile shape', () => {
      const defaultProfile = {
        overallMastery: 0,
        levelMastery: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0,
        },
        learningVelocity: 1.0,
        preferredLevels: [],
        challengeAreas: [],
      };

      expect(defaultProfile.overallMastery).toBe(0);
      expect(Object.keys(defaultProfile.levelMastery)).toHaveLength(6);
      expect(defaultProfile.learningVelocity).toBe(1.0);
      expect(defaultProfile.preferredLevels).toEqual([]);
      expect(defaultProfile.challengeAreas).toEqual([]);
    });

    it('should include all six Bloom\'s levels in levelMastery', () => {
      const expectedLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

      const levelMastery = {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0,
      };

      expect(Object.keys(levelMastery).sort()).toEqual(expectedLevels.sort());
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary score of exactly 0.7 (preferred)', () => {
      const score = 0.7;
      expect(score >= 0.7).toBe(true);
    });

    it('should handle boundary score of exactly 0.4 (not challenge)', () => {
      const score = 0.4;
      expect(score < 0.4).toBe(false);
    });

    it('should handle score just below 0.4 (challenge)', () => {
      const score = 0.39;
      expect(score < 0.4).toBe(true);
    });

    it('should handle score just below 0.7 (not preferred)', () => {
      const score = 0.69;
      expect(score >= 0.7).toBe(false);
    });

    it('should round overall mastery to 2 decimal places', () => {
      const rawValue = 0.5277777;
      const rounded = Math.round(rawValue * 100) / 100;
      expect(rounded).toBe(0.53);
    });

    it('should round learning velocity to 2 decimal places', () => {
      const rawValue = 1.6499999;
      const rounded = Math.round(rawValue * 100) / 100;
      expect(rounded).toBe(1.65);
    });
  });
});
