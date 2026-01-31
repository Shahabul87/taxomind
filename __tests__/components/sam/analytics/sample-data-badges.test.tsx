/**
 * Tests for SAM Analytics Widget "Sample Data" Badges
 *
 * Verifies that all 7 analytics widgets display a "Sample Data" badge
 * when no real data is provided (using generated sample data),
 * and hide it when real data is passed.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mock recharts — it uses DOM measurement APIs not available in jsdom
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    ComposedChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="composed-chart">{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    RadarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="radar-chart">{children}</div>
    ),
    AreaChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="area-chart">{children}</div>
    ),
    Treemap: () => <div data-testid="treemap" />,
    Line: () => null,
    Bar: () => null,
    Area: () => null,
    Pie: () => null,
    Radar: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Cell: () => null,
    ReferenceLine: () => null,
  };
});

// ============================================================================
// TESTS
// ============================================================================

describe('Analytics Widgets - Sample Data Badge', () => {
  describe('WeeklyTrendsChart', () => {
    it('shows "Sample Data" badge when no data is provided', async () => {
      const { WeeklyTrendsChart } = await import(
        '@/components/sam/analytics/weekly-trends-chart'
      );
      render(<WeeklyTrendsChart />);

      expect(screen.getAllByText('Sample Data').length).toBeGreaterThanOrEqual(1);
    });

    it('hides badge when real data is provided', async () => {
      const { WeeklyTrendsChart } = await import(
        '@/components/sam/analytics/weekly-trends-chart'
      );
      const realData = [
        {
          date: '2025-01-01',
          dayOfWeek: 'Monday',
          studyMinutes: 45,
          sessionsCompleted: 2,
          questionsAnswered: 10,
          accuracy: 80,
          topicsStudied: 3,
        },
      ];
      render(<WeeklyTrendsChart dailyData={realData} />);

      expect(screen.queryByText('Sample Data')).toBeNull();
    });
  });

  describe('MasteryProgressChart', () => {
    it('shows "Sample Data" badge when no data is provided', async () => {
      const { MasteryProgressChart } = await import(
        '@/components/sam/analytics/mastery-progress-chart'
      );
      render(<MasteryProgressChart />);

      expect(screen.getAllByText('Sample Data').length).toBeGreaterThanOrEqual(1);
    });

    it('hides badge when real data is provided', async () => {
      const { MasteryProgressChart } = await import(
        '@/components/sam/analytics/mastery-progress-chart'
      );
      const realData = [
        {
          date: '2025-01-01',
          overallMastery: 72,
          courseMastery: 65,
          topicsMastered: 5,
          hoursSpent: 10,
        },
      ];
      render(<MasteryProgressChart masteryHistory={realData} />);

      expect(screen.queryByText('Sample Data')).toBeNull();
    });
  });

  describe('EfficiencyDashboard', () => {
    it('shows "Sample Data" badge when no data is provided', async () => {
      const { EfficiencyDashboard } = await import(
        '@/components/sam/analytics/efficiency-dashboard'
      );
      render(<EfficiencyDashboard />);

      expect(screen.getAllByText('Sample Data').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('LevelProgressionChart', () => {
    it('shows "Sample Data" badge when no data is provided', async () => {
      const { LevelProgressionChart } = await import(
        '@/components/sam/analytics/level-progression-chart'
      );
      render(<LevelProgressionChart />);

      expect(screen.getAllByText('Sample Data').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('RecommendationInsightsWidget', () => {
    it('shows "Sample Data" badge when no data is provided', async () => {
      const { RecommendationInsightsWidget } = await import(
        '@/components/sam/analytics/recommendation-insights-widget'
      );
      render(<RecommendationInsightsWidget />);

      expect(screen.getAllByText('Sample Data').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SkillTrajectoryChart', () => {
    it('shows "Sample Data" badge when no data is provided', async () => {
      const { SkillTrajectoryChart } = await import(
        '@/components/sam/analytics/skill-trajectory-chart'
      );
      render(<SkillTrajectoryChart />);

      expect(screen.getAllByText('Sample Data').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('RetentionCurveChart', () => {
    it('shows "Sample Data" badge when no data is provided', async () => {
      const { RetentionCurveChart } = await import(
        '@/components/sam/analytics/retention-curve-chart'
      );
      render(<RetentionCurveChart />);

      expect(screen.getAllByText('Sample Data').length).toBeGreaterThanOrEqual(1);
    });
  });
});
