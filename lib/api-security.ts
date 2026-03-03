/**
 * API Security Manager
 * Handles API authentication, rate limiting, and key management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { Permission } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// Rate limiter implementation
class RateLimiter {
  private static instance: RateLimiter;
  private attempts: Map<string, { count: number; resetAt: Date }> = new Map();

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async check(identifier: string, limit: number = 100, windowMs: number = 3600000): Promise<boolean> {
    const now = new Date();
    const attempt = this.attempts.get(identifier);

    if (!attempt || attempt.resetAt < now) {
      // Create new window
      this.attempts.set(identifier, {
        count: 1,
        resetAt: new Date(now.getTime() + windowMs)
      });
      return true;
    }

    if (attempt.count >= limit) {
      return false;
    }

    attempt.count++;
    return true;
  }

  getRemainingAttempts(identifier: string, limit: number = 100): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return limit;
    return Math.max(0, limit - attempt.count);
  }

  getResetTime(identifier: string): Date | null {
    const attempt = this.attempts.get(identifier);
    return attempt?.resetAt || null;
  }
}

// Helper functions
function hashAPIKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export class APISecurityManager {
  private static rateLimiter = RateLimiter.getInstance();

  /**
   * Validate API key
   */
  static async validateAPIKey(
    request: NextRequest
  ): Promise<{ 
    valid: boolean; 
    userId?: string; 
    permissions?: string[];
    keyId?: string;
  }> {
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey) {
      return { valid: false };
    }
    
    try {
      // Hash the API key for comparison
      const hashedKey = hashAPIKey(apiKey);
      
      const keyRecord = await db.apiKey.findUnique({
        where: { hashedKey },
        include: { user: true }
      });
      
      if (!keyRecord || !keyRecord.isActive) {
        return { valid: false };
      }
      
      // Check if user account is locked
      if (keyRecord.user.isAccountLocked) {
        return { valid: false };
      }
      
      // Check expiration
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        await db.apiKey.update({
          where: { id: keyRecord.id },
          data: { isActive: false }
        });
        return { valid: false };
      }
      
      // Check rate limit
      const rateLimitKey = `api:${keyRecord.id}`;
      const allowed = await this.rateLimiter.check(
        rateLimitKey,
        keyRecord.rateLimit,
        3600000 // 1 hour window
      );
      
      if (!allowed) {
        // Log rate limit exceeded
        await db.enhancedAuditLog.create({
          data: {
            userId: keyRecord.userId,
            action: 'API_RATE_LIMIT_EXCEEDED',
            resource: 'API',
            resourceId: keyRecord.id,
            severity: 'WARNING',
            metadata: {
              keyId: keyRecord.id,
              endpoint: request.url
            }
          }
        });
        return { valid: false };
      }
      
      // Update last used
      await db.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() }
      });
      
      // Log API usage
      await db.enhancedAuditLog.create({
        data: {
          userId: keyRecord.userId,
          action: 'API_KEY_USED',
          resource: 'API',
          resourceId: keyRecord.id,
          metadata: {
            keyId: keyRecord.id,
            endpoint: request.url,
            method: request.method
          }
        }
      });
      
      return {
        valid: true,
        userId: keyRecord.userId,
        permissions: keyRecord.permissions as string[],
        keyId: keyRecord.id
      };
    } catch (error) {
      logger.error('Error validating API key:', error);
      return { valid: false };
    }
  }

  /**
   * Generate new API key
   */
  static async generateAPIKey(
    userId: string,
    name: string,
    permissions: string[],
    options?: {
      rateLimit?: number;
      expiresInDays?: number;
    }
  ): Promise<{ key: string; keyId: string }> {
    const apiKey = generateSecureToken();
    const hashedKey = hashAPIKey(apiKey);
    
    const expiresAt = options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    const keyRecord = await db.apiKey.create({
      data: {
        userId,
        name,
        key: apiKey.substring(0, 8) + '...',  // Store partial for identification
        hashedKey,
        permissions,
        rateLimit: options?.rateLimit || 1000,
        expiresAt
      }
    });
    
    // Audit log
    await db.enhancedAuditLog.create({
      data: {
        userId,
        action: 'API_KEY_CREATED',
        resource: 'API',
        resourceId: keyRecord.id,
        metadata: {
          name,
          permissions,
          expiresAt
        }
      }
    });
    
    return {
      key: apiKey,
      keyId: keyRecord.id
    };
  }

  /**
   * Revoke API key
   */
  static async revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const key = await db.apiKey.findFirst({
        where: {
          id: keyId,
          userId
        }
      });
      
      if (!key) return false;
      
      await db.apiKey.update({
        where: { id: keyId },
        data: { isActive: false }
      });
      
      // Audit log
      await db.enhancedAuditLog.create({
        data: {
          userId,
          action: 'API_KEY_REVOKED',
          resource: 'API',
          resourceId: keyId
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Error revoking API key:', error);
      return false;
    }
  }

  /**
   * Validate JWT token for API access
   */
  static async validateJWT(
    token: string
  ): Promise<{ 
    valid: boolean; 
    userId?: string; 
    role?: string;
    permissions?: string[];
  }> {
    try {
      const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
      if (!secret) {
        logger.error('JWT secret not configured');
        return { valid: false };
      }
      
      const decoded = jwt.verify(token, secret) as any;
      
      // Verify user still exists and is active
      const user = await db.user.findUnique({
        where: { id: decoded.userId || decoded.sub },
        select: {
          id: true,
          isAccountLocked: true,
          userPermissions: {
            where: {
              granted: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            },
            include: {
              permission: true
            }
          }
        }
      });
      
      if (!user || user.isAccountLocked) {
        return { valid: false };
      }
      
      const permissions = user.userPermissions.map(up => up.permission.name);

      return {
        valid: true,
        userId: user.id,
        permissions
      };
    } catch (error) {
      logger.error('JWT validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Check rate limit for IP address
   */
  static async checkIPRateLimit(
    ip: string,
    endpoint: string,
    limit: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date | null }> {
    const identifier = `ip:${ip}:${endpoint}`;
    const allowed = await this.rateLimiter.check(identifier, limit);
    const remaining = this.rateLimiter.getRemainingAttempts(identifier, limit);
    const resetAt = this.rateLimiter.getResetTime(identifier);
    
    if (!allowed) {
      // Log rate limit exceeded
      await db.enhancedAuditLog.create({
        data: {
          action: 'IP_RATE_LIMIT_EXCEEDED',
          resource: 'API',
          severity: 'WARNING',
          ipAddress: ip,
          metadata: {
            endpoint,
            limit
          }
        }
      });
    }
    
    return { allowed, remaining, resetAt };
  }

  /**
   * Extract client IP from request
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }
}

/**
 * API Route wrapper for authentication and rate limiting
 */
export function withAPIAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    permissions?: Permission[];
    rateLimit?: number;
    allowAPIKey?: boolean;
  }
) {
  return async (req: NextRequest, context: any) => {
    const ip = APISecurityManager.getClientIP(req);
    
    // Check IP rate limit
    if (options?.rateLimit) {
      const { allowed, remaining, resetAt } = await APISecurityManager.checkIPRateLimit(
        ip,
        req.url,
        options.rateLimit
      );
      
      if (!allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            resetAt 
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(options.rateLimit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': resetAt?.toISOString() || ''
            }
          }
        );
      }
    }
    
    // Check authentication if required
    if (options?.requireAuth) {
      let authenticated = false;
      let userId: string | undefined;
      let userPermissions: string[] = [];
      
      // Check for Bearer token
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const validation = await APISecurityManager.validateJWT(token);
        
        if (validation.valid) {
          authenticated = true;
          userId = validation.userId;
          userPermissions = validation.permissions || [];
        }
      }
      
      // Check for API key if allowed
      if (!authenticated && options.allowAPIKey) {
        const validation = await APISecurityManager.validateAPIKey(req);
        
        if (validation.valid) {
          authenticated = true;
          userId = validation.userId;
          userPermissions = validation.permissions || [];
        }
      }
      
      if (!authenticated) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Check permissions if specified
      if (options.permissions?.length) {
        const hasPermission = options.permissions.some(
          permission => userPermissions.includes(permission)
        );
        
        if (!hasPermission) {
          // Log unauthorized access attempt
          await db.enhancedAuditLog.create({
            data: {
              userId,
              action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
              resource: 'API',
              severity: 'WARNING',
              ipAddress: ip,
              metadata: {
                endpoint: req.url,
                requiredPermissions: options.permissions,
                userPermissions
              }
            }
          });
          
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }
      
      // Add user context to request
      (req as any).userId = userId;
      (req as any).userPermissions = userPermissions;
    }
    
    // Call the actual handler
    try {
      const response = await handler(req, context);
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      return response;
    } catch (error) {
      logger.error('API handler error:', error);
      
      // Log error
      await db.enhancedAuditLog.create({
        data: {
          userId: (req as any).userId,
          action: 'API_ERROR',
          resource: 'API',
          severity: 'ERROR',
          ipAddress: ip,
          metadata: {
            endpoint: req.url,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}