# 🧪 Complete Testing & Code Coverage Guide for Taxomind LMS

## Table of Contents
1. [What is Testing & Code Coverage?](#what-is-testing--code-coverage)
2. [Why Testing is Critical for Enterprise Software](#why-testing-is-critical)
3. [How Testing Actually Works](#how-testing-works)
4. [Types of Tests Explained](#types-of-tests)
5. [Testing with Real Examples](#testing-with-real-examples)
6. [Understanding Code Coverage](#understanding-code-coverage)
7. [Setting Up Testing in Your Project](#setting-up-testing)
8. [Best Practices & Common Patterns](#best-practices)
9. [Testing Roadmap for Taxomind](#testing-roadmap)
10. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## 🎯 What is Testing & Code Coverage?

### Testing
**Testing** is the process of writing automated code that verifies your application works correctly. Instead of manually clicking through your app to check if features work, you write code that does this automatically.

### Code Coverage
**Code coverage** is a metric that shows what percentage of your code is tested. It measures:
- **Line Coverage**: How many lines of code are executed during tests
- **Branch Coverage**: How many if/else branches are tested
- **Function Coverage**: How many functions are called during tests
- **Statement Coverage**: How many statements are executed

### The 80% Target
```
📊 Current Status: ~20% coverage ❌
🎯 Enterprise Target: 80% coverage ✅
```

80% coverage means that when all your tests run, they execute 80% of your codebase. This is considered the minimum for enterprise applications because it:
- Catches most bugs before production
- Provides confidence during refactoring
- Ensures critical paths are tested

---

## 🚨 Why Testing is Critical for Enterprise Software

### 1. **Prevent Revenue Loss**
```typescript
// Without tests, this billing bug could cost thousands:
function calculateSubscriptionPrice(basePrice: number, discount: number) {
  return basePrice * discount; // BUG: Should be basePrice * (1 - discount)
}

// A simple test catches this immediately:
test('applies discount correctly', () => {
  expect(calculateSubscriptionPrice(100, 0.2)).toBe(80); // Fails! Returns 20
});
```

### 2. **Protect User Data**
```typescript
// Tests ensure security measures work:
test('prevents SQL injection in search', async () => {
  const maliciousInput = "'; DROP TABLE users; --";
  const result = await searchCourses(maliciousInput);
  
  // Verify tables still exist and query was sanitized
  const users = await db.user.findMany();
  expect(users).toBeDefined();
});
```

### 3. **Enable Rapid Development**
```typescript
// With tests, you can refactor confidently:
test('enrollment process works end-to-end', async () => {
  const user = await createTestUser();
  const course = await createTestCourse();
  
  await enrollUserInCourse(user.id, course.id);
  
  const enrollment = await getEnrollment(user.id, course.id);
  expect(enrollment).toBeTruthy();
  expect(enrollment.status).toBe('active');
});
```

### 4. **Reduce Debugging Time**
When something breaks, tests tell you exactly what and where:
```
FAIL  __tests__/payment.test.ts
  ● Payment Processing › should process payment successfully

    Expected: "completed"
    Received: "failed"

    at line 45: expect(payment.status).toBe('completed')
    
    Stack trace shows exact problem location...
```

---

## 🔧 How Testing Actually Works

### The Testing Lifecycle

```mermaid
graph LR
    A[Write Code] --> B[Write Test]
    B --> C[Run Test]
    C --> D{Test Passes?}
    D -->|Yes| E[Code is Correct]
    D -->|No| F[Fix Code/Test]
    F --> C
    E --> G[Deploy with Confidence]
```

### Basic Test Structure
Every test follows this pattern:
```typescript
describe('Feature/Component Name', () => {
  // Setup before tests
  beforeEach(() => {
    // Reset database, clear mocks, etc.
  });

  // Individual test case
  it('should do something specific', () => {
    // 1. Arrange - Set up test data
    const input = { name: 'Test Course' };
    
    // 2. Act - Perform the action
    const result = createCourse(input);
    
    // 3. Assert - Check the result
    expect(result.name).toBe('Test Course');
  });
  
  // Cleanup after tests
  afterEach(() => {
    // Clean up resources
  });
});
```

---

## 📚 Types of Tests Explained

### 1. Unit Tests (Fast, Isolated)
**What**: Test individual functions/methods in isolation
**Speed**: Very fast (milliseconds)
**Coverage Impact**: High
**When to Use**: For pure functions, utilities, calculations

```typescript
// __tests__/utils/pricing.test.ts
import { calculateDiscount, formatPrice, getTaxAmount } from '@/lib/pricing';

describe('Pricing Utils', () => {
  describe('calculateDiscount', () => {
    it('calculates percentage discount correctly', () => {
      expect(calculateDiscount(100, 20)).toBe(80);
      expect(calculateDiscount(50, 10)).toBe(45);
    });

    it('handles 100% discount', () => {
      expect(calculateDiscount(100, 100)).toBe(0);
    });

    it('handles 0% discount', () => {
      expect(calculateDiscount(100, 0)).toBe(100);
    });

    it('throws error for invalid discount', () => {
      expect(() => calculateDiscount(100, 150)).toThrow('Invalid discount');
    });
  });

  describe('getTaxAmount', () => {
    it('calculates tax for different regions', () => {
      expect(getTaxAmount(100, 'US-CA')).toBe(8.25); // California tax
      expect(getTaxAmount(100, 'US-OR')).toBe(0);    // Oregon no tax
      expect(getTaxAmount(100, 'UK')).toBe(20);      // UK VAT
    });
  });
});
```

### 2. Integration Tests (Medium Speed, Multiple Components)
**What**: Test how different parts work together
**Speed**: Medium (seconds)
**Coverage Impact**: Medium-High
**When to Use**: For API endpoints, database operations, service interactions

```typescript
// __tests__/api/courses/enrollment.test.ts
import { POST } from '@/app/api/courses/[courseId]/enroll/route';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

// Mock external services
jest.mock('@/lib/stripe');

describe('Course Enrollment API', () => {
  let testUser: any;
  let testCourse: any;

  beforeEach(async () => {
    // Setup test data
    testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      }
    });

    testCourse = await db.course.create({
      data: {
        title: 'Test Course',
        price: 99,
        isPublished: true,
        userId: testUser.id,
      }
    });
  });

  afterEach(async () => {
    // Cleanup
    await db.enrollment.deleteMany();
    await db.course.deleteMany();
    await db.user.deleteMany();
  });

  it('enrolls user in free course', async () => {
    // Make course free
    await db.course.update({
      where: { id: testCourse.id },
      data: { price: 0 }
    });

    const request = new Request(`http://localhost/api/courses/${testCourse.id}/enroll`, {
      method: 'POST',
      headers: {
        'user-id': testUser.id, // Simulate authenticated user
      }
    });

    const response = await POST(request, { params: { courseId: testCourse.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify enrollment in database
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: testUser.id,
          courseId: testCourse.id
        }
      }
    });

    expect(enrollment).toBeTruthy();
    expect(enrollment?.status).toBe('ACTIVE');
  });

  it('processes payment for paid course', async () => {
    // Mock Stripe payment
    (stripe.charges.create as jest.Mock).mockResolvedValue({
      id: 'ch_test123',
      status: 'succeeded'
    });

    const request = new Request(`http://localhost/api/courses/${testCourse.id}/enroll`, {
      method: 'POST',
      headers: {
        'user-id': testUser.id,
      },
      body: JSON.stringify({
        paymentMethodId: 'pm_test123'
      })
    });

    const response = await POST(request, { params: { courseId: testCourse.id } });
    
    expect(response.status).toBe(200);
    expect(stripe.charges.create).toHaveBeenCalledWith({
      amount: 9900, // $99 in cents
      currency: 'usd',
      source: 'pm_test123',
      description: `Enrollment for Test Course`,
    });
  });

  it('prevents duplicate enrollment', async () => {
    // Create existing enrollment
    await db.enrollment.create({
      data: {
        userId: testUser.id,
        courseId: testCourse.id,
        status: 'ACTIVE'
      }
    });

    const request = new Request(`http://localhost/api/courses/${testCourse.id}/enroll`, {
      method: 'POST',
      headers: {
        'user-id': testUser.id,
      }
    });

    const response = await POST(request, { params: { courseId: testCourse.id } });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Already enrolled in this course');
  });
});
```

### 3. Component Tests (React/UI Testing)
**What**: Test React components and user interactions
**Speed**: Fast-Medium
**Coverage Impact**: Medium
**When to Use**: For all UI components, especially interactive ones

```typescript
// __tests__/components/CoursePlayer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoursePlayer } from '@/components/CoursePlayer';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('CoursePlayer Component', () => {
  const mockCourse = {
    id: '1',
    title: 'React Masterclass',
    chapters: [
      {
        id: 'ch1',
        title: 'Introduction',
        sections: [
          { id: 's1', title: 'Welcome', type: 'VIDEO', videoUrl: 'video1.mp4' },
          { id: 's2', title: 'Setup', type: 'TEXT', content: 'Setup instructions...' }
        ]
      }
    ]
  };

  const mockProgress = {
    completedSections: ['s1'],
    currentSection: 's2'
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      back: jest.fn(),
    });
  });

  it('renders course structure correctly', () => {
    render(<CoursePlayer course={mockCourse} progress={mockProgress} />);
    
    // Check course title
    expect(screen.getByText('React Masterclass')).toBeInTheDocument();
    
    // Check chapter
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    
    // Check sections
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Setup')).toBeInTheDocument();
  });

  it('shows completed status for finished sections', () => {
    render(<CoursePlayer course={mockCourse} progress={mockProgress} />);
    
    const completedSection = screen.getByText('Welcome').closest('div');
    expect(completedSection).toHaveClass('completed');
    
    // Check for checkmark icon
    expect(completedSection?.querySelector('.check-icon')).toBeInTheDocument();
  });

  it('handles section navigation', async () => {
    const onSectionChange = jest.fn();
    render(
      <CoursePlayer 
        course={mockCourse} 
        progress={mockProgress}
        onSectionChange={onSectionChange}
      />
    );
    
    // Click on a section
    fireEvent.click(screen.getByText('Setup'));
    
    expect(onSectionChange).toHaveBeenCalledWith('s2');
  });

  it('tracks video progress', async () => {
    const onProgress = jest.fn();
    render(
      <CoursePlayer 
        course={mockCourse} 
        progress={mockProgress}
        onProgress={onProgress}
      />
    );
    
    // Simulate video progress
    const videoElement = screen.getByTestId('video-player');
    fireEvent.timeUpdate(videoElement, { 
      target: { currentTime: 30, duration: 100 } 
    });
    
    await waitFor(() => {
      expect(onProgress).toHaveBeenCalledWith({
        sectionId: 's1',
        progress: 30,
        duration: 100
      });
    });
  });

  it('handles quiz submission', async () => {
    const mockQuizSection = {
      id: 's3',
      title: 'Quiz',
      type: 'QUIZ',
      questions: [
        {
          id: 'q1',
          text: 'What is React?',
          options: ['Framework', 'Library', 'Language'],
          correctAnswer: 1
        }
      ]
    };

    const courseWithQuiz = {
      ...mockCourse,
      chapters: [{
        ...mockCourse.chapters[0],
        sections: [...mockCourse.chapters[0].sections, mockQuizSection]
      }]
    };

    render(<CoursePlayer course={courseWithQuiz} progress={mockProgress} />);
    
    // Navigate to quiz
    fireEvent.click(screen.getByText('Quiz'));
    
    // Select answer
    fireEvent.click(screen.getByText('Library'));
    
    // Submit quiz
    fireEvent.click(screen.getByText('Submit Quiz'));
    
    await waitFor(() => {
      expect(screen.getByText('Correct! 1/1')).toBeInTheDocument();
    });
  });
});
```

### 4. End-to-End Tests (Slow, Complete User Flows)
**What**: Test complete user journeys through the application
**Speed**: Slow (seconds to minutes)
**Coverage Impact**: High for critical paths
**When to Use**: For critical business flows (signup, purchase, core features)

```typescript
// __tests__/e2e/complete-course-journey.test.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Complete Course Learning Journey', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test('Student completes entire course flow', async () => {
    // 1. Sign up as new user
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Jane Student');
    await page.fill('input[name="email"]', 'jane@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button:has-text("Sign Up")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard/user');
    await expect(page.locator('h1')).toContainText('Welcome, Jane');

    // 2. Browse and find a course
    await page.click('a:has-text("Browse Courses")');
    await page.fill('input[placeholder="Search courses..."]', 'JavaScript');
    await page.press('input[placeholder="Search courses..."]', 'Enter');
    
    // 3. View course details
    await page.click('text=Advanced JavaScript Concepts');
    await expect(page.locator('.course-title')).toHaveText('Advanced JavaScript Concepts');
    await expect(page.locator('.price')).toHaveText('$79');
    
    // 4. Purchase the course
    await page.click('button:has-text("Enroll Now")');
    
    // Fill payment form (in test mode)
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    await page.fill('input[name="name"]', 'Jane Student');
    await page.click('button:has-text("Complete Purchase")');
    
    // Wait for success
    await expect(page.locator('.toast-success')).toHaveText('Enrollment successful!');
    
    // 5. Start learning
    await page.click('button:has-text("Start Learning")');
    await expect(page.locator('.course-player')).toBeVisible();
    
    // 6. Complete first video
    await page.click('.section-item:first-child');
    const video = page.locator('video');
    await video.evaluate((video: HTMLVideoElement) => {
      video.currentTime = video.duration; // Skip to end
    });
    await page.waitForTimeout(1000); // Wait for progress save
    
    // 7. Complete quiz
    await page.click('text=Chapter 1 Quiz');
    await page.click('label:has-text("Correct Answer")');
    await page.click('button:has-text("Submit Quiz")');
    await expect(page.locator('.quiz-score')).toHaveText('100%');
    
    // 8. Check progress
    await page.goto('/my-courses');
    const courseCard = page.locator('.course-card:has-text("Advanced JavaScript")');
    await expect(courseCard.locator('.progress-bar')).toHaveAttribute('data-progress', '25');
    
    // 9. Download certificate (after completion)
    // ... continue with more sections until 100%
    await page.click('button:has-text("Download Certificate")');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('certificate');
  });

  test('Handles network errors gracefully', async () => {
    // Simulate offline
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/courses');
    await expect(page.locator('.error-message')).toHaveText('Unable to load courses. Please try again.');
    
    // Restore network
    await page.unroute('**/api/**');
    await page.click('button:has-text("Retry")');
    await expect(page.locator('.course-card')).toHaveCount.toBeGreaterThan(0);
  });
});
```

---

## 🧪 Testing with Real Examples from Your LMS

### Testing Authentication Flow
```typescript
// __tests__/auth/login.test.ts
import { signIn } from '@/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Authentication', () => {
  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER'
      }
    });
  });

  it('authenticates valid credentials', async () => {
    const result = await signIn({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });

  it('rejects invalid password', async () => {
    const result = await signIn({
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('handles non-existent user', async () => {
    const result = await signIn({
      email: 'nonexistent@example.com',
      password: 'password123'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });
});
```

### Testing Course Progress Tracking
```typescript
// __tests__/progress/tracking.test.ts
import { updateProgress, getProgress } from '@/actions/progress';
import { db } from '@/lib/db';

describe('Progress Tracking', () => {
  let userId: string;
  let courseId: string;
  let sectionId: string;

  beforeEach(async () => {
    // Setup test data
    const user = await db.user.create({
      data: { email: 'student@test.com', name: 'Student' }
    });
    userId = user.id;

    const course = await db.course.create({
      data: {
        title: 'Test Course',
        userId: 'instructor-id',
        isPublished: true
      }
    });
    courseId = course.id;

    const chapter = await db.chapter.create({
      data: {
        title: 'Chapter 1',
        courseId,
        position: 1
      }
    });

    const section = await db.section.create({
      data: {
        title: 'Section 1',
        chapterId: chapter.id,
        position: 1
      }
    });
    sectionId = section.id;

    // Enroll user
    await db.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE'
      }
    });
  });

  it('tracks section completion', async () => {
    await updateProgress({
      userId,
      sectionId,
      isCompleted: true
    });

    const progress = await getProgress(userId, courseId);
    expect(progress.completedSections).toContain(sectionId);
    expect(progress.percentageComplete).toBe(100); // Only 1 section
  });

  it('calculates course progress correctly', async () => {
    // Add more sections
    const chapter = await db.chapter.findFirst({ where: { courseId } });
    const section2 = await db.section.create({
      data: {
        title: 'Section 2',
        chapterId: chapter!.id,
        position: 2
      }
    });

    // Complete first section
    await updateProgress({
      userId,
      sectionId,
      isCompleted: true
    });

    const progress = await getProgress(userId, courseId);
    expect(progress.percentageComplete).toBe(50); // 1 of 2 sections

    // Complete second section
    await updateProgress({
      userId,
      sectionId: section2.id,
      isCompleted: true
    });

    const updatedProgress = await getProgress(userId, courseId);
    expect(updatedProgress.percentageComplete).toBe(100);
  });

  it('awards certificate on course completion', async () => {
    await updateProgress({
      userId,
      sectionId,
      isCompleted: true
    });

    const certificate = await db.certificate.findFirst({
      where: {
        userId,
        courseId
      }
    });

    expect(certificate).toBeTruthy();
    expect(certificate?.issuedAt).toBeInstanceOf(Date);
  });
});
```

---

## 📊 Understanding Code Coverage

### Coverage Metrics Explained

```bash
# Run coverage report
npm run test:coverage
```

Output explanation:
```
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   45.23 |    38.91 |   41.67 |   45.89 |
 actions/             |   62.50 |    50.00 |   66.67 |   62.50 |
  get-courses.ts      |   85.71 |    75.00 |  100.00 |   85.71 | 23-25
  get-user.ts         |   40.00 |    25.00 |   33.33 |   40.00 | 12,18-22,28-35
```

- **Statements (Stmts)**: Individual statements executed
- **Branches**: if/else, switch cases, ternary operators tested
- **Functions**: Functions that were called
- **Lines**: Lines of code executed
- **Uncovered Line #s**: Exact lines not covered by tests

### Visual Coverage Report
```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser
open coverage/lcov-report/index.html
```

This creates an interactive HTML report showing:
- Red lines: Not covered
- Yellow lines: Partially covered
- Green lines: Fully covered

### Setting Coverage Thresholds
In your `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 80,    // All if/else branches
    functions: 80,   // All functions
    lines: 80,       // All lines
    statements: 80   // All statements
  },
  // Per-file thresholds
  './src/actions/': {
    branches: 90,    // Critical actions need higher coverage
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

---

## 🛠️ Setting Up Testing in Your Project

### 1. Install Testing Dependencies
```bash
# Core testing libraries (already in your package.json)
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/jest

# For E2E testing
npm install --save-dev \
  @playwright/test

# For API testing
npm install --save-dev \
  supertest \
  @types/supertest

# For mocking
npm install --save-dev \
  msw
```

### 2. Configure Jest
Your `jest.config.js` is already set up, but here's what each part does:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './', // Next.js app directory
});

const customJestConfig = {
  // Setup files run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Use jsdom for React component testing
  testEnvironment: 'jest-environment-jsdom',
  
  // What files to analyze for coverage
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',          // Exclude type definitions
    '!**/node_modules/**',  // Exclude dependencies
  ],
  
  // Minimum coverage requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Path aliases matching tsconfig
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  }
};

