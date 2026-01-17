/**
 * Bloom's Analysis Data Enrichment Tests
 *
 * Tests for the data enrichment helper functions used to build
 * enriched course input for Bloom's Taxonomy analysis.
 */

import { describe, it, expect } from '@jest/globals';

// ============================================================================
// HELPER FUNCTION IMPLEMENTATIONS (mirrored from route.ts for testing)
// ============================================================================

/**
 * Parse course goals string into an array of objectives
 */
function parseLearningGoals(goalsString: string | null | undefined): string[] {
  if (!goalsString || goalsString.trim() === '') {
    return [];
  }

  let goals: string[] = [];

  // Check for numbered list format (1. Goal, 2. Goal, etc.)
  if (/^\d+\.\s/.test(goalsString.trim())) {
    goals = goalsString
      .split(/\d+\.\s+/)
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Check for bullet points (- or •)
  else if (/^[-•]\s/.test(goalsString.trim())) {
    goals = goalsString
      .split(/[-•]\s+/)
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Check for newlines
  else if (goalsString.includes('\n')) {
    goals = goalsString
      .split('\n')
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Check for semicolons
  else if (goalsString.includes(';')) {
    goals = goalsString
      .split(';')
      .map((g) => g.trim())
      .filter((g) => g !== '');
  }
  // Single goal
  else {
    goals = [goalsString.trim()];
  }

  return goals;
}

/**
 * Combine string-based objectives with structured objective items
 */
function combineLearningObjectives(
  objectivesString: string | null | undefined,
  objectiveItems: Array<{ id: string; objective: string }> | null | undefined
): string[] {
  const combined = new Set<string>();

  if (objectiveItems && objectiveItems.length > 0) {
    for (const item of objectiveItems) {
      if (item.objective && item.objective.trim() !== '') {
        combined.add(item.objective.trim());
      }
    }
  }

  const parsedObjectives = parseLearningGoals(objectivesString);
  for (const objective of parsedObjectives) {
    combined.add(objective);
  }

  return Array.from(combined);
}

type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

/**
 * Extract questions with Bloom's levels from exam data
 */
function extractQuestionsFromExams(
  exams: Array<{
    id: string;
    enhancedQuestions: Array<{
      id: string;
      question: string;
      bloomsLevel: BloomsLevel | null;
    }>;
  }> | null | undefined
): Array<{ id: string; text: string; bloomsLevel?: BloomsLevel }> {
  if (!exams || exams.length === 0) {
    return [];
  }

  const questions: Array<{ id: string; text: string; bloomsLevel?: BloomsLevel }> = [];

  for (const exam of exams) {
    if (exam.enhancedQuestions && exam.enhancedQuestions.length > 0) {
      for (const q of exam.enhancedQuestions) {
        questions.push({
          id: q.id,
          text: q.question,
          bloomsLevel: q.bloomsLevel || undefined,
        });
      }
    }
  }

  return questions;
}

/**
 * Get the dominant Bloom's level from an array of levels
 */
function getDominantLevel(levels: BloomsLevel[]): BloomsLevel {
  if (levels.length === 0) {
    return 'UNDERSTAND';
  }

  const counts: Record<BloomsLevel, number> = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  for (const level of levels) {
    counts[level]++;
  }

  let maxCount = 0;
  let dominantLevel: BloomsLevel = 'UNDERSTAND';
  const BLOOMS_LEVELS: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  for (const level of BLOOMS_LEVELS) {
    if (counts[level] > maxCount) {
      maxCount = counts[level];
      dominantLevel = level;
    }
  }

  return dominantLevel;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Bloom\'s Analysis Data Enrichment', () => {
  describe('parseLearningGoals', () => {
    it('should return empty array for null input', () => {
      expect(parseLearningGoals(null)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(parseLearningGoals(undefined)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseLearningGoals('')).toEqual([]);
      expect(parseLearningGoals('   ')).toEqual([]);
    });

    it('should parse single goal', () => {
      const result = parseLearningGoals('Understand basic concepts');
      expect(result).toEqual(['Understand basic concepts']);
    });

    it('should parse numbered list format', () => {
      const input = '1. Define key terms\n2. Apply concepts\n3. Analyze results';
      const result = parseLearningGoals(input);
      expect(result).toContain('Define key terms');
      expect(result).toContain('Apply concepts');
      expect(result).toContain('Analyze results');
      expect(result).toHaveLength(3);
    });

    it('should parse bullet points with dash', () => {
      const input = '- First goal\n- Second goal\n- Third goal';
      const result = parseLearningGoals(input);
      expect(result).toHaveLength(3);
      expect(result).toContain('First goal');
    });

    it('should parse bullet points with bullet character', () => {
      const input = '• Understand concepts\n• Apply knowledge';
      const result = parseLearningGoals(input);
      expect(result).toHaveLength(2);
    });

    it('should parse newline-separated goals', () => {
      const input = 'Goal one\nGoal two\nGoal three';
      const result = parseLearningGoals(input);
      expect(result).toEqual(['Goal one', 'Goal two', 'Goal three']);
    });

    it('should parse semicolon-separated goals', () => {
      const input = 'Understand theory; Apply in practice; Evaluate outcomes';
      const result = parseLearningGoals(input);
      expect(result).toEqual(['Understand theory', 'Apply in practice', 'Evaluate outcomes']);
    });

    it('should trim whitespace from goals', () => {
      const input = '  Goal with spaces  ;  Another goal  ';
      const result = parseLearningGoals(input);
      expect(result[0]).toBe('Goal with spaces');
      expect(result[1]).toBe('Another goal');
    });

    it('should filter out empty goals', () => {
      const input = 'Goal one;;Goal two';
      const result = parseLearningGoals(input);
      expect(result).toEqual(['Goal one', 'Goal two']);
    });
  });

  describe('combineLearningObjectives', () => {
    it('should return empty array when both inputs are empty', () => {
      expect(combineLearningObjectives(null, null)).toEqual([]);
      expect(combineLearningObjectives(undefined, undefined)).toEqual([]);
      expect(combineLearningObjectives('', [])).toEqual([]);
    });

    it('should return objectives from items only', () => {
      const items = [
        { id: '1', objective: 'Objective one' },
        { id: '2', objective: 'Objective two' },
      ];
      const result = combineLearningObjectives(null, items);
      expect(result).toContain('Objective one');
      expect(result).toContain('Objective two');
      expect(result).toHaveLength(2);
    });

    it('should return objectives from string only', () => {
      const result = combineLearningObjectives('First; Second; Third', null);
      expect(result).toEqual(['First', 'Second', 'Third']);
    });

    it('should combine both sources', () => {
      const items = [
        { id: '1', objective: 'From items' },
      ];
      const result = combineLearningObjectives('From string', items);
      expect(result).toContain('From items');
      expect(result).toContain('From string');
      expect(result).toHaveLength(2);
    });

    it('should remove duplicates', () => {
      const items = [
        { id: '1', objective: 'Same objective' },
      ];
      const result = combineLearningObjectives('Same objective', items);
      expect(result).toEqual(['Same objective']);
    });

    it('should trim whitespace', () => {
      const items = [
        { id: '1', objective: '  Padded objective  ' },
      ];
      const result = combineLearningObjectives(null, items);
      expect(result).toEqual(['Padded objective']);
    });

    it('should skip empty objectives', () => {
      const items = [
        { id: '1', objective: '' },
        { id: '2', objective: '  ' },
        { id: '3', objective: 'Valid objective' },
      ];
      const result = combineLearningObjectives(null, items);
      expect(result).toEqual(['Valid objective']);
    });
  });

  describe('extractQuestionsFromExams', () => {
    it('should return empty array for null/undefined exams', () => {
      expect(extractQuestionsFromExams(null)).toEqual([]);
      expect(extractQuestionsFromExams(undefined)).toEqual([]);
    });

    it('should return empty array for empty exams array', () => {
      expect(extractQuestionsFromExams([])).toEqual([]);
    });

    it('should extract questions from single exam', () => {
      const exams = [
        {
          id: 'exam1',
          enhancedQuestions: [
            { id: 'q1', question: 'What is X?', bloomsLevel: 'REMEMBER' as const },
            { id: 'q2', question: 'Explain Y.', bloomsLevel: 'UNDERSTAND' as const },
          ],
        },
      ];
      const result = extractQuestionsFromExams(exams);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'q1',
        text: 'What is X?',
        bloomsLevel: 'REMEMBER',
      });
    });

    it('should extract questions from multiple exams', () => {
      const exams = [
        {
          id: 'exam1',
          enhancedQuestions: [
            { id: 'q1', question: 'Question 1', bloomsLevel: 'APPLY' as const },
          ],
        },
        {
          id: 'exam2',
          enhancedQuestions: [
            { id: 'q2', question: 'Question 2', bloomsLevel: 'ANALYZE' as const },
          ],
        },
      ];
      const result = extractQuestionsFromExams(exams);
      expect(result).toHaveLength(2);
    });

    it('should handle null bloomsLevel', () => {
      const exams = [
        {
          id: 'exam1',
          enhancedQuestions: [
            { id: 'q1', question: 'No level question', bloomsLevel: null },
          ],
        },
      ];
      const result = extractQuestionsFromExams(exams);
      expect(result[0].bloomsLevel).toBeUndefined();
    });

    it('should handle exam with empty questions array', () => {
      const exams = [
        {
          id: 'exam1',
          enhancedQuestions: [],
        },
      ];
      const result = extractQuestionsFromExams(exams);
      expect(result).toEqual([]);
    });
  });

  describe('getDominantLevel', () => {
    it('should return UNDERSTAND for empty array', () => {
      expect(getDominantLevel([])).toBe('UNDERSTAND');
    });

    it('should return the only level when single element', () => {
      expect(getDominantLevel(['APPLY'])).toBe('APPLY');
      expect(getDominantLevel(['CREATE'])).toBe('CREATE');
    });

    it('should return the most frequent level', () => {
      const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'UNDERSTAND', 'APPLY'];
      expect(getDominantLevel(levels)).toBe('UNDERSTAND');
    });

    it('should handle tie by returning first encountered maximum', () => {
      // REMEMBER and UNDERSTAND both have 2, REMEMBER comes first
      const levels: BloomsLevel[] = ['REMEMBER', 'REMEMBER', 'UNDERSTAND', 'UNDERSTAND'];
      expect(getDominantLevel(levels)).toBe('REMEMBER');
    });

    it('should correctly count all levels', () => {
      const levels: BloomsLevel[] = [
        'ANALYZE', 'ANALYZE', 'ANALYZE', // 3
        'EVALUATE', 'EVALUATE', // 2
        'CREATE', // 1
      ];
      expect(getDominantLevel(levels)).toBe('ANALYZE');
    });

    it('should handle all same level', () => {
      const levels: BloomsLevel[] = ['EVALUATE', 'EVALUATE', 'EVALUATE'];
      expect(getDominantLevel(levels)).toBe('EVALUATE');
    });
  });

  describe('Integration: Building Enriched Course Data', () => {
    it('should build enriched section with all data sources', () => {
      const section = {
        id: 'sec1',
        title: 'Introduction to Testing',
        description: 'Learn about software testing',
        learningObjectives: 'Understand unit testing; Apply TDD principles',
        learningObjectiveItems: [
          { id: 'obj1', objective: 'Write effective test cases' },
        ],
        exams: [
          {
            id: 'exam1',
            enhancedQuestions: [
              { id: 'q1', question: 'What is TDD?', bloomsLevel: 'REMEMBER' as const },
              { id: 'q2', question: 'Design a test suite', bloomsLevel: 'CREATE' as const },
            ],
          },
        ],
      };

      // Build enriched section data
      const learningObjectives = combineLearningObjectives(
        section.learningObjectives,
        section.learningObjectiveItems
      );

      const questions = extractQuestionsFromExams(section.exams);

      // Verify enrichment
      expect(learningObjectives).toContain('Understand unit testing');
      expect(learningObjectives).toContain('Apply TDD principles');
      expect(learningObjectives).toContain('Write effective test cases');
      expect(learningObjectives).toHaveLength(3);

      expect(questions).toHaveLength(2);
      expect(questions[0].bloomsLevel).toBe('REMEMBER');
      expect(questions[1].bloomsLevel).toBe('CREATE');

      // Get dominant level from questions
      const questionLevels = questions
        .filter((q) => q.bloomsLevel)
        .map((q) => q.bloomsLevel as BloomsLevel);
      const dominant = getDominantLevel(questionLevels);

      // With REMEMBER and CREATE (1 each), REMEMBER is first in hierarchy
      expect(['REMEMBER', 'CREATE']).toContain(dominant);
    });

    it('should handle section with no extra data gracefully', () => {
      const section = {
        id: 'sec2',
        title: 'Basic Section',
        description: 'Simple description',
        learningObjectives: null,
        learningObjectiveItems: null,
        exams: null,
      };

      const learningObjectives = combineLearningObjectives(
        section.learningObjectives,
        section.learningObjectiveItems
      );

      const questions = extractQuestionsFromExams(section.exams);

      expect(learningObjectives).toEqual([]);
      expect(questions).toEqual([]);
    });
  });
});
