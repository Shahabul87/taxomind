import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, data, timestamp, context } = await request.json();

    // Store interaction in database
    // Note: You would need to create a learning_interactions table
    const interaction = {
      userId: user.id,
      type,
      data: JSON.stringify(data),
      timestamp: new Date(timestamp),
      context: JSON.stringify(context),
      sessionId: generateSessionId(), // Generate or use existing session ID
    };

    // For now, just log the interaction

    // In a real implementation, you would save to database:
    // await db.learningInteraction.create({ data: interaction });

    return NextResponse.json({ 
      success: true, 
      message: 'Interaction tracked successfully' 
    });

  } catch (error) {
    logger.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}