# Taxomind Testing Suite

**Last Updated**: January 2025
**Version**: 2.0 - Reorganized and Optimized
**Status**: ✅ Fully Organized

## Overview

This comprehensive testing suite validates all performance optimizations and ensures code quality across the Taxomind LMS. The suite includes unit tests, integration tests, E2E tests, and performance benchmarks.

### Recent Reorganization (January 2025)

✅ **E2E Tests Consolidated**: All E2E tests moved to root `e2e/` folder (Playwright standard)
✅ **Root-Level Tests Organized**: Moved to appropriate subfolders
✅ **Temp Folder Cleaned**: Non-test files moved to documentation
✅ **Component Tests**: Kept co-located with components (industry best practice)
✅ **Clear Structure**: 86+ test files properly organized by type

## Test Coverage Goals

- **Global Coverage**: 80% minimum for all metrics
- **Database Modules**: 85% minimum coverage
- **Cache Modules**: 85% minimum coverage  
- **Performance Modules**: 80% minimum coverage

## Test Structure

```
__tests__/                     # Main test directory (Jest/React Testing Library)
├── actions/                   # Server action tests (27 files)
│   ├── admin.test.ts
│   ├── auth.test.ts
│   ├── get-courses.test.ts
│   └── ...
├── api/                       # API endpoint tests
│   ├── comprehensive/        # Comprehensive API tests
│   │   ├── chapters-api.test.ts
│   │   └── courses-api.test.ts
│   ├── courses/
│   │   └── route.test.ts
│   └── ...
├── components/                # Component tests
│   ├── auth/
│   │   └── login-form.test.tsx
│   ├── ui/                   # UI component tests
│   │   ├── badge.test.tsx
│   │   ├── button.test.tsx
│   │   └── progress.test.tsx
│   └── ...
├── hooks/                     # Custom hook tests
│   ├── use-admin.test.ts
│   ├── use-current-role.test.ts
│   ├── use-current-user.test.ts
│   └── use-debounce.test.ts
├── lib/                       # Library/utility tests
│   ├── queue/
│   │   └── email-queue.test.ts
│   ├── email-queue.test.ts
│   ├── format.test.ts
│   ├── password-utils.test.ts
│   ├── rate-limit.test.ts
│   └── utils.test.ts
├── integration/              # Integration tests
│   ├── api/
│   │   ├── courses/[courseId]/route.test.ts
│   │   ├── critical-endpoints.test.ts
│   │   ├── performance-optimized.test.ts
│   │   └── sam/blooms-analysis/route.test.ts
│   ├── auth/
│   │   └── auth-flow.test.ts
│   └── environment-separation.test.ts
├── unit/                     # Unit tests for modules
│   ├── actions/
│   │   └── get-courses.test.ts
│   ├── lib/
│   │   ├── auth/
│   │   │   └── saml-provider.test.ts
│   │   ├── cache/
│   │   │   └── redis-cache.test.ts
│   │   ├── database/         # Database optimization tests
│   │   │   ├── connection-pool.test.ts
│   │   │   ├── query-performance-monitor.test.ts
│   │   │   └── query-result-cache.test.ts
│   │   ├── performance/
│   │   │   └── react-optimizations.test.tsx
│   │   ├── encryption.test.ts
│   │   └── sam-blooms-engine.test.ts
│   └── middleware.test.ts
├── accessibility/            # Accessibility tests
│   └── blog.a11y.test.ts
├── performance/              # Performance benchmarks
│   └── comprehensive-benchmarks.test.ts
├── schemas/                  # Schema validation tests
│   └── index.test.ts
├── data/                     # Data layer tests
│   └── user.test.ts
├── simple/                   # Simple test examples
│   ├── utils.test.ts
│   └── simple.test.ts
├── types/                    # Type definition tests
├── utils/                    # Test utilities
│   └── simple-utils.test.ts
├── jest-dom.d.ts            # Jest DOM type definitions
└── README.md                # This file

e2e/                         # End-to-end tests (Playwright)
├── tests/                   # E2E test files
│   ├── accessibility.spec.ts
│   ├── auth.spec.ts
│   ├── course-enrollment.spec.ts
│   ├── performance.spec.ts
│   ├── sam-ui-behavior.spec.ts
│   └── user-journeys.test.tsx
├── visual-regression/       # Visual regression tests
│   └── visual-regression.spec.ts
├── fixtures/                # Test fixtures
├── pages/                   # Page object models
├── setup/                   # Test setup
├── utils/                   # E2E test utilities
├── types/                   # E2E type definitions
├── auth.spec.ts            # Auth E2E tests
├── course-creation.spec.ts # Course creation E2E
├── student-learning.spec.ts # Student journey E2E
├── global-setup.ts         # Playwright setup
└── global-teardown.ts      # Playwright teardown

Component Co-located Tests:
app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/exam-creator/__tests__/
├── ExamForm.test.tsx
├── ExamList.test.tsx
├── QuestionItem.test.tsx
└── exam-reducer.test.ts
```

## Running Tests

### All Tests
```bash
npm test                      # Run all tests
npm run test:coverage         # Run with coverage report
npm run test:watch           # Watch mode for development
```

### Specific Test Suites
```bash
# Unit Tests
npm run test:unit:database   # Database module tests
npm run test:unit:cache      # Cache module tests
npm run test:unit:performance # React performance tests

# Integration Tests
npm run test:integration     # API integration tests

# Performance Benchmarks
npm run test:performance     # All performance tests
npm run test:performance:benchmark # Detailed benchmarks

# Complete Test Suite
npm run test:all             # Run all test categories sequentially
```

