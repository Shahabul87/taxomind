/**
 * Tests for Prisma SAM Database Adapter
 * Source: lib/adapters/prisma-sam-adapter.ts
 */

import { PrismaSAMDatabaseAdapter, createPrismaSAMAdapter } from '@/lib/adapters/prisma-sam-adapter';
import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';

// Ensure missing models exist on the globally-mocked db
function ensureMockModel(name: string) {
  if (!(db as Record<string, unknown>)[name]) {
    (db as Record<string, unknown>)[name] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(() => Promise.resolve(0)),
      aggregate: jest.fn(),
    };
  }
}

// Use the globally mocked db as a PrismaClient stand-in
const mockPrisma = db as unknown as PrismaClient;

describe('PrismaSAMDatabaseAdapter', () => {
  let adapter: PrismaSAMDatabaseAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // The source uses sAMInteraction, studentBloomsProgress, etc.
    ensureMockModel('sAMInteraction');
    ensureMockModel('studentBloomsProgress');
    ensureMockModel('userLearningPattern');
    ensureMockModel('questionBank');
    ensureMockModel('courseBloomsAnalysis');
    ensureMockModel('section');
    adapter = new PrismaSAMDatabaseAdapter(mockPrisma);
  });

  // -------------------------------------------------------------------
  // User Operations
  // -------------------------------------------------------------------
  describe('findUser', () => {
    it('returns mapped SAMUser when found', async () => {
      const mockUser = {
        id: 'u1',
        name: 'Alice',
        email: 'alice@test.com',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
      };
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await adapter.findUser('u1');
      expect(result).toEqual({
        id: 'u1',
        name: 'Alice',
        email: 'alice@test.com',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
      });
    });

    it('returns null when user not found', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await adapter.findUser('missing');
      expect(result).toBeNull();
    });
  });

  describe('findUsers', () => {
    it('returns paginated list with limit and offset', async () => {
      (db.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'u1', name: 'A', email: 'a@t.com', role: null, createdAt: null },
      ]);

      const result = await adapter.findUsers({ name: 'A' }, { limit: 10, offset: 0 });
      expect(result).toHaveLength(1);
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 0 })
      );
    });
  });

  describe('updateUser', () => {
    it('updates and returns mapped user', async () => {
      const updated = { id: 'u1', name: 'Bob', email: 'bob@t.com', role: 'ADMIN', createdAt: new Date() };
      (db.user.update as jest.Mock).mockResolvedValue(updated);

      const result = await adapter.updateUser('u1', { name: 'Bob' });
      expect(result.name).toBe('Bob');
    });
  });

  // -------------------------------------------------------------------
  // Course Operations
  // -------------------------------------------------------------------
  describe('findCourse', () => {
    it('returns course without chapters by default', async () => {
      const course = {
        id: 'c1', title: 'Test', description: 'Desc',
        imageUrl: null, categoryId: null, userId: 'u1',
        isPublished: true, createdAt: new Date(), updatedAt: new Date(),
      };
      (db.course.findUnique as jest.Mock).mockResolvedValue(course);

      const result = await adapter.findCourse('c1');
      expect(result).toBeTruthy();
      expect(result?.title).toBe('Test');
    });

    it('returns null when course not found', async () => {
      (db.course.findUnique as jest.Mock).mockResolvedValue(null);
      expect(await adapter.findCourse('missing')).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // Interaction Logging
  // -------------------------------------------------------------------
  describe('logInteraction', () => {
    it('creates SAMInteraction and returns mapped log', async () => {
      const created = {
        id: 'int-1', userId: 'u1', createdAt: new Date(),
        duration: 500, context: {},
      };
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockResolvedValue(created);

      const result = await adapter.logInteraction({
        userId: 'u1',
        pageType: 'COURSE',
        pagePath: '/courses/1',
        query: 'help me',
        response: 'sure',
        enginesUsed: ['blooms'],
        responseTimeMs: 500,
        tokenCount: 100,
        sessionId: 's1',
        metadata: {},
      });

      expect(result.id).toBe('int-1');
      expect(samModel.create).toHaveBeenCalled();
    });
  });

  describe('findInteractions', () => {
    it('returns interactions for user with pagination', async () => {
      const interactions = [
        { id: 'i1', userId: 'u1', createdAt: new Date(), duration: 100, context: { query: 'q' } },
      ];
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.findMany.mockResolvedValue(interactions);

      const result = await adapter.findInteractions('u1', { limit: 5, offset: 0 });
      expect(result).toHaveLength(1);
      expect(samModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 0 })
      );
    });
  });

  // -------------------------------------------------------------------
  // Health Check
  // -------------------------------------------------------------------
  describe('healthCheck', () => {
    it('returns true on successful query', async () => {
      (db.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      expect(await adapter.healthCheck()).toBe(true);
    });

    it('returns false on query failure', async () => {
      (db.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection lost'));
      expect(await adapter.healthCheck()).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // Factory function
  // -------------------------------------------------------------------
  describe('createPrismaSAMAdapter', () => {
    it('creates an adapter implementing SAMDatabaseAdapter', () => {
      const newAdapter = createPrismaSAMAdapter(mockPrisma);
      expect(newAdapter).toBeDefined();
      expect(typeof newAdapter.findUser).toBe('function');
      expect(typeof newAdapter.logInteraction).toBe('function');
    });
  });
});
