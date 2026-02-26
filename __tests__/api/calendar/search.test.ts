import { GET } from '@/app/api/calendar/search/route';
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

const calendarEvent = ensureModel('calendarEvent', ['findMany']);

describe('/api/calendar/search route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    calendarEvent.findMany.mockResolvedValue([{ id: 'ev-1', title: 'Session' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/calendar/search?query=test');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns matched events', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/search?query=Session');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].id).toBe('ev-1');
  });
});
