import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getAdminMFAInfo } from '@/lib/auth/mfa-enforcement';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mfaInfo = await getAdminMFAInfo(user.id);

    if (!mfaInfo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      daysUntilEnforcement: mfaInfo.mfaEnforcementStatus.daysUntilEnforcement,
      warningPeriodActive: mfaInfo.mfaEnforcementStatus.warningPeriodActive,
      enforcementLevel: mfaInfo.mfaEnforcementStatus.enforcementLevel,
      message: mfaInfo.mfaEnforcementStatus.message,
    });
  } catch (error) {
    logger.error('[MFA Status API] Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
