jest.mock('@/lib/api/dev-only-guard', () => ({
  devOnlyGuard: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/blooms/demo-analyze/route';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';
import { currentUser } from '@/lib/auth';

const mockDevOnlyGuard = devOnlyGuard as jest.Mock;
const mockCurrentUser = currentUser as jest.Mock;

describe('/api/blooms/demo-analyze route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevOnlyGuard.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
  });

  it('returns blocked response when devOnlyGuard blocks request', async () => {
    mockDevOnlyGuard.mockReturnValueOnce(new Response('Blocked', { status: 403 }));

    const req = new Request('http://localhost:3000/api/blooms/demo-analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'This is enough content for validation checks here.' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid content', async () => {
    const req = new Request('http://localhost:3000/api/blooms/demo-analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'too short' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('returns blooms analysis payload on success', async () => {
    const req = new Request('http://localhost:3000/api/blooms/demo-analyze', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This explanation includes conceptual understanding and practical examples for learners.',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        dominantLevel: expect.any(String),
        confidence: expect.any(Number),
      })
    );
  });

  it('returns 500 when body parsing fails', async () => {
    const req = new Request('http://localhost:3000/api/blooms/demo-analyze', {
      method: 'POST',
      body: '{broken-json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(500);
  });
});
