/**
 * Tests for blueprint/validation.ts
 *
 * Verifies BlueprintRequestSchema Zod validation.
 */

import { BlueprintRequestSchema } from '../blueprint/validation';

describe('BlueprintRequestSchema', () => {
  const validData = {
    courseTitle: 'React Mastery',
    courseShortOverview: 'A comprehensive course on React development',
    category: 'Web Development',
    targetAudience: 'Frontend developers',
    difficulty: 'INTERMEDIATE',
    courseGoals: ['Build React apps', 'Understand hooks'],
    bloomsFocus: ['UNDERSTAND', 'APPLY'],
    chapterCount: 5,
    sectionsPerChapter: 3,
  };

  it('should validate correct input', () => {
    const result = BlueprintRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject short course title', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, courseTitle: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should reject long course title', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, courseTitle: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should reject short course overview', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, courseShortOverview: 'Short' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid difficulty', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, difficulty: 'EXPERT' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid difficulty levels', () => {
    for (const diff of ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']) {
      const result = BlueprintRequestSchema.safeParse({ ...validData, difficulty: diff });
      expect(result.success).toBe(true);
    }
  });

  it('should reject empty courseGoals array', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, courseGoals: [] });
    expect(result.success).toBe(false);
  });

  it('should reject chapterCount less than 1', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, chapterCount: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject chapterCount greater than 20', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, chapterCount: 21 });
    expect(result.success).toBe(false);
  });

  it('should reject sectionsPerChapter greater than 10', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, sectionsPerChapter: 11 });
    expect(result.success).toBe(false);
  });

  it('should accept optional subcategory', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, subcategory: 'React' });
    expect(result.success).toBe(true);
  });

  it('should accept optional duration', () => {
    const result = BlueprintRequestSchema.safeParse({ ...validData, duration: '4 weeks' });
    expect(result.success).toBe(true);
  });
});
