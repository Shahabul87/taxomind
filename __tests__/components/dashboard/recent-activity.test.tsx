import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the TimeAgo component
jest.mock('@/app/components/ui/time-ago', () => ({
  TimeAgo: ({ date }: { date: Date }) => (
    <span data-testid="time-ago">{date.toISOString()}</span>
  ),
}));

import RecentActivity from '@/components/dashboard/recent-activity';

type ActivityType = 'view' | 'download' | 'submission' | 'event';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
}

describe('RecentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders activity list with default activities', () => {
    render(<RecentActivity />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Advanced Machine Learning Course')).toBeInTheDocument();
    expect(screen.getByText('Python for Data Science Cheatsheet')).toBeInTheDocument();
  });

  it('renders custom activities', () => {
    const activities: Activity[] = [
      {
        id: '1',
        type: 'view',
        title: 'React Hooks Tutorial',
        description: 'Watched introduction video',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'download',
        title: 'TypeScript Cheatsheet',
        timestamp: new Date(),
      },
    ];

    render(<RecentActivity activities={activities} />);

    expect(screen.getByText('React Hooks Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Watched introduction video')).toBeInTheDocument();
    expect(screen.getByText('TypeScript Cheatsheet')).toBeInTheDocument();
  });

  it('shows timestamps for each activity', () => {
    const activities: Activity[] = [
      {
        id: '1',
        type: 'view',
        title: 'Test Activity',
        timestamp: new Date('2026-02-20T10:00:00Z'),
      },
    ];

    render(<RecentActivity activities={activities} />);

    const timeAgo = screen.getByTestId('time-ago');
    expect(timeAgo).toBeInTheDocument();
  });

  it('renders correct icons for different activity types', () => {
    const activities: Activity[] = [
      { id: '1', type: 'view', title: 'View Activity', timestamp: new Date() },
      { id: '2', type: 'download', title: 'Download Activity', timestamp: new Date() },
      { id: '3', type: 'submission', title: 'Submission Activity', timestamp: new Date() },
      { id: '4', type: 'event', title: 'Event Activity', timestamp: new Date() },
    ];

    render(<RecentActivity activities={activities} />);

    expect(screen.getByText('View Activity')).toBeInTheDocument();
    expect(screen.getByText('Download Activity')).toBeInTheDocument();
    expect(screen.getByText('Submission Activity')).toBeInTheDocument();
    expect(screen.getByText('Event Activity')).toBeInTheDocument();
  });

  it('shows empty state when activities array is empty', () => {
    render(<RecentActivity activities={[]} />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders activity descriptions when provided', () => {
    const activities: Activity[] = [
      {
        id: '1',
        type: 'view',
        title: 'Course with Description',
        description: 'Detailed activity description here',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'download',
        title: 'Course without Description',
        timestamp: new Date(),
      },
    ];

    render(<RecentActivity activities={activities} />);

    expect(screen.getByText('Detailed activity description here')).toBeInTheDocument();
  });
});
