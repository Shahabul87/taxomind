import { BloomsAnalysisEngine } from '@/sam/engines/educational/sam-blooms-engine';
import { testDb, setupTestDatabase, teardownTestDatabase } from '../../utils/test-db';
import { TestDataFactory } from '../../utils/test-factory';
import { mockAnthropicClient, setupMockProviders, resetMockProviders } from '../../utils/mock-providers';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('BloomsAnalysisEngine', () => {
  let engine: BloomsAnalysisEngine;
  let testData: any;

  beforeAll(async () => {
    setupMockProviders();
    testData = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    engine = new BloomsAnalysisEngine();
    resetMockProviders();
  });

  describe('Course Analysis', () => {
    it('should analyze a complete course structure', async () => {
      const courseId = testData.courses[0].id;
      
      // Mock Anthropic responses for different content types
      mockAnthropicClient.messages.create.mockImplementation(async ({ messages }) => {
        const content = messages[messages.length - 1].content;
        
        if (content.includes('Introduction')) {
          return {
            content: [{ type: 'text', text: 'REMEMBER - This section focuses on basic recall of information.' }]
          };
        } else if (content.includes('Advanced')) {
          return {
            content: [{ type: 'text', text: 'ANALYZE - This section requires analytical thinking.' }]
          };
        }
        
        return {
          content: [{ type: 'text', text: 'UNDERSTAND - This section focuses on comprehension.' }]
        };
      });

      const result = await engine.analyzeCourse(courseId, 'detailed', true, true);

      expect(result).toBeDefined();
      expect(result.courseLevel).toBeDefined();
      expect(result.courseLevel.distribution).toBeDefined();
      expect(result.chapterAnalysis).toBeInstanceOf(Array);
      expect(result.learningPathway).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.studentImpact).toBeDefined();

      // Verify distribution totals make sense
      const distribution = result.courseLevel.distribution;
      const total = Object.values(distribution).reduce((sum: number, value: unknown) => sum + Number(value), 0);
      expect(total).toBeCloseTo(100, 1); // Should sum to approximately 100%

      // Verify cognitive depth is calculated
      expect(result.courseLevel.cognitiveDepth).toBeGreaterThan(0);
      expect(result.courseLevel.cognitiveDepth).toBeLessThanOrEqual(100);
    });

    it('should handle course not found error', async () => {
      await expect(
        engine.analyzeCourse('nonexistent-course-id')
      ).rejects.toThrow('Course not found');
    });

    it('should use cached analysis when content unchanged', async () => {
      const courseId = testData.courses[0].id;

      // First analysis
      await engine.analyzeCourse(courseId, 'basic', false, true);
      
      // Reset mock to verify cache usage
      mockAnthropicClient.messages.create.mockClear();

      // Second analysis should use cache
      const result = await engine.analyzeCourse(courseId, 'basic', false, false);
      
      expect(result).toBeDefined();
      expect(mockAnthropicClient.messages.create).not.toHaveBeenCalled();
    });

    it('should force reanalysis when requested', async () => {
      const courseId = testData.courses[0].id;

      // First analysis
      await engine.analyzeCourse(courseId, 'basic', false, true);
      
      // Reset mock
      mockAnthropicClient.messages.create.mockClear();

      // Force reanalysis
      await engine.analyzeCourse(courseId, 'basic', false, true);
      
      expect(mockAnthropicClient.messages.create).toHaveBeenCalled();
    });
  });

  describe('Bloom&apos;s Level Analysis', () => {
    it('should correctly identify REMEMBER level content', async () => {
      const section = {
        id: 'test-section',
        title: 'Define Basic Concepts',
        description: 'List and name the fundamental principles',
        type: 'General',
        videoUrl: null,
        duration: null,
        exams: [],
        Question: []
      };

      (mockAnthropicClient.messages.create as jest.Mock).mockResolvedValue({
        content: [{ type: 'text', text: 'REMEMBER - This content focuses on basic recall and recognition.' }]
      });

      const result = await (engine as any).analyzeContent(section);
      expect(result).toBe('REMEMBER');
    });

    it('should correctly identify ANALYZE level content', async () => {
      const section = {
        id: 'test-section',
        title: 'Compare and Contrast Methods',
        description: 'Analyze different approaches and their effectiveness',
        type: 'General',
        videoUrl: 'https://example.com/video.mp4',
        duration: 45,
        exams: [],
        Question: []
      };

      (mockAnthropicClient.messages.create as jest.Mock).mockResolvedValue({
        content: [{ type: 'text', text: 'ANALYZE - This section requires students to compare and analyze different concepts.' }]
      });

      const result = await (engine as any).analyzeContent(section);
      expect(result).toBe('ANALYZE');
    });

    it('should fall back to UNDERSTAND for unclear content', async () => {
      (mockAnthropicClient.messages.create as jest.Mock).mockResolvedValue({
        content: [{ type: 'text', text: 'This content is unclear about cognitive level.' }]
      });

      const section = {
        id: 'test-section',
        title: 'General Content',
        description: 'Some general content',
        type: 'General',
        videoUrl: null,
        duration: null,
        exams: [],
        Question: []
      };

      const result = await (engine as any).analyzeContent(section);
      expect(result).toBe('UNDERSTAND');
    });
  });

  describe('Question Analysis', () => {
    it('should analyze exam questions for Bloom&apos;s levels', () => {
      const exams = [
        {
          ExamQuestion: [
            { bloomsLevel: 'REMEMBER' },
            { bloomsLevel: 'APPLY' },
            { bloomsLevel: 'ANALYZE' }
          ]
        }
      ];

      const result = (engine as any).analyzeExams(exams);
      expect(result).toEqual(['REMEMBER', 'APPLY', 'ANALYZE']);
    });

    it('should handle empty exam arrays', () => {
      const result = engine['analyzeExams']([]);
      expect(result).toEqual([]);
      
      const resultNull = (engine as any).analyzeExams(null);
      expect(resultNull).toEqual([]);
    });

    it('should analyze question text for keywords', () => {
      const testCases = [
        { text: 'Define the concept of programming', expected: 'REMEMBER' },
        { text: 'Explain how variables work in JavaScript', expected: 'UNDERSTAND' },
        { text: 'Apply the sorting algorithm to this dataset', expected: 'APPLY' },
        { text: 'Analyze the differences between these two approaches', expected: 'ANALYZE' },
        { text: 'Evaluate which solution is more effective', expected: 'EVALUATE' },
        { text: 'Create a new algorithm for this problem', expected: 'CREATE' },
        { text: 'What is the main point of this lesson?', expected: 'UNDERSTAND' }, // Default
      ];

      testCases.forEach(({ text, expected }) => {
        const result = (engine as any).analyzeQuestionText(text);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Cognitive Depth Calculation', () => {
    it('should calculate cognitive depth correctly', () => {
      const distribution = {
        REMEMBER: 20,
        UNDERSTAND: 25,
        APPLY: 20,
        ANALYZE: 15,
        EVALUATE: 10,
        CREATE: 10
      };

      const depth = (engine as any).calculateCognitiveDepth(distribution);
      expect(depth).toBeGreaterThan(40); // Higher levels should increase depth
      expect(depth).toBeLessThanOrEqual(100);
    });

    it('should handle zero distribution', () => {
      const distribution = {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      };

      const depth = (engine as any).calculateCognitiveDepth(distribution);
      expect(depth).toBe(0);
    });

    it('should weight higher-order thinking skills more heavily', () => {
      const basicDistribution = {
        REMEMBER: 50,
        UNDERSTAND: 50,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      };

      const advancedDistribution = {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 30,
        EVALUATE: 35,
        CREATE: 35
      };

      const basicDepth = (engine as any).calculateCognitiveDepth(basicDistribution);
      const advancedDepth = (engine as any).calculateCognitiveDepth(advancedDistribution);

      expect(advancedDepth).toBeGreaterThan(basicDepth);
    });
  });

  describe('Balance Determination', () => {
    it('should identify bottom-heavy courses', () => {
      const bottomHeavyDistribution = {
        REMEMBER: 40,
        UNDERSTAND: 35,
        APPLY: 15,
        ANALYZE: 5,
        EVALUATE: 3,
        CREATE: 2
      };

      const balance = (engine as any).determineBalance(bottomHeavyDistribution);
      expect(balance).toBe('bottom-heavy');
    });

    it('should identify top-heavy courses', () => {
      const topHeavyDistribution = {
        REMEMBER: 10,
        UNDERSTAND: 15,
        APPLY: 20,
        ANALYZE: 20,
        EVALUATE: 25,
        CREATE: 10
      };

      const balance = (engine as any).determineBalance(topHeavyDistribution);
      expect(balance).toBe('top-heavy');
    });

    it('should identify well-balanced courses', () => {
      const balancedDistribution = {
        REMEMBER: 20,
        UNDERSTAND: 25,
        APPLY: 20,
        ANALYZE: 15,
        EVALUATE: 12,
        CREATE: 8
      };

      const balance = (engine as any).determineBalance(balancedDistribution);
      expect(balance).toBe('well-balanced');
    });
  });

  describe('Learning Pathway Analysis', () => {
    it('should build current cognitive path', () => {
      const chapters = [
        {
          chapterId: 'ch1',
          chapterTitle: 'Introduction',
          bloomsDistribution: { REMEMBER: 60, UNDERSTAND: 40, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
          primaryLevel: 'REMEMBER' as const,
          cognitiveDepth: 30,
          sections: [
            {
              sectionId: 's1',
              sectionTitle: 'Basics',
              bloomsLevel: 'REMEMBER' as const,
              activities: [],
              learningObjectives: []
            }
          ]
        }
      ];

      const pathway = (engine as any).buildCurrentPath(chapters);
      
      expect(pathway.stages).toHaveLength(6); // Six Bloom's levels
      expect(pathway.currentStage).toBeDefined();
      expect(pathway.completionPercentage).toBeDefined();
      
      // REMEMBER should have higher mastery due to the test data
      const rememberStage = pathway.stages.find(stage => stage.level === 'REMEMBER');
      expect(rememberStage).toBeDefined();
      expect(rememberStage?.mastery).toBeGreaterThan(0);
    });

    it('should identify learning gaps', () => {
      const currentPath = {
        stages: [
          { level: 'REMEMBER' as const, mastery: 80, activities: [], timeEstimate: 30 },
          { level: 'UNDERSTAND' as const, mastery: 60, activities: [], timeEstimate: 30 },
          { level: 'APPLY' as const, mastery: 20, activities: [], timeEstimate: 30 }, // Gap here
          { level: 'ANALYZE' as const, mastery: 10, activities: [], timeEstimate: 30 }, // Gap here
        ],
        currentStage: 1,
        completionPercentage: 50
      };

      const recommendedPath = {
        stages: [
          { level: 'REMEMBER' as const, mastery: 80, activities: [], timeEstimate: 30 },
          { level: 'UNDERSTAND' as const, mastery: 70, activities: [], timeEstimate: 30 },
          { level: 'APPLY' as const, mastery: 60, activities: [], timeEstimate: 30 },
          { level: 'ANALYZE' as const, mastery: 50, activities: [], timeEstimate: 30 },
        ],
        currentStage: 0,
        completionPercentage: 0
      };

      const gaps = (engine as any).identifyLearningGaps(currentPath, recommendedPath);
      
      expect(gaps).toHaveLength(2); // APPLY and ANALYZE should have gaps
      expect(gaps.some(gap => gap.level === 'APPLY')).toBe(true);
      expect(gaps.some(gap => gap.level === 'ANALYZE')).toBe(true);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate content recommendations for underrepresented levels', () => {
      const distribution = {
        REMEMBER: 40,
        UNDERSTAND: 35,
        APPLY: 15,
        ANALYZE: 5, // Under 10%
        EVALUATE: 3, // Under 10%
        CREATE: 2   // Under 10%
      };

      const chapters = [];

      const recommendations = (engine as any).generateContentRecommendations(chapters, distribution);
      
      expect(recommendations.length).toBeGreaterThan(0);
      const levels = recommendations.map(rec => rec.bloomsLevel);
      expect(levels).toContain('ANALYZE');
      expect(levels).toContain('EVALUATE');
      expect(levels).toContain('CREATE');
    });

    it('should generate assessment recommendations', () => {
      const distribution = {
        REMEMBER: 40,
        UNDERSTAND: 35,
        APPLY: 15,
        ANALYZE: 8,  // Under 15%
        EVALUATE: 1, // Under 10%
        CREATE: 1    // Under 10%
      };

      const recommendations = (engine as any).generateAssessmentRecommendations(distribution);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.bloomsLevel === 'ANALYZE')).toBe(true);
      expect(recommendations.some(rec => rec.bloomsLevel === 'CREATE')).toBe(true);
    });

    it('should generate activity suggestions', () => {
      const distribution = {
        REMEMBER: 40,
        UNDERSTAND: 35,
        APPLY: 15,
        ANALYZE: 5,
        EVALUATE: 3,
        CREATE: 2
      };

      const suggestions = (engine as any).generateActivitySuggestions(distribution);
      
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(suggestion.bloomsLevel).toBeDefined();
        expect(suggestion.activityType).toBeDefined();
        expect(suggestion.description).toBeDefined();
        expect(suggestion.implementation).toBeDefined();
        expect(suggestion.expectedOutcome).toBeDefined();
      });
    });
  });

  describe('Student Impact Analysis', () => {
    it('should identify developed skills', () => {
      const distribution = {
        REMEMBER: 25,
        UNDERSTAND: 30,
        APPLY: 20,
        ANALYZE: 15,
        EVALUATE: 6, // Below threshold
        CREATE: 4    // Below threshold
      };

      const skills = (engine as any).identifyDevelopedSkills(distribution, []);
      
      expect(skills.length).toBe(4); // Only skills above 10% threshold
      expect(skills.some(skill => skill.bloomsLevel === 'REMEMBER')).toBe(true);
      expect(skills.some(skill => skill.bloomsLevel === 'UNDERSTAND')).toBe(true);
      expect(skills.some(skill => skill.bloomsLevel === 'APPLY')).toBe(true);
      expect(skills.some(skill => skill.bloomsLevel === 'ANALYZE')).toBe(true);
      
      // Skills below threshold should not be included
      expect(skills.some(skill => skill.bloomsLevel === 'EVALUATE')).toBe(false);
      expect(skills.some(skill => skill.bloomsLevel === 'CREATE')).toBe(false);
    });

    it('should project cognitive growth', () => {
      const distribution = {
        REMEMBER: 30,
        UNDERSTAND: 25,
        APPLY: 20,
        ANALYZE: 15,
        EVALUATE: 7,
        CREATE: 3
      };

      const growth = (engine as any).projectCognitiveGrowth(distribution);
      
      expect(growth.currentLevel).toBeDefined();
      expect(growth.projectedLevel).toBeGreaterThan(growth.currentLevel);
      expect(growth.projectedLevel).toBeLessThanOrEqual(100);
      expect(growth.timeframe).toBeDefined();
      expect(growth.keyMilestones).toBeInstanceOf(Array);
    });

    it('should analyze career alignment', () => {
      const skills = [
        { name: 'Analytical Thinking', bloomsLevel: 'ANALYZE' as const, proficiency: 75, description: 'Test' },
        { name: 'Creative Innovation', bloomsLevel: 'CREATE' as const, proficiency: 60, description: 'Test' }
      ];

      const careerAlignment = (engine as any).analyzeCareerAlignment(skills);
      
      expect(careerAlignment).toBeInstanceOf(Array);
      expect(careerAlignment.length).toBeGreaterThan(0);
      
      careerAlignment.forEach(career => {
        expect(career.role).toBeDefined();
        expect(career.alignment).toBeGreaterThan(0);
        expect(career.alignment).toBeLessThanOrEqual(100);
        expect(career.requiredSkills).toBeInstanceOf(Array);
        expect(career.matchedSkills).toBeInstanceOf(Array);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Anthropic API errors gracefully', async () => {
      (mockAnthropicClient.messages.create as jest.Mock).mockRejectedValue(new Error('API Error'));

      const section = {
        id: 'test-section',
        title: 'Test Section',
        description: 'Test description',
        type: 'General',
        videoUrl: null,
        duration: null,
        exams: [],
        Question: []
      };

      await expect((engine as any).analyzeContent(section)).rejects.toThrow('API Error');
    });

    it('should handle empty course data', async () => {
      const courseId = testData.courses[2].id; // Unpublished course with no chapters

      const result = await engine.analyzeCourse(courseId, 'basic', false, true);
      
      expect(result.courseLevel.distribution).toBeDefined();
      expect(result.chapterAnalysis).toEqual([]);
    });
  });

  describe('Data Storage and Retrieval', () => {
    it('should store analysis results in database', async () => {
      const courseId = testData.courses[0].id;
      
      await engine.analyzeCourse(courseId, 'detailed', true, true);
      
      // Verify data was stored
      const stored = await testDb.getClient().courseBloomsAnalysis.findUnique({
        where: { courseId }
      });
      
      expect(stored).toBeDefined();
      expect(stored?.bloomsDistribution).toBeDefined();
      expect(stored?.cognitiveDepth).toBeDefined();
    });

    it('should store section mappings', async () => {
      const courseId = testData.courses[0].id;
      
      await engine.analyzeCourse(courseId, 'detailed', true, true);
      
      // Verify section mappings were stored
      const mappings = await testDb.getClient().sectionBloomsMapping.findMany({
        where: {
          section: {
            chapter: {
              courseId: courseId
            }
          }
        }
      });
      
      expect(mappings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', async () => {
      const courseId = testData.courses[0].id;
      const startTime = Date.now();
      
      await engine.analyzeCourse(courseId, 'basic', false, true);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent analysis requests', async () => {
      const courseIds = testData.courses.slice(0, 2).map(c => c.id);
      
      const promises = courseIds.map(courseId => 
        engine.analyzeCourse(courseId, 'basic', false, true)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.courseLevel).toBeDefined();
      });
    });
  });
});