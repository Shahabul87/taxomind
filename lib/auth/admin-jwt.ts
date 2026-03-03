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
import { logger } from "@/lib/logger";

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

// Log secret configuration on startup
logger.debug('[admin-jwt] Configuration loaded', {
  adminJwtSecretPresent: !!process.env.ADMIN_JWT_SECRET,
  usingFallbackSecret: !process.env.ADMIN_JWT_SECRET,
  algorithm: ADMIN_JWT_ALGORITHM,
  maxAgeHours: ADMIN_JWT_MAX_AGE / 3600,
});

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
      logger.debug('[admin-jwt] No token provided to encode');
      return null;
    }

    logger.debug('[admin-jwt] Encoding admin JWT', { sub: token.sub });

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

      logger.debug('[admin-jwt] Admin JWT encoded successfully');
      return encodedToken;
    } catch (error) {
      logger.error('[admin-jwt] Error encoding admin JWT', error);
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
      logger.debug('[admin-jwt] No token provided to decode');
      return null;
    }

    logger.debug('[admin-jwt] Starting JWT decode process', { tokenLength: token.length });

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
        logger.debug('[admin-jwt] Extracted JWT from cookie pattern');
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
        logger.debug('[admin-jwt] Removed prefix', { prefix: prefix.trim() });
      }
    }

    // Step 2: Validate JWT format (3 parts separated by dots)
    const jwtParts = jwtToken.split('.');
    if (jwtParts.length !== 3) {
      logger.debug('[admin-jwt] Invalid JWT format', { expectedParts: 3, gotParts: jwtParts.length });

      // Last resort: Try to find JWT pattern in the string
      const jwtPattern = /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/;
      const jwtMatch = jwtToken.match(jwtPattern);

      if (jwtMatch) {
        logger.debug('[admin-jwt] Found JWT pattern in input string');
        jwtToken = jwtMatch[0];
      } else {
        logger.debug('[admin-jwt] Could not find valid JWT in input');
        return null;
      }
    }

    // Step 3: Quick validation - decode payload to check if it&apos;s an admin token
    try {
      const payloadBase64 = jwtParts[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

      logger.debug('[admin-jwt] JWT payload preview', {
        aud: payload?.aud,
        iss: payload?.iss,
        role: payload?.role,
        sessionType: payload?.sessionType,
        adminAuth: payload?.adminAuth,
        subPrefix: payload?.sub?.substring(0, 8),
      });

      // Verify it&apos;s actually an admin token before full verification
      const isAdminToken = (
        payload?.aud === 'taxomind-admin' ||
        payload?.iss === 'taxomind-admin-auth' ||
        payload?.adminAuth === true ||
        payload?.sessionType === 'ADMIN'
      );

      if (!isAdminToken) {
        logger.debug('[admin-jwt] Not an admin JWT - skipping verification');
        return null;
      }
    } catch (e) {
      logger.debug('[admin-jwt] Could not decode JWT payload for preview', e);
      // Continue with verification anyway
    }

    // Step 4: Verify the JWT with the admin secret (with legacy fallback)
    logger.debug('[admin-jwt] Attempting JWT verification with admin secret');

    // Try with the new ADMIN_JWT_SECRET first
    let decoded: JWT | null = null;
    let usedLegacySecret = false;

    try {
      decoded = jwt.verify(jwtToken, ADMIN_JWT_SECRET, {
        algorithms: [ADMIN_JWT_ALGORITHM as jwt.Algorithm],
        audience: 'taxomind-admin',
        issuer: 'taxomind-admin-auth',
      }) as JWT;

      logger.debug('[admin-jwt] JWT verified with current ADMIN_JWT_SECRET');
    } catch (primaryError) {
      // If verification fails with new secret, try legacy secret for graceful migration
      logger.debug('[admin-jwt] Verification with current secret failed, trying legacy secret...');

      try {
        decoded = jwt.verify(jwtToken, LEGACY_ADMIN_SECRET, {
          algorithms: [ADMIN_JWT_ALGORITHM as jwt.Algorithm],
          audience: 'taxomind-admin',
          issuer: 'taxomind-admin-auth',
        }) as JWT;

        usedLegacySecret = true;
        logger.warn('[admin-jwt] JWT verified with LEGACY secret (old token detected)');
        logger.warn('[admin-jwt] User should log out and log in again for new token');
      } catch (legacyError) {
        // Both secrets failed
        if (primaryError instanceof jwt.TokenExpiredError) {
          logger.debug('[admin-jwt] Admin JWT has expired', { expiry: primaryError.expiredAt });
        } else if (primaryError instanceof jwt.JsonWebTokenError) {
          logger.debug('[admin-jwt] JWT verification failed with both secrets', {
            primaryError: primaryError.message,
            legacyError: legacyError instanceof Error ? legacyError.message : 'unknown',
          });
        } else {
          logger.error('[admin-jwt] Unexpected error during JWT verification', primaryError);
        }
        return null;
      }
    }

    if (!decoded) {
      return null;
    }

    // Step 5: Verify admin-specific claims
    if (decoded.adminAuth !== true) {
      logger.error('[admin-jwt] SECURITY ALERT - Missing adminAuth claim');
      return null;
    }

    if (decoded.sessionType !== 'ADMIN') {
      logger.error('[admin-jwt] SECURITY ALERT - Invalid sessionType', { sessionType: decoded.sessionType });
      return null;
    }

    if (decoded.role !== 'ADMIN') {
      logger.error('[admin-jwt] SECURITY ALERT - Invalid role', { role: decoded.role });
      return null;
    }

    logger.debug('[admin-jwt] Admin JWT decoded and verified successfully', {
      subPrefix: decoded.sub?.substring(0, 8),
      sessionType: decoded.sessionType,
      usedLegacySecret,
    });

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
