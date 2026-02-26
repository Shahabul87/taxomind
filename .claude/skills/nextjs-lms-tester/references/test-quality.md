# 🔍 Test Quality Audit Reference

## Quality Scoring Framework

### Dimension 1: Test Effectiveness (40%)

```bash
# 1a. Tests with no assertions (useless tests)
echo "=== TESTS WITHOUT ASSERTIONS ==="
find . -name "*.test.*" | grep -v node_modules | while read f; do
  # Count test blocks vs expect statements
  tests=$(grep -c "it(\|test(" "$f" 2>/dev/null)
  expects=$(grep -c "expect\|assert\|should\|toHave\|toBe\|toEqual\|toThrow\|toMatch" "$f" 2>/dev/null)
  if [ "$tests" -gt 0 ] && [ "$expects" -lt "$tests" ]; then
    echo "⚠️  $f: $tests tests but only $expects assertions"
  fi
done

# 1b. Snapshot-only tests (low confidence)
echo -e "\n=== SNAPSHOT-ONLY TESTS ==="
find . -name "*.test.*" | grep -v node_modules | while read f; do
  snapshots=$(grep -c "toMatchSnapshot\|toMatchInlineSnapshot" "$f" 2>/dev/null)
  behavioral=$(grep -c "toBeInTheDocument\|toHaveText\|toHaveBeenCalled\|toEqual\|toBe\b" "$f" 2>/dev/null)
  if [ "$snapshots" -gt 0 ] && [ "$behavioral" -eq 0 ]; then
    echo "⚠️  SNAPSHOT-ONLY: $f ($snapshots snapshots, 0 behavioral assertions)"
  fi
done

# 1c. Tests that test implementation, not behavior
echo -e "\n=== IMPLEMENTATION DETAIL TESTS ==="
grep -rn "setState\|wrapper.state\|wrapper.instance\|component.state\|container.querySelector\|getByClassName" . --include="*.test.*" | grep -v node_modules | head -10
```

### Dimension 2: Test Reliability (25%)

```bash
# 2a. Flaky test indicators
echo "=== FLAKY RISK: Hardcoded timeouts ==="
grep -rn "setTimeout\|waitFor.*{.*timeout\|jest.setTimeout\|page.waitForTimeout" . --include="*.test.*" --include="*.spec.*" | grep -v node_modules | head -15

echo -e "\n=== FLAKY RISK: Date/time dependent ==="
grep -rn "new Date()\|Date.now()\|toLocaleDateString" . --include="*.test.*" | grep -v node_modules | head -10

echo -e "\n=== FLAKY RISK: Network calls in unit tests ==="
grep -rn "fetch\|axios\|http" . --include="*.test.*" | grep -v "jest.mock\|mock\|__mocks__\|MSW\|msw\|handler" | grep -v node_modules | head -10

echo -e "\n=== FLAKY RISK: Global state pollution ==="
# Tests modifying globals without cleanup
grep -rn "global\.\|window\.\|process\.env\." . --include="*.test.*" | grep -v "node_modules\|beforeEach\|afterEach" | head -10

echo -e "\n=== FLAKY RISK: Test order dependency ==="
# Tests using shared mutable state
grep -rn "let \|var " . --include="*.test.*" | grep -v "node_modules\|const " | grep "describe\|beforeEach" -A 5 | head -15
```

### Dimension 3: Test Maintainability (20%)

```bash
# 3a. Test file sizes (too large = hard to maintain)
echo "=== OVERSIZED TEST FILES (>300 lines) ==="
find . -name "*.test.*" | grep -v node_modules | xargs wc -l 2>/dev/null | sort -rn | head -10

# 3b. Duplicated test setup (should use shared helpers)
echo -e "\n=== DUPLICATED MOCK SETUP ==="
# Find the same mock pattern appearing in many files
for mock in "jest.mock.*next/navigation" "jest.mock.*@/lib/db" "jest.mock.*next-auth"; do
  count=$(grep -rl "$mock" . --include="*.test.*" | grep -v node_modules | wc -l)
  if [ "$count" -gt 3 ]; then
    echo "⚠️  '$mock' duplicated in $count test files — extract to shared setup"
  fi
done

# 3c. Magic numbers/strings
echo -e "\n=== MAGIC VALUES ==="
grep -rn "expect.*'[a-f0-9-]\{36\}'" . --include="*.test.*" | grep -v node_modules | head -5
# UUIDs hardcoded in expectations — use factories instead

# 3d. Test description quality
echo -e "\n=== VAGUE TEST DESCRIPTIONS ==="
grep -rn "it('works'\|it('should work'\|test('test'\|it('returns'\|it('handles'" . --include="*.test.*" | grep -v node_modules | head -10
```

### Dimension 4: Test Coverage Quality (15%)

