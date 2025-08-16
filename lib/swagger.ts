// Static OpenAPI specification to avoid module issues
const swaggerDefinition = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alam LMS API',
      version: '1.0.0',
      description: 'Comprehensive Learning Management System API',
      contact: {
        name: 'API Support',
        email: 'support@alamlms.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://alamlms.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            role: {
              type: 'string',
              enum: ['USER', 'STUDENT', 'TEACHER', 'ADMIN'],
              description: 'User role in the system',
            },
            image: {
              type: 'string',
              nullable: true,
              description: 'User profile image URL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
          required: ['id', 'email', 'role'],
        },
        course: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique course identifier',
            },
            title: {
              type: 'string',
              description: 'Course title',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Course description',
            },
            imageUrl: {
              type: 'string',
              nullable: true,
              description: 'Course cover image URL',
            },
            price: {
              type: 'number',
              nullable: true,
              description: 'Course price in USD',
            },
            isPublished: {
              type: 'boolean',
              description: 'Whether the course is published',
            },
            isFeatured: {
              type: 'boolean',
              description: 'Whether the course is featured',
            },
            categoryId: {
              type: 'string',
              nullable: true,
              description: 'Course category identifier',
            },
            userId: {
              type: 'string',
              description: 'Course creator identifier',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Course creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Course last update timestamp',
            },
          },
          required: ['id', 'title', 'isPublished', 'userId'],
        },
        Chapter: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique chapter identifier',
            },
            title: {
              type: 'string',
              description: 'Chapter title',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Chapter description',
            },
            videoUrl: {
              type: 'string',
              nullable: true,
              description: 'Chapter video URL',
            },
            position: {
              type: 'integer',
              description: 'Chapter position in course',
            },
            isPublished: {
              type: 'boolean',
              description: 'Whether the chapter is published',
            },
            isFree: {
              type: 'boolean',
              description: 'Whether the chapter is free',
            },
            courseId: {
              type: 'string',
              description: 'Parent course identifier',
            },
          },
          required: ['id', 'title', 'position', 'courseId'],
        },
        Section: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique section identifier',
            },
            title: {
              type: 'string',
              description: 'Section title',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Section description',
            },
            videoUrl: {
              type: 'string',
              nullable: true,
              description: 'Section video URL',
            },
            position: {
              type: 'integer',
              description: 'Section position in chapter',
            },
            isPublished: {
              type: 'boolean',
              description: 'Whether the section is published',
            },
            isFree: {
              type: 'boolean',
              description: 'Whether the section is free',
            },
            duration: {
              type: 'integer',
              nullable: true,
              description: 'Section duration in seconds',
            },
            chapterId: {
              type: 'string',
              description: 'Parent chapter identifier',
            },
          },
          required: ['id', 'title', 'position', 'chapterId'],
        },
        Analytics: {
          type: 'object',
          properties: {
            totalRevenue: {
              type: 'number',
              description: 'Total revenue in USD',
            },
            totalSales: {
              type: 'integer',
              description: 'Total number of sales',
            },
            totalCourses: {
              type: 'integer',
              description: 'Total number of courses',
            },
            totalStudents: {
              type: 'integer',
              description: 'Total number of students',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
          required: ['error'],
        },
        WebVital: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              enum: ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'],
              description: 'Web vital metric name',
            },
            value: {
              type: 'number',
              description: 'Metric value',
            },
            rating: {
              type: 'string',
              enum: ['good', 'needs-improvement', 'poor'],
              description: 'Performance rating',
            },
            delta: {
              type: 'number',
              description: 'Delta from previous measurement',
            },
            url: {
              type: 'string',
              description: 'Page URL',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Measurement timestamp',
            },
          },
          required: ['name', 'value', 'rating'],
        },
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Courses',
        description: 'Course management operations',
      },
      {
        name: 'Chapters',
        description: 'Chapter management operations',
      },
      {
        name: 'Sections',
        description: 'Section management operations',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Categories',
        description: 'Course category operations',
      },
      {
        name: 'Search',
        description: 'Search functionality',
      },
      {
        name: 'Performance',
        description: 'Performance monitoring',
      },
    ],
  }
}

// Export static spec directly to avoid swagger-jsdoc module issues
export const swaggerSpec = {
  ...swaggerDefinition.definition,
  paths: {
    '/api/courses': {
      get: {
        tags: ['Courses'],
        summary: 'Get all published courses',
        description: 'Retrieve a list of all published courses with optional category filtering',
        parameters: [
          {
            name: 'categoryId',
            in: 'query',
            description: 'Filter by category ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'List of courses' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Server error' }
        }
      },
      post: {
        tags: ['Courses'],
        summary: 'Create a new course',
        description: 'Create a new course (requires teacher/admin role)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  categoryId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Course created' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/analytics/web-vitals': {
      post: {
        tags: ['Performance'],
        summary: 'Submit web vitals data',
        description: 'Submit Core Web Vitals performance metrics',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  id: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Metrics recorded' },
          '400': { description: 'Invalid data' },
          '500': { description: 'Server error' }
        }
      }
    }
  }
}