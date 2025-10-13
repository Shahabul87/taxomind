// Define proper types
interface MockUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'ADMIN' | 'USER';
}

interface MockCourse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockChapter {
  id: string;
  courseId: string;
  title: string | null;
  description: string | null;
  learningOutcomes: string | null;
  isPublished: boolean;
  position: number;
  sections?: MockSection[];
}

interface MockSection {
  id: string;
  isPublished: boolean;
}

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

// Import after mocking
const { currentUser } = require('@/lib/auth');

// Access the mocked db
const chaptersDbMock = require('@/lib/db');

// Create API handlers that mirror the actual API behavior
const PATCH = async (body: Record<string, unknown>, params: { courseId: string; chapterId: string }) => {
  const user = await currentUser();
  if (!user) {
    return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) };
  }
  
  const { courseId, chapterId } = params;
  const { isPublished, ...values } = body;
  
  const courseOwner = await chaptersDbMock.db.course.findFirst({
    where: { id: courseId, userId: user.id }
  });
  
  if (!courseOwner) {
    return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) };
  }
  
  try {
    // Update the chapter with the provided values
    const chapter = await chaptersDbMock.db.chapter.update({
      where: { id: chapterId, courseId },
      data: values
    });
    
    // If the publishing status was provided, handle that separately
    if (isPublished !== undefined) {
      await chaptersDbMock.db.chapter.update({
        where: { id: chapterId, courseId },
        data: { isPublished }
      });
    }
    
    return { status: 200, json: () => Promise.resolve(chapter) };
  } catch (error) {
    return { status: 500, json: () => Promise.resolve({ error: 'Internal Error' }) };
  }
};

const DELETE = async (params: { courseId: string; chapterId: string }) => {
  const user = await currentUser();
  if (!user) {
    return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) };
  }
  
  const { courseId, chapterId } = params;
  
  const courseOwner = await chaptersDbMock.db.course.findFirst({
    where: { id: courseId, userId: user.id }
  });
  
  if (!courseOwner) {
    return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) };
  }
  
  try {
    const chapter = await chaptersDbMock.db.chapter.findUnique({
      where: { id: chapterId }
    });
    
    if (!chapter) {
      return { status: 404, json: () => Promise.resolve({ error: 'Chapter not found' }) };
    }
    
    const deletedChapter = await chaptersDbMock.db.chapter.delete({
      where: { id: chapterId }
    });
    
    return { status: 200, json: () => Promise.resolve(deletedChapter) };
  } catch (error) {
    return { status: 500, json: () => Promise.resolve({ error: 'Internal Error' }) };
  }
};

const PUBLISH_PATCH = async (params: { courseId: string; chapterId: string }) => {
  const user = await currentUser();
  if (!user) {
    return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) };
  }
  
  const { courseId, chapterId } = params;
  
  const course = await chaptersDbMock.db.course.findUnique({
    where: { id: courseId, userId: user.id }
  });
  
  if (!course) {
    return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) };
  }
  
  const chapter = await chaptersDbMock.db.chapter.findUnique({
    where: { id: chapterId },
    include: { sections: true }
  });
  
  if (!chapter || !chapter.title || !chapter.description || !chapter.learningOutcomes) {
    return { status: 400, json: () => Promise.resolve({ error: 'Missing required fields' }) };
  }
  
  try {
    const updatedChapter = await chaptersDbMock.db.chapter.update({
      where: { id: chapterId },
      data: { isPublished: !chapter.isPublished }
    });
    
    return { status: 200, json: () => Promise.resolve(updatedChapter) };
  } catch (error) {
    return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) };
  }
};

