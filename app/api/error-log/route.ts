/**
 * Error Log API Endpoint
 *
 * Receives client-side errors and logs them using the server-side error logging system.
 * This allows client errors to be persisted to the database and sent to monitoring services
 * without exposing server-only modules to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorLogger } from '@/lib/error-handling/error-logger';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Schema for incoming error log requests
const ErrorLogSchema = z.object({
  message: z.string().max(10000),
  stack: z.string().max(50000).optional(),
  name: z.string().max(500).optional(),
  context: z.record(z.unknown()).optional(),
  component: z.string().max(500).optional(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(1000).optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit to prevent abuse (50 errors per minute per IP)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const rateLimitResult = await rateLimit(clientIp, 50, 60 * 1000); // 50 per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many error reports' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = ErrorLogSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid error format' },
        { status: 400 }
      );
    }

    const { message, stack, name, context, component, url, userAgent } = validated.data;

    // Create an Error object from the client data
    const error = new Error(message);
    error.name = name || 'ClientError';
    if (stack) {
      error.stack = stack;
    }

    // Log using the server-side error logger
    await errorLogger.logError(error, {
      ...context,
      source: 'client',
      clientUrl: url,
      clientUserAgent: userAgent,
    }, component || 'ClientErrorHandler');

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[API/error-log] Failed to process error log', err);

    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  try {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('[ERROR_LOG_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
