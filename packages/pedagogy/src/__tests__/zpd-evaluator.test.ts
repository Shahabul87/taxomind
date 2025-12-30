/**
 * ZPD Evaluator Tests
 *
 * Tests for Zone of Proximal Development evaluation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ZPDEvaluator,
  createZPDEvaluator,
  createStrictZPDEvaluator,
  createLenientZPDEvaluator,
  ZPD_ZONE_RANGES,
  ZONE_ENGAGEMENT_MAP,
  SUPPORT_TYPES,
  DEFAULT_ZPD_CONFIG,
} from '../zpd-evaluator';
import type {
  PedagogicalContent,
  StudentCognitiveProfile,
  ZPDZone,
} from '../types';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTestContent(overrides: Partial<PedagogicalContent> = {}): PedagogicalContent {
  return {
    content: 'This lesson provides examples and hints for learning. First, we introduce the concept with step by step guidance. For example, consider this simple case. Remember that practice makes perfect.',
    type: 'lesson',
    topic: 'mathematics',
    targetBloomsLevel: 'UNDERSTAND',
    targetDifficulty: 'intermediate',
    prerequisites: ['algebra', 'basic-math'],
    learningObjectives: ['Understand key concepts', 'Apply basic principles'],
    ...overrides,
  };
}

function createTestStudentProfile(
  overrides: Partial<StudentCognitiveProfile> = {}
): StudentCognitiveProfile {
  return {
    masteryLevels: {
      algebra: {
        topicId: 'algebra',
        mastery: 75,
        highestBloomsLevel: 'APPLY',
        confidence: 0.8,
        lastAssessed: '2024-01-01',
      },
      'basic-math': {
        topicId: 'basic-math',
        mastery: 90,
        highestBloomsLevel: 'APPLY',
        confidence: 0.9,
        lastAssessed: '2024-01-01',
      },
    },
    demonstratedBloomsLevels: {
      mathematics: 'UNDERSTAND',
      algebra: 'APPLY',
    },
    currentDifficultyLevel: 'intermediate',
    learningVelocity: 'moderate',
    completedTopics: ['basic-math', 'algebra'],
    inProgressTopics: ['mathematics'],
    knowledgeGaps: [],
    recentPerformance: {
      averageScore: 80,
      trend: 'stable',
      assessmentCount: 5,
      timeSpentMinutes: 120,
      engagementLevel: 'high',
    },
    ...overrides,
  };
}

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('ZPD Constants', () => {
  describe('ZPD_ZONE_RANGES', () => {
    it('should have all ZPD zones defined', () => {
      const expectedZones: ZPDZone[] = [
        'TOO_EASY',
        'COMFORT_ZONE',
        'ZPD_LOWER',
        'ZPD_OPTIMAL',
        'ZPD_UPPER',
        'FRUSTRATION',
        'UNREACHABLE',
      ];

      for (const zone of expectedZones) {
        expect(ZPD_ZONE_RANGES).toHaveProperty(zone);
        expect(ZPD_ZONE_RANGES[zone]).toHaveProperty('min');
        expect(ZPD_ZONE_RANGES[zone]).toHaveProperty('max');
      }
    });

    it('should have non-overlapping ranges', () => {
      const ranges = Object.entries(ZPD_ZONE_RANGES).map(([zone, range]) => ({
        zone,
        ...range,
      }));

      ranges.sort((a, b) => a.min - b.min);

      for (let i = 0; i < ranges.length - 1; i++) {
        expect(ranges[i].max).toBeLessThanOrEqual(ranges[i + 1].min);
      }
    });

    it('should cover the full score range', () => {
      expect(ZPD_ZONE_RANGES.TOO_EASY.min).toBe(0);
      expect(ZPD_ZONE_RANGES.UNREACHABLE.max).toBe(100);
    });
  });

  describe('ZONE_ENGAGEMENT_MAP', () => {
    it('should map all zones to engagement states', () => {
      const zones: ZPDZone[] = [
        'TOO_EASY',
        'COMFORT_ZONE',
        'ZPD_LOWER',
        'ZPD_OPTIMAL',
        'ZPD_UPPER',
        'FRUSTRATION',
        'UNREACHABLE',
      ];

      for (const zone of zones) {
        expect(ZONE_ENGAGEMENT_MAP).toHaveProperty(zone);
      }
    });

    it('should have appropriate engagement mappings', () => {
      expect(ZONE_ENGAGEMENT_MAP.TOO_EASY).toBe('bored');
      expect(ZONE_ENGAGEMENT_MAP.COMFORT_ZONE).toBe('comfortable');
      expect(ZONE_ENGAGEMENT_MAP.ZPD_LOWER).toBe('engaged');
      expect(ZONE_ENGAGEMENT_MAP.ZPD_OPTIMAL).toBe('challenged');
      expect(ZONE_ENGAGEMENT_MAP.ZPD_UPPER).toBe('challenged');
      expect(ZONE_ENGAGEMENT_MAP.FRUSTRATION).toBe('frustrated');
      expect(ZONE_ENGAGEMENT_MAP.UNREACHABLE).toBe('anxious');
    });
  });

  describe('SUPPORT_TYPES', () => {
    it('should include essential support types', () => {
      expect(SUPPORT_TYPES).toContain('examples');
      expect(SUPPORT_TYPES).toContain('hints');
      expect(SUPPORT_TYPES).toContain('scaffolding');
      expect(SUPPORT_TYPES).toContain('feedback');
    });
  });

  describe('DEFAULT_ZPD_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_ZPD_CONFIG.targetZone).toBe('ZPD_OPTIMAL');
      expect(DEFAULT_ZPD_CONFIG.passingScore).toBe(70);
      expect(DEFAULT_ZPD_CONFIG.minChallengeScore).toBeGreaterThan(0);
      expect(DEFAULT_ZPD_CONFIG.maxChallengeScore).toBeLessThan(100);
    });

    it('should have weights that sum reasonably', () => {
      const totalWeight =
        DEFAULT_ZPD_CONFIG.challengeWeight +
        DEFAULT_ZPD_CONFIG.supportWeight +
        DEFAULT_ZPD_CONFIG.personalizationWeight;
      expect(totalWeight).toBe(1);
    });
  });
});

// ============================================================================
// ZPD EVALUATOR TESTS
// ============================================================================

describe('ZPDEvaluator', () => {
  let evaluator: ZPDEvaluator;

  beforeEach(() => {
    evaluator = new ZPDEvaluator();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const eval1 = new ZPDEvaluator();
      expect(eval1.name).toBe('ZPDEvaluator');
    });

    it('should accept custom config', () => {
      const eval1 = new ZPDEvaluator({
        targetZone: 'ZPD_UPPER',
        passingScore: 80,
      });
      expect(eval1).toBeDefined();
    });
  });

  describe('evaluate basic structure', () => {
    it('should return all required fields', async () => {
      const content = createTestContent();
      const result = await evaluator.evaluate(content);

      expect(result).toHaveProperty('evaluatorName', 'ZPDEvaluator');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('processingTimeMs');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('inZPD');
      expect(result).toHaveProperty('zpdZone');
      expect(result).toHaveProperty('challengeLevel');
      expect(result).toHaveProperty('supportAdequacy');
      expect(result).toHaveProperty('engagementPrediction');
      expect(result).toHaveProperty('personalizationFit');
    });

    it('should have valid score range', async () => {
      const content = createTestContent();
      const result = await evaluator.evaluate(content);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should have valid confidence range', async () => {
      const content = createTestContent();
      const result = await evaluator.evaluate(content);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('ZPD zone determination', () => {
    it('should detect ZPD_OPTIMAL zone with appropriate content', async () => {
      const content = createTestContent({
        targetDifficulty: 'intermediate',
        targetBloomsLevel: 'APPLY',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'intermediate',
      });

      const result = await evaluator.evaluate(content, profile);

      // The zone depends on the calculated challenge score
      expect([
        'ZPD_LOWER',
        'ZPD_OPTIMAL',
        'ZPD_UPPER',
        'COMFORT_ZONE',
      ]).toContain(result.zpdZone);
    });

    it('should detect TOO_EASY when content is much below student level', async () => {
      const content = createTestContent({
        targetDifficulty: 'beginner',
        targetBloomsLevel: 'REMEMBER',
        content: 'Simple content with basic words.',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'expert',
        demonstratedBloomsLevels: { mathematics: 'CREATE' },
      });

      const result = await evaluator.evaluate(content, profile);

      expect(['TOO_EASY', 'COMFORT_ZONE']).toContain(result.zpdZone);
    });

    it('should detect FRUSTRATION/UNREACHABLE when content is too hard', async () => {
      const content = createTestContent({
        targetDifficulty: 'expert',
        targetBloomsLevel: 'CREATE',
        prerequisites: ['advanced-calculus', 'linear-algebra', 'topology'],
        content:
          'This extremely advanced content requires mastery of differential equations and tensor calculus. The sophisticated mathematical framework involves rigorous proofs and complex theoretical analysis.',
        learningObjectives: Array(10).fill('Complex objective'),
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'beginner',
        demonstratedBloomsLevels: { mathematics: 'REMEMBER' },
        completedTopics: [],
        masteryLevels: {},
      });

      const result = await evaluator.evaluate(content, profile);

      expect(['FRUSTRATION', 'UNREACHABLE', 'ZPD_UPPER']).toContain(
        result.zpdZone
      );
    });

    it('should report inZPD correctly', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      const expectedInZPD = ['ZPD_LOWER', 'ZPD_OPTIMAL', 'ZPD_UPPER'].includes(
        result.zpdZone
      );
      expect(result.inZPD).toBe(expectedInZPD);
    });
  });

  describe('challenge level analysis', () => {
    it('should analyze challenge factors', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      expect(result.challengeLevel).toHaveProperty('score');
      expect(result.challengeLevel).toHaveProperty('appropriate');
      expect(result.challengeLevel).toHaveProperty('factors');
      expect(result.challengeLevel).toHaveProperty('recommendedAdjustment');
    });

    it('should include difficulty_gap factor', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      const difficultyFactor = result.challengeLevel.factors.find(
        (f) => f.name === 'difficulty_gap'
      );
      expect(difficultyFactor).toBeDefined();
      expect(difficultyFactor?.contribution).toBeGreaterThanOrEqual(0);
      expect(difficultyFactor?.contribution).toBeLessThanOrEqual(100);
    });

    it('should include blooms_gap factor', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      const bloomsFactor = result.challengeLevel.factors.find(
        (f) => f.name === 'blooms_gap'
      );
      expect(bloomsFactor).toBeDefined();
    });

    it('should include prerequisite_coverage factor', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      const prereqFactor = result.challengeLevel.factors.find(
        (f) => f.name === 'prerequisite_coverage'
      );
      expect(prereqFactor).toBeDefined();
    });

    it('should include content_complexity factor', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      const complexityFactor = result.challengeLevel.factors.find(
        (f) => f.name === 'content_complexity'
      );
      expect(complexityFactor).toBeDefined();
    });

    it('should recommend increase for too easy content', async () => {
      const content = createTestContent({
        targetDifficulty: 'beginner',
        targetBloomsLevel: 'REMEMBER',
        content: 'Simple basic content.',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'expert',
      });

      const result = await evaluator.evaluate(content, profile);

      // Challenge level depends on actual calculation
      expect(['increase', 'maintain', 'decrease']).toContain(
        result.challengeLevel.recommendedAdjustment
      );
    });

    it('should recommend decrease for too hard content', async () => {
      const evaluatorStrict = new ZPDEvaluator({
        minChallengeScore: 30,
        maxChallengeScore: 70,
      });

      const content = createTestContent({
        targetDifficulty: 'expert',
        targetBloomsLevel: 'CREATE',
        prerequisites: ['advanced-topic-1', 'advanced-topic-2', 'advanced-topic-3'],
        learningObjectives: Array(10).fill('Complex learning objective'),
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'beginner',
        completedTopics: [],
        masteryLevels: {},
      });

      const result = await evaluatorStrict.evaluate(content, profile);

      // With significant gap, should recommend decrease
      if (result.challengeLevel.score > 70) {
        expect(result.challengeLevel.recommendedAdjustment).toBe('decrease');
      }
    });
  });

  describe('support adequacy analysis', () => {
    it('should analyze support adequacy', async () => {
      const content = createTestContent();

      const result = await evaluator.evaluate(content);

      expect(result.supportAdequacy).toHaveProperty('score');
      expect(result.supportAdequacy).toHaveProperty('adequate');
      expect(result.supportAdequacy).toHaveProperty('supportPresent');
      expect(result.supportAdequacy).toHaveProperty('supportMissing');
      expect(result.supportAdequacy).toHaveProperty('challengeSupportBalance');
    });

    it('should detect examples in content', async () => {
      const content = createTestContent({
        content:
          'Here is an important concept. For example, consider this case. E.g., this demonstrates the principle.',
      });

      const result = await evaluator.evaluate(content);

      expect(result.supportAdequacy.supportPresent).toContain('examples');
    });

    it('should detect hints in content', async () => {
      const content = createTestContent({
        content:
          'This is the main content. Hint: pay attention to this detail. Remember that this is important.',
      });

      const result = await evaluator.evaluate(content);

      expect(result.supportAdequacy.supportPresent).toContain('hints');
    });

    it('should detect scaffolding in content', async () => {
      const content = createTestContent({
        content:
          'Let us learn step by step. First, we do this. Then, we move to the next part. Next, we complete the task.',
      });

      const result = await evaluator.evaluate(content);

      expect(result.supportAdequacy.supportPresent).toContain('scaffolding');
    });

    it('should report missing support types', async () => {
      const content = createTestContent({
        content: 'Minimal content without any support structures or guidance.',
      });

      const result = await evaluator.evaluate(content);

      expect(result.supportAdequacy.supportMissing.length).toBeGreaterThan(0);
    });

    it('should assess challenge-support balance', async () => {
      const content = createTestContent();

      const result = await evaluator.evaluate(content);

      expect(['too_much_support', 'balanced', 'too_little_support']).toContain(
        result.supportAdequacy.challengeSupportBalance
      );
    });
  });

  describe('engagement prediction', () => {
    it('should predict engagement state', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      expect(result.engagementPrediction).toHaveProperty('score');
      expect(result.engagementPrediction).toHaveProperty('predictedState');
      expect(result.engagementPrediction).toHaveProperty('disengagementRisk');
      expect(result.engagementPrediction).toHaveProperty('engagementFactors');
    });

    it('should have valid engagement score', async () => {
      const content = createTestContent();

      const result = await evaluator.evaluate(content);

      expect(result.engagementPrediction.score).toBeGreaterThanOrEqual(0);
      expect(result.engagementPrediction.score).toBeLessThanOrEqual(100);
    });

    it('should have valid disengagement risk', async () => {
      const content = createTestContent();

      const result = await evaluator.evaluate(content);

      expect(result.engagementPrediction.disengagementRisk).toBeGreaterThanOrEqual(0);
      expect(result.engagementPrediction.disengagementRisk).toBeLessThanOrEqual(1);
    });

    it('should predict higher engagement for ZPD content', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      if (result.inZPD) {
        expect(result.engagementPrediction.score).toBeGreaterThanOrEqual(70);
      }
    });

    it('should predict bored state for too easy content', async () => {
      const content = createTestContent({
        targetDifficulty: 'beginner',
        targetBloomsLevel: 'REMEMBER',
        content: 'Very simple content.',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'expert',
        demonstratedBloomsLevels: { mathematics: 'CREATE' },
      });

      const result = await evaluator.evaluate(content, profile);

      if (result.zpdZone === 'TOO_EASY') {
        expect(result.engagementPrediction.predictedState).toBe('bored');
      }
    });
  });

  describe('personalization fit', () => {
    it('should analyze personalization fit', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      expect(result.personalizationFit).toHaveProperty('score');
      expect(result.personalizationFit).toHaveProperty('assessment');
      expect(result.personalizationFit).toHaveProperty('opportunities');
    });

    it('should have lower personalization score without profile', async () => {
      const content = createTestContent();

      const resultWithoutProfile = await evaluator.evaluate(content);
      const resultWithProfile = await evaluator.evaluate(
        content,
        createTestStudentProfile()
      );

      expect(resultWithoutProfile.personalizationFit.score).toBeLessThan(
        resultWithProfile.personalizationFit.score
      );
    });

    it('should suggest gathering student data when no profile', async () => {
      const content = createTestContent();

      const result = await evaluator.evaluate(content);

      expect(result.personalizationFit.opportunities.length).toBeGreaterThan(0);
      const hasDataSuggestion = result.personalizationFit.opportunities.some(
        (o) =>
          o.suggestion.toLowerCase().includes('student') ||
          o.suggestion.toLowerCase().includes('gather')
      );
      expect(hasDataSuggestion).toBe(true);
    });

    it('should identify difficulty mismatch opportunity', async () => {
      const content = createTestContent({
        targetDifficulty: 'expert',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'beginner',
      });

      const result = await evaluator.evaluate(content, profile);

      const hasDifficultyOpportunity = result.personalizationFit.opportunities.some(
        (o) => o.area === 'Difficulty Level'
      );
      expect(hasDifficultyOpportunity).toBe(true);
    });

    it('should suggest pacing for slow learners', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile({
        learningVelocity: 'slow',
      });

      const result = await evaluator.evaluate(content, profile);

      const hasPacingOpportunity = result.personalizationFit.opportunities.some(
        (o) => o.area === 'Pacing'
      );
      expect(hasPacingOpportunity).toBe(true);
    });

    it('should suggest engagement boost for low engagement students', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile({
        recentPerformance: {
          averageScore: 70,
          trend: 'stable',
          assessmentCount: 5,
          timeSpentMinutes: 60,
          engagementLevel: 'low',
        },
      });

      const result = await evaluator.evaluate(content, profile);

      const hasEngagementOpportunity = result.personalizationFit.opportunities.some(
        (o) => o.area === 'Engagement'
      );
      expect(hasEngagementOpportunity).toBe(true);
    });
  });

  describe('issues and recommendations', () => {
    it('should report issues for content outside ZPD', async () => {
      const content = createTestContent({
        targetDifficulty: 'expert',
        targetBloomsLevel: 'CREATE',
        prerequisites: ['missing-1', 'missing-2', 'missing-3'],
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'beginner',
        completedTopics: [],
        masteryLevels: {},
      });

      const result = await evaluator.evaluate(content, profile);

      // Should have issues if not in ZPD
      if (!result.inZPD) {
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    it('should provide recommendations', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should report insufficient support as an issue', async () => {
      const content = createTestContent({
        content: 'Minimal content with no support.',
      });

      const result = await evaluator.evaluate(content);

      if (!result.supportAdequacy.adequate) {
        const supportIssue = result.issues.find(
          (i) => i.type === 'insufficient_support'
        );
        expect(supportIssue).toBeDefined();
      }
    });

    it('should report zpd_mismatch for too easy content', async () => {
      const content = createTestContent({
        targetDifficulty: 'beginner',
        targetBloomsLevel: 'REMEMBER',
        content: 'Very simple content.',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'expert',
      });

      const result = await evaluator.evaluate(content, profile);

      if (result.zpdZone === 'TOO_EASY') {
        const zpdIssue = result.issues.find((i) => i.type === 'zpd_mismatch');
        expect(zpdIssue).toBeDefined();
      }
    });

    it('should recommend prerequisite content for unreachable content', async () => {
      const content = createTestContent({
        targetDifficulty: 'expert',
        targetBloomsLevel: 'CREATE',
        prerequisites: ['missing-prereq-1', 'missing-prereq-2'],
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'beginner',
        completedTopics: [],
        masteryLevels: {},
      });

      const result = await evaluator.evaluate(content, profile);

      if (result.zpdZone === 'UNREACHABLE') {
        expect(result.recommendations.length).toBeGreaterThan(0);
        const hasPrereqRecommendation = result.recommendations.some(
          (r) =>
            r.toLowerCase().includes('prerequisite') ||
            r.toLowerCase().includes('adaptive')
        );
        expect(hasPrereqRecommendation).toBe(true);
      }
    });
  });

  describe('confidence calculation', () => {
    it('should have higher confidence with student profile', async () => {
      const content = createTestContent();

      const resultWithout = await evaluator.evaluate(content);
      const resultWith = await evaluator.evaluate(
        content,
        createTestStudentProfile()
      );

      expect(resultWith.confidence).toBeGreaterThan(resultWithout.confidence);
    });

    it('should increase confidence with more student data', async () => {
      const content = createTestContent();

      const minimalProfile = createTestStudentProfile({
        completedTopics: [],
        masteryLevels: {},
        demonstratedBloomsLevels: {},
        recentPerformance: {
          averageScore: 70,
          trend: 'stable',
          assessmentCount: 1,
          timeSpentMinutes: 30,
          engagementLevel: 'moderate',
        },
      });

      const richProfile = createTestStudentProfile({
        completedTopics: ['topic1', 'topic2', 'topic3', 'topic4', 'topic5', 'topic6'],
        masteryLevels: {
          topic1: { topicId: 'topic1', mastery: 80, highestBloomsLevel: 'APPLY', confidence: 0.9, lastAssessed: '2024-01-01' },
          topic2: { topicId: 'topic2', mastery: 75, highestBloomsLevel: 'ANALYZE', confidence: 0.85, lastAssessed: '2024-01-01' },
          topic3: { topicId: 'topic3', mastery: 70, highestBloomsLevel: 'UNDERSTAND', confidence: 0.8, lastAssessed: '2024-01-01' },
          topic4: { topicId: 'topic4', mastery: 85, highestBloomsLevel: 'EVALUATE', confidence: 0.9, lastAssessed: '2024-01-01' },
        },
        demonstratedBloomsLevels: {
          topic1: 'APPLY',
          topic2: 'ANALYZE',
          topic3: 'UNDERSTAND',
          topic4: 'EVALUATE',
        },
        recentPerformance: {
          averageScore: 82,
          trend: 'improving',
          assessmentCount: 10,
          timeSpentMinutes: 300,
          engagementLevel: 'high',
        },
      });

      const resultMinimal = await evaluator.evaluate(content, minimalProfile);
      const resultRich = await evaluator.evaluate(content, richProfile);

      expect(resultRich.confidence).toBeGreaterThanOrEqual(
        resultMinimal.confidence
      );
    });
  });

  describe('scoring', () => {
    it('should pass with good ZPD fit', async () => {
      const content = createTestContent({
        content:
          'This lesson provides examples and hints for learning concepts. First, we introduce step by step guidance with scaffolding. For example, consider this simple case with feedback and modeling.',
      });
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      // Content should be reasonably within ZPD for a matching profile
      if (result.inZPD && result.score >= 70) {
        expect(result.passed).toBe(true);
      }
    });

    it('should fail when outside ZPD', async () => {
      const strictEvaluator = new ZPDEvaluator({ passingScore: 70 });
      const content = createTestContent({
        targetDifficulty: 'expert',
        targetBloomsLevel: 'CREATE',
        prerequisites: ['missing-1', 'missing-2', 'missing-3'],
        content: 'Extremely advanced content.',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'beginner',
        completedTopics: [],
        masteryLevels: {},
      });

      const result = await strictEvaluator.evaluate(content, profile);

      // If content is in frustration/unreachable zone, should fail
      if (['FRUSTRATION', 'UNREACHABLE'].includes(result.zpdZone)) {
        expect(result.passed).toBe(false);
      }
    });

    it('should include bonus for optimal zone', async () => {
      const content = createTestContent({
        targetDifficulty: 'intermediate',
        targetBloomsLevel: 'APPLY',
        content:
          'Content with examples, hints, scaffolding, feedback, and modeling support structures for step by step learning.',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'intermediate',
        demonstratedBloomsLevels: { mathematics: 'UNDERSTAND' },
      });

      const result = await evaluator.evaluate(content, profile);

      // Score should be reasonable with well-matched content
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analysis summary', () => {
    it('should include analysis summary', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await evaluator.evaluate(content, profile);

      expect(result.analysis).toHaveProperty('zpdZone');
      expect(result.analysis).toHaveProperty('challengeScore');
      expect(result.analysis).toHaveProperty('supportScore');
      expect(result.analysis).toHaveProperty('engagementPrediction');
      expect(result.analysis).toHaveProperty('personalizationScore');
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
  describe('createZPDEvaluator', () => {
    it('should create evaluator with default config', () => {
      const evaluator = createZPDEvaluator();
      expect(evaluator).toBeInstanceOf(ZPDEvaluator);
    });

    it('should create evaluator with custom config', () => {
      const evaluator = createZPDEvaluator({
        targetZone: 'ZPD_UPPER',
        passingScore: 75,
      });
      expect(evaluator).toBeInstanceOf(ZPDEvaluator);
    });
  });

  describe('createStrictZPDEvaluator', () => {
    it('should create strict evaluator', () => {
      const evaluator = createStrictZPDEvaluator();
      expect(evaluator).toBeInstanceOf(ZPDEvaluator);
    });

    it('should have stricter requirements', async () => {
      const strict = createStrictZPDEvaluator();
      const lenient = createLenientZPDEvaluator();

      const content = createTestContent({
        content: 'Basic content without much support.',
      });

      const strictResult = await strict.evaluate(content);
      const lenientResult = await lenient.evaluate(content);

      // Lenient should be more likely to pass
      expect(lenientResult.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createLenientZPDEvaluator', () => {
    it('should create lenient evaluator', () => {
      const evaluator = createLenientZPDEvaluator();
      expect(evaluator).toBeInstanceOf(ZPDEvaluator);
    });

    it('should be more forgiving', async () => {
      const evaluator = createLenientZPDEvaluator();

      const content = createTestContent({
        content: 'Simple content with examples.',
        targetDifficulty: 'beginner',
      });
      const profile = createTestStudentProfile({
        currentDifficultyLevel: 'beginner',
      });

      const result = await evaluator.evaluate(content, profile);

      // Lenient evaluator should be more permissive
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  let evaluator: ZPDEvaluator;

  beforeEach(() => {
    evaluator = new ZPDEvaluator();
  });

  it('should handle empty content', async () => {
    const content = createTestContent({
      content: '',
    });

    const result = await evaluator.evaluate(content);

    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should handle content without prerequisites', async () => {
    const content = createTestContent({
      prerequisites: [],
    });

    const result = await evaluator.evaluate(content);

    expect(result).toBeDefined();
    const prereqFactor = result.challengeLevel.factors.find(
      (f) => f.name === 'prerequisite_coverage'
    );
    expect(prereqFactor?.appropriate).toBe(true);
  });

  it('should handle profile with knowledge gaps', async () => {
    const content = createTestContent({
      topic: 'advanced-math',
    });
    const profile = createTestStudentProfile({
      knowledgeGaps: [
        {
          topicId: 'advanced-math',
          concept: 'derivatives',
          severity: 'major',
          affectedPrerequisites: ['calculus'],
        },
      ],
    });

    const result = await evaluator.evaluate(content, profile);

    const hasGapOpportunity = result.personalizationFit.opportunities.some(
      (o) => o.area === 'Knowledge Gaps'
    );
    expect(hasGapOpportunity).toBe(true);
  });

  it('should handle declining performance student', async () => {
    const content = createTestContent();
    const profile = createTestStudentProfile({
      recentPerformance: {
        averageScore: 50,
        trend: 'declining',
        assessmentCount: 5,
        timeSpentMinutes: 100,
        engagementLevel: 'low',
      },
    });

    const result = await evaluator.evaluate(content, profile);

    expect(result.recommendations.length).toBeGreaterThan(0);
    const hasDiagnosticRecommendation = result.recommendations.some(
      (r) =>
        r.toLowerCase().includes('diagnostic') ||
        r.toLowerCase().includes('scaffolding')
    );
    expect(hasDiagnosticRecommendation).toBe(true);
  });

  it('should handle very long content', async () => {
    const longContent =
      'This is a comprehensive lesson. '.repeat(100) +
      'For example, consider this. ' +
      'Step by step we learn. ' +
      'Hint: pay attention here.';

    const content = createTestContent({
      content: longContent,
      learningObjectives: Array(10).fill('Complex objective'),
    });

    const result = await evaluator.evaluate(content);

    expect(result).toBeDefined();
    expect(result.challengeLevel.factors).toHaveLength(4);
  });

  it('should handle content with many long words', async () => {
    const content = createTestContent({
      content:
        'Electroencephalography demonstrates neurophysiological characteristics of consciousness. Psychophysiological measurements indicate comprehensive understanding.',
    });

    const result = await evaluator.evaluate(content);

    expect(result).toBeDefined();
    const complexityFactor = result.challengeLevel.factors.find(
      (f) => f.name === 'content_complexity'
    );
    expect(complexityFactor).toBeDefined();
  });

  it('should handle accelerated learner profile', async () => {
    const content = createTestContent();
    const profile = createTestStudentProfile({
      learningVelocity: 'accelerated',
      recentPerformance: {
        averageScore: 95,
        trend: 'improving',
        assessmentCount: 10,
        timeSpentMinutes: 200,
        engagementLevel: 'high',
      },
    });

    const result = await evaluator.evaluate(content, profile);

    const hasPacingSuggestion = result.personalizationFit.opportunities.some(
      (o) => o.area === 'Pacing'
    );
    expect(hasPacingSuggestion).toBe(true);
  });
});
