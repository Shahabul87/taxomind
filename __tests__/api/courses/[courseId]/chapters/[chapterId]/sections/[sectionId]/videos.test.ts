/**
 * Tests for Section Videos Route - app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/videos/route.ts
 */

jest.unmock('zod');

jest.mock('@prisma/client', () => ({
  VideoAccessTier: {
    ENROLLED: 'ENROLLED',
    PUBLIC: 'PUBLIC',
    PREVIEW: 'PREVIEW',
  },
}));

import { GET, PATCH, POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/videos/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

if (!(db as Record<string, unknown>).video) {
  (db as Record<string, unknown>).video = {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
}

function props(courseId = 'course-1', chapterId = 'chapter-1', sectionId = 'section-1') {
  return { params: Promise.resolve({ courseId, chapterId, sectionId }) };
}

function postRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function patchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1/videos', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Section Videos Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.section.findUnique as jest.Mock).mockResolvedValue({ id: 'section-1' });
    (db.video.create as jest.Mock).mockResolvedValue({ id: 'video-1', title: 'Intro video' });
    (db.video.findFirst as jest.Mock).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' });
    (db.video.update as jest.Mock).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', accessTier: 'PUBLIC' });
    (db.video.findMany as jest.Mock).mockResolvedValue([{ id: 'video-1', position: 0 }]);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(postRequest({ title: 'Video', videoUrl: 'https://youtu.be/x' }) as never, props());
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid URL', async () => {
    const res = await POST(postRequest({ title: 'Video', videoUrl: 'not-a-url' }) as never, props());
    expect(res.status).toBe(400);
  });

  it('POST returns 404 when section is missing', async () => {
    (db.section.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(postRequest({ title: 'Video', videoUrl: 'https://example.com/video.mp4' }) as never, props());
    expect(res.status).toBe(404);
  });

  it('POST creates video with valid payload', async () => {
    const res = await POST(postRequest({
      title: 'Video',
      videoUrl: 'https://example.com/video.mp4',
      accessTier: 'ENROLLED',
    }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('video-1');
    expect(db.video.create).toHaveBeenCalled();
  });

  it('PATCH returns 404 when video is not found', async () => {
    (db.video.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(
      patchRequest({
        videoId: '550e8400-e29b-41d4-a716-446655440000',
        accessTier: 'PUBLIC',
      }) as never,
      props()
    );
    expect(res.status).toBe(404);
  });

  it('GET returns section videos', async () => {
    const res = await GET(new Request('http://localhost') as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });
});
