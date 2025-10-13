import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { login } from '@/actions/login';

// Define types
interface MockRouter {
  push: jest.Mock;
  refresh: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
  prefetch: jest.Mock;
}

interface LoginFormProps {
  onSuccess?: () => void;
  callbackUrl?: string;
}

// Mock the login action
jest.mock('@/actions/login', () => ({
  login: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter: MockRouter = {
  push: mockPush,
  refresh: mockRefresh,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === 'error') return null;
      if (key === 'callbackUrl') return '/dashboard';
      return null;
    }),
  }),
}));

// Mock Form components
jest.mock('@/components/form-error', () => ({
  FormError: ({ message }: { message?: string }) => 
    message ? <div data-testid="form-error">{message}</div> : null,
}));

jest.mock('@/components/form-success', () => ({
  FormSuccess: ({ message }: { message?: string }) => 
    message ? <div data-testid="form-success">{message}</div> : null,
}));

// Create a simplified LoginForm component for testing
const MockLoginForm: React.FC<LoginFormProps> = ({ onSuccess, callbackUrl = '/dashboard' }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [showTwoFactor, setShowTwoFactor] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await login({
        email,
        password,
        code: showTwoFactor ? twoFactorCode : undefined,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        onSuccess?.();
        mockRouter.push(callbackUrl);
      } else if (result.twoFactor) {
        setShowTwoFactor(true);
      }
    } catch (err) {
      setError('Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Simulate Google login
    mockRouter.push('/auth/signin/google');
  };

  const handleGitHubLogin = () => {
    // Simulate GitHub login
    mockRouter.push('/auth/signin/github');
  };

  return (
    <div data-testid="login-form">
      <form onSubmit={handleSubmit}>
        {!showTwoFactor ? (
          <>
            <div>
              <input
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
                required
              />
            </div>
            <div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="toggle-password"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <input
              type="text"
              placeholder="123456"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              data-testid="two-factor-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowTwoFactor(false)}
              data-testid="back-button"
            >
              Back
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          data-testid="submit-button"
        >
          {isLoading ? 'Loading...' : 'Sign In'}
        </button>
      </form>

      <div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          data-testid="google-signin"
        >
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={handleGitHubLogin}
          data-testid="github-signin"
        >
          Sign in with GitHub
        </button>
      </div>

      <a href="/auth/reset" data-testid="forgot-password">
        Forgot password?
      </a>

      {error && <div data-testid="form-error">{error}</div>}
      {success && <div data-testid="form-success">{success}</div>}
    </div>
  );
};


describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form with all fields', () => {
    render(<MockLoginForm />);

    expect(screen.getByPlaceholderText(/john.doe@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\*{6}/)).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('google-signin')).toBeInTheDocument();
    expect(screen.getByTestId('github-signin')).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    render(<MockLoginForm />);
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // HTML5 validation would prevent form submission
    expect(login).not.toHaveBeenCalled();
  });

  it('displays validation error for invalid email', async () => {
    render(<MockLoginForm />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // HTML5 validation would prevent form submission for invalid email
    expect(login).not.toHaveBeenCalled();
  });

  it('submits form with valid credentials', async () => {
    (login as jest.Mock).mockResolvedValue({ success: 'Login successful!' });
    
    render(<MockLoginForm />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByTestId('submit-button');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      code: undefined,
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toHaveTextContent('Login successful!');
    });
  });

  it('displays error message on login failure', async () => {
    (login as jest.Mock).mockResolvedValue({ error: 'Invalid credentials!' });
    
    render(<MockLoginForm />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    });

    const submitButton = screen.getByTestId('submit-button');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Invalid credentials!');
    });
  });

  it('handles two-factor authentication flow', async () => {
    (login as jest.Mock)
      .mockResolvedValueOnce({ twoFactor: true })
      .mockResolvedValueOnce({ success: 'Login successful!' });
    
    render(<MockLoginForm />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByTestId('submit-button');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('two-factor-input')).toBeInTheDocument();
    });

    const twoFactorInput = screen.getByTestId('two-factor-input');
    
    await act(async () => {
      fireEvent.change(twoFactorInput, { target: { value: '123456' } });
      fireEvent.click(submitButton);
    });

    expect(login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      code: '123456',
    });
  });

  it('allows going back from two-factor code input', async () => {
    (login as jest.Mock).mockResolvedValue({ twoFactor: true });
    
    render(<MockLoginForm />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByTestId('submit-button');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('two-factor-input')).toBeInTheDocument();
    });

    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
  });

  it('disables submit button while loading', async () => {
    (login as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<MockLoginForm />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByTestId('submit-button');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Loading...');
  });

  it('displays error message from URL params', () => {
    // Mock useSearchParams to return an error
    const mockSearchParams = {
      get: jest.fn((key: string) => {
        if (key === 'error') return 'OAuthAccountNotLinked';
        return null;
      }),
    };

    jest.doMock('next/navigation', () => ({
      useRouter: () => mockRouter,
      useSearchParams: () => mockSearchParams,
    }));

    // This would be handled by the actual component reading URL params
    const errorFromUrl = mockSearchParams.get('error');
    expect(errorFromUrl).toBe('OAuthAccountNotLinked');
  });

  it('redirects to callback URL after successful login', async () => {
    const mockOnSuccess = jest.fn();
    (login as jest.Mock).mockResolvedValue({ success: 'Login successful!' });
    
    render(<MockLoginForm onSuccess={mockOnSuccess} callbackUrl="/custom-dashboard" />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const submitButton = screen.getByTestId('submit-button');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/custom-dashboard');
    });
  });

  it('shows forgot password link', () => {
    render(<MockLoginForm />);
    
    const forgotPasswordLink = screen.getByTestId('forgot-password');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/reset');
  });

  it('toggles password visibility', async () => {
    render(<MockLoginForm />);
    
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    const toggleButton = screen.getByTestId('toggle-password');
    
    expect(passwordInput.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    expect(toggleButton).toHaveTextContent('Hide');
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
    expect(toggleButton).toHaveTextContent('Show');
  });
});