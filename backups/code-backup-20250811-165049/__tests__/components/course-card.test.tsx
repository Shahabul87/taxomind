import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { render, mockCourse } from '../utils/test-utils'
import CourseCard from '@/components/course-card'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />
  },
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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
        imageUrl={mockCourse.imageUrl}
        chaptersLength={5}
        price={mockCourse.price}
        progress={75}
        category="Programming"
      />
    )

    expect(screen.getByText(mockCourse.title)).toBeInTheDocument()
    expect(screen.getByText('Programming')).toBeInTheDocument()
    expect(screen.getByText('5 Chapters')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })

  it('displays progress when provided', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl}
        chaptersLength={5}
        price={mockCourse.price}
        progress={75}
        category="Programming"
      />
    )

    expect(screen.getByText('75% Complete')).toBeInTheDocument()
  })

  it('does not display progress when not provided', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl}
        chaptersLength={5}
        price={mockCourse.price}
        category="Programming"
      />
    )

    expect(screen.queryByText(/% Complete/)).not.toBeInTheDocument()
  })

  it('displays "Free" when price is 0', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl}
        chaptersLength={5}
        price={0}
        category="Programming"
      />
    )

    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('navigates to course page when clicked', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl}
        chaptersLength={5}
        price={mockCourse.price}
        category="Programming"
      />
    )

    const courseCard = screen.getByRole('button')
    fireEvent.click(courseCard)

    expect(mockPush).toHaveBeenCalledWith(`/courses/${mockCourse.id}`)
  })

  it('handles missing image gracefully', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl=""
        chaptersLength={5}
        price={mockCourse.price}
        category="Programming"
      />
    )

    const image = screen.getByAltText(mockCourse.title)
    expect(image).toBeInTheDocument()
  })

  it('applies hover effects correctly', () => {
    render(
      <CourseCard
        id={mockCourse.id}
        title={mockCourse.title}
        imageUrl={mockCourse.imageUrl}
        chaptersLength={5}
        price={mockCourse.price}
        category="Programming"
      />
    )

    const courseCard = screen.getByRole('button')
    
    fireEvent.mouseEnter(courseCard)
    expect(courseCard).toHaveClass('hover:shadow-lg')
    
    fireEvent.mouseLeave(courseCard)
  })

  it('truncates long titles appropriately', () => {
    const longTitle = 'This is a very long course title that should be truncated when it exceeds the maximum length allowed for display'
    
    render(
      <CourseCard
        id={mockCourse.id}
        title={longTitle}
        imageUrl={mockCourse.imageUrl}
        chaptersLength={5}
        price={mockCourse.price}
        category="Programming"
      />
    )

    const titleElement = screen.getByText(longTitle)
    expect(titleElement).toBeInTheDocument()
    expect(titleElement).toHaveClass('line-clamp-2')
  })
})