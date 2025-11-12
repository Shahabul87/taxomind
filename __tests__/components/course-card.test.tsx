import React from 'react'
import { screen } from '@testing-library/react'
import { render, mockCourse } from '../utils/test-utils'
import { CourseCard } from '@/components/course-card'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Return a test-friendly img element
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} src={props.src} />
  },
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  },
}))

// Mock components
jest.mock('@/components/icon-badge', () => ({
  IconBadge: ({ icon: Icon, size }: any) => <div data-testid="icon-badge">{size}</div>,
}))

jest.mock('@/components/course-progress', () => ({
  CourseProgress: ({ value, variant, size }: any) => (
    <div data-testid="course-progress">{value}% Complete</div>
  ),
}))

// Mock lib/format
jest.mock('@/lib/format', () => ({
  formatPrice: (price: number) => {
    if (price === 0) return 'Free'
    return `$${price.toFixed(2)}`
  },
}))

describe('CourseCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders course information correctly', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        progress={null}  // Set to null to show price instead of progress
        category="Programming"
      />
    )

    expect(screen.getByText(mockCourse.title)).toBeInTheDocument()
    expect(screen.getByText('Programming')).toBeInTheDocument()
    expect(screen.getByText(/5 Chapters/)).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })

  it('displays progress when provided', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        progress={75}
        category="Programming"
      />
    )

    expect(screen.getByTestId('course-progress')).toBeInTheDocument()
    expect(screen.getByText('75% Complete')).toBeInTheDocument()
  })

  it('does not display progress when null', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        category="Programming"
        progress={null}
      />
    )

    expect(screen.queryByTestId('course-progress')).not.toBeInTheDocument()
  })

  it('displays "Free" when price is 0', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={0}
        category="Programming"
        progress={null}
      />
    )

    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('links to correct course page', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        category="Programming"
        progress={null}
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/courses/${mockCourse.id}`)
  })

  it('displays correct singular/plural for chapters', () => {
    const { rerender } = render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={1}
        price={mockCourse.price || 0}
        category="Programming"
        progress={null}
      />
    )

    expect(screen.getByText(/1 Chapter/)).toBeInTheDocument()

    rerender(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        category="Programming"
        progress={null}
      />
    )

    expect(screen.getByText(/5 Chapters/)).toBeInTheDocument()
  })

  it('renders image with correct alt text', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        category="Programming"
        progress={null}
      />
    )

    const image = screen.getByAltText(mockCourse.title)
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', mockCourse.imageUrl)
  })

  it('applies hover classes to container', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        category="Programming"
        progress={null}
      />
    )

    const container = screen.getByRole('link').firstElementChild
    expect(container).toHaveClass('group', 'hover:shadow-sm', 'hover:scale-105')
  })

  it('applies line-clamp to title for long text', () => {
    const longTitle = 'This is a very long course title that should be truncated when it exceeds the maximum length allowed for display'
    
    render(
      <CourseCard
        id={mockCourse.id}
        title={longTitle}
        imageUrl={mockCourse.imageUrl || ''}
        chaptersLength={5}
        price={mockCourse.price || 0}
        category="Programming"
        progress={null}
      />
    )

    const titleElement = screen.getByText(longTitle)
    expect(titleElement).toBeInTheDocument()
    expect(titleElement).toHaveClass('line-clamp-2')
  })
})