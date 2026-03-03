/**
 * Cookie Security Configuration for NextAuth.js
 * 
 * This module provides environment-aware cookie configurations for NextAuth.js
 * with enterprise-grade security settings optimized for different deployment environments.
 */

import type { NextAuthConfig } from "next-auth";
import { logger } from '@/lib/logger';

export interface CookieOptions {
  name?: string;
  options?: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
    maxAge?: number;
    partitioned?: boolean;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface CookiesOptions {
  sessionToken?: CookieOptions;
  callbackUrl?: CookieOptions;
  csrfToken?: CookieOptions;
  pkceCodeVerifier?: CookieOptions;
  state?: CookieOptions;
  nonce?: CookieOptions;
  webauthnChallenge?: CookieOptions;
}

export interface CookieSecurityOptions {
  environment?: 'development' | 'staging' | 'production';
  enableSecure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  httpOnly?: boolean;
}

/**
 * Environment-specific cookie configuration
 */
export const CookieEnvironments = {
  development: {
    secure: false,
    sameSite: 'lax' as const,
    httpOnly: true,
    domain: undefined, // Let browser handle localhost
  },
  staging: {
    secure: true,
    sameSite: 'lax' as const,
    httpOnly: true,
    domain: undefined,
  },
  production: {
    secure: true,
    sameSite: 'lax' as const, // CRITICAL: 'lax' required for OAuth callbacks from external domains
    httpOnly: true,
    domain: undefined,
  },
} as const;

/**
 * Session duration configuration by context
 * CRITICAL: Admin sessions MUST be shorter for enterprise security
 */
export const SessionDurations = {
  // Standard user sessions
  default: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60,   // 24 hours - how often to refresh the session
  },
  // Admin sessions (MUCH shorter for security - Phase 2 requirement)
  admin: {
    maxAge: 4 * 60 * 60,       // 4 hours in seconds (ENTERPRISE REQUIREMENT)
    updateAge: 30 * 60,        // 30 minutes - frequent refresh for admins
  },
  // Remember me sessions (longer duration)
  remember: {
    maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
    updateAge: 7 * 24 * 60 * 60, // 7 days - weekly refresh
  },
} as const;

/**
 * Get secure cookie configuration based on environment
 */
