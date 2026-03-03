import { handleSessionError, refreshSession } from '@/lib/auth-error-handler';

// Mock performSignOut (used by refreshSession instead of direct signOut)
const mockPerformSignOut = jest.fn();
jest.mock('@/components/auth/logout-button', () => ({
  performSignOut: (...args: unknown[]) => mockPerformSignOut(...args),
}));

// Mock logger
const mockLoggerError = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args) => mockLoggerError(...args),
  },
}));

describe('auth-error-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // handleSessionError
  // -------------------------------------------------------
  describe('handleSessionError', () => {
    it('should return true for an error with "Failed to fetch" message', () => {
      const error = new Error('Failed to fetch');

      const result = handleSessionError(error);

      expect(result).toBe(true);
    });

    it('should return false for errors with unrelated messages', () => {
      const error = new Error('Something else went wrong');

      const result = handleSessionError(error);

      expect(result).toBe(false);
    });

    it('should log the error via logger.error when the message includes "Failed to fetch"', () => {
      const error = new Error('Failed to fetch');

      handleSessionError(error);

      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith('Session fetch error:', error);
    });

    it('should not log anything when the error is unrelated to fetch failures', () => {
      const error = new Error('Timeout');

      handleSessionError(error);

      expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it('should return false when error is null', () => {
      const result = handleSessionError(null);

      expect(result).toBe(false);
    });

    it('should return false when error is undefined', () => {
      const result = handleSessionError(undefined);

      expect(result).toBe(false);
    });

    it('should return false when error has an empty message', () => {
      const error = new Error('');

      const result = handleSessionError(error);

      expect(result).toBe(false);
    });

    it('should return true when the message contains "Failed to fetch" among other text', () => {
      const error = new Error('Request Failed to fetch data from server');

      const result = handleSessionError(error);

      expect(result).toBe(true);
    });

    it('should return false when the error object has no message property', () => {
      const error = { code: 'NETWORK_ERROR' };

      const result = handleSessionError(error);

      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------
  // refreshSession
  // -------------------------------------------------------
  describe('refreshSession', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // Replace window.location with a writable mock so we can track assignments
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, href: 'http://localhost:3000' },
      });
    });

    afterEach(() => {
      // Restore original window.location
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });

    it('should call performSignOut with the correct callbackUrl', async () => {
      mockPerformSignOut.mockResolvedValueOnce(undefined);

      await refreshSession();

      expect(mockPerformSignOut).toHaveBeenCalledTimes(1);
      expect(mockPerformSignOut).toHaveBeenCalledWith('/auth/login');
    });

    it('should not modify window.location.href when signOut succeeds', async () => {
      mockPerformSignOut.mockResolvedValueOnce(undefined);

      await refreshSession();

      expect(window.location.href).not.toBe('/auth/login');
    });

    it('should redirect via window.location.href when signOut throws', async () => {
      mockPerformSignOut.mockRejectedValueOnce(new Error('signOut failed'));

      await refreshSession();

      expect(window.location.href).toBe('/auth/login');
    });

    it('should log the error via logger.error when signOut throws', async () => {
      const signOutError = new Error('signOut exploded');
      mockPerformSignOut.mockRejectedValueOnce(signOutError);

      await refreshSession();

      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Error refreshing session:',
        signOutError,
      );
    });

    it('should pass callbackUrl pointing to /auth/login', async () => {
      mockPerformSignOut.mockResolvedValueOnce(undefined);

      await refreshSession();

      expect(mockPerformSignOut.mock.calls[0][0]).toBe('/auth/login');
    });
  });
});
