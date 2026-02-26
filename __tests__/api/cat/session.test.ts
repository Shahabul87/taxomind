import { GET, POST } from '@/app/api/cat/session/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  const dbRecord = db as Record<string, Record<string, jest.Mock> | undefined>;
  if (!dbRecord[modelName]) {
    dbRecord[modelName] = {} as Record<string, jest.Mock>;
  }
  for (const method of methods) {
    if (!(dbRecord[modelName] as Record<string, jest.Mock>)[method]) {
      (dbRecord[modelName] as Record<string, jest.Mock>)[method] = jest.fn();
    }
  }
  return dbRecord[modelName] as Record<string, jest.Mock>;
}

const cATSession = ensureModel('cATSession', ['findFirst', 'create']);
const cATItemBank = ensureModel('cATItemBank', ['findUnique']);

describe('/api/cat/session route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    cATSession.findFirst.mockResolvedValue(null);
    cATItemBank.findUnique.mockResolvedValue({ id: 'bank-1', _count: { items: 20 } });
    cATSession.create.mockResolvedValue({
      id: 'session-1',
      status: 'IN_PROGRESS',
      currentTheta: 0,
      currentSE: 1.5,
      itemsAdministered: 0,
      startTime: new Date('2026-03-01T00:00:00.000Z'),
    });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/cat/session', {
      method: 'POST',
      body: JSON.stringify({ examId: 'exam-1', itemBankId: 'bank-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('POST returns existing active session when present', async () => {
    cATSession.findFirst.mockResolvedValueOnce({
      id: 'session-existing',
      currentTheta: 0.5,
      currentSE: 1.1,
      itemsAdministered: 5,
    });

    const req = new NextRequest('http://localhost:3000/api/cat/session', {
      method: 'POST',
      body: JSON.stringify({ examId: 'exam-1', itemBankId: 'bank-1' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sessionId).toBe('session-existing');
  });

  it('POST returns 404 when item bank is not found', async () => {
    cATItemBank.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/cat/session', {
      method: 'POST',
      body: JSON.stringify({ examId: 'exam-1', itemBankId: 'missing-bank' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('GET returns 400 when sessionId query is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/cat/session');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns 404 when session is not found', async () => {
    cATSession.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/cat/session?sessionId=unknown');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });
});
