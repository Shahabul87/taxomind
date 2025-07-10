import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Session } from 'next-auth'

// Mock session data
export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'STUDENT',
    image: null,
    isTwoFactorEnabled: false,
    isOAuth: false,
  },
  expires: '2024-12-31',
}

export const mockAdminSession: Session = {
  user: {
    id: 'admin-user-id',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    image: null,
    isTwoFactorEnabled: false,
    isOAuth: false,
  },
  expires: '2024-12-31',
}

export const mockTeacherSession: Session = {
  user: {
    id: 'teacher-user-id',
    name: 'Teacher User',
    email: 'teacher@example.com',
    role: 'TEACHER',
    image: null,
    isTwoFactorEnabled: false,
    isOAuth: false,
  },
  expires: '2024-12-31',
}

// All Providers wrapper
interface AllProvidersProps {
  children: React.ReactNode
  session?: Session | null
}

const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  session = mockSession 
}) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { session, ...renderOptions } = options
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders session={session}>{children}</AllProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Export everything
export * from '@testing-library/react'
export { customRender as render }

// Common test data
export const mockCourse = {
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course description',
  imageUrl: 'https://example.com/image.jpg',
  price: 99.99,
  isPublished: true,
  categoryId: 'category-1',
  userId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockChapter = {
  id: 'chapter-1',
  title: 'Test Chapter',
  description: 'A test chapter description',
  videoUrl: 'https://example.com/video.mp4',
  position: 1,
  isPublished: true,
  isFree: false,
  courseId: 'course-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockSection = {
  id: 'section-1',
  title: 'Test Section',
  description: 'A test section description',
  videoUrl: 'https://example.com/video.mp4',
  position: 1,
  isPublished: true,
  isFree: false,
  duration: 300,
  chapterId: 'chapter-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  role: 'STUDENT' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock API responses
export const mockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

// Mock error response
export const mockApiError = (message: string, status = 500) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: message }),
  text: () => Promise.resolve(JSON.stringify({ error: message })),
})

// Wait for async operations
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Mock router push function
export const mockPush = jest.fn()
export const mockReplace = jest.fn()
export const mockBack = jest.fn()

// Reset all mocks
export const resetMocks = () => {
  mockPush.mockReset()
  mockReplace.mockReset()
  mockBack.mockReset()
  jest.clearAllMocks()
}