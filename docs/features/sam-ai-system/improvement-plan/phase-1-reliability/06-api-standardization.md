# API Standardization

**Timeline**: Weeks 11-12 (14 days)
**Priority**: 🟢 Important
**Budget**: $16,000
**Owner**: Senior Backend Engineer

---

## 📋 Executive Summary

Standardize all SAM API routes with versioning, consistent request/response formats, comprehensive validation, and OpenAPI documentation. This improves developer experience, enables backward compatibility, and facilitates API evolution.

### Current Problem
```
❌ Inconsistent API response formats across endpoints
❌ No API versioning strategy
❌ Inconsistent validation approaches
❌ No comprehensive API documentation
❌ Breaking changes deployed without notice
❌ Difficult to integrate with SAM APIs
❌ No request/response type safety
```

### Target Solution
```
✅ API versioning (/api/v1/sam/*)
✅ Standard response envelope for all endpoints
✅ Zod schema validation on all inputs
✅ Comprehensive OpenAPI 3.0 documentation
✅ TypeScript types auto-generated from schemas
✅ Backward compatibility guarantees
✅ API playground for testing
✅ Client SDK auto-generation
```

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ 100% of endpoints use versioned routes
- ✅ 100% of endpoints use standard response format
- ✅ 100% of inputs validated with Zod
- ✅ OpenAPI spec coverage 100%
- ✅ TypeScript types auto-generated and working
- ✅ API response time unchanged (<500ms p95)

### Developer Experience Metrics
- ✅ API integration time reduced by 60%
- ✅ API-related support tickets reduced by 80%
- ✅ Developer satisfaction >4.5/5
- ✅ Zero breaking changes without migration guide

### Business Metrics
- ✅ Third-party integrations increase by 50%
- ✅ API usage grows 30% (easier to use = more usage)
- ✅ Platform extensibility improved

---

## 🏗️ Technical Design

### API Versioning Strategy

```
/api/v1/sam/*     - Version 1 (current, stable)
/api/v2/sam/*     - Version 2 (future, breaking changes)
/api/sam/*        - Redirects to latest stable (v1)

Deprecation Timeline:
- v1 released: Month 0
- v2 released: Month 6
- v1 deprecated: Month 12
- v1 removed: Month 18
```

### Standard API Response Envelope

```typescript
// sam-ai-tutor/lib/api/response-envelope.ts

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
    cached?: boolean;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
  };
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Response builders
export class ResponseBuilder {
  static success<T>(
    data: T,
    options?: {
      requestId?: string;
      cached?: boolean;
      pagination?: {
        page: number;
        pageSize: number;
        total: number;
      };
    }
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: options?.requestId || crypto.randomUUID(),
        version: 'v1',
        ...(options?.cached !== undefined && { cached: options.cached })
      },
      ...(options?.pagination && {
        pagination: {
          ...options.pagination,
          hasMore: options.pagination.page * options.pagination.pageSize < options.pagination.total
        }
      })
    };
  }

  static error(
    code: string,
    message: string,
    options?: {
      requestId?: string;
      details?: Record<string, unknown>;
      retryable?: boolean;
    }
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        ...(options?.details && { details: options.details }),
        ...(options?.retryable !== undefined && { retryable: options.retryable })
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: options?.requestId || crypto.randomUUID(),
        version: 'v1'
      }
    };
  }
}
```

### Input Validation with Zod

```typescript
// sam-ai-tutor/lib/api/schemas/generate-questions.schema.ts

import { z } from 'zod';

export const GenerateQuestionsRequestSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
  sectionId: z.string().uuid('Invalid section ID format'),
  questionType: z.enum(['MCQ', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE'], {
    errorMap: () => ({ message: 'Invalid question type' })
  }),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: 'Invalid difficulty level' })
  }),
  count: z.number()
    .int('Count must be an integer')
    .min(1, 'Count must be at least 1')
    .max(20, 'Count cannot exceed 20'),
  bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])
    .optional(),
  learningStyle: z.enum(['VISUAL', 'AUDITORY', 'READING', 'KINESTHETIC'])
    .optional(),
  metadata: z.object({
    source: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional()
});

export type GenerateQuestionsRequest = z.infer<typeof GenerateQuestionsRequestSchema>;

export const GenerateQuestionsResponseSchema = z.object({
  questions: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['MCQ', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
    estimatedTime: z.number(), // seconds
    metadata: z.object({
      generated_at: z.string(),
      model: z.string(),
      cost: z.number()
    })
  })),
  summary: z.object({
    totalGenerated: z.number(),
    totalCost: z.number(),
    averageGenerationTime: z.number(),
    cacheHit: z.boolean()
  })
});

export type GenerateQuestionsResponse = z.infer<typeof GenerateQuestionsResponseSchema>;
```

