// @ts-nocheck
/**
 * Express Adapter
 *
 * Converts Express req/res to a handler pattern compatible with
 * SAM API route structure. Provides error handling and validation.
 */

import type { Request, Response } from 'express';

// =============================================================================
// TYPES
// =============================================================================

interface AdapterRequest {
  body: Record<string, unknown>;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
}

interface AdapterResponse {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

type RouteHandler = (req: AdapterRequest) => Promise<AdapterResponse>;

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * Wrap a SAM-style route handler as Express middleware
 */
export function expressAdapter(handler: RouteHandler) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const adapterReq: AdapterRequest = {
        body: req.body as Record<string, unknown>,
        query: req.query as Record<string, string>,
        params: req.params as Record<string, string>,
        headers: req.headers as Record<string, string | string[] | undefined>,
        method: req.method,
        url: req.url,
      };

      const result = await handler(adapterReq);

      if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
      }

      res.status(result.status).json(result.body);
    } catch (error) {
      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
        res.status(400).json({
          error: 'Validation failed',
          details: zodError.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }

      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  };
}
