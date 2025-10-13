#!/bin/bash

# Run tests locally with CI configuration
# This simulates the exact CI/CD environment

echo "🧪 Running tests with CI configuration locally..."
echo "================================================"
echo ""

# Set CI environment variable
export CI=true
export NODE_ENV=test

# Run tests with CI configuration
echo "⏳ Starting test suite..."
NODE_OPTIONS='--max-old-space-size=2048' npx jest \
  --config jest.config.ci.js \
  --ci \
  --watchAll=false \
  --runInBand \
  --verbose=false \
  --silent=false \
  2>&1 | tee test-results.log

# Capture exit code
TEST_EXIT_CODE=${PIPESTATUS[0]}

# Parse results
echo ""
echo "📊 Test Results Summary:"
echo "========================"
grep -E "Test Suites:|Tests:|Snapshots:|Time:" test-results.log | tail -4

# Show failed tests if any
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Failed Tests:"
  echo "================"
  grep -E "FAIL|●" test-results.log | head -20
  echo ""
  echo "💡 To see full error details, check test-results.log"
else
  echo ""
  echo "✅ All tests passed!"
fi

# Cleanup
rm -f test-results.log

exit $TEST_EXIT_CODE