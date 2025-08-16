# Test Coverage Quick Start Guide

## ✅ Current Status
- **Fixed Tests:** CourseCard and Button components now passing
- **Coverage:** Currently at 0.36% (needs to reach 20% minimum)
- **Target:** 70% coverage in 12 weeks

## 🚀 Immediate Actions (Today/Tomorrow)

### 1. Run the Coverage Tracker
```bash
npm run coverage:track
```
This will show you:
- Current coverage metrics
- Progress toward goals
- Specific next steps

### 2. Fix Critical Test Infrastructure
```bash
# Create test database configuration
cp .env.local .env.test.local

# Edit .env.test.local and update:
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/taxomind_test"
NODE_ENV="test"

# Create test database
npm run dev:docker:start
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE taxomind_test;"
```

### 3. Fix Remaining Broken Tests
Run tests to see what needs fixing:
```bash
npm test 2>&1 | grep "FAIL" | head -20
```

Common issues to fix:
- Missing mock providers
- Import errors for test utilities
- NextAuth import issues

## 📝 Priority Test Files to Create

### Week 1: Authentication (CRITICAL)
Create these test files first:

#### `__tests__/actions/login.test.ts`
```typescript
import { login } from '@/actions/login';
import { db } from '@/lib/db';

jest.mock('@/lib/db');

describe('login action', () => {
  it('should login valid user', async () => {
    // Test implementation
  });
  
  it('should reject invalid credentials', async () => {
    // Test implementation
  });
});
```

#### `__tests__/middleware.test.ts`
```typescript
import { middleware } from '@/middleware';

describe('middleware', () => {
  it('should protect admin routes', () => {
    // Test implementation
  });
  
  it('should allow public routes', () => {
    // Test implementation
  });
});
```

### Week 2: Business Logic
#### `__tests__/actions/get-course.test.ts`
```typescript
import { getCourse } from '@/actions/get-course';

describe('getCourse', () => {
  it('should return course with purchase info', async () => {
    // Test implementation
  });
});
```

## 🔧 Test Utilities Setup

### Create Missing Test Database Helper
Create `__tests__/utils/test-db.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:dev_password_123@localhost:5433/taxomind_test'
    }
  }
});

export const cleanDatabase = async () => {
  // Clean all tables for fresh test state
  await prisma.$transaction([
    prisma.enrollment.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

export { prisma as testDb };
```

## 📊 Coverage Goals by Week

### Week 1 (20% Target)
- [ ] Fix all failing tests
- [ ] Add authentication tests
- [ ] Test core business logic
- [ ] Set up CI/CD

### Week 2-3 (25% Target) 
- [ ] Add API route tests
- [ ] Test database operations
- [ ] Mock external services

### Week 4-6 (35% Target)
- [ ] Payment system tests
- [ ] Enrollment workflow tests
- [ ] Integration tests

## 💡 Pro Tips

### 1. Use Coverage Report
```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser
open coverage/lcov-report/index.html
```

### 2. Test Specific Files
```bash
# Test single file
npm test -- path/to/test.ts

# Test with pattern
npm test -- --testNamePattern="login"

# Update snapshots
npm run test:update-snapshots
```

### 3. Debug Tests
```bash
# Run in debug mode
npm run test:debug

# Run single test in watch mode
npm test -- --watch path/to/test.ts
```

## 🎯 Success Criteria

### Minimum Viable Coverage (Week 1)
- ✅ All existing tests passing
- ⬜ 20% overall coverage
- ⬜ Authentication fully tested
- ⬜ Core actions tested

### Production Ready (Week 12)
- ⬜ 70% overall coverage
- ⬜ All critical paths tested
- ⬜ CI/CD with coverage gates
- ⬜ < 3 minute test execution

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- Coverage Report: `coverage/lcov-report/index.html`
- Test Coverage Tracker: `npm run coverage:track`

## 🆘 Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution:** Create the missing test utilities or mock the modules

### Issue: NextAuth import errors
**Solution:** Mock NextAuth in jest.setup.js:
```javascript
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));
```

### Issue: Database connection errors
**Solution:** Use test database with proper mocking

### Issue: Test timeout
**Solution:** Increase timeout in problematic tests:
```typescript
jest.setTimeout(10000); // 10 seconds
```

## 🚦 Next Step
Run `npm run coverage:track` now to see your current status and get specific recommendations!

---

**Remember:** Start small, fix what's broken, then gradually add new tests. You don't need to do everything at once!