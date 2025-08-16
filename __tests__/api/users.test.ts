import { NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/users/[userId]/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

describe('/api/users/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/[userId]', () => {
    it('returns user data when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
      };

      (currentUser as jest.Mock).mockResolvedValue({ id: 'user-123' });
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = new Request('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { userId: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUser);
    });

    it('returns 401 when not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/users/user-123');
      const response = await GET(request, { params: { userId: 'user-123' } });

      expect(response.status).toBe(401);
    });

    it('returns 404 when user not found', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'user-123' });
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/users/user-999');
      const response = await GET(request, { params: { userId: 'user-999' } });

      expect(response.status).toBe(404);
    });

    it('returns 403 when accessing another user data without admin role', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'user-123', role: 'USER' });

      const request = new Request('http://localhost:3000/api/users/user-456');
      const response = await GET(request, { params: { userId: 'user-456' } });

      expect(response.status).toBe(403);
    });

    it('allows admin to access any user data', async () => {
      const mockTargetUser = {
        id: 'user-456',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'USER',
      };

      (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-123', role: 'ADMIN' });
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);

      const request = new Request('http://localhost:3000/api/users/user-456');
      const response = await GET(request, { params: { userId: 'user-456' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockTargetUser);
    });
  });

  describe('PUT /api/users/[userId]', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('updates user data when user updates own profile', async () => {
      const updatedUser = {
        id: 'user-123',
        ...updateData,
        role: 'USER',
      };

      (currentUser as jest.Mock).mockResolvedValue({ id: 'user-123', role: 'USER' });
      (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const request = new Request('http://localhost:3000/api/users/user-123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, { params: { userId: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(updatedUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
      });
    });

    it('returns 401 when not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/users/user-123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, { params: { userId: 'user-123' } });

      expect(response.status).toBe(401);
    });

    it('returns 403 when trying to update another user without admin role', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'user-123', role: 'USER' });

      const request = new Request('http://localhost:3000/api/users/user-456', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, { params: { userId: 'user-456' } });

      expect(response.status).toBe(403);
    });

    it('allows admin to update any user', async () => {
      const updatedUser = {
        id: 'user-456',
        ...updateData,
        role: 'USER',
      };

      (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-123', role: 'ADMIN' });
      (db.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const request = new Request('http://localhost:3000/api/users/user-456', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, { params: { userId: 'user-456' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(updatedUser);
    });

    it('handles database update errors', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'user-123', role: 'USER' });
      (db.user.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/users/user-123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, { params: { userId: 'user-123' } });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/users/[userId]', () => {
    it('returns 403 when non-admin tries to delete user', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'user-123', role: 'USER' });

      const request = new Request('http://localhost:3000/api/users/user-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: 'user-123' } });

      expect(response.status).toBe(403);
    });

    it('allows admin to delete user', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-123', role: 'ADMIN' });
      (db.user.delete as jest.Mock).mockResolvedValue({ id: 'user-456' });

      const request = new Request('http://localhost:3000/api/users/user-456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: 'user-456' } });

      expect(response.status).toBe(200);
      expect(db.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-456' },
      });
    });

    it('returns 401 when not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/users/user-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: 'user-123' } });

      expect(response.status).toBe(401);
    });

    it('handles database deletion errors', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'admin-123', role: 'ADMIN' });
      (db.user.delete as jest.Mock).mockRejectedValue(new Error('Cannot delete user with active courses'));

      const request = new Request('http://localhost:3000/api/users/user-456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { userId: 'user-456' } });

      expect(response.status).toBe(500);
    });
  });
});