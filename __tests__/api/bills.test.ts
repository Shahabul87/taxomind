jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
}));

import { GET, POST } from '@/app/api/bills/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

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

const bill = ensureModel('bill', ['create', 'findMany']);

describe('/api/bills route', () => {
  beforeAll(() => {
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      if (!globalThis.crypto) {
        globalThis.crypto = {} as Crypto;
      }
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    bill.create.mockResolvedValue({ id: 'bill-1', title: 'Rent', userId: 'user-1' });
    bill.findMany.mockResolvedValue([{ id: 'bill-1', title: 'Rent' }]);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Rent' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST creates bill with valid payload', async () => {
    const req = new Request('http://localhost:3000/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Rent',
        category: 'RENT',
        amount: 1200,
        currency: 'USD',
        startDate: '2026-02-01',
        dueDate: '2026-03-01',
        status: 'UNPAID',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('bill-1');
    expect(bill.create).toHaveBeenCalled();
  });

  it('GET returns bills for authenticated user', async () => {
    const res = await GET(new Request('http://localhost:3000/api/bills'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(bill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );
  });

  it('GET returns 500 on query failure', async () => {
    bill.findMany.mockRejectedValueOnce(new Error('db down'));

    const res = await GET(new Request('http://localhost:3000/api/bills'));
    expect(res.status).toBe(500);
  });
});
