/**
 * Tests for Bill Detail Route - app/api/bills/[billId]/route.ts
 *
 * Covers: PATCH (update bill) - auth, validation, success, error
 *         DELETE (delete bill) - auth, success, error
 */

// Mock @prisma/client with real enum values (needed by Zod nativeEnum in route)
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked in jest.setup.js

import { PATCH, DELETE } from '@/app/api/bills/[billId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

// Ensure bill model exists in the db mock
if (!(db as Record<string, unknown>).bill) {
  (db as Record<string, unknown>).bill = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function createPatchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/bills/bill-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeleteRequest() {
  return new Request('http://localhost:3000/api/bills/bill-1', {
    method: 'DELETE',
  });
}

function createParams(billId = 'bill-1') {
  return { params: Promise.resolve({ billId }) };
}

describe('PATCH /api/bills/[billId]', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    (db.bill as Record<string, jest.Mock>).update.mockResolvedValue({
      id: 'bill-1',
      title: 'Updated Electric Bill',
      amount: 175.00,
      userId: 'user-1',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(
      createPatchRequest({ title: 'Updated Bill' }),
      createParams()
    );

    expect(res.status).toBe(401);
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await PATCH(
      createPatchRequest({ title: 'Updated Bill' }),
      createParams()
    );

    expect(res.status).toBe(401);
  });

  it('updates a bill with valid partial data', async () => {
    const res = await PATCH(
      createPatchRequest({ title: 'Updated Electric Bill', amount: 175.00 }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Updated Electric Bill');
    expect((db.bill as Record<string, jest.Mock>).update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'bill-1',
          userId: 'user-1',
        },
        data: expect.objectContaining({
          title: 'Updated Electric Bill',
          amount: 175.00,
        }),
      })
    );
  });

  it('updates bill status to PAID', async () => {
    (db.bill as Record<string, jest.Mock>).update.mockResolvedValue({
      id: 'bill-1',
      status: 'PAID',
      userId: 'user-1',
    });

    const res = await PATCH(
      createPatchRequest({ status: 'PAID' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('PAID');
  });

  it('updates bill with optional nullable fields', async () => {
    const res = await PATCH(
      createPatchRequest({
        description: null,
        recurringType: 'MONTHLY',
        provider: 'New Provider',
        website: 'https://example.com',
      }),
      createParams()
    );

    expect(res.status).toBe(200);
  });

  it('returns 500 when validation fails with extra unknown fields (strict schema)', async () => {
    const res = await PATCH(
      createPatchRequest({ unknownField: 'something' }),
      createParams()
    );

    expect(res.status).toBe(500);
  });

  it('returns 500 when amount is negative', async () => {
    const res = await PATCH(
      createPatchRequest({ amount: -50 }),
      createParams()
    );

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error', async () => {
    (db.bill as Record<string, jest.Mock>).update.mockRejectedValue(
      new Error('Record not found')
    );

    const res = await PATCH(
      createPatchRequest({ title: 'Updated' }),
      createParams()
    );

    expect(res.status).toBe(500);
  });

  it('uses the billId from route params', async () => {
    await PATCH(
      createPatchRequest({ title: 'Test' }),
      createParams('bill-custom-id')
    );

    expect((db.bill as Record<string, jest.Mock>).update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'bill-custom-id',
        }),
      })
    );
  });
});

describe('DELETE /api/bills/[billId]', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    (db.bill as Record<string, jest.Mock>).delete.mockResolvedValue({
      id: 'bill-1',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(createDeleteRequest(), createParams());

    expect(res.status).toBe(401);
  });

  it('deletes a bill successfully', async () => {
    const res = await DELETE(createDeleteRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect((db.bill as Record<string, jest.Mock>).delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'bill-1',
          userId: 'user-1',
        },
      })
    );
  });

  it('scopes deletion to the authenticated user', async () => {
    await DELETE(createDeleteRequest(), createParams('bill-xyz'));

    expect((db.bill as Record<string, jest.Mock>).delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'bill-xyz',
          userId: 'user-1',
        },
      })
    );
  });

  it('returns 500 when bill does not exist or does not belong to user', async () => {
    (db.bill as Record<string, jest.Mock>).delete.mockRejectedValue(
      new Error('Record to delete does not exist')
    );

    const res = await DELETE(createDeleteRequest(), createParams());

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error', async () => {
    (db.bill as Record<string, jest.Mock>).delete.mockRejectedValue(
      new Error('Database error')
    );

    const res = await DELETE(createDeleteRequest(), createParams());

    expect(res.status).toBe(500);
  });
});
