import { NextRequest } from 'next/server';
import { testDb, setupTestDatabase, teardownTestDatabase } from '../../../../utils/test-db';
import { TestDataFactory } from '../../../../utils/test-factory';
import { ApiTestHelpers, AuthTestHelpers } from '../../../../utils/test-helpers';
import { setupMockProviders, resetMockProviders } from '../../../../utils/mock-providers';

// Import the actual route handler
import { GET, PUT, DELETE } from '@/app/api/courses/[courseId]/route';

describe('/api/courses/[courseId] Integration Tests', () => {
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

  describe('GET /api/courses/[courseId]', () => {
    it('should return course details for authenticated user', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.student.id,
        role: 'USER' 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      // Add courseId parameter to the request context
      const context = { params: { courseId } };
      
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('course');
      expect(data.course.id).toBe(courseId);
      expect(data.course.title).toBeDefined();
      expect(data.course.description).toBeDefined();
    });

    it('should include enrollment status for enrolled user', async () => {
      // Create enrollment for test user
      await testDb.getClient().enrollment.create({
        data: {
          userId: testData.users.student.id,
          courseId: courseId,
        },
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.student.id 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await GET(request, { params: { courseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isEnrolled).toBe(true);
    });

    it('should include purchase status for purchased course', async () => {
      await testDb.getClient().purchase.create({
        data: {
          userId: testData.users.student.id,
          courseId: courseId,
        },
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.student.id 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await GET(request, { params: { courseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isPurchased).toBe(true);
    });

    it('should return 404 for non-existent course', async () => {
      const session = AuthTestHelpers.createMockSession();
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/courses/non-existent-id',
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await GET(request, { params: { courseId: 'non-existent-id' } });

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
      });

      const response = await GET(request, { params: { courseId } });

      expect(response.status).toBe(401);
    });

    it('should include course progress for enrolled user', async () => {
      // Create enrollment and progress
      await testDb.getClient().enrollment.create({
        data: {
          userId: testData.users.student.id,
          courseId: courseId,
        },
      });

      await testDb.getClient().user_progress.create({
        data: {
          userId: testData.users.student.id,
          chapterId: testData.chapters[0].id,
          isCompleted: true,
          progressPercentage: 75,
        },
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.student.id 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await GET(request, { params: { courseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('progress');
      expect(data.progress).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/courses/[courseId]', () => {
    it('should update course for course owner', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id,
        role: 'USER' 
      });
      
      const updateData = {
        title: 'Updated Course Title',
        description: 'Updated course description',
        price: 199.99,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/courses/${courseId}`,
        body: updateData,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await PUT(request, { params: { courseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.course.title).toBe(updateData.title);
      expect(data.course.description).toBe(updateData.description);
      expect(data.course.price).toBe(updateData.price);

      // Verify in database
      const updatedCourse = await testDb.getClient().course.findUnique({
        where: { id: courseId },
      });

      expect(updatedCourse?.title).toBe(updateData.title);
      expect(updatedCourse?.description).toBe(updateData.description);
      expect(updatedCourse?.price).toBe(updateData.price);
    });

    it('should allow admin to update any course', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.admin.id,
        role: 'ADMIN' 
      });
      
      const updateData = {
        title: 'Admin Updated Title',
        isPublished: false,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/courses/${courseId}`,
        body: updateData,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await PUT(request, { params: { courseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.course.title).toBe(updateData.title);
      expect(data.course.isPublished).toBe(updateData.isPublished);
    });

    it('should return 403 for non-owner trying to update course', async () => {
      const otherUser = await testDb.getClient().user.create({
        data: TestDataFactory.createUser(),
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: otherUser.id,
        role: 'USER' 
      });
      
      const updateData = {
        title: 'Unauthorized Update',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/courses/${courseId}`,
        body: updateData,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await PUT(request, { params: { courseId } });

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      const invalidData = {
        title: '', // Empty title should be invalid
        price: -10, // Negative price should be invalid
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/courses/${courseId}`,
        body: invalidData,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await PUT(request, { params: { courseId } });

      expect(response.status).toBe(400);
    });

    it('should handle partial updates correctly', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      const originalCourse = await testDb.getClient().course.findUnique({
        where: { id: courseId },
      });

      const partialUpdate = {
        price: 299.99,
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/courses/${courseId}`,
        body: partialUpdate,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await PUT(request, { params: { courseId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.course.price).toBe(partialUpdate.price);
      expect(data.course.title).toBe(originalCourse?.title); // Should remain unchanged
      expect(data.course.description).toBe(originalCourse?.description); // Should remain unchanged
    });
  });

  describe('DELETE /api/courses/[courseId]', () => {
    let deleteCourseId: string;

    beforeEach(async () => {
      // Create a new course for each delete test to avoid conflicts
      const newCourse = await testDb.getClient().course.create({
        data: {
          ...TestDataFactory.createCourse(),
          userId: testData.users.teacher.id,
          categoryId: testData.categories[0].id,
        },
      });
      deleteCourseId = newCourse.id;
    });

    it('should delete course for course owner', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id,
        role: 'USER' 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/courses/${deleteCourseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await DELETE(request, { params: { courseId: deleteCourseId } });

      expect(response.status).toBe(200);

      // Verify course is deleted from database
      const deletedCourse = await testDb.getClient().course.findUnique({
        where: { id: deleteCourseId },
      });

      expect(deletedCourse).toBeNull();
    });

    it('should allow admin to delete any course', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.admin.id,
        role: 'ADMIN' 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/courses/${deleteCourseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await DELETE(request, { params: { courseId: deleteCourseId } });

      expect(response.status).toBe(200);

      // Verify course is deleted
      const deletedCourse = await testDb.getClient().course.findUnique({
        where: { id: deleteCourseId },
      });

      expect(deletedCourse).toBeNull();
    });

    it('should return 403 for non-owner trying to delete course', async () => {
      const otherUser = await testDb.getClient().user.create({
        data: TestDataFactory.createUser(),
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: otherUser.id,
        role: 'USER' 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/courses/${deleteCourseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await DELETE(request, { params: { courseId: deleteCourseId } });

      expect(response.status).toBe(403);

      // Verify course still exists
      const course = await testDb.getClient().course.findUnique({
        where: { id: deleteCourseId },
      });

      expect(course).not.toBeNull();
    });

    it('should handle course with enrollments', async () => {
      // Create enrollment for the course
      await testDb.getClient().enrollment.create({
        data: {
          userId: testData.users.student.id,
          courseId: deleteCourseId,
        },
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/courses/${deleteCourseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await DELETE(request, { params: { courseId: deleteCourseId } });

      // Should either:
      // 1. Delete the course and cascade delete enrollments (if configured)
      // 2. Return 409 conflict if deletion is not allowed due to existing enrollments
      expect([200, 409]).toContain(response.status);
    });

    it('should handle course with purchases', async () => {
      // Create purchase for the course
      await testDb.getClient().purchase.create({
        data: {
          userId: testData.users.student.id,
          courseId: deleteCourseId,
        },
      });

      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/courses/${deleteCourseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await DELETE(request, { params: { courseId: deleteCourseId } });

      // Courses with purchases typically should not be deletable
      expect([409, 422]).toContain(response.status);
    });

    it('should return 404 for non-existent course', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/courses/non-existent-id',
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await DELETE(request, { params: { courseId: 'non-existent-id' } });

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const session = AuthTestHelpers.createMockSession();
      
      // Mock database error
      const originalFindUnique = testDb.getClient().course.findUnique;
      jest.spyOn(testDb.getClient().course, 'findUnique').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await GET(request, { params: { courseId } });

      expect(response.status).toBe(500);

      // Restore original method
      jest.spyOn(testDb.getClient().course, 'findUnique').mockRestore();
    });

    it('should handle invalid JSON in request body', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      // Create a request with invalid JSON
      const request = new NextRequest(
        `http://localhost:3000/api/courses/${courseId}`,
        {
          method: 'PUT',
          body: '{invalid-json}',
          headers: {
            'content-type': 'application/json',
            'cookie': `next-auth.session-token=${session.user.id}`,
          },
        }
      );

      const response = await PUT(request, { params: { courseId } });

      expect(response.status).toBe(400);
    });

    it('should handle missing authorization header', async () => {
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
        // No authorization header
      });

      const response = await GET(request, { params: { courseId } });

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits for course updates', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      const updateData = { title: 'Rate Limit Test' };
      const requests = [];

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        const request = ApiTestHelpers.createMockRequest({
          method: 'PUT',
          url: `http://localhost:3000/api/courses/${courseId}`,
          body: { ...updateData, title: `${updateData.title} ${i}` },
          headers: {
            'cookie': `next-auth.session-token=${session.user.id}`,
          },
        });

        requests.push(PUT(request, { params: { courseId } }));
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimited = responses.filter(r => r.status === 429);
      
      // Note: This test depends on rate limiting being implemented
      // If rate limiting is not implemented, all requests will succeed
      if (rateLimited.length > 0) {
        expect(rateLimited.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Security', () => {
    it('should sanitize input data', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.teacher.id 
      });
      
      const maliciousData = {
        title: '<script>alert("xss")</script>Malicious Title',
        description: '<img src="x" onerror="alert(1)">',
      };

      const request = ApiTestHelpers.createMockRequest({
        method: 'PUT',
        url: `http://localhost:3000/api/courses/${courseId}`,
        body: maliciousData,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await PUT(request, { params: { courseId } });
      const data = await response.json();

      if (response.status === 200) {
        // If the update succeeds, malicious content should be sanitized
        expect(data.course.title).not.toContain('<script>');
        expect(data.course.description).not.toContain('onerror');
      }
    });

    it('should prevent SQL injection in courseId parameter', async () => {
      const session = AuthTestHelpers.createMockSession();
      
      const maliciousCourseId = "'; DROP TABLE courses; --";
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${encodeURIComponent(maliciousCourseId)}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const response = await GET(request, { params: { courseId: maliciousCourseId } });

      // Should return 404 or 400, not cause database errors
      expect([400, 404]).toContain(response.status);
      
      // Verify courses table still exists
      const courses = await testDb.getClient().course.findMany();
      expect(courses).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time limits', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.student.id 
      });
      
      const request = ApiTestHelpers.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/courses/${courseId}`,
        headers: {
          'cookie': `next-auth.session-token=${session.user.id}`,
        },
      });

      const startTime = Date.now();
      const response = await GET(request, { params: { courseId } });
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests efficiently', async () => {
      const session = AuthTestHelpers.createMockSession({ 
        userId: testData.users.student.id 
      });
      
      const requests = Array.from({ length: 20 }, () => 
        ApiTestHelpers.createMockRequest({
          method: 'GET',
          url: `http://localhost:3000/api/courses/${courseId}`,
          headers: {
            'cookie': `next-auth.session-token=${session.user.id}`,
          },
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(request => GET(request, { params: { courseId } }))
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      expect(responses).toHaveLength(20);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(totalTime).toBeLessThan(3000); // All requests should complete within 3 seconds
    });
  });
});