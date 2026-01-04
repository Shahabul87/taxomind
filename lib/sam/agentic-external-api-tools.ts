/**
 * SAM Agentic External API Tools
 * Tools for accessing external APIs and services
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  type RateLimit,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface ExternalAPIToolsDependencies {
  /** Optional API key for web search (e.g., SerpAPI, Google Custom Search) */
  webSearchApiKey?: string;
  /** Optional API key for dictionary service */
  dictionaryApiKey?: string;
  /** Custom logger */
  logger?: typeof logger;
  /** Rate limit override (requests per minute) */
  rateLimitPerMinute?: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface DictionaryResult {
  word: string;
  phonetic?: string;
  definitions: Array<{
    partOfSpeech: string;
    definition: string;
    example?: string;
    synonyms?: string[];
  }>;
}

export interface WikipediaResult {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string;
}

export interface CalculationResult {
  expression: string;
  result: number | string;
  steps?: string[];
}

export interface URLFetchResult {
  url: string;
  title?: string;
  content: string;
  contentType: string;
  truncated: boolean;
}

// ============================================================================
// ZOD INPUT SCHEMAS
// ============================================================================

const WebSearchInputSchema = z.object({
  query: z.string().min(1).max(500),
  maxResults: z.number().min(1).max(10).optional().default(5),
  safeSearch: z.boolean().optional().default(true),
});

const DictionaryInputSchema = z.object({
  word: z.string().min(1).max(100),
  language: z.string().length(2).optional().default('en'),
});

const WikipediaInputSchema = z.object({
  query: z.string().min(1).max(200),
  extractLength: z.number().min(100).max(5000).optional().default(1000),
});

const CalculatorInputSchema = z.object({
  expression: z.string().min(1).max(500),
  precision: z.number().min(0).max(15).optional().default(10),
});

const URLFetchInputSchema = z.object({
  url: z.string().url(),
  maxLength: z.number().min(100).max(50000).optional().default(10000),
  extractText: z.boolean().optional().default(true),
});

// ============================================================================
// TOOL HANDLERS
// ============================================================================

function createWebSearchHandler(
  deps: ExternalAPIToolsDependencies
): ToolHandler {
  const log = deps.logger ?? logger;

  return async (input): Promise<ToolExecutionResult> => {
    const parsed = WebSearchInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { query, maxResults } = parsed.data;
    log.info('[ExternalAPI] Web search', { query, maxResults });

    try {
      // Use DuckDuckGo Instant Answer API (free, no key required)
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`,
        {
          headers: { 'User-Agent': 'SAM-AI-Tutor/1.0' },
        }
      );

      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`);
      }

      const data = await response.json();

      const results: WebSearchResult[] = [];

      // Abstract (main answer)
      if (data.Abstract) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL || '',
          snippet: data.Abstract,
          source: data.AbstractSource || 'DuckDuckGo',
        });
      }

      // Related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
              url: topic.FirstURL,
              snippet: topic.Text,
              source: 'DuckDuckGo',
            });
          }
        }
      }

      // If no results from instant answer, return a helpful message
      if (results.length === 0) {
        return {
          success: true,
          output: {
            results: [],
            query,
            message:
              'No instant answers found. For comprehensive search results, a dedicated search API key is recommended.',
          },
        };
      }

      return {
        success: true,
        output: {
          results: results.slice(0, maxResults),
          query,
          totalFound: results.length,
        },
      };
    } catch (error) {
      log.error('[ExternalAPI] Web search failed', { error, query });
      return {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Search failed',
          recoverable: true,
        },
      };
    }
  };
}

