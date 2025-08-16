import { GET, POST } from '@/app/api/courses/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { prismaMock } from '../../utils/test-db';

// Mocks are already set up in jest.setup.js
jest.mock('@/auth');

const mockAuth = auth as jest.Mock;

describe('/api/courses API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/courses', () => {
    it('should return published courses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'Test Course 1',
          description: 'Description 1',
          imageUrl: 'https://example.com/image1.jpg',
          price: 99.99,
          isPublished: true,
          categoryId: 'cat-1',
          userId: 'teacher-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'course-2',
          title: 'Test Course 2',
          description: 'Description 2',
          imageUrl: 'https://example.com/image2.jpg',
          price: 149.99,
          isPublished: true,
          categoryId: 'cat-2',
          userId: 'teacher-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.course.findMany.mockResolvedValue(mockCourses);

      const request = new NextRequest('http://localhost:3000/api/courses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCourses);
      expect(prismaMock.course.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
        },
        include: {
          category: true,
          chapters: {
            where: {
              isPublished: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              Purchase: true,
              Enrollment: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter courses by search query', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'JavaScript Basics',
          description: 'Learn JavaScript',
          isPublished: true,
        },
      ];

      prismaMock.course.findMany.mockResolvedValue(mockCourses);

      const request = new NextRequest('http://localhost:3000/api/courses?search=JavaScript');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCourses);
      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            OR: [
              {
                title: {
                  contains: 'JavaScript',
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: 'JavaScript',
                  mode: 'insensitive',
                },
              },
            ],
          }),
        })
      );
    });

    it('should filter courses by category', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'Course in Category',
          categoryId: 'cat-1',
          isPublished: true,
        },
      ];

      prismaMock.course.findMany.mockResolvedValue(mockCourses);

      const request = new NextRequest('http://localhost:3000/api/courses?categoryId=cat-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCourses);
      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            categoryId: 'cat-1',
          }),
        })
      );
    });

    it('should handle database errors', async () => {
      prismaMock.course.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/courses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch courses' });
    });

    it('should return empty array when no courses exist', async () => {
      prismaMock.course.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/courses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('POST /api/courses', () => {
    it('should create a new course for authenticated teacher', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'USER',
          email: 'teacher@example.com',
        },
      });

      const newCourse = {
        title: 'New Course',
        description: 'Course Description',
        price: 99.99,
        categoryId: 'cat-1',
      };

      const createdCourse = {
        id: 'new-course-id',
        ...newCourse,
        userId: 'teacher-1',
        isPublished: false,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.course.create.mockResolvedValue(createdCourse);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourse),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdCourse);
      expect(prismaMock.course.create).toHaveBeenCalledWith({
        data: {
          ...newCourse,
          userId: 'teacher-1',
        },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Course',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(prismaMock.course.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'USER',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Title is required' });
      expect(prismaMock.course.create).not.toHaveBeenCalled();
    });

    it('should handle database creation errors', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'USER',
        },
      });

      prismaMock.course.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Course',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create course' });
    });

    it('should sanitize and validate price', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'USER',
        },
      });

      const courseWithInvalidPrice = {
        title: 'Course with Invalid Price',
        price: -50, // Negative price
      };

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseWithInvalidPrice),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid price' });
      expect(prismaMock.course.create).not.toHaveBeenCalled();
    });

    it('should create free course when price is 0', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'USER',
        },
      });

      const freeCourse = {
        title: 'Free Course',
        price: 0,
      };

      const createdCourse = {
        id: 'free-course-id',
        ...freeCourse,
        userId: 'teacher-1',
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.course.create.mockResolvedValue(createdCourse);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(freeCourse),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.price).toBe(0);
    });

    it('should limit title length', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'USER',
        },
      });

      const longTitle = 'A'.repeat(256); // Too long

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: longTitle,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Title too long' });
    });
  });
});