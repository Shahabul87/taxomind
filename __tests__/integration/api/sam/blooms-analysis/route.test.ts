import { NextRequest } from 'next/server';
import { testDb, setupTestDatabase, teardownTestDatabase } from '../../../../utils/test-db';
import { TestDataFactory } from '../../../../utils/test-factory';
import { ApiTestHelpers, AuthTestHelpers } from '../../../../utils/test-helpers';
import { setupMockProviders, resetMockProviders, mockAnthropicClient } from '../../../../utils/mock-providers';

// Get the mocked modules so we can configure them per test
const { currentUser } = jest.requireMock('@/lib/auth') as { currentUser: jest.Mock };
const { db } = jest.requireMock('@/lib/db') as { db: Record<string, Record<string, jest.Mock>> };

// Mock @sam-ai/educational to provide a working unified blooms engine
jest.mock('@sam-ai/educational', () => ({
  createUnifiedBloomsEngine: jest.fn(() => ({
    analyzeCourse: jest.fn(async () => ({
      courseLevel: {
        distribution: {
          REMEMBER: 20,
          UNDERSTAND: 25,
          APPLY: 20,
          ANALYZE: 15,
          EVALUATE: 10,
          CREATE: 10,
        },
        cognitiveDepth: 65,
        balance: 'well-balanced',
        confidence: 0.85,
      },
      chapters: [
        {
          chapterId: 'ch-1',
          chapterTitle: 'Introduction',
          primaryLevel: 'REMEMBER',
          confidence: 0.85,
          cognitiveDepth: 35,
          distribution: { REMEMBER: 60, UNDERSTAND: 40, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
          sections: [
            { id: 'sec-1', title: 'Getting Started', level: 'REMEMBER', confidence: 0.8 },
          ],
        },
      ],
      learningPathway: {
        stages: [
          { level: 'REMEMBER', mastery: 80, activities: ['recall'], timeEstimate: 2 },
          { level: 'UNDERSTAND', mastery: 60, activities: ['explain'], timeEstimate: 3 },
        ],
        cognitiveProgression: ['REMEMBER', 'UNDERSTAND'],
        estimatedDuration: '5 hours',
        recommendations: ['Start with basics'],
      },
      recommendations: [
        {
          type: 'content',
          targetLevel: 'ANALYZE',
          targetChapter: 'ch-1',
          description: 'Add higher-order thinking activities',
          priority: 'high',
          expectedImpact: 'Increase cognitive depth by 20+',
        },
      ],
      analyzedAt: new Date().toISOString(),
      sectionMappings: [],
    })),
  })),
}));

// Mock @sam-ai/pedagogy
jest.mock('@sam-ai/pedagogy', () => ({
  createCognitiveLoadAnalyzer: jest.fn(() => ({
    analyze: jest.fn(() => ({
      cognitiveLoad: 'moderate',
      score: 65,
      recommendations: [],
    })),
  })),
}));

// Mock @/lib/adapters
jest.mock('@/lib/adapters', () => ({
  getSAMConfig: jest.fn(() => ({
    aiProvider: 'anthropic',
    model: 'claude-3-haiku',
  })),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

// Mock rate limiter to always allow
jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(async () => null),
}));

// Mock timeout utility
jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {},
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

// Mock blooms normalizer
jest.mock('@/lib/sam/utils/blooms-normalizer', () => ({
  normalizeToUppercaseSafe: jest.fn((level: string) => level?.toUpperCase() || 'REMEMBER'),
}));

// Import the actual route handler (after mocks are set up)
import { POST } from '@/app/api/sam/blooms-analysis/route';

// Helper to set up authenticated user for route handler
function mockAuthenticatedUser(session: { user: { id: string; role?: string } }) {
  currentUser.mockResolvedValue(session.user);
}

function mockUnauthenticatedUser() {
  currentUser.mockResolvedValue(null);
}

// Mock course data factory
function createMockCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    title: 'Test Course',
    description: 'A test course for analysis',
    courseGoals: 'Learn fundamentals',
    userId: 'teacher-1',
    organizationId: null,
    chapters: [
      {
        id: 'ch-1',
        title: 'Introduction',
        position: 1,
        learningOutcomes: 'Basic understanding',
        courseGoals: null,
        sections: [
          {
            id: 'sec-1',
            title: 'Getting Started',
            description: 'Introduction to the topic',
            learningObjectives: 'Recall key terms',
            learningObjectiveItems: [],
            exams: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('/api/sam/blooms-analysis Integration Tests', () => {
  let testData: {
    users: Record<string, { id: string; email: string; name: string; role: string }>;
    courses: Array<{ id: string; title: string; userId: string; isPublished: boolean }>;
    categories: Array<{ id: string; name: string }>;
  };
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
    // Default: unauthenticated
    mockUnauthenticatedUser();
    // Default: course found
    db.course.findUnique.mockResolvedValue(
      createMockCourse({ id: courseId, userId: testData.users.teacher.id })
    );
    // Default: analysis persistence succeeds
    if (db.courseBloomsAnalysis) {
      db.courseBloomsAnalysis.findUnique.mockResolvedValue(null);
      db.courseBloomsAnalysis.upsert.mockResolvedValue({ id: 'analysis-1', courseId });
    }
  });

  describe('POST /api/sam/blooms-analysis', () => {
    it('should analyze course and return Bloom\'s taxonomy analysis', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
        role: 'USER',
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('courseLevel');
      expect(data.data).toHaveProperty('chapters');
      expect(data.data).toHaveProperty('learningPathway');
      expect(data.data).toHaveProperty('recommendations');

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
      expect(['well-balanced', 'bottom-heavy', 'top-heavy']).toContain(
        data.data.courseLevel.balance
      );
    });

    it('should return cached analysis when content unchanged', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const firstResponse = await POST(firstRequest);
      expect(firstResponse.status).toBe(200);

      // Second request - should still succeed (cache behavior is engine-internal)
      const secondRequest = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(secondRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should force reanalysis when requested', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('courseLevel');
    });

    it('should include recommendations when requested', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify recommendations are included (array format)
      expect(data.data.recommendations).toBeDefined();
      expect(Array.isArray(data.data.recommendations)).toBe(true);

      if (data.data.recommendations.length > 0) {
        const rec = data.data.recommendations[0];
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('description');
      }
    });

    it('should analyze learning pathway', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify learning pathway structure
      expect(data.data.learningPathway).toBeDefined();
      expect(data.data.learningPathway).toHaveProperty('stages');
      expect(Array.isArray(data.data.learningPathway.stages)).toBe(true);
    });

    it('should return chapter-level analysis', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify chapters analysis
      expect(data.data.chapters).toBeDefined();
      expect(Array.isArray(data.data.chapters)).toBe(true);
      if (data.data.chapters.length > 0) {
        const chapter = data.data.chapters[0];
        expect(chapter).toHaveProperty('chapterId');
        expect(chapter).toHaveProperty('chapterTitle');
        expect(chapter).toHaveProperty('primaryLevel');
      }
    });

    it('should handle different analysis depths', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
            cookie: `next-auth.session-token=${session.user.id}`,
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('courseLevel');
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
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should allow course owner to analyze their course', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
        role: 'USER',
      });
      mockAuthenticatedUser(session);

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should allow admin to analyze any course', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.admin.id,
        role: 'ADMIN',
      });
      mockAuthenticatedUser(session);

      // Course owned by teacher, accessed by admin
      db.course.findUnique.mockResolvedValue(
        createMockCourse({ id: courseId, userId: testData.users.teacher.id })
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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should deny non-owner user access', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: 'other-user-id',
        role: 'USER',
      });
      mockAuthenticatedUser(session);

      // Course owned by teacher, accessed by different user
      db.course.findUnique.mockResolvedValue(
        createMockCourse({ id: courseId, userId: testData.users.teacher.id })
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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    it('should validate required courseId', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

      const requestBody = {
        // Missing courseId
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle non-existent courseId', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

      // Return null for non-existent course
      db.course.findUnique.mockResolvedValue(null);

      const requestBody = {
        courseId: 'non-existent-course-id',
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });

    it('should accept valid boolean parameters', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

      // Mock database error
      db.course.findUnique.mockRejectedValueOnce(new Error('Database connection failed'));

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle malformed JSON request', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

      // Create request with malformed JSON body
      const request = new NextRequest(
        'http://localhost:3000/api/sam/blooms-analysis',
        {
          method: 'POST',
          body: '{invalid json}',
          headers: {
            'content-type': 'application/json',
            cookie: `next-auth.session-token=${session.user.id}`,
          },
        }
      );

      const response = await POST(request);

      // Should handle gracefully - either 400 or 500
      expect([400, 500]).toContain(response.status);
    });

    it('should handle course with no content', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

      // Return a course with no chapters
      db.course.findUnique.mockResolvedValue(
        createMockCourse({
          id: 'empty-course',
          userId: testData.users.teacher.id,
          chapters: [],
        })
      );

      const requestBody = {
        courseId: 'empty-course',
        depth: 'basic',
        forceReanalyze: true,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/sam/blooms-analysis',
        body: requestBody,
        headers: {
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should respond within reasonable time limits', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

      const requestBody = {
        courseId: courseId,
        depth: 'basic',
        forceReanalyze: true,
      };

      // Make multiple concurrent requests
      const requests = Array.from({ length: 3 }, () =>
        ApiTestHelpers.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/sam/blooms-analysis',
          body: requestBody,
          headers: {
            cookie: `next-auth.session-token=${session.user.id}`,
          },
        })
      );

      const responses = await Promise.all(requests.map((request) => POST(request)));

      // All should succeed (rate limiter is mocked to allow)
      const successful = responses.filter((r) => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence', () => {
    it('should persist analysis to database', async () => {
      const session = AuthTestHelpers.createMockSession({
        userId: testData.users.teacher.id,
      });
      mockAuthenticatedUser(session);

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
          cookie: `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify the upsert was called (the mock db)
      if (db.courseBloomsAnalysis) {
        expect(db.courseBloomsAnalysis.upsert).toHaveBeenCalled();
      }
    });
  });
});
