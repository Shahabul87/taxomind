# API Troubleshooting Guide

## API Endpoint Debugging and Rate Limiting Issues

This guide helps you diagnose and resolve API-related issues in Taxomind, including endpoint failures, rate limiting problems, and API integration issues.

## Table of Contents
- [API Route Errors](#api-route-errors)
- [Rate Limiting Issues](#rate-limiting-issues)
- [Request/Response Problems](#requestresponse-problems)
- [CORS and Security Issues](#cors-and-security-issues)
- [API Performance Issues](#api-performance-issues)
- [Third-Party API Integration](#third-party-api-integration)
- [WebSocket and Real-time Issues](#websocket-and-real-time-issues)
- [API Testing and Debugging](#api-testing-and-debugging)

---

## API Route Errors

### Error: "405 Method Not Allowed"

**Symptoms:**
```
405 Method Not Allowed - GET /api/users
```

**Solutions:**

1. **Define correct HTTP methods:**
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ✅ Export named functions for each HTTP method
export async function GET(request: NextRequest) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user);
}

// ❌ Wrong - Default export not supported in App Router
export default function handler(req, res) {
  // This won't work in App Router
}
```

2. **Handle OPTIONS for CORS:**
```typescript
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### Error: "API handler should not return a value"

**Symptoms:**
```
API handler should not return a value, received object.
```

**Solutions:**

```typescript
// ❌ Wrong - Pages Router syntax
export default async function handler(req, res) {
  const data = await getData();
  return data; // Wrong!
}

// ✅ Correct - App Router syntax
export async function GET() {
  const data = await getData();
  return NextResponse.json(data);
}

// ✅ Correct - Pages Router syntax (if still using)
export default async function handler(req, res) {
  const data = await getData();
  res.status(200).json(data); // Use res object
}
```

### Error: "Dynamic server usage" in API routes

**Solutions:**

```typescript
// app/api/dynamic/route.ts
import { headers, cookies } from 'next/headers';

// Mark route as dynamic
export const dynamic = 'force-dynamic';
// or
export const revalidate = 0;

export async function GET() {
  const headersList = headers();
  const cookieStore = cookies();
  
  // Now you can use dynamic features
  const userAgent = headersList.get('user-agent');
  const sessionCookie = cookieStore.get('session');
  
  return NextResponse.json({ userAgent, session: sessionCookie?.value });
}
```

---

## Rate Limiting Issues

### Error: "429 Too Many Requests"

**Symptoms:**
```
Error: Rate limit exceeded. Please try again later.
```

**Implementation:**

1. **Set up Upstash rate limiting:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter instances
export const rateLimits = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  }),
  
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  }),
  
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
  }),
};
```

2. **Apply rate limiting to API routes:**
```typescript
// app/api/protected/route.ts
import { rateLimits } from '@/lib/rate-limit';
import { auth } from '@/auth';

export async function GET(request: Request) {
  // Get identifier (IP or user ID)
  const session = await auth();
  const identifier = session?.user?.id ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  
  // Check rate limit
  const { success, limit, reset, remaining } = await rateLimits.api.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  // Process request
  const data = await getData();
  
  return NextResponse.json(data, {
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  });
}
```

3. **Client-side rate limit handling:**
```typescript
// lib/api-client.ts
class ApiClient {
  private retryAfter: number = 0;
  
  async fetch(url: string, options?: RequestInit) {
    // Check if we're rate limited
    if (this.retryAfter > Date.now()) {
      throw new Error(`Rate limited. Retry after ${new Date(this.retryAfter).toISOString()}`);
    }
    
    const response = await fetch(url, options);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        this.retryAfter = Date.now() + (parseInt(retryAfter) * 1000);
      }
      
      const error = await response.json();
      throw new Error(error.message || 'Rate limit exceeded');
    }
    
    // Update rate limit info
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 10) {
      console.warn(`API rate limit warning: Only ${remaining} requests remaining`);
    }
    
    return response;
  }
}
```

### Debugging Rate Limit Issues

```typescript
// app/api/debug/rate-limit/route.ts
import { rateLimits } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const identifier = request.headers.get('x-forwarded-for') ?? 'anonymous';
  
  // Get current rate limit status without consuming
  const status = await rateLimits.api.limit(identifier, { 
    rate: 0 // Don't consume any tokens
  });
  
  return NextResponse.json({
    identifier,
    limit: status.limit,
    remaining: status.remaining,
    reset: new Date(status.reset).toISOString(),
    resetIn: Math.floor((status.reset - Date.now()) / 1000) + ' seconds',
  });
}
```

---

## Request/Response Problems

### Error: "Body exceeded limit"

**Symptoms:**
```
Error: Body exceeded 4.5mb limit
```

**Solutions:**

1. **Increase body size limit:**
```typescript
// app/api/upload/route.ts
export const maxDuration = 60; // Maximum function duration
export const dynamic = 'force-dynamic';

// For Next.js config (pages router)
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
```

2. **Stream large uploads:**
```typescript
// app/api/upload/stream/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Stream to storage
  const stream = file.stream();
  const reader = stream.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Process chunk
      await processChunk(value);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### Error: "Invalid JSON in request body"

**Solutions:**

