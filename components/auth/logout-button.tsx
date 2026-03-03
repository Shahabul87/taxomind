"use client";

import { signOut } from "next-auth/react";
import { useState, useCallback } from "react";

interface LogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Clear all auth-related cookies manually as a fallback.
 * Handles both development (no prefix) and production (__Secure-/__Host- prefix) cookies.
 */
function clearAuthCookies(): void {
  const cookieNames = [
    // Development cookie names
    "authjs.session-token",
    "authjs.callback-url",
    "authjs.csrf-token",
    "authjs.pkce.code_verifier",
    "authjs.state",
    "authjs.nonce",
    "authjs.challenge",
    // Production cookie names (with secure prefix)
    "__Secure-authjs.session-token",
    "__Secure-authjs.callback-url",
    "__Secure-authjs.pkce.code_verifier",
    "__Secure-authjs.state",
    "__Secure-authjs.nonce",
    "__Secure-authjs.challenge",
    "__Host-authjs.csrf-token",
    // Legacy next-auth cookie names (in case of migration)
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.csrf-token",
  ];

  for (const name of cookieNames) {
    // Clear with path=/ and multiple domain variations
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=lax;`;
  }
}

/**
 * Enterprise-grade sign-out with multi-layer fallback:
 * 1. NextAuth signOut() - standard path
 * 2. Manual cookie clearing + POST to signout endpoint
 * 3. Hard redirect with cookie clearing
 */
export async function performSignOut(callbackUrl = "/"): Promise<void> {
  try {
    // Layer 1: Standard NextAuth signOut
    await signOut({ callbackUrl, redirect: true });
  } catch {
    // Layer 2: Manual CSRF + POST fallback
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      if (csrfRes.ok) {
        const { csrfToken } = await csrfRes.json();
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken, callbackUrl }),
        });
      }
    } catch {
      // Silently continue to Layer 3
    }

    // Layer 3: Force clear cookies and redirect
    clearAuthCookies();
    window.location.href = callbackUrl;
  }
}

export const LogoutButton = ({
  children,
  className,
}: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await performSignOut("/");
    } catch {
      // Ultimate fallback
      clearAuthCookies();
      window.location.href = "/";
    }
  }, [isLoading]);

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className={`flex cursor-pointer hover:text-cyan-500 transition-colors ${className ?? ""}`}
      style={{ opacity: isLoading ? 0.7 : 1 }}
      aria-label="Sign out"
    >
      {isLoading ? "Signing out..." : children}
    </button>
  );
};