function createDictionaryHandler(
  deps: ExternalAPIToolsDependencies
): ToolHandler {
  const log = deps.logger ?? logger;

  return async (input): Promise<ToolExecutionResult> => {
    const parsed = DictionaryInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { word, language } = parsed.data;
    log.info('[ExternalAPI] Dictionary lookup', { word, language });

    try {
      // Use Free Dictionary API
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodeURIComponent(word)}`,
        {
          headers: { 'User-Agent': 'SAM-AI-Tutor/1.0' },
        }
      );

      if (response.status === 404) {
        return {
          success: true,
          output: {
            word,
            found: false,
            message: `No definition found for "${word}"`,
          },
        };
      }

      if (!response.ok) {
        throw new Error(`Dictionary API returned ${response.status}`);
      }

      const data = await response.json();
      const entry = data[0];

      const result: DictionaryResult = {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
        definitions: [],
      };

      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          result.definitions.push({
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms?.slice(0, 5),
          });
        }
      }

      return {
        success: true,
        output: {
          ...result,
          found: true,
        },
      };
    } catch (error) {
      log.error('[ExternalAPI] Dictionary lookup failed', { error, word });
      return {
        success: false,
        error: {
          code: 'DICTIONARY_FAILED',
          message: error instanceof Error ? error.message : 'Dictionary lookup failed',
          recoverable: true,
        },
      };
    }
  };
}

function createWikipediaHandler(
  deps: ExternalAPIToolsDependencies
): ToolHandler {
  const log = deps.logger ?? logger;

  return async (input): Promise<ToolExecutionResult> => {
    const parsed = WikipediaInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { query, extractLength } = parsed.data;
    log.info('[ExternalAPI] Wikipedia search', { query, extractLength });

    try {
      // Use Wikipedia REST API
      const encodedQuery = encodeURIComponent(query);
      const searchResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'SAM-AI-Tutor/1.0 (educational; contact@example.com)',
            Accept: 'application/json',
          },
        }
      );

      if (searchResponse.status === 404) {
        // Try search API instead
        const searchApiResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&srlimit=1`,
          {
            headers: { 'User-Agent': 'SAM-AI-Tutor/1.0' },
          }
        );

        if (!searchApiResponse.ok) {
          return {
            success: true,
            output: {
              found: false,
              query,
              message: `No Wikipedia article found for "${query}"`,
            },
          };
        }

        const searchData = await searchApiResponse.json();
        if (!searchData.query?.search?.length) {
          return {
            success: true,
            output: {
              found: false,
              query,
              message: `No Wikipedia article found for "${query}"`,
            },
          };
        }

        // Retry with the found title
        const foundTitle = searchData.query.search[0].title;
        const retryResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(foundTitle)}`,
          {
            headers: {
              'User-Agent': 'SAM-AI-Tutor/1.0',
              Accept: 'application/json',
            },
          }
        );

        if (!retryResponse.ok) {
          return {
            success: true,
            output: {
              found: false,
              query,
              message: `Could not retrieve Wikipedia article for "${query}"`,
            },
          };
        }

        const retryData = await retryResponse.json();
        return formatWikipediaResult(retryData, extractLength);
      }

      if (!searchResponse.ok) {
        throw new Error(`Wikipedia API returned ${searchResponse.status}`);
      }

      const data = await searchResponse.json();
      return formatWikipediaResult(data, extractLength);
    } catch (error) {
      log.error('[ExternalAPI] Wikipedia search failed', { error, query });
      return {
        success: false,
        error: {
          code: 'WIKIPEDIA_FAILED',
          message: error instanceof Error ? error.message : 'Wikipedia search failed',
          recoverable: true,
        },
      };
    }
  };
}

function formatWikipediaResult(
  data: Record<string, unknown>,
  extractLength: number
): ToolExecutionResult {
  const extract = (data.extract as string) || '';
  const result: WikipediaResult = {
    title: data.title as string,
    extract: extract.length > extractLength ? extract.substring(0, extractLength) + '...' : extract,
    url: (data.content_urls as Record<string, Record<string, string>>)?.desktop?.page || '',
    thumbnail: (data.thumbnail as Record<string, string>)?.source,
  };

  return {
    success: true,
    output: {
      ...result,
      found: true,
    },
  };
}

function createCalculatorHandler(
  deps: ExternalAPIToolsDependencies
): ToolHandler {
  const log = deps.logger ?? logger;

  return async (input): Promise<ToolExecutionResult> => {
    const parsed = CalculatorInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { expression, precision } = parsed.data;
    log.info('[ExternalAPI] Calculate', { expression });

    try {
      // Sanitize expression - only allow safe mathematical operations
      const sanitized = expression
        .replace(/[^0-9+\-*/().%^sqrt\s]/gi, '')
        .replace(/sqrt/gi, 'Math.sqrt')
        .replace(/\^/g, '**');

      // Validate it&apos;s a safe expression
      if (!/^[\d+\-*/().%\s*Math.sqrt()]+$/.test(sanitized)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EXPRESSION',
            message: 'Invalid mathematical expression. Only numbers and basic operators (+, -, *, /, %, ^, sqrt) are allowed.',
            recoverable: true,
          },
        };
      }

      // Evaluate using Function constructor (safer than eval)
      const calculate = new Function(`return ${sanitized}`);
      const rawResult = calculate();

      if (typeof rawResult !== 'number' || !isFinite(rawResult)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESULT',
            message: 'Calculation resulted in an invalid number',
            recoverable: true,
          },
        };
      }

      const result = Number(rawResult.toFixed(precision));

      return {
        success: true,
        output: {
          expression,
          result,
          sanitizedExpression: sanitized,
        } as CalculationResult,
      };
    } catch (error) {
      log.error('[ExternalAPI] Calculation failed', { error, expression });
      return {
        success: false,
        error: {
          code: 'CALCULATION_FAILED',
          message: error instanceof Error ? error.message : 'Calculation failed',
          recoverable: true,
        },
      };
    }
  };
}

function createURLFetchHandler(
  deps: ExternalAPIToolsDependencies
): ToolHandler {
  const log = deps.logger ?? logger;

  return async (input): Promise<ToolExecutionResult> => {
    const parsed = URLFetchInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { url, maxLength, extractText } = parsed.data;
    log.info('[ExternalAPI] Fetch URL', { url, maxLength });

    try {
      // Validate URL is from allowed domains (educational focus)
      const parsedUrl = new URL(url);
      const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0', '192.168.', '10.', '172.'];
      if (blockedDomains.some((d) => parsedUrl.hostname.includes(d))) {
        return {
          success: false,
          error: {
            code: 'BLOCKED_DOMAIN',
            message: 'Cannot fetch from local or private network URLs',
            recoverable: false,
          },
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SAM-AI-Tutor/1.0 (educational)',
          Accept: 'text/html,application/xhtml+xml,text/plain',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`URL returned ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || 'text/plain';

      // Only handle text content
      if (!contentType.includes('text') && !contentType.includes('json')) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_CONTENT',
            message: 'Can only fetch text-based content (HTML, plain text, JSON)',
            recoverable: false,
          },
        };
      }

      let content = await response.text();

      // Extract text from HTML if requested
      if (extractText && contentType.includes('html')) {
        // Simple HTML text extraction
        content = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      const truncated = content.length > maxLength;
      if (truncated) {
        content = content.substring(0, maxLength) + '...';
      }

      // Extract title from HTML
      let title: string | undefined;
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      const result: URLFetchResult = {
        url,
        title,
        content,
        contentType,
        truncated,
      };

      return {
        success: true,
        output: result,
      };
    } catch (error) {
      log.error('[ExternalAPI] URL fetch failed', { error, url });
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out after 10 seconds',
            recoverable: true,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'URL fetch failed',
          recoverable: true,
        },
      };
    }
  };
}