module.exports = createJestConfig(customJestConfig);
```

### 3. Create Jest Setup File
```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      reload: jest.fn(),
      forward: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Global test utilities
global.createMockUser = () => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
});

global.createMockCourse = () => ({
  id: 'course-123',
  title: 'Test Course',
  description: 'Test Description',
  price: 99,
  isPublished: true,
});
```

### 4. Create Test Database Setup
```typescript
// __tests__/setup/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

beforeAll(async () => {
  // Reset database
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Course" CASCADE`;
  // ... other tables
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma as testDb };
```

---

## 💡 Best Practices & Common Patterns

### 1. Use Test Factories
```typescript
// __tests__/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { db } from '@/lib/db';

export const UserFactory = {
  build: (overrides = {}) => ({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: faker.internet.password(),
    role: 'USER',
    ...overrides,
  }),

  create: async (overrides = {}) => {
    const userData = UserFactory.build(overrides);
    return await db.user.create({ data: userData });
  },

  createMany: async (count: number, overrides = {}) => {
    const users = Array.from({ length: count }, () => 
      UserFactory.build(overrides)
    );
    return await db.user.createMany({ data: users });
  },
};

// Usage in tests
const user = await UserFactory.create({ role: 'ADMIN' });
const users = await UserFactory.createMany(5);
```

### 2. Test Error Cases
```typescript
describe('Error Handling', () => {
  it('handles database connection errors', async () => {
    // Mock database error
    jest.spyOn(db.course, 'findMany').mockRejectedValue(
      new Error('Connection refused')
    );

    const result = await getCourses();
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('database');
  });

  it('handles validation errors', async () => {
    const invalidData = { title: '' }; // Missing required fields
    
    const result = await createCourse(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Title is required');
  });
});
```

### 3. Use Data-Driven Tests
```typescript
describe('Discount Calculation', () => {
  const testCases = [
    { price: 100, discount: 10, expected: 90 },
    { price: 50, discount: 20, expected: 40 },
    { price: 75, discount: 33, expected: 50.25 },
    { price: 0, discount: 10, expected: 0 },
    { price: 100, discount: 0, expected: 100 },
    { price: 100, discount: 100, expected: 0 },
  ];

  testCases.forEach(({ price, discount, expected }) => {
    it(`calculates ${discount}% discount on $${price} correctly`, () => {
      expect(calculateDiscount(price, discount)).toBe(expected);
    });
  });
});
```

### 4. Mock External Services
```typescript
// __tests__/mocks/stripe.ts
export const stripeMock = {
  charges: {
    create: jest.fn().mockResolvedValue({
      id: 'ch_test123',
      amount: 9900,
      status: 'succeeded',
    }),
  },
  refunds: {
    create: jest.fn().mockResolvedValue({
      id: 'rf_test123',
      status: 'succeeded',
    }),
  },
};

jest.mock('@/lib/stripe', () => ({
  stripe: stripeMock,
}));
```

### 5. Test Async Operations
```typescript
describe('Async Operations', () => {
  it('handles async data fetching', async () => {
    const promise = fetchUserData('user-123');
    
    // Verify it returns a promise
    expect(promise).toBeInstanceOf(Promise);
    
    // Wait for resolution
    const data = await promise;
    expect(data.id).toBe('user-123');
  });

  it('handles timeouts', async () => {
    jest.useFakeTimers();
    
    const operation = performSlowOperation();
    
    // Fast-forward time
    jest.advanceTimersByTime(5000);
    
    await expect(operation).rejects.toThrow('Operation timed out');
    
    jest.useRealTimers();
  });
});
```

---

## 🗺️ Testing Roadmap for Taxomind

### Phase 1: Foundation (Week 1-2)
#### Priority: Critical Path Coverage

1. **Authentication Tests** (Day 1-2)
```bash
__tests__/
├── auth/
│   ├── login.test.ts
│   ├── register.test.ts
│   ├── logout.test.ts
│   └── password-reset.test.ts
```

2. **Core API Tests** (Day 3-4)
```bash
__tests__/
├── api/
│   ├── courses/
│   │   ├── create.test.ts
│   │   ├── update.test.ts
│   │   ├── delete.test.ts
│   │   └── list.test.ts
│   ├── enrollment/
│   │   ├── enroll.test.ts
│   │   └── unenroll.test.ts
│   └── payment/
│       ├── process.test.ts
│       └── refund.test.ts
```

3. **Database Operations** (Day 5)
```bash
__tests__/
├── db/
│   ├── queries.test.ts
│   ├── transactions.test.ts
│   └── migrations.test.ts
```

### Phase 2: Component Coverage (Week 3-4)
#### Priority: User-Facing Components

1. **Page Components** (Day 1-3)
```bash
__tests__/
├── components/
│   ├── pages/
│   │   ├── HomePage.test.tsx
│   │   ├── CoursePage.test.tsx
│   │   ├── DashboardPage.test.tsx
│   │   └── ProfilePage.test.tsx
```

2. **Interactive Components** (Day 4-5)
```bash
__tests__/
├── components/
│   ├── interactive/
│   │   ├── CoursePlayer.test.tsx
│   │   ├── QuizComponent.test.tsx
│   │   ├── VideoPlayer.test.tsx
│   │   └── ProgressTracker.test.tsx
```

### Phase 3: Integration Tests (Week 5-6)
#### Priority: Business-Critical Flows

1. **User Journeys** (Day 1-3)
```bash
__tests__/
├── integration/
│   ├── user-journey/
│   │   ├── new-user-onboarding.test.ts
│   │   ├── course-purchase-flow.test.ts
│   │   ├── learning-progression.test.ts
│   │   └── certificate-generation.test.ts
```

2. **System Integration** (Day 4-5)
```bash
__tests__/
├── integration/
│   ├── systems/
│   │   ├── payment-integration.test.ts
│   │   ├── email-notifications.test.ts
│   │   ├── ai-content-generation.test.ts
│   │   └── analytics-tracking.test.ts
```

### Phase 4: E2E Tests (Week 7-8)
#### Priority: Complete User Flows

```bash
__tests__/
├── e2e/
│   ├── signup-to-certificate.test.ts
│   ├── admin-course-management.test.ts
│   ├── student-learning-path.test.ts
│   └── payment-and-refund.test.ts
```

### Coverage Milestones

| Week | Target Coverage | Focus Area |
|------|----------------|------------|
| 1-2  | 30% | Critical paths |
| 3-4  | 50% | Components |
| 5-6  | 65% | Integration |
| 7-8  | 80% | E2E & edge cases |

---

## ❓ FAQ & Troubleshooting

### Common Questions

**Q: Do I need to test everything?**
A: No, focus on:
- Business-critical features (payment, enrollment)
- Complex logic (calculations, algorithms)
- Frequently changing code
- Bug-prone areas

**Q: How do I test code that uses the database?**
A: Three approaches:
1. Use a test database (recommended)
2. Mock the database calls
3. Use in-memory database (for unit tests)

**Q: Should I test third-party libraries?**
A: No, trust that they're tested. Only test your usage of them.

**Q: How do I test private methods?**
A: Don't test them directly. Test the public API that uses them.

### Common Issues & Solutions

#### Issue: Tests are slow
```typescript
// ❌ Slow: Real database calls
it('fetches all courses', async () => {
  const courses = await db.course.findMany(); // Hits real DB
  expect(courses).toHaveLength(10);
});

// ✅ Fast: Mocked database
it('fetches all courses', async () => {
  jest.spyOn(db.course, 'findMany').mockResolvedValue(mockCourses);
  const courses = await getCourses();
  expect(courses).toHaveLength(10);
});
```

#### Issue: Flaky tests (pass sometimes, fail others)
```typescript
// ❌ Flaky: Depends on timing
it('shows notification', async () => {
  triggerNotification();
  expect(screen.getByText('Success')).toBeInTheDocument(); // May fail
});

// ✅ Stable: Wait for element
it('shows notification', async () => {
  triggerNotification();
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

#### Issue: Can't test authenticated routes
```typescript
// Solution: Mock authentication
import { auth } from '@/auth';
jest.mock('@/auth');

beforeEach(() => {
  (auth as jest.Mock).mockResolvedValue({
    user: { id: 'user-123', role: 'USER' }
  });
});
```

### Testing Commands Cheatsheet

```bash
# Run all tests
npm test

# Run specific file
npm test -- CourseCard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="enrollment"

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Update snapshots
npm run test:update-snapshots

# Debug tests
npm run test:debug

# Run only changed files
npm test -- --onlyChanged

# Run tests in specific directory
npm test -- __tests__/api

# Run tests with verbose output
npm test -- --verbose

# Run tests in band (sequentially)
npm test -- --runInBand
```

---

## 🎯 Next Steps

1. **Start with one critical feature**: Pick authentication or enrollment
2. **Write 5 tests today**: Aim for small, focused tests
3. **Set up CI to run tests**: Add to your GitHub Actions
4. **Track coverage weekly**: Use `npm run test:coverage`
5. **Celebrate milestones**: 30%, 50%, 80% coverage

### Quick Start Challenge
Write your first test in 5 minutes:

```typescript
// __tests__/quick-start.test.ts
describe('My First Test', () => {
  it('validates email format', () => {
    const isValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    expect(isValid('user@example.com')).toBe(true);
    expect(isValid('invalid-email')).toBe(false);
  });
});
```

Run it:
```bash
npm test -- quick-start.test.ts
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright E2E](https://playwright.dev/docs/intro)
- [Kent C. Dodds Testing Articles](https://kentcdodds.com/testing)

---

*Remember: Testing isn't about reaching 100% coverage, it's about having confidence in your code. Start small, test what matters, and build up over time.*