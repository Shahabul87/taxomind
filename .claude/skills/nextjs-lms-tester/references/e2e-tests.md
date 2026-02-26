# 🎭 E2E Test Reference (Playwright)

## Setup

### Config Template
```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup — runs before all tests
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

### Auth Setup (Reusable Login State)
```ts
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test'

const studentFile = 'e2e/.auth/student.json'
const teacherFile = 'e2e/.auth/teacher.json'

setup('authenticate as student', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill('student@test.com')
  await page.getByLabel('Password').fill('test-password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('/dashboard')
  await page.context().storageState({ path: studentFile })
})

setup('authenticate as teacher', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill('teacher@test.com')
  await page.getByLabel('Password').fill('test-password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('/teacher/courses')
  await page.context().storageState({ path: teacherFile })
})
```

### Page Object Model
```ts
// e2e/pages/course-page.ts
import { Page, Locator, expect } from '@playwright/test'

export class CoursePage {
  readonly page: Page
  readonly title: Locator
  readonly enrollButton: Locator
  readonly chapterList: Locator
  readonly progressBar: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByRole('heading', { level: 1 })
    this.enrollButton = page.getByRole('button', { name: /enroll/i })
    this.chapterList = page.getByTestId('chapter-list')
    this.progressBar = page.getByRole('progressbar')
  }

  async goto(courseId: string) {
    await this.page.goto(`/courses/${courseId}`)
    await expect(this.title).toBeVisible()
  }

  async enroll() {
    await this.enrollButton.click()
  }

  async getChapterCount() {
    return this.chapterList.getByRole('listitem').count()
  }

  async navigateToChapter(index: number) {
    await this.chapterList.getByRole('listitem').nth(index).click()
  }
}
```

## Critical E2E Flows for LMS

### 1. Student Enrollment Flow
```ts
// e2e/flows/enrollment.spec.ts
import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/student.json' })

test.describe('Course Enrollment', () => {
  test('student can browse and enroll in free course', async ({ page }) => {
    // Browse courses
    await page.goto('/search')
    await expect(page.getByText('Browse Courses')).toBeVisible()

    // Find a free course
    await page.getByPlaceholder(/search/i).fill('free course')
    await page.keyboard.press('Enter')
    await page.getByText('Free Course Title').click()

    // Enroll
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Free Course')
    await page.getByRole('button', { name: /enroll/i }).click()

    // Verify enrollment
    await expect(page.getByText(/start learning/i)).toBeVisible()
    await expect(page.getByRole('progressbar')).toBeVisible()
  })

  test('student sees enrolled courses on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('My Courses')).toBeVisible()
    // Verify at least one course card is visible
    await expect(page.getByTestId('course-card').first()).toBeVisible()
  })
})
```

### 2. Course Completion Flow
```ts
test.describe('Course Progress', () => {
  test('student can complete a chapter and track progress', async ({ page }) => {
    await page.goto('/courses/test-course-id/chapters/chapter-1')

    // Watch video / read content
    await expect(page.getByTestId('chapter-content')).toBeVisible()

    // Mark as complete
    await page.getByRole('button', { name: /mark.*complete/i }).click()

    // Verify progress updated
    await expect(page.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow', '0')

    // Navigate to next chapter
    await page.getByRole('button', { name: /next/i }).click()
    await expect(page.url()).toContain('chapter-2')
  })
})
```

### 3. Teacher Course Creation Flow
```ts
test.use({ storageState: 'e2e/.auth/teacher.json' })

test.describe('Course Creation', () => {
  test('teacher can create and publish a course', async ({ page }) => {
    // Navigate to create
    await page.goto('/teacher/courses')
    await page.getByRole('button', { name: /new course/i }).click()

    // Fill in course details
    await page.getByLabel('Course Title').fill('E2E Test Course')
    await page.getByRole('button', { name: /create/i }).click()

    // Should redirect to course editor
    await expect(page.url()).toMatch(/\/teacher\/courses\/[\w-]+/)

    // Fill description
    await page.getByLabel(/description/i).fill('This is a test course')

    // Add a chapter
    await page.getByRole('button', { name: /add chapter/i }).click()
    await page.getByLabel(/chapter title/i).fill('First Chapter')
    await page.getByRole('button', { name: /save/i }).click()

    // Publish
    await page.getByRole('button', { name: /publish/i }).click()
    await expect(page.getByText(/published/i)).toBeVisible()
  })
})
```

### 4. Payment Flow (Stripe)
```ts
test.describe('Payment', () => {
  test('student can purchase a paid course', async ({ page }) => {
    await page.goto('/courses/paid-course-id')

    await page.getByRole('button', { name: /enroll.*\$/i }).click()

    // Should redirect to Stripe Checkout
    // In test mode, verify redirect URL contains checkout.stripe.com
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10000 })

    // Note: Full Stripe checkout testing requires Stripe test mode
    // and is typically handled in a separate integration test suite
  })
})
```

### 5. Auth Flow
```ts
test.describe('Authentication', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    // Clear auth state
    await page.context().clearCookies()

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('login with valid credentials', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('student@test.com')
    await page.getByLabel('Password').fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(/welcome/i)).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('wrong@test.com')
    await page.getByLabel('Password').fill('bad-password')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid/i)).toBeVisible()
  })
})
```

## E2E Best Practices

### Do
- Use `data-testid` for elements without semantic roles
- Use Page Object Model for reusable page interactions
- Test user-visible behavior, not implementation details
- Use `expect(locator).toBeVisible()` over `toBeInTheDocument()`
- Set reasonable timeouts: `toBeVisible({ timeout: 5000 })`
- Clean up test data after runs (or use isolated test DB)

### Don't
- Don't test styling or CSS classes
- Don't test third-party UI (Stripe checkout, OAuth providers)
- Don't use `page.waitForTimeout()` — use `waitForURL`, `toBeVisible`
- Don't depend on test execution order
- Don't share state between test files

## Priority E2E Tests for LMS

| Flow | Priority | Complexity |
|------|----------|-----------|
| Login/Logout | 🔴 Critical | S |
| Browse → Enroll (free) | 🔴 Critical | M |
| Chapter completion → Progress | 🔴 Critical | M |
| Course creation (teacher) | 🟠 High | L |
| Payment → Access (Stripe) | 🟠 High | L |
| Search/filter courses | 🟡 Medium | S |
| Profile editing | 🟡 Medium | S |
| Admin dashboard access | 🟡 Medium | M |
| Mobile responsive checks | 🟢 Low | M |
