import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const TestDropdownMenu = ({ onItemClick }: { onItemClick?: (item: string) => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button data-testid="menu-trigger">Open Menu</button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => onItemClick?.('edit')}>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onItemClick?.('delete')}>
        Delete
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onItemClick?.('settings')}>
        Settings
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

describe('DropdownMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<TestDropdownMenu />);

    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
  });

  it('opens menu on trigger click', async () => {
    render(<TestDropdownMenu />);

    const trigger = screen.getByTestId('menu-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('renders menu items when open', async () => {
    render(<TestDropdownMenu />);

    await userEvent.click(screen.getByTestId('menu-trigger'));

    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('calls onItemClick when menu item is selected', async () => {
    const mockItemClick = jest.fn();
    render(<TestDropdownMenu onItemClick={mockItemClick} />);

    await userEvent.click(screen.getByTestId('menu-trigger'));

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Edit'));

    expect(mockItemClick).toHaveBeenCalledWith('edit');
  });

  it('menu items are not visible before trigger click', () => {
    render(<TestDropdownMenu />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
