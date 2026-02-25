import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the CourseCard component
jest.mock('@/components/course-card', () => ({
  CourseCard: ({
    id,
    title,
    imageUrl,
    chaptersLength,
    price,
    progress,
    category,
  }: {
    id: string;
    title: string;
    imageUrl: string;
    chaptersLength: number;
    price: number;
    progress: number | null;
    category: string;
  }) => (
    <div data-testid={`course-card-${id}`}>
      <span data-testid="course-title">{title}</span>
      <span data-testid="course-category">{category}</span>
      <span data-testid="course-chapters">{chaptersLength} chapters</span>
      <span data-testid="course-price">{price}</span>
      {progress !== null && <span data-testid="course-progress">{progress}%</span>}
    </div>
  ),
}));

import { CoursesList } from '@/components/courses-list';

type CourseItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  userId: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string } | null;
  chapters: { id: string }[];
  progress: number | null;
};

const createMockCourse = (overrides: Partial<CourseItem> = {}): CourseItem => ({
  id: `course-${Math.random().toString(36).slice(2)}`,
  title: 'Test Course',
  description: 'A test course description',
  imageUrl: '/test-image.jpg',
  price: 29.99,
  isPublished: true,
  userId: 'user-1',
  categoryId: 'cat-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: 'cat-1', name: 'Development' },
  chapters: [{ id: 'ch-1' }, { id: 'ch-2' }],
  progress: 50,
  ...overrides,
});

describe('CoursesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders course cards for each item', () => {
    const items = [
      createMockCourse({ id: 'course-1', title: 'React Course' }),
      createMockCourse({ id: 'course-2', title: 'Next.js Course' }),
      createMockCourse({ id: 'course-3', title: 'TypeScript Course' }),
    ];

    render(<CoursesList items={items as never[]} />);

    expect(screen.getByTestId('course-card-course-1')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-course-2')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-course-3')).toBeInTheDocument();
  });

  it('shows empty message when no courses exist', () => {
    render(<CoursesList items={[]} />);

    expect(screen.getByText('No courses found')).toBeInTheDocument();
  });

  it('passes correct props to CourseCard', () => {
    const items = [
      createMockCourse({
        id: 'course-1',
        title: 'Advanced React',
        price: 49.99,
        category: { id: 'cat-1', name: 'Web Development' },
        chapters: [{ id: 'ch-1' }, { id: 'ch-2' }, { id: 'ch-3' }],
        progress: 75,
      }),
    ];

    render(<CoursesList items={items as never[]} />);

    expect(screen.getByText('Advanced React')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('3 chapters')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles courses with null category', () => {
    const items = [
      createMockCourse({
        id: 'course-1',
        title: 'Uncategorized Course',
        category: null,
      }),
    ];

    render(<CoursesList items={items as never[]} />);

    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });

  it('handles courses with null progress', () => {
    const items = [
      createMockCourse({
        id: 'course-1',
        title: 'Not Started Course',
        progress: null,
      }),
    ];

    render(<CoursesList items={items as never[]} />);

    expect(screen.getByTestId('course-card-course-1')).toBeInTheDocument();
    expect(screen.queryByTestId('course-progress')).not.toBeInTheDocument();
  });

  it('handles courses with null imageUrl', () => {
    const items = [
      createMockCourse({
        id: 'course-1',
        title: 'No Image Course',
        imageUrl: null,
      }),
    ];

    render(<CoursesList items={items as never[]} />);

    expect(screen.getByTestId('course-card-course-1')).toBeInTheDocument();
  });

  it('renders correct grid layout with multiple courses', () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      createMockCourse({ id: `course-${i}`, title: `Course ${i}` })
    );

    render(<CoursesList items={items as never[]} />);

    items.forEach((item) => {
      expect(screen.getByTestId(`course-card-${item.id}`)).toBeInTheDocument();
    });
  });

  it('handles course with zero price', () => {
    const items = [
      createMockCourse({
        id: 'course-free',
        title: 'Free Course',
        price: 0,
      }),
    ];

    render(<CoursesList items={items as never[]} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
