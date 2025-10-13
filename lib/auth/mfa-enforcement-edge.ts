/**
 * Edge-safe MFA helpers for middleware
 *
 * IMPORTANT: Do not import database or Prisma-related code here.
 * Middleware runs in the Edge runtime where Node.js APIs are unavailable.
 */

// Minimal config needed for middleware checks
export const MFA_ENFORCEMENT_CONFIG = {
  ALLOWED_ROUTES_DURING_SETUP: [
    "/admin/mfa-setup",
    "/admin/mfa-warning",
    "/api/auth",
    "/auth/logout",
    "/api/mfa",
  ],
} as const;

/**
 * Check if a route should be accessible during MFA setup.
 * This is safe for Edge runtime and avoids any DB access.
 */
export function isRouteAllowedDuringMFASetup(pathname: string): boolean {
  return MFA_ENFORCEMENT_CONFIG.ALLOWED_ROUTES_DURING_SETUP.some(
    (route) => pathname.startsWith(route)
  );
}

