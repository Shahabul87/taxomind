import { NextResponse } from 'next/server';
import { adminAuth } from '@/auth.admin';
import { getAdminMFAInfo } from '@/lib/auth/mfa-enforcement';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await adminAuth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ mfaInfo: null, error: 'Unauthorized' }, { status: 401 });
    }

    const info = await getAdminMFAInfo(session.user.id);
    return NextResponse.json({ mfaInfo: info });
  } catch (error) {
    return NextResponse.json({ mfaInfo: null, error: 'Failed to get MFA status' }, { status: 500 });
  }
}

