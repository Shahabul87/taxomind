/**
 * Tests for Settings Upload Avatar Route - app/api/settings/upload-avatar/route.ts
 */

jest.mock('cloudinary', () => {
  const uploadStreamMock = jest.fn((opts, cb) => ({
    end: jest.fn(() => cb(null, {
      secure_url: 'https://cdn.example.com/avatar.png',
      public_id: 'taxomind/avatars/user_1',
    })),
  }));

  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: uploadStreamMock,
      },
    },
    __uploadStreamMock: uploadStreamMock,
  };
});

import { POST } from '@/app/api/settings/upload-avatar/route';
import { currentUser } from '@/lib/auth';

const mockCurrentUser = currentUser as jest.Mock;

function reqWithForm(formData: FormData) {
  return {
    formData: jest.fn().mockResolvedValue(formData),
  } as any;
}

describe('Settings upload-avatar route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const form = new FormData();
    const res = await POST(reqWithForm(form));

    expect(res.status).toBe(401);
  });

  it('returns 400 when file is missing', async () => {
    const form = new FormData();

    const res = await POST(reqWithForm(form));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for non-image files', async () => {
    const form = new FormData();
    form.set('file', new File(['hello'], 'hello.txt', { type: 'text/plain' }));

    const res = await POST(reqWithForm(form));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('File must be an image');
  });

  it('returns 400 for files larger than 5MB', async () => {
    const form = new FormData();
    const largeBytes = new Uint8Array(5 * 1024 * 1024 + 1);
    form.set('file', new File([largeBytes], 'large.png', { type: 'image/png' }));

    const res = await POST(reqWithForm(form));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('less than 5MB');
  });

  it('uploads valid image and returns URL', async () => {
    const fileStub = {
      type: 'image/png',
      size: 3,
      arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    };
    const req = {
      formData: jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue(fileStub),
      }),
    } as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.url).toContain('https://cdn.example.com/avatar.png');
  });
});
