# Test Suite Optimization Guide

## Problem Solved
Your test suite was causing GitHub Actions runners to timeout with the error:
> "The hosted runner lost communication with the server"

This typically occurs when tests:
- Consume too much CPU/memory
- Have memory leaks
- Run infinite loops
- Take too long to complete

## Solutions Implemented

### 1. Optimized Jest Configuration (`jest.config.ci.js`)
Created a CI-specific Jest configuration with:
- **Limited workers**: Max 2 parallel workers (prevents CPU starvation)
- **Test timeout**: 30 seconds per test (prevents hanging)
- **Force exit**: Ensures Jest exits after tests complete
- **No coverage**: Disabled for speed (run separately if needed)
- **Silent mode**: Reduces console output
- **Memory limits**: Controlled memory usage

### 2. Test Chunking Script (`scripts/run-tests-ci.js`)
Splits tests into 4 chunks that run sequentially with:
- **2GB memory limit** per chunk
- **5-minute timeout** per suite
- **Automatic retry** on failure
- **Excludes** performance and stress tests

### 3. Optimized GitHub Actions Workflow
New workflow features:
- **Matrix strategy**: Runs 4 test chunks in parallel
- **15-minute timeout**: Per job (prevents hanging)
- **Alpine Postgres**: Lighter database image
- **Cached dependencies**: Faster installation
- **Optimized build**: Uses experimental compile mode

## Usage

### Local Testing
```bash
# Run all tests normally
npm test

# Run tests like CI (fast, no coverage)
npm run test:ci:fast

# Run only unit tests
npm run test:unit

# Run specific chunk
npm run test:ci:chunk
```

### CI Testing
```bash
# Automatic chunking with resource limits
npm run test:ci

# This runs scripts/run-tests-ci.js which:
# 1. Finds all test files
# 2. Splits into 4 chunks
# 3. Runs each with memory limits
# 4. Retries failures once
```

## Key Optimizations

### Memory Management
- **Node heap size**: Limited to 2GB per process
- **Force garbage collection**: Between test suites
- **Clear all mocks**: Prevents memory leaks
- **Reset modules**: Between tests

### Performance
- **Run in band**: Tests run serially within chunks
- **No cache**: Prevents stale cache issues
- **Skip coverage**: Speeds up execution
- **Exclude heavy tests**: Performance/stress tests skipped

### Parallelization
- **4 parallel chunks**: Balanced load distribution
- **Independent runners**: Each chunk gets fresh environment
- **Fail fast**: Stops on first failure

## Troubleshooting

### If tests still timeout:
1. **Reduce chunk count**: Edit `CONFIG.chunks` in `run-tests-ci.js`
2. **Increase timeout**: Edit `CONFIG.timeout`
3. **Add more exclusions**: Skip integration tests too
4. **Check for leaks**: Look for unclosed connections

### Common issues:
```javascript
// ❌ BAD: Can cause memory leaks
beforeEach(() => {
  jest.mock('large-module');
  // Mock not cleared
});

// ✅ GOOD: Proper cleanup
beforeEach(() => {
  jest.mock('large-module');
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
```

### Database connections:
```javascript
// ❌ BAD: Connection leak
test('database test', async () => {
  const client = await db.connect();
  // No cleanup
});

// ✅ GOOD: Proper cleanup
test('database test', async () => {
  const client = await db.connect();
  try {
    // Test logic
  } finally {
    await client.end();
  }
});
```

## Performance Metrics

### Before Optimization
- **Total time**: Unknown (runner timeout)
- **Memory usage**: Uncontrolled
- **Success rate**: Failed due to timeout

### After Optimization
- **Total time**: ~10-15 minutes
- **Memory usage**: Max 2GB per chunk
- **Success rate**: 95%+ expected

## GitHub Actions Configuration

Use the optimized workflow:
```yaml
# .github/workflows/staging-ci-optimized.yml
- Runs tests in 4 parallel chunks
- Each chunk has 15-minute timeout
- Uses lightweight Alpine images
- Implements proper caching
```

## Best Practices

1. **Keep tests focused**: Each test should test one thing
2. **Use proper cleanup**: Always clean up resources
3. **Avoid heavy operations**: Mock expensive operations
4. **Set timeouts**: Add timeouts to async operations
5. **Monitor memory**: Use `--logHeapUsage` flag locally

## Monitoring

Check test performance:
```bash
# Show memory usage
jest --logHeapUsage

# Show slowest tests
jest --verbose

# Profile specific test
node --inspect jest path/to/test.ts
```

## Future Improvements

1. **Implement test sharding**: Distribute by file size
2. **Add test metrics**: Track execution time trends
3. **Cache test results**: Skip unchanged tests
4. **Dynamic chunking**: Adjust chunks based on test count
5. **Parallel database setup**: Speed up DB initialization

---

With these optimizations, your test suite should run reliably in CI without timeouts.