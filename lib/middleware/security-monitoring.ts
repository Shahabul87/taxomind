/**
 * Security Monitoring Middleware
 * Monitors and logs security-related events during request processing
 */

import { NextRequest } from 'next/server';
import { authAuditHelpers } from '@/lib/audit/auth-audit';

export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  context?: Record<string, any>;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private suspiciousPatterns: RegExp[];
  private maxRequestSize = 10 * 1024 * 1024; // 10MB
  private maxHeaderSize = 8192; // 8KB

  private constructor() {
    this.suspiciousPatterns = [
      // SQL Injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      // Path traversal
      /\.\.[\/\\]/g,
      // Command injection
      /[;&|`${}]/g,
    ];
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Analyze request for security threats
   */
  async analyzeRequest(request: NextRequest): Promise<SecurityEvent[]> {
    const events: SecurityEvent[] = [];
    const url = request.url;
    const method = request.method;
    const headers = request.headers;
    const userAgent = headers.get('user-agent') || '';
    const referer = headers.get('referer') || '';

    // Check for suspicious user agents
    if (this.isSuspiciousUserAgent(userAgent)) {
      events.push({
        type: 'SUSPICIOUS_USER_AGENT',
        severity: 'medium',
        details: `Suspicious user agent detected: ${userAgent}`,
        context: { userAgent, url, method }
      });
    }

    // Check for oversized requests
    const contentLength = parseInt(headers.get('content-length') || '0');
    if (contentLength > this.maxRequestSize) {
      events.push({
        type: 'OVERSIZED_REQUEST',
        severity: 'high',
        details: `Request size ${contentLength} exceeds limit ${this.maxRequestSize}`,
        context: { contentLength, url, method }
      });
    }

    // Check for oversized headers
    const headerString = Array.from(headers.entries()).map(([k, v]) => `${k}:${v}`).join('\n');
    if (headerString.length > this.maxHeaderSize) {
      events.push({
        type: 'OVERSIZED_HEADERS',
        severity: 'high',
        details: `Header size ${headerString.length} exceeds limit ${this.maxHeaderSize}`,
        context: { headerSize: headerString.length, url, method }
      });
    }

    // Check URL for suspicious patterns
    const suspiciousUrlPatterns = this.checkSuspiciousPatterns(url);
    if (suspiciousUrlPatterns.length > 0) {
      events.push({
        type: 'SUSPICIOUS_URL_PATTERN',
        severity: 'high',
        details: `Suspicious patterns in URL: ${suspiciousUrlPatterns.join(', ')}`,
        context: { url, method, patterns: suspiciousUrlPatterns }
      });
    }

    // Check for rapid requests from same IP
    const ip = this.extractIP(request);
    if (await this.isRapidRequests(ip)) {
      events.push({
        type: 'RAPID_REQUESTS',
        severity: 'high',
        details: `Rapid requests detected from IP: ${ip}`,
        context: { ip, url, method }
      });
    }

    // Check for geo-blocking violations (if enabled)
    const location = await this.getLocationInfo(ip);
    if (location && this.isBlockedLocation(location)) {
      events.push({
        type: 'BLOCKED_LOCATION',
        severity: 'critical',
        details: `Request from blocked location: ${location.country}`,
        context: { ip, location, url, method }
      });
    }

    // Check for suspicious authentication attempts
    if (this.isAuthenticationEndpoint(url) && method === 'POST') {
      const authEvents = await this.analyzeAuthenticationAttempt(request);
      events.push(...authEvents);
    }

    return events;
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousAgents = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /hack/i,
      /nmap/i,
      /nikto/i,
    ];

    // Allow legitimate bots (Google, Bing, etc.)
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
    ];

    const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent));
    const isSuspicious = suspiciousAgents.some(pattern => pattern.test(userAgent));

    return isSuspicious && !isLegitimate;
  }

  /**
   * Check for suspicious patterns in text
   */
  private checkSuspiciousPatterns(text: string): string[] {
    const foundPatterns: string[] = [];
    
    this.suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        foundPatterns.push(`Pattern_${index}`);
      }
    });

    return foundPatterns;
  }

  /**
   * Extract IP address from request
   */
  private extractIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');
    
    return forwarded?.split(',')[0].trim() || realIP || cfIP || 'unknown';
  }

  /**
   * Check for rapid requests (basic implementation)
   */
  private async isRapidRequests(ip: string): Promise<boolean> {
    // This would typically use Redis or similar for tracking
    // For now, return false (implement based on your caching solution)
    return false;
  }

  /**
   * Get location info for IP (placeholder)
   */
  private async getLocationInfo(ip: string): Promise<{ country: string; city: string } | null> {
    // Implement IP geolocation here
    // You could use services like MaxMind, IPinfo, or CloudFlare
    return null;
  }

  /**
   * Check if location is blocked
   */
  private isBlockedLocation(location: { country: string; city: string }): boolean {
    // Implement geo-blocking logic here
    const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || [];
    return blockedCountries.includes(location.country);
  }

  /**
   * Check if URL is an authentication endpoint
   */
  private isAuthenticationEndpoint(url: string): boolean {
    const authEndpoints = [
      '/api/auth/signin',
      '/api/auth/signup',
      '/auth/login',
      '/auth/register',
      '/api/login',
      '/api/register',
    ];

    return authEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Analyze authentication attempts for suspicious behavior
   */
  private async analyzeAuthenticationAttempt(request: NextRequest): Promise<SecurityEvent[]> {
    const events: SecurityEvent[] = [];
    const ip = this.extractIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    try {
      // Check if request body contains suspicious content
      const body = await request.clone().text();
      
      if (body) {
        const suspiciousPatterns = this.checkSuspiciousPatterns(body);
        if (suspiciousPatterns.length > 0) {
          events.push({
            type: 'SUSPICIOUS_AUTH_PAYLOAD',
            severity: 'high',
            details: `Suspicious patterns in authentication payload`,
            context: { ip, userAgent, patterns: suspiciousPatterns }
          });
        }

        // Check for unusually long passwords (possible buffer overflow attempt)
        const passwordMatch = body.match(/"password"\s*:\s*"([^"]+)"/);
        if (passwordMatch && passwordMatch[1].length > 128) {
          events.push({
            type: 'OVERSIZED_PASSWORD',
            severity: 'high',
            details: `Unusually long password in authentication attempt: ${passwordMatch[1].length} characters`,
            context: { ip, userAgent, passwordLength: passwordMatch[1].length }
          });
        }
      }
    } catch (error) {
      // If we can't read the body, log it as suspicious
      events.push({
        type: 'MALFORMED_AUTH_REQUEST',
        severity: 'medium',
        details: 'Failed to parse authentication request body',
        context: { ip, userAgent, error: error instanceof Error ? error.message : 'Unknown' }
      });
    }

    return events;
  }

  /**
   * Log security events to audit system
   */
  async logSecurityEvents(events: SecurityEvent[], request: NextRequest): Promise<void> {
    const ip = this.extractIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    for (const event of events) {
      try {
        await authAuditHelpers.logSuspiciousActivity(
          undefined, // No user ID available in middleware
          undefined, // No email available in middleware
          event.type,
          `${event.details} - Severity: ${event.severity}`,
          {
            ipAddress: ip,
            userAgent,
            ...event.context
          }
        );
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// Helper function for use in middleware
export async function monitorRequestSecurity(request: NextRequest): Promise<void> {
  try {
    const events = await securityMonitor.analyzeRequest(request);
    
    if (events.length > 0) {
      await securityMonitor.logSecurityEvents(events, request);
      
      // Log high-severity events to console for immediate attention
      events
        .filter(e => e.severity === 'high' || e.severity === 'critical')
        .forEach(event => {
          console.warn(`[SECURITY] ${event.type}: ${event.details}`, {
            ip: securityMonitor['extractIP'](request),
            url: request.url,
            method: request.method,
            context: event.context
          });
        });
    }
  } catch (error) {
    console.error('Security monitoring error:', error);
  }
}