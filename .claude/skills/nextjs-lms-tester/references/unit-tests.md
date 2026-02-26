# 🧪 Unit Test Reference (Utils, Hooks, Prisma)

## Pure Utility Functions

### Pattern: Input → Output testing
```ts
// lib/format-price.ts
export function formatPrice(price: number): string { ... }

// __tests__/lib/format-price.test.ts
describe('formatPrice', () => {
  it('formats whole numbers', () => {
    expect(formatPrice(29)).toBe('$29.00')
  })

  it('formats decimals', () => {
    expect(formatPrice(29.99)).toBe('$29.99')
  })

  it('returns "Free" for zero', () => {
    expect(formatPrice(0)).toBe('Free')
  })

  it('handles negative values', () => {
    expect(formatPrice(-10)).toBe('-$10.00')
  })

  it('handles very large numbers', () => {
    expect(formatPrice(999999.99)).toBe('$999,999.99')
  })
})
```

### Pattern: Validation function testing
```ts
describe('validateCourseInput', () => {
  const validInput = {
    title: 'My Course',
    description: 'A great course',
    categoryId: 'cat-1',
  }

  it('accepts valid input', () => {
    expect(validateCourseInput(validInput)).toEqual({ success: true, data: validInput })
  })

  it.each([
    ['empty title', { ...validInput, title: '' }],
    ['missing title', { description: 'desc', categoryId: 'cat' }],
    ['title too long', { ...validInput, title: 'x'.repeat(201) }],
  ])('rejects %s', (_, input) => {
    const result = validateCourseInput(input)
    expect(result.success).toBe(false)
  })
})
```

## Zod Schema Testing
```ts
import { courseSchema } from '@/lib/validations/course'

describe('courseSchema', () => {
  it('parses valid course data', () => {
    const result = courseSchema.safeParse({
      title: 'Valid Course',
      description: 'Description here',
      price: 29.99,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = courseSchema.safeParse({ description: 'No title' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title')
    }
  })

  it('rejects negative price', () => {
    const result = courseSchema.safeParse({
      title: 'Course',
      price: -5,
    })
    expect(result.success).toBe(false)
  })
})
```

## Custom React Hooks

### Setup
```ts
import { renderHook, act, waitFor } from '@testing-library/react'
```

### Pattern: State hook
```ts
// hooks/use-debounce.ts
describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'hello' } }
    )

    rerender({ value: 'world' })
    expect(result.current).toBe('hello') // not yet

    act(() => jest.advanceTimersByTime(500))
    expect(result.current).toBe('world') // now updated
  })
})
```

### Pattern: Data fetching hook
```ts
describe('useCourseProgress', () => {
  it('returns progress data', async () => {
    // Mock the fetch/API call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ progress: 75, completed: 15, total: 20 }),
    })

    const { result } = renderHook(() => useCourseProgress('course-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.progress).toBe(75)
    expect(result.current.completed).toBe(15)
  })

  it('handles error state', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCourseProgress('course-1'))

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })
})
```

### Pattern: Hook with context wrapper
```ts
// When hook requires a provider (e.g., session, theme)
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider session={mockSession}>
    <ThemeProvider>{children}</ThemeProvider>
  </SessionProvider>
)

const { result } = renderHook(() => useMyHook(), { wrapper })
```

## Prisma Data Access Layer Testing

### Mocking Strategy
Don't mock Prisma directly in tests — create a data access layer and mock that:

```ts
// lib/data/courses.ts (data access layer)
export async function getPublishedCourses(categoryId?: string) {
  return db.course.findMany({
    where: { isPublished: true, categoryId },
    include: { chapters: { where: { isPublished: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

// __tests__/lib/data/courses.test.ts
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: jest.fn(),
    }
  }
}))

import { db } from '@/lib/db'
import { getPublishedCourses } from '@/lib/data/courses'

describe('getPublishedCourses', () => {
  beforeEach(() => jest.clearAllMocks())

  it('queries published courses', async () => {
    const mockCourses = [{ id: '1', title: 'Course 1' }]
    ;(db.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

    const result = await getPublishedCourses()

    expect(result).toEqual(mockCourses)
    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublished: true }),
      })
    )
  })

  it('filters by category when provided', async () => {
    ;(db.course.findMany as jest.Mock).mockResolvedValue([])

    await getPublishedCourses('cat-1')

    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 'cat-1' }),
      })
    )
  })
})
```

### Testing Transactions
```ts
describe('enrollStudent', () => {
  it('creates purchase and progress in transaction', async () => {
    const txMock = {
      purchase: { create: jest.fn().mockResolvedValue({ id: 'p1' }) },
      userProgress: { createMany: jest.fn().mockResolvedValue({ count: 5 }) },
    }
    ;(db.$transaction as jest.Mock).mockImplementation((fn) => fn(txMock))

    await enrollStudent('user-1', 'course-1')

    expect(txMock.purchase.create).toHaveBeenCalled()
    expect(txMock.userProgress.createMany).toHaveBeenCalled()
  })

  it('rolls back on failure', async () => {
    ;(db.$transaction as jest.Mock).mockRejectedValue(new Error('DB error'))

    await expect(enrollStudent('user-1', 'course-1')).rejects.toThrow('DB error')
  })
})
```

## Testing Async Utilities

### Pattern: Retry logic
```ts
describe('withRetry', () => {
  it('succeeds on first try', async () => {
    const fn = jest.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, 3)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, 3)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'))
    await expect(withRetry(fn, 3)).rejects.toThrow('always fails')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
```

## Test Data Factories

Create reusable factories to avoid duplicating mock data:

```ts
// __tests__/factories.ts
import { faker } from '@faker-js/faker'

export function buildUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'STUDENT',
    createdAt: faker.date.past(),
    ...overrides,
  }
}

export function buildCourse(overrides = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    imageUrl: faker.image.url(),
    price: faker.number.float({ min: 0, max: 199.99, fractionDigits: 2 }),
    isPublished: true,
    categoryId: faker.string.uuid(),
    userId: faker.string.uuid(),
    createdAt: faker.date.past(),
    ...overrides,
  }
}

export function buildChapter(overrides = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.words(4),
    position: faker.number.int({ min: 0, max: 20 }),
    isPublished: true,
    courseId: faker.string.uuid(),
    ...overrides,
  }
}

// Usage:
const course = buildCourse({ title: 'Specific Title', price: 0 })
const users = Array.from({ length: 10 }, () => buildUser())
```

## What to Test Per File Type

| File Type | Test Coverage Goal |
|-----------|-------------------|
| `lib/validations/*.ts` | 100% — all valid + invalid inputs |
| `lib/format*.ts` / `lib/utils.ts` | 100% — pure functions, easy to test |
| `hooks/use*.ts` | 90% — state changes, error, loading |
| `lib/data/*.ts` | 80% — query construction, error handling |
| `lib/auth*.ts` | 90% — session parsing, role checks |
| `lib/stripe*.ts` | 80% — event handling, amount calculation |
