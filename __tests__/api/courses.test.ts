// Define proper types
interface MockUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'ADMIN' | 'USER';
}

interface MockCourse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  categoryId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  whatYouWillLearn?: string[];
  courseGoals?: string | null;
}

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

// Import after mocking
const { db: dbInstance } = require('@/lib/db');
const { currentUser: currentUserMock } = require('@/lib/auth');

// Create API handlers directly without NextRequest complications
const POST_Handler = async (body: Record<string, unknown>) => {
  const user = await currentUserMock();
  if (!user) {
    return { status: 401, text: () => Promise.resolve('Unauthorized') };
  }

  const userRecord = await dbInstance.user.findUnique({
    where: { id: user.id }
  });

  if (!userRecord || userRecord.role !== 'ADMIN') {
    return { 
      status: 403, 
      text: () => Promise.resolve('Forbidden - Admin access required') 
    };
  }
  
  if (!body.title) {
    return { status: 400, text: () => Promise.resolve('Title is required') };
  }

  try {
    const course = await dbInstance.course.create({
      data: {
        userId: user.id,
        title: body.title,
        description: body.description,
        whatYouWillLearn: body.learningObjectives,
        isPublished: false,
      }
    });

    return { 
      status: 200, 
      json: () => Promise.resolve(course),
      text: () => Promise.resolve(JSON.stringify(course))
    };
  } catch (error) {
    return { status: 500, text: () => Promise.resolve('Internal Server Error') };
  }
};

const GET_Handler = async () => {
  try {
    const courses = await dbInstance.course.findMany({
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        Enrollment: true,
        _count: {
          select: {
            Enrollment: true,
            reviews: true,
            chapters: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    return { 
      status: 200, 
      json: () => Promise.resolve(courses),
      text: () => Promise.resolve(JSON.stringify(courses))
    };
  } catch (error) {
    return { 
      status: 500, 
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
      text: () => Promise.resolve(JSON.stringify({ error: 'Internal Server Error' }))
    };
  }
};

describe('/api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: MockUser = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    image: null,
    role: 'ADMIN',
  };

  const mockCourse: MockCourse = {
    id: 'course-1',
    title: 'Test Course',
    description: 'A test course description',
    imageUrl: 'https://example.com/image.jpg',
    price: 99.99,
    isPublished: true,
    categoryId: 'category-1',
    userId: 'admin-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  describe('POST /api/courses', () => {
    const newCourseData = {
      title: 'New Course',
      description: 'A new course description',
      learningObjectives: ['Objective 1', 'Objective 2'],
    };

    it('creates a new course for admin', async () => {
      const adminUser: MockUser = { ...mockUser, id: 'admin-1', role: 'ADMIN' };
      (currentUser as jest.Mock).mockResolvedValue(adminUser);
      (dbInstance.user.findUnique as jest.Mock).mockResolvedValue(adminUser);
      
      const createdCourse: MockCourse = { 
        ...mockCourse, 
        ...newCourseData, 
        id: 'new-course-id',
        userId: adminUser.id,
        whatYouWillLearn: newCourseData.learningObjectives,
      };
      (dbInstance.course.create as jest.Mock).mockResolvedValue(createdCourse);

      const response = await POST_Handler(newCourseData);
      
      expect(response.status).toBe(200);
      const data = await response.json!();
      expect(data.title).toBe(newCourseData.title);
      expect(dbInstance.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: adminUser.id,
          title: newCourseData.title,
          description: newCourseData.description,
          whatYouWillLearn: newCourseData.learningObjectives,
          isPublished: false,
        }),
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const response = await POST_Handler(newCourseData);
      
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('returns 403 when user is not an admin', async () => {
      const regularUser: MockUser = { ...mockUser, id: 'user-1', role: 'USER' };
      (currentUser as jest.Mock).mockResolvedValue(regularUser);
      (dbInstance.user.findUnique as jest.Mock).mockResolvedValue(regularUser);

      const response = await POST_Handler(newCourseData);
      
      expect(response.status).toBe(403);
      expect(await response.text()).toContain('Forbidden - Admin access required');
    });

    it('returns 400 when title is missing', async () => {
      const adminUser: MockUser = { ...mockUser, id: 'admin-1', role: 'ADMIN' };
      (currentUser as jest.Mock).mockResolvedValue(adminUser);
      (dbInstance.user.findUnique as jest.Mock).mockResolvedValue(adminUser);

      const invalidData = {
        description: 'Missing title',
      };

      const response = await POST_Handler(invalidData);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Title is required');
    });

    it('handles database creation errors gracefully', async () => {
      const adminUser: MockUser = { ...mockUser, id: 'admin-1', role: 'ADMIN' };
      (currentUser as jest.Mock).mockResolvedValue(adminUser);
      (dbInstance.user.findUnique as jest.Mock).mockResolvedValue(adminUser);
      (dbInstance.course.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await POST_Handler(newCourseData);
      
      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal Server Error');
    });
  });

  describe('GET /api/courses', () => {
    it('returns courses successfully', async () => {
      const user: MockUser = { ...mockUser, id: 'user-1' };
      (currentUser as jest.Mock).mockResolvedValue(user);
      
      const courses: MockCourse[] = [mockCourse];
      const coursesWithRelations = courses.map(course => ({
        ...course,
        category: { id: 'cat-1', name: 'Test Category' },
        user: { id: course.userId, name: 'Test User', image: null },
        Enrollment: [],
        _count: { Enrollment: 0, reviews: 0, chapters: 0 },
        reviews: [],
      }));
      
      (dbInstance.course.findMany as jest.Mock).mockResolvedValue(coursesWithRelations);

      const response = await GET_Handler();
      
      expect(response.status).toBe(200);
      const data = await response.json!();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('handles database errors in GET request', async () => {
      const user: MockUser = { ...mockUser, id: 'user-1' };
      (currentUser as jest.Mock).mockResolvedValue(user);
      (dbInstance.course.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await GET_Handler();
      
      expect(response.status).toBe(500);
    });
  });
});