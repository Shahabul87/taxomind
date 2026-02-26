jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/analytics/video-analytics/route';
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
  return model;
}

const course = ensureModel('course', ['findUnique']);
const video = ensureModel('video', ['findMany']);

describe('GET /api/analytics/video-analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    course.findUnique.mockResolvedValue({ id: 'course-1', userId: 'teacher-1' });
    video.findMany.mockResolvedValue([
      { id: 'v1', title: 'Video 1', duration: 600, url: 'https://video/1' },
      { id: 'v2', title: 'Video 2', duration: 900, url: 'https://video/2' },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/video-analytics?courseId=course-1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/video-analytics');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when course ownership check fails', async () => {
    course.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/video-analytics?courseId=course-1');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns all course video analytics when no videoId provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/video-analytics?courseId=course-1&timeRange=7d');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.videos)).toBe(true);
    expect(body.videos).toHaveLength(2);
    expect(body.videos[0]).toHaveProperty('totalViews');
  });

  it('returns single video analytics when videoId is provided', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/video-analytics?courseId=course-1&videoId=v1'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      totalViews: 0,
      averageWatchTime: 0,
      completionRate: 0,
    });
  });

  it('returns 500 on unexpected errors', async () => {
    video.findMany.mockRejectedValueOnce(new Error('db fail'));
    const req = new NextRequest('http://localhost:3000/api/analytics/video-analytics?courseId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch video analytics');
  });
});
