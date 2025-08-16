import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { gdprManager } from '@/lib/compliance/gdpr-manager';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Request validation schemas
const consentRequestSchema = z.object({
  consentType: z.string(),
  granted: z.boolean(),
  purpose: z.string().optional(),
});

const gdprRequestSchema = z.object({
  requestType: z.enum([
    'DATA_ACCESS',
    'DATA_PORTABILITY',
    'DATA_RECTIFICATION',
    'DATA_DELETION',
    'DATA_RESTRICTION',
    'CONSENT_WITHDRAWAL',
  ]),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'consents':
        // Get user's current consents
        const consents = await gdprManager.getUserConsents(session.user.id);
        return NextResponse.json({ success: true, consents });

      case 'export':
        // Export user data
        const userData = await gdprManager.exportUserData(session.user.id);
        return NextResponse.json(
          { success: true, data: userData },
          {
            headers: {
              'Content-Disposition': `attachment; filename="user-data-${session.user.id}.json"`,
            },
          }
        );

      case 'retention-policy':
        // Get data retention policy
        const policy = gdprManager.getDataRetentionPolicy();
        return NextResponse.json({ success: true, policy });

      case 'compliance-report':
        // Admin only - get compliance report
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
        const report = await gdprManager.generateComplianceReport();
        return NextResponse.json({ success: true, report });

      case 'data-minimization':
        // Check data minimization for user
        const minimization = await gdprManager.checkDataMinimization(session.user.id);
        return NextResponse.json({ success: true, ...minimization });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('GDPR API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'consent':
        // Record consent
        const consentData = consentRequestSchema.parse(body);
        const consent = await gdprManager.recordConsent({
          userId: session.user.id,
          consentType: consentData.consentType as any,
          granted: consentData.granted,
          purpose: consentData.purpose,
        });
        return NextResponse.json({ success: true, consent });

      case 'gdpr-request':
        // Process GDPR request
        const gdprData = gdprRequestSchema.parse(body);
        const result = await gdprManager.processGDPRRequest({
          userId: session.user.id,
          requestType: gdprData.requestType as any,
          reason: gdprData.reason,
        });
        return NextResponse.json({ ...result, success: true });

      case 'delete-account':
        // Delete user account and data
        const { verificationToken } = body;
        await gdprManager.deleteUserData(session.user.id, verificationToken);
        return NextResponse.json({
          success: true,
          message: 'Account deletion initiated. You will receive a confirmation email.',
        });

      case 'anonymize':
        // Anonymize user data
        await gdprManager.anonymizeUserData(session.user.id);
        return NextResponse.json({
          success: true,
          message: 'Your data has been anonymized',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('GDPR API POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const verificationToken = searchParams.get('token');

    // Process account deletion with verification
    await gdprManager.deleteUserData(session.user.id, verificationToken || undefined);

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted',
    });
  } catch (error) {
    logger.error('GDPR API DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}