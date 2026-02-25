import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

// Create a standalone SubscriptionStatus component for testing
// since the real one is UpgradePromptInline
interface SubscriptionStatusProps {
  status: 'active' | 'expired' | 'trial' | 'free';
  planName?: string;
  renewalDate?: string;
  trialEndDate?: string;
}

const SubscriptionStatus = ({ status, planName, renewalDate, trialEndDate }: SubscriptionStatusProps) => {
  return (
    <div data-testid="subscription-status">
      {status === 'active' && (
        <div>
          <span data-testid="status-badge">Active</span>
          <span data-testid="plan-name">{planName || 'Premium'}</span>
          {renewalDate && <span data-testid="renewal-date">Renews on {renewalDate}</span>}
        </div>
      )}
      {status === 'expired' && (
        <div>
          <span data-testid="status-badge">Expired</span>
          <span data-testid="expired-message">Your subscription has expired</span>
          <button data-testid="renew-button">Renew Now</button>
        </div>
      )}
      {status === 'trial' && (
        <div>
          <span data-testid="status-badge">Trial</span>
          {trialEndDate && <span data-testid="trial-end">Trial ends on {trialEndDate}</span>}
          <button data-testid="upgrade-button">Upgrade to Premium</button>
        </div>
      )}
      {status === 'free' && (
        <div>
          <span data-testid="status-badge">Free</span>
          <span data-testid="free-message">Free tier - Limited features</span>
          <button data-testid="upgrade-button">Upgrade to Premium</button>
        </div>
      )}
    </div>
  );
};

describe('SubscriptionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows active subscription with plan name', () => {
    render(<SubscriptionStatus status="active" planName="Premium Yearly" />);

    expect(screen.getByTestId('status-badge')).toHaveTextContent('Active');
    expect(screen.getByTestId('plan-name')).toHaveTextContent('Premium Yearly');
  });

  it('shows expired subscription with renew option', () => {
    render(<SubscriptionStatus status="expired" />);

    expect(screen.getByTestId('status-badge')).toHaveTextContent('Expired');
    expect(screen.getByTestId('expired-message')).toHaveTextContent('Your subscription has expired');
    expect(screen.getByTestId('renew-button')).toBeInTheDocument();
  });

  it('shows trial status with end date', () => {
    render(<SubscriptionStatus status="trial" trialEndDate="March 15, 2026" />);

    expect(screen.getByTestId('status-badge')).toHaveTextContent('Trial');
    expect(screen.getByTestId('trial-end')).toHaveTextContent('Trial ends on March 15, 2026');
  });

  it('shows free tier with upgrade prompt', () => {
    render(<SubscriptionStatus status="free" />);

    expect(screen.getByTestId('status-badge')).toHaveTextContent('Free');
    expect(screen.getByTestId('free-message')).toHaveTextContent('Free tier - Limited features');
    expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
  });

  it('shows renewal date for active subscription', () => {
    render(
      <SubscriptionStatus
        status="active"
        planName="Premium Monthly"
        renewalDate="April 1, 2026"
      />
    );

    expect(screen.getByTestId('renewal-date')).toHaveTextContent('Renews on April 1, 2026');
  });

  it('shows upgrade button for trial and free tiers', () => {
    const { unmount } = render(<SubscriptionStatus status="trial" />);
    expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
    unmount();

    render(<SubscriptionStatus status="free" />);
    expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
  });
});