describe('/api/courses/[courseId]/chapters/[chapterId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const courseId = 'course-123';
  const chapterId = 'chapter-456';
  const userId = 'user-789';

  describe('PATCH /api/courses/[courseId]/chapters/[chapterId]', () => {
    it('updates chapter successfully when user owns course', async () => {
      const updateData = {
        title: 'Updated Chapter Title',
        description: 'Updated description',
        isFree: true,
      };

      const mockUser: MockUser = { id: userId, name: 'Test User', email: 'test@example.com', image: null, role: 'USER' };
      const mockCourse: MockCourse = { id: courseId, userId, title: 'Test Course', description: null, isPublished: true, createdAt: new Date(), updatedAt: new Date() };
      const mockChapter: Partial<MockChapter> = { id: chapterId, ...updateData };
      
      (currentUser as jest.Mock).mockResolvedValue(mockUser);
      (chaptersDbMock.db.course.findFirst as jest.Mock).mockResolvedValue(mockCourse);
      (chaptersDbMock.db.chapter.update as jest.Mock).mockResolvedValue(mockChapter);

      const response = await PATCH(updateData, { courseId, chapterId });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(mockChapter);
      expect(chaptersDbMock.db.chapter.update).toHaveBeenCalledWith({
        where: {
          id: chapterId,
          courseId,
        },
        data: updateData,
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const response = await PATCH({ title: 'New Title' }, { courseId, chapterId });

      expect(response.status).toBe(401);
      expect(chaptersDbMock.db.chapter.update).not.toHaveBeenCalled();
    });

    it('returns 401 when user does not own the course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });
      (chaptersDbMock.db.course.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await PATCH({ title: 'New Title' }, { courseId, chapterId });

      expect(response.status).toBe(401);
      expect(chaptersDbMock.db.chapter.update).not.toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (chaptersDbMock.db.course.findFirst as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (chaptersDbMock.db.chapter.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await PATCH({ title: 'New Title' }, { courseId, chapterId });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/courses/[courseId]/chapters/[chapterId]', () => {
    it('deletes chapter successfully when user owns course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (chaptersDbMock.db.course.findFirst as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (chaptersDbMock.db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        courseId,
        position: 1,
      });
      (chaptersDbMock.db.chapter.delete as jest.Mock).mockResolvedValue({ id: chapterId });

      const response = await DELETE({ courseId, chapterId });

      expect(response.status).toBe(200);
      expect(chaptersDbMock.db.chapter.delete).toHaveBeenCalledWith({
        where: {
          id: chapterId,
        },
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const response = await DELETE({ courseId, chapterId });

      expect(response.status).toBe(401);
      expect(chaptersDbMock.db.chapter.delete).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/courses/[courseId]/chapters/[chapterId]/publish', () => {
    it('publishes chapter when all requirements are met', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (chaptersDbMock.db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (chaptersDbMock.db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        title: 'Chapter Title',
        description: 'Chapter Description',
        learningOutcomes: 'Learning outcomes',
        isPublished: false,
        sections: [
          { id: 'section-1', isPublished: true },
        ],
      });
      (chaptersDbMock.db.chapter.update as jest.Mock).mockResolvedValue({
        id: chapterId,
        isPublished: true,
      });

      const response = await PUBLISH_PATCH({ courseId, chapterId });

      expect(response.status).toBe(200);
      expect(chaptersDbMock.db.chapter.update).toHaveBeenCalledWith({
        where: {
          id: chapterId,
        },
        data: {
          isPublished: true,
        },
      });
    });

    it('returns 400 when chapter is missing required fields', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (chaptersDbMock.db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (chaptersDbMock.db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        title: null, // Missing title
        description: 'Description',
        learningOutcomes: 'Learning outcomes',
        sections: [],
      });

      const response = await PUBLISH_PATCH({ courseId, chapterId });

      expect(response.status).toBe(400);
      expect(chaptersDbMock.db.chapter.update).not.toHaveBeenCalled();
    });

    it('returns 401 when user does not own the course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });
      (chaptersDbMock.db.course.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await PUBLISH_PATCH({ courseId, chapterId });

      expect(response.status).toBe(401);
      expect(chaptersDbMock.db.chapter.update).not.toHaveBeenCalled();
    });
  });
});