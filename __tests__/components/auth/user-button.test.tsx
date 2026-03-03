import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the hooks
jest.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: jest.fn(),
}));

// Mock performSignOut from logout-button
jest.mock('@/components/auth/logout-button', () => ({
  performSignOut: jest.fn(),
}));

// Mock Radix UI Avatar
jest.mock('@/components/ui/avatar', () => {
  const React = require('react');
  return {
    Avatar: jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'avatar', className: props.className }, props.children)
    ),
    AvatarImage: jest.fn((props) =>
      React.createElement('img', { 'data-testid': 'avatar-image', src: props.src, alt: 'avatar', className: props.className })
    ),
    AvatarFallback: jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'avatar-fallback', className: props.className }, props.children)
    ),
  };
});

// Mock Radix UI Dropdown
jest.mock('@/components/ui/dropdown-menu', () => {
  const React = require('react');
  return {
    DropdownMenu: jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'dropdown-menu' }, props.children)
    ),
    DropdownMenuTrigger: jest.fn((props) =>
      React.createElement('button', { 'data-testid': 'dropdown-trigger', className: props.className }, props.children)
    ),
    DropdownMenuContent: jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'dropdown-content', className: props.className }, props.children)
    ),
    DropdownMenuItem: jest.fn((props) =>
      React.createElement('div', {
        'data-testid': 'dropdown-item',
        className: props.className,
        onClick: () => {
          if (typeof props.onSelect === 'function') {
            props.onSelect({ preventDefault: jest.fn() });
          }
        },
      }, props.children)
    ),
  };
});

// Mock ExitIcon from radix
jest.mock('@radix-ui/react-icons', () => {
  const React = require('react');
  return {
    ExitIcon: jest.fn((props) =>
      React.createElement('span', { 'data-testid': 'exit-icon', className: props.className })
    ),
  };
});

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

  it('renders logout menu item with onSelect handler', () => {
    mockUseCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    });

    render(<UserButton />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByTestId('exit-icon')).toBeInTheDocument();
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
