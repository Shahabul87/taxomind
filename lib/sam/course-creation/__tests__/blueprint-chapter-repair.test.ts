/**
 * Tests for blueprint/chapter-repair.ts
 *
 * Verifies repairIncompleteChapters, extractCourseKeyword, and alignGoalVerbs.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  repairIncompleteChapters,
  extractCourseKeyword,
  alignGoalVerbs,
} from '../blueprint/chapter-repair';
import type { BlueprintResponse, BlueprintRequestData } from '../blueprint/types';

const sampleData: BlueprintRequestData = {
  courseTitle: 'Introduction to Machine Learning',
  courseShortOverview: 'Complete ML course',
  category: 'Data Science',
  targetAudience: 'Developers',
  difficulty: 'INTERMEDIATE',
  courseGoals: ['Build ML models'],
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  chapterCount: 3,
  sectionsPerChapter: 2,
};

describe('extractCourseKeyword', () => {
  it('should extract meaningful words from title', () => {
    const keyword = extractCourseKeyword('Introduction to Machine Learning');
    expect(keyword).toBe('Machine Learning');
  });

  it('should remove filler words', () => {
    const keyword = extractCourseKeyword('The Complete Guide to React');
    expect(keyword).not.toContain('The');
    expect(keyword).not.toContain('Complete');
    expect(keyword).not.toContain('Guide');
    expect(keyword).toContain('React');
  });

  it('should return original title when no meaningful words', () => {
    const keyword = extractCourseKeyword('An');
    expect(keyword).toBe('An');
  });

  it('should limit to 3 words', () => {
    const keyword = extractCourseKeyword('Advanced Distributed Systems Architecture Design');
    const words = keyword.split(' ');
    expect(words.length).toBeLessThanOrEqual(3);
  });
});

describe('alignGoalVerbs', () => {
  it('should return original goal if it starts with correct verb', () => {
    const result = alignGoalVerbs('Analyze the data patterns', 'ANALYZE');
    expect(result).toBe('Analyze the data patterns');
  });

  it('should replace wrong verb with correct one', () => {
    const result = alignGoalVerbs('Create a simple list of terms', 'REMEMBER');
    expect(result).toContain('Identify and recall');
  });

  it('should not modify goal without leading verbs', () => {
    const result = alignGoalVerbs('Learn about databases', 'APPLY');
    // "Learn" is not in any verb map, so no change
    expect(result).toBe('Learn about databases');
  });

  it('should return unchanged goal for unknown Bloom level', () => {
    const result = alignGoalVerbs('Some goal text', 'UNKNOWN_LEVEL');
    expect(result).toBe('Some goal text');
  });
});

describe('repairIncompleteChapters', () => {
  it('should repair generic chapter titles', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'Chapter 1', goal: 'Learn basics', bloomsLevel: 'UNDERSTAND', sections: [] },
        { position: 2, title: 'Good Title', goal: 'Apply skills', bloomsLevel: 'APPLY', sections: [] },
        { position: 3, title: 'Chapter 3', goal: 'Evaluate outcomes', bloomsLevel: 'EVALUATE', sections: [] },
      ],
      confidence: 80,
      riskAreas: [],
    };

    const result = repairIncompleteChapters(blueprint, sampleData);
    expect(result.chapters[0].title).not.toBe('Chapter 1');
    expect(result.chapters[1].title).toBe('Good Title');
    expect(result.chapters[2].title).not.toBe('Chapter 3');
  });

  it('should repair empty goals', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'Intro', goal: '', bloomsLevel: 'UNDERSTAND', sections: [] },
      ],
      confidence: 80,
      riskAreas: [],
    };

    const result = repairIncompleteChapters(blueprint, sampleData);
    expect(result.chapters[0].goal).not.toBe('');
    expect(result.chapters[0].goal).toContain('understand');
  });

  it('should repair missing deliverables', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'Intro', goal: 'A goal', bloomsLevel: 'APPLY', sections: [] },
      ],
      confidence: 80,
      riskAreas: [],
    };

    const result = repairIncompleteChapters(blueprint, sampleData);
    expect(result.chapters[0].deliverable).toBeDefined();
    expect(result.chapters[0].deliverable!.length).toBeGreaterThan(0);
  });

  it('should reduce confidence when repairs are made', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'Chapter 1', goal: '', bloomsLevel: 'UNDERSTAND', sections: [] },
      ],
      confidence: 80,
      riskAreas: [],
    };

    const result = repairIncompleteChapters(blueprint, sampleData);
    expect(result.confidence).toBeLessThan(80);
  });

  it('should add risk area about repairs', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'Chapter 1', goal: '', bloomsLevel: 'UNDERSTAND', sections: [] },
      ],
      confidence: 80,
      riskAreas: [],
    };

    const result = repairIncompleteChapters(blueprint, sampleData);
    expect(result.riskAreas.length).toBeGreaterThan(0);
    expect(result.riskAreas.some((r) => r.includes('repaired'))).toBe(true);
  });

  it('should return original blueprint when no repairs needed', () => {
    const blueprint: BlueprintResponse = {
      chapters: [
        { position: 1, title: 'Proper Title', goal: 'Understand basics', bloomsLevel: 'UNDERSTAND', deliverable: 'A document', sections: [] },
      ],
      confidence: 80,
      riskAreas: [],
    };

    const result = repairIncompleteChapters(blueprint, sampleData);
    expect(result).toBe(blueprint);
  });
});
