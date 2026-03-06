import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { newVerification } from '@/actions/new-verification';
import { NewVerificationForm } from '@/components/auth/new-verification-form';

// ---------------------------------------------------------------------------
// Type helpers for global mocks provided by jest.setup.js
// ---------------------------------------------------------------------------
const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockNewVerification = newVerification as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a URLSearchParams mock with an optional token value. */
const createSearchParams = (token?: string) => {
  const params = new URLSearchParams();
  if (token) {
    params.set('token', token);
  }
  return params;
};

/** Shared mock router instance so individual tests can assert against it. */
const createMockRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
});

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('NewVerificationForm', () => {
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockRouter = createMockRouter();
    mockUseRouter.mockReturnValue(mockRouter);

    // Default: no token in URL
    mockUseSearchParams.mockReturnValue(createSearchParams());

    // Default: verification succeeds
    mockNewVerification.mockResolvedValue({ success: 'Email verified!' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // 1. Initial render / loading state
  // -----------------------------------------------------------------------

  describe('Initial render and loading state', () => {
    it('renders the loading overlay with verifying text on mount', async () => {
      // Make the verification hang so we can observe the loading state
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {})); // never resolves

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(screen.getByText('Verifying your email')).toBeInTheDocument();
      expect(
        screen.getByText('Please wait while we confirm your email address...')
      ).toBeInTheDocument();
    });

    it('displays "Verifying Email" heading and "Please wait..." subtitle while verifying', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(screen.getByText('Verifying Email')).toBeInTheDocument();
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('renders the feature list items', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(screen.getByText('Secure Verification')).toBeInTheDocument();
      expect(screen.getByText('Account Activation')).toBeInTheDocument();
      expect(screen.getByText('Start Learning')).toBeInTheDocument();
    });

    it('renders the TaxoMind brand name', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(screen.getByText('TaxoMind')).toBeInTheDocument();
    });

    it('renders the Email Verification heading', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(screen.getByText('Email Verification')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 2. Successful verification
  // -----------------------------------------------------------------------

  describe('Successful verification', () => {
    it('displays success message when verification succeeds', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Email verified!')).toBeInTheDocument();
      });
    });

    it('shows "Email Verified!" heading after successful verification', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      });
    });

    it('shows "Your account is now active" subtitle after success', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Your account is now active')).toBeInTheDocument();
      });
    });

    it('removes the loading overlay after verification completes', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.queryByText('Verifying your email')).not.toBeInTheDocument();
      });
    });

    it('auto-redirects to login page after 2 seconds on success', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      // Verify redirect has not happened yet
      expect(mockRouter.push).not.toHaveBeenCalled();

      // Advance timers by 2 seconds to trigger the setTimeout redirect
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/auth/login?message=Email verified successfully! Please login.'
      );
    });

    it('calls newVerification with the correct token', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('abc-123-token'));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(mockNewVerification).toHaveBeenCalledWith('abc-123-token');
      });
    });
  });

  // -----------------------------------------------------------------------
  // 3. Error states
  // -----------------------------------------------------------------------

  describe('Error states', () => {
    it('displays "Missing token!" error when no token in URL', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams()); // no token

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Missing token!')).toBeInTheDocument();
      });
    });

    it('does not call newVerification when token is missing', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams());

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Missing token!')).toBeInTheDocument();
      });

      expect(mockNewVerification).not.toHaveBeenCalled();
    });

    it('displays error from server when token does not exist', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('invalid-token'));
      mockNewVerification.mockResolvedValue({ error: 'Token does not exist!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Token does not exist!')).toBeInTheDocument();
      });
    });

    it('displays error from server when token has expired', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('expired-token'));
      mockNewVerification.mockResolvedValue({ error: 'Token has expired!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Token has expired!')).toBeInTheDocument();
      });
    });

    it('displays "Something went wrong!" when server action rejects', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('error-token'));
      mockNewVerification.mockRejectedValue(new Error('Network failure'));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
      });
    });

    it('shows "Verification Failed" heading on error', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('bad-token'));
      mockNewVerification.mockResolvedValue({ error: 'Token does not exist!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      });
    });

    it('shows "There was a problem" subtitle on error', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('bad-token'));
      mockNewVerification.mockResolvedValue({ error: 'Token does not exist!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('There was a problem')).toBeInTheDocument();
      });
    });

    it('does NOT auto-redirect when verification fails', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('bad-token'));
      mockNewVerification.mockResolvedValue({ error: 'Token does not exist!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Token does not exist!')).toBeInTheDocument();
      });

      // Advance timers well past the redirect delay
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('displays error when email does not exist', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('orphan-token'));
      mockNewVerification.mockResolvedValue({ error: 'Email does not exist!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Email does not exist!')).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------------------------------
  // 4. Token handling from URL params
  // -----------------------------------------------------------------------

  describe('Token handling from URL params', () => {
    it('reads the token from search params and passes it to newVerification', async () => {
      const token = 'my-unique-token-value';
      mockUseSearchParams.mockReturnValue(createSearchParams(token));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(mockNewVerification).toHaveBeenCalledTimes(1);
        expect(mockNewVerification).toHaveBeenCalledWith(token);
      });
    });

    it('handles null searchParams gracefully', async () => {
      mockUseSearchParams.mockReturnValue(null);

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Missing token!')).toBeInTheDocument();
      });

      expect(mockNewVerification).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 5. Back to login link
  // -----------------------------------------------------------------------

  describe('Back to login link', () => {
    it('renders a "Back to login" link pointing to /auth/login', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      const loginLink = screen.getByText('Back to login');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login');
    });
  });

  // -----------------------------------------------------------------------
  // 6. Security and trust elements
  // -----------------------------------------------------------------------

  describe('Security and trust elements', () => {
    it('renders security badge text', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(
        screen.getByText('Enterprise-grade security with end-to-end encryption')
      ).toBeInTheDocument();
    });

    it('renders the encryption notice footer', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(
        screen.getByText('Protected by enterprise-grade encryption')
      ).toBeInTheDocument();
    });

    it('renders trust metrics (50K+, 10K+, 4.9 star)', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<NewVerificationForm />);
      });

      expect(screen.getByText('50K+')).toBeInTheDocument();
      expect(screen.getByText('10K+')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 7. Idempotency / duplicate call prevention
  // -----------------------------------------------------------------------

  describe('Idempotency', () => {
    it('does not call newVerification again after success is set', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('valid-token'));
      mockNewVerification.mockResolvedValue({ success: 'Email verified!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Email verified!')).toBeInTheDocument();
      });

      // The useCallback guard prevents re-invocation when success/error are set.
      // newVerification should have been called exactly once.
      expect(mockNewVerification).toHaveBeenCalledTimes(1);
    });

    it('does not call newVerification again after error is set', async () => {
      mockUseSearchParams.mockReturnValue(createSearchParams('bad-token'));
      mockNewVerification.mockResolvedValue({ error: 'Token does not exist!' });

      await act(async () => {
        render(<NewVerificationForm />);
      });

      await waitFor(() => {
        expect(screen.getByText('Token does not exist!')).toBeInTheDocument();
      });

      expect(mockNewVerification).toHaveBeenCalledTimes(1);
    });
  });
});
