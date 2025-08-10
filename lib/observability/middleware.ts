import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { recordHttpRequest, recordApiError } from './metrics';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('taxomind-lms');

export async function withObservability(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = request.method;
  const url = new URL(request.url);
  const route = url.pathname;

  // Start OpenTelemetry span
  const span = tracer.startSpan(`${method} ${route}`, {
    attributes: {
      'http.method': method,
      'http.url': request.url,
      'http.target': route,
      'http.host': url.host,
      'http.scheme': url.protocol.replace(':', ''),
      'http.user_agent': request.headers.get('user-agent') || 'unknown',
    },
  });

  // Create Sentry transaction
  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: `${method} ${route}`,
    data: {
      url: request.url,
      method,
      headers: Object.fromEntries(request.headers.entries()),
    },
  });

  Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(transaction));

  try {
    // Execute the handler within the OpenTelemetry context
    const response = await context.with(
      trace.setSpan(context.active(), span),
      async () => handler()
    );

    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const statusCode = response.status;

    // Record metrics
    recordHttpRequest(method, route, statusCode, duration);

    // Update OpenTelemetry span
    span.setAttributes({
      'http.status_code': statusCode,
      'http.response_content_length': response.headers.get('content-length') || '0',
    });
    
    if (statusCode >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${statusCode}` });
      
      // Record error metrics
      if (statusCode >= 500) {
        recordApiError(route, 'server_error', statusCode);
      } else {
        recordApiError(route, 'client_error', statusCode);
      }
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    // Update Sentry transaction
    transaction.setHttpStatus(statusCode);
    transaction.setData('response_time', duration);

    return response;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    // Record error in metrics
    recordApiError(route, 'exception', 500);
    recordHttpRequest(method, route, 500, duration);

    // Record error in OpenTelemetry
    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });

    // Record error in Sentry
    Sentry.captureException(error, {
      contexts: {
        http: {
          method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
        },
      },
      tags: {
        route,
        method,
      },
    });

    transaction.setStatus('internal_error');

    throw error;
  } finally {
    // End spans and transactions
    span.end();
    transaction.finish();
  }
}

// Middleware wrapper for Next.js API routes
export function createObservableHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    return withObservability(req, () => handler(req));
  };
}

// Helper to extract user context for Sentry
export function setUserContext(userId?: string, email?: string, role?: string) {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });
}

// Helper to add custom breadcrumbs
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Helper to track custom events
export function trackEvent(
  eventName: string,
  category: string,
  data?: Record<string, any>
) {
  // Add to Sentry breadcrumbs
  addBreadcrumb(eventName, category, 'info', data);
  
  // Create custom span for the event
  const span = tracer.startSpan(`event.${category}.${eventName}`, {
    attributes: {
      'event.name': eventName,
      'event.category': category,
      ...data,
    },
  });
  span.end();
}