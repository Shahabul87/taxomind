/**
 * Tests for Upload Route - app/api/upload/route.ts
 */

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((opts, cb) => ({
        end: jest.fn(() => cb(null, {
          public_id: 'next-cloudinary-uploads/file-1',
          secure_url: 'https://cdn.example.com/file-1.png',
        })),
      })),
    },
  },
}));

import { POST } from '@/app/api/upload/route';
import { currentUser } from '@/lib/auth';

const mockCurrentUser = currentUser as jest.Mock;
let OriginalFile: typeof File;

class MockUploadFile {
  name: string;
  type: string;
  size: number;
  private bytes: Uint8Array;

  constructor(bytes: Uint8Array, name: string, type: string) {
    this.bytes = bytes;
    this.name = name;
    this.type = type;
    this.size = bytes.byteLength;
  }

  async arrayBuffer() {
    return this.bytes.buffer;
  }
}

function reqWithFiles(files: any[]) {
  return {
    formData: jest.fn().mockResolvedValue({
      getAll: jest.fn().mockReturnValue(files),
    }),
  } as any;
}

describe('Upload route', () => {
  beforeAll(() => {
    OriginalFile = globalThis.File;
    (globalThis as any).File = MockUploadFile;
  });

  afterAll(() => {
    (globalThis as any).File = OriginalFile;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(reqWithFiles([]));
    expect(res.status).toBe(401);
  });

  it('returns 400 when no files are uploaded', async () => {
    const res = await POST(reqWithFiles([]));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('No files uploaded');
  });

  it('returns 400 for invalid file format', async () => {
    const res = await POST(reqWithFiles(['not-a-file']));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Invalid file format');
  });

  it('returns 400 for files over max size', async () => {
    const tooLarge = new MockUploadFile(
      new Uint8Array(10 * 1024 * 1024 + 1),
      'large.png',
      'image/png'
    ) as any;

    const res = await POST(reqWithFiles([tooLarge]));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('File too large');
  });

  it('uploads valid files and returns success payload', async () => {
    const small = new MockUploadFile(new Uint8Array([1, 2, 3]), 'small.png', 'image/png') as any;

    const res = await POST(reqWithFiles([small]));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.uploadedFiles).toHaveLength(1);
    expect(body.data.uploadedFiles[0].url).toBe('https://cdn.example.com/file-1.png');
  });
});
