/**
 * Tests for blueprint/response-parser.ts
 *
 * Verifies parseBlueprintResponse with valid JSON, manual extraction fallback,
 * Bloom's distribution enforcement, and error handling.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Use real Zod schema — do NOT mock ../blueprint/schema.
// The scoring module is used for fallback chapters when padding is needed.
jest.mock('../blueprint/scoring', () => ({
  buildFallbackChapter: jest.fn((pos: number, data: { courseGoals: string[]; sectionsPerChapter: number }) => ({
    position: pos,
    title: `Chapter ${pos}`,
    goal: data.courseGoals[0] || '',
    bloomsLevel: 'UNDERSTAND',
    sections: Array.from({ length: data.sectionsPerChapter }, (_, j) => ({
      position: j + 1,
      title: `Section ${pos}.${j + 1}`,
      keyTopics: [],
    })),
  })),
}));

import { parseBlueprintResponse } from '../blueprint/response-parser';
import type { BlueprintRequestData } from '../blueprint/types';

const sampleData: BlueprintRequestData = {
  courseTitle: 'React Mastery',
  courseShortOverview: 'Complete React course',
  category: 'Web Development',
  targetAudience: 'Developers',
  difficulty: 'INTERMEDIATE',
  courseGoals: ['Build React apps', 'Understand hooks'],
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  chapterCount: 3,
  sectionsPerChapter: 2,
};

describe('parseBlueprintResponse', () => {
  it('should parse valid JSON response with chapters', () => {
    const response = JSON.stringify({
      chapters: [
        {
          position: 1,
          title: 'Intro to React',
          goal: 'Understand React basics',
          bloomsLevel: 'UNDERSTAND',
          sections: [
            { title: 'JSX Fundamentals', keyTopics: ['JSX syntax', 'Components'] },
            { title: 'Props and Data Flow', keyTopics: ['Data flow'] },
          ],
        },
        {
          position: 2,
          title: 'State Management',
          goal: 'Apply hooks',
          bloomsLevel: 'APPLY',
          sections: [
            { title: 'useState Hook Basics', keyTopics: ['State'] },
            { title: 'useEffect Side Effects', keyTopics: ['Effects'] },
          ],
        },
        {
          position: 3,
          title: 'Advanced Patterns',
          goal: 'Analyze patterns',
          bloomsLevel: 'ANALYZE',
          sections: [
            { title: 'Higher-Order Components', keyTopics: ['Pattern'] },
            { title: 'Render Props Pattern', keyTopics: ['Flexibility'] },
          ],
        },
      ],
      northStarProject: 'Build a full-stack React app',
      confidence: 85,
      riskAreas: ['State complexity'],
    });

    const result = parseBlueprintResponse(response, sampleData);
    expect(result).not.toBeNull();
    expect(result?.chapters).toHaveLength(3);
    expect(result?.northStarProject).toBe('Build a full-stack React app');
    expect(result?.confidence).toBe(85);
  });

  it('should enforce Bloom distribution when provided', () => {
    const response = JSON.stringify({
      chapters: [
        { position: 1, title: 'Chapter One', goal: 'Goal one', bloomsLevel: 'CREATE', sections: [{ title: 'Section Alpha', keyTopics: ['t1'] }, { title: 'Section Beta', keyTopics: ['t2'] }] },
        { position: 2, title: 'Chapter Two', goal: 'Goal two', bloomsLevel: 'CREATE', sections: [{ title: 'Section Gamma', keyTopics: ['t3'] }, { title: 'Section Delta', keyTopics: ['t4'] }] },
        { position: 3, title: 'Chapter Three', goal: 'Goal three', bloomsLevel: 'CREATE', sections: [{ title: 'Section Epsilon', keyTopics: ['t5'] }, { title: 'Section Zeta', keyTopics: ['t6'] }] },
      ],
      confidence: 80,
      riskAreas: [],
    });

    const distribution = ['REMEMBER', 'APPLY', 'EVALUATE'];
    const result = parseBlueprintResponse(response, sampleData, distribution);
    expect(result).not.toBeNull();
    expect(result?.chapters[0].bloomsLevel).toBe('REMEMBER');
    expect(result?.chapters[1].bloomsLevel).toBe('APPLY');
    expect(result?.chapters[2].bloomsLevel).toBe('EVALUATE');
  });

  it('should strip markdown code fences', () => {
    const inner = JSON.stringify({
      chapters: [
        { position: 1, title: 'Test Chapter One', goal: 'Test goal', bloomsLevel: 'UNDERSTAND', sections: [{ title: 'Test Section Alpha', keyTopics: ['t'] }, { title: 'Test Section Beta', keyTopics: ['t'] }] },
      ],
      confidence: 70,
      riskAreas: [],
    });
    const response = '```json\n' + inner + '\n```';
    const result = parseBlueprintResponse(response, { ...sampleData, chapterCount: 1 });
    expect(result).not.toBeNull();
    expect(result?.chapters).toHaveLength(1);
  });

  it('should strip <think> blocks from reasoning models', () => {
    const inner = JSON.stringify({
      chapters: [
        { position: 1, title: 'Planning Chapter', goal: 'Planned goal', bloomsLevel: 'UNDERSTAND', sections: [{ title: 'Planning Section', keyTopics: ['t'] }, { title: 'Planning Section Two', keyTopics: ['t'] }] },
      ],
      confidence: 70,
      riskAreas: [],
    });
    const response = '<think>Let me plan...</think>' + inner;
    const result = parseBlueprintResponse(response, { ...sampleData, chapterCount: 1 });
    expect(result).not.toBeNull();
  });

  it('should return null for completely invalid input', () => {
    const result = parseBlueprintResponse('not json at all', sampleData);
    expect(result).toBeNull();
  });

  it('should pad chapters if fewer than expected', () => {
    const response = JSON.stringify({
      chapters: [
        { position: 1, title: 'Only Chapter', goal: 'Single goal', bloomsLevel: 'UNDERSTAND', sections: [{ title: 'Only Section One', keyTopics: ['t'] }, { title: 'Only Section Two', keyTopics: ['t'] }] },
      ],
      confidence: 70,
      riskAreas: [],
    });

    const result = parseBlueprintResponse(response, sampleData);
    expect(result).not.toBeNull();
    expect(result?.chapters).toHaveLength(3);
  });
});
