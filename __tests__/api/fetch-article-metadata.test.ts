jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('cheerio', () => ({
  load: jest.fn(() => {
    const attrs: Record<string, string> = {
      'meta[property="og:title"]|content': 'Understanding Async Boundaries',
      'meta[property="og:description"]|content': 'A concise practical guide.',
      'meta[property="article:author"]|content': 'By Taylor',
      'meta[property="og:image"]|content': '/article.png',
      'meta[property="og:site_name"]|content': 'Example Journal',
      'link[rel="icon"]|href': '/favicon.ico',
      'meta[name="keywords"]|content': 'async,javascript',
    };

    return (selector: string) => ({
      attr: (name: string) => attrs[`${selector}|${name}`],
      text: () => (selector === 'title' ? 'Fallback Title' : ''),
      first: () => ({ text: () => '' }),
      each: () => {},
      length: 0,
    });
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/fetch-article-metadata/route';
import axios from 'axios';

const mockAxiosGet = (axios as any).get as jest.Mock;

describe('/api/fetch-article-metadata route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when url is missing', async () => {
    const req = new Request('http://localhost:3000/api/fetch-article-metadata');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('URL parameter is required');
  });

  it('returns parsed metadata for a regular article URL', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: '<html></html>' });
    const req = new Request(
      'http://localhost:3000/api/fetch-article-metadata?url=https://example.com/posts/async-boundaries'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.title).toBe('Understanding Async Boundaries');
    expect(body.author).toBe('Taylor');
    expect(body.favicon).toBe('https://example.com/favicon.ico');
    expect(body.image).toBe('https://example.com/article.png');
    expect(body.platform).toBe('Example');
  });

  it('returns graceful fallback when fetch fails', async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error('network down'));
    const req = new Request(
      'http://localhost:3000/api/fetch-article-metadata?url=https://example.com/failing-post'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.is_fallback).toBe(true);
    expect(body.title).toContain('Article from example.com');
  });
});
