jest.mock('@prisma/client', () => ({
  AchievementType: {
    CHAPTER_COMPLETION: 'CHAPTER_COMPLETION',
    STUDY_STREAK: 'STUDY_STREAK',
    PERFECT_QUIZ: 'PERFECT_QUIZ',
    SKILL_MASTERY: 'SKILL_MASTERY',
    THOROUGH_LEARNER: 'THOROUGH_LEARNER',
    COURSE_COMPLETION: 'COURSE_COMPLETION',
    CONSISTENT_LEARNER: 'CONSISTENT_LEARNER',
    TIME_MILESTONE: 'TIME_MILESTONE',
    FAST_LEARNER: 'FAST_LEARNER',
  },
  BadgeLevel: {
    BRONZE: 'BRONZE',
    SILVER: 'SILVER',
    GOLD: 'GOLD',
    PLATINUM: 'PLATINUM',
  },
}));

import { GET } from '@/app/api/courses/[courseId]/achievements/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model as Record<string, jest.Mock>;
}

const userAchievements = ensureModel('user_achievements', ['findMany', 'createMany']);
const userProgress = ensureModel('user_progress', ['findMany']);
const chapter = ensureModel('chapter', ['findMany']);
const studyStreaks = ensureModel('study_streaks', ['findFirst']);

describe('GET /api/courses/[courseId]/achievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    userAchievements.findMany.mockResolvedValue([]);
    userAchievements.createMany.mockResolvedValue({ count: 1 });
    userProgress.findMany.mockResolvedValue([
      { isCompleted: true, timeSpent: 3600 },
      { isCompleted: true, timeSpent: 2400 },
    ]);
    chapter.findMany.mockResolvedValue([
      { sections: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] },
    ]);
    studyStreaks.findFirst.mockResolvedValue({ currentStreak: 3, longestStreak: 5 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/achievements'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid params', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses//achievements'),
      { params: Promise.resolve({ courseId: '' }) }
    );

    expect(res.status).toBe(400);
  });

  it('returns achievements payload and persists newly unlocked achievements', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/achievements'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.achievements)).toBe(true);
    expect(body.data.totalCount).toBeGreaterThan(0);
    expect(userAchievements.createMany).toHaveBeenCalled();
  });
});
