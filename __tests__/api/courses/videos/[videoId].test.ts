jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/courses/videos/[videoId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

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

const video = ensureModel('video', ['findUnique']);

describe('/api/courses/videos/[videoId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    video.findUnique.mockResolvedValue({ id: 'v1', title: 'Intro video' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/videos/v1');
    const res = await GET(req, { params: Promise.resolve({ videoId: 'v1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when video does not exist', async () => {
    video.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/videos/missing');
    const res = await GET(req, { params: Promise.resolve({ videoId: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('returns video details for valid id', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/videos/v1');
    const res = await GET(req, { params: Promise.resolve({ videoId: 'v1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('v1');
  });
});
