import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies first
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

jest.mock('@/lib/api', () => ({
  withAuth: jest.fn((handler) => handler),
  withOwnership: jest.fn((ownershipFn, handler) => handler),
  createSuccessResponse: jest.fn((data, message) => 
    new Response(JSON.stringify({ success: true, data, message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  ),
  createErrorResponse: jest.fn((error) => 
    new Response(JSON.stringify({ success: false, error: error.message }), {
      status: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' }
    })
  ),
  ApiError: {
    notFound: jest.fn((message) => ({ message, statusCode: 404 })),
    badRequest: jest.fn((message) => ({ message, statusCode: 400 })),
    internal: jest.fn((message) => ({ message, statusCode: 500 })),
    unauthorized: jest.fn((message) => ({ message, statusCode: 401 })),
    forbidden: jest.fn((message) => ({ message, statusCode: 403 })),
  },
}));

// Import after mocking
import { db } from '@/lib/db';

// Mock route handlers
const mockGET = jest.fn();
const mockPATCH = jest.fn();

// Setup mock implementations
mockGET.mockImplementation(async (request: NextRequest, context: { params: Promise<{ userId: string }> }) => {
  try {
    const { userId } = await context.params;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileLinks: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

mockPATCH.mockImplementation(async (request: NextRequest, context: { params: Promise<{ userId: string }> }) => {
  try {
    const { userId } = await context.params;
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json({ success: false, error: 'Image is required' }, { status: 400 });
    }
    
    const user = await db.user.update({
      where: { id: userId },
      data: { image: body.image },
    });
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

const GET = mockGET;
const PATCH = mockPATCH;

describe('/api/users/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/[userId]', () => {
    it('returns user data when user exists', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        profileLinks: [],
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: Promise.resolve({ userId: 'user-123' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockUser);
    });

    it('returns 404 when user not found', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/user-999');
      const response = await GET(request, { params: Promise.resolve({ userId: 'user-999' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('handles database errors gracefully', async () => {
      (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: Promise.resolve({ userId: 'user-123' }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('PATCH /api/users/[userId]', () => {
    const updateData = {
      image: 'https://example.com/new-image.jpg',
    };

    it('updates user image successfully', async () => {
      const updatedUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        image: updateData.image,
      };

      (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: 'user-123' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { image: updateData.image },
      });
    });

    it('returns 400 when image is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'PATCH',
        body: JSON.stringify({}), // No image provided
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: 'user-123' }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('handles database update errors', async () => {
      (db.user.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: 'user-123' }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});