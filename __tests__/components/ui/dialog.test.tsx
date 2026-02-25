import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

// Import Radix dialog directly since it is a wrapper
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

// Helper to render a complete dialog for testing
const TestDialog = ({
  defaultOpen = false,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => (
  <Dialog defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <button data-testid="trigger">Open Dialog</button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Test Dialog Title</DialogTitle>
        <DialogDescription>Test dialog description text</DialogDescription>
      </DialogHeader>
      <div>Dialog body content</div>
    </DialogContent>
  </Dialog>
);

describe('Dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<TestDialog />);

    expect(screen.getByTestId('trigger')).toBeInTheDocument();
    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('opens when trigger is clicked', async () => {
    render(<TestDialog />);

    const trigger = screen.getByTestId('trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test Dialog Title')).toBeInTheDocument();
    });
  });

  it('renders content when open', () => {
    render(<TestDialog defaultOpen={true} />);

    expect(screen.getByText('Test Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Test dialog description text')).toBeInTheDocument();
    expect(screen.getByText('Dialog body content')).toBeInTheDocument();
  });

  it('renders close button in content', () => {
    render(<TestDialog defaultOpen={true} />);

    // The DialogContent includes a built-in close button with sr-only "Close" text
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('closes on Escape key', async () => {
    const mockOnOpenChange = jest.fn();
    render(<TestDialog defaultOpen={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByText('Test Dialog Title')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('renders title and description', () => {
    render(<TestDialog defaultOpen={true} />);

    const title = screen.getByText('Test Dialog Title');
    expect(title).toBeInTheDocument();

    const description = screen.getByText('Test dialog description text');
    expect(description).toBeInTheDocument();
  });
});

describe('DialogHeader', () => {
  it('renders children correctly', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Header Title')).toBeInTheDocument();
  });
});
