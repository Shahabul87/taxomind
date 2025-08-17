/**
 * Authentication & Authorization Types
 * Type definitions for authentication, sessions, and user roles
 */

import { User } from '@prisma/client';

/**
 * User Roles
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST'
}

/**
 * Authenticated User
 */
export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  image: string | null;
  isOAuth?: boolean;
  isTwoFactorEnabled?: boolean;
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Auth Session
 */
export interface AuthSession {
  user: AuthenticatedUser;
  expires: string;
  security?: {
    riskLevel: 'low' | 'medium' | 'high';
    fingerprintValid: boolean;
    lastCheck: string;
    trustedDevice?: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Auth Token
 */
export interface AuthToken {
  sub?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  isTwoFactorEnabled?: boolean;
  isOAuth?: boolean;
  sessionToken?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  code?: string; // 2FA code
  rememberMe?: boolean;
  fingerprint?: string;
}

/**
 * Registration Data
 */
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  acceptTerms: boolean;
  newsletterOptIn?: boolean;
}

/**
 * OAuth Provider
 */
export interface OAuthProvider {
  id: string;
  name: string;
  type: string;
  authorization?: string;
  token?: string;
  userinfo?: string;
  clientId: string;
  clientSecret?: string;
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  iat: number;
  exp: number;
}

/**
 * API Auth Context
 */
export interface APIAuthContext {
  user: AuthenticatedUser;
  session: AuthSession;
  permissions?: string[];
  apiKey?: string;
  rateLimitRemaining?: number;
}

/**
 * Two-Factor Authentication
 */
export interface TwoFactorAuth {
  secret: string;
  backupCodes: string[];
  qrCode?: string;
  verified: boolean;
  verifiedAt?: Date;
}

/**
 * Password Reset Token
 */
export interface PasswordResetToken {
  token: string;
  email: string;
  expires: Date;
  used?: boolean;
}

/**
 * Email Verification Token
 */
export interface EmailVerificationToken {
  token: string;
  email: string;
  expires: Date;
  verified?: boolean;
}

/**
 * Session Fingerprint
 */
export interface SessionFingerprint {
  fingerprint: string;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  lastSeen: Date;
  trusted: boolean;
}

/**
 * Permission
 */
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

/**
 * Auth Error
 */
export interface AuthError extends Error {
  code: 'INVALID_CREDENTIALS' | 'SESSION_EXPIRED' | 'UNAUTHORIZED' | 'FORBIDDEN' | '2FA_REQUIRED' | 'EMAIL_NOT_VERIFIED';
  statusCode: number;
}