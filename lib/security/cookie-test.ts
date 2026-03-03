/**
 * Cookie Configuration Test Utilities
 * 
 * This module provides utilities to test and validate the cookie configuration
 * to ensure OAuth flows work correctly with our security settings.
 */

import {
  getSecureCookieConfig,
  getSessionConfig,
  validateCookieConfig,
  CookieEnvironments
} from './cookie-config';
import { logger } from '@/lib/logger';

/**
 * Test OAuth callback compatibility
 */
export function testOAuthCallbackCompatibility(): {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';
  const cookieConfig = getSecureCookieConfig({ environment });
  
  // Test callback URL cookie
  const callbackCookie = cookieConfig.callbackUrl;
  if (callbackCookie && typeof callbackCookie === 'object' && 'options' in callbackCookie) {
    const options = callbackCookie.options as any;
    
    // Callback URL must use lax for OAuth redirects
    if (options.sameSite !== 'lax') {
      issues.push('CallbackUrl cookie should use sameSite: lax for OAuth compatibility');
      recommendations.push('OAuth providers require lax sameSite setting for callback URLs');
    }
    
    // Should be secure in non-development
    if (environment !== 'development' && !options.secure) {
      issues.push('CallbackUrl cookie should be secure in production/staging');
    }
  }
  
  // Test state cookie (used in OAuth flow)
  const stateCookie = cookieConfig.state;
  if (stateCookie && typeof stateCookie === 'object' && 'options' in stateCookie) {
    const options = stateCookie.options as any;
    
    // State cookie must also be lax
    if (options.sameSite !== 'lax') {
      issues.push('State cookie should use sameSite: lax for OAuth compatibility');
    }
  }
  
  // Test PKCE code verifier
  const pkceCookie = cookieConfig.pkceCodeVerifier;
  if (pkceCookie && typeof pkceCookie === 'object' && 'options' in pkceCookie) {
    const options = pkceCookie.options as any;
    
    if (options.sameSite !== 'lax') {
      issues.push('PKCE code verifier should use sameSite: lax for OAuth compatibility');
    }
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Test session security
 */
export function testSessionSecurity(): {
  secure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';
  const cookieConfig = getSecureCookieConfig({ environment });
  
  // Test session token security
  const sessionCookie = cookieConfig.sessionToken;
  if (sessionCookie && typeof sessionCookie === 'object' && 'options' in sessionCookie) {
    const options = sessionCookie.options as any;
    
    // Session token should be httpOnly
    if (!options.httpOnly) {
      issues.push('Session token should be httpOnly for XSS protection');
    }
    
    // Should use strict sameSite for session token
    if (environment === 'production' && options.sameSite !== 'strict') {
      recommendations.push('Consider using sameSite: strict for session tokens in production');
    }
    
    // Should be secure in production
    if (environment === 'production' && !options.secure) {
      issues.push('Session token must be secure in production');
    }
  }
  
  // Test CSRF token
  const csrfCookie = cookieConfig.csrfToken;
  if (csrfCookie && typeof csrfCookie === 'object' && 'options' in csrfCookie) {
    const options = csrfCookie.options as any;
    
    // CSRF token should NOT be httpOnly (needs client access)
    if (options.httpOnly) {
      issues.push('CSRF token should not be httpOnly - client needs access');
    }
    
    // Should use strict sameSite
    if (options.sameSite !== 'strict') {
      issues.push('CSRF token should use sameSite: strict for maximum protection');
    }
  }
  
  return {
    secure: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Test role-based session configuration
 */
export function testRoleBasedSessions(): {
  valid: boolean;
  configs: Record<string, any>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  
  const defaultConfig = getSessionConfig();
  const adminConfig = getSessionConfig('ADMIN');
  const userConfig = getSessionConfig('USER');
  const rememberConfig = getSessionConfig('USER', true);
  
  // Admin sessions should be shorter
  if (adminConfig.maxAge >= defaultConfig.maxAge) {
    recommendations.push('Admin sessions should have shorter duration for enhanced security');
  }
  
  // Remember me should be longer (but not for admins)
  if (rememberConfig.maxAge <= defaultConfig.maxAge) {
    recommendations.push('Remember me sessions should be longer than default sessions');
  }
  
  return {
    valid: true, // Always valid, just recommendations
    configs: {
      default: defaultConfig,
      admin: adminConfig,
      user: userConfig,
      remember: rememberConfig,
    },
    recommendations,
  };
}

/**
 * Comprehensive cookie security audit
 */
export function auditCookieSecurity(): {
  overall: 'secure' | 'warning' | 'insecure';
  oauth: ReturnType<typeof testOAuthCallbackCompatibility>;
  session: ReturnType<typeof testSessionSecurity>;
  roles: ReturnType<typeof testRoleBasedSessions>;
  environment: string;
} {
  const oauth = testOAuthCallbackCompatibility();
  const session = testSessionSecurity();
  const roles = testRoleBasedSessions();
  
  const environment = process.env.NODE_ENV || 'development';
  
  let overall: 'secure' | 'warning' | 'insecure' = 'secure';
  
  if (!oauth.compatible || !session.secure) {
    overall = 'insecure';
  } else if (oauth.recommendations.length > 0 || session.recommendations.length > 0 || roles.recommendations.length > 0) {
    overall = 'warning';
  }
  
  return {
    overall,
    oauth,
    session,
    roles,
    environment,
  };
}

/**
 * Generate cookie security report
 */
export function generateSecurityReport(): string {
  const audit = auditCookieSecurity();
  
  let report = `🔐 Cookie Security Audit Report\n`;
  report += `Environment: ${audit.environment}\n`;
  report += `Overall Status: ${audit.overall.toUpperCase()}\n\n`;
  
  // OAuth Compatibility
  report += `🔄 OAuth Compatibility: ${audit.oauth.compatible ? '✅ COMPATIBLE' : '❌ ISSUES FOUND'}\n`;
  if (audit.oauth.issues.length > 0) {
    report += `Issues:\n`;
    audit.oauth.issues.forEach(issue => report += `  - ${issue}\n`);
  }
  if (audit.oauth.recommendations.length > 0) {
    report += `Recommendations:\n`;
    audit.oauth.recommendations.forEach(rec => report += `  - ${rec}\n`);
  }
  report += '\n';
  
  // Session Security
  report += `🛡️ Session Security: ${audit.session.secure ? '✅ SECURE' : '❌ ISSUES FOUND'}\n`;
  if (audit.session.issues.length > 0) {
    report += `Issues:\n`;
    audit.session.issues.forEach(issue => report += `  - ${issue}\n`);
  }
  if (audit.session.recommendations.length > 0) {
    report += `Recommendations:\n`;
    audit.session.recommendations.forEach(rec => report += `  - ${rec}\n`);
  }
  report += '\n';
  
  // Role-based Configuration
  report += `👥 Role-based Sessions: ✅ CONFIGURED\n`;
  report += `Session Durations:\n`;
  report += `  - Default: ${Math.round(audit.roles.configs.default.maxAge / (24 * 60 * 60))} days\n`;
  report += `  - Admin: ${Math.round(audit.roles.configs.admin.maxAge / (24 * 60 * 60))} days\n`;
  report += `  - Remember Me: ${Math.round(audit.roles.configs.remember.maxAge / (24 * 60 * 60))} days\n`;
  
  if (audit.roles.recommendations.length > 0) {
    report += `Recommendations:\n`;
    audit.roles.recommendations.forEach(rec => report += `  - ${rec}\n`);
  }
  
  return report;
}

// Run audit on import in development
if (process.env.NODE_ENV === 'development') {
  logger.info('Cookie security audit report', { report: generateSecurityReport() });
}