jest.mock('@/lib/google-drive', () => ({
  uploadFile: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { POST } from '@/app/api/upload/google-drive/route';
import { currentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/google-drive';

const mockCurrentUser = currentUser as jest.Mock;
const mockUploadFile = uploadFile as jest.Mock;

function fileLike(name: string, type: string, size: number, bytes = 'abc'): File {
  const mock = {
    name,
    type,
    size,
    arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(bytes).buffer),
  };
  Object.setPrototypeOf(mock, File.prototype);
  return mock as unknown as File;
}

function reqWithFile(file: File | null) {
  const formDataLike = {
    get: jest.fn((key: string) => (key === 'file' ? file : null)),
  };

  return {
    formData: jest.fn().mockResolvedValue(formDataLike),
  } as any;
}

describe('POST /api/upload/google-drive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(reqWithFile(null));

    expect(res.status).toBe(401);
  });

  it('returns 400 when file is missing', async () => {
    const res = await POST(reqWithFile(null));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('No file provided');
  });

  it('returns 400 for oversized files', async () => {
    const file = fileLike('large.pdf', 'application/pdf', 50 * 1024 * 1024 + 1);

    const res = await POST(reqWithFile(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('File too large');
  });

  it('returns 400 for unsupported mime types', async () => {
    const file = fileLike('script.sh', 'application/x-sh', 32);

    const res = await POST(reqWithFile(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Unsupported file type');
  });

  it('uploads valid files and returns metadata', async () => {
    const file = fileLike('data.csv', 'text/csv', 5, 'a,b,c');
    mockUploadFile.mockResolvedValueOnce({
      webViewLink: 'https://drive.google.com/file/d/1/view',
      fileId: 'file-1',
      name: 'data.csv',
      mimeType: 'text/csv',
      size: 5,
    });

    const res = await POST(reqWithFile(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fileId).toBe('file-1');
    expect(mockUploadFile).toHaveBeenCalledWith(expect.any(Buffer), 'data.csv', 'text/csv');
  });

  it('returns 500 when upload provider throws', async () => {
    const file = fileLike('doc.pdf', 'application/pdf', 11, 'pdf-content');
    mockUploadFile.mockRejectedValueOnce(new Error('drive down'));

    const res = await POST(reqWithFile(file));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Upload failed. Please try again.');
  });
});
