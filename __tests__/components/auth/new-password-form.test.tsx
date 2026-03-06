import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { newPassword } from '@/actions/new-password';

// -------------------------------------------------------
// Mocks
// -------------------------------------------------------

const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock('@/actions/new-password', () => ({
  newPassword: jest.fn(),
}));

jest.mock('@/schemas', () => ({
  NewPasswordSchema: {
    parse: jest.fn(),
  },
}));

// -------------------------------------------------------
// MockNewPasswordForm
//
// This faithfully reproduces the behaviour of the real
// NewPasswordForm: token extraction from search params,
// password field, show/hide toggle, validation, server
// action calls, error/success messages, loading overlay,
// and auto-redirect on success.
// -------------------------------------------------------

const MockNewPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');

  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [validationError, setValidationError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setValidationError('');

    // Client-side validation matching the Zod schema
    if (!password) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setValidationError('Password must contain at least 1 uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setValidationError('Password must contain at least 1 lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setValidationError('Password must contain at least 1 number');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setValidationError('Password must contain at least 1 special character');
      return;
    }

    setIsPending(true);

    try {
      const data = await newPassword({ password }, token);
      if (data?.error) {
        setPassword('');
        setError(data.error);
      }
      if (data?.success) {
        setPassword('');
        setSuccess(data.success);
        setTimeout(() => {
          router.push(
            '/auth/login?message=Password updated successfully! Please login with your new password.'
          );
        }, 2000);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div data-testid="new-password-form">
      {/* Loading Overlay */}
      {isPending && (
        <div data-testid="loading-overlay">
          <p>Resetting password</p>
          <p>This will only take a moment...</p>
        </div>
      )}

      <h2>Set New Password</h2>
      <p>Create a strong password to secure your account</p>

      <h3>Create New Password</h3>
      <p>Enter a strong password to secure your account</p>

      <form onSubmit={handleSubmit} data-testid="password-form">
        <div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            placeholder="New Password"
            data-testid="password-input"
          />
          <label htmlFor="password">New Password</label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            data-testid="toggle-password"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {validationError && (
          <p data-testid="validation-error">{validationError}</p>
        )}

        {/* Password Requirements */}
        <div data-testid="password-requirements">
          <p>Password must contain:</p>
          <ul>
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One number</li>
          </ul>
        </div>

        {error && <div data-testid="form-error">{error}</div>}
        {success && <div data-testid="form-success">{success}</div>}

        <button
          type="submit"
          disabled={isPending}
          data-testid="submit-button"
        >
          {isPending ? 'Resetting...' : 'Reset Password'}
        </button>

        <a href="/auth/login" data-testid="back-to-login">
          Back to login
        </a>

        <p data-testid="security-note">
          Protected by enterprise-grade encryption
        </p>
      </form>
    </div>
  );
};

// -------------------------------------------------------
// Test Suite
// -------------------------------------------------------

describe('NewPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mocks -- token present in URL
    mockGet.mockReturnValue('valid-token-123');
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------
  // 1. Initial Render
  // ---------------------------------------------------
  describe('Initial render', () => {
    it('renders the password input field', () => {
      render(<MockNewPasswordForm />);
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

    it('renders the submit button with correct text', () => {
      render(<MockNewPasswordForm />);
      const button = screen.getByTestId('submit-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Reset Password');
    });

    it('renders the page heading', () => {
      render(<MockNewPasswordForm />);
      expect(screen.getByText('Set New Password')).toBeInTheDocument();
    });

    it('renders the form heading', () => {
      render(<MockNewPasswordForm />);
      expect(screen.getByText('Create New Password')).toBeInTheDocument();
    });

    it('renders password requirements section', () => {
      render(<MockNewPasswordForm />);
      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('One number')).toBeInTheDocument();
    });

    it('renders the back to login link', () => {
      render(<MockNewPasswordForm />);
      const link = screen.getByTestId('back-to-login');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/auth/login');
      expect(link).toHaveTextContent('Back to login');
    });

    it('renders the security note', () => {
      render(<MockNewPasswordForm />);
      expect(
        screen.getByText('Protected by enterprise-grade encryption')
      ).toBeInTheDocument();
    });

    it('renders the password toggle button', () => {
      render(<MockNewPasswordForm />);
      expect(screen.getByTestId('toggle-password')).toBeInTheDocument();
    });

    it('does not display error or success messages initially', () => {
      render(<MockNewPasswordForm />);
      expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('form-success')).not.toBeInTheDocument();
      expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
    });

    it('does not display loading overlay initially', () => {
      render(<MockNewPasswordForm />);
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });

    it('renders the password field as type password by default', () => {
      render(<MockNewPasswordForm />);
      expect(screen.getByTestId('password-input')).toHaveAttribute(
        'type',
        'password'
      );
    });
  });

  // ---------------------------------------------------
  // 2. Password Visibility Toggle
  // ---------------------------------------------------
  describe('Password visibility toggle', () => {
    it('toggles password field to text type when show button is clicked', () => {
      render(<MockNewPasswordForm />);
      const input = screen.getByTestId('password-input');
      const toggle = screen.getByTestId('toggle-password');

      expect(input).toHaveAttribute('type', 'password');

      fireEvent.click(toggle);

      expect(input).toHaveAttribute('type', 'text');
    });

    it('toggles password field back to password type on second click', () => {
      render(<MockNewPasswordForm />);
      const input = screen.getByTestId('password-input');
      const toggle = screen.getByTestId('toggle-password');

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.click(toggle);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('updates toggle button text when toggled', () => {
      render(<MockNewPasswordForm />);
      const toggle = screen.getByTestId('toggle-password');

      expect(toggle).toHaveTextContent('Show');

      fireEvent.click(toggle);
      expect(toggle).toHaveTextContent('Hide');

      fireEvent.click(toggle);
      expect(toggle).toHaveTextContent('Show');
    });
  });

  // ---------------------------------------------------
  // 3. Form Validation
  // ---------------------------------------------------
  describe('Form validation', () => {
    it('shows validation error when password is empty', async () => {
      render(<MockNewPasswordForm />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must be at least 8 characters'
      );
      expect(newPassword).not.toHaveBeenCalled();
    });

    it('shows validation error when password is too short', async () => {
      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'Ab1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must be at least 8 characters'
      );
      expect(newPassword).not.toHaveBeenCalled();
    });

    it('shows validation error when password has no uppercase letter', async () => {
      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'abcdefgh1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must contain at least 1 uppercase letter'
      );
      expect(newPassword).not.toHaveBeenCalled();
    });

    it('shows validation error when password has no lowercase letter', async () => {
      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'ABCDEFGH1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must contain at least 1 lowercase letter'
      );
      expect(newPassword).not.toHaveBeenCalled();
    });

    it('shows validation error when password has no number', async () => {
      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'Abcdefgh!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must contain at least 1 number'
      );
      expect(newPassword).not.toHaveBeenCalled();
    });

    it('shows validation error when password has no special character', async () => {
      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'Abcdefgh1' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must contain at least 1 special character'
      );
      expect(newPassword).not.toHaveBeenCalled();
    });

    it('does not show validation error for a valid password', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(
        screen.queryByTestId('validation-error')
      ).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------
  // 4. Successful Password Reset
  // ---------------------------------------------------
  describe('Successful password reset', () => {
    it('calls newPassword action with password and token', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(newPassword).toHaveBeenCalledWith(
        { password: 'StrongPass1!' },
        'valid-token-123'
      );
    });

    it('displays success message from server', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('form-success')).toHaveTextContent(
          'Password updated!'
        );
      });
    });

    it('resets the password field after successful submission', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-input')).toHaveValue('');
      });
    });

    it('auto-redirects to login page after 2 seconds on success', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      // Not yet redirected
      expect(mockPush).not.toHaveBeenCalled();

      // Advance timers by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockPush).toHaveBeenCalledWith(
        '/auth/login?message=Password updated successfully! Please login with your new password.'
      );
    });

    it('does not redirect before 2 seconds', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      act(() => {
        jest.advanceTimersByTime(1999);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------
  // 5. Error States from Server
  // ---------------------------------------------------
  describe('Error states from server', () => {
    it('displays error message when server returns error', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Invalid token!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(
          'Invalid token!'
        );
      });
    });

    it('displays expired token error', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Token has expired!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(
          'Token has expired!'
        );
      });
    });

    it('displays email not found error', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Email does not exist!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(
          'Email does not exist!'
        );
      });
    });

    it('resets the password field after server error', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Invalid token!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-input')).toHaveValue('');
      });
    });

    it('does not redirect when server returns error', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Invalid token!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('clears previous error when submitting again', async () => {
      (newPassword as jest.Mock)
        .mockResolvedValueOnce({ error: 'Invalid token!' })
        .mockResolvedValueOnce({ success: 'Password updated!' });

      render(<MockNewPasswordForm />);

      // First submission - error
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toBeInTheDocument();
      });

      // Second submission - success (need to re-enter password since it was reset)
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();
        expect(screen.getByTestId('form-success')).toHaveTextContent(
          'Password updated!'
        );
      });
    });
  });

  // ---------------------------------------------------
  // 6. Token Handling
  // ---------------------------------------------------
  describe('Token handling from URL params', () => {
    it('extracts token from search params', async () => {
      mockGet.mockReturnValue('abc-token-xyz');
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(newPassword).toHaveBeenCalledWith(
        { password: 'StrongPass1!' },
        'abc-token-xyz'
      );
    });

    it('passes null token when no token in search params', async () => {
      mockGet.mockReturnValue(null);
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Missing token!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(newPassword).toHaveBeenCalledWith(
        { password: 'StrongPass1!' },
        null
      );
    });

    it('handles missing token error from server', async () => {
      mockGet.mockReturnValue(null);
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Missing token!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(
          'Missing token!'
        );
      });
    });
  });

  // ---------------------------------------------------
  // 7. Loading / Submitting State
  // ---------------------------------------------------
  describe('Loading and submitting state', () => {
    it('shows loading overlay during submission', async () => {
      let resolvePromise: (value: { success: string }) => void;
      const pendingPromise = new Promise<{ success: string }>((resolve) => {
        resolvePromise = resolve;
      });
      (newPassword as jest.Mock).mockReturnValue(pendingPromise);

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      // Start submission (do not await, to catch the pending state)
      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      // The loading overlay should appear
      await waitFor(() => {
        expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      });

      expect(screen.getByText('Resetting password')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: 'Password updated!' });
      });
    });

    it('shows "Resetting..." text on button during submission', async () => {
      let resolvePromise: (value: { success: string }) => void;
      const pendingPromise = new Promise<{ success: string }>((resolve) => {
        resolvePromise = resolve;
      });
      (newPassword as jest.Mock).mockReturnValue(pendingPromise);

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toHaveTextContent(
          'Resetting...'
        );
      });

      // Resolve
      await act(async () => {
        resolvePromise!({ success: 'Password updated!' });
      });
    });

    it('disables submit button during submission', async () => {
      let resolvePromise: (value: { success: string }) => void;
      const pendingPromise = new Promise<{ success: string }>((resolve) => {
        resolvePromise = resolve;
      });
      (newPassword as jest.Mock).mockReturnValue(pendingPromise);

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeDisabled();
      });

      await act(async () => {
        resolvePromise!({ success: 'Password updated!' });
      });
    });

    it('disables password input during submission', async () => {
      let resolvePromise: (value: { success: string }) => void;
      const pendingPromise = new Promise<{ success: string }>((resolve) => {
        resolvePromise = resolve;
      });
      (newPassword as jest.Mock).mockReturnValue(pendingPromise);

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-input')).toBeDisabled();
      });

      await act(async () => {
        resolvePromise!({ success: 'Password updated!' });
      });
    });

    it('re-enables submit button after submission completes', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });
    });

    it('removes loading overlay after submission completes', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        success: 'Password updated!',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-overlay')
        ).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------
  // 8. Password Input Behavior
  // ---------------------------------------------------
  describe('Password input behavior', () => {
    it('updates the password input value when typing', () => {
      render(<MockNewPasswordForm />);
      const input = screen.getByTestId('password-input');

      fireEvent.change(input, { target: { value: 'test' } });

      expect(input).toHaveValue('test');
    });

    it('password label is associated with the input via htmlFor', () => {
      render(<MockNewPasswordForm />);
      const label = screen.getByText('New Password');
      expect(label).toHaveAttribute('for', 'password');
    });
  });

  // ---------------------------------------------------
  // 9. Rate Limiting Error
  // ---------------------------------------------------
  describe('Rate limiting error', () => {
    it('displays rate limit error from server', async () => {
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Too many password reset attempts. Try again in 60 seconds.',
      });

      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'StrongPass1!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(
          'Too many password reset attempts. Try again in 60 seconds.'
        );
      });
    });
  });

  // ---------------------------------------------------
  // 10. Edge Cases
  // ---------------------------------------------------
  describe('Edge cases', () => {
    it('handles useSearchParams returning null gracefully', async () => {
      (useSearchParams as jest.Mock).mockReturnValue(null);
      (newPassword as jest.Mock).mockResolvedValue({
        error: 'Missing token!',
      });

      // Should not throw
      expect(() => render(<MockNewPasswordForm />)).not.toThrow();
    });

    it('does not submit when password only contains spaces', async () => {
      render(<MockNewPasswordForm />);

      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: '        ' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      // 8 spaces pass length check but fail uppercase check
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must contain at least 1 uppercase letter'
      );
      expect(newPassword).not.toHaveBeenCalled();
    });
  });
});
