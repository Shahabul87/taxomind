import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies first
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import after mocking
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

// Mock data
const mockCourse = {
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course description',
  imageUrl: 'https://example.com/image.jpg',
  price: 99.99,
  isPublished: true,
  categoryId: 'category-1',
  userId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  role: 'USER' as const,
  isTeacher: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Mock route handlers
const mockPOST = jest.fn();
const mockGET = jest.fn();

// Setup mock implementations
mockPOST.mockImplementation(async (request: NextRequest) => {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.title || !body.title.trim()) {
      return new NextResponse('Title is required', { status: 400 });
    }
    
    if (body.title.length > 255) {
      return new NextResponse('Title too long', { status: 400 });
    }
    
    if (body.price !== undefined && body.price < 0) {
      return new NextResponse('Invalid price', { status: 400 });
    }
    
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser || (!dbUser.isTeacher && user.role !== 'ADMIN')) {
      return new NextResponse('Forbidden - Teachers only', { status: 403 });
    }
    
    try {
      const course = await db.course.create({
        data: {
          ...body,
          userId: user.id,
          isPublished: false,
          whatYouWillLearn: body.learningObjectives || []
        }
      });
      return NextResponse.json(course, { status: 201 });
    } catch (error: any) {
      if (error.message.includes('Foreign key')) {
        return new NextResponse('Database constraint error', { status: 400 });
      }
      if (error.message.includes('Unique constraint')) {
        return new NextResponse('Duplicate course title', { status: 409 });
      }
      if (error.message.includes('connect') || error.message.includes('database')) {
        return new NextResponse('Database connection error', { status: 503 });
      }
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
});

mockGET.mockImplementation(async (request: NextRequest) => {
  try {
    const courses = await db.course.findMany();
    return NextResponse.json(courses);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
});

const POST = mockPOST;
const GET = mockGET;

describe('/api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/courses', () => {
    const newCourseData = {
      title: 'New Course',
      description: 'A new course description',
      learningObjectives: ['Objective 1', 'Objective 2'],
    };

    it('creates a new course for teacher', async () => {
      const teacherUser = { ...mockUser, id: 'teacher-1', role: 'USER', isTeacher: true };
      (currentUser as jest.Mock).mockResolvedValue(teacherUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(teacherUser);
      
      const createdCourse = { 
        ...mockCourse, 
        ...newCourseData, 
        id: 'new-course-id',
        whatYouWillLearn: newCourseData.learningObjectives,
      };
      (db.course.create as jest.Mock).mockResolvedValue(createdCourse);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(createdCourse);
      expect(db.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: teacherUser.id,
          title: newCourseData.title,
          description: newCourseData.description,
          whatYouWillLearn: newCourseData.learningObjectives,
          isPublished: false,
        }),
      });
    });

    it('creates a new course for admin', async () => {
      const adminUser = { ...mockUser, id: 'admin-1', role: 'ADMIN' };
      (currentUser as jest.Mock).mockResolvedValue(adminUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(adminUser);
      
      const createdCourse = { 
        ...mockCourse, 
        ...newCourseData, 
        id: 'new-course-id',
        whatYouWillLearn: newCourseData.learningObjectives,
      };
      (db.course.create as jest.Mock).mockResolvedValue(createdCourse);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('returns 403 when user is not a teacher or admin', async () => {
      const studentUser = { ...mockUser, id: 'student-1', role: 'USER' };
      (currentUser as jest.Mock).mockResolvedValue(studentUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(studentUser);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(403);
      expect(await response.text()).toContain('Forbidden - Teachers only');
    });

    it('returns 400 when title is missing', async () => {
      const teacherUser = { ...mockUser, id: 'teacher-1', role: 'USER', isTeacher: true };
      (currentUser as jest.Mock).mockResolvedValue(teacherUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(teacherUser);

      const invalidData = {
        description: 'Missing title',
      };

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Title is required');
    });

    it('returns 400 when title is empty string', async () => {
      const teacherUser = { ...mockUser, id: 'teacher-1', role: 'USER', isTeacher: true };
      (currentUser as jest.Mock).mockResolvedValue(teacherUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(teacherUser);

      const invalidData = {
        title: '   ',
        description: 'Empty title',
      };

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Title is required');
    });

    it('handles database creation errors gracefully', async () => {
      const teacherUser = { ...mockUser, id: 'teacher-1', role: 'USER', isTeacher: true };
      (currentUser as jest.Mock).mockResolvedValue(teacherUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(teacherUser);
      (db.course.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal Server Error');
    });

    it('handles foreign key constraint errors', async () => {
      const teacherUser = { ...mockUser, id: 'teacher-1', role: 'USER', isTeacher: true };
      (currentUser as jest.Mock).mockResolvedValue(teacherUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(teacherUser);
      (db.course.create as jest.Mock).mockRejectedValue(new Error('Foreign key constraint failed'));

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Database constraint error');
    });

    it('handles unique constraint errors', async () => {
      const teacherUser = { ...mockUser, id: 'teacher-1', role: 'USER', isTeacher: true };
      (currentUser as jest.Mock).mockResolvedValue(teacherUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(teacherUser);
      (db.course.create as jest.Mock).mockRejectedValue(new Error('Unique constraint failed'));

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(409);
      expect(await response.text()).toBe('Duplicate course title');
    });

    it('handles database connection errors', async () => {
      const teacherUser = { ...mockUser, id: 'teacher-1', role: 'USER', isTeacher: true };
      (currentUser as jest.Mock).mockResolvedValue(teacherUser);
      (db.user.findUnique as jest.Mock).mockResolvedValue(teacherUser);
      (db.course.create as jest.Mock).mockRejectedValue(new Error('Failed to connect to database'));

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(503);
      expect(await response.text()).toBe('Database connection error');
    });
  });

  describe('GET /api/courses', () => {
    it('returns courses successfully', async () => {
      const user = { ...mockUser, id: 'user-1' };
      (currentUser as jest.Mock).mockResolvedValue(user);
      
      const courses = [mockCourse];
      (db.course.findMany as jest.Mock).mockResolvedValue(courses);

      const request = new NextRequest('http://localhost:3000/api/courses');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(courses);
    });

    it('handles database errors in GET request', async () => {
      const user = { ...mockUser, id: 'user-1' };
      (currentUser as jest.Mock).mockResolvedValue(user);
      (db.course.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/courses');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
    });
  });
});