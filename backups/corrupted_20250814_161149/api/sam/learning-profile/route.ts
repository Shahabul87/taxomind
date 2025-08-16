import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';
import { 
  getSAMLearningProfile, 
  updateSAMLearningProfile 
} from '@/lib/sam-database';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || undefined;

    const profile = await getSAMLearningProfile(session.user.id, courseId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    logger.error('Error fetching SAM learning profile:', error);
    return NextResponsexport const POST = withAuth(async (request, context) => {
  
}, {
  rateLimit: { requests: 25, window: 60000 },
  auditLog: false
});,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      learningStyle, 
      preferredDifficulty, 
      interactionPreferences, 
      adaptiveSettings, 
      courseId 
    } = body;

    const profile = await updateSAMLearningProfile(session.user.id, {
      learningStyle,
      interactionPreferences: {
        ...interactionPreferences,
        preferredQuestionDifficulty: preferredDifficulty,
        courseId,
      },
      adaptiveSettings,
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    logger.error('Error updating SAM learning profile:', error);
    return NextResponse.json(
      { error: 'Failed to update learning profile' },
      { status: 500 }
    );
  }
}