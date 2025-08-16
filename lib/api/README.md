# Unified API Authentication System

A comprehensive authentication and authorization system for Next.js 15 App Router API routes with enterprise-grade features.

## Features

- **Role-based Access Control**: Support for USER and ADMIN roles
- **Permission-based Access Control**: Fine-grained permissions using existing role management system
- **Rate Limiting**: Built-in rate limiting with Redis support and in-memory fallback
- **Audit Logging**: Comprehensive request logging for security and compliance
- **Request Context**: Rich context with user information and helper methods
- **Resource Ownership**: Built-in ownership validation for user resources
- **Standardized Responses**: Consistent API response format across all endpoints
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **TypeScript Support**: Full type safety with TypeScript integration

## Quick Start

### Basic Authenticated Endpoint

```typescript
import { NextRequest } from "next/server";
import { withAuth, ApiResponses } from "@/lib/api";

export const GET = withAuth(async (request: NextRequest, context) => {
  return ApiResponses.ok({
    message: "Hello, authenticated user!",
    user: context.user.name,
  });
});
```

### Admin-Only Endpoint

```typescript
import { withAdminAuth, ApiResponses } from "@/lib/api";

export const DELETE = withAdminAuth(async (request, context) => {
  // Only admins can access this endpoint
  return ApiResponses.ok({ message: "Admin operation completed" });
});
```

### Permission-Based Endpoint

```typescript
import { withPermissions, ApiResponses } from "@/lib/api";

export const POST = withPermissions("course:create", async (request, context) => {
  // Only users with "course:create" permission can access
  return ApiResponses.created({ courseId: "new-course-id" });
});
```

## API Reference

### Authentication Wrappers

#### `withAPIAuth(handler, options)`

The main authentication wrapper with full configuration options.

```typescript
export const GET = withAPIAuth(
  async (request: NextRequest, context: APIAuthContext) => {
    // Your handler logic here
    return ApiResponses.ok({ data: "success" });
  },
  {
    roles: [UserRole.USER, UserRole.ADMIN], // Optional role requirements
    permissions: ["course:view"], // Optional permission requirements
    rateLimit: {
      requests: 100,
      window: 3600000, // 1 hour
    },
    auditLog: true, // Enable audit logging
    customValidation: async (context) => {
      // Custom validation logic
    },
  }
);
```

#### `withAuth(handler, options)`

Convenience wrapper for any authenticated user.

```typescript
export const GET = withAuth(async (request, context) => {
  // Any authenticated user can access
});
```

#### `withAdminAuth(handler, options)`

Convenience wrapper for admin-only endpoints.

```typescript
export const DELETE = withAdminAuth(async (request, context) => {
  // Only admins can access
});
```

#### `withPermissions(permissions, handler, options)`

Convenience wrapper for permission-based access.

```typescript
export const POST = withPermissions(
  ["course:create", "course:edit_own"],
  async (request, context) => {
    // Users with specified permissions can access
  }
);
```

#### `withOwnership(getUserId, handler, options)`

Wrapper for resource ownership validation.

```typescript
export const PATCH = withOwnership(
  async (request) => {
    const body = await parseRequestBody(request);
    return body.resourceOwnerId; // Extract owner ID
  },
  async (request, context) => {
    // Only resource owner or admin can access
  }
);
```

#### `withPublicAPI(handler, options)`

Wrapper for public endpoints (no authentication required).

```typescript
export const GET = withPublicAPI(
  async (request) => {
    return ApiResponses.ok({ message: "Public data" });
  },
  {
    rateLimit: { requests: 1000, window: 3600000 },
    auditLog: false,
  }
);
```

### Authentication Context

The `APIAuthContext` object provides rich information about the authenticated request:

```typescript
interface APIAuthContext {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
    image: string | null;
    isOAuth: boolean;
    isTwoFactorEnabled: boolean;
  };
  request: {
    method: string;
    url: string;
    ip: string;
    userAgent: string | null;
    timestamp: Date;
  };
  permissions: {
    hasRole: (role: UserRole) => boolean;
    hasPermission: (permission: Permission) => Promise<boolean>;
    canAccess: (resource: {
      userId?: string;
      roles?: UserRole[];
      permissions?: Permission[];
    }) => Promise<boolean>;
  };
}
```

### Response Utilities

#### `ApiResponses`

Convenient response helpers:

```typescript
// Success responses
ApiResponses.ok(data) // 200
ApiResponses.created(data) // 201
ApiResponses.accepted(data) // 202
ApiResponses.noContent() // 204

// Error responses
ApiResponses.badRequest(message, details) // 400
ApiResponses.unauthorized(message) // 401
ApiResponses.forbidden(message) // 403
ApiResponses.notFound(message) // 404
ApiResponses.methodNotAllowed(allowedMethods) // 405
ApiResponses.conflict(message, details) // 409
ApiResponses.tooManyRequests(message) // 429
ApiResponses.internal(message) // 500
ApiResponses.serviceUnavailable(message) // 503
```

#### Request Body Parsing

```typescript
import { parseRequestBody, validateRequiredFields } from "@/lib/api";

export const POST = withAuth(async (request, context) => {
  const body = await parseRequestBody(request);
  validateRequiredFields(body, ["title", "description"]);
  
  const { title, description } = body;
  // Process request...
});
```

