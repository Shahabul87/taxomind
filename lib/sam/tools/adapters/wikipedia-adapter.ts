/**
 * Wikipedia External Tool Adapter
 *
 * Wraps the Wikipedia REST API for educational content retrieval.
 * Free, no API key required. 5-second timeout.
 */

import type { ExternalToolAdapter, ExternalToolMetadata } from './tool-adapter-interface';

export interface WikipediaInput {
  title: string;
  extractLength?: number;
}

export interface WikipediaOutput {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string;
  found: boolean;
}

const TIMEOUT_MS = 5000;

export class WikipediaAdapter implements ExternalToolAdapter<WikipediaInput, WikipediaOutput> {
  readonly id = 'adapter-wikipedia';
  readonly name = 'Wikipedia';
  readonly category = 'reference' as const;
  readonly description = 'Retrieve Wikipedia article summaries for educational research.';

  isAvailable(): boolean {
    // Wikipedia API is free and always available (barring network issues)
    return true;
  }

  async execute(input: WikipediaInput): Promise<WikipediaOutput> {
    const { title, extractLength = 1000 } = input;
    const encodedTitle = encodeURIComponent(title);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
        {
          headers: {
            'User-Agent': 'SAM-AI-Tutor/1.0 (educational; contact@taxomind.com)',
            Accept: 'application/json',
          },
          signal: controller.signal,
        },
      );

      if (response.status === 404) {
        return { title, extract: '', url: '', found: false };
      }

      if (!response.ok) {
        throw new Error(`Wikipedia API returned ${response.status}`);
      }

      const data = await response.json();
      const extract = (data.extract as string) || '';

      return {
        title: data.title ?? title,
        extract: extract.length > extractLength
          ? extract.substring(0, extractLength) + '...'
          : extract,
        url: data.content_urls?.desktop?.page ?? '',
        thumbnail: data.thumbnail?.source,
        found: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  getMetadata(): ExternalToolMetadata {
    return {
      requiresApiKey: false,
      serviceUrl: 'https://en.wikipedia.org/api/rest_v1/',
      isFree: true,
      timeoutMs: TIMEOUT_MS,
      rateLimit: '200 requests/second (Wikipedia policy: be polite)',
    };
  }
}

/** Factory function for convenience */
export function createWikipediaAdapter(): WikipediaAdapter {
  return new WikipediaAdapter();
}
