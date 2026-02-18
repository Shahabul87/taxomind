/**
 * Admin JWT Configuration - Enterprise Auth Separation Phase 4
 *
 * Custom JWT encoding/decoding specifically for admin authentication.
 * Uses DIFFERENT algorithm, claims, and secret from user JWT tokens.
 *
 * CRITICAL SECURITY FEATURES:
 * - Uses HS512 algorithm (admin) vs HS256 (user)
 * - Different audience claim: 'taxomind-admin'
 * - Different issuer claim: 'taxomind-admin-auth'
 * - Admin-specific claims: adminAuth, sessionType
 * - Shorter expiration: 4 hours (vs 30 days for users)
 *
 * This prevents:
 * - User JWT tokens from being used for admin access
 * - Admin JWT tokens from being used for user access
 * - Cross-authentication attacks
 * - Token replay attacks between systems
 *
 * Created: January 11, 2025
 */

import * as jwt from "jsonwebtoken";
import type { JWT } from "next-auth/jwt";

const IS_DEV = process.env.NODE_ENV === 'development';
const debugLog = IS_DEV ? (...args: unknown[]) => console.log(...args) : () => {};

// Admin-specific JWT secret (can be different from user secret)
// In production, use ADMIN_JWT_SECRET environment variable for maximum separation
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (process.env.AUTH_SECRET + '-admin');

// LEGACY SECRET: For graceful migration from old tokens
// Old tokens were signed with this, new tokens use ADMIN_JWT_SECRET
const LEGACY_ADMIN_SECRET = process.env.AUTH_SECRET + '-admin';

// Different algorithm for admin JWTs (HS512 vs user HS256)
const ADMIN_JWT_ALGORITHM = 'HS512';

// Admin JWT max age: 4 hours (14400 seconds)
const ADMIN_JWT_MAX_AGE = 4 * 60 * 60; // 4 hours

// Log secret configuration on startup (dev only via debugLog)
debugLog('[admin-jwt] Configuration loaded:');
debugLog('[admin-jwt]   ADMIN_JWT_SECRET present:', !!process.env.ADMIN_JWT_SECRET);
debugLog('[admin-jwt]   Using fallback secret:', !process.env.ADMIN_JWT_SECRET);
debugLog('[admin-jwt]   Algorithm:', ADMIN_JWT_ALGORITHM);
debugLog('[admin-jwt]   Max age:', ADMIN_JWT_MAX_AGE / 3600, 'hours');

/**
 * Admin JWT Configuration
 * Provides custom encode/decode functions for NextAuth
 */
