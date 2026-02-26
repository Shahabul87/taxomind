/**
 * Tests for Register Route - app/api/register/route.ts
 */

jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn(),
}));

jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: jest.fn(),
}));

jest.mock('@/lib/passwordUtils', () => ({
  hashPassword: jest.fn(),
}));

import { POST } from '@/app/api/register/route';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/passwordUtils';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';

const mockHashPassword = hashPassword as jest.Mock;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;

function req(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'StrongPass1!',
  acceptTermsAndPrivacy: true,
};

describe('Register route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    (db.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    });
    mockHashPassword.mockResolvedValue('hashed-password');
    mockGenerateVerificationToken.mockResolvedValue({
      email: 'john@example.com',
      token: 'verify-token',
    });
    mockSendVerificationEmail.mockResolvedValue(undefined);
  });

  it('returns 400 for invalid fields', async () => {
    const res = await POST(req({ email: 'bad-email' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid fields!');
  });

  it('returns 409 when email already exists', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' });

    const res = await POST(req(validBody));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('Email already exists!');
  });

  it('creates user and sends verification email', async () => {
    const res = await POST(req(validBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.user.email).toBe('john@example.com');
    expect(mockHashPassword).toHaveBeenCalledWith('StrongPass1!');
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed-password',
        }),
      })
    );
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith('john@example.com');
    expect(mockSendVerificationEmail).toHaveBeenCalledWith('john@example.com', 'verify-token');
  });

  it('returns 500 on unexpected error', async () => {
    (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('db down'));

    const res = await POST(req(validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
