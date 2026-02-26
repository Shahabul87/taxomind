import { GET, POST } from '@/app/api/accessibility/audit/route';
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

const accessibilityAccommodation = ensureModel('accessibilityAccommodation', ['findMany']);

describe('/api/accessibility/audit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    accessibilityAccommodation.findMany.mockResolvedValue([
      {
        id: 'acc-1',
        timeMultiplier: 1.5,
        breakInterval: 30,
        breakDuration: 5,
        fontSize: 'large',
        highContrast: true,
        colorBlindMode: false,
        screenReader: true,
        keyboardOnly: false,
        textToSpeech: true,
        signLanguage: false,
        brailleFormat: false,
        approvedAt: '2026-01-01T00:00:00.000Z',
        expiresAt: null,
      },
    ]);
    (db.exam.findUnique as jest.Mock).mockResolvedValue({ timeLimit: 60 });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/accessibility/audit', {
      method: 'POST',
      body: JSON.stringify({ content: 'Example content' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 on validation error', async () => {
    const req = new NextRequest('http://localhost:3000/api/accessibility/audit', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns accessibility audit result', async () => {
    const req = new NextRequest('http://localhost:3000/api/accessibility/audit', {
      method: 'POST',
      body: JSON.stringify({
        content: '<h1>Title</h1><p>Readable content with descriptive links.</p>',
        contentType: 'html',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        score: expect.any(Number),
        passed: expect.any(Boolean),
      })
    );
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/accessibility/audit');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns accommodations and time extension for exam', async () => {
    const req = new NextRequest('http://localhost:3000/api/accessibility/audit?examId=exam-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.accommodations).toHaveLength(1);
    expect(body.data.timeExtension.totalTime).toBeGreaterThan(60);
  });

  it('GET returns 500 when db query fails', async () => {
    accessibilityAccommodation.findMany.mockRejectedValueOnce(new Error('db down'));

    const req = new NextRequest('http://localhost:3000/api/accessibility/audit');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
