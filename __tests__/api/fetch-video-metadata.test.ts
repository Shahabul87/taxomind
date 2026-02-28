jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('cheerio', () => ({
  load: jest.fn(() => {
    const attrs: Record<string, string> = {
      'meta[property="og:title"]|content': 'Reliable API Testing',
      'meta[property="og:description"]|content': 'Testing routes without flakiness',
      'meta[name="author"]|content': 'Dev Channel',
    };
    return (selector: string) => ({
      attr: (name: string) => attrs[`${selector}|${name}`],
      text: () => (selector === 'title' ? 'Video Title Fallback' : ''),
      first: () => ({ text: () => '' }),
      each: () => {},
      length: 0,
    });
  }),
}));

jest.mock('@/lib/api/with-api-auth', () => ({
  withAuth: (handler: any) => handler,
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/fetch-video-metadata/route';
import axios from 'axios';
import { NextRequest } from 'next/server';

const mockAxiosGet = (axios as any).get as jest.Mock;

describe('/api/fetch-video-metadata route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when url is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/fetch-video-metadata');
    const res = await GET(req, {} as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('URL parameter is required');
  });

  it('returns 400 for domains outside allowlist', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/fetch-video-metadata?url=https://example.com/video/123'
    );
    const res = await GET(req, {} as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Domain not allowed');
  });

  it('returns metadata for allowed YouTube URLs', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: '<html></html>' });
    const req = new NextRequest(
      'http://localhost:3000/api/fetch-video-metadata?url=https://www.youtube.com/watch?v=abcdefghijk'
    );
    const res = await GET(req, {} as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.platform).toBe('youtube');
    expect(body.embedUrl).toContain('/abcdefghijk');
    expect(body.title).toBe('Reliable API Testing');
    expect(body.author).toBe('Dev Channel');
  });
});
