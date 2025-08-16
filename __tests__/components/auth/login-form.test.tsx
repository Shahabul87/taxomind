import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';
import { LoginForm } from '@/components/auth/login-form';
import { login } from '@/actions/login';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

// Mock actions
jest.mock('@/actions/login', () => ({
  login: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock components
jest.mock('@/components/form-error', () => ({
  FormError: ({ message }: { message?: string }) => 
    message ? <div data-testid="form-error">{message}</div> : null,
}));

jest.mock('@/components/form-success', () => ({
  FormSuccess: ({ message }: { message?: string }) => 
    message ? <div data-testid="form-success">{message}</div> : null,
}));

describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders login form with all fields', () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText(/john.doe@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\*{6}/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/john.doe@example.com/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    (login as jest.Mock).mockResolvedValue({ success: 'Logged in!' });

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/john.doe@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/\*{6}/);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(screen.getByTestId('form-success')).toHaveTextContent('Logged in!');
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    (login as jest.Mock).mockResolvedValue({ error: 'Invalid credentials!' });

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/john.doe@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/\*{6}/);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Invalid credentials!');
    });
  });

  it('handles two-factor authentication flow', async () => {
    const user = userEvent.setup();
    (login as jest.Mock).mockResolvedValue({ twoFactor: true });

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/john.doe@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/\*{6}/);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument();
      expect(screen.getByText(/two-factor code/i)).toBeInTheDocument();
    });

    // Enter 2FA code
    const codeInput = screen.getByPlaceholderText(/123456/i);
    await user.type(codeInput, '123456');
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        code: '123456',
      });
    });
  });

  it('allows going back from two-factor code input', async () => {
    const user = userEvent.setup();
    (login as jest.Mock).mockResolvedValue({ twoFactor: true });

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/john.doe@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/\*{6}/);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument();
    });

    // Click back link
    const backLink = screen.getByRole('link', { name: /back to login/i });
    fireEvent.click(backLink);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/john.doe@example.com/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/123456/i)).not.toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();
    (login as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: 'Logged in!' }), 1000))
    );

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/john.doe@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/\*{6}/);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  it('displays error message from URL params', () => {
    const searchParams = new URLSearchParams({ error: 'OAuthAccountNotLinked' });
    (useSearchParams as jest.Mock).mockReturnValue(searchParams);

    render(<LoginForm />);

    expect(screen.getByTestId('form-error')).toHaveTextContent(
      'Email already in use with different provider!'
    );
  });

  it('redirects to callback URL after successful login', async () => {
    const user = userEvent.setup();
    const searchParams = new URLSearchParams({ callbackUrl: '/dashboard' });
    (useSearchParams as jest.Mock).mockReturnValue(searchParams);
    (login as jest.Mock).mockResolvedValue({ success: 'Logged in!' });

    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/john.doe@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/\*{6}/);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows forgot password link', () => {
    render(<LoginForm />);

    const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/reset');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText(/\*{6}/) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await user.click(toggleButton);

    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});