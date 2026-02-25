import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
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

import SmartGoalsTracker from '@/components/dashboard/smart/smart-goals-tracker';

const mockGoals = [
  {
    id: 'goal-1',
    title: 'Complete React Course',
    description: 'Master React fundamentals',
    category: 'LEARNING',
    status: 'IN_PROGRESS' as const,
    progress: 75,
    targetDate: '2026-12-31',
    createdAt: '2026-01-01',
    milestones: [
      { id: 'ms-1', title: 'Hooks Module', completed: true },
      { id: 'ms-2', title: 'Advanced Patterns', completed: false },
    ],
  },
  {
    id: 'goal-2',
    title: 'Write Blog Posts',
    description: 'Share technical knowledge',
    category: 'CONTENT_CREATION',
    status: 'COMPLETED' as const,
    progress: 100,
    targetDate: '2026-06-30',
    createdAt: '2026-01-15',
    milestones: [
      { id: 'ms-3', title: 'Write 5 Posts', completed: true },
    ],
  },
];

describe('SmartGoalsTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the goals tracker with title', () => {
    render(<SmartGoalsTracker />);

    expect(screen.getByText('Smart Goals Tracker')).toBeInTheDocument();
    expect(screen.getByText('Add Goal')).toBeInTheDocument();
  });

  it('renders goals list', () => {
    render(<SmartGoalsTracker goals={mockGoals} />);

    expect(screen.getByText('Complete React Course')).toBeInTheDocument();
  });

  it('shows goal progress', () => {
    render(<SmartGoalsTracker goals={mockGoals} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays milestone counts', () => {
    render(<SmartGoalsTracker goals={mockGoals} />);

    expect(screen.getByText('1/2 milestones')).toBeInTheDocument();
  });

  it('shows AI recommended goals', () => {
    render(<SmartGoalsTracker />);

    expect(screen.getByText('AI Recommended Goals')).toBeInTheDocument();
  });

  it('shows quick stats', () => {
    render(<SmartGoalsTracker goals={mockGoals} />);

    // Stats section
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Avg Progress')).toBeInTheDocument();
  });
});
