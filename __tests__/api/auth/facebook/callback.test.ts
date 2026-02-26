jest.mock('axios', () => ({
  get: jest.fn(),
}));

import { GET } from '@/app/api/auth/facebook/callback/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import axios from 'axios';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockAxiosGet = axios.get as jest.Mock;

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

const profileLink = ensureModel('profileLink', ['create']);

describe('/api/auth/facebook/callback route', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockAxiosGet
      .mockResolvedValueOnce({ data: { access_token: 'fb-token', expires_in: 3600 } })
      .mockResolvedValueOnce({ data: { id: 'fb-123', name: 'FB User' } });
    (db.account.findFirst as jest.Mock).mockResolvedValue(null);
    (db.account.create as jest.Mock).mockResolvedValue({ id: 'acc-1' });
    (db.account.update as jest.Mock).mockResolvedValue({ id: 'acc-1' });
    profileLink.create.mockResolvedValue({ id: 'plink-1' });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('redirects with callback error when code or state is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/facebook/callback');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('error=auth_callback_error');
  });

  it('redirects to login when no authenticated session', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/facebook/callback?code=abc&state=xyz');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('/auth/login');
  });

  it('creates account and redirects on successful callback', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/facebook/callback?code=abc&state=xyz');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('connected=facebook');
    expect(db.account.create).toHaveBeenCalled();
    expect(profileLink.create).toHaveBeenCalled();
  });
});
