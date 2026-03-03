import { performSignOut } from '@/components/auth/logout-button';
import { logger } from '@/lib/logger';

export const handleSessionError = (error: unknown) => {
  if (error instanceof Error && error.message.includes('Failed to fetch')) {
    logger.error('Session fetch error:', error);
    return true;
  }
  return false;
};

export const refreshSession = async () => {
  try {
    await performSignOut('/auth/login');
  } catch (error) {
    logger.error('Error refreshing session:', error);
    window.location.href = '/auth/login';
  }
};