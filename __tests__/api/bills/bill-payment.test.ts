/**
 * Tests for Bill Payment Route - app/api/bills/[billId]/payment/route.ts
 *
 * Covers: auth (401), payment creation, bill status update,
 * error handling (500), data shape
 */

// @/auth, @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { POST } from '@/app/api/bills/[billId]/payment/route';
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

function createPaymentRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/bills/bill-1/payment', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createParams(billId = 'bill-1') {
  return { params: Promise.resolve({ billId }) };
}

const VALID_PAYMENT = {
  amount: 150.50,
  method: 'credit_card',
  reference: 'TXN-12345',
};

describe('POST /api/bills/[billId]/payment', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    (db.billPayment as Record<string, jest.Mock>).create.mockResolvedValue({
      id: 'payment-123456',
      ...VALID_PAYMENT,
      paymentDate: new Date('2026-02-25'),
      status: 'successful',
      billId: 'bill-1',
    });

    (db.bill as Record<string, jest.Mock>).update.mockResolvedValue({
      id: 'bill-1',
      status: 'PAID',
      lastPaidAmount: 150.50,
      lastPaidDate: new Date('2026-02-25'),
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createPaymentRequest(VALID_PAYMENT), createParams());

    expect(res.status).toBe(401);
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await POST(createPaymentRequest(VALID_PAYMENT), createParams());

    expect(res.status).toBe(401);
  });

  it('creates a payment record and updates bill status', async () => {
    const res = await POST(createPaymentRequest(VALID_PAYMENT), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.amount).toBe(150.50);
    expect(body.method).toBe('credit_card');
    expect(body.status).toBe('successful');

    // Verify payment record creation
    expect((db.billPayment as Record<string, jest.Mock>).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 150.50,
          method: 'credit_card',
          reference: 'TXN-12345',
          status: 'successful',
          billId: 'bill-1',
        }),
      })
    );

    // Verify bill status update
    expect((db.bill as Record<string, jest.Mock>).update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'bill-1',
          userId: 'user-1',
        },
        data: expect.objectContaining({
          status: 'PAID',
          lastPaidAmount: 150.50,
        }),
      })
    );
  });

  it('uses the billId from route params for payment creation', async () => {
    await POST(createPaymentRequest(VALID_PAYMENT), createParams('bill-custom-99'));

    expect((db.billPayment as Record<string, jest.Mock>).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          billId: 'bill-custom-99',
        }),
      })
    );

    expect((db.bill as Record<string, jest.Mock>).update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'bill-custom-99',
        }),
      })
    );
  });

  it('scopes bill update to the authenticated user', async () => {
    await POST(createPaymentRequest(VALID_PAYMENT), createParams());

    expect((db.bill as Record<string, jest.Mock>).update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
        }),
      })
    );
  });

  it('creates payment without optional reference', async () => {
    const paymentNoRef = { amount: 100, method: 'bank_transfer' };

    const res = await POST(createPaymentRequest(paymentNoRef), createParams());

    expect(res.status).toBe(200);
    expect((db.billPayment as Record<string, jest.Mock>).create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 100,
          method: 'bank_transfer',
        }),
      })
    );
  });

  it('returns 500 when payment creation fails', async () => {
    (db.billPayment as Record<string, jest.Mock>).create.mockRejectedValue(
      new Error('Database write error')
    );

    const res = await POST(createPaymentRequest(VALID_PAYMENT), createParams());

    expect(res.status).toBe(500);
  });

  it('returns 500 when bill update fails', async () => {
    (db.bill as Record<string, jest.Mock>).update.mockRejectedValue(
      new Error('Bill not found')
    );

    const res = await POST(createPaymentRequest(VALID_PAYMENT), createParams());

    expect(res.status).toBe(500);
  });

  it('sets paymentDate to current date on creation', async () => {
    const before = new Date();
    await POST(createPaymentRequest(VALID_PAYMENT), createParams());
    const after = new Date();

    const createCall = (db.billPayment as Record<string, jest.Mock>).create.mock.calls[0][0];
    const paymentDate = new Date(createCall.data.paymentDate);

    expect(paymentDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(paymentDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('generates a unique payment id with timestamp prefix', async () => {
    await POST(createPaymentRequest(VALID_PAYMENT), createParams());

    const createCall = (db.billPayment as Record<string, jest.Mock>).create.mock.calls[0][0];
    expect(createCall.data.id).toMatch(/^payment-\d+$/);
  });
});
