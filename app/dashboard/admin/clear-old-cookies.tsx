'use client';

import { useEffect } from 'react';

/**
 * Clear Old Cookies Component
 *
 * Automatically clears incompatible JWT cookies (3-part format)
 * when the page loads. This fixes JWTSessionError from old tokens.
 *
 * This component runs on the client-side and clears cookies
 * that can't be cleared server-side due to httpOnly restrictions.
 */
export function ClearOldCookies() {
  useEffect(() => {
    // Check if we're in development and if there's a session error
    if (typeof window !== 'undefined') {
      // List of old cookie names to clear
      const oldCookies = [
        'admin-session-token',
        '__Secure-admin-session-token',
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'authjs.session-token',
        '__Secure-authjs.session-token',
      ];

      let clearedAny = false;

      // Clear old cookies
      oldCookies.forEach((name) => {
        const cookieValue = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`));

        if (cookieValue) {
          // Clear the cookie with various configurations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
          clearedAny = true;
          console.log(`[ClearOldCookies] Cleared old cookie: ${name}`);
        }
      });

      if (clearedAny) {
        console.log('[ClearOldCookies] Old cookies cleared. Reloading page...');
        // Reload to get fresh session
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }, []); // Run once on mount

  return null; // This component doesn't render anything
}
