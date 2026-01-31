/**
 * Typed fetch wrapper for SAM API calls
 */

export interface FetchOptions {
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
}

export async function samFetch<T>(
  path: string,
  options: FetchOptions & {
    method?: string;
    body?: Record<string, unknown>;
    query?: Record<string, string>;
  }
): Promise<T> {
  const { baseUrl, apiKey, timeoutMs, method = 'GET', body, query } = options;

  let url = `${baseUrl.replace(/\/$/, '')}${path}`;

  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new SAMApiError(response.status, (errorBody as Record<string, string>).error ?? 'Request failed');
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class SAMApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'SAMApiError';
  }
}