### Validated API Route Pattern

```typescript
// sam-ai-tutor/lib/api/validated-route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { ResponseBuilder } from './response-envelope';
import { handleError } from '../errors/error-handler';
import { auth } from '@/lib/auth';

export interface RouteContext {
  requestId: string;
  userId?: string;
  params?: Record<string, string>;
}

export type ValidatedRouteHandler<TRequest, TResponse> = (
  data: TRequest,
  context: RouteContext
) => Promise<TResponse>;

export function createValidatedRoute<TRequest, TResponse>(
  requestSchema: ZodSchema<TRequest>,
  handler: ValidatedRouteHandler<TRequest, TResponse>,
  options?: {
    requireAuth?: boolean;
    responseSchema?: ZodSchema<TResponse>;
  }
) {
  return async (
    request: NextRequest,
    { params }: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

    try {
      // Authentication
      let userId: string | undefined;
      if (options?.requireAuth !== false) {
        const session = await auth();
        if (!session?.user?.id) {
          return NextResponse.json(
            ResponseBuilder.error('UNAUTHORIZED', 'Authentication required', { requestId }),
            { status: 401 }
          );
        }
        userId = session.user.id;
      }

      // Parse and validate request body
      const body = await request.json();
      const validatedData = requestSchema.parse(body);

      // Execute handler
      const result = await handler(validatedData, {
        requestId,
        userId,
        params
      });

      // Validate response (optional)
      if (options?.responseSchema) {
        options.responseSchema.parse(result);
      }

      // Return success response
      return NextResponse.json(
        ResponseBuilder.success(result, { requestId }),
        { status: 200 }
      );

    } catch (error) {
      return await handleError(error as Error, request, requestId);
    }
  };
}
```

### Usage Example

```typescript
// app/api/v1/sam/generate-questions/route.ts

import { createValidatedRoute } from '@/sam/lib/api/validated-route';
import {
  GenerateQuestionsRequestSchema,
  GenerateQuestionsResponseSchema,
  type GenerateQuestionsRequest,
  type GenerateQuestionsResponse
} from '@/sam/lib/api/schemas/generate-questions.schema';
import { questionGenerationEngine } from '@/sam/engines';

export const POST = createValidatedRoute<
  GenerateQuestionsRequest,
  GenerateQuestionsResponse
>(
  GenerateQuestionsRequestSchema,
  async (data, context) => {
    // Handler implementation
    const startTime = Date.now();

    const questions = await questionGenerationEngine.generateQuestions({
      courseId: data.courseId,
      sectionId: data.sectionId,
      questionType: data.questionType,
      difficulty: data.difficulty,
      count: data.count,
      bloomLevel: data.bloomLevel,
      learningStyle: data.learningStyle
    });

    const generationTime = Date.now() - startTime;

    return {
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        bloomLevel: q.bloomLevel,
        estimatedTime: q.estimatedTime,
        metadata: {
          generated_at: new Date().toISOString(),
          model: q.model,
          cost: q.cost
        }
      })),
      summary: {
        totalGenerated: questions.length,
        totalCost: questions.reduce((sum, q) => sum + q.cost, 0),
        averageGenerationTime: generationTime / questions.length,
        cacheHit: questions.every(q => q.cached)
      }
    };
  },
  {
    requireAuth: true,
    responseSchema: GenerateQuestionsResponseSchema
  }
);

// OpenAPI documentation
export const metadata = {
  openapi: {
    summary: 'Generate practice questions',
    description: 'Generate AI-powered practice questions based on course content',
    tags: ['SAM', 'Question Generation'],
    requestBody: {
      content: {
        'application/json': {
          schema: GenerateQuestionsRequestSchema
        }
      }
    },
    responses: {
      200: {
        description: 'Questions generated successfully',
        content: {
          'application/json': {
            schema: GenerateQuestionsResponseSchema
          }
        }
      },
      400: {
        description: 'Invalid request parameters'
      },
      401: {
        description: 'Unauthorized'
      },
      429: {
        description: 'Rate limit exceeded'
      }
    }
  }
};
```

### OpenAPI Specification Generation

