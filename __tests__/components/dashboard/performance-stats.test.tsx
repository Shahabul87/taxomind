import React from 'react';
import { render, screen } from '@testing-library/react';

import PerformanceStats from '@/components/dashboard/performance-stats';

describe('PerformanceStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- 1. Renders all 4 metrics ----------------------------------------
  it('renders all 4 metric labels', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('Course Completion')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Quiz Scores')).toBeInTheDocument();
    expect(screen.getByText('Learning Streak')).toBeInTheDocument();
  });

  it('renders the section heading', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('Performance Stats')).toBeInTheDocument();
  });

  // -- 2. Shows correct metric values ----------------------------------
  it('displays the correct Course Completion value', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('displays the correct Quiz Scores value', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays the correct Learning Streak value', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('7 days')).toBeInTheDocument();
  });

  // -- 3. Shows additional detail text ----------------------------------
  it('shows the Course Completion detail text', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('4 of 6 courses completed')).toBeInTheDocument();
  });

  it('shows the Achievements detail text', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('8 badges earned')).toBeInTheDocument();
  });

  it('shows the Achievements badge with "+3 this month"', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('+3 this month')).toBeInTheDocument();
  });

  it('shows the Quiz Scores detail text', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('Average score across tests')).toBeInTheDocument();
  });

  it('shows the Learning Streak detail text', () => {
    render(<PerformanceStats />);

    expect(screen.getByText('Consecutive days active')).toBeInTheDocument();
  });

  // -- 4. Renders icons for each metric ---------------------------------
  it('renders an SVG icon for each of the 4 metrics', () => {
    const { container } = render(<PerformanceStats />);

    // Each metric row contains one lucide-react SVG icon:
    // BarChart, Award, LineChart, TrendingUp
    const svgIcons = container.querySelectorAll('svg');
    expect(svgIcons).toHaveLength(4);
  });

  it('renders icons within circular icon containers', () => {
    const { container } = render(<PerformanceStats />);

    // Each icon is wrapped in a div with w-8 h-8 rounded-full styling.
    // The "+3 this month" badge also has rounded-full, so we scope to
    // divs that contain an SVG (the icon wrappers).
    const iconContainers = container.querySelectorAll('div.rounded-full');
    expect(iconContainers).toHaveLength(4);
  });

  // -- 5. Structural checks ---------------------------------------------
  it('renders exactly 4 metric rows with dividers', () => {
    const { container } = render(<PerformanceStats />);

    // The component uses divide-y on the parent, so each direct child
    // represents a metric row. The parent of the rows is the second child
    // of the outer wrapper (first child is the header).
    const dividerContainer = container.querySelector('.divide-y');
    expect(dividerContainer).toBeInTheDocument();

    // Each row has the flex layout class
    const rows = container.querySelectorAll('.flex.items-center.justify-between');
    expect(rows).toHaveLength(4);
  });
});