```bash
# 4a. Skipped tests
echo "=== SKIPPED TESTS ==="
grep -rn "it\.skip\|test\.skip\|xit\|xtest\|describe\.skip\|xdescribe" . --include="*.test.*" | grep -v node_modules

# 4b. TODO/FIXME in tests
echo -e "\n=== TODO/FIXME IN TESTS ==="
grep -rn "TODO\|FIXME\|HACK\|XXX" . --include="*.test.*" | grep -v node_modules | head -10

# 4c. Empty test suites
echo -e "\n=== EMPTY DESCRIBE BLOCKS ==="
find . -name "*.test.*" | grep -v node_modules | while read f; do
  lines=$(wc -l < "$f")
  tests=$(grep -c "it(\|test(" "$f" 2>/dev/null)
  if [ "$tests" -eq 0 ] && [ "$lines" -gt 5 ]; then
    echo "⚠️  EMPTY SUITE: $f ($lines lines, 0 tests)"
  fi
done

# 4d. Branch coverage gaps
echo -e "\n=== UNTESTED BRANCHES (error paths, edge cases) ==="
# Check if error states are tested
for f in $(find . -name "*.test.*" | grep -v node_modules); do
  source=$(echo "$f" | sed 's/\.test\./\./' | sed 's/__tests__\///')
  if [ -f "$source" ]; then
    source_errors=$(grep -c "throw\|catch\|reject\|error" "$source" 2>/dev/null)
    test_errors=$(grep -c "toThrow\|rejects\|error\|catch\|reject\|status.*[45]" "$f" 2>/dev/null)
    if [ "$source_errors" -gt 2 ] && [ "$test_errors" -eq 0 ]; then
      echo "⚠️  $f: source has $source_errors error paths, test has 0 error assertions"
    fi
  fi
done
```

## Anti-Pattern Catalog

### 🔴 Critical Anti-Patterns

| Anti-Pattern | Detection | Fix |
|---|---|---|
| **No assertions** | `it('works', () => { render(<Comp />) })` | Add `expect()` checking visible output |
| **Testing implementation** | `expect(setState).toHaveBeenCalled()` | Test the resulting UI change |
| **Real API calls** | Unmocked fetch/axios in unit tests | Mock with MSW or jest.mock |
| **Shared mutable state** | `let counter = 0` at describe level, mutated in tests | Reset in `beforeEach` |

### 🟠 High Priority Anti-Patterns

| Anti-Pattern | Detection | Fix |
|---|---|---|
| **Snapshot abuse** | Every component has only `toMatchSnapshot()` | Replace with behavioral assertions |
| **Hardcoded delays** | `await new Promise(r => setTimeout(r, 2000))` | Use `waitFor()` or `findBy*` |
| **Unmocked timers** | `setTimeout`/`setInterval` in tested code, real timers | `jest.useFakeTimers()` |
| **Missing cleanup** | `addEventListener` in useEffect, no removal test | Verify cleanup in `afterEach` |

### 🟡 Medium Priority Anti-Patterns

| Anti-Pattern | Detection | Fix |
|---|---|---|
| **Over-mocking** | Mocking 10+ modules per test | Simplify component, use integration test |
| **Brittle selectors** | `container.querySelector('.css-1abc')` | Use `getByRole`, `getByLabelText` |
| **Duplicate setup** | Same mock in 20+ files | Extract to `__tests__/helpers/` |
| **Test file too large** | 500+ lines in one test file | Split by behavior/feature |
| **Index-based keys** | `key={index}` in test render | Use stable IDs from factory |

## Test Quality Report Template

```markdown
# 🔍 Test Quality Audit — [Project]
**Generated:** YYYY-MM-DD

## Quality Score: XX/100

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Effectiveness | X/100 | 40% | X |
| Reliability | X/100 | 25% | X |
| Maintainability | X/100 | 20% | X |
| Coverage Quality | X/100 | 15% | X |

## Anti-Patterns Found

| Severity | Count | Pattern |
|----------|-------|---------|
| 🔴 Critical | X | [details] |
| 🟠 High | X | [details] |
| 🟡 Medium | X | [details] |

## Top 5 Issues to Fix

1. **[Issue]** — Found in X files. Fix: [approach]
2. ...

## Recommendations

### Quick Wins (< 1 hour each)
- [ ] Remove X skipped tests or re-enable them
- [ ] Add assertions to X assertion-less tests
- [ ] Extract duplicated mock setup to shared helpers

### Medium Effort (1-4 hours)
- [ ] Replace X snapshot-only tests with behavioral tests
- [ ] Add error path tests for X untested catch blocks
- [ ] Split X oversized test files

### Long-term Improvements
- [ ] Set up MSW for consistent API mocking
- [ ] Create test data factories with @faker-js/faker
- [ ] Add Playwright E2E for critical user flows
- [ ] Configure coverage thresholds in CI
```

## CI Integration Recommendations

```js
// jest.config.js — add coverage thresholds
coverageThreshold: {
  global: {
    branches: 60,
    functions: 70,
    lines: 70,
    statements: 70,
  },
  // Critical paths need higher coverage
  './app/api/': {
    branches: 80,
    functions: 80,
    lines: 80,
  },
  './lib/auth': {
    branches: 90,
    functions: 90,
    lines: 90,
  },
}
```
