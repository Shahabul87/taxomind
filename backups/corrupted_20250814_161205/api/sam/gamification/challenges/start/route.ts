import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { startChallengeForUser } from '@/lib/sam-achievement-engine';
import { logger } from '@/lib/logger';


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await req.json();
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const success = await startChallengeForUser(session.user.id, challengeId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to start challenge' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge started successfully',
    });
  } catch (error: any) {
    logger.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to start challenge' },
      { status: 500 }
    );
  }
}