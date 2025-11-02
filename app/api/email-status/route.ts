import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getUserEmailStatus } from '@/lib/queue/email-tracking';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent email logs for user
    const emailLogs = await getUserEmailStatus(user.id, 10);

    return NextResponse.json({ emails: emailLogs });
  } catch (error) {
    console.error('[Email Status API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
