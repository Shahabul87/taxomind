import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the Progress UI component
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={className}
    >
      <div style={{ width: `${value}%` }} data-testid="progress-fill" />
    </div>
  ),
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import { CourseProgress } from '@/components/course-progress';

describe('CourseProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the progress bar with correct value', () => {
    render(<CourseProgress value={50} />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('displays 0% progress correctly', () => {
    render(<CourseProgress value={0} />);

    expect(screen.getByText('0% Complete')).toBeInTheDocument();
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('displays 100% progress correctly', () => {
    render(<CourseProgress value={100} />);

    expect(screen.getByText('100% Complete')).toBeInTheDocument();
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('displays partial progress with rounded percentage', () => {
    render(<CourseProgress value={33.7} />);

    expect(screen.getByText('34% Complete')).toBeInTheDocument();
  });

  it('applies success variant styling', () => {
    render(<CourseProgress value={75} variant="success" />);

    const progressText = screen.getByText('75% Complete');
    expect(progressText.className).toContain('text-emerald-700');
  });

  it('applies default variant styling when no variant specified', () => {
    render(<CourseProgress value={50} />);

    const progressText = screen.getByText('50% Complete');
    expect(progressText.className).toContain('text-sky-700');
  });
});
