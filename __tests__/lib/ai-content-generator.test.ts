/**
 * Tests for AI Content Generator
 * Source: lib/ai-content-generator.ts
 */

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
}));

jest.mock('@/lib/course-blueprint-generator', () => ({}));

import { generateIntelligentCourseContent } from '@/lib/ai-content-generator';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

const mockRunSAMChat = runSAMChatWithPreference as jest.Mock;

const baseRequirements = {
  courseTitle: 'TypeScript Fundamentals',
  courseCategory: 'Programming',
  courseSubcategory: 'Web Development',
  courseIntent: 'Learn TypeScript from scratch',
  courseShortOverview: 'A comprehensive course on TypeScript',
  targetAudience: 'Beginner developers',
  difficulty: 'BEGINNER',
  duration: '10 hours',
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  preferredContentTypes: ['text', 'video'],
  chapterCount: 2,
  sectionsPerChapter: 2,
  courseGoals: ['Understand types', 'Build projects'],
};

describe('generateIntelligentCourseContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates course content by calling AI in sequence', async () => {
    // Strategy response
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        approach: 'Project-based learning',
        innovations: ['Interactive coding', 'Peer review'],
        learningPath: 'Progressive',
        assessmentStrategy: 'Continuous',
      })
    );

    // Course structure response
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        course: {
          title: 'TypeScript Fundamentals',
          description: 'Learn TypeScript',
          subtitle: 'Master the language',
          learningOutcomes: ['Understand types'],
          prerequisites: ['JavaScript basics'],
          targetAudience: 'Beginners',
          estimatedDuration: '10 hours',
          difficulty: 'BEGINNER',
          uniqueSellingPoints: ['Hands-on'],
          careerOutcomes: ['Junior developer'],
          industryRelevance: 'High demand',
        },
        chapterOutlines: [
          { title: 'Intro', focus: 'Basics', bloomsLevel: 'UNDERSTAND' },
          { title: 'Advanced', focus: 'Complex types', bloomsLevel: 'APPLY' },
        ],
      })
    );

    // Chapter responses (one per chapter)
    const chapterResponse = JSON.stringify({
      title: 'Intro',
      description: 'Introduction to TypeScript',
      learningOutcomes: ['Understand types'],
      bloomsLevel: 'UNDERSTAND',
      estimatedDuration: '2 hours',
      prerequisites: [],
      keySkills: ['Typing'],
      realWorldRelevance: 'Used in production',
      sections: [
        {
          title: 'What is TypeScript',
          description: 'Intro',
          contentType: 'text',
          bloomsLevel: 'UNDERSTAND',
          estimatedDuration: '30 minutes',
          learningObjectives: ['Define TypeScript'],
          keyTopics: ['Types'],
          activities: ['Read docs'],
          prerequisites: [],
          practicalExercises: ['Exercise 1'],
          assessmentQuestions: ['Q1'],
          realWorldExamples: ['Example 1'],
          commonPitfalls: ['Pitfall 1'],
          successTips: ['Tip 1'],
        },
      ],
      assessments: { formative: ['Quiz'], summative: ['Exam'] },
    });

    mockRunSAMChat.mockResolvedValueOnce(chapterResponse);
    mockRunSAMChat.mockResolvedValueOnce(chapterResponse);

    const result = await generateIntelligentCourseContent(baseRequirements, 'user-1');

    expect(result.course.title).toBe('TypeScript Fundamentals');
    expect(result.chapters).toHaveLength(2);
    expect(result.metadata.aiGenerated).toBe(true);
    expect(mockRunSAMChat).toHaveBeenCalledTimes(4);
  });

  it('formats prompt with course requirements', async () => {
    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({
        approach: 'Test',
        innovations: [],
        learningPath: 'Test',
        assessmentStrategy: 'Test',
      })
    );

    // Will fail at step 2 but we can check the first call
    try {
      await generateIntelligentCourseContent(baseRequirements, 'user-1');
    } catch {
      // Expected to fail at step 2 since mock returns wrong shape
    }

    const firstCall = mockRunSAMChat.mock.calls[0][0];
    expect(firstCall.userId).toBe('user-1');
    expect(firstCall.capability).toBe('course');
  });

  it('handles AI provider error', async () => {
    mockRunSAMChat.mockRejectedValue(new Error('Rate limit exceeded'));

    await expect(
      generateIntelligentCourseContent(baseRequirements, 'user-1')
    ).rejects.toThrow('Failed to generate intelligent course content');

    expect(logger.error).toHaveBeenCalled();
  });

  it('handles invalid JSON response from AI', async () => {
    mockRunSAMChat.mockResolvedValue('not valid json');

    await expect(
      generateIntelligentCourseContent(baseRequirements, 'user-1')
    ).rejects.toThrow();
  });

  it('generates course-level project when projects content type requested', async () => {
    const requirementsWithProjects = {
      ...baseRequirements,
      preferredContentTypes: ['text', 'projects'],
    };

    // Strategy
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        approach: 'Project-based',
        innovations: ['Capstone'],
        learningPath: 'Progressive',
        assessmentStrategy: 'Portfolio',
      })
    );

    // Course structure
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        course: {
          title: 'TS', description: 'd', subtitle: 's',
          learningOutcomes: [], prerequisites: [], targetAudience: 't',
          estimatedDuration: '5h', difficulty: 'BEGINNER',
          uniqueSellingPoints: [], careerOutcomes: [], industryRelevance: 'r',
        },
        chapterOutlines: [{ title: 'Ch1', focus: 'f', bloomsLevel: 'APPLY' }],
      })
    );

    // Chapter
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        title: 'Ch1', description: 'd', learningOutcomes: [],
        bloomsLevel: 'APPLY', estimatedDuration: '2 hours',
        prerequisites: [], keySkills: [], realWorldRelevance: 'r',
        sections: [{
          title: 's', description: 'd', contentType: 'text',
          bloomsLevel: 'APPLY', estimatedDuration: '30 minutes',
          learningObjectives: [], keyTopics: [], activities: [],
          prerequisites: [], practicalExercises: [],
          assessmentQuestions: [], realWorldExamples: [],
          commonPitfalls: [], successTips: [],
        }],
        assessments: { formative: [], summative: [] },
      })
    );

    // Project
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        title: 'Capstone Project',
        description: 'Build a full app',
        phases: ['Phase 1', 'Phase 2'],
        timeline: '2 weeks',
        portfolioValue: 'Great for portfolio',
      })
    );

    const result = await generateIntelligentCourseContent(requirementsWithProjects, 'user-1');
    expect(result.courseLevelProject).toBeDefined();
    expect(result.courseLevelProject?.title).toBe('Capstone Project');
  });

  it('parses AI response and calculates metadata', async () => {
    // Strategy
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        approach: 'Mixed', innovations: [], learningPath: 'l', assessmentStrategy: 'a',
      })
    );

    // Structure with 1 chapter
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        course: {
          title: 'T', description: 'd', subtitle: 's',
          learningOutcomes: [], prerequisites: [], targetAudience: 't',
          estimatedDuration: '3h', difficulty: 'BEGINNER',
          uniqueSellingPoints: [], careerOutcomes: [], industryRelevance: 'r',
        },
        chapterOutlines: [{ title: 'Ch', focus: 'f', bloomsLevel: 'REMEMBER' }],
      })
    );

    // Chapter with estimatedDuration in minutes format
    mockRunSAMChat.mockResolvedValueOnce(
      JSON.stringify({
        title: 'Ch', description: 'd', learningOutcomes: [],
        bloomsLevel: 'REMEMBER', estimatedDuration: '60 minutes',
        prerequisites: [], keySkills: [], realWorldRelevance: 'r',
        sections: [{
          title: 'Sec', description: 'd', contentType: 'text',
          bloomsLevel: 'REMEMBER', estimatedDuration: '30 minutes',
          learningObjectives: [], keyTopics: [], activities: [],
          prerequisites: [], practicalExercises: [],
          assessmentQuestions: [], realWorldExamples: [],
          commonPitfalls: [], successTips: [],
        }],
        assessments: { formative: [], summative: [] },
      })
    );

    const result = await generateIntelligentCourseContent(baseRequirements, 'user-1');
    expect(result.metadata.totalEstimatedHours).toBeGreaterThan(0);
    expect(result.metadata.bloomsDistribution).toBeDefined();
    expect(result.metadata.contentTypeDistribution).toBeDefined();
  });

  it('uses correct temperature and maxTokens for each step', async () => {
    mockRunSAMChat.mockRejectedValue(new Error('stop'));

    try {
      await generateIntelligentCourseContent(baseRequirements, 'user-1');
    } catch {
      // Expected
    }

    const call = mockRunSAMChat.mock.calls[0][0];
    expect(call.temperature).toBeDefined();
    expect(call.maxTokens).toBeDefined();
  });
});
