import { GET, POST } from '@/app/api/auth/[...nextauth]/route';
import { handlers } from '@/auth';
import { NextRequest } from 'next/server';

describe('/api/auth/[...nextauth] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (handlers.GET as jest.Mock).mockResolvedValue(new Response('ok', { status: 200 }));
    (handlers.POST as jest.Mock).mockResolvedValue(new Response('created', { status: 201 }));
  });

  it('GET proxies handler response', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/session');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(handlers.GET).toHaveBeenCalled();
  });

  it('POST proxies handler response', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/callback', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(handlers.POST).toHaveBeenCalled();
  });

  it('captures and stores last auth error when GET fails', async () => {
    (handlers.GET as jest.Mock).mockRejectedValueOnce(new Error('nextauth get failed'));
    const req = new NextRequest('http://localhost:3000/api/auth/session');

    await expect(GET(req)).rejects.toThrow('nextauth get failed');
  });
});
