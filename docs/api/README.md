# Taxomind API Documentation

## Overview

The Taxomind API provides programmatic access to the intelligent learning management system, enabling developers to integrate with our AI-powered educational platform. This documentation covers all available endpoints, authentication methods, and best practices for using the API.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Versioning](#versioning)
- [SDKs and Tools](#sdks-and-tools)
- [Support](#support)

## Getting Started

### Base URLs

```
Development: http://localhost:3000/api
Staging:     https://staging.taxomind.com/api
Production:  https://api.taxomind.com
```

### Quick Start

1. **Register an account** at [https://taxomind.com/register](https://taxomind.com/register)
2. **Obtain authentication credentials** (see [Authentication](#authentication))
3. **Make your first API call**:

```bash
curl -X GET https://api.taxomind.com/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Interactive Documentation

Access our interactive API documentation powered by Swagger UI:
- Development: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- Production: [https://api.taxomind.com/docs](https://api.taxomind.com/docs)

## Authentication

The Taxomind API supports multiple authentication methods:

### 1. JWT Bearer Token

Most common method for API access:

```bash
# Login to get JWT token
curl -X POST https://api.taxomind.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "your-password"}'

# Use token in subsequent requests
curl -X GET https://api.taxomind.com/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Session Authentication

For browser-based applications using NextAuth.js:

```javascript
// Automatic session handling with NextAuth.js
const response = await fetch('/api/courses', {
  credentials: 'include' // Include session cookie
});
```

### 3. API Keys (Enterprise)

For server-to-server communication:

```bash
curl -X GET https://api.taxomind.com/courses \
  -H "X-API-Key: YOUR_API_KEY"
```

### 4. OAuth 2.0

For third-party integrations:

```
Authorization URL: https://taxomind.com/oauth/authorize
Token URL: https://taxomind.com/oauth/token
```

Available scopes:
- `read:courses` - Read course information
- `write:courses` - Create and modify courses
- `read:users` - Read user profiles
- `write:users` - Modify user profiles
- `admin` - Administrative access

### Multi-Factor Authentication (MFA)

For accounts with MFA enabled:

```bash
# Login with TOTP code
curl -X POST https://api.taxomind.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password",
    "totpCode": "123456"
  }'
```

## API Endpoints

### Core Resources

#### Authentication & Security
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/mfa/totp/setup` - Setup TOTP 2FA
- `POST /auth/mfa/totp/verify` - Verify TOTP code
- `GET /auth/mfa/recovery-codes` - Get recovery codes
- `POST /auth/trust-device` - Trust current device

#### User Management
- `GET /users` - List users
- `GET /users/{userId}` - Get user profile
- `PATCH /users/{userId}` - Update user profile
- `DELETE /users/{userId}` - Delete user account
- `GET /users/{userId}/courses` - Get user's courses
- `GET /users/{userId}/enrollments` - Get user's enrollments

#### Course Management
- `GET /courses` - List courses
- `POST /courses` - Create course
- `GET /courses/{courseId}` - Get course details
- `PATCH /courses/{courseId}` - Update course
- `DELETE /courses/{courseId}` - Delete course
- `POST /courses/{courseId}/publish` - Publish course
- `POST /courses/{courseId}/unpublish` - Unpublish course
- `POST /courses/{courseId}/enroll` - Enroll in course
- `POST /courses/{courseId}/unenroll` - Unenroll from course
- `POST /courses/generate-blueprint` - Generate course with AI

#### Chapter Management
- `GET /courses/{courseId}/chapters` - List chapters
- `POST /courses/{courseId}/chapters` - Create chapter
- `GET /chapters/{chapterId}` - Get chapter details
- `PATCH /chapters/{chapterId}` - Update chapter
- `DELETE /chapters/{chapterId}` - Delete chapter
- `POST /chapters/{chapterId}/progress` - Mark chapter progress

#### Section Management
- `GET /chapters/{chapterId}/sections` - List sections
- `POST /chapters/{chapterId}/sections` - Create section
- `PATCH /sections/{sectionId}` - Update section
- `DELETE /sections/{sectionId}` - Delete section
- `POST /sections/generate-content` - Generate section content with AI
- `POST /sections/analyze-content` - Analyze section content

#### Analytics & Progress
- `GET /analytics/progress` - Get progress metrics
- `GET /analytics/course/{courseId}` - Course analytics
- `GET /learning-analytics/personal` - Personal learning analytics
- `GET /teacher-analytics/course-overview` - Teacher course overview
- `GET /teacher-analytics/student-profile` - Student profile analytics
- `GET /progress/metrics` - Detailed progress metrics

#### SAM AI Assistant
- `POST /sam/chat` - Chat with SAM
- `POST /sam/ai-tutor/socratic` - Socratic tutoring
- `POST /sam/ai-tutor/adaptive-content` - Generate adaptive content
- `POST /sam/ai-tutor/practice-problems` - Generate practice problems
- `POST /sam/ai-tutor/assessment-engine` - AI-powered assessments
- `POST /sam/ai-tutor/motivation-engine` - Motivational content
- `POST /sam/ai-tutor/content-companion` - Content recommendations
- `POST /sam/blooms-analysis` - Bloom's taxonomy analysis
- `POST /sam/course-guide` - Course guidance
- `POST /sam/exam-engine` - Exam generation
- `POST /sam/ai-news` - Educational news
- `POST /sam/ai-research` - Research assistance

#### Social Features
- `GET /posts` - List posts
- `POST /posts` - Create post
- `GET /posts/{postId}` - Get post details
- `PATCH /posts/{postId}` - Update post
- `DELETE /posts/{postId}` - Delete post
- `POST /posts/{postId}/publish` - Publish post
- `GET /posts/{postId}/comments` - Get comments
- `POST /posts/{postId}/comments` - Add comment
- `POST /posts/{postId}/comments/{commentId}/replies` - Add reply
- `POST /posts/{postId}/comments/{commentId}/reactions` - Add reaction

#### Groups & Collaboration
- `GET /groups` - List groups
- `POST /groups` - Create group
- `GET /groups/{groupId}` - Get group details
- `POST /groups/{groupId}/join` - Join group
- `POST /groups/{groupId}/leave` - Leave group
- `GET /groups/{groupId}/discussions` - Group discussions
- `POST /collaboration/session` - Start collaboration session
- `POST /collaboration/message` - Send collaboration message

#### Templates & Content
- `GET /templates` - List templates
- `POST /templates` - Create template
- `GET /templates/{templateId}` - Get template
- `POST /templates/{templateId}/apply` - Apply template
- `GET /templates/categories` - Template categories
- `POST /templates/import` - Import template
- `POST /templates/export` - Export template
- `GET /content/versions` - Content versions
- `POST /content/versions` - Create version

#### Administrative
- `GET /admin/users` - List all users (admin)
- `GET /admin/mfa-status` - MFA status overview
- `GET /admin/courses` - All courses overview
- `GET /admin/analytics` - System analytics
- `GET /security/alerts` - Security alerts
- `GET /audit-logs` - Audit logs
- `POST /admin/user/{userId}/lock` - Lock user account
- `POST /admin/user/{userId}/unlock` - Unlock user account

#### Billing & Payments
- `GET /bills` - List bills
- `POST /bills` - Create bill
- `GET /bills/{billId}` - Get bill details
- `POST /payments/checkout` - Process payment
- `GET /subscriptions` - List subscriptions
- `POST /subscriptions` - Create subscription
- `PATCH /subscriptions/{id}` - Update subscription

## Rate Limiting

API rate limits vary by authentication type and plan:

| Plan | Requests/Minute | Burst Limit |
|------|----------------|-------------|
| Anonymous | 20 | 5 |
| Free | 100 | 20 |
| Pro | 500 | 100 |
| Enterprise | Custom | Custom |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642076400
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `PAYMENT_REQUIRED` | Payment required for access |
| `CONFLICT` | Resource conflict |

### Error Handling Best Practices

```javascript
try {
  const response = await fetch('/api/courses', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Refresh token or redirect to login
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Implement exponential backoff
        break;
      default:
        // Handle general error
    }
  }
  
  const data = await response.json();
} catch (error) {
  // Handle network errors
}
```

## Pagination

List endpoints support pagination with the following parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max: 100) |
| `sort` | string | createdAt:desc | Sort field and order |

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Pagination Example

```javascript
// Fetch all courses with pagination
async function fetchAllCourses() {
  const courses = [];
  let page = 1;
  let hasNext = true;
  
  while (hasNext) {
    const response = await fetch(`/api/courses?page=${page}&limit=50`);
    const data = await response.json();
    
    courses.push(...data.data);
    hasNext = data.meta.hasNext;
    page++;
  }
  
  return courses;
}
```

## Filtering & Searching

Most list endpoints support filtering and searching:

### Filtering

```bash
# Filter by single field
GET /api/courses?categoryId=abc123

# Filter by multiple fields
GET /api/courses?level=BEGINNER&isPublished=true

# Filter by date range
GET /api/courses?dateFrom=2024-01-01&dateTo=2024-12-31
```

### Searching

```bash
# Full-text search
GET /api/courses?search=javascript

# Search with filters
GET /api/courses?search=react&level=INTERMEDIATE
```

### Advanced Filtering

```javascript
// Complex filtering with query builder
const params = new URLSearchParams({
  'filter[price][gte]': '50',
  'filter[price][lte]': '200',
  'filter[rating][gte]': '4',
  'sort': 'rating:desc',
  'limit': '10'
});

const response = await fetch(`/api/courses?${params}`);
```

## Versioning

The API uses URL versioning. The current version is v1 (implicit).

Future versions will be accessible at:
- `https://api.taxomind.com/v2/courses`

### Version Deprecation Policy

- New versions are released with 6 months notice
- Deprecated versions remain available for 12 months
- Breaking changes are documented in release notes

## Webhooks

Configure webhooks to receive real-time notifications:

### Available Events

- `course.created` - New course created
- `course.published` - Course published
- `enrollment.created` - User enrolled in course
- `payment.completed` - Payment processed
- `user.registered` - New user registration

### Webhook Payload

```json
{
  "event": "course.published",
  "timestamp": "2024-01-17T10:00:00Z",
  "data": {
    "courseId": "abc123",
    "title": "Course Title",
    "userId": "user123"
  }
}
```

### Webhook Security

Verify webhook signatures:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```

## SDKs and Tools

### Official SDKs

- **JavaScript/TypeScript**: `npm install @taxomind/sdk`
- **Python**: `pip install taxomind-sdk`
- **Go**: `go get github.com/taxomind/go-sdk`

### TypeScript SDK Example

```typescript
import { TaxomindClient } from '@taxomind/sdk';

const client = new TaxomindClient({
  apiKey: process.env.TAXOMIND_API_KEY,
  environment: 'production'
});

// List courses
const courses = await client.courses.list({
  limit: 20,
  level: 'BEGINNER'
});

// Create course
const course = await client.courses.create({
  title: 'Introduction to TypeScript',
  description: 'Learn TypeScript fundamentals',
  categoryId: 'programming'
});

// Enroll in course
await client.enrollments.create({
  courseId: course.id
});
```

### Postman Collection

Download our Postman collection:
[https://api.taxomind.com/postman-collection.json](https://api.taxomind.com/postman-collection.json)

### OpenAPI Specification

Access the OpenAPI 3.0 specification:
- YAML: [https://api.taxomind.com/openapi.yaml](https://api.taxomind.com/openapi.yaml)
- JSON: [https://api.taxomind.com/openapi.json](https://api.taxomind.com/openapi.json)

## Testing

### Test Environment

Use the staging environment for testing:
- Base URL: `https://staging.taxomind.com/api`
- Test credentials available upon request

### Test Data

Create test data using the `/test` endpoints:
```bash
POST /api/test/generate-data
```

### Rate Limits in Testing

Staging environment has relaxed rate limits:
- 1000 requests/minute
- No burst limits

## Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use HTTPS for all API requests**
3. **Implement request signing for sensitive operations**
4. **Rotate API keys regularly**
5. **Use OAuth 2.0 for third-party integrations**
6. **Enable MFA for administrative accounts**
7. **Monitor API usage for anomalies**
8. **Implement proper CORS policies**

## Compliance

### GDPR Compliance

- `GET /users/{userId}/data` - Export user data
- `DELETE /users/{userId}` - Delete user account
- `POST /users/{userId}/consent` - Update consent preferences

### Data Retention

- User data: Retained for account lifetime + 30 days
- Logs: 90 days
- Analytics: 2 years
- Backups: 30 days

## Monitoring & Status

### API Status

Check API status:
- Status Page: [https://status.taxomind.com](https://status.taxomind.com)
- Health Check: `GET /api/health`

### Response Time SLAs

| Endpoint Type | P50 | P95 | P99 |
|--------------|-----|-----|-----|
| Read | 50ms | 200ms | 500ms |
| Write | 100ms | 500ms | 1000ms |
| AI Operations | 500ms | 2000ms | 5000ms |

## Support

### Getting Help

- **Documentation**: [https://docs.taxomind.com](https://docs.taxomind.com)
- **API Reference**: [https://api.taxomind.com/docs](https://api.taxomind.com/docs)
- **Support Email**: api-support@taxomind.com
- **Discord Community**: [https://discord.gg/taxomind](https://discord.gg/taxomind)
- **Stack Overflow**: Tag questions with `taxomind-api`

### Reporting Issues

Report API issues via:
1. GitHub Issues: [https://github.com/taxomind/api-issues](https://github.com/taxomind/api-issues)
2. Support Portal: [https://support.taxomind.com](https://support.taxomind.com)

Include:
- API endpoint
- Request/response examples
- Error messages
- Timestamp
- Request ID (from headers)

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- 100+ endpoints
- OAuth 2.0 support
- Webhook system
- Rate limiting
- Comprehensive analytics

### Roadmap
- GraphQL API (Q2 2025)
- WebSocket support (Q3 2025)
- Batch operations (Q3 2025)
- API Gateway (Q4 2025)

---

*Last updated: January 2025*  
*API Version: 1.0.0*  
*OpenAPI Specification: 3.0.3*