```typescript
// app/api/data/route.ts
export async function POST(request: Request) {
  try {
    // Safely parse JSON
    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate with Zod
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });
    
    const validated = schema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error.errors },
        { status: 400 }
      );
    }
    
    // Process valid data
    const result = await processData(validated.data);
    return NextResponse.json(result);
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## CORS and Security Issues

### Error: "CORS policy blocked"

**Symptoms:**
```
Access to fetch at 'https://api.taxomind.com' from origin 'https://app.taxomind.com' has been blocked by CORS policy
```

**Solutions:**

1. **Configure CORS middleware:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }
  
  // Add CORS headers to response
  const response = NextResponse.next();
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

2. **Per-route CORS configuration:**
```typescript
// lib/cors.ts
export function corsHeaders(origin?: string) {
  const allowedOrigins = [
    'https://taxomind.com',
    'https://app.taxomind.com',
    'http://localhost:3000',
  ];
  
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (!origin) {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  return headers;
}

// Use in API route
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const data = await getData();
  
  return NextResponse.json(data, {
    headers: corsHeaders(origin),
  });
}
```

### Error: "CSRF token mismatch"

**Solutions:**

```typescript
// lib/csrf.ts
import { randomBytes } from 'crypto';

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// app/api/protected/route.ts
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.json();
  const csrfToken = request.headers.get('X-CSRF-Token');
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('csrf-token')?.value;
  
  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // Process request
  return NextResponse.json({ success: true });
}
```

---

## API Performance Issues

### Slow API Response Times

**Diagnosis:**
```typescript
// lib/api-timing.ts
export function withTiming(handler: Function) {
  return async (...args: any[]) => {
    const start = performance.now();
    
    try {
      const result = await handler(...args);
      const duration = performance.now() - start;
      
      // Add timing header
      if (result instanceof NextResponse) {
        result.headers.set('X-Response-Time', `${duration}ms`);
      }
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow API request: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`API error after ${duration}ms:`, error);
      throw error;
    }
  };
}

// Use in API route
export const GET = withTiming(async (request: Request) => {
  const data = await getData();
  return NextResponse.json(data);
});
```

**Optimization strategies:**

1. **Implement caching:**
```typescript
// app/api/cached/route.ts
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async (params) => {
    // Expensive operation
    return await db.course.findMany({
      include: { chapters: true },
    });
  },
  ['courses'],
  {
    revalidate: 3600, // 1 hour
    tags: ['courses'],
  }
);

export async function GET() {
  const data = await getCachedData();
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}
```

2. **Use connection pooling:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  connectionLimit: 10,
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}
```

---

## Third-Party API Integration

### Error: "External API timeout"

**Solutions:**

1. **Implement retry logic:**
```typescript
// lib/external-api.ts
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        return response;
      }
      
      // Retry on 5xx errors
      if (response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${url}`);
      }
      
      // Don't retry on client errors
      if (i === maxRetries - 1) break;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError || new Error('Failed to fetch');
}
```

2. **Circuit breaker pattern:**
```typescript
// lib/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error('Circuit breaker opened due to failures');
      }
      
      throw error;
    }
  }
}

const apiCircuitBreaker = new CircuitBreaker();

export async function callExternalAPI() {
  return apiCircuitBreaker.execute(async () => {
    const response = await fetch('https://external-api.com/data');
    return response.json();
  });
}
```

---

## WebSocket and Real-time Issues

### Implementing WebSocket in Next.js

```typescript
// app/api/socket/route.ts
import { Server } from 'socket.io';
import { NextApiRequest } from 'next';

const ioHandler = (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
    });
    
    io.on('connection', (socket) => {
      console.log('Client connected');
      
      socket.on('message', (data) => {
        socket.broadcast.emit('message', data);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
    
    res.socket.server.io = io;
  }
  
  res.end();
};

export default ioHandler;
```

### Real-time Updates with Server-Sent Events

```typescript
// app/api/sse/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };
      
      // Send initial data
      send({ type: 'connected', timestamp: Date.now() });
      
      // Send updates every 5 seconds
      const interval = setInterval(() => {
        send({ 
          type: 'update', 
          data: Math.random(),
          timestamp: Date.now() 
        });
      }, 5000);
      
      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## API Testing and Debugging

### API Testing Setup

```typescript
// __tests__/api/users.test.ts
import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

describe('/api/users', () => {
  it('GET returns users', async () => {
    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
  
  it('POST creates user', async () => {
    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
      }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.name).toBe('Test User');
  });
});
```

### API Debugging Tools

1. **Request logger middleware:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    console.log({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString(),
    });
  }
  
  return NextResponse.next();
}
```

2. **API documentation endpoint:**
```typescript
// app/api/docs/route.ts
export async function GET() {
  const routes = [
    {
      path: '/api/users',
      methods: ['GET', 'POST'],
      description: 'User management',
      rateLimit: '100 req/min',
    },
    {
      path: '/api/courses',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Course management',
      rateLimit: '100 req/min',
    },
    // Add all your routes
  ];
  
  return NextResponse.json({
    version: '1.0.0',
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    routes,
  });
}
```

---

## API Error Handling Best Practices

```typescript
// lib/api-error.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// lib/api-handler.ts
export function withErrorHandling(handler: Function) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof APIError) {
        return NextResponse.json(
          { 
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Usage
export const GET = withErrorHandling(async (request: Request) => {
  // Your API logic
  if (!authorized) {
    throw new APIError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  
  return NextResponse.json({ data: 'success' });
});
```

---

## When to Escalate

Escalate API issues when:
- Consistent 5xx errors in production
- Rate limiting not working correctly
- Security vulnerabilities discovered
- Data corruption through API
- Third-party API outages affecting service
- WebSocket connections dropping frequently

Include in escalation:
- API endpoint and method
- Request/response headers and body
- Error messages and stack traces
- Rate limit configurations
- Recent API changes
- Traffic patterns

---

*Last Updated: January 2025*
*API Stack: Next.js 15 App Router + Upstash Redis*