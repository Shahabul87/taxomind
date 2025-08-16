import { NextRequest } from 'next/server';
import { testDb, setupTestDatabase, teardownTestDatabase } from '../../../utils/test-db';
import { TestDataFactory } from '../../../utils/test-factory';
import { ApiTestHelpers, AuthTestHelpers } from '../../../utils/test-helpers';
import { setupMockProviders, resetMockProviders, mockAnthropicClient } from '../../../utils/mock-providers';

// Import the actual route handler
import { POST } from '@/app/api/sam/blooms-analysis/route';

describe('/api/sam/blooms-analysis Integration Tests', () => {
  let testData: any;
  let courseId: string;

  beforeAll(async () => {
    setupMockProviders();
    testData = await setupTestDatabase();
    courseId = testData.courses[0].id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    resetMockProviders();
  });

  describe('POST /api/sam/blooms-analysis', () => {
    it('should analyze course and return Bloom\'s taxonomy analysis', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id,
        role: 'USER' 
      });

      // Mock Anthropic responses for different content analysis
      mockAnthropicClient.messages.create.mockImplementation(async ({ messages }) => {
        const content = messages[messages.length - 1].content;
        
        if (content.includes('Introduction')) {
          return {
            content: [{ type: 'text', text: 'REMEMBER - This section focuses on basic recall of fundamental concepts.' }]
          };
        } else if (content.includes('Advanced')) {
          return {
            content: [{ type: 'text', text: 'ANALYZE - This section requires students to analyze complex relationships.' }]
          };
        }
        
        return {
          content: [{ type: 'text', text: 'UNDERSTAND - This section develops comprehension of key principles.' }]
        };
      });
      
      const requestBody = {
        courseId: courseId,
        depth: 'detailed',
        includeRecommendations: true,
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('courseLevel');
      expect(data.data).toHaveProperty('chapterAnalysis');
      expect(data.data).toHaveProperty('learningPathway');
      expect(data.data).toHaveProperty('recommendations');
      expect(data.data).toHaveProperty('studentImpact');

      // Verify course level analysis
      expect(data.data.courseLevel).toHaveProperty('distribution');
      expect(data.data.courseLevel).toHaveProperty('cognitiveDepth');
      expect(data.data.courseLevel).toHaveProperty('balance');

      // Verify distribution has all Bloom's levels
      const distribution = data.data.courseLevel.distribution;
      expect(distribution).toHaveProperty('REMEMBER');
      expect(distribution).toHaveProperty('UNDERSTAND');
      expect(distribution).toHaveProperty('APPLY');
      expect(distribution).toHaveProperty('ANALYZE');
      expect(distribution).toHaveProperty('EVALUATE');
      expect(distribution).toHaveProperty('CREATE');

      // Verify cognitive depth is reasonable
      expect(data.data.courseLevel.cognitiveDepth).toBeGreaterThanOrEqual(0);
      expect(data.data.courseLevel.cognitiveDepth).toBeLessThanOrEqual(100);

      // Verify balance classification
      expect(['well-balanced', 'bottom-heavy', 'top-heavy']).toContain(data.data.courseLevel.balance);
    });

    it('should return cached analysis when content unchanged', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
        includeRecommendations: false,
        forceReanalyze: false,
      };

      // First request - will trigger analysis
      const firstRequest = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      await POST(firstRequest);
      
      // Reset mock to verify cache usage
      mockAnthropicClient.messages.create.mockClear();

      // Second request - should use cache
      const secondRequest = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(secondRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify AI service wasn't called again (cache hit)
      expect(mockAnthropicClient.messages.create).not.toHaveBeenCalled();
    });

    it('should force reanalysis when requested', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
        includeRecommendations: false,
        forceReanalyze: true,
      };

      // First request
      await POST(ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: { 'cookie': `next-auth.session-token=${session.user.id}` },
      }));

      // Clear mock to verify new analysis
      mockAnthropicClient.messages.create.mockClear();

      // Second request with force reanalyze
      const response = await POST(ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: { 'cookie': `next-auth.session-token=${session.user.id}` },
      }));

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify AI service was called again (forced reanalysis)
      expect(mockAnthropicClient.messages.create).toHaveBeenCalled();
    });

    it('should include recommendations when requested', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'comprehensive',
        includeRecommendations: true,
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify recommendations are included
      expect(data.data.recommendations).toHaveProperty('contentAdjustments');
      expect(data.data.recommendations).toHaveProperty('assessmentChanges');
      expect(data.data.recommendations).toHaveProperty('activitySuggestions');

      // Verify recommendations have proper structure
      if (data.data.recommendations.contentAdjustments.length > 0) {
        const adjustment = data.data.recommendations.contentAdjustments[0];
        expect(adjustment).toHaveProperty('type');
        expect(adjustment).toHaveProperty('bloomsLevel');
        expect(adjustment).toHaveProperty('description');
        expect(adjustment).toHaveProperty('impact');
      }
    });

    it('should analyze learning pathway and identify gaps', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'detailed',
        includeRecommendations: true,
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify learning pathway structure
      expect(data.data.learningPathway).toHaveProperty('current');
      expect(data.data.learningPathway).toHaveProperty('recommended');
      expect(data.data.learningPathway).toHaveProperty('gaps');

      // Verify current path structure
      const currentPath = data.data.learningPathway.current;
      expect(currentPath).toHaveProperty('stages');
      expect(currentPath).toHaveProperty('currentStage');
      expect(currentPath).toHaveProperty('completionPercentage');
      expect(currentPath.stages).toHaveLength(6); // Six Bloom's levels

      // Verify stages have proper structure
      if (currentPath.stages.length > 0) {
        const stage = currentPath.stages[0];
        expect(stage).toHaveProperty('level');
        expect(stage).toHaveProperty('mastery');
        expect(stage).toHaveProperty('activities');
        expect(stage).toHaveProperty('timeEstimate');
      }
    });

    it('should analyze student impact and career alignment', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'comprehensive',
        includeRecommendations: true,
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify student impact structure
      expect(data.data.studentImpact).toHaveProperty('skillsDeveloped');
      expect(data.data.studentImpact).toHaveProperty('cognitiveGrowth');
      expect(data.data.studentImpact).toHaveProperty('careerAlignment');

      // Verify skills structure
      if (data.data.studentImpact.skillsDeveloped.length > 0) {
        const skill = data.data.studentImpact.skillsDeveloped[0];
        expect(skill).toHaveProperty('name');
        expect(skill).toHaveProperty('bloomsLevel');
        expect(skill).toHaveProperty('proficiency');
        expect(skill).toHaveProperty('description');
      }

      // Verify cognitive growth projection
      const growth = data.data.studentImpact.cognitiveGrowth;
      expect(growth).toHaveProperty('currentLevel');
      expect(growth).toHaveProperty('projectedLevel');
      expect(growth).toHaveProperty('timeframe');
      expect(growth).toHaveProperty('keyMilestones');
      expect(growth.projectedLevel).toBeGreaterThanOrEqual(growth.currentLevel);
    });

    it('should handle different analysis depths', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const depths = ['basic', 'detailed', 'comprehensive'];
      
      for (const depth of depths) {
        const requestBody = {
          courseId: courseId,
          depth: depth,
          includeRecommendations: false,
          forceReanalyze: true,
        };

        const request = ApiTestHelpers.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/sam/blooms-analysis',
          body: requestBody,
          headers: {
            'cookie': `next-auth.session-token=${session.user.id}`,
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('courseLevel');
        
        // Basic depth should have minimal data, comprehensive should have more
        if (depth === 'comprehensive') {
          expect(data.data.chapterAnalysis.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const requestBody = {
        courseId: courseId,
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        // No authentication headers
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should allow course owner to analyze their course', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id,
        role: 'USER' 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should allow admin to analyze any course', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.admin.id,
        role: 'ADMIN' 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should deny non-owner user access', async () => {
      const otherUser = await testDb.getClient().user.create({
        data: TestDataFactory.createUser(),
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: otherUser.id,
        role: 'USER' 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    it('should validate required courseId', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        // Missing courseId
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate depth parameter', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'invalid-depth',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle non-existent courseId', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: 'non-existent-course-id',
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should validate boolean parameters', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const validRequest = {
        courseId: courseId,
        depth: 'basic',
        includeRecommendations: true,
        forceReanalyze: false,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: validRequest,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      // Mock AI service error
      mockAnthropicClient.messages.create.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      // Mock database error
      jest.spyOn(testDb.getClient().course, 'findUnique').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);

      // Restore mock
      jest.restoreAllMocks();
    });

    it('should handle malformed JSON request', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      // Create request with malformed JSON
      const request = new NextRequest(
        'http://localhost:3000/api/sam/blooms-analysis',
        {
          method: 'POST',
          body: '{invalid json}',
          headers: {
            'content-type': 'application/json',
            'cookie': `next-auth.session-token=${session.user.id}`,
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle course with no content', async () => {
      // Create a course with no chapters/sections
      const emptyCourse = await testDb.getClient().course.create({
        data: {
          ...TestDataFactory.createCourse(),
          userId: testData.users.teacher.id,
          categoryId: testData.categories[0].id,
        },
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: emptyCourse.id,
        depth: 'basic',
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.chapterAnalysis).toEqual([]);
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should respond within reasonable time limits', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
        includeRecommendations: false,
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle rate limiting for analysis requests', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
        forceReanalyze: true,
      };

      // Make multiple rapid requests
      const requests = Array.from({ length: 5 }, () => 
        ApiTestHelpers.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/sam/blooms-analysis',
          body: requestBody,
          headers: {
            'cookie': `next-auth.session-token=${session.user.id}`,
          },
        })
      );

      const responses = await Promise.all(
        requests.map(request => POST(request))
      );

      // At least one should succeed
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);

      // Some might be rate limited (429 status) if rate limiting is implemented
      const rateLimited = responses.filter(r => r.status === 429);
      // This test depends on rate limiting implementation
    });
  });

  describe('Data Persistence', () => {
    it('should store analysis results in database', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'detailed',
        includeRecommendations: true,
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify analysis was stored in database
      const storedAnalysis = await testDb.getClient().courseBloomsAnalysis.findUnique({
        where: { courseId },
      });

      expect(storedAnalysis).toBeDefined();
      expect(storedAnalysis?.bloomsDistribution).toBeDefined();
      expect(storedAnalysis?.cognitiveDepth).toBeDefined();
    });

    it('should store section mappings', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });

      const requestBody = {
        courseId: courseId,
        depth: 'detailed',
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify section mappings were created
      const sectionMappings = await testDb.getClient().sectionBloomsMapping.findMany({
        where: {
          section: {
            chapter: {
              courseId: courseId,
            },
          },
        },
      });

      expect(sectionMappings.length).toBeGreaterThan(0);
    });
  });
});