import { fetcher } from '@/lib/fetcher';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('fetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should fetch data successfully and return JSON', async () => {
    const mockData = { message: 'success', data: [1, 2, 3] };
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    const result = await fetcher('https://api.example.com/data');

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
    expect(mockResponse.json).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it('should throw error when response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    await expect(fetcher('https://api.example.com/notfound')).rejects.toThrow(
      'An error occurred while fetching the data.'
    );

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/notfound', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('should throw error when response is not ok with 500 status', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    await expect(fetcher('https://api.example.com/error')).rejects.toThrow(
      'An error occurred while fetching the data.'
    );
  });

  it('should throw error when response is not ok with 401 status', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    await expect(fetcher('https://api.example.com/unauthorized')).rejects.toThrow(
      'An error occurred while fetching the data.'
    );
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));

    await expect(fetcher('https://api.example.com/data')).rejects.toThrow(
      'Network Error'
    );
  });

  it('should handle JSON parsing errors', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    await expect(fetcher('https://api.example.com/invalid-json')).rejects.toThrow(
      'Invalid JSON'
    );
  });

  it('should work with different URL formats', async () => {
    const mockData = { result: 'ok' };
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as Partial<Response>;

    mockFetch.mockResolvedValue(mockResponse as Response);

    // Test with different URL formats
    await fetcher('/api/local');
    expect(mockFetch).toHaveBeenCalledWith('/api/local', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));

    await fetcher('https://external-api.com/endpoint');
    expect(mockFetch).toHaveBeenCalledWith('https://external-api.com/endpoint', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));

    await fetcher('/api/users/123');
    expect(mockFetch).toHaveBeenCalledWith('/api/users/123', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('should handle empty response', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(null),
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    const result = await fetcher('https://api.example.com/empty');

    expect(result).toBeNull();
  });

  it('should handle array response', async () => {
    const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    const result = await fetcher('https://api.example.com/array');

    expect(result).toEqual(mockData);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle boolean response', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(true),
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    const result = await fetcher('https://api.example.com/boolean');

    expect(result).toBe(true);
  });

  it('should handle number response', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(42),
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    const result = await fetcher('https://api.example.com/number');

    expect(result).toBe(42);
  });

  it('should handle string response', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue('hello world'),
    } as Partial<Response>;

    mockFetch.mockResolvedValueOnce(mockResponse as Response);

    const result = await fetcher('https://api.example.com/string');

    expect(result).toBe('hello world');
  });
});