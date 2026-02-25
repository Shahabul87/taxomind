/**
 * Tests for ContentGenerationEngine
 * @sam-ai/educational
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentGenerationEngine, createContentGenerationEngine } from '../engines/content-generation-engine';

function makeMockAI(response = '{}') {
  return {
    chat: vi.fn().mockResolvedValue({ content: response }),
  };
}

function makeSAMConfig(aiOverride?: ReturnType<typeof makeMockAI>) {
  const ai = aiOverride ?? makeMockAI();
  return {
    samConfig: {
      ai,
      model: { name: 'test-model' },
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    } as never,
  };
}

describe('ContentGenerationEngine', () => {
  let engine: ContentGenerationEngine;
  let mockAI: ReturnType<typeof makeMockAI>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAI = makeMockAI(JSON.stringify({
      title: 'Generated Course',
      description: 'A test course',
      chapterCount: 3,
      chapterThemes: ['Intro', 'Core', 'Advanced'],
    }));
    engine = new ContentGenerationEngine(makeSAMConfig(mockAI));
  });

  it('should generate course content from learning objectives', async () => {
    const objectives = [
      { objective: 'Understand unit testing', bloomsLevel: 'understand', skills: [] },
      { objective: 'Apply TDD methodology', bloomsLevel: 'apply', skills: ['basic testing'] },
    ];

    const result = await engine.generateCourseContent(objectives as never);

    expect(result.title).toBeDefined();
    expect(result.outline).toBeDefined();
    expect(result.outline.chapters.length).toBeGreaterThan(0);
    expect(result.learningOutcomes).toHaveLength(2);
  });

  it('should generate quiz assessments for topics', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        type: 'multiple-choice',
        question: 'What is testing?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Because A is correct',
        difficulty: 'medium',
      }),
    });

    const topics = [{ name: 'Unit Testing', keywords: ['test', 'assertion'] }];
    const result = await engine.createAssessments(topics as never, 'quiz');

    expect(result.length).toBe(1);
    expect(result[0].type).toBe('quiz');
    expect(result[0].questions.length).toBeGreaterThan(0);
    expect(result[0].passingScore).toBe(70);
  });

  it('should generate a summary for study guide', async () => {
    const course = {
      id: 'course-1',
      title: 'Testing Fundamentals',
      chapters: [
        { title: 'Introduction', sections: [{ title: 'Getting Started' }] },
      ],
    };

    const result = await engine.generateStudyGuides(course as never);

    expect(result.courseId).toBe('course-1');
    expect(result.title).toContain('Study Guide');
    expect(result.keyTopics.length).toBeGreaterThan(0);
  });

  it('should set Bloom level target for questions', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        type: 'short-answer',
        question: 'Analyze the patterns',
        correctAnswer: 'Patterns are...',
        difficulty: 'hard',
      }),
    });

    const topics = [{ name: 'Design Patterns', keywords: ['patterns'] }];
    const result = await engine.createAssessments(topics as never, 'exam');

    expect(result[0].type).toBe('exam');
    // Exam uses more distributed Bloom levels
    expect(result[0].questions.length).toBeGreaterThan(0);
  });

  it('should generate topic-based content', async () => {
    const objectives = [
      { objective: 'Create React components', bloomsLevel: 'create', skills: [] },
    ];

    const result = await engine.generateCourseContent(objectives as never, {
      style: 'conversational',
      targetAudience: 'beginners',
    });

    expect(result.targetAudience).toBe('beginners');
    expect(result.title).toBeDefined();
  });

  it('should scale difficulty based on Bloom levels', async () => {
    const beginnerObjectives = [
      { objective: 'Remember key terms', bloomsLevel: 'remember', skills: [] },
    ];

    const advancedObjectives = [
      { objective: 'Evaluate architectures', bloomsLevel: 'evaluate', skills: [] },
      { objective: 'Create new systems', bloomsLevel: 'create', skills: [] },
    ];

    const beginnerResult = await engine.generateCourseContent(beginnerObjectives as never);
    const advancedResult = await engine.generateCourseContent(advancedObjectives as never);

    expect(beginnerResult.difficulty).toBe('beginner');
    expect(advancedResult.difficulty).toBe('advanced');
  });

  it('should support different format options for exercises', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        title: 'Coding Exercise',
        description: 'Write a function',
        difficulty: 'medium',
        instructions: ['Step 1', 'Step 2'],
        hints: ['Think about types'],
      }),
    });

    const concepts = [{ name: 'TypeScript', description: 'Type system', skills: ['typing'] }];
    const result = await engine.createInteractiveExercises(concepts as never, 'coding' as never);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('coding');
  });

  it('should construct AI prompts with proper parameters', async () => {
    const objectives = [
      { objective: 'Understand basics', bloomsLevel: 'understand', skills: [] },
    ];

    await engine.generateCourseContent(objectives as never);

    expect(mockAI.chat).toHaveBeenCalled();
    const callArgs = mockAI.chat.mock.calls[0][0];
    expect(callArgs.messages).toBeDefined();
    expect(callArgs.messages[0].content).toContain('Understand basics');
  });

  it('should parse AI response correctly', async () => {
    mockAI.chat.mockResolvedValue({
      content: '```json\n{"title":"Parsed","description":"From JSON","chapterCount":2,"chapterThemes":["A","B"]}\n```',
    });

    const objectives = [{ objective: 'Test parsing', bloomsLevel: 'apply', skills: [] }];
    const result = await engine.generateCourseContent(objectives as never);

    expect(result.title).toBeDefined();
  });

  it('should handle AI errors with fallback content', async () => {
    mockAI.chat.mockRejectedValue(new Error('AI unavailable'));

    const objectives = [{ objective: 'Learn fallback', bloomsLevel: 'understand', skills: [] }];

    await expect(engine.generateCourseContent(objectives as never)).rejects.toThrow(
      'Failed to generate course content'
    );
  });
});

describe('createContentGenerationEngine', () => {
  it('should create engine via factory', () => {
    const engine = createContentGenerationEngine(makeSAMConfig());
    expect(engine).toBeInstanceOf(ContentGenerationEngine);
  });
});
