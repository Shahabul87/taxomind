jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/cron/task-reminders/route';
import { withCronAuth } from '@/lib/api/cron-auth';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const mockWithCronAuth = withCronAuth as jest.Mock;
const mockDb = db as Record<string, any>;
const mockSendEmail = sendEmail as jest.Mock;
const mockLogger = logger as unknown as { error: jest.Mock };

describe('/api/cron/task-reminders route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithCronAuth.mockReturnValue(null);

    // @/lib/db is globally mapped to __mocks__/db.js; add task model for this route.
    mockDb.task = {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    };
  });

  it('returns auth response when cron auth blocks', async () => {
    mockWithCronAuth.mockReturnValueOnce(new NextResponse('forbidden', { status: 403 }));

    const req = new NextRequest('http://localhost:3000/api/cron/task-reminders');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('processes due reminders and batch-updates successful task ids', async () => {
    const now = new Date();
    mockDb.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        userId: 'user-1',
        title: 'Finish chapter',
        description: 'Read chapter 3',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: now,
        User: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      },
      {
        id: 'task-2',
        userId: 'user-2',
        title: 'Review notes',
        description: null,
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: now,
        User: { id: 'user-2', name: 'Bob', email: null },
      },
    ]);
    mockSendEmail.mockResolvedValue(undefined);
    mockDb.task.updateMany.mockResolvedValue({ count: 2 });

    const req = new NextRequest('http://localhost:3000/api/cron/task-reminders');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.processed).toBe(2);
    expect(body.results).toHaveLength(2);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockDb.task.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['task-1', 'task-2'] } },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it('marks reminder as error when email sending fails for a task', async () => {
    const now = new Date();
    mockDb.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        userId: 'user-1',
        title: 'Finish chapter',
        description: null,
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: now,
        User: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      },
    ]);
    mockSendEmail.mockRejectedValue(new Error('smtp down'));
    mockDb.task.updateMany.mockResolvedValue({ count: 0 });

    const req = new NextRequest('http://localhost:3000/api/cron/task-reminders');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results[0]).toEqual(
      expect.objectContaining({
        taskId: 'task-1',
        status: 'error',
        error: 'smtp down',
      }),
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('returns 500 when top-level processing fails', async () => {
    mockDb.task.findMany.mockRejectedValue(new Error('db failed'));

    const req = new NextRequest('http://localhost:3000/api/cron/task-reminders');
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(await res.text()).toBe('Internal Error');
  });
});
