/**
 * Tests for blueprint/scoring.ts
 *
 * Verifies buildRuleBasedBlueprintScore, buildFallbackChapter,
 * and buildHeuristicBlueprint.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../blueprint-critic', () => ({}));

import {
  buildRuleBasedBlueprintScore,
  buildFallbackChapter,
  buildHeuristicBlueprint,
} from '../blueprint/scoring';
import type { BlueprintResponse, BlueprintRequestData } from '../blueprint/types';
import type { CourseContext } from '../types';

const sampleData: BlueprintRequestData = {
  courseTitle: 'React Mastery',
  courseShortOverview: 'Complete React course',
  category: 'Web Development',
  targetAudience: 'Developers',
  difficulty: 'INTERMEDIATE',
  courseGoals: ['Build React apps', 'Understand hooks', 'Master state management'],
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  chapterCount: 3,
  sectionsPerChapter: 2,
};

const sampleCourseContext: CourseContext = {
  courseTitle: 'React Mastery',
  courseDescription: 'Complete React course',
  courseCategory: 'Web Development',
  targetAudience: 'Developers',
  difficulty: 'INTERMEDIATE',
  courseLearningObjectives: ['Build React apps', 'Understand hooks'],
  totalChapters: 3,
  sectionsPerChapter: 2,
};

describe('buildFallbackChapter', () => {
  it('should create a fallback chapter with correct position', () => {
    const chapter = buildFallbackChapter(1, sampleData);
    expect(chapter.position).toBe(1);
    expect(chapter.title).toBe('Chapter 1');
  });

  it('should use course goal as chapter goal', () => {
    const chapter = buildFallbackChapter(1, sampleData);
    expect(chapter.goal).toBe(sampleData.courseGoals[0]);
  });

  it('should create correct number of sections', () => {
    const chapter = buildFallbackChapter(1, sampleData);
    expect(chapter.sections).toHaveLength(sampleData.sectionsPerChapter);
  });

  it('should use assigned Bloom level when provided', () => {
    const chapter = buildFallbackChapter(1, sampleData, 'EVALUATE');
    expect(chapter.bloomsLevel).toBe('EVALUATE');
  });

  it('should fall back to bloomsFocus when no assigned level', () => {
    const chapter = buildFallbackChapter(1, sampleData);
    expect(sampleData.bloomsFocus).toContain(chapter.bloomsLevel);
  });
});

describe('buildHeuristicBlueprint', () => {
  it('should create a full blueprint with correct chapter count', () => {
    const blueprint = buildHeuristicBlueprint(sampleData);
    expect(blueprint.chapters).toHaveLength(sampleData.chapterCount);
  });

  it('should have low confidence (30)', () => {
    const blueprint = buildHeuristicBlueprint(sampleData);
    expect(blueprint.confidence).toBe(30);
  });

  it('should include risk area about heuristic generation', () => {
    const blueprint = buildHeuristicBlueprint(sampleData);
    expect(blueprint.riskAreas).toHaveLength(1);
    expect(blueprint.riskAreas[0]).toContain('heuristics');
  });

  it('should have progressive Bloom levels', () => {
    const data: BlueprintRequestData = {
      ...sampleData,
      chapterCount: 4,
      bloomsFocus: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    };
    const blueprint = buildHeuristicBlueprint(data);
    // First chapter should be at or below last chapter level
    const firstIdx = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'].indexOf(blueprint.chapters[0].bloomsLevel);
    const lastIdx = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'].indexOf(blueprint.chapters[3].bloomsLevel);
    expect(lastIdx).toBeGreaterThanOrEqual(firstIdx);
  });
});

describe('buildRuleBasedBlueprintScore', () => {
  it('should return a score object with all dimensions', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'React Basics and Components', goal: 'Build React apps', bloomsLevel: 'UNDERSTAND', sections: [{ position: 1, title: 'JSX', keyTopics: ['syntax'] }, { position: 2, title: 'Props', keyTopics: ['data flow'] }] },
        { position: 2, title: 'React Hooks Deep Dive', goal: 'Understand hooks', bloomsLevel: 'APPLY', sections: [{ position: 1, title: 'useState', keyTopics: ['state'] }, { position: 2, title: 'useEffect', keyTopics: ['effects'] }] },
        { position: 3, title: 'State Management Mastery', goal: 'Master state management', bloomsLevel: 'ANALYZE', sections: [{ position: 1, title: 'Redux', keyTopics: ['store'] }, { position: 2, title: 'Context', keyTopics: ['provider'] }] },
      ],
      northStarProject: 'Build a full-stack React dashboard',
      confidence: 85,
      riskAreas: [],
    };

    const score = buildRuleBasedBlueprintScore(blueprint, sampleCourseContext, sampleData.courseGoals);
    expect(score).toHaveProperty('objectiveCoverage');
    expect(score).toHaveProperty('topicSequencing');
    expect(score).toHaveProperty('bloomsProgression');
    expect(score).toHaveProperty('scopeCoherence');
    expect(score).toHaveProperty('northStarAlignment');
    expect(score).toHaveProperty('specificity');
    expect(score).toHaveProperty('verdict');
    expect(['approve', 'revise', 'reject']).toContain(score.verdict);
  });

  it('should penalize missing north star project', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'React', goal: 'Learn React', bloomsLevel: 'UNDERSTAND', sections: [{ position: 1, title: 'S1', keyTopics: ['t'] }, { position: 2, title: 'S2', keyTopics: ['t'] }] },
      ],
      confidence: 70,
      riskAreas: [],
    };

    const score = buildRuleBasedBlueprintScore(blueprint, sampleCourseContext, sampleData.courseGoals);
    expect(score.northStarAlignment).toBeLessThan(80);
  });
});
