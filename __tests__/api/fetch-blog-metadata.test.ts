jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('cheerio', () => ({
  load: jest.fn(() => {
    const attrMap: Record<string, string> = {
      'meta[property="og:title"]|content': 'Pragmatic Testing Guide',
      'meta[property="og:description"]|content': 'How to test route handlers.',
      'meta[property="og:site_name"]|content': 'Engineering Blog',
      'meta[property="article:author"]|content': 'Jane Author',
      'meta[property="og:image"]|content': '/cover.png',
      'link[rel="icon"]|href': '/favicon.ico',
    };
    return (selector: string) => ({
      attr: (name: string) => attrMap[`${selector}|${name}`],
      text: () => (selector === 'title' ? 'Ignored Title' : ''),
    });
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
}));

jest.mock('@/lib/utils/url-validator', () => ({
  validateFetchUrl: jest.fn((url: string) => {
    try {
      new URL(url);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  }),
}));

import { GET } from '@/app/api/fetch-blog-metadata/route';
import axios from 'axios';

const mockAxiosGet = (axios as any).get as jest.Mock;

describe('/api/fetch-blog-metadata route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when url query param is missing', async () => {
    const req = new Request('http://localhost:3000/api/fetch-blog-metadata');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('URL parameter is required');
  });

  it('returns 400 for invalid URL format', async () => {
    const req = new Request(
      'http://localhost:3000/api/fetch-blog-metadata?url=notaurl'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid URL format');
  });

  it('extracts metadata from fetched html', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: '<html></html>',
    });

    const req = new Request(
      'http://localhost:3000/api/fetch-blog-metadata?url=https://example.com/posts/testing'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Pragmatic Testing Guide');
    expect(body.description).toBe('How to test route handlers.');
    expect(body.siteName).toBe('Engineering Blog');
    expect(body.author).toBe('Jane Author');
    expect(body.favicon).toBe('https://example.com/favicon.ico');
    expect(body.thumbnail).toBe('https://example.com/cover.png');
  });

  it('returns fallback metadata when extraction fails', async () => {
    mockAxiosGet.mockRejectedValue(new Error('network down'));

    const req = new Request(
      'http://localhost:3000/api/fetch-blog-metadata?url=https://example.com/abc'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toContain('Article from example.com');
    expect(body.is_fallback).toBe(true);
  });
});
