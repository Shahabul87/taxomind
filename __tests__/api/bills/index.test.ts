/**
 * Tests for Bills Route - app/api/bills/route.ts
 *
 * Covers: POST (create bill) - auth, validation, success, error
 *         GET (list bills) - auth, success, error
 */

// Mock @prisma/client with real enum values (needed by Zod nativeEnum in route)
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { POST, GET } from '@/app/api/bills/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

// Ensure bill and billPayment models exist in the db mock
if (!(db as Record<string, unknown>).bill) {
  (db as Record<string, unknown>).bill = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

if (!(db as Record<string, unknown>).billPayment) {
  (db as Record<string, unknown>).billPayment = {
    create: jest.fn(),
    findMany: jest.fn(),
  };
}

function createPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/bills', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createGetRequest() {
  return new Request('http://localhost:3000/api/bills', {
    method: 'GET',
  });
}

const VALID_BILL = {
  title: 'Electric Bill',
  category: 'UTILITY',
  amount: 150.50,
  currency: 'USD',
  startDate: '2026-02-01',
  dueDate: '2026-02-28',
  status: 'UNPAID',
  notifyBefore: 3,
  notifyEmail: true,
  notifySMS: false,
  autoPayEnabled: false,
};

describe('POST /api/bills', () => {
  beforeAll(() => {
    // Ensure crypto.randomUUID is available (jsdom environment may not have it)
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
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Re-initialize bill mock methods (resetMocks may clear implementations)
    if (!(db as Record<string, unknown>).bill) {
      (db as Record<string, unknown>).bill = {};
    }
    const bill = db.bill as Record<string, jest.Mock>;
    bill.create = jest.fn().mockResolvedValue({
      id: 'bill-1',
      ...VALID_BILL,
      userId: 'user-1',
    });
    bill.findMany = jest.fn().mockResolvedValue([]);
    bill.update = jest.fn().mockResolvedValue({});
    bill.delete = jest.fn().mockResolvedValue({});
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createPostRequest(VALID_BILL));

    expect(res.status).toBe(401);
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await POST(createPostRequest(VALID_BILL));

    expect(res.status).toBe(401);
  });

  it('creates a bill with valid data', async () => {
    const res = await POST(createPostRequest(VALID_BILL));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Electric Bill');
    expect(body.userId).toBe('user-1');
    expect((db.bill as Record<string, jest.Mock>).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Electric Bill',
          category: 'UTILITY',
          amount: 150.50,
          userId: 'user-1',
        }),
      })
    );
  });

  it('creates a bill with optional fields', async () => {
    const billWithOptionals = {
      ...VALID_BILL,
      description: 'Monthly electric bill',
      recurringType: 'MONTHLY',
      recurringPeriod: 1,
      provider: 'City Power Co.',
      website: 'https://citypower.com',
      notes: 'Auto-debit from checking',
    };

    const res = await POST(createPostRequest(billWithOptionals));

    expect(res.status).toBe(200);
    expect((db.bill as Record<string, jest.Mock>).create).toHaveBeenCalled();
  });

  it('returns 500 when title is missing (validation fails)', async () => {
    const invalidBill = { ...VALID_BILL };
    delete (invalidBill as Record<string, unknown>).title;

    const res = await POST(createPostRequest(invalidBill));

    expect(res.status).toBe(500);
  });

  it('returns 500 when amount is negative (validation fails)', async () => {
    const invalidBill = { ...VALID_BILL, amount: -10 };

    const res = await POST(createPostRequest(invalidBill));

    expect(res.status).toBe(500);
  });

  it('returns 500 when category is invalid', async () => {
    const invalidBill = { ...VALID_BILL, category: 'INVALID_CATEGORY' };

    const res = await POST(createPostRequest(invalidBill));

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error', async () => {
    (db.bill as Record<string, jest.Mock>).create.mockRejectedValue(
      new Error('Database connection lost')
    );

    const res = await POST(createPostRequest(VALID_BILL));

    expect(res.status).toBe(500);
  });
});

describe('GET /api/bills', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Re-initialize bill mock methods
    if (!(db as Record<string, unknown>).bill) {
      (db as Record<string, unknown>).bill = {};
    }
    (db.bill as Record<string, jest.Mock>).findMany = jest.fn().mockResolvedValue([
      {
        id: 'bill-1',
        title: 'Electric Bill',
        amount: 150.50,
        dueDate: new Date('2026-02-28'),
        BillAttachment: [],
        BillPayment: [],
      },
      {
        id: 'bill-2',
        title: 'Internet Bill',
        amount: 79.99,
        dueDate: new Date('2026-03-01'),
        BillAttachment: [],
        BillPayment: [{ paymentDate: new Date(), amount: 79.99 }],
      },
    ]);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest());

    expect(res.status).toBe(401);
  });

  it('returns all bills for the authenticated user', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe('Electric Bill');
    expect(body[1].title).toBe('Internet Bill');
  });

  it('queries bills with correct user filter and includes', async () => {
    await GET(createGetRequest());

    expect((db.bill as Record<string, jest.Mock>).findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        include: expect.objectContaining({
          BillAttachment: true,
          BillPayment: expect.objectContaining({
            orderBy: { paymentDate: 'desc' },
            take: 1,
          }),
        }),
        orderBy: { dueDate: 'asc' },
      })
    );
  });

  it('returns empty array when user has no bills', async () => {
    (db.bill as Record<string, jest.Mock>).findMany.mockResolvedValue([]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    (db.bill as Record<string, jest.Mock>).findMany.mockRejectedValue(
      new Error('Query timeout')
    );

    const res = await GET(createGetRequest());

    expect(res.status).toBe(500);
  });
});