#### Custom Error Handling

```typescript
import { ApiError } from "@/lib/api";

export const GET = withAuth(async (request, context) => {
  if (someCondition) {
    throw ApiError.badRequest("Invalid input", { field: "someField" });
  }
  
  // Or throw with custom status
  throw new ApiError("Custom error", 422, "VALIDATION_FAILED");
});
```

## Configuration Options

### Rate Limiting

```typescript
{
  rateLimit: {
    requests: 100,              // Number of requests allowed
    window: 3600000,            // Time window in milliseconds
    skipSuccessfulRequests: false, // Don't count successful requests
    keyGenerator: (request, context) => { // Custom key generator
      return `${context?.user.id}:${request.method}`;
    }
  }
}
```

### Audit Logging

When enabled, audit logs include:
- User ID and role
- Request method and endpoint
- Client IP and user agent
- Success/failure status
- Error messages
- Response time

```typescript
{
  auditLog: true // Enable comprehensive request logging
}
```

### Custom Validation

```typescript
{
  customValidation: async (context: APIAuthContext) => {
    // Business logic validation
    if (!context.user.emailVerified) {
      throw ApiError.forbidden("Email verification required");
    }
    
    // Time-based restrictions
    const hour = new Date().getHours();
    if (hour < 9 || hour > 17) {
      throw ApiError.forbidden("Service unavailable outside business hours");
    }
  }
}
```

## Migration Guide

### From `lib/api-protection.ts`

**Before:**
```typescript
import { withRole } from "@/lib/api-protection";

export const GET = withRole(UserRole.ADMIN, async (request: NextRequest) => {
  return Response.json({ message: "Admin data" });
});
```

**After:**
```typescript
import { withAdminAuth, ApiResponses } from "@/lib/api";

export const GET = withAdminAuth(async (request, context) => {
  return ApiResponses.ok({ message: "Admin data" });
});
```

### Benefits of Migration

1. **Enhanced Context**: Access to rich user and request information
2. **Standardized Responses**: Consistent API response format
3. **Rate Limiting**: Built-in protection against abuse
4. **Audit Logging**: Comprehensive request tracking
5. **Better Error Handling**: Proper HTTP status codes and error messages
6. **TypeScript Support**: Full type safety
7. **Resource Ownership**: Built-in ownership validation

## Best Practices

### 1. Use Appropriate Wrappers

- `withPublicAPI`: For endpoints that don't require authentication
- `withAuth`: For general authenticated endpoints
- `withAdminAuth`: For admin-only operations
- `withPermissions`: For permission-specific operations
- `withOwnership`: For user resource management

### 2. Configure Rate Limiting

```typescript
// Generous for read operations
{ rateLimit: { requests: 1000, window: 3600000 } }

// Moderate for write operations
{ rateLimit: { requests: 100, window: 3600000 } }

// Strict for destructive operations
{ rateLimit: { requests: 10, window: 3600000 } }
```

### 3. Enable Audit Logging for Sensitive Operations

```typescript
export const DELETE = withAdminAuth(handler, {
  auditLog: true, // Always log destructive operations
  rateLimit: { requests: 10, window: 3600000 }
});
```

### 4. Handle Method Not Allowed

```typescript
const unsupportedMethod = () => {
  return ApiResponses.methodNotAllowed(["GET", "POST", "PUT"]);
};

export const HEAD = unsupportedMethod;
export const OPTIONS = unsupportedMethod;
export const DELETE = unsupportedMethod;
```

### 5. Use Structured Error Handling

```typescript
try {
  const result = await someOperation();
  return ApiResponses.ok(result);
} catch (error) {
  if (error instanceof ApiError) throw error;
  throw ApiError.internal("Operation failed");
}
```

## Examples

See the following files for complete examples:
- `/app/api/example/protected/route.ts` - Protected endpoints with various auth patterns
- `/app/api/example/public/route.ts` - Public endpoints with rate limiting

## Integration with Existing Systems

This system integrates seamlessly with your existing:
- NextAuth.js v5 authentication
- Prisma database layer
- Role management system (`lib/role-management.ts`)
- Rate limiting infrastructure (`lib/rate-limit.ts`)
- Logging system (`lib/logger.ts`)

## Security Considerations

1. **Rate Limiting**: All endpoints include rate limiting by default
2. **Audit Logging**: Enable for sensitive operations
3. **Input Validation**: Always validate request bodies
4. **Error Messages**: Don't leak sensitive information
5. **HTTPS**: Ensure all API routes use HTTPS in production
6. **CORS**: Configure appropriate CORS policies

## Monitoring and Debugging

### Enable Debug Logging

Set `NODE_ENV=development` to enable detailed logging.

### Monitor Rate Limits

Check the `X-RateLimit-*` headers in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: When the limit resets

### Audit Log Analysis

Audit logs include structured data for analysis:
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "userId": "user_123",
  "userRole": "USER",
  "method": "POST",
  "endpoint": "/api/courses",
  "ip": "192.168.1.1",
  "success": true,
  "responseTimeMs": 150
}
```