```typescript
// scripts/generate-openapi.ts

import { writeFileSync } from 'fs';
import { generateOpenAPISpec } from '@/sam/lib/api/openapi-generator';

async function main() {
  console.log('Generating OpenAPI specification...');

  const spec = await generateOpenAPISpec({
    title: 'SAM AI Tutor API',
    version: '1.0.0',
    description: 'AI-powered educational content generation and analysis',
    servers: [
      {
        url: 'https://api.taxomind.com',
        description: 'Production'
      },
      {
        url: 'https://staging-api.taxomind.com',
        description: 'Staging'
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ]
  });

  // Write to file
  writeFileSync(
    './public/openapi.json',
    JSON.stringify(spec, null, 2),
    'utf-8'
  );

  console.log('✅ OpenAPI spec generated at ./public/openapi.json');

  // Generate TypeScript client
  console.log('Generating TypeScript client...');
  await generateTypeScriptClient(spec);

  console.log('✅ TypeScript client generated');
}

main().catch(console.error);
```

### TypeScript Client Auto-Generation

```typescript
// scripts/generate-client.ts

import { generateClient } from '@hey-api/openapi-ts';

async function generateTypeScriptClient(spec: OpenAPISpec) {
  await generateClient({
    input: './public/openapi.json',
    output: './sdk/typescript',
    client: 'fetch',
    types: {
      enums: 'typescript',
      dates: true
    },
    services: {
      asClass: true
    }
  });

  console.log('TypeScript SDK generated at ./sdk/typescript');
}
```

### API Playground

```typescript
// app/api-docs/page.tsx

'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function APIDocsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">SAM AI Tutor API Documentation</h1>

      <SwaggerUI
        url="/openapi.json"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        persistAuthorization={true}
      />
    </div>
  );
}
```

---

## 📝 Implementation Plan

### Week 11: API Standardization Foundation

#### Day 1-2: Response Envelope & Validation
- [ ] Implement `ResponseBuilder` class
- [ ] Implement `createValidatedRoute` helper
- [ ] Create standard error responses
- [ ] Unit tests for response builders

#### Day 3-4: Schema Migration
- [ ] Create Zod schemas for all 30+ SAM endpoints
- [ ] Define request/response TypeScript types
- [ ] Validate schemas with test data
- [ ] Document schema best practices

#### Day 5-6: API Route Migration
- [ ] Migrate all `/api/sam/*` to `/api/v1/sam/*`
- [ ] Update routes to use `createValidatedRoute`
- [ ] Add validation to all endpoints
- [ ] Test each endpoint migration

### Week 12: Documentation & Tooling

#### Day 7-8: OpenAPI Generation
- [ ] Implement OpenAPI spec generator
- [ ] Add OpenAPI metadata to all routes
- [ ] Generate complete OpenAPI 3.0 spec
- [ ] Validate spec with OpenAPI validator

#### Day 9-10: Client SDK Generation
- [ ] Generate TypeScript client SDK
- [ ] Generate Python client SDK (optional)
- [ ] Test generated SDKs
- [ ] Publish SDKs to npm/PyPI

#### Day 11-12: Documentation & Deployment
- [ ] Deploy Swagger UI playground
- [ ] Create API integration guide
- [ ] Create migration guide (v0 → v1)
- [ ] Deploy to staging
- [ ] Production rollout

#### Day 13-14: Testing & Validation
- [ ] E2E tests for all endpoints
- [ ] Load testing with new validation
- [ ] Verify backward compatibility
- [ ] Monitor API metrics

---

## 🧪 Testing Strategy

### Schema Validation Tests

```typescript
// __tests__/api/schemas.test.ts

describe('API Schemas', () => {
  describe('GenerateQuestionsRequestSchema', () => {
    it('should validate correct input', () => {
      const validInput = {
        courseId: '123e4567-e89b-12d3-a456-426614174000',
        sectionId: '123e4567-e89b-12d3-a456-426614174001',
        questionType: 'MCQ',
        difficulty: 'MEDIUM',
        count: 5
      };

      const result = GenerateQuestionsRequestSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidInput = {
        courseId: 'not-a-uuid',
        sectionId: '123e4567-e89b-12d3-a456-426614174001',
        questionType: 'MCQ',
        difficulty: 'MEDIUM',
        count: 5
      };

      const result = GenerateQuestionsRequestSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid course ID');
    });

    it('should reject count > 20', () => {
      const invalidInput = {
        courseId: '123e4567-e89b-12d3-a456-426614174000',
        sectionId: '123e4567-e89b-12d3-a456-426614174001',
        questionType: 'MCQ',
        difficulty: 'MEDIUM',
        count: 25
      };

      const result = GenerateQuestionsRequestSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('cannot exceed 20');
    });
  });
});
```

### API Route Tests

