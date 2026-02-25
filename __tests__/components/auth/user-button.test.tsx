import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the hooks
jest.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: jest.fn(),
}));

// Mock the LogoutButton
jest.mock('@/components/auth/logout-button', () => ({
  LogoutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="logout-button-wrapper">{children}</div>
  ),
}));

// Mock Radix UI Avatar
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarImage: ({ src, className }: { src: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img data-testid="avatar-image" src={src} alt="avatar" className={className} />
  ),
  AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar-fallback" className={className}>{children}</div>
  ),
}));

// Mock Radix UI Dropdown
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button data-testid="dropdown-trigger" className={className}>{children}</button>
  ),
  DropdownMenuContent: ({ children, className, align }: { children: React.ReactNode; className?: string; align?: string }) => (
    <div data-testid="dropdown-content" className={className}>{children}</div>
  ),
  DropdownMenuItem: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dropdown-item" className={className}>{children}</div>
  ),
}));

// Mock ExitIcon from radix
jest.mock('@radix-ui/react-icons', () => ({
  ExitIcon: ({ className }: { className?: string }) => (
    <span data-testid="exit-icon" className={className} />
  ),
}));

import { useCurrentUser } from '@/hooks/use-current-user';
import { UserButton } from '@/components/auth/user-button';

const mockUseCurrentUser = useCurrentUser as jest.Mock;

describe('UserButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user avatar with image', () => {
    mockUseCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
    });

    render(<UserButton />);

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    const avatarImage = screen.getByTestId('avatar-image');
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders dropdown content with user info', () => {
    mockUseCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    });

    render(<UserButton />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows user name in dropdown', () => {
    mockUseCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      image: null,
    });

    render(<UserButton />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders menu items including Settings and Admin', () => {
    mockUseCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    });

    render(<UserButton />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Server')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    mockUseCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    });

    render(<UserButton />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByTestId('logout-button-wrapper')).toBeInTheDocument();
  });

  it('handles null user image gracefully', () => {
    mockUseCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    });

    render(<UserButton />);

    const avatarImage = screen.getByTestId('avatar-image');
    expect(avatarImage).toHaveAttribute('src', '');
    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
  });
});
