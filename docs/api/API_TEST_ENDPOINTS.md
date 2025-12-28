# API Test Endpoints Documentation

## Overview

This document provides comprehensive documentation for all API test endpoints available in the Taxomind LMS platform. These endpoints are designed for testing, monitoring, and debugging various aspects of the application.

## Table of Contents

1. [Comprehensive Test Endpoint](#1-comprehensive-test-endpoint)
2. [Health Check Endpoint](#2-health-check-endpoint)
3. [Performance Test Endpoint](#3-performance-test-endpoint)
4. [Database Test Endpoint](#4-database-test-endpoint)
5. [Authentication Test Endpoint](#5-authentication-test-endpoint)
6. [Data Validation Test Endpoint](#6-data-validation-test-endpoint)
7. [Quick Reference](#quick-reference)
8. [Best Practices](#best-practices)

---

## 1. Comprehensive Test Endpoint

**Base URL:** `/api/test/comprehensive`

### GET Request

Tests various aspects of API functionality including headers, query parameters, and response codes.

#### Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `type` | string | Test type to run | `basic`, `headers`, `query`, `response_codes` |
| `code` | number | HTTP response code to test | `200`, `404`, `500` |

#### Examples

```bash
# Basic test
GET /api/test/comprehensive?type=basic

# Test headers
GET /api/test/comprehensive?type=headers

# Test query parameters
GET /api/test/comprehensive?type=query&page=1&limit=10&sort=asc

# Test specific response code
GET /api/test/comprehensive?code=404
```

#### Response Examples

```json
// Basic test response
{
  "success": true,
  "testType": "basic",
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-11T10:00:00.000Z",
    "environment": "development",
    "version": "1.0.0"
  }
}

// Headers test response
{
  "success": true,
  "testType": "headers",
  "data": {
    "headers": {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0..."
    },
    "cookies": [],
    "url": "http://localhost:3000/api/test/comprehensive",
    "method": "GET"
  }
}
```

### POST Request

Tests request body handling and validation.

#### Request Body

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "data": {
    "custom": "any data structure"
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "POST request processed successfully",
  "received": {
    "name": "Test User",
    "email": "test@example.com",
    "data": {
      "custom": "any data structure"
    }
  },
  "timestamp": "2025-01-11T10:00:00.000Z",
  "headers": {
    "contentType": "application/json",
    "contentLength": "123"
  }
}
```

### PUT/PATCH/DELETE Requests

Similar structure to POST with operation-specific responses.

---

## 2. Health Check Endpoint

**Base URL:** `/api/test/health`

### GET Request

Provides comprehensive system health information including database status, system metrics, and environment details.

#### Response Structure

```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T10:00:00.000Z",
  "responseTime": "45ms",
  "database": {
    "status": "connected",
    "latency": "12ms"
  },
  "system": {
    "platform": "darwin",
    "architecture": "arm64",
    "nodeVersion": "v20.0.0",
    "uptime": 3600,
    "memory": {
      "total": 17179869184,
      "free": 8589934592,
      "used": 8589934592,
      "percentage": "50.00%"
    },
    "cpu": {
      "model": "Apple M1",
      "cores": 8,
      "loadAverage": [2.5, 2.3, 2.1]
    },
    "process": {
      "pid": 12345,
      "memoryUsage": {
        "rss": 123456789,
        "heapTotal": 98765432,
        "heapUsed": 87654321,
        "external": 1234567
      },
      "cpuUsage": {
        "user": 1234567,
        "system": 7654321
      }
    }
  },
  "environment": {
    "nodeEnv": "development",
    "isDevelopment": true,
    "isProduction": false,
    "hasDatabase": true,
    "hasAuth": true
  },
  "checks": {
    "api": "operational",
    "database": "operational",
    "memory": "healthy"
  }
}
```

### HEAD Request

Simple liveness probe that returns 200 OK with no body.

```bash
HEAD /api/test/health
# Returns: 200 OK
```

---

## 3. Performance Test Endpoint

**Base URL:** `/api/test/performance`

### GET Request

Runs various performance tests to measure system capabilities.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `test` | string | `basic` | Type of performance test |
| `iterations` | number | `100` | Number of iterations |
| `delay` | number | `0` | Delay in milliseconds (for async tests) |

#### Available Tests

| Test Type | Description |
|-----------|-------------|
| `basic` | Simple performance check |
| `cpu` | CPU intensive operations |
| `memory` | Memory allocation test |
| `database` | Database query performance |
| `async` | Async operations test |
| `stress` | Mixed stress test |
| `cache` | Cache performance testing |

#### Examples

```bash
# CPU performance test
GET /api/test/performance?test=cpu&iterations=1000

# Database performance test
GET /api/test/performance?test=database&iterations=5

# Async operations with delay
GET /api/test/performance?test=async&iterations=100&delay=10

# Stress test
GET /api/test/performance?test=stress&iterations=50

# Cache performance test
GET /api/test/performance?test=cache
```

#### Response Example

```json
{
  "success": true,
  "test": "cpu",
  "startTime": "2025-01-11T10:00:00.000Z",
  "iterations": 1000,
  "cpuResult": 12345.6789,
  "executionTime": "234ms",
  "performanceMetrics": {
    "requestsPerSecond": 4273.5,
    "averageResponseTime": 0.234
  }
}
```

### POST Request

Load testing endpoint that echoes payload and generates response data.

#### Request Body

```json
{
  "payload": {
    "test": "data"
  },
  "size": 10
}
```

---

## 4. Database Test Endpoint

**Base URL:** `/api/test/database`

### GET Request

Tests various database operations and connectivity.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `operation` | string | Database operation to test |

#### Available Operations

| Operation | Description |
|-----------|-------------|
| `status` | Check connection status |
| `ping` | Measure database latency |
| `tables` | List all database tables |
| `counts` | Get record counts for main tables |
| `query` | Test various query types |
| `indexes` | Check database indexes |
| `connections` | Check active connections |
| `transaction` | Test transaction capability |

#### Examples

```bash
# Check database status
GET /api/test/database?operation=status

# Measure latency
GET /api/test/database?operation=ping

# List all tables
GET /api/test/database?operation=tables

# Get record counts
GET /api/test/database?operation=counts

# Test queries
GET /api/test/database?operation=query

# Check indexes
GET /api/test/database?operation=indexes

# Check connections
GET /api/test/database?operation=connections
```

#### Response Examples

```json
// Status check
{
  "success": true,
  "timestamp": "2025-01-11T10:00:00.000Z",
  "operation": "status",
  "connection": "connected",
  "status": "healthy"
}

// Record counts
{
  "success": true,
  "operation": "counts",
  "recordCounts": {
    "users": 1234,
    "courses": 567,
    "chapters": 890,
    "sections": 2345,
    "enrollments": 678,
    "purchases": 345
  },
  "totalRecords": 6129
}
```

### POST Request

Tests database write operations.

#### Request Body

```json
{
  "test": "create"  // or "bulk"
}
```

---

## 5. Authentication Test Endpoint

**Base URL:** `/api/test/auth`

### GET Request

Tests authentication and authorization functionality.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `test` | string | Authentication test to run |

#### Available Tests

| Test Type | Description |
|-----------|-------------|
| `session` | Check current session |
| `providers` | List auth providers |
| `jwt` | Test JWT functionality |
| `bcrypt` | Test password hashing |
| `permissions` | Check user permissions |
| `cookies` | Inspect auth cookies |
| `headers` | Check auth headers |

#### Examples

```bash
# Check current session
GET /api/test/auth?test=session

# List providers
GET /api/test/auth?test=providers

# Test JWT
GET /api/test/auth?test=jwt

# Test permissions
GET /api/test/auth?test=permissions
```

#### Response Examples

```json
// Session test
{
  "success": true,
  "test": "session",
  "timestamp": "2025-01-11T10:00:00.000Z",
  "hasSession": true,
  "sessionData": {
    "userId": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "expires": "2025-01-12T10:00:00.000Z"
  }
}

// Permissions test
{
  "success": true,
  "test": "permissions",
  "userPermissions": {
    "isAuthenticated": true,
    "isAdmin": false,
    "isUser": true,
    "canAccessDashboard": true,
    "canAccessAdmin": false,
    "canCreateCourse": true
  }
}
```

### POST Request

Tests authentication operations.

#### Request Body

```json
{
  "operation": "validate",
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

#### Available Operations

| Operation | Description |
|-----------|-------------|
| `validate` | Validate credentials format |
| `hash` | Test password hashing |
| `token` | Generate test token |

---

## 6. Data Validation Test Endpoint

**Base URL:** `/api/test/validation`

### POST Request

Validates data against predefined schemas.

#### Request Body

```json
{
  "schema": "user",
  "data": {
    "email": "test@example.com",
    "name": "Test User",
    "age": 25,
    "role": "USER"
  },
  "validate": true
}
```

#### Available Schemas

| Schema | Fields |
|--------|--------|
| `user` | email, name, age (optional), role (optional) |
| `course` | title, description, price (optional), categoryId (optional), isPublished (optional) |
| `payment` | amount, currency, cardNumber, cvv, expiryMonth, expiryYear |
| `search` | query, page, limit, sortBy (optional), filters (optional) |

#### Response Examples

```json
// Valid data
{
  "success": true,
  "schema": "user",
  "valid": true,
  "data": {
    "email": "test@example.com",
    "name": "Test User",
    "age": 25,
    "role": "USER"
  },
  "message": "Data is valid"
}

// Invalid data
{
  "success": false,
  "schema": "user",
  "valid": false,
  "errors": {
    "fieldErrors": {
      "email": ["Invalid email format"],
      "name": ["Name must be at least 2 characters"]
    },
    "formErrors": []
  },
  "issues": [
    {
      "path": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

### GET Request

Tests query parameter validation and type coercion.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `test` | string | Validation test type |

#### Available Tests

| Test Type | Description |
|-----------|-------------|
| `info` | Get schema information |
| `params` | Validate query parameters |
| `types` | Test type coercion |

#### Examples

```bash
# Get schema info
GET /api/test/validation?test=info

# Validate query parameters
GET /api/test/validation?test=params&email=test@example.com&age=25

# Test type coercion
GET /api/test/validation?test=types&string=hello&number=123&boolean=true
```

---

## Quick Reference

### All Test Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/test/comprehensive` | GET/POST/PUT/PATCH/DELETE | General API testing |
| `/api/test/health` | GET/HEAD | System health check |
| `/api/test/performance` | GET/POST | Performance testing |
| `/api/test/database` | GET/POST | Database operations |
| `/api/test/auth` | GET/POST | Authentication testing |
| `/api/test/validation` | GET/POST | Data validation |

### Common Use Cases

```bash
# Quick health check
curl http://localhost:3000/api/test/health

# Check if database is connected
curl http://localhost:3000/api/test/database?operation=status

# Test authentication
curl http://localhost:3000/api/test/auth?test=session

# Validate user data
curl -X POST http://localhost:3000/api/test/validation \
  -H "Content-Type: application/json" \
  -d '{"schema":"user","data":{"email":"test@example.com","name":"Test"}}'

# Run performance test
curl http://localhost:3000/api/test/performance?test=stress&iterations=100

# Test specific HTTP response code
curl http://localhost:3000/api/test/comprehensive?code=404
```

---

## Best Practices

### 1. Regular Health Monitoring

Set up regular health checks to monitor system status:

```bash
# Cron job example
*/5 * * * * curl -s http://localhost:3000/api/test/health > /dev/null
```

### 2. Performance Baseline

Establish performance baselines for comparison:

```bash
# Run performance tests during low traffic
for test in basic cpu memory database async; do
  curl "http://localhost:3000/api/test/performance?test=$test&iterations=100"
  sleep 2
done
```

### 3. Database Monitoring

Regular database health checks:

```bash
# Check database metrics
curl http://localhost:3000/api/test/database?operation=connections
curl http://localhost:3000/api/test/database?operation=ping
```

### 4. Authentication Verification

Verify authentication configuration:

```bash
# Check all auth components
curl http://localhost:3000/api/test/auth?test=providers
curl http://localhost:3000/api/test/auth?test=jwt
```

### 5. Load Testing

Use the endpoints for load testing:

```bash
# Simple load test with Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/test/comprehensive?type=basic

# Load test with custom payload
ab -n 100 -c 5 -p payload.json -T application/json \
  http://localhost:3000/api/test/performance
```

### 6. CI/CD Integration

Integrate tests into your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Health Check
  run: |
    response=$(curl -s http://localhost:3000/api/test/health)
    if [[ $(echo $response | jq -r '.status') != "healthy" ]]; then
      echo "Health check failed"
      exit 1
    fi

- name: Database Check
  run: |
    response=$(curl -s http://localhost:3000/api/test/database?operation=status)
    if [[ $(echo $response | jq -r '.connection') != "connected" ]]; then
      echo "Database not connected"
      exit 1
    fi
```

### 7. Error Monitoring

Monitor for errors and failures:

```javascript
// Example monitoring script
async function monitorEndpoints() {
  const endpoints = [
    '/api/test/health',
    '/api/test/database?operation=status',
    '/api/test/auth?test=session'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const data = await response.json();
      
      if (!data.success || data.status === 'unhealthy') {
        console.error(`Endpoint ${endpoint} failed:`, data);
        // Send alert
      }
    } catch (error) {
      console.error(`Failed to reach ${endpoint}:`, error);
      // Send critical alert
    }
  }
}
```

### 8. Security Considerations

- **Authentication Required**: Some endpoints may require authentication in production
- **Rate Limiting**: Consider implementing rate limiting for test endpoints
- **Environment Restrictions**: Disable or restrict test endpoints in production
- **Sensitive Data**: Never expose sensitive data through test endpoints

### 9. Debugging Tips

Use test endpoints for debugging issues:

```bash
# Debug authentication issues
curl -v http://localhost:3000/api/test/auth?test=session
curl -v http://localhost:3000/api/test/auth?test=cookies

# Debug database issues
curl http://localhost:3000/api/test/database?operation=ping
curl http://localhost:3000/api/test/database?operation=connections

# Debug performance issues
curl http://localhost:3000/api/test/performance?test=database
curl http://localhost:3000/api/test/performance?test=cache
```

### 10. Monitoring Dashboard

Create a monitoring dashboard using these endpoints:

```html
<!DOCTYPE html>
<html>
<head>
  <title>API Monitor</title>
</head>
<body>
  <h1>System Status</h1>
  <div id="health">Loading...</div>
  <div id="database">Loading...</div>
  <div id="performance">Loading...</div>
  
  <script>
    async function updateStatus() {
      // Health check
      const health = await fetch('/api/test/health').then(r => r.json());
      document.getElementById('health').innerHTML = 
        `Health: ${health.status} | DB: ${health.database.status}`;
      
      // Database check
      const db = await fetch('/api/test/database?operation=counts').then(r => r.json());
      document.getElementById('database').innerHTML = 
        `Total Records: ${db.totalRecords}`;
      
      // Performance check
      const perf = await fetch('/api/test/performance?test=basic').then(r => r.json());
      document.getElementById('performance').innerHTML = 
        `Response Time: ${perf.executionTime}`;
    }
    
    // Update every 30 seconds
    updateStatus();
    setInterval(updateStatus, 30000);
  </script>
</body>
</html>
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Failed

```json
{
  "connection": "disconnected",
  "status": "unhealthy",
  "error": "Connection failed"
}
```

**Solution:**
- Check DATABASE_URL environment variable
- Verify database server is running
- Check network connectivity
- Verify database credentials

#### 2. Authentication Test Fails

```json
{
  "hasSession": false,
  "sessionData": null
}
```

**Solution:**
- Ensure NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL configuration
- Verify authentication providers are configured
- Clear cookies and retry

#### 3. Performance Test Timeout

```json
{
  "success": false,
  "error": "Performance test failed"
}
```

**Solution:**
- Reduce iteration count
- Check system resources
- Monitor CPU and memory usage
- Review database query performance

#### 4. Validation Errors

```json
{
  "valid": false,
  "errors": {
    "fieldErrors": {
      "email": ["Invalid email format"]
    }
  }
}
```

**Solution:**
- Review data format requirements
- Check schema definitions
- Ensure proper data types
- Validate input before sending

---

## Environment Variables

Required environment variables for test endpoints:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Redis (for cache testing)
REDIS_URL=redis://localhost:6379

# Node Environment
NODE_ENV=development
```

---

## API Response Codes

Standard HTTP response codes used by test endpoints:

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or request body |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error occurred |
| 502 | Bad Gateway | Database connection failed |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Changelog

### Version 1.0.0 (January 2025)
- Initial release of test endpoints
- Comprehensive testing suite
- Health monitoring
- Performance testing
- Database connectivity testing
- Authentication verification
- Data validation testing

---

## Support

For issues or questions regarding test endpoints:

1. Check the troubleshooting section
2. Review error messages and logs
3. Verify environment configuration
4. Contact the development team

---

*Last Updated: January 11, 2025*
*Documentation Version: 1.0.0*