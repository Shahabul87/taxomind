import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';

interface RateLimitInfo {
  limited: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitState {
  isLimited: boolean;
  message: string | null;
  remainingTime: number | null;
  reset: number | null;
}

export function useRateLimitError() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    message: null,
    remainingTime: null,
    reset: null,
  });
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const handleRateLimitError = (error: any) => {
    // Clear any existing timer
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }

    if (!error) {
      setRateLimitState({
        isLimited: false,
        message: null,
        remainingTime: null,
        reset: null,
      });
      return;
    }

    // Check if this is a rate limit error (status 429)
    const isAxiosError = error instanceof Error && 'isAxiosError' in error;
    if (isAxiosError && (error as AxiosError).response?.status === 429) {
      const rateLimitInfo: RateLimitInfo = (error as AxiosError).response?.data?.rateLimitInfo;
      const message = (error as AxiosError).response?.data?.error || 'Rate limit exceeded. Please try again later.';
      
      // If we have rate limit info with a reset timestamp
      if (rateLimitInfo?.reset) {
        const resetTime = rateLimitInfo.reset;
        const now = Date.now();
        const remainingMs = resetTime - now;
        
        if (remainingMs > 0) {
          setRateLimitState({
            isLimited: true,
            message,
            remainingTime: Math.ceil(remainingMs / 1000),
            reset: resetTime,
          });
          
          // Set up a timer to count down the remaining time
          const intervalId = setInterval(() => {
            const now = Date.now();
            const remaining = resetTime - now;
            
            if (remaining <= 0) {
              // Time's up, clear the rate limit state
              setRateLimitState({
                isLimited: false,
                message: null,
                remainingTime: null,
                reset: null,
              });
              clearInterval(intervalId);
              setTimer(null);
            } else {
              // Update the remaining time
              setRateLimitState(prev => ({
                ...prev,
                remainingTime: Math.ceil(remaining / 1000),
              }));
            }
          }, 1000);
          
          setTimer(intervalId);
        } else {
          // Reset time is in the past, so we're not rate limited anymore
          setRateLimitState({
            isLimited: false,
            message: null,
            remainingTime: null,
            reset: null,
          });
        }
      } else {
        // We don't have reset info, just set the message
        setRateLimitState({
          isLimited: true,
          message,
          remainingTime: null,
          reset: null,
        });
      }
    } else {
      // Not a rate limit error
      setRateLimitState({
        isLimited: false,
        message: null,
        remainingTime: null,
        reset: null,
      });
    }
  };

  return {
    rateLimitState,
    handleRateLimitError,
    clearRateLimit: () => handleRateLimitError(null),
  };
} 