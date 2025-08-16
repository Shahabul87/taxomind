# Rate Limiting Implementation Guide

This document explains how to use the comprehensive rate limiting system implemented for authentication endpoints in the Taxomind LMS application.

## Overview

The rate limiting system provides protection against brute force attacks, spam, and abuse for critical authentication endpoints. It supports both Redis-based and in-memory storage with automatic fallback.

## Rate Limit Configuration

The following authentication endpoints are protected with specific rate limits:

| Endpoint | Requests | Time Window | Description |
|----------|----------|-------------|-------------|
| `login` | 5 | 15 minutes | Login attempts |
| `register` | 3 | 1 hour | User registration |
| `reset` | 3 | 1 hour | Password reset requests |
| `verify` | 5 | 15 minutes | Email verification attempts |
| `twoFactor` | 5 | 5 minutes | 2FA code verification |

## Implementation Details

### Core Files

1. **`/lib/rate-limit.ts`** - Main rate limiting logic
2. **`/lib/auth-rate-limit-middleware.ts`** - Middleware utilities for API routes and server actions
3. **`/app/api/test/rate-limit/route.ts`** - Testing endpoint for rate limiting
4. **`/lib/test-rate-limiting.ts`** - Comprehensive test utilities

### Rate Limiting Features

- **Redis Integration**: Uses Upstash Redis for distributed rate limiting
- **In-Memory Fallback**: Automatic fallback to in-memory storage when Redis is unavailable
- **IP + User Based**: Combines IP address and user identifiers for precise rate limiting
- **Proper Headers**: Returns standard rate limiting headers (X-RateLimit-*)
- **429 Responses**: Proper HTTP 429 Too Many Requests responses with Retry-After headers
- **Sliding Window**: Uses sliding window algorithm for accurate rate limiting

## Usage Examples

### 1. API Route Implementation

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';

export async function POST(req: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await withAuthRateLimit(req, 'login');
  
  if ('error' in rateLimitResult) {
    return rateLimitResult; // Returns 429 response with proper headers
  }
  
  try {
    // Your authentication logic here
    const result = await authenticateUser(/* ... */);
    
    // Return success response with rate limit headers
    return NextResponse.json(result, {
      status: 200,
      headers: rateLimitResult.headers as Record<string, string>
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { 
        status: 401,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );
  }
}
```

### 2. Server Action Implementation

```typescript
// actions/login.ts
import { rateLimitAuth } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const login = async (values: LoginData) => {
  // Get client IP for rate limiting
  const headersList = headers();
  const ip = getClientIP(headersList);
  
  // Apply rate limiting
  const rateLimitResult = await rateLimitAuth('login', `${ip}:${values.email}`);
  
  if (!rateLimitResult.success) {
    return { 
      error: `Too many login attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }
  
  try {
    // Your authentication logic
    const result = await authenticateUser(values);
    
    return {
      success: "Logged in successfully!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  } catch (error) {
    return {
      error: "Authentication failed",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }
};
```

### 3. Higher-Order Component (HOC) Usage

```typescript
// Using the HOC wrapper for cleaner code
import { withRateLimit } from '@/lib/auth-rate-limit-middleware';

async function loginHandler(req: NextRequest) {
  // Your authentication logic here
  return NextResponse.json({ success: true });
}

// Wrap with rate limiting
export const POST = withRateLimit('login', loginHandler);
```

## Testing Rate Limiting

### Using the Test Endpoint

```bash
# Test login endpoint rate limiting
curl "http://localhost:3000/api/test/rate-limit?endpoint=login&testId=user123"

# Batch test multiple requests
curl -X POST http://localhost:3000/api/test/rate-limit \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "login", "identifier": "test-user", "requests": 10}'
```

### Using Test Utilities

```typescript
import { testRateLimit, runRateLimitingTests } from '@/lib/test-rate-limiting';

// Test specific endpoint
const results = await testRateLimit('login', 'test-user', 10);
console.log(results);

// Run comprehensive tests
await runRateLimitingTests();
```

## Rate Limit Headers

All rate-limited responses include the following headers:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
- `Retry-After`: (on 429 responses) Number of seconds to wait before retrying

## Error Responses

When rate limit is exceeded, the system returns:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 300 seconds.",
  "retryAfter": 300
}
```

## Environment Configuration

Add these environment variables for Redis integration:

```env
# Redis Configuration (optional - falls back to in-memory if not provided)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## Security Best Practices

1. **Combine IP + User ID**: Use both IP address and user identifier for more precise rate limiting
2. **Monitor Failed Attempts**: Log rate limiting violations for security monitoring
3. **Gradual Backoff**: Consider implementing exponential backoff for repeated violations
4. **Whitelist Trusted IPs**: Consider whitelisting internal services or trusted IP ranges
5. **Rate Limit Headers**: Always include rate limiting headers in responses

## Monitoring and Alerts

The system logs rate limiting events for monitoring:

```typescript
// Example log entries
logger.warn('Rate limit exceeded for login', {
  identifier: '192.168.1.1:user@example.com',
  endpoint: 'login',
  limit: 5,
  remaining: 0,
  reset: '2024-01-15T10:30:00.000Z'
});
```

## Common Use Cases

### 1. Brute Force Protection
- Login attempts: 5 per 15 minutes per IP+email combination
- Password reset: 3 per hour per IP+email combination

### 2. Spam Prevention
- Registration: 3 per hour per IP address
- Email verification: 5 per 15 minutes per IP+token combination

### 3. 2FA Security
- 2FA verification: 5 attempts per 5 minutes per IP+user combination

## Troubleshooting

### Rate Limiting Not Working
1. Check if Redis is properly configured
2. Verify environment variables are set
3. Check server logs for rate limiting errors
4. Test with the `/api/test/rate-limit` endpoint

### Too Restrictive Limits
1. Review the rate limit configurations in `/lib/rate-limit.ts`
2. Consider user experience vs security trade-offs
3. Monitor actual usage patterns
4. Adjust limits based on legitimate user behavior

### Performance Issues
1. Monitor Redis performance and latency
2. Consider using in-memory fallback for high-traffic scenarios
3. Implement rate limiting at the CDN/proxy level for better performance
4. Use sliding window algorithm for more accurate limiting

## Future Enhancements

Potential improvements to consider:

1. **Distributed Rate Limiting**: Use Redis Cluster for high availability
2. **Dynamic Rate Limits**: Adjust limits based on user reputation or account type
3. **Whitelisting**: Add support for trusted IP ranges or internal services
4. **Exponential Backoff**: Implement increasing delays for repeat offenders
5. **Rate Limit Bypass**: Add mechanism for emergency access or admin override
6. **Analytics Integration**: Connect to monitoring services like DataDog or Sentry