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

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div>{children}</div>,
    button: ({ children, onClick, className, ...props }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
      <button onClick={onClick} className={className}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock Radix Dialog
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  ),
  DialogDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="dialog-description" className={className}>{children}</p>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import { UpgradePromptModal, UpgradePromptInline, LockedFeatureOverlay } from '@/components/subscription/upgrade-prompt';

describe('UpgradePromptModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plan names when open', () => {
    render(<UpgradePromptModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
    expect(screen.getByText('Lifetime')).toBeInTheDocument();
  });

  it('renders plan prices', () => {
    render(<UpgradePromptModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();
    expect(screen.getByText('$199')).toBeInTheDocument();
  });

  it('shows premium features list', () => {
    render(<UpgradePromptModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('AI Course Creation')).toBeInTheDocument();
    expect(screen.getByText('Content Generation')).toBeInTheDocument();
    expect(screen.getByText('Unlimited AI Usage')).toBeInTheDocument();
  });

  it('highlights recommended plan with POPULAR badge', () => {
    render(<UpgradePromptModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('POPULAR')).toBeInTheDocument();
  });

  it('navigates to subscription page on View All Plans click', () => {
    render(<UpgradePromptModal isOpen={true} onClose={jest.fn()} />);

    const viewAllButton = screen.getByText('View All Plans');
    fireEvent.click(viewAllButton);

    expect(mockPush).toHaveBeenCalledWith('/settings/subscription');
  });

  it('does not render when not open', () => {
    render(<UpgradePromptModal isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByText('Monthly')).not.toBeInTheDocument();
  });

  it('shows custom title when provided', () => {
    render(
      <UpgradePromptModal
        isOpen={true}
        onClose={jest.fn()}
        title="Unlock Advanced Features"
      />
    );

    expect(screen.getByText('Unlock Advanced Features')).toBeInTheDocument();
  });

  it('shows trust indicators', () => {
    render(<UpgradePromptModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('Cancel anytime')).toBeInTheDocument();
    expect(screen.getByText('Secure payment')).toBeInTheDocument();
    expect(screen.getByText('Instant access')).toBeInTheDocument();
  });
});

describe('UpgradePromptInline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with feature name', () => {
    render(<UpgradePromptInline feature="AI Course Creation" />);

    expect(screen.getByText('AI Course Creation requires Premium')).toBeInTheDocument();
  });

  it('navigates to subscription when upgrade clicked without callback', () => {
    render(<UpgradePromptInline />);

    const upgradeButton = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeButton);

    expect(mockPush).toHaveBeenCalledWith('/settings/subscription');
  });

  it('calls onUpgrade callback when provided', () => {
    const mockUpgrade = jest.fn();
    render(<UpgradePromptInline onUpgrade={mockUpgrade} />);

    const upgradeButton = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeButton);

    expect(mockUpgrade).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('LockedFeatureOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children normally when not locked', () => {
    render(
      <LockedFeatureOverlay isLocked={false}>
        <div data-testid="child">Content</div>
      </LockedFeatureOverlay>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByText('Premium Required')).not.toBeInTheDocument();
  });

  it('shows overlay when locked', () => {
    render(
      <LockedFeatureOverlay isLocked={true}>
        <div data-testid="child">Content</div>
      </LockedFeatureOverlay>
    );

    expect(screen.getByText('Premium Required')).toBeInTheDocument();
  });

  it('navigates to subscription on overlay click', () => {
    render(
      <LockedFeatureOverlay isLocked={true}>
        <div>Content</div>
      </LockedFeatureOverlay>
    );

    const overlay = screen.getByText('Premium Required').closest('[class*="absolute"]');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(mockPush).toHaveBeenCalledWith('/settings/subscription');
  });
});
