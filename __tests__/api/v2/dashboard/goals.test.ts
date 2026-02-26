jest.mock('@/lib/sam/taxomind-context', () => {
  const store = {
    getByUser: jest.fn(),
    create: jest.fn(),
  };
  return {
    __mockGoalStore: store,
    getStore: jest.fn(() => store),
  };
});

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/v2/dashboard/goals/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const { __mockGoalStore: mockGoalStore } = jest.requireMock('@/lib/sam/taxomind-context') as {
  __mockGoalStore: { getByUser: jest.Mock; create: jest.Mock };
};

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const course = ensureModel('course', ['findMany', 'findUnique']);
const subGoal = ensureModel('sAMSubGoal', ['findMany', 'createMany']);
const executionPlan = ensureModel('sAMExecutionPlan', ['findMany']);

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/v2/dashboard/goals${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/v2/dashboard/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('v2 goals route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    mockGoalStore.getByUser
      .mockResolvedValueOnce([
        {
          id: 'goal-1',
          title: 'Master TS',
          status: 'active',
          priority: 'high',
          progress: 35,
          targetDate: new Date('2026-03-20T00:00:00.000Z'),
          context: { courseId: 'course-1', chapterId: 'ch-1', sectionId: 'sec-1', topicIds: ['t1'], skillIds: ['sk1'] },
        },
      ])
      .mockResolvedValueOnce([
        { id: 'goal-1' },
        { id: 'goal-2' },
      ]);

    course.findMany.mockResolvedValue([{ id: 'course-1', title: 'Course 1', imageUrl: 'img.png' }]);
    course.findUnique.mockResolvedValue({ id: 'course-1', title: 'Course 1', imageUrl: 'img.png' });

    subGoal.findMany.mockResolvedValue([
      {
        id: 'sg-1',
        goalId: 'goal-1',
        title: 'Milestone 1',
        order: 0,
        status: 'PENDING',
        type: 'LEARN',
      },
    ]);
    subGoal.createMany.mockResolvedValue({ count: 2 });

    executionPlan.findMany.mockResolvedValue([
      { id: 'plan-1', goalId: 'goal-1', status: 'ACTIVE', overallProgress: 35 },
    ]);

    mockGoalStore.create.mockResolvedValue({
      id: 'goal-created',
      userId: 'user-1',
      title: 'Created Goal',
      status: 'draft',
      priority: 'medium',
      context: { courseId: 'course-1' },
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns enriched goals with pagination metadata', async () => {
    const res = await GET(getReq('status=active&priority=high&limit=1&page=2'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: 'goal-1',
      courseId: 'course-1',
      chapterId: 'ch-1',
      sectionId: 'sec-1',
    });
    expect(body.data[0].course.title).toBe('Course 1');
    expect(body.data[0].subGoals).toHaveLength(1);
    expect(body.data[0].plans).toHaveLength(1);
    expect(body.metadata.pagination).toEqual({
      total: 2,
      limit: 1,
      offset: 1,
      page: 2,
      hasMore: false,
    });
    expect(mockGoalStore.getByUser).toHaveBeenCalledTimes(2);
  });

  it('GET returns 400 for invalid query params', async () => {
    const res = await GET(getReq('status=not-valid'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('POST creates a goal and legacy milestones', async () => {
    const res = await POST(postReq({
      title: 'Created Goal',
      description: 'desc',
      priority: 'medium',
      courseId: 'course-1',
      targetDate: '2026-04-01T00:00:00.000Z',
      milestones: [
        { title: 'M1', targetDate: '2026-03-15T00:00:00.000Z' },
        { title: 'M2', targetDate: '2026-03-20T00:00:00.000Z' },
      ],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGoalStore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        title: 'Created Goal',
        context: expect.objectContaining({ courseId: 'course-1' }),
      })
    );
    expect(subGoal.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ goalId: 'goal-created', title: 'M1', order: 0 }),
        expect.objectContaining({ goalId: 'goal-created', title: 'M2', order: 1 }),
      ],
    });
    expect(body.data.course.title).toBe('Course 1');
  });

  it('POST returns 400 for invalid input', async () => {
    const res = await POST(postReq({ title: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid input');
  });

  it('POST returns 500 on unexpected errors', async () => {
    mockGoalStore.create.mockRejectedValueOnce(new Error('store fail'));

    const res = await POST(postReq({ title: 'Created Goal' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to create goal');
  });
});
