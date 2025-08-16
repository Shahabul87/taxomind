import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/users/[userId]/route';

// Mock dependencies
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

import { db } from '@/lib/db';

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