// ============================================================================
// TOOL FACTORY
// ============================================================================

/**
 * Create external API tools with optional dependencies
 */
export function createExternalAPITools(
  deps: ExternalAPIToolsDependencies = {}
): ToolDefinition[] {
  const baseRateLimit: RateLimit = {
    maxCalls: deps.rateLimitPerMinute ?? 30,
    windowMs: 60000, // 1 minute
    scope: 'user',
  };

  return [
    {
      id: 'external-web-search',
      name: 'Web Search',
      description:
        'Search the web for information using DuckDuckGo. Returns relevant results with titles, URLs, and snippets.',
      category: ToolCategory.EXTERNAL,
      version: '1.0.0',
      inputSchema: WebSearchInputSchema,
      outputSchema: z.object({
        results: z.array(z.object({
          title: z.string(),
          url: z.string(),
          snippet: z.string(),
          source: z.string().optional(),
        })),
        query: z.string(),
        totalFound: z.number().optional(),
        message: z.string().optional(),
      }),
      requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      rateLimit: baseRateLimit,
      handler: createWebSearchHandler(deps),
      enabled: true,
      tags: ['external', 'search', 'web'],
    },
    {
      id: 'external-dictionary',
      name: 'Dictionary Lookup',
      description:
        'Look up word definitions, phonetics, part of speech, examples, and synonyms.',
      category: ToolCategory.EXTERNAL,
      version: '1.0.0',
      inputSchema: DictionaryInputSchema,
      outputSchema: z.object({
        word: z.string(),
        phonetic: z.string().optional(),
        definitions: z.array(z.object({
          partOfSpeech: z.string(),
          definition: z.string(),
          example: z.string().optional(),
          synonyms: z.array(z.string()).optional(),
        })),
        found: z.boolean(),
        message: z.string().optional(),
      }),
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      rateLimit: { ...baseRateLimit, maxCalls: baseRateLimit.maxCalls * 2 },
      handler: createDictionaryHandler(deps),
      enabled: true,
      tags: ['external', 'dictionary', 'language'],
    },
    {
      id: 'external-wikipedia',
      name: 'Wikipedia Search',
      description:
        'Search and retrieve Wikipedia article summaries for educational research.',
      category: ToolCategory.EXTERNAL,
      version: '1.0.0',
      inputSchema: WikipediaInputSchema,
      outputSchema: z.object({
        title: z.string(),
        extract: z.string(),
        url: z.string(),
        thumbnail: z.string().optional(),
        found: z.boolean(),
        message: z.string().optional(),
      }),
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      rateLimit: baseRateLimit,
      handler: createWikipediaHandler(deps),
      enabled: true,
      tags: ['external', 'wikipedia', 'knowledge'],
    },
    {
      id: 'external-calculator',
      name: 'Calculator',
      description:
        'Evaluate mathematical expressions. Supports basic operations (+, -, *, /, %), powers (^), and square roots (sqrt).',
      category: ToolCategory.EXTERNAL,
      version: '1.0.0',
      inputSchema: CalculatorInputSchema,
      outputSchema: z.object({
        expression: z.string(),
        result: z.number(),
        sanitizedExpression: z.string(),
      }),
      requiredPermissions: [PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      rateLimit: { ...baseRateLimit, maxCalls: baseRateLimit.maxCalls * 5 },
      handler: createCalculatorHandler(deps),
      enabled: true,
      tags: ['external', 'calculator', 'math'],
    },
    {
      id: 'external-url-fetch',
      name: 'URL Fetch',
      description:
        'Fetch and extract text content from URLs. Useful for reading educational resources.',
      category: ToolCategory.EXTERNAL,
      version: '1.0.0',
      inputSchema: URLFetchInputSchema,
      outputSchema: z.object({
        url: z.string(),
        title: z.string().optional(),
        content: z.string(),
        contentType: z.string(),
        truncated: z.boolean(),
      }),
      requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.EXPLICIT, // Require confirmation for URL fetching
      rateLimit: { ...baseRateLimit, maxCalls: Math.floor(baseRateLimit.maxCalls / 2) },
      handler: createURLFetchHandler(deps),
      enabled: true,
      tags: ['external', 'fetch', 'url'],
    },
  ];
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get all external API tool IDs
 */
export function getExternalAPIToolIds(): string[] {
  return [
    'external-web-search',
    'external-dictionary',
    'external-wikipedia',
    'external-calculator',
    'external-url-fetch',
  ];
}

/**
 * Check if a tool ID is an external API tool
 */
export function isExternalAPITool(toolId: string): boolean {
  return getExternalAPIToolIds().includes(toolId);
}
