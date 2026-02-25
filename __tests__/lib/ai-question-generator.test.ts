/**
 * Tests for AdvancedQuestionGenerator
 * Source: lib/ai-question-generator.ts
 */

jest.mock('@prisma/client', () => ({
  BloomsLevel: {
    REMEMBER: 'REMEMBER',
    UNDERSTAND: 'UNDERSTAND',
    APPLY: 'APPLY',
    ANALYZE: 'ANALYZE',
    EVALUATE: 'EVALUATE',
    CREATE: 'CREATE',
  },
  QuestionType: {
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
    TRUE_FALSE: 'TRUE_FALSE',
    SHORT_ANSWER: 'SHORT_ANSWER',
    ESSAY: 'ESSAY',
    FILL_IN_BLANK: 'FILL_IN_BLANK',
  },
}));

import AdvancedQuestionGenerator, {
  ENHANCED_BLOOMS_FRAMEWORK,
  QUESTION_PATTERNS,
  type EnhancedQuestion,
  type QuestionGenerationRequest,
} from '@/lib/ai-question-generator';

describe('AdvancedQuestionGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let generator: InstanceType<typeof AdvancedQuestionGenerator>;

  beforeEach(() => {
    generator = AdvancedQuestionGenerator.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = AdvancedQuestionGenerator.getInstance();
    const instance2 = AdvancedQuestionGenerator.getInstance();

    expect(instance1).toBe(instance2);
  });

  describe('ENHANCED_BLOOMS_FRAMEWORK', () => {
    it('should define all six Blooms levels', () => {
      const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

      levels.forEach((level) => {
        expect(ENHANCED_BLOOMS_FRAMEWORK[level as keyof typeof ENHANCED_BLOOMS_FRAMEWORK]).toBeDefined();
      });
    });

    it('should have increasing cognitive load through levels', () => {
      expect(ENHANCED_BLOOMS_FRAMEWORK.REMEMBER.cognitiveLoad).toBe(1);
      expect(ENHANCED_BLOOMS_FRAMEWORK.UNDERSTAND.cognitiveLoad).toBe(2);
      expect(ENHANCED_BLOOMS_FRAMEWORK.APPLY.cognitiveLoad).toBe(3);
      expect(ENHANCED_BLOOMS_FRAMEWORK.ANALYZE.cognitiveLoad).toBe(4);
      expect(ENHANCED_BLOOMS_FRAMEWORK.EVALUATE.cognitiveLoad).toBe(5);
      expect(ENHANCED_BLOOMS_FRAMEWORK.CREATE.cognitiveLoad).toBe(5);
    });

    it('should have verbs and question starters for each level', () => {
      Object.values(ENHANCED_BLOOMS_FRAMEWORK).forEach((level) => {
        expect(level.verbs.length).toBeGreaterThan(0);
        expect(level.questionStarters.length).toBeGreaterThan(0);
        expect(level.description).toBeTruthy();
        expect(level.assessmentFocus).toBeTruthy();
      });
    });

    it('should define prerequisite chains correctly', () => {
      expect(ENHANCED_BLOOMS_FRAMEWORK.REMEMBER.prerequisites).toEqual([]);
      expect(ENHANCED_BLOOMS_FRAMEWORK.UNDERSTAND.prerequisites).toEqual(['REMEMBER']);
      expect(ENHANCED_BLOOMS_FRAMEWORK.APPLY.prerequisites).toContain('UNDERSTAND');
      expect(ENHANCED_BLOOMS_FRAMEWORK.CREATE.prerequisites).toContain('EVALUATE');
    });
  });

  describe('QUESTION_PATTERNS', () => {
    it('should have patterns for all Blooms levels', () => {
      const coveredLevels = new Set(QUESTION_PATTERNS.map((p) => p.bloomsLevel));

      expect(coveredLevels.has('REMEMBER')).toBe(true);
      expect(coveredLevels.has('UNDERSTAND')).toBe(true);
      expect(coveredLevels.has('APPLY')).toBe(true);
      expect(coveredLevels.has('ANALYZE')).toBe(true);
      expect(coveredLevels.has('EVALUATE')).toBe(true);
      expect(coveredLevels.has('CREATE')).toBe(true);
    });

    it('should have valid pattern structure', () => {
      QUESTION_PATTERNS.forEach((pattern) => {
        expect(pattern.template).toBeTruthy();
        expect(pattern.cognitiveMarkers.length).toBeGreaterThan(0);
        expect(pattern.assessmentCriteria.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateAdvancedPrompt', () => {
    it('should generate a prompt with all required sections', () => {
      const request: QuestionGenerationRequest = {
        sectionTitle: 'Variables and Data Types',
        chapterTitle: 'JavaScript Basics',
        courseTitle: 'Full Stack Development',
        learningObjectives: ['Define variables', 'Understand data types'],
        bloomsDistribution: { REMEMBER: 2, UNDERSTAND: 3 } as never,
        questionCount: 5,
        targetAudience: 'beginner',
        cognitiveLoadLimit: 3,
        prerequisiteKnowledge: ['Basic computer skills'],
        assessmentPurpose: 'formative',
      };

      const prompt = generator.generateAdvancedPrompt(request);

      expect(prompt).toContain('Variables and Data Types');
      expect(prompt).toContain('JavaScript Basics');
      expect(prompt).toContain('Full Stack Development');
      expect(prompt).toContain('formative');
      expect(prompt).toContain('beginner');
      expect(prompt).toContain('Define variables');
      expect(prompt).toContain('Generate exactly 5 questions');
      expect(prompt).toContain('REMEMBER');
      expect(prompt).toContain('UNDERSTAND');
      expect(prompt).toContain('Basic computer skills');
    });

    it('should include user prompt when provided', () => {
      const request: QuestionGenerationRequest = {
        sectionTitle: 'Test Section',
        learningObjectives: ['Test'],
        bloomsDistribution: { APPLY: 2 } as never,
        questionCount: 2,
        targetAudience: 'intermediate',
        cognitiveLoadLimit: 4,
        prerequisiteKnowledge: [],
        assessmentPurpose: 'summative',
        userPrompt: 'Focus on practical coding examples',
      };

      const prompt = generator.generateAdvancedPrompt(request);

      expect(prompt).toContain('Focus on practical coding examples');
      expect(prompt).toContain('ADDITIONAL INSTRUCTIONS');
    });

    it('should handle empty bloom distribution', () => {
      const request: QuestionGenerationRequest = {
        sectionTitle: 'Test',
        learningObjectives: [],
        bloomsDistribution: {},
        questionCount: 0,
        targetAudience: 'advanced',
        cognitiveLoadLimit: 5,
        prerequisiteKnowledge: [],
        assessmentPurpose: 'diagnostic',
      };

      const prompt = generator.generateAdvancedPrompt(request);

      expect(prompt).toContain('No specific Bloom');
      expect(prompt).toContain('diagnostic');
    });
  });

  describe('validateQuestionAlignment', () => {
    it('should validate a well-aligned REMEMBER question', () => {
      const question: EnhancedQuestion = {
        id: 'q1',
        bloomsLevel: 'REMEMBER' as never,
        questionType: 'MULTIPLE_CHOICE' as never,
        question: 'Define the term "variable" and identify its key characteristics. List the types.',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'A variable stores data.',
        cognitiveLoad: 1,
        difficulty: 'easy',
        points: 5,
        assessmentCriteria: ['Accurate recall'],
        prerequisites: [],
        learningObjective: 'Define variables',
        timeEstimate: 2,
        tags: ['variables'],
      };

      const validation = generator.validateQuestionAlignment(question);

      expect(validation.cognitiveLoadAppropriate).toBe(true);
      expect(validation.clarityScore).toBeGreaterThan(0);
    });

    it('should flag cognitive load mismatch', () => {
      const question: EnhancedQuestion = {
        id: 'q2',
        bloomsLevel: 'REMEMBER' as never,
        questionType: 'MULTIPLE_CHOICE' as never,
        question: 'What is a function?',
        correctAnswer: 'A reusable block of code',
        explanation: 'Functions encapsulate logic.',
        cognitiveLoad: 5, // Too high for REMEMBER
        difficulty: 'hard',
        points: 10,
        assessmentCriteria: [],
        prerequisites: [],
        learningObjective: 'Recall function definition',
        timeEstimate: 1,
        tags: [],
      };

      const validation = generator.validateQuestionAlignment(question);

      expect(validation.cognitiveLoadAppropriate).toBe(false);
      expect(validation.pedagogicalWarnings.length).toBeGreaterThan(0);
    });

    it('should assess clarity score', () => {
      // Very short question (low clarity)
      const shortQuestion: EnhancedQuestion = {
        id: 'q3',
        bloomsLevel: 'UNDERSTAND' as never,
        questionType: 'SHORT_ANSWER' as never,
        question: 'Explain why?',
        correctAnswer: 'Because...',
        explanation: 'Explanation.',
        cognitiveLoad: 2,
        difficulty: 'medium',
        points: 5,
        assessmentCriteria: [],
        prerequisites: [],
        learningObjective: 'Explain concepts',
        timeEstimate: 3,
        tags: [],
      };

      const validation = generator.validateQuestionAlignment(shortQuestion);

      // Short question gets penalized
      expect(validation.clarityScore).toBeLessThan(1.0);
    });

    it('should suggest Blooms verbs when alignment is low', () => {
      const question: EnhancedQuestion = {
        id: 'q4',
        bloomsLevel: 'ANALYZE' as never,
        questionType: 'ESSAY' as never,
        question: 'Write about the topic of databases in modern applications.',
        correctAnswer: 'Essay answer',
        explanation: 'Analysis expected.',
        cognitiveLoad: 4,
        difficulty: 'hard',
        points: 20,
        assessmentCriteria: [],
        prerequisites: [],
        learningObjective: 'Analyze database usage',
        timeEstimate: 15,
        tags: [],
      };

      const validation = generator.validateQuestionAlignment(question);

      // "Write about" does not include ANALYZE-level verbs like "analyze", "differentiate", etc.
      if (validation.bloomsAlignment < 0.3) {
        expect(validation.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateOptimalBloomsDistribution', () => {
    it('should generate distribution for formative beginner assessment', () => {
      const distribution = generator.generateOptimalBloomsDistribution('formative', 'beginner', 10);

      expect(distribution.REMEMBER).toBe(4);  // 0.4 * 10
      expect(distribution.UNDERSTAND).toBe(4); // 0.4 * 10
      expect(distribution.APPLY).toBe(2);      // 0.2 * 10
      expect(distribution.ANALYZE).toBe(0);
      expect(distribution.EVALUATE).toBe(0);
      expect(distribution.CREATE).toBe(0);
    });

    it('should generate distribution for summative advanced assessment', () => {
      const distribution = generator.generateOptimalBloomsDistribution('summative', 'advanced', 20);

      expect(distribution.REMEMBER).toBe(2);      // 0.1 * 20
      expect(distribution.UNDERSTAND).toBe(4);     // 0.2 * 20
      expect(distribution.APPLY).toBe(5);          // 0.25 * 20
      expect(distribution.ANALYZE).toBe(5);        // 0.25 * 20
      expect(distribution.EVALUATE).toBe(3);       // 0.15 * 20
      expect(distribution.CREATE).toBe(1);         // 0.05 * 20
    });

    it('should generate distribution for diagnostic intermediate', () => {
      const distribution = generator.generateOptimalBloomsDistribution('diagnostic', 'intermediate', 10);

      expect(distribution.REMEMBER).toBe(3);
      expect(distribution.UNDERSTAND).toBe(3);
      expect(distribution.APPLY).toBe(2);
      expect(distribution.ANALYZE).toBe(2);
    });

    it('should handle zero question count', () => {
      const distribution = generator.generateOptimalBloomsDistribution('formative', 'beginner', 0);

      Object.values(distribution).forEach((count) => {
        expect(count).toBe(0);
      });
    });
  });
});
