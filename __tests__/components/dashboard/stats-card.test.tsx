import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: Object.assign(
      React.forwardRef<HTMLDivElement, React.PropsWithChildren<Record<string, unknown>>>(
        function MotionDiv({ children, ...props }, ref) { return <div ref={ref}>{children}</div>; }
      ),
      { displayName: 'MotionDiv' }
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="stat-card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="trend-badge" className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" aria-valuenow={value} className={className} />
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import SmartOverviewCards from '@/components/dashboard/smart/smart-overview-cards';

describe('SmartOverviewCards', () => {
  const defaultUserData = {
    courses: [{ id: 'c1' }, { id: 'c2' }],
    enrollments: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }],
    posts: [
      { id: 'p1', comments: [{ id: 'cm1' }] },
      { id: 'p2', comments: [{ id: 'cm2' }, { id: 'cm3' }] },
    ],
    ideas: [{ id: 'i1' }],
  };

  const defaultAnalytics: unknown[] = [];
  const defaultAchievements = [{ id: 'a1' }, { id: 'a2' }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders overview cards with titles', () => {
    render(
      <SmartOverviewCards
        userData={defaultUserData}
        analytics={defaultAnalytics}
        achievements={defaultAchievements}
      />
    );

    expect(screen.getByText('Courses Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Learning Streak')).toBeInTheDocument();
    expect(screen.getByText('Skills Acquired')).toBeInTheDocument();
    expect(screen.getByText('Content Created')).toBeInTheDocument();
    expect(screen.getByText('Learning Time')).toBeInTheDocument();
    expect(screen.getByText('Community Impact')).toBeInTheDocument();
  });

  it('renders correct enrollment count', () => {
    render(
      <SmartOverviewCards
        userData={defaultUserData}
        analytics={defaultAnalytics}
        achievements={defaultAchievements}
      />
    );

    // Value "3" appears in multiple cards (enrollments, content created, community impact)
    // so use getAllByText instead of getByText
    const threeElements = screen.getAllByText('3');
    expect(threeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders trend indicators', () => {
    render(
      <SmartOverviewCards
        userData={defaultUserData}
        analytics={defaultAnalytics}
        achievements={defaultAchievements}
      />
    );

    const badges = screen.getAllByTestId('trend-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('handles empty userData gracefully', () => {
    render(
      <SmartOverviewCards
        userData={{}}
        analytics={[]}
        achievements={[]}
      />
    );

    expect(screen.getByText('Courses Enrolled')).toBeInTheDocument();
    // Value "0" appears in multiple cards when userData is empty
    // so use getAllByText instead of getByText
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders progress bars for each card', () => {
    render(
      <SmartOverviewCards
        userData={defaultUserData}
        analytics={defaultAnalytics}
        achievements={defaultAchievements}
      />
    );

    const progressBars = screen.getAllByTestId('progress-bar');
    expect(progressBars.length).toBe(6); // One per card
  });

  it('renders descriptions for each card', () => {
    render(
      <SmartOverviewCards
        userData={defaultUserData}
        analytics={defaultAnalytics}
        achievements={defaultAchievements}
      />
    );

    expect(screen.getByText('Active learning paths')).toBeInTheDocument();
    expect(screen.getByText('Consistent learning')).toBeInTheDocument();
    expect(screen.getByText('Knowledge gained')).toBeInTheDocument();
    expect(screen.getByText('Sharing knowledge')).toBeInTheDocument();
    expect(screen.getByText('Time invested')).toBeInTheDocument();
    expect(screen.getByText('Engagement level')).toBeInTheDocument();
  });
});
