/**
 * OpenAPI configuration for Taxomind API
 * Comprehensive documentation for all API endpoints
 */

// OpenAPI 3.0 Document type definition
interface OpenAPIDocument {
  openapi: string;
  info: any;
  servers?: any[];
  tags?: any[];
  paths?: any;
  components?: any;
}

export const swaggerConfig: OpenAPIDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Taxomind API',
    description: `
# Taxomind API Documentation

Taxomind is an intelligent learning management system (LMS) built with Next.js 15, featuring AI-powered adaptive learning, real-time analytics, and enterprise-grade security.

## Features
- **AI-Powered Learning**: SAM AI engine for personalized education
- **Adaptive Content**: Dynamic content generation and optimization
- **Real-time Analytics**: Comprehensive learning analytics and insights
- **Enterprise Security**: Multi-factor authentication, SSO, and audit logging
- **Role-Based Access**: Granular permissions for students, teachers, and administrators

## Authentication
The API uses JWT-based authentication with NextAuth.js v5. Most endpoints require authentication.

### Authentication Methods:
- **Bearer Token**: Include JWT token in Authorization header
- **Session Cookie**: Automatic for browser-based requests
- **API Keys**: For server-to-server communication (enterprise plans)

## Rate Limiting
- **Standard**: 100 requests per minute
- **Authenticated**: 500 requests per minute
- **Enterprise**: Custom limits available

## Response Format
All API responses follow a consistent format:
\`\`\`json
{
  "success": boolean,
  "data": object | array,
  "error": string | null,
  "meta": {
    "timestamp": "ISO 8601",
    "version": "1.0.0"
  }
}
\`\`\`

## Error Codes
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Missing or invalid authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error

## Pagination
List endpoints support pagination:
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 20, max: 100)
- \`sort\`: Sort field and order (e.g., "createdAt:desc")

## Filtering
Most list endpoints support filtering:
- \`filter[field]\`: Filter by specific field value
- \`search\`: Full-text search across relevant fields
- \`dateFrom\`, \`dateTo\`: Date range filtering
    `,
    version: '1.0.0',
    termsOfService: 'https://taxomind.com/terms',
    contact: {
      name: 'Taxomind Support',
      email: 'support@taxomind.com',
      url: 'https://taxomind.com/support',
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
    {
      url: 'https://staging.taxomind.com/api',
      description: 'Staging server',
    },
    {
      url: 'https://api.taxomind.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management and profile operations',
    },
    {
      name: 'Courses',
      description: 'Course creation, management, and enrollment',
    },
    {
      name: 'Chapters',
      description: 'Course chapter management',
    },
    {
      name: 'Sections',
      description: 'Chapter section management',
    },
    {
      name: 'Analytics',
      description: 'Learning analytics and progress tracking',
    },
    {
      name: 'SAM AI',
      description: 'AI-powered learning assistant endpoints',
    },
    {
      name: 'Admin',
      description: 'Administrative operations',
    },
    {
      name: 'Social',
      description: 'Social features including posts, comments, and reactions',
    },
    {
      name: 'Templates',
      description: 'Content template management',
    },
    {
      name: 'Security',
      description: 'Security features including MFA and audit logs',
    },
    {
      name: 'Billing',
      description: 'Payment and subscription management',
    },
    {
      name: 'Content',
      description: 'Content management and versioning',
    },
    {
      name: 'Collaboration',
      description: 'Real-time collaboration features',
    },
    {
      name: 'Groups',
      description: 'Group management and discussions',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from authentication endpoint',
      },
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Session cookie from NextAuth.js',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for server-to-server communication',
      },
      oauth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://taxomind.com/oauth/authorize',
            tokenUrl: 'https://taxomind.com/oauth/token',
            scopes: {
              'read:courses': 'Read course information',
              'write:courses': 'Create and modify courses',
              'read:users': 'Read user profiles',
              'write:users': 'Modify user profiles',
              'admin': 'Administrative access',
            },
          },
        },
      },
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'object' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          image: { type: 'string', format: 'uri' },
          role: { type: 'string', enum: ['USER', 'ADMIN', 'TEACHER'] },
          createdAt: { type: 'string', format: 'date-time' },
          isTeacher: { type: 'boolean' },
          totalCoursesCreated: { type: 'integer' },
          instructorRating: { type: 'number', format: 'float' },
        },
      },
      UserProfile: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            properties: {
              phone: { type: 'string' },
              learningStyle: { type: 'string' },
              samLevel: { type: 'integer' },
              samTotalPoints: { type: 'integer' },
              totalRevenue: { type: 'number', format: 'decimal' },
              walletBalance: { type: 'number', format: 'decimal' },
              isTwoFactorEnabled: { type: 'boolean' },
              affiliateCode: { type: 'string' },
              isAffiliate: { type: 'boolean' },
            },
          },
        ],
      },
      // Course schemas
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          imageUrl: { type: 'string', format: 'uri' },
          price: { type: 'number', format: 'float' },
          isPublished: { type: 'boolean' },
          categoryId: { type: 'string' },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
          duration: { type: 'integer' },
          prerequisites: { type: 'array', items: { type: 'string' } },
          learningObjectives: { type: 'array', items: { type: 'string' } },
        },
      },
      CourseWithStats: {
        allOf: [
          { $ref: '#/components/schemas/Course' },
          {
            type: 'object',
            properties: {
              enrollmentCount: { type: 'integer' },
              completionRate: { type: 'number', format: 'float' },
              averageRating: { type: 'number', format: 'float' },
              totalRevenue: { type: 'number', format: 'decimal' },
              chaptersCount: { type: 'integer' },
              user: { $ref: '#/components/schemas/User' },
              category: { $ref: '#/components/schemas/Category' },
            },
          },
        ],
      },
      Chapter: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          videoUrl: { type: 'string', format: 'uri' },
          position: { type: 'integer' },
          isPublished: { type: 'boolean' },
          isFree: { type: 'boolean' },
          courseId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Section: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          contentType: { type: 'string', enum: ['TEXT', 'VIDEO', 'QUIZ', 'ASSIGNMENT'] },
          position: { type: 'integer' },
          isPublished: { type: 'boolean' },
          chapterId: { type: 'string' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' },
          color: { type: 'string' },
        },
      },
      Enrollment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          userId: { type: 'string' },
          courseId: { type: 'string' },
          progress: { type: 'number', format: 'float' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          enrolledAt: { type: 'string', format: 'date-time' },
          lastAccessedAt: { type: 'string', format: 'date-time' },
        },
      },
      // Analytics schemas
      ProgressMetrics: {
        type: 'object',
        properties: {
          totalCourses: { type: 'integer' },
          completedCourses: { type: 'integer' },
          inProgressCourses: { type: 'integer' },
          overallProgress: { type: 'number', format: 'float' },
          totalLearningTime: { type: 'integer' },
          streakDays: { type: 'integer' },
          achievements: { type: 'array', items: { type: 'string' } },
        },
      },
      LearningAnalytics: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          courseId: { type: 'string' },
          timeSpent: { type: 'integer' },
          completionRate: { type: 'number', format: 'float' },
          quizScores: { type: 'array', items: { type: 'number' } },
          engagementScore: { type: 'number', format: 'float' },
          learningPath: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
      // Social schemas
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string' },
          content: { type: 'string' },
          authorId: { type: 'string' },
          published: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          likes: { type: 'integer' },
          commentsCount: { type: 'integer' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          content: { type: 'string' },
          authorId: { type: 'string' },
          postId: { type: 'string' },
          parentId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          likes: { type: 'integer' },
        },
      },
      // SAM AI schemas
      SAMRequest: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          context: { type: 'object' },
          mode: { type: 'string', enum: ['tutor', 'assistant', 'analyzer', 'generator'] },
          courseId: { type: 'string', nullable: true },
          chapterId: { type: 'string', nullable: true },
        },
        required: ['prompt', 'mode'],
      },
      SAMResponse: {
        type: 'object',
        properties: {
          response: { type: 'string' },
          suggestions: { type: 'array', items: { type: 'string' } },
          resources: { type: 'array', items: { type: 'object' } },
          confidence: { type: 'number', format: 'float' },
          tokens: { type: 'integer' },
        },
      },
      // Security schemas
      MFASetup: {
        type: 'object',
        properties: {
          secret: { type: 'string' },
          qrCode: { type: 'string', format: 'uri' },
          backupCodes: { type: 'array', items: { type: 'string' } },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          action: { type: 'string' },
          resource: { type: 'string' },
          details: { type: 'object' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: 'Authentication required',
              code: 'UNAUTHORIZED',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: 'Insufficient permissions',
              code: 'FORBIDDEN',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: 'Resource not found',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: {
                field: 'email',
                message: 'Invalid email format',
              },
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: 100,
                remaining: 0,
                reset: '2025-01-17T12:00:00Z',
              },
            },
          },
        },
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and order (e.g., "createdAt:desc")',
        schema: { type: 'string' },
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search query',
        schema: { type: 'string' },
      },
      CourseIdParam: {
        name: 'courseId',
        in: 'path',
        required: true,
        description: 'Course ID',
        schema: { type: 'string' },
      },
      UserIdParam: {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'User ID',
        schema: { type: 'string' },
      },
      ChapterIdParam: {
        name: 'chapterId',
        in: 'path',
        required: true,
        description: 'Chapter ID',
        schema: { type: 'string' },
      },
    },
  },
  paths: {},
};

export default swaggerConfig;