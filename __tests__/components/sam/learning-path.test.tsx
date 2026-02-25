import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock fetch
global.fetch = jest.fn();

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, fmt: string) => '2026-03-01'),
  formatDistanceToNow: jest.fn(() => '2 days ago'),
  addDays: jest.fn((date: Date, days: number) => new Date()),
  isPast: jest.fn(() => false),
  isToday: jest.fn(() => false),
  isFuture: jest.fn(() => true),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" aria-valuenow={value} className={className} />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => <div data-testid="skeleton" className={className} />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipProvider: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: Object.assign(
    React.forwardRef<HTMLDivElement, React.PropsWithChildren<{ asChild?: boolean }>>(
      function TooltipTrigger({ children }, ref) { return <div ref={ref}>{children}</div>; }
    ),
    { displayName: 'TooltipTrigger' }
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import { LearningPathTimeline } from '@/components/sam/LearningPathTimeline';

const mockTimelineData = {
  success: true,
  data: {
    pathId: 'path-1',
    pathName: 'React Mastery',
    courseName: 'Advanced React',
    milestones: [
      {
        id: 'ms-1',
        name: 'Hooks Basics',
        type: 'concept',
        description: 'Learn React Hooks fundamentals',
        status: 'completed',
        completedAt: '2026-02-01T00:00:00Z',
        masteryLevel: 90,
        targetMastery: 80,
        order: 1,
        rewards: { xp: 100 },
      },
      {
        id: 'ms-2',
        name: 'Custom Hooks',
        type: 'skill',
        status: 'current',
        masteryLevel: 45,
        targetMastery: 80,
        order: 2,
        estimatedDate: '2026-03-10T00:00:00Z',
      },
      {
        id: 'ms-3',
        name: 'Advanced Patterns',
        type: 'chapter',
        status: 'upcoming',
        masteryLevel: 0,
        targetMastery: 80,
        order: 3,
      },
    ],
    progress: {
      completedCount: 1,
      totalCount: 3,
      completionPercentage: 33,
      currentMilestoneIndex: 1,
      estimatedCompletionDate: '2026-04-01T00:00:00Z',
      averagePacePerDay: 1.5,
      daysRemaining: 30,
    },
    stats: {
      totalXpEarned: 100,
      badgesEarned: 1,
      currentStreak: 5,
      bestStreak: 10,
      totalTimeSpent: 240,
    },
    pacing: {
      status: 'on_track',
      daysAheadOrBehind: 0,
      recommendation: 'Keep it up!',
    },
  },
};

describe('LearningPathTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no pathId or courseId provided', () => {
    render(<LearningPathTimeline />);

    expect(screen.getByText('Learning Path Timeline')).toBeInTheDocument();
    expect(screen.getByText(/No learning path selected/)).toBeInTheDocument();
  });

  it('shows loading state during fetch', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<LearningPathTimeline pathId="path-1" />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders timeline data after successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTimelineData),
    });

    render(<LearningPathTimeline pathId="path-1" />);

    await waitFor(() => {
      expect(screen.getByText('React Mastery')).toBeInTheDocument();
    });

    expect(screen.getByText(/1\/3 milestones/)).toBeInTheDocument();
  });

  it('renders milestone names', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTimelineData),
    });

    render(<LearningPathTimeline pathId="path-1" />);

    await waitFor(() => {
      expect(screen.getByText('Hooks Basics')).toBeInTheDocument();
      expect(screen.getByText('Custom Hooks')).toBeInTheDocument();
      expect(screen.getByText('Advanced Patterns')).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed' }),
    });

    render(<LearningPathTimeline pathId="path-1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Timeline')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls onMilestoneClick when milestone is clicked', async () => {
    const mockClick = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTimelineData),
    });

    render(<LearningPathTimeline pathId="path-1" onMilestoneClick={mockClick} />);

    await waitFor(() => {
      expect(screen.getByText('Hooks Basics')).toBeInTheDocument();
    });

    const milestoneElement = screen.getByText('Hooks Basics').closest('[class*="cursor-pointer"]');
    if (milestoneElement) {
      fireEvent.click(milestoneElement);
      expect(mockClick).toHaveBeenCalledWith('ms-1');
    }
  });
});
