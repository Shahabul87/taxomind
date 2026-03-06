import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} src={props.src as string} alt={props.alt as string} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  },
}));

import UserProfileSummary from '@/components/dashboard/user-profile-summary';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

interface TestUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface TestUserData {
  createdAt?: string | null;
  subscriptions?: Array<{ id: string }>;
}

const buildUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  image: 'https://example.com/avatar.jpg',
  ...overrides,
});

const buildUserData = (overrides: Partial<TestUserData> = {}): TestUserData => ({
  createdAt: '2025-01-15T10:00:00Z',
  subscriptions: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserProfileSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- 1. Shows user name and email ---------------------------------------
  it('displays the user name', () => {
    render(
      <UserProfileSummary user={buildUser({ name: 'Alice Smith' })} userData={buildUserData()} />,
    );

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('displays the user email', () => {
    render(
      <UserProfileSummary
        user={buildUser({ email: 'alice@taxomind.com' })}
        userData={buildUserData()}
      />,
    );

    expect(screen.getByText('alice@taxomind.com')).toBeInTheDocument();
  });

  // -- 2. Shows avatar image when provided --------------------------------
  it('renders the avatar image when user has an image URL', () => {
    render(
      <UserProfileSummary
        user={buildUser({ name: 'Bob', image: 'https://cdn.example.com/bob.png' })}
        userData={buildUserData()}
      />,
    );

    const avatar = screen.getByAltText('Bob');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://cdn.example.com/bob.png');
  });

  // -- 3. Shows initials when no image ------------------------------------
  it('shows the first letter of the name when no image is provided', () => {
    render(
      <UserProfileSummary
        user={buildUser({ name: 'Charlie', image: null })}
        userData={buildUserData()}
      />,
    );

    // Should show "C" as the initial
    expect(screen.getByText('C')).toBeInTheDocument();
    // No avatar image should be rendered
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows "U" as fallback when both name and image are null', () => {
    render(
      <UserProfileSummary
        user={buildUser({ name: null, image: null })}
        userData={buildUserData()}
      />,
    );

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('shows "U" as fallback when name is undefined and image is null', () => {
    render(
      <UserProfileSummary
        user={buildUser({ name: undefined, image: null })}
        userData={buildUserData()}
      />,
    );

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  // -- 4. Shows member since date -----------------------------------------
  it('displays the "Member Since" label', () => {
    render(
      <UserProfileSummary user={buildUser()} userData={buildUserData()} />,
    );

    expect(screen.getByText('Member Since')).toBeInTheDocument();
  });

  it('formats and displays the member since date from createdAt', () => {
    render(
      <UserProfileSummary
        user={buildUser()}
        userData={buildUserData({ createdAt: '2025-06-20T00:00:00Z' })}
      />,
    );

    // toLocaleDateString output varies by environment but will contain the date
    const dateString = new Date('2025-06-20T00:00:00Z').toLocaleDateString();
    expect(screen.getByText(dateString)).toBeInTheDocument();
  });

  it('shows "N/A" when createdAt is not provided', () => {
    render(
      <UserProfileSummary
        user={buildUser()}
        userData={buildUserData({ createdAt: null })}
      />,
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('shows "N/A" when userData is null', () => {
    render(
      <UserProfileSummary user={buildUser()} userData={null} />,
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  // -- 5. Shows subscription status ---------------------------------------
  it('displays the "Subscription" label', () => {
    render(
      <UserProfileSummary user={buildUser()} userData={buildUserData()} />,
    );

    expect(screen.getByText('Subscription')).toBeInTheDocument();
  });

  it('shows "Free Plan" when user has no subscriptions', () => {
    render(
      <UserProfileSummary
        user={buildUser()}
        userData={buildUserData({ subscriptions: [] })}
      />,
    );

    expect(screen.getByText('Free Plan')).toBeInTheDocument();
  });

  it('shows "Free Plan" when subscriptions array is missing', () => {
    render(
      <UserProfileSummary
        user={buildUser()}
        userData={buildUserData({ subscriptions: undefined })}
      />,
    );

    expect(screen.getByText('Free Plan')).toBeInTheDocument();
  });

  // -- 6. Shows premium badge for active subscription ---------------------
  it('shows "Premium" when user has active subscriptions', () => {
    render(
      <UserProfileSummary
        user={buildUser()}
        userData={buildUserData({ subscriptions: [{ id: 'sub-1' }] })}
      />,
    );

    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.queryByText('Free Plan')).not.toBeInTheDocument();
  });

  it('renders the BadgeCheck icon alongside "Premium"', () => {
    const { container } = render(
      <UserProfileSummary
        user={buildUser()}
        userData={buildUserData({ subscriptions: [{ id: 'sub-1' }] })}
      />,
    );

    // The BadgeCheck icon from lucide-react renders as an SVG
    // It sits alongside the "Premium" text
    const premiumText = screen.getByText('Premium');
    const parentSpan = premiumText.closest('span');
    expect(parentSpan).toBeInTheDocument();

    const badgeIcon = parentSpan?.querySelector('svg');
    expect(badgeIcon).toBeInTheDocument();
  });

  // -- 7. Shows "View Full Profile" link ----------------------------------
  it('renders the "View Full Profile" link pointing to /settings', () => {
    render(
      <UserProfileSummary user={buildUser()} userData={buildUserData()} />,
    );

    const profileLink = screen.getByText('View Full Profile');
    expect(profileLink).toBeInTheDocument();

    const anchor = profileLink.closest('a');
    expect(anchor).toHaveAttribute('href', '/settings');
  });
});
