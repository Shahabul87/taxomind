// Simple API test without external dependencies
import { mockCourse, mockUser } from '../utils/test-utils'

// Mock implementations
const mockDb = {
  course: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
}

const mockCurrentUser = jest.fn()

describe('/api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/courses', () => {
    it('returns courses for authenticated user', async () => {
      // Mock user authentication
      mockCurrentUser.mockResolvedValue(mockUser)
      
      // Mock database response
      mockDb.course.findMany.mockResolvedValue([mockCourse])

      const request = new NextRequest('http://localhost:3000/api/courses')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toEqual([mockCourse])
      expect(mockDb.course.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
        },
        include: {
          category: true,
          chapters: {
            where: {
              isPublished: true,
            },
            select: {
              id: true,
            },
          },
          enrollments: {
            where: {
              userId: mockUser.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    })

    it('returns 401 when user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/courses')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })

    it('handles database errors gracefully', async () => {
      mockCurrentUser.mockResolvedValue(mockUser)
      mockDb.course.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/courses')
      const response = await GET(request)
      
      expect(response.status).toBe(500)
    })

    it('filters courses by category when provided', async () => {
      mockCurrentUser.mockResolvedValue(mockUser)
      mockDb.course.findMany.mockResolvedValue([mockCourse])

      const request = new NextRequest('http://localhost:3000/api/courses?categoryId=category-1')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      expect(mockDb.course.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          categoryId: 'category-1',
        },
        include: {
          category: true,
          chapters: {
            where: {
              isPublished: true,
            },
            select: {
              id: true,
            },
          },
          enrollments: {
            where: {
              userId: mockUser.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    })
  })

  describe('POST /api/courses', () => {
    const newCourseData = {
      title: 'New Course',
      description: 'A new course description',
      categoryId: 'category-1',
    }

    it('creates a new course for teacher', async () => {
      const teacherUser = { ...mockUser, role: 'TEACHER' as const }
      mockCurrentUser.mockResolvedValue(teacherUser)
      
      const createdCourse = { ...mockCourse, ...newCourseData, id: 'new-course-id' }
      mockDb.course.create.mockResolvedValue(createdCourse)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data).toEqual(createdCourse)
      expect(mockDb.course.create).toHaveBeenCalledWith({
        data: {
          ...newCourseData,
          userId: teacherUser.id,
        },
      })
    })

    it('returns 401 when user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('returns 403 when user is not a teacher or admin', async () => {
      const studentUser = { ...mockUser, role: 'STUDENT' as const }
      mockCurrentUser.mockResolvedValue(studentUser)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(403)
    })

    it('validates required fields', async () => {
      const teacherUser = { ...mockUser, role: 'TEACHER' as const }
      mockCurrentUser.mockResolvedValue(teacherUser)

      const invalidData = {
        description: 'Missing title',
      }

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('handles database creation errors', async () => {
      const teacherUser = { ...mockUser, role: 'TEACHER' as const }
      mockCurrentUser.mockResolvedValue(teacherUser)
      mockDb.course.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourseData),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(500)
    })
  })
})