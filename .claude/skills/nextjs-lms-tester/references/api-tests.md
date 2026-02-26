# 🌐 API Route Test Reference

## Setup

### Test Environment
API route tests run in `jest-environment-node`. Ensure the Jest config routes them correctly:
```js
// jest.config.js
projects: [
  {
    displayName: 'api',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/api/**/*.test.ts'],
  }
]
```

### Core Mocking Setup

```ts
// __tests__/api/helpers.ts — shared test utilities

import { NextRequest } from 'next/server'

// Create mock NextRequest
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
) {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options
  const urlObj = new URL(url, 'http://localhost:3000')
  
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const init: RequestInit = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
  }

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj, init)
}

// Mock authenticated session
export function mockAuthSession(user = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'STUDENT',
}) {
  jest.mock('@/lib/auth', () => ({
    auth: jest.fn(() => Promise.resolve({ user })),
  }))
  // OR for NextAuth v5:
  jest.mock('next-auth', () => ({
    auth: jest.fn(() => Promise.resolve({ user })),
  }))
  return user
}

// Mock unauthenticated
export function mockNoSession() {
  jest.mock('@/lib/auth', () => ({
    auth: jest.fn(() => Promise.resolve(null)),
  }))
}
```

### Prisma Mock
```ts
// __mocks__/prisma.ts or __tests__/helpers/mock-prisma.ts
import { PrismaClient } from '@prisma/client'

jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    chapter: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    purchase: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userProgress: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn({
      // pass same mock methods for transaction
    })),
  },
}))
```

## Test Patterns

### Basic CRUD API Route
```ts
// __tests__/api/courses.test.ts
import { GET, POST } from '@/app/api/courses/route'
import { createMockRequest } from './helpers'
import { db } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

import { auth } from '@/lib/auth'

describe('GET /api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns published courses', async () => {
    const mockCourses = [
      { id: '1', title: 'Course 1', isPublished: true },
      { id: '2', title: 'Course 2', isPublished: true },
    ]
    ;(db.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

    const req = createMockRequest('/api/courses')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublished: true } })
    )
  })

  it('supports search filtering', async () => {
    ;(db.course.findMany as jest.Mock).mockResolvedValue([])

    const req = createMockRequest('/api/courses', {
      searchParams: { search: 'javascript' }
    })
    const response = await GET(req)

    expect(db.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: expect.objectContaining({ contains: 'javascript' })
        })
      })
    )
  })

  it('returns 500 on database error', async () => {
    ;(db.course.findMany as jest.Mock).mockRejectedValue(new Error('DB down'))

    const req = createMockRequest('/api/courses')
    const response = await GET(req)

    expect(response.status).toBe(500)
  })
})

describe('POST /api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({
      user: { id: 'teacher-1', role: 'TEACHER' }
    })
  })

  it('creates a course when authenticated as teacher', async () => {
    const newCourse = { id: '1', title: 'New Course', userId: 'teacher-1' }
    ;(db.course.create as jest.Mock).mockResolvedValue(newCourse)

    const req = createMockRequest('/api/courses', {
      method: 'POST',
      body: { title: 'New Course' },
    })
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.title).toBe('New Course')
  })

  it('returns 401 when not authenticated', async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)

    const req = createMockRequest('/api/courses', {
      method: 'POST',
      body: { title: 'Course' },
    })
    const response = await POST(req)

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const req = createMockRequest('/api/courses', {
      method: 'POST',
      body: { title: '' }, // empty title
    })
    const response = await POST(req)

    expect(response.status).toBe(400)
  })
})
```

### Protected Route with Role Check
```ts
describe('DELETE /api/courses/[courseId]', () => {
  it('allows course owner to delete', async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'owner-1' } })
    ;(db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1', userId: 'owner-1'
    })
    ;(db.course.delete as jest.Mock).mockResolvedValue({})

    const req = createMockRequest('/api/courses/course-1', { method: 'DELETE' })
    const response = await DELETE(req, { params: { courseId: 'course-1' } })

    expect(response.status).toBe(200)
  })

  it('rejects non-owner', async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'other-user' } })
    ;(db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1', userId: 'owner-1'
    })

    const req = createMockRequest('/api/courses/course-1', { method: 'DELETE' })
    const response = await DELETE(req, { params: { courseId: 'course-1' } })

    expect(response.status).toBe(403)
  })
})
```

### Stripe Webhook Test
```ts
import Stripe from 'stripe'

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
})

describe('POST /api/stripe/webhook', () => {
  let stripe: jest.Mocked<Stripe>

  beforeEach(() => {
    stripe = new (Stripe as any)() as jest.Mocked<Stripe>
  })

  it('handles checkout.session.completed', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { courseId: 'course-1', userId: 'user-1' },
          payment_status: 'paid',
        }
      }
    }
    ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(event)
    ;(db.purchase.create as jest.Mock).mockResolvedValue({})

    const req = createMockRequest('/api/stripe/webhook', {
      method: 'POST',
      body: event,
      headers: { 'stripe-signature': 'test-sig' },
    })
    const response = await POST(req)

    expect(response.status).toBe(200)
    expect(db.purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          courseId: 'course-1',
        })
      })
    )
  })

  it('returns 400 for invalid signature', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const req = createMockRequest('/api/stripe/webhook', {
      method: 'POST',
      body: {},
      headers: { 'stripe-signature': 'bad-sig' },
    })
    const response = await POST(req)

    expect(response.status).toBe(400)
  })
})
```

### Server Action Test
```ts
// Testing Next.js server actions
import { createCourse } from '@/app/(dashboard)/teacher/courses/actions'

jest.mock('@/lib/db')
jest.mock('@/lib/auth')

describe('createCourse action', () => {
  it('creates course and returns redirect', async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    ;(db.course.create as jest.Mock).mockResolvedValue({ id: 'new-course' })

    const formData = new FormData()
    formData.set('title', 'My Course')

    const result = await createCourse(formData)

    expect(result).toEqual(
      expect.objectContaining({ success: true, courseId: 'new-course' })
    )
  })
})
```

## What Every API Route Test Should Cover

| Test Case | Priority |
|-----------|----------|
| Happy path (valid input, authenticated) | 🔴 Critical |
| Unauthenticated request → 401 | 🔴 Critical |
| Invalid/missing input → 400 | 🟠 High |
| Resource not found → 404 | 🟠 High |
| Unauthorized (wrong role/owner) → 403 | 🟠 High |
| Database error → 500 (no stack leak) | 🟠 High |
| Pagination/filtering | 🟡 Medium |
| Rate limit exceeded → 429 | 🟡 Medium |
| Idempotency (for POST) | 🟢 Low |
