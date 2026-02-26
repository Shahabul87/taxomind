/**
 * Tests for Study Plan Tasks Route - app/api/dashboard/study-plan-tasks/route.ts
 */

import { GET } from '@/app/api/dashboard/study-plan-tasks/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).sAMLearningGoal) {
  (db as Record<string, unknown>).sAMLearningGoal = {
    findMany: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).sAMLearningGoal;
  if (!model.findMany) model.findMany = jest.fn();
}

if (!(db as Record<string, unknown>).sAMSubGoal) {
  (db as Record<string, unknown>).sAMSubGoal = {
    findMany: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).sAMSubGoal;
  if (!model.findMany) model.findMany = jest.fn();
}

const mockLearningGoal = (db as Record<string, any>).sAMLearningGoal;
const mockSubGoal = (db as Record<string, any>).sAMSubGoal;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/study-plan-tasks${query ? `?${query}` : ''}`);
}

describe('Study plan tasks route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockLearningGoal.findMany.mockResolvedValue([
      { id: 'g1', title: 'Plan A', metadata: { planType: 'study_plan' } },
      { id: 'g2', title: 'Other Goal', metadata: { planType: 'something_else' } },
    ]);
    mockSubGoal.findMany.mockResolvedValue([
      {
        id: 'sg1',
        goalId: 'g1',
        title: 'Task A',
        status: 'COMPLETED',
        type: 'STUDY',
        estimatedMinutes: 45,
        difficulty: 'easy',
        completedAt: new Date('2026-03-01T10:00:00.000Z'),
        metadata: {
          scheduledDate: '2026-03-01',
          dayNumber: 2,
          weekNumber: 1,
          weekTitle: 'Week 1',
          taskType: 'study',
        },
        order: 1,
      },
      {
        id: 'sg2',
        goalId: 'g1',
        title: 'Task B',
        status: 'PENDING',
        type: 'STUDY',
        estimatedMinutes: 30,
        difficulty: 'medium',
        completedAt: null,
        metadata: { scheduledDate: '2026-03-02' },
        order: 2,
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns tasks scheduled for provided date', async () => {
    const res = await GET(req('date=2026-03-01'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('sg1');
    expect(body.meta.total).toBe(1);
    expect(body.meta.studyPlanCount).toBe(1);
  });

  it('returns 500 when query fails', async () => {
    mockLearningGoal.findMany.mockRejectedValue(new Error('db fail'));

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch study plan tasks');
  });
});

