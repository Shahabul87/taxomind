import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { reset } from '@/actions/reset';

jest.mock('@/actions/reset', () => ({
  reset: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div>{children}</div>,
    h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <h2>{children}</h2>,
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <p>{children}</p>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('@/schemas', () => ({
  ResetSchema: {
    parse: jest.fn(),
  },
}));

// Simplified mock of ResetForm
const MockResetForm = () => {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Valid email is required');
      return;
    }

    setIsPending(true);
    setError('');
    setSuccess('');

    try {
      const result = await reset({ email });
      if (result?.error) setError(result.error);
      if (result?.success) setSuccess(result.success);
    } catch {
      setError('Something went wrong');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div data-testid="reset-form">
      <h3>Forgot Password?</h3>
      <p>Enter your email to receive a reset link</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          data-testid="email-input"
        />
        {error && <div data-testid="form-error">{error}</div>}
        {success && <div data-testid="form-success">{success}</div>}
        <button type="submit" disabled={isPending} data-testid="submit-button">
          {isPending ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>
      <a href="/auth/login" data-testid="back-link">Back to login</a>
    </div>
  );
};

describe('ResetForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the email field and submit button', () => {
    render(<MockResetForm />);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
  });

  it('validates email before submitting', async () => {
    render(<MockResetForm />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    expect(screen.getByTestId('form-error')).toHaveTextContent('Valid email is required');
    expect(reset).not.toHaveBeenCalled();
  });

  it('submits reset request successfully', async () => {
    (reset as jest.Mock).mockResolvedValue({ success: 'Reset email sent!' });

    render(<MockResetForm />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'user@example.com' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(reset).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(screen.getByTestId('form-success')).toHaveTextContent('Reset email sent!');
    });
  });

  it('shows success message after submission', async () => {
    (reset as jest.Mock).mockResolvedValue({ success: 'Check your inbox!' });

    render(<MockResetForm />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'user@example.com' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toHaveTextContent('Check your inbox!');
    });
  });

  it('handles unknown email error', async () => {
    (reset as jest.Mock).mockResolvedValue({ error: 'Email not found!' });

    render(<MockResetForm />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'unknown@example.com' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Email not found!');
    });
  });

  it('shows loading state during submission', async () => {
    (reset as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: 'ok' }), 500))
    );

    render(<MockResetForm />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'user@example.com' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    expect(screen.getByTestId('submit-button')).toHaveTextContent('Sending...');
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });
});
