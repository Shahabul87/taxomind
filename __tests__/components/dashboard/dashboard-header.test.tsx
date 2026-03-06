import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

import DashboardHeader from '@/components/dashboard/dashboard-header';

describe('DashboardHeader', () => {
  it('renders welcome greeting with user name', () => {
    render(<DashboardHeader user={{ name: 'Alice', email: 'alice@example.com' }} />);

    expect(screen.getByText(/Welcome back, Alice/)).toBeInTheDocument();
  });

  it('falls back to "User" when name is null', () => {
    render(<DashboardHeader user={{ name: null, email: 'test@example.com' }} />);

    expect(screen.getByText(/Welcome back, User/)).toBeInTheDocument();
  });

  it('falls back to "User" when name is undefined', () => {
    render(<DashboardHeader user={{ email: 'test@example.com' }} />);

    expect(screen.getByText(/Welcome back, User/)).toBeInTheDocument();
  });

  it('shows contextual subheading', () => {
    render(<DashboardHeader user={{ name: 'Bob', email: 'bob@example.com' }} />);

    expect(
      screen.getByText("Here's what's happening with your account today")
    ).toBeInTheDocument();
  });

  it('shows Account Settings link', () => {
    render(<DashboardHeader user={{ name: 'Charlie', email: 'charlie@example.com' }} />);

    const link = screen.getByRole('link', { name: /Account Settings/ });
    expect(link).toBeInTheDocument();
  });

  it('Account Settings link points to /settings', () => {
    render(<DashboardHeader user={{ name: 'Dana', email: 'dana@example.com' }} />);

    const link = screen.getByRole('link', { name: /Account Settings/ });
    expect(link).toHaveAttribute('href', '/settings');
  });
});
