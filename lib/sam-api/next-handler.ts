import { NextRequest, NextResponse } from 'next/server';
import type { SAMApiRequest, SAMApiResponse, SAMHandler, SAMHandlerContext } from '@sam-ai/api';
import { getSAMConfig } from '@/lib/adapters';

function headersToRecord(headers: NextRequest['headers']): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function queryToRecord(url: URL): Record<string, string> | undefined {
  if (!url.searchParams.size) return undefined;
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

async function readRequestBody(req: NextRequest): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

function generateRequestId(): string {
  return `sam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function toSAMApiRequest(req: NextRequest): Promise<SAMApiRequest> {
  const url = new URL(req.url);
  const body = await readRequestBody(req);

  return {
    body,
    headers: headersToRecord(req.headers),
    method: req.method,
    url: req.url,
    query: queryToRecord(url),
  };
}

export function toNextResponse(response: SAMApiResponse): NextResponse {
  const nextResponse = NextResponse.json(response.body, { status: response.status });

  if (response.headers) {
    for (const [key, value] of Object.entries(response.headers)) {
      nextResponse.headers.set(key, value);
    }
  }

  return nextResponse;
}

export function createDefaultHandlerContext(): SAMHandlerContext {
  return {
    config: getSAMConfig(),
    requestId: generateRequestId(),
    timestamp: new Date(),
  };
}

export function createNextSAMHandler(handler: SAMHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const samRequest = await toSAMApiRequest(req);
    const context = createDefaultHandlerContext();
    const samResponse = await handler(samRequest, context);
    return toNextResponse(samResponse);
  };
}
