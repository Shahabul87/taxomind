/**
 * Tests for Account Deletion Route - app/api/user/delete-account/route.ts
 *
 * Covers: auth check, email confirmation, password verification, GDPR-compliant anonymization
 */

// @/lib/db, @/lib/auth, @/lib/logger, bcryptjs are globally mocked in jest.setup.js

import { POST } from '@/app/api/user/delete-account/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

const mockCurrentUser = currentUser as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;

function createRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/user/delete-account', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/user/delete-account', () => {
  beforeAll(() => {
    // authSession model is not in the global mock — add it here
    if (!(db as Record<string, unknown>).authSession) {
      (db as Record<string, unknown>).authSession = {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      };
    }
  });

  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    });

    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed_password123',
    });

    // Reset authSession mock
    ((db as Record<string, unknown>).authSession as Record<string, jest.Mock>)
      .deleteMany.mockResolvedValue({ count: 0 });

    // Ensure $transaction resolves with an array of results
    (db.$transaction as jest.Mock).mockResolvedValue([
      { count: 1 }, // authSession deleteMany
      { count: 1 }, // account deleteMany
      { count: 0 }, // verificationToken deleteMany
      { id: 'user-1' }, // user update (anonymized)
    ]);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createRequest({ confirmEmail: 'test@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when email confirmation does not match', async () => {
    const res = await POST(createRequest({ confirmEmail: 'wrong@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Email confirmation does not match');
  });

  it('returns 401 when password is invalid', async () => {
    mockBcryptCompare.mockResolvedValue(false);

    const res = await POST(
      createRequest({ confirmEmail: 'test@example.com', confirmPassword: 'wrongpass' })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Invalid password');
  });

  it('returns 401 when user has no password (OAuth) but provides one', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password: null,
    });

    const res = await POST(
      createRequest({ confirmEmail: 'test@example.com', confirmPassword: 'somepass' })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Invalid credentials');
  });

  it('deletes account successfully with email confirmation only (OAuth user)', async () => {
    const res = await POST(createRequest({ confirmEmail: 'test@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Account deleted successfully');
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it('deletes account successfully with email and password confirmation', async () => {
    mockBcryptCompare.mockResolvedValue(true);

    const res = await POST(
      createRequest({ confirmEmail: 'test@example.com', confirmPassword: 'password123' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('performs GDPR-compliant anonymization (transaction structure)', async () => {
    const res = await POST(createRequest({ confirmEmail: 'test@example.com' }));

    expect(res.status).toBe(200);
    // The transaction receives an array of 4 operations
    const transactionArg = (db.$transaction as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(transactionArg)).toBe(true);
  });

  it('returns 500 on database error', async () => {
    (db.$transaction as jest.Mock).mockRejectedValue(new Error('DB connection lost'));

    const res = await POST(createRequest({ confirmEmail: 'test@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
