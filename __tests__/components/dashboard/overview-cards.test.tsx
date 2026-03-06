import React from 'react';
import { render, screen } from '@testing-library/react';

import OverviewCards from '@/components/dashboard/overview-cards';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/** Build a minimal userData object with the arrays the component reads. */
const buildUserData = (overrides: {
  activities?: unknown[];
  courses?: unknown[];
  ideas?: unknown[];
} = {}) => ({
  activities: overrides.activities ?? [{ id: 'a1' }, { id: 'a2' }],
  courses: overrides.courses ?? [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }],
  ideas: overrides.ideas ?? [{ id: 'i1' }],
});

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

describe('OverviewCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- 1. Renders all 4 cards ----------------------------------------
  it('renders exactly 4 cards', () => {
    render(<OverviewCards userData={buildUserData()} />);

    // Each card is wrapped in a <Link> which the mock renders as <a>.
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  // -- 2. Shows correct titles ----------------------------------------
  it('shows the correct title for each card', () => {
    render(<OverviewCards userData={buildUserData()} />);

    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Enrolled Courses')).toBeInTheDocument();
    expect(screen.getByText('Created Ideas')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  // -- 3. Shows correct values from userData --------------------------
  it('displays values derived from userData array lengths', () => {
    const userData = buildUserData({
      activities: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
      courses: [{ id: 'c1' }],
      ideas: [{ id: 'i1' }, { id: 'i2' }, { id: 'i3' }, { id: 'i4' }],
    });

    render(<OverviewCards userData={userData} />);

    // Activities: 3, Enrolled Courses: 1, Created Ideas: 4, Performance: 85% (hardcoded)
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  // -- 4. Cards link to correct routes --------------------------------
  it('renders cards with the correct href attributes', () => {
    render(<OverviewCards userData={buildUserData()} />);

    const links = screen.getAllByRole('link');

    // The component defines these routes in order:
    //   Activities      -> /dashboard
    //   Enrolled Courses -> /dashboard/student
    //   Created Ideas   -> /dashboard
    //   Performance     -> /analytics/student
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/dashboard/student');
    expect(hrefs).toContain('/analytics/student');
  });

  it('links each card to the expected route by title', () => {
    render(<OverviewCards userData={buildUserData()} />);

    // Find the link that contains the "Activities" title text
    const activitiesCard = screen.getByText('Activities').closest('a');
    expect(activitiesCard).toHaveAttribute('href', '/dashboard');

    const enrolledCard = screen.getByText('Enrolled Courses').closest('a');
    expect(enrolledCard).toHaveAttribute('href', '/dashboard/student');

    const ideasCard = screen.getByText('Created Ideas').closest('a');
    expect(ideasCard).toHaveAttribute('href', '/dashboard');

    const performanceCard = screen.getByText('Performance').closest('a');
    expect(performanceCard).toHaveAttribute('href', '/analytics/student');
  });

  // -- 5. Shows change/delta text when provided -----------------------
  it('shows hardcoded change text for each card', () => {
    render(<OverviewCards userData={buildUserData()} />);

    // These change strings are hardcoded in the component:
    expect(screen.getByText('+5% from last week')).toBeInTheDocument();
    expect(screen.getByText('2 new this month')).toBeInTheDocument();
    expect(screen.getByText('+3 new ideas')).toBeInTheDocument();
    expect(screen.getByText('+12% improvement')).toBeInTheDocument();
  });

  // -- 6. Handles missing/undefined userData gracefully ---------------
  it('handles undefined userData gracefully by showing 0 for all counts', () => {
    render(<OverviewCards userData={undefined} />);

    // All three dynamic cards should fallback to "0"
    // Performance is hardcoded to "85%", so we expect three "0" entries
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3);

    // Performance value still renders
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('handles null userData gracefully', () => {
    render(<OverviewCards userData={null} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3);
  });

  it('handles userData with missing array properties', () => {
    render(<OverviewCards userData={{}} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3);
  });

  it('handles userData where arrays are explicitly undefined', () => {
    render(
      <OverviewCards
        userData={{ activities: undefined, courses: undefined, ideas: undefined }}
      />,
    );

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3);
  });

  // -- Bonus: Icons render -------------------------------------------
  it('renders an icon svg element within each card', () => {
    render(<OverviewCards userData={buildUserData()} />);

    // Each card should contain an SVG icon element rendered by the lucide-react mock.
    // The mock renders all icons as <svg data-testid="icon-default" ...>.
    const icons = screen.getAllByRole('link').map(
      (link) => link.querySelector('svg'),
    );
    expect(icons).toHaveLength(4);
    icons.forEach((icon) => {
      expect(icon).toBeTruthy();
    });
  });

  // -- Bonus: Empty arrays show "0" ----------------------------------
  it('shows "0" when userData arrays are empty', () => {
    const userData = buildUserData({
      activities: [],
      courses: [],
      ideas: [],
    });

    render(<OverviewCards userData={userData} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3);
  });
});
