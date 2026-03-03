import { NextRequest, NextResponse } from 'next/server';
import { CryptoUtils } from '@/lib/security/crypto-utils';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

/**
 * CSP Violation Report Endpoint
 * 
 * This endpoint receives Content Security Policy violation reports
 * and logs them for security monitoring and analysis.
 * 
 * @example
 * CSP header configuration:
 * Content-Security-Policy: script-src 'self'; report-uri /api/security/csp-report
 */

interface CSPViolationReport {
  'csp-report': {
    'blocked-uri': string;
    'document-uri': string;
    'effective-directive': string;
    'original-policy': string;
    'referrer': string;
    'script-sample': string;
    'source-file': string;
    'status-code': number;
    'violated-directive': string;
    'line-number': number;
    'column-number': number;
  };
}

interface SecurityViolationLog {
  id: string;
  timestamp: Date;
  type: 'csp_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  clientIP: string;
  userAgent: string;
  report: CSPViolationReport['csp-report'];
  metadata: {
    blocked: boolean;
    policyType: string;
    riskLevel: string;
  };
}

/**
 * Analyzes CSP violation to determine severity and risk level
 */
function analyzeCSPViolation(report: CSPViolationReport['csp-report']): {
  severity: SecurityViolationLog['severity'];
  riskLevel: string;
  blocked: boolean;
  policyType: string;
} {
  const blockedUri = report['blocked-uri'];
  const violatedDirective = report['violated-directive'];
  
  // Determine if this was actually blocked or just reported
  const blocked = !report['document-uri'].includes('report-only');
  
  // Determine policy type
  let policyType = 'unknown';
  if (violatedDirective.includes('script-src')) policyType = 'script';
  else if (violatedDirective.includes('style-src')) policyType = 'style';
  else if (violatedDirective.includes('img-src')) policyType = 'image';
  else if (violatedDirective.includes('connect-src')) policyType = 'connection';
  else if (violatedDirective.includes('frame-src')) policyType = 'frame';
  else if (violatedDirective.includes('object-src')) policyType = 'object';
  
  // Determine severity based on violation type and blocked URI
  let severity: SecurityViolationLog['severity'] = 'low';
  let riskLevel = 'low';
  
  // High-risk patterns
  if (blockedUri.includes('javascript:') || blockedUri.includes('data:text/html')) {
    severity = 'critical';
    riskLevel = 'critical';
  } else if (blockedUri.includes('eval') || violatedDirective.includes('unsafe-eval')) {
    severity = 'high';
    riskLevel = 'high';
  } else if (policyType === 'script' && blockedUri.includes('inline')) {
    severity = 'high';
    riskLevel = 'high';
  } else if (blockedUri.startsWith('http://')) {
    severity = 'medium';
    riskLevel = 'medium';
  } else if (policyType === 'style' || policyType === 'image') {
    severity = 'low';
    riskLevel = 'low';
  }
  
  // Increase severity if violation was actually blocked (not just reported)
  if (blocked && severity === 'low') severity = 'medium';
  if (blocked && severity === 'medium') severity = 'high';
  
  return { severity, riskLevel, blocked, policyType };
}

/**
 * Logs security violation to appropriate systems
 */
async function logSecurityViolation(violation: SecurityViolationLog): Promise<void> {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logger.warn(`[CSP VIOLATION] ${violation.severity.toUpperCase()}: ${violation.report['violated-directive']}`, {
      blockedUri: violation.report['blocked-uri'],
      documentUri: violation.report['document-uri'],
      sourceFile: violation.report['source-file'],
    });
  }
  
  // In production, integrate with proper logging systems
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with enterprise logging system
    // await auditLogger.logSecurityViolation(violation);
    
    // Send critical violations to monitoring system
    if (violation.severity === 'critical' || violation.severity === 'high') {
      try {
        if (process.env.SECURITY_WEBHOOK_URL) {
          await fetch(process.env.SECURITY_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Security-Alert': 'CSP-Violation',
            },
            body: JSON.stringify({
              alert: 'CSP Violation Detected',
              severity: violation.severity,
              timestamp: violation.timestamp,
              details: {
                violatedDirective: violation.report['violated-directive'],
                blockedUri: violation.report['blocked-uri'],
                documentUri: violation.report['document-uri'],
                clientIP: violation.clientIP,
              },
            }),
          });
        }
      } catch (error) {
        logger.error('Failed to send CSP violation alert:', error);
      }
    }
  }
  
  // Store in database or logging service
  // await db.securityViolation.create({ data: violation });
}

/**
 * Validates CSP report format
 */
function validateCSPReport(data: any): data is CSPViolationReport {
  return (
    data &&
    typeof data === 'object' &&
    data['csp-report'] &&
    typeof data['csp-report'] === 'object' &&
    typeof data['csp-report']['violated-directive'] === 'string' &&
    typeof data['csp-report']['blocked-uri'] === 'string' &&
    typeof data['csp-report']['document-uri'] === 'string'
  );
}

/**
 * Extracts client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cf = request.headers.get('cf-connecting-ip');
  
  if (cf) return cf;
  if (real) return real;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

/**
 * POST /api/security/csp-report
 * Receives and processes CSP violation reports
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await withRateLimit(request, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/csp-report') && !contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/csp-report or application/json' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate CSP report format
    if (!validateCSPReport(body)) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      );
    }
    
    const report = body['csp-report'];
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Analyze violation
    const analysis = analyzeCSPViolation(report);
    
    // Create security violation log
    const violation: SecurityViolationLog = {
      id: await CryptoUtils.generateSecureToken(16),
      timestamp: new Date(),
      type: 'csp_violation',
      severity: analysis.severity,
      clientIP,
      userAgent,
      report,
      metadata: {
        blocked: analysis.blocked,
        policyType: analysis.policyType,
        riskLevel: analysis.riskLevel,
      },
    };
    
    // Log the violation
    await logSecurityViolation(violation);
    
    // Return success response
    return NextResponse.json(
      { 
        message: 'CSP violation report received',
        id: violation.id,
        severity: violation.severity,
      },
      { status: 200 }
    );
    
  } catch (error) {
    logger.error('Error processing CSP violation report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process CSP report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/csp-report
 * Returns CSP reporting configuration and recent violations (admin only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await withRateLimit(request, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    // Require admin authentication
    const user = await currentUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return CSP configuration and stats (no sensitive values exposed)
    return NextResponse.json({
      message: 'CSP Reporting Endpoint Active',
      configuration: {
        reportURI: '/api/security/csp-report',
        reportOnly: process.env.NODE_ENV !== 'production',
      },
      endpoints: {
        report: 'POST /api/security/csp-report',
        config: 'GET /api/security/csp-report',
        violations: 'GET /api/security/csp-violations',
      },
    });
    
  } catch (error) {
    logger.error('Error retrieving CSP configuration:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve CSP configuration' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/security/csp-report
 * Handles CORS preflight requests
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';
  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Content-Security-Policy',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Route handlers are exported directly above
 */

/**
 * Route configuration
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Environment variables required:
 * 
 * SECURITY_WEBHOOK_URL=https://hooks.slack.com/... (optional)
 * NODE_ENV=production|staging|development (required)
 * 
 * CSP Header Example:
 * Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; report-uri /api/security/csp-report
 */