import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} src={props.src as string} alt={props.alt as string} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  },
}));

import EnrolledCourses from '@/components/dashboard/enrolled-courses';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

interface TestCourse {
  id: string;
  title: string;
  imageUrl?: string | null;
  progress?: number;
  category?: { name: string; id?: string } | null;
}

const buildCourse = (overrides: Partial<TestCourse> = {}): TestCourse => ({
  id: `course-${Math.random().toString(36).slice(2, 8)}`,
  title: 'Introduction to TypeScript',
  imageUrl: 'https://example.com/ts-course.jpg',
  progress: 45,
  category: { name: 'Programming', id: 'cat-1' },
  ...overrides,
});

const buildCourses = (count: number): TestCourse[] =>
  Array.from({ length: count }, (_, i) =>
    buildCourse({
      id: `course-${i + 1}`,
      title: `Course ${i + 1}`,
      progress: (i + 1) * 20,
    }),
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EnrolledCourses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- 1. Renders course cards with titles --------------------------------
  it('renders course titles when courses are provided', () => {
    const courses = [
      buildCourse({ id: 'c1', title: 'React Fundamentals' }),
      buildCourse({ id: 'c2', title: 'Node.js Backend' }),
    ];

    render(<EnrolledCourses courses={courses} />);

    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Node.js Backend')).toBeInTheDocument();
  });

  it('renders the section heading "Your Courses"', () => {
    render(<EnrolledCourses courses={buildCourses(2)} />);

    expect(screen.getByText('Your Courses')).toBeInTheDocument();
  });

  it('renders a maximum of 4 courses even when more are provided', () => {
    const courses = buildCourses(6);

    render(<EnrolledCourses courses={courses} />);

    // Only courses 1-4 should be rendered
    expect(screen.getByText('Course 1')).toBeInTheDocument();
    expect(screen.getByText('Course 4')).toBeInTheDocument();
    expect(screen.queryByText('Course 5')).not.toBeInTheDocument();
    expect(screen.queryByText('Course 6')).not.toBeInTheDocument();
  });

  // -- 2. Shows progress percentages -------------------------------------
  it('displays progress percentage for each course', () => {
    const courses = [
      buildCourse({ id: 'c1', title: 'Course A', progress: 30 }),
      buildCourse({ id: 'c2', title: 'Course B', progress: 75 }),
    ];

    render(<EnrolledCourses courses={courses} />);

    expect(screen.getByText('Progress: 30%')).toBeInTheDocument();
    expect(screen.getByText('Progress: 75%')).toBeInTheDocument();
  });

  it('shows 0% progress when progress is undefined', () => {
    const courses = [buildCourse({ id: 'c1', progress: undefined })];

    render(<EnrolledCourses courses={courses} />);

    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();
  });

  // -- 3. Shows category badges -------------------------------------------
  it('displays category name badge on course cards', () => {
    const courses = [
      buildCourse({ id: 'c1', category: { name: 'Data Science' } }),
      buildCourse({ id: 'c2', category: { name: 'Web Development' } }),
    ];

    render(<EnrolledCourses courses={courses} />);

    expect(screen.getByText('Data Science')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
  });

  it('shows "Course" as fallback when category is null', () => {
    const courses = [buildCourse({ id: 'c1', category: null })];

    render(<EnrolledCourses courses={courses} />);

    expect(screen.getByText('Course')).toBeInTheDocument();
  });

  it('shows "Course" as fallback when category name is missing', () => {
    const courses = [buildCourse({ id: 'c1', category: undefined })];

    render(<EnrolledCourses courses={courses} />);

    expect(screen.getByText('Course')).toBeInTheDocument();
  });

  // -- 4. Shows continue links to course pages ----------------------------
  it('renders "Continue" links pointing to the correct course page', () => {
    const courses = [
      buildCourse({ id: 'course-abc', title: 'Course ABC' }),
      buildCourse({ id: 'course-xyz', title: 'Course XYZ' }),
    ];

    render(<EnrolledCourses courses={courses} />);

    const continueLinks = screen.getAllByText('Continue');
    expect(continueLinks).toHaveLength(2);

    // Verify each link points to the correct course URL
    const linkAbc = continueLinks[0].closest('a');
    expect(linkAbc).toHaveAttribute('href', '/courses/course-abc');

    const linkXyz = continueLinks[1].closest('a');
    expect(linkXyz).toHaveAttribute('href', '/courses/course-xyz');
  });

  it('renders a "View all" link pointing to the student dashboard', () => {
    render(<EnrolledCourses courses={buildCourses(1)} />);

    const viewAllLink = screen.getByText('View all');
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/dashboard/student');
  });

  // -- 5. Shows empty state with CTA when no courses ----------------------
  it('shows the empty state when courses array is empty', () => {
    render(<EnrolledCourses courses={[]} />);

    expect(screen.getByText('No courses enrolled yet')).toBeInTheDocument();
    expect(
      screen.getByText('Browse our catalog to find courses that interest you'),
    ).toBeInTheDocument();
  });

  it('shows the "All Courses" CTA link in empty state', () => {
    render(<EnrolledCourses courses={[]} />);

    const ctaLink = screen.getByText('All Courses');
    expect(ctaLink.closest('a')).toHaveAttribute('href', '/teacher/courses');
  });

  it('does not show course cards in empty state', () => {
    render(<EnrolledCourses courses={[]} />);

    expect(screen.queryByText('Continue')).not.toBeInTheDocument();
    expect(screen.queryByText(/Progress:/)).not.toBeInTheDocument();
  });

  // -- 6. Handles missing imageUrl gracefully -----------------------------
  it('renders course card without image when imageUrl is null', () => {
    const courses = [buildCourse({ id: 'c1', title: 'No Image Course', imageUrl: null })];

    render(<EnrolledCourses courses={courses} />);

    // The course card should still render the title and other content
    expect(screen.getByText('No Image Course')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();

    // No <img> element should be rendered since imageUrl is null
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders course card without image when imageUrl is undefined', () => {
    const courses = [buildCourse({ id: 'c1', title: 'Undefined Image', imageUrl: undefined })];

    render(<EnrolledCourses courses={courses} />);

    expect(screen.getByText('Undefined Image')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the image when imageUrl is provided', () => {
    const courses = [
      buildCourse({
        id: 'c1',
        title: 'With Image',
        imageUrl: 'https://example.com/image.jpg',
      }),
    ];

    render(<EnrolledCourses courses={courses} />);

    const img = screen.getByAltText('With Image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