### CI/CD Testing
```bash
npm run test:ci              # Optimized for CI environments
```

## Test Utilities

The suite includes comprehensive test utilities in `__tests__/utils/test-utilities.ts`:

### Performance Testing
- `PerformanceTestUtils`: Measure and assert performance improvements
- `BenchmarkTestUtils`: Run and compare performance benchmarks

### Mock Data
- `MockDataGenerator`: Generate test data of various sizes
- Database query results, large datasets, component props

### Async Operations
- `AsyncTestUtils`: Handle async operations with timeouts
- Retry logic with exponential backoff
- Async performance measurement

### Cache Testing
- `CacheTestUtils`: Mock Redis clients and cache scenarios
- Test cache hit/miss patterns
- Compression and optimization testing

### Database Testing
- `DatabaseTestUtils`: Mock Prisma clients
- Connection pool simulation
- Transaction testing

### React Testing
- `ReactTestUtils`: Component rendering with providers
- Memoization effectiveness testing
- Render count measurement

### Memory Testing
- `MemoryTestUtils`: Memory usage measurement
- Memory leak detection
- Heap analysis

### Network Testing
- `NetworkTestUtils`: Mock fetch operations
- Rate limiting tests
- Network latency simulation

## Performance Benchmarks

The comprehensive benchmark suite validates:

1. **Database Performance**
   - Query optimization (N+1 prevention)
   - Result caching effectiveness
   - Connection pooling benefits

2. **Cache Performance**
   - Redis operation throughput
   - Compression benefits
   - Invalidation strategies

3. **React Performance**
   - Component memoization
   - Virtual scrolling efficiency
   - Lazy loading benefits

4. **API Performance**
   - Response time optimization
   - Concurrent request handling
   - Payload size handling

5. **Memory Performance**
   - Memory usage patterns
   - Leak detection
   - Object pooling benefits

## Key Test Features

### 1. Database Query Performance Monitor Tests
- Query tracking and timing
- N+1 pattern detection
- Slow query identification
- Optimization suggestions
- Real-time monitoring
- Prisma integration

### 2. Query Result Cache Tests
- Cache operations (get/set/delete)
- TTL management
- Pattern-based invalidation
- Tag-based invalidation
- LRU eviction
- Compression optimization
- Distributed caching

### 3. Connection Pool Tests
- Connection lifecycle management
- Pool strategies (FIFO, round-robin)
- Load balancing
- Transaction support
- Circuit breaker pattern
- Connection leak detection
- Performance monitoring

### 4. React Performance Tests
- Memoization HOC validation
- Virtual scrolling performance
- Image optimization
- Custom hooks (useThrottledState, useDebouncedValue)
- Lazy loading components
- Memory efficiency

### 5. Redis Cache Tests
- Basic operations (get/set/delete)
- Batch operations
- Pattern operations
- Atomic operations (incr/decr)
- List/Set/Hash operations
- Pipelining and transactions
- Performance metrics

### 6. API Integration Tests
- Cached endpoint validation
- Query optimization verification
- Rate limiting enforcement
- Connection pooling efficiency
- Response compression
- Performance monitoring
- Error recovery

## Coverage Requirements

### Minimum Coverage Thresholds

```javascript
// Global (80%)
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

// Database Modules (85%)
- ./lib/database/: 85% all metrics

// Cache Modules (85%)
- ./lib/cache/: 85% all metrics

// Performance Modules (80%)
- ./lib/performance/: 80% all metrics
```

### Viewing Coverage Reports
```bash
npm run test:coverage         # Generate coverage report
open coverage/lcov-report/index.html # View HTML report
```

## Performance Assertions

Tests include performance assertions to validate optimizations:

```typescript
// Example: Assert 50% performance improvement
Performance.assertPerformanceImprovement(
  baselineTime,
  optimizedTime,
  0.5 // 50% improvement required
);
```

## Continuous Integration

The test suite is optimized for CI/CD pipelines:

- Parallel test execution where safe
- Sequential execution for integration tests
- Performance benchmarks with consistent iterations
- Coverage reporting integration
- Failure fast options for CI

## Best Practices

1. **Isolation**: Each test is independent and can run in any order
2. **Mocking**: External dependencies are mocked appropriately
3. **Cleanup**: Tests clean up after themselves
4. **Performance**: Tests run efficiently without unnecessary delays
5. **Coverage**: Aim for comprehensive coverage including edge cases
6. **Documentation**: Tests serve as documentation for expected behavior

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase Jest timeout: `jest.setTimeout(10000)`
   - Check async operations completion

2. **Memory Issues**
   - Run tests with increased memory: `NODE_OPTIONS='--max-old-space-size=4096' npm test`
   - Run tests sequentially: `--runInBand`

3. **Flaky Tests**
   - Use proper async waiting utilities
   - Mock time-dependent operations
   - Ensure proper test isolation

### Debug Mode
```bash
npm run test:debug           # Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand # Debug with Chrome DevTools
```

## Contributing

When adding new performance optimizations:

1. Write unit tests for the module
2. Add integration tests for API endpoints
3. Include performance benchmarks
4. Ensure 80%+ coverage
5. Update this README with new test information

## Results Validation

The test suite validates that Phase 3 optimizations achieve:

- ✅ 50%+ reduction in database query times
- ✅ 80%+ cache hit rates for frequently accessed data
- ✅ 60%+ reduction in React component re-renders
- ✅ 40%+ improvement in API response times
- ✅ Efficient memory usage with no detected leaks
- ✅ Scalable performance under high concurrency

---

*Last Updated: Phase 4 Implementation*
*Enterprise Code Quality Plan - Quality Assurance Testing*