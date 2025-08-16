import { http, HttpResponse } from 'msw'
import { mockCourse, mockChapter, mockSection, mockUser } from './test-utils'

// Mock API handlers for MSW
export const handlers = [
  // Auth endpoints
  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: mockUser,
      expires: '2024-12-31',
    })
  }),

  // Course endpoints
  http.get('/api/courses', () => {
    return HttpResponse.json([mockCourse])
  }),

  http.get('/api/courses/:courseId', ({ params }) => {
    if (params.courseId === 'course-1') {
      return HttpResponse.json(mockCourse)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  http.post('/api/courses', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      ...mockCourse,
      ...body,
      id: 'new-course-id',
    }, { status: 201 })
  }),

  http.patch('/api/courses/:courseId', async ({ params, request }) => {
    const body = await request.json()
    if (params.courseId === 'course-1') {
      return HttpResponse.json({
        ...mockCourse,
        ...body,
      })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  http.delete('/api/courses/:courseId', ({ params }) => {
    if (params.courseId === 'course-1') {
      return HttpResponse.json({ success: true })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Chapter endpoints
  http.get('/api/courses/:courseId/chapters', ({ params }) => {
    if (params.courseId === 'course-1') {
      return HttpResponse.json([mockChapter])
    }
    return HttpResponse.json([])
  }),

  http.get('/api/courses/:courseId/chapters/:chapterId', ({ params }) => {
    if (params.courseId === 'course-1' && params.chapterId === 'chapter-1') {
      return HttpResponse.json(mockChapter)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  http.post('/api/courses/:courseId/chapters', async ({ params, request }) => {
    const body = await request.json()
    if (params.courseId === 'course-1') {
      return HttpResponse.json({
        ...mockChapter,
        ...body,
        id: 'new-chapter-id',
      }, { status: 201 })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Section endpoints
  http.get('/api/chapters/:chapterId/sections', ({ params }) => {
    if (params.chapterId === 'chapter-1') {
      return HttpResponse.json([mockSection])
    }
    return HttpResponse.json([])
  }),

  http.get('/api/chapters/:chapterId/sections/:sectionId', ({ params }) => {
    if (params.chapterId === 'chapter-1' && params.sectionId === 'section-1') {
      return HttpResponse.json(mockSection)
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Analytics endpoints
  http.get('/api/analytics', () => {
    return HttpResponse.json({
      totalRevenue: 1000,
      totalSales: 50,
      totalCourses: 10,
      totalStudents: 100,
    })
  }),

  http.get('/api/analytics/students', () => {
    return HttpResponse.json({
      totalStudents: 100,
      activeStudents: 80,
      newStudents: 20,
    })
  }),

  // User endpoints
  http.get('/api/users/me', () => {
    return HttpResponse.json(mockUser)
  }),

  http.patch('/api/users/me', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      ...mockUser,
      ...body,
    })
  }),

  // Search endpoints
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    
    if (query) {
      return HttpResponse.json({
        courses: [mockCourse],
        total: 1,
        page: 1,
        totalPages: 1,
      })
    }
    
    return HttpResponse.json({
      courses: [],
      total: 0,
      page: 1,
      totalPages: 0,
    })
  }),

  // Categories endpoints
  http.get('/api/categories', () => {
    return HttpResponse.json([
      { id: 'category-1', name: 'Programming', slug: 'programming' },
      { id: 'category-2', name: 'Design', slug: 'design' },
    ])
  }),

  // Error endpoints for testing error handling
  http.get('/api/error-test', () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.post('/api/error-test', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }),

  // Unauthorized endpoint for testing auth
  http.get('/api/admin/protected', () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }),
]

// Error handlers for specific test scenarios
export const errorHandlers = [
  http.get('/api/courses', () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.post('/api/courses', () => {
    return HttpResponse.json(
      { error: 'Validation failed' },
      { status: 400 }
    )
  }),
]

// Network error handlers
export const networkErrorHandlers = [
  http.get('/api/courses', () => {
    return HttpResponse.error()
  }),
]