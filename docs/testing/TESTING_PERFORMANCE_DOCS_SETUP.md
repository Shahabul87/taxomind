# Testing, Performance Monitoring & API Documentation Setup

This guide covers the implementation of comprehensive testing infrastructure, performance monitoring, and API documentation for the Alam LMS platform.

## 🧪 Testing Infrastructure

### Setup Complete
- ✅ Jest and React Testing Library configuration
- ✅ Test utilities and mock handlers
- ✅ Component and API route testing examples
- ✅ MSW (Mock Service Worker) for API mocking

### Files Added
```
jest.config.js              # Jest configuration
jest.setup.js               # Test setup and mocks
jest.polyfills.js           # Node.js polyfills for tests
__tests__/
  ├── utils/
  │   ├── test-utils.tsx     # Testing utilities and providers
  │   └── mock-handlers.ts   # MSW mock API handlers
  ├── components/
  │   ├── course-card.test.tsx
  │   └── ui/button.test.tsx
  └── api/
      └── courses.test.ts
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Update snapshots
npm run test:update-snapshots
```

### Test Coverage Goals
- **Branches**: 70%
- **Functions**: 70% 
- **Lines**: 70%
- **Statements**: 70%

## 📊 Performance Monitoring

### Setup Complete
- ✅ OpenTelemetry integration with Node.js SDK
- ✅ Core Web Vitals monitoring
- ✅ Custom performance metrics
- ✅ Real-time performance alerts
- ✅ Database performance tracking

### Files Added
```
lib/
├── telemetry.ts              # OpenTelemetry setup
├── performance-monitoring.ts # Custom performance utilities
└── web-vitals.ts            # Client-side performance monitoring

app/
├── performance-provider.tsx  # Client-side performance provider
└── api/analytics/
    ├── web-vitals/route.ts   # Web Vitals API endpoint
    └── page-load/route.ts    # Page load metrics API

prisma/
└── performance-schema.prisma # Performance monitoring models
```

### Environment Variables
Add these to your `.env.local`:
```bash
# Performance Monitoring
ENABLE_TELEMETRY=true
SERVICE_NAME=alam-lms
SERVICE_VERSION=1.0.0
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9090
```

### Monitoring Features
1. **Web Vitals Tracking**
   - Cumulative Layout Shift (CLS)
   - First Input Delay (FID)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to First Byte (TTFB)

2. **Custom Metrics**
   - HTTP request duration and counts
   - Database query performance
   - User session tracking
   - Video watch time
   - Course enrollments

3. **Performance Alerts**
   - Automatic alerts for slow operations
   - Configurable thresholds
   - Severity levels (LOW, MEDIUM, HIGH, CRITICAL)

### Usage Examples
```typescript
import { performanceMonitoring } from '@/lib/performance-monitoring'

// Trace HTTP requests
await performanceMonitoring.traceHttpRequest(
  'get-courses',
  'GET',
  '/api/courses',
  async () => {
    return await getCourses()
  }
)

// Trace database operations
await performanceMonitoring.traceDatabaseQuery(
  'findMany',
  'courses',
  async () => {
    return await db.course.findMany()
  }
)

// Track user sessions
performanceMonitoring.trackUserSession(userId, 'login')

// Track course enrollments
performanceMonitoring.trackCourseEnrollment(courseId, userId)
```

## 📚 API Documentation

### Setup Complete
- ✅ OpenAPI/Swagger specification
- ✅ Interactive documentation UI
- ✅ Comprehensive endpoint documentation
- ✅ Request/response schemas
- ✅ Authentication documentation

### Files Added
```
lib/
├── swagger.ts               # OpenAPI specification
└── swagger-docs/
    ├── courses.ts          # Course endpoints documentation
    └── analytics.ts        # Analytics endpoints documentation

app/
├── api/docs/route.ts       # API spec endpoint
└── docs/page.tsx          # Interactive documentation UI
```

### Accessing Documentation
- **Interactive UI**: http://localhost:3000/docs
- **Raw Specification**: http://localhost:3000/api/docs

### Documentation Features
1. **Comprehensive Schemas**
   - User, Course, Chapter, Section models
   - Error response formats
   - Analytics data structures

2. **Detailed Endpoints**
   - Request/response examples
   - Parameter validation
   - Authentication requirements
   - Error codes and descriptions

3. **Interactive Testing**
   - Try-it-out functionality
   - Authentication support
   - Request/response inspection

## 🚀 Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Update Database Schema
Add the performance monitoring models from `prisma/performance-schema.prisma` to your main `schema.prisma` file, then run:
```bash
npx prisma db push
```

### 3. Update Layout (Optional)
Add performance monitoring to your root layout:
```tsx
import { PerformanceProvider } from '@/app/performance-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PerformanceProvider>
          {children}
        </PerformanceProvider>
      </body>
    </html>
  )
}
```

### 4. Initialize Telemetry (Optional)
Add to your `instrumentation.ts` file (create if it doesn't exist):
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTelemetry } = await import('./lib/telemetry')
    initTelemetry()
  }
}
```

## 🔧 Configuration

### Jest Configuration
The Jest setup includes:
- Next.js integration
- TypeScript support
- Module path mapping
- Mock implementations for Next.js APIs
- Custom test environment setup

### Performance Thresholds
Default performance thresholds:
- HTTP requests: 2000ms
- Database queries: 1000ms
- Video loading: 5000ms
- Page loading: 3000ms

### API Documentation
The OpenAPI specification includes:
- Authentication schemes
- Request/response validation
- Error handling documentation
- Interactive testing capabilities

## 📈 Benefits

### Testing
- **Quality Assurance**: Comprehensive test coverage prevents regressions
- **Development Speed**: Fast feedback loop with watch mode
- **CI/CD Integration**: Automated testing in deployment pipeline
- **Documentation**: Tests serve as living documentation

### Performance Monitoring
- **Proactive Issue Detection**: Identify performance issues before users report them
- **Data-Driven Optimization**: Make optimization decisions based on real data
- **User Experience**: Monitor Core Web Vitals for better UX
- **Scalability Planning**: Track performance trends as system grows

### API Documentation
- **Developer Experience**: Easy API integration for frontend developers
- **Maintenance**: Reduced support burden with clear documentation
- **Testing**: Interactive testing reduces development time
- **Compliance**: Professional API documentation for enterprise clients

## 🔍 Monitoring Dashboard

Access real-time performance data:
- Web Vitals: `/api/analytics/web-vitals`
- Page Load Metrics: `/api/analytics/page-load`
- Performance Alerts: Database queries for `PerformanceAlert` model

## 🎯 Production Considerations

1. **Environment Variables**: Ensure all monitoring variables are set in production
2. **Database Indexes**: Performance monitoring creates significant data - ensure proper indexing
3. **Data Retention**: Implement data cleanup policies for performance metrics
4. **Alert Thresholds**: Adjust thresholds based on production performance baselines
5. **Rate Limiting**: Consider rate limiting for performance metric endpoints

This implementation provides enterprise-grade testing, monitoring, and documentation capabilities that will significantly improve the reliability, performance, and maintainability of your LMS platform.