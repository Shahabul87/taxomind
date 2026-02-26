jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/utils/sam-database', () => ({
  recordSAMInteraction: jest.fn(),
}));

import { POST } from '@/app/api/sam/interactions/route';
import { auth } from '@/auth';
import { recordSAMInteraction } from '@/lib/sam/utils/sam-database';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockRecordSAMInteraction = recordSAMInteraction as jest.Mock;

describe('/api/sam/interactions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockRecordSAMInteraction.mockResolvedValue({ id: 'i1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/interactions', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/interactions', {
      method: 'POST',
      body: JSON.stringify({ interactionType: 'CHAT' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('records interaction and returns success', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/interactions', {
      method: 'POST',
      body: JSON.stringify({ interactionType: 'CHAT', context: { topic: 'x' } }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockRecordSAMInteraction).toHaveBeenCalled();
  });
});
