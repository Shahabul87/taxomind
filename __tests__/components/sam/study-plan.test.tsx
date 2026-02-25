import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

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
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
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

// Mock @sam-ai/react types
jest.mock('@sam-ai/react', () => ({}));

import { DailyPlanWidget } from '@/components/sam/plans/DailyPlanWidget';

describe('DailyPlanWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the daily plan overview', () => {
    render(<DailyPlanWidget />);

    expect(screen.getByText('Daily Goal')).toBeInTheDocument();
  });

  it('shows today focus with task count', () => {
    render(<DailyPlanWidget plans={[]} />);

    expect(screen.getByText(/Today/)).toBeInTheDocument();
  });

  it('shows daily goal progress', () => {
    render(<DailyPlanWidget dailyGoalMinutes={60} todayStudyMinutes={30} />);

    expect(screen.getByText(/30m/)).toBeInTheDocument();
    expect(screen.getByText(/1h/)).toBeInTheDocument();
  });

  it('shows empty state when no active plans', () => {
    render(<DailyPlanWidget plans={[]} />);

    expect(screen.getByText('No active plans for today')).toBeInTheDocument();
  });

  it('shows streak badge when streak days > 0', () => {
    render(<DailyPlanWidget streakDays={5} />);

    expect(screen.getByText(/5 day streak/)).toBeInTheDocument();
  });

  it('renders compact mode', () => {
    render(<DailyPlanWidget compact={true} dailyGoalMinutes={60} todayStudyMinutes={45} />);

    expect(screen.getByText(/45m completed/)).toBeInTheDocument();
  });
});
