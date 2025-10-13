#!/bin/bash

# Run tests in batches to avoid memory issues
echo "Running tests in batches to avoid memory issues..."

# Initialize counters
TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_SUITES_PASS=0
TOTAL_SUITES_FAIL=0

# Test categories
declare -a test_dirs=(
  "__tests__/simple"
  "__tests__/unit"
  "__tests__/lib"
  "__tests__/api"
  "__tests__/actions"
  "__tests__/components"
  "__tests__/integration"
  "__tests__/middleware.test.ts"
  "app/**/test.tsx"
  "app/**/test.ts"
)

echo "========================================="
echo "Starting Batch Test Execution"
echo "========================================="

for dir in "${test_dirs[@]}"; do
  echo ""
  echo "Testing: $dir"
  echo "-----------------------------------------"
  
  # Run test with increased memory and capture output
  NODE_OPTIONS='--max-old-space-size=4096' npx jest \
    --config jest.config.ci.js \
    --testPathPattern="$dir" \
    --runInBand \
    --no-cache \
    --forceExit \
    2>&1 | tee temp_test_output.txt
  
  # Extract results
  PASS=$(grep -E "Tests:.*passed" temp_test_output.txt | sed -E 's/.*Tests:.*([0-9]+) passed.*/\1/' | tail -1)
  FAIL=$(grep -E "Tests:.*failed" temp_test_output.txt | sed -E 's/.*Tests:.*([0-9]+) failed.*/\1/' | tail -1)
  SUITES_PASS=$(grep -E "Test Suites:.*passed" temp_test_output.txt | sed -E 's/.*Test Suites:.*([0-9]+) passed.*/\1/' | tail -1)
  SUITES_FAIL=$(grep -E "Test Suites:.*failed" temp_test_output.txt | sed -E 's/.*Test Suites:.*([0-9]+) failed.*/\1/' | tail -1)
  
  # Add to totals if numbers were found
  if [[ "$PASS" =~ ^[0-9]+$ ]]; then
    TOTAL_PASS=$((TOTAL_PASS + PASS))
  fi
  if [[ "$FAIL" =~ ^[0-9]+$ ]]; then
    TOTAL_FAIL=$((TOTAL_FAIL + FAIL))
  fi
  if [[ "$SUITES_PASS" =~ ^[0-9]+$ ]]; then
    TOTAL_SUITES_PASS=$((TOTAL_SUITES_PASS + SUITES_PASS))
  fi
  if [[ "$SUITES_FAIL" =~ ^[0-9]+$ ]]; then
    TOTAL_SUITES_FAIL=$((TOTAL_SUITES_FAIL + SUITES_FAIL))
  fi
  
  echo "Batch Results: $PASS passed, $FAIL failed"
done

# Clean up
rm -f temp_test_output.txt

# Calculate totals
TOTAL_TESTS=$((TOTAL_PASS + TOTAL_FAIL))
TOTAL_SUITES=$((TOTAL_SUITES_PASS + TOTAL_SUITES_FAIL))

if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_RATE=$((TOTAL_PASS * 100 / TOTAL_TESTS))
else
  PASS_RATE=0
fi

# Print summary
echo ""
echo "========================================="
echo "FINAL TEST RESULTS"
echo "========================================="
echo "Test Suites: $TOTAL_SUITES_FAIL failed, $TOTAL_SUITES_PASS passed, $TOTAL_SUITES total"
echo "Tests:       $TOTAL_FAIL failed, $TOTAL_PASS passed, $TOTAL_TESTS total"
echo "Pass Rate:   ${PASS_RATE}%"
echo "========================================="

# Exit with appropriate code
if [ $TOTAL_FAIL -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi