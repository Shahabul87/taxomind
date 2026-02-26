import { GET, POST } from '@/app/api/cat/item/route';
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

const cATSession = ensureModel('cATSession', ['findFirst', 'update']);
const cATItem = ensureModel('cATItem', ['findMany', 'findUnique', 'update']);
const cATResponse = ensureModel('cATResponse', ['create']);

describe('/api/cat/item route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    cATSession.findFirst.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      itemBankId: 'bank-1',
      status: 'IN_PROGRESS',
      responses: [],
      currentTheta: 0,
      currentSE: 1.5,
      itemsAdministered: 0,
      correctResponses: 0,
      startTime: new Date('2026-03-01T00:00:00.000Z'),
    });
    cATItem.findMany.mockResolvedValue([]);
    cATItem.findUnique.mockResolvedValue(null);
    (db.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', text: 'Q', Answer: [] });
    cATResponse.create.mockResolvedValue({ id: 'r1' });
    cATSession.update.mockResolvedValue({});
    cATItem.update.mockResolvedValue({});
  });

  it('GET returns 400 when sessionId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/cat/item');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns 404 when active session is not found', async () => {
    cATSession.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/cat/item?sessionId=session-1');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it('GET returns complete when no items are available', async () => {
    const req = new NextRequest('http://localhost:3000/api/cat/item?sessionId=session-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.complete).toBe(true);
  });

  it('POST returns 400 on invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/cat/item', {
      method: 'POST',
      body: JSON.stringify({ sessionId: '', itemId: '', response: 3, responseTime: -1 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('POST returns 404 when item is not found', async () => {
    const req = new NextRequest('http://localhost:3000/api/cat/item', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'session-1', itemId: 'missing-item', response: 1, responseTime: 20 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });
});
