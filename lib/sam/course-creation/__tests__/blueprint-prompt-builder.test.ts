/**
 * Tests for blueprint/prompt-builder.ts
 *
 * Verifies buildNorthStarPrompt, parseNorthStarResponse, and buildBlueprintPrompts.
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
  buildNorthStarPrompt,
  parseNorthStarResponse,
  buildBlueprintPrompts,
} from '../blueprint/prompt-builder';
import type { CourseContext } from '../types';
import type { BlueprintRequestData } from '../blueprint/types';

const sampleCtx: CourseContext = {
  courseTitle: 'React Mastery',
  courseDescription: 'Complete React course',
  courseCategory: 'Web Development',
  targetAudience: 'Frontend developers',
  difficulty: 'INTERMEDIATE',
  courseLearningObjectives: ['Build React apps', 'Understand hooks'],
  totalChapters: 5,
  sectionsPerChapter: 3,
};

const sampleData: BlueprintRequestData = {
  courseTitle: 'React Mastery',
  courseShortOverview: 'Complete React course',
  category: 'Web Development',
  targetAudience: 'Frontend developers',
  difficulty: 'INTERMEDIATE',
  courseGoals: ['Build React apps', 'Understand hooks'],
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  chapterCount: 5,
  sectionsPerChapter: 3,
};

describe('buildNorthStarPrompt', () => {
  it('should return systemPrompt and userPrompt', () => {
    const result = buildNorthStarPrompt(sampleCtx, sampleData, null);
    expect(result).toHaveProperty('systemPrompt');
    expect(result).toHaveProperty('userPrompt');
    expect(result.systemPrompt).toContain('course architect');
    expect(result.userPrompt).toContain('React Mastery');
  });

  it('should include learning objectives in userPrompt', () => {
    const result = buildNorthStarPrompt(sampleCtx, sampleData, null);
    expect(result.userPrompt).toContain('Build React apps');
    expect(result.userPrompt).toContain('Understand hooks');
  });

  it('should include expertise block from composed prompt', () => {
    const composed = { expertiseBlock: 'Expert in web dev' } as any;
    const result = buildNorthStarPrompt(sampleCtx, sampleData, composed);
    expect(result.systemPrompt).toContain('Expert in web dev');
  });
});

describe('parseNorthStarResponse', () => {
  it('should parse valid JSON response', () => {
    const response = JSON.stringify({
      northStarProject: 'Build a portfolio-worthy React dashboard',
      milestones: [
        { chapter: 1, deliverable: 'Setup project', bloomsLevel: 'UNDERSTAND' },
        { chapter: 2, deliverable: 'Build components', bloomsLevel: 'APPLY' },
      ],
    });
    const result = parseNorthStarResponse(response);
    expect(result).not.toBeNull();
    expect(result?.northStarProject).toContain('dashboard');
    expect(result?.milestones).toHaveLength(2);
  });

  it('should extract JSON from surrounding text', () => {
    const response = 'Here is the plan: {"northStarProject": "Build an app", "milestones": []}';
    const result = parseNorthStarResponse(response);
    expect(result).not.toBeNull();
    expect(result?.northStarProject).toBe('Build an app');
  });

  it('should return null for missing northStarProject', () => {
    const response = JSON.stringify({ milestones: [] });
    const result = parseNorthStarResponse(response);
    expect(result).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    const result = parseNorthStarResponse('not json');
    expect(result).toBeNull();
  });

  it('should filter invalid milestones', () => {
    const response = JSON.stringify({
      northStarProject: 'Project',
      milestones: [
        { chapter: 1, deliverable: 'Valid' },
        { invalid: true },
        { chapter: 'not_a_number', deliverable: 'Invalid' },
      ],
    });
    const result = parseNorthStarResponse(response);
    expect(result?.milestones).toHaveLength(1);
  });
});

describe('buildBlueprintPrompts', () => {
  const bloomsBlock = '- Chapter 1: **UNDERSTAND**\n- Chapter 2: **APPLY**';

  it('should return systemPrompt and userPrompt', () => {
    const result = buildBlueprintPrompts(sampleCtx, sampleData, null, bloomsBlock, false);
    expect(result).toHaveProperty('systemPrompt');
    expect(result).toHaveProperty('userPrompt');
  });

  it('should include course title in user prompt', () => {
    const result = buildBlueprintPrompts(sampleCtx, sampleData, null, bloomsBlock, false);
    expect(result.userPrompt).toContain('React Mastery');
  });

  it('should include Bloom assignments in user prompt', () => {
    const result = buildBlueprintPrompts(sampleCtx, sampleData, null, bloomsBlock, false);
    expect(result.userPrompt).toContain('Chapter 1: **UNDERSTAND**');
  });

  it('should include critic feedback when provided', () => {
    const result = buildBlueprintPrompts(
      sampleCtx, sampleData, null, bloomsBlock, false,
      'Improve chapter 3 specificity',
    );
    expect(result.userPrompt).toContain('Improve chapter 3 specificity');
  });

  it('should include North Star context when provided', () => {
    const northStar = {
      northStarProject: 'Build a dashboard',
      milestones: [{ chapter: 1, deliverable: 'Setup', bloomsLevel: 'UNDERSTAND' }],
    };
    const result = buildBlueprintPrompts(sampleCtx, sampleData, null, bloomsBlock, false, undefined, northStar);
    expect(result.userPrompt).toContain('Build a dashboard');
    expect(result.userPrompt).toContain('Pre-defined');
  });
});