```typescript
// __tests__/api/v1/generate-questions.test.ts

describe('POST /api/v1/sam/generate-questions', () => {
  it('should return success response with correct envelope', async () => {
    const response = await fetch('http://localhost:3000/api/v1/sam/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        courseId: testCourseId,
        sectionId: testSectionId,
        questionType: 'MCQ',
        difficulty: 'MEDIUM',
        count: 5
      })
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    // Verify response envelope
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('metadata');
    expect(body.metadata).toHaveProperty('timestamp');
    expect(body.metadata).toHaveProperty('requestId');
    expect(body.metadata).toHaveProperty('version', 'v1');

    // Verify data structure
    expect(body.data).toHaveProperty('questions');
    expect(body.data.questions).toHaveLength(5);
  });

  it('should return validation error for invalid input', async () => {
    const response = await fetch('http://localhost:3000/api/v1/sam/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        courseId: 'invalid-uuid',
        sectionId: testSectionId,
        questionType: 'INVALID_TYPE',
        difficulty: 'MEDIUM',
        count: 25 // Too many
      })
    });

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('should require authentication', async () => {
    const response = await fetch('http://localhost:3000/api/v1/sam/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No auth header
      },
      body: JSON.stringify({
        courseId: testCourseId,
        sectionId: testSectionId,
        questionType: 'MCQ',
        difficulty: 'MEDIUM',
        count: 5
      })
    });

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
```

### OpenAPI Spec Validation

```typescript
// __tests__/api/openapi-validation.test.ts

import SwaggerParser from '@apidevtools/swagger-parser';

describe('OpenAPI Specification', () => {
  it('should be valid OpenAPI 3.0 spec', async () => {
    const spec = require('../../public/openapi.json');

    await expect(
      SwaggerParser.validate(spec)
    ).resolves.not.toThrow();
  });

  it('should have all required fields', async () => {
    const spec = require('../../public/openapi.json');

    expect(spec).toHaveProperty('openapi');
    expect(spec).toHaveProperty('info');
    expect(spec).toHaveProperty('servers');
    expect(spec).toHaveProperty('paths');
    expect(spec).toHaveProperty('components');
  });

  it('should have security schemes defined', async () => {
    const spec = require('../../public/openapi.json');

    expect(spec.components).toHaveProperty('securitySchemes');
    expect(spec.components.securitySchemes).toHaveProperty('bearerAuth');
  });
});
```

---

## 📊 Monitoring & Metrics

### API Metrics

```typescript
const apiMetrics = {
  requestsTotal: new client.Counter({
    name: 'sam_api_requests_total',
    help: 'Total API requests',
    labelNames: ['version', 'endpoint', 'status']
  }),

  validationErrors: new client.Counter({
    name: 'sam_api_validation_errors_total',
    help: 'Total validation errors',
    labelNames: ['endpoint', 'error_type']
  }),

  responseTime: new client.Histogram({
    name: 'sam_api_response_time_seconds',
    help: 'API response time',
    labelNames: ['version', 'endpoint'],
    buckets: [0.1, 0.5, 1, 2, 5]
  })
};
```

---

## 💰 Cost Analysis

### Engineering Costs
- Senior Backend Engineer (12 days): $9,600
- QA Engineer (2 days): $1,300
- Technical Writer (1 day): $800
- **Total Engineering**: $11,700

### Infrastructure Costs
- Swagger UI hosting: $0 (self-hosted)
- SDK publishing: $0 (free tier)
- **Total Infrastructure**: $0

### Operational Savings
- Reduced integration time saves ~$2,000/month
- Reduced support tickets saves ~$1,000/month
- **Total Monthly Savings**: $3,000

### ROI
- Initial investment: $16,000
- Monthly savings: $3,000
- **Payback period**: 5.3 months

**Total Budget**: ~$16,000

---

## ✅ Acceptance Criteria

- [ ] All endpoints migrated to `/api/v1/*`
- [ ] All endpoints use standard response envelope
- [ ] All inputs validated with Zod
- [ ] OpenAPI 3.0 spec generated and valid
- [ ] TypeScript SDK generated and tested
- [ ] Swagger UI playground deployed
- [ ] API integration guide published
- [ ] Migration guide created
- [ ] Backward compatibility verified
- [ ] Unit test coverage >90%
- [ ] E2E tests passing
- [ ] Load tests showing no performance regression
- [ ] Documentation complete
- [ ] Production rollout successful

---

## 📚 References

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Zod Documentation](https://zod.dev/)
- [API Versioning Best Practices](https://restfulapi.net/versioning/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [@hey-api/openapi-ts](https://github.com/hey-api/openapi-ts)

---

**Status**: Ready for Implementation
**Previous**: [Redis L2 Cache Implementation](./05-redis-l2-cache.md)
**Phase 1 Complete**: All 6 initiatives documented

---

## 🎉 Phase 1 Complete

All 6 Phase 1 initiatives are now documented. Proceed to implementation following the timeline in [Phase 1 README](./README.md).