export function getSecureCookieConfig(options: CookieSecurityOptions = {}): CookiesOptions {
  const environment = options.environment || 
    (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 
    'development';
  
  const envConfig = CookieEnvironments[environment as keyof typeof CookieEnvironments] ?? CookieEnvironments.development;
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';

  // Base configuration
  const baseConfig = {
    secure: options.enableSecure ?? envConfig.secure,
    httpOnly: options.httpOnly ?? envConfig.httpOnly,
    sameSite: options.sameSite ?? envConfig.sameSite,
    domain: options.domain ?? envConfig.domain,
  };

  return {
    // Auth.js v5 uses 'authjs' prefix by default (not 'next-auth')
    sessionToken: {
      name: `${isProduction ? '__Secure-' : ''}authjs.session-token`,
      options: {
        ...baseConfig,
        secure: isDevelopment ? false : true,
        httpOnly: true,
        sameSite: baseConfig.sameSite,
        path: '/',
        maxAge: isDevelopment ? undefined : 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: `${isProduction ? '__Secure-' : ''}authjs.callback-url`,
      options: {
        ...baseConfig,
        sameSite: 'lax',
        httpOnly: true,
        secure: isDevelopment ? false : true,
        path: '/',
        maxAge: isDevelopment ? undefined : 60 * 60, // 1 hour
      },
    },
    csrfToken: {
      name: `${isProduction ? '__Host-' : ''}authjs.csrf-token`,
      options: {
        ...baseConfig,
        httpOnly: false, // CSRF token needs to be accessible to client
        secure: isDevelopment ? false : true,
        sameSite: 'lax', // CRITICAL: 'lax' required for OAuth
        path: '/',
        maxAge: isDevelopment ? undefined : 60 * 60, // 1 hour
      },
    },
    pkceCodeVerifier: {
      name: `${isProduction ? '__Secure-' : ''}authjs.pkce.code_verifier`,
      options: {
        ...baseConfig,
        httpOnly: true,
        sameSite: 'lax',
        secure: isDevelopment ? false : true,
        path: '/',
        maxAge: isDevelopment ? undefined : 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `${isProduction ? '__Secure-' : ''}authjs.state`,
      options: {
        ...baseConfig,
        httpOnly: true,
        sameSite: 'lax',
        secure: isDevelopment ? false : true,
        path: '/',
        maxAge: isDevelopment ? undefined : 60 * 15, // 15 minutes
      },
    },
    nonce: {
      name: `${isProduction ? '__Secure-' : ''}authjs.nonce`,
      options: {
        ...baseConfig,
        httpOnly: true,
        sameSite: 'lax',
        secure: isDevelopment ? false : true,
        path: '/',
        maxAge: isDevelopment ? undefined : 60 * 15, // 15 minutes
      },
    },
    webauthnChallenge: {
      name: `${isProduction ? '__Secure-' : ''}authjs.challenge`,
      options: {
        ...baseConfig,
        httpOnly: true,
        sameSite: 'strict',
        secure: isDevelopment ? false : true,
        path: '/',
        maxAge: isDevelopment ? undefined : 60 * 15, // 15 minutes
      },
    },
  };
}

/**
 * Get session configuration based on user role and context
 */
export function getSessionConfig(userRole?: string, rememberMe?: boolean) {
  const isAdmin = userRole === 'ADMIN';
  
  if (rememberMe && !isAdmin) {
    return SessionDurations.remember;
  }
  
  if (isAdmin) {
    return SessionDurations.admin;
  }
  
  return SessionDurations.default;
}

/**
 * Cookie security validation
 */
export function validateCookieConfig(config: CookiesOptions): boolean {
  const environment = process.env.NODE_ENV;
  const isProduction = environment === 'production';
  
  // In production, ensure all cookies are secure
  if (isProduction) {
    const requiredSecureCookies = ['sessionToken', 'callbackUrl', 'csrfToken'];
    
    for (const cookieName of requiredSecureCookies) {
      const cookieConfig = config[cookieName as keyof CookiesOptions];
      if (cookieConfig && typeof cookieConfig === 'object' && 'options' in cookieConfig) {
        const options = cookieConfig.options as any;
        if (!options.secure) {
          logger.warn(`Cookie ${cookieName} is not secure in production environment`);
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Enhanced cookie configuration with additional security features
 */
export function getEnhancedCookieConfig(options: CookieSecurityOptions = {}): CookiesOptions {
  const baseConfig = getSecureCookieConfig(options);
  const environment = options.environment || process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  
  // Add additional security headers for production
  if (isProduction) {
    // Add priority and partitioned attributes for enhanced security
    Object.keys(baseConfig).forEach(key => {
      const cookieConfig = baseConfig[key as keyof CookiesOptions];
      if (cookieConfig && typeof cookieConfig === 'object' && 'options' in cookieConfig) {
        const options = cookieConfig.options as any;
        
        // Add Partitioned attribute for CHIPS (Cookies Having Independent Partitioned State)
        if (key === 'sessionToken') {
          options.partitioned = true;
        }
        
        // Add priority for important cookies
        if (['sessionToken', 'csrfToken'].includes(key)) {
          options.priority = 'high';
        }
      }
    });
  }
  
  return baseConfig;
}

/**
 * Get admin-specific cookie configuration
 * PHASE 2: Separate admin session management
 * - Different cookie name: admin-session-token
 * - Shorter max-age: 4 hours
 * - More frequent updates: 30 minutes
 */
export function getAdminCookieConfig(options: CookieSecurityOptions = {}): CookiesOptions {
  const baseConfig = getSecureCookieConfig(options);
  const environment = options.environment || process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';

  // Override session token configuration for admins
  return {
    ...baseConfig,
    sessionToken: {
      name: `${isProduction ? '__Secure-' : ''}admin-session-token`, // DIFFERENT NAME
      options: {
        ...baseConfig.sessionToken?.options,
        secure: isDevelopment ? false : true,
        httpOnly: true,
        sameSite: 'strict', // Stricter for admins
        path: '/',
        maxAge: isDevelopment ? undefined : SessionDurations.admin.maxAge, // 4 hours
      },
    },
  };
}

/**
 * Utility to get cookie name with appropriate prefix
 */
export function getSecureCookieName(baseName: string, isProduction: boolean = false): string {
  if (isProduction) {
    // Use __Secure- prefix for HTTPS-only cookies
    if (baseName.includes('session') || baseName.includes('csrf')) {
      return `__Secure-${baseName}`;
    }
    // Use __Host- prefix for cookies that should be bound to the host
    if (baseName.includes('callback') || baseName.includes('state')) {
      return `__Host-${baseName}`;
    }
  }
  return baseName;
}

/**
 * Default export with enterprise-ready configuration
 */
export const DefaultCookieConfig = getEnhancedCookieConfig({
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
});

/**
 * Cookie configuration presets for different environments
 */
export const CookieConfigPresets = {
  development: () => getEnhancedCookieConfig({ environment: 'development' }),
  staging: () => getEnhancedCookieConfig({ environment: 'staging' }),
  production: () => getEnhancedCookieConfig({ environment: 'production' }),
} as const;