export const adminJwtConfig = {
  /**
   * Custom encode function for admin JWTs
   * Adds admin-specific claims and uses HS512 algorithm
   */
  async encode({ secret, token, maxAge }: { secret: string; token?: JWT; maxAge?: number }): Promise<string | null> {
    if (!token) {
      debugLog('[admin-jwt] No token provided to encode');
      return null;
    }

    debugLog('[admin-jwt] Encoding admin JWT for:', token.sub);

    // Add admin-specific claims
    const adminToken = {
      ...token,
      // Standard JWT claims
      aud: 'taxomind-admin',        // Audience claim (admin-specific)
      iss: 'taxomind-admin-auth',   // Issuer claim (admin-specific)

      // Custom admin claims
      adminAuth: true,              // Admin authentication flag
      sessionType: 'ADMIN',         // Session type identifier
      authType: 'ADMIN_CREDENTIALS', // Authentication type

      // Security metadata
      securityLevel: 'ELEVATED',    // Elevated security level
      requiresMFA: true,            // MFA requirement flag
    };

    try {
      const encodedToken = jwt.sign(adminToken, ADMIN_JWT_SECRET, {
        algorithm: ADMIN_JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: maxAge || ADMIN_JWT_MAX_AGE,
      });

      debugLog('[admin-jwt] Admin JWT encoded successfully');
      return encodedToken;
    } catch (error) {
      console.error('[admin-jwt] Error encoding admin JWT:', error);
      throw error;
    }
  },

  /**
   * Custom decode function for admin JWTs
   * Verifies admin-specific claims and algorithm
   *
   * CRITICAL: This function handles various input formats from NextAuth:
   * - Raw JWT string: "eyJhbGc..."
   * - Cookie value: "admin-session-token=eyJhbGc..."
   * - URL-encoded: "admin-session-token=eyJhbGc%3D%3D"
   * - Multiple cookies: "cookie1=value1; admin-session-token=eyJhbGc..."
   */
  async decode({ secret, token }: { secret: string; token?: string }): Promise<JWT | null> {
    if (!token) {
      debugLog('[admin-jwt] No token provided to decode');
      return null;
    }

    debugLog('[admin-jwt] Starting JWT decode process');
    debugLog('[admin-jwt] Input token type:', typeof token);
    debugLog('[admin-jwt] Input token length:', token.length);

    // Step 1: Try to extract JWT from various formats
    let jwtToken = token;

    // Handle URL-encoded values
    try {
      jwtToken = decodeURIComponent(token);
    } catch (e) {
      // Not URL-encoded, use original
      jwtToken = token;
    }

    // Handle cookie string format: "admin-session-token=eyJhbGc..."
    const cookiePatterns = [
      /(?:^|;\s*)(?:__Secure-)?admin-session-token=([^;]+)/,
      /(?:^|;\s*)admin-session-token=([^;]+)/,
      /admin-session-token=([^;]+)/,
    ];

    for (const pattern of cookiePatterns) {
      const match = jwtToken.match(pattern);
      if (match?.[1]) {
        debugLog('[admin-jwt] Extracted JWT from cookie pattern');
        jwtToken = match[1];
        break;
      }
    }

    // Handle potential wrapping or prefixes
    jwtToken = jwtToken.trim();

    // Remove common prefixes
    const prefixes = ['Bearer ', 'JWT ', 'Token '];
    for (const prefix of prefixes) {
      if (jwtToken.startsWith(prefix)) {
        jwtToken = jwtToken.substring(prefix.length);
        debugLog('[admin-jwt] Removed prefix:', prefix);
      }
    }

    // Step 2: Validate JWT format (3 parts separated by dots)
    const jwtParts = jwtToken.split('.');
    if (jwtParts.length !== 3) {
      debugLog('[admin-jwt] Invalid JWT format - expected 3 parts, got:', jwtParts.length);

      // Last resort: Try to find JWT pattern in the string
      const jwtPattern = /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/;
      const jwtMatch = jwtToken.match(jwtPattern);

      if (jwtMatch) {
        debugLog('[admin-jwt] Found JWT pattern in input string');
        jwtToken = jwtMatch[0];
      } else {
        debugLog('[admin-jwt] Could not find valid JWT in input');
        return null;
      }
    }

    // Step 3: Quick validation - decode payload to check if it&apos;s an admin token
    try {
      const payloadBase64 = jwtParts[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

      debugLog('[admin-jwt] JWT payload preview:', {
        aud: payload?.aud,
        iss: payload?.iss,
        role: payload?.role,
        sessionType: payload?.sessionType,
        adminAuth: payload?.adminAuth,
        sub: payload?.sub?.substring(0, 8) + '...',
      });

      // Verify it&apos;s actually an admin token before full verification
      const isAdminToken = (
        payload?.aud === 'taxomind-admin' ||
        payload?.iss === 'taxomind-admin-auth' ||
        payload?.adminAuth === true ||
        payload?.sessionType === 'ADMIN'
      );

      if (!isAdminToken) {
        debugLog('[admin-jwt] Not an admin JWT - skipping verification');
        return null;
      }
    } catch (e) {
      debugLog('[admin-jwt] Could not decode JWT payload for preview:', e);
      // Continue with verification anyway
    }

    // Step 4: Verify the JWT with the admin secret (with legacy fallback)
    debugLog('[admin-jwt] Attempting JWT verification with admin secret');

    // Try with the new ADMIN_JWT_SECRET first
    let decoded: JWT | null = null;
    let usedLegacySecret = false;

    try {
      decoded = jwt.verify(jwtToken, ADMIN_JWT_SECRET, {
        algorithms: [ADMIN_JWT_ALGORITHM as jwt.Algorithm],
        audience: 'taxomind-admin',
        issuer: 'taxomind-admin-auth',
      }) as JWT;

      debugLog('[admin-jwt] ✓ JWT verified with current ADMIN_JWT_SECRET');
    } catch (primaryError) {
      // If verification fails with new secret, try legacy secret for graceful migration
      debugLog('[admin-jwt] Verification with current secret failed, trying legacy secret...');

      try {
        decoded = jwt.verify(jwtToken, LEGACY_ADMIN_SECRET, {
          algorithms: [ADMIN_JWT_ALGORITHM as jwt.Algorithm],
          audience: 'taxomind-admin',
          issuer: 'taxomind-admin-auth',
        }) as JWT;

        usedLegacySecret = true;
        debugLog('[admin-jwt] ⚠️  JWT verified with LEGACY secret (old token detected)');
        debugLog('[admin-jwt] 🔄 User should log out and log in again for new token');
      } catch (legacyError) {
        // Both secrets failed
        if (primaryError instanceof jwt.TokenExpiredError) {
          debugLog('[admin-jwt] Admin JWT has expired');
          debugLog('[admin-jwt] Expiry:', primaryError.expiredAt);
          debugLog('[admin-jwt] 💡 Clear browser cookies and log in again');
        } else if (primaryError instanceof jwt.JsonWebTokenError) {
          debugLog('[admin-jwt] JWT verification failed with both secrets');
          debugLog('[admin-jwt] Primary error:', primaryError.message);
          debugLog('[admin-jwt] Legacy error:', legacyError instanceof Error ? legacyError.message : 'unknown');
          debugLog('[admin-jwt] 💡 SOLUTION: Clear browser cookies and restart server');
          debugLog('[admin-jwt]   1. Open DevTools (F12) → Application → Cookies');
          debugLog('[admin-jwt]   2. Delete: admin-session-token, __Secure-admin-session-token');
          debugLog('[admin-jwt]   3. Restart server: npm run dev');
          debugLog('[admin-jwt]   4. Log in again at /admin/auth/login');
        } else {
          console.error('[admin-jwt] Unexpected error during JWT verification:', primaryError);
        }
        return null;
      }
    }

    if (!decoded) {
      return null;
    }

    // Step 5: Verify admin-specific claims
    if (decoded.adminAuth !== true) {
      console.error('[admin-jwt] SECURITY ALERT - Missing adminAuth claim');
      return null;
    }

    if (decoded.sessionType !== 'ADMIN') {
      console.error('[admin-jwt] SECURITY ALERT - Invalid sessionType:', decoded.sessionType);
      return null;
    }

    if (decoded.role !== 'ADMIN') {
      console.error('[admin-jwt] SECURITY ALERT - Invalid role:', decoded.role);
      return null;
    }

    debugLog('[admin-jwt] ✓ Admin JWT decoded and verified successfully');
    debugLog('[admin-jwt] User ID:', decoded.sub?.substring(0, 8) + '...');
    debugLog('[admin-jwt] Session type:', decoded.sessionType);
    if (usedLegacySecret) {
      debugLog('[admin-jwt] ⚠️  Using legacy token - recommend re-authentication');
    }

    return decoded;
  },
};

/**
 * Verify if a JWT is an admin token
 * Used by middleware for session detection
 */
export function isAdminJWT(token: string): boolean {
  try {
    // Quick check without full verification
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload (base64)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );

    return (
      payload.adminAuth === true &&
      payload.sessionType === 'ADMIN' &&
      payload.aud === 'taxomind-admin' &&
      payload.iss === 'taxomind-admin-auth'
    );
  } catch {
    return false;
  }
}

/**
 * Verify if a JWT is a user (non-admin) token
 * Used by middleware for session detection
 */
export function isUserJWT(token: string): boolean {
  try {
    // Quick check without full verification
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload (base64)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );

    // User tokens should NOT have admin claims
    return (
      payload.adminAuth !== true &&
      payload.sessionType !== 'ADMIN' &&
      payload.aud !== 'taxomind-admin'
    );
  } catch {
    return false;
  }
}

/**
 * Admin JWT Configuration Summary
 * For documentation and audit purposes
 */
export const ADMIN_JWT_CONFIG_SUMMARY = {
  algorithm: ADMIN_JWT_ALGORITHM,
  maxAge: ADMIN_JWT_MAX_AGE,
  audience: 'taxomind-admin',
  issuer: 'taxomind-admin-auth',
  customClaims: [
    'adminAuth',
    'sessionType',
    'authType',
    'securityLevel',
    'requiresMFA',
  ],
  securityFeatures: [
    'Different algorithm than user JWT (HS512 vs HS256)',
    'Different secret (can be separate env var)',
    'Different audience and issuer claims',
    'Shorter expiration (4 hours vs 30 days)',
    'Admin-specific claim verification',
  ],
};
