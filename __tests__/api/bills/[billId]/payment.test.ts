jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/bills/[billId]/payment/route';
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

const billPayment = ensureModel('billPayment', ['create']);
const bill = ensureModel('bill', ['update']);

describe('/api/bills/[billId]/payment route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    billPayment.create.mockResolvedValue({ id: 'payment-1', status: 'successful' });
    bill.update.mockResolvedValue({ id: 'b1', status: 'PAID' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/bills/b1/payment', {
      method: 'POST',
      body: JSON.stringify({ amount: 100, method: 'CARD', reference: 'ref' }),
    });
    const res = await POST(req, { params: Promise.resolve({ billId: 'b1' }) });
    expect(res.status).toBe(401);
  });

  it('creates payment and marks bill as paid', async () => {
    const req = new NextRequest('http://localhost:3000/api/bills/b1/payment', {
      method: 'POST',
      body: JSON.stringify({ amount: 100, method: 'CARD', reference: 'ref' }),
    });
    const res = await POST(req, { params: Promise.resolve({ billId: 'b1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('payment-1');
    expect(billPayment.create).toHaveBeenCalled();
    expect(bill.update).toHaveBeenCalled();
  });
});
