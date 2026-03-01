"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { handleSessionError, refreshSession } from "@/lib/auth-error-handler";

/**
 * A hook that safely gets the session with built-in error handling
 * Automatically attempts to refresh the session if fetch errors occur
 */
export const useSafeSession = () => {
  const sessionResult = useSession();
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Handle fetch errors related to session
    const handleFetchError = async (event: ErrorEvent) => {
      if (
        event.message?.includes('Failed to fetch') || 
        event.error?.toString()?.includes('Failed to fetch')
      ) {
        // Handle session fetch errors
        if (handleSessionError(event.error)) {
          setHasError(true);
          // Try to refresh the session
          await refreshSession();
          setHasError(false);
        }
      }
    };

    window.addEventListener('error', handleFetchError);
    return () => window.removeEventListener('error', handleFetchError);
  }, []);

  return {
    ...sessionResult,
    hasError,
    // Return a nullable user to make TypeScript happier
    user: sessionResult.data?.user || null
  };
}; 