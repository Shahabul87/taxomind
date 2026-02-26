/**
 * Tests for Profile Image Route - app/api/profile/image/route.ts
 */

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn((data, opts, cb) => {
        cb(null, {
          secure_url: 'https://cdn.example.com/profile.png',
          public_id: 'profile-images/user-1',
        });
      }),
    },
  },
}));

import { POST } from '@/app/api/profile/image/route';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;

function reqWithForm(file: any | null) {
  return {
    formData: jest.fn().mockResolvedValue({
      get: jest.fn().mockReturnValue(file),
    }),
  } as any;
}

describe('Profile image route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(reqWithForm(null));
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await POST(reqWithForm(null));
    expect(res.status).toBe(400);
  });

  it('returns 400 when file is not an image', async () => {
    const file = { type: 'text/plain', size: 10, arrayBuffer: jest.fn() };

    const res = await POST(reqWithForm(file));
    expect(res.status).toBe(400);
  });

  it('returns 400 when file is larger than 5MB', async () => {
    const file = { type: 'image/png', size: 6 * 1024 * 1024, arrayBuffer: jest.fn() };

    const res = await POST(reqWithForm(file));
    expect(res.status).toBe(400);
  });

  it('uploads image and returns Cloudinary URL', async () => {
    const file = {
      type: 'image/png',
      size: 1024,
      arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    };

    const res = await POST(reqWithForm(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://cdn.example.com/profile.png');
    expect(body.public_id).toBe('profile-images/user-1');
  });
});
