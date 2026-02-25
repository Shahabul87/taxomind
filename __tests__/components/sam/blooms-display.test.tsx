import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock recharts
jest.mock('recharts', () => ({
  Radar: ({ children }: React.PropsWithChildren) => <div data-testid="radar">{children}</div>,
  RadarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="radar-chart" data-items={data.length}>{children}</div>
  ),
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
  CardDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" aria-valuenow={value} className={className} />
  ),
}));

// Mock BloomsLevel
jest.mock('@prisma/client', () => ({
  BloomsLevel: {
    REMEMBER: 'REMEMBER',
    UNDERSTAND: 'UNDERSTAND',
    APPLY: 'APPLY',
    ANALYZE: 'ANALYZE',
    EVALUATE: 'EVALUATE',
    CREATE: 'CREATE',
  },
}));

import { BloomsProgressChart } from '@/components/sam/student-dashboard/blooms-progress-chart';

describe('BloomsProgressChart', () => {
  const defaultScores = {
    REMEMBER: 85,
    UNDERSTAND: 72,
    APPLY: 60,
    ANALYZE: 45,
    EVALUATE: 30,
    CREATE: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the cognitive development overview card', () => {
    render(
      <BloomsProgressChart
        bloomsScores={defaultScores}
        strengthAreas={['REMEMBER']}
        weaknessAreas={['CREATE']}
        overallLevel={52}
      />
    );

    expect(screen.getByText('Cognitive Development Overview')).toBeInTheDocument();
    expect(screen.getByText('52%')).toBeInTheDocument();
  });

  it('renders all taxonomy levels in the detail view', () => {
    render(
      <BloomsProgressChart
        bloomsScores={defaultScores}
        strengthAreas={[]}
        weaknessAreas={[]}
        overallLevel={50}
      />
    );

    expect(screen.getByText('Remember')).toBeInTheDocument();
    expect(screen.getByText('Understand')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Evaluate')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('renders the radar chart', () => {
    render(
      <BloomsProgressChart
        bloomsScores={defaultScores}
        strengthAreas={[]}
        weaknessAreas={[]}
        overallLevel={50}
      />
    );

    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('displays strength areas', () => {
    render(
      <BloomsProgressChart
        bloomsScores={defaultScores}
        strengthAreas={['REMEMBER', 'UNDERSTAND']}
        weaknessAreas={[]}
        overallLevel={50}
      />
    );

    expect(screen.getByText('Your Strengths')).toBeInTheDocument();
  });

  it('shows empty state message when no strengths', () => {
    render(
      <BloomsProgressChart
        bloomsScores={defaultScores}
        strengthAreas={[]}
        weaknessAreas={[]}
        overallLevel={50}
      />
    );

    expect(screen.getByText('Keep practicing to identify your strengths!')).toBeInTheDocument();
  });

  it('displays weakness areas for improvement', () => {
    render(
      <BloomsProgressChart
        bloomsScores={defaultScores}
        strengthAreas={[]}
        weaknessAreas={['CREATE', 'EVALUATE']}
        overallLevel={50}
      />
    );

    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
    // "Create" and "Evaluate" appear both in the detailed level list and the weakness areas
    // so we use getAllByText and verify at least 2 instances (level + weakness)
    const createElements = screen.getAllByText('Create');
    expect(createElements.length).toBeGreaterThanOrEqual(2);
    const evaluateElements = screen.getAllByText('Evaluate');
    expect(evaluateElements.length).toBeGreaterThanOrEqual(2);
  });
});
