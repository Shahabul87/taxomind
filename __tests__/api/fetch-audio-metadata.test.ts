jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('cheerio', () => ({
  load: jest.fn(() => {
    const attrs: Record<string, string> = {
      'meta[property="og:title"]|content': 'Synthwave Nights',
      'meta[property="og:image"]|content': '/cover.jpg',
      'meta[property="og:audio:artist"]|content': 'DJ Aurora',
      'meta[property="music:album"]|content': 'Midnight Circuits',
      'link[rel="icon"]|href': '/favicon.ico',
      'meta[property="og:type"]|content': 'music.song',
    };
    return (selector: string) => ({
      attr: (name: string) => attrs[`${selector}|${name}`],
      text: () => (selector === 'title' ? 'Fallback Audio Title' : ''),
      first: () => ({ text: () => '' }),
      each: () => {},
      length: 0,
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
  validateFetchUrl: jest.fn().mockReturnValue(null),
}));

import { GET } from '@/app/api/fetch-audio-metadata/route';
import axios from 'axios';

const mockAxiosGet = (axios as any).get as jest.Mock;

describe('/api/fetch-audio-metadata route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when url is missing', async () => {
    const req = new Request('http://localhost:3000/api/fetch-audio-metadata');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('URL parameter is required');
  });

  it('returns metadata for non-platform audio URL', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: '<html></html>' });
    const req = new Request(
      'http://localhost:3000/api/fetch-audio-metadata?url=https://example.com/audio/track-1'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.title).toBe('Synthwave Nights');
    expect(body.artist).toBe('DJ Aurora');
    expect(body.album).toBe('Midnight Circuits');
    expect(body.artwork).toBe('https://example.com/cover.jpg');
    expect(body.favicon).toBe('https://example.com/favicon.ico');
  });

  it('returns fallback payload when upstream fetch fails', async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error('timeout'));
    const req = new Request(
      'http://localhost:3000/api/fetch-audio-metadata?url=https://example.com/audio/unavailable'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.is_fallback).toBe(true);
    expect(body.title).toContain('Audio from example.com');
  });
});
