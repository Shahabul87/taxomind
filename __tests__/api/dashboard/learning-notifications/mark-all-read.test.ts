/**
 * Tests for Learning Notifications Mark-All-Read Route - app/api/dashboard/learning-notifications/mark-all-read/route.ts
 */

import { POST } from '@/app/api/dashboard/learning-notifications/mark-all-read/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningNotification) {
  (db as Record<string, unknown>).learningNotification = {
    updateMany: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).learningNotification;
  if (!model.updateMany) model.updateMany = jest.fn();
}

const mockLearningNotification = (db as Record<string, any>).learningNotification;

describe('Learning notifications mark-all-read route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockLearningNotification.updateMany.mockResolvedValue({ count: 3 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('marks all unread notifications as read', async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.updated).toBe(3);
    expect(mockLearningNotification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        read: false,
        dismissed: false,
      },
      data: expect.objectContaining({
        read: true,
        readAt: expect.any(Date),
      }),
    });
  });

  it('returns 500 on unexpected db errors', async () => {
    mockLearningNotification.updateMany.mockRejectedValue(new Error('db fail'));

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

