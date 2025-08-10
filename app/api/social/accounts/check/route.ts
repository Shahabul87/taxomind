import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Get platform from query parameters
    const searchParams = req.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    
    if (!platform) {
      return NextResponse.json({ error: 'Platform parameter is required' }, { status: 400 });
    }
    
    // Get current user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has the specified connected account
    let providerName = platform;
    if (platform === 'twitter') {
      // Check for both 'twitter' and 'x' providers
      const account = await db.account.findFirst({
        where: {
          userId: session.user.id,
          OR: [
            { provider: 'twitter' },
            { provider: 'x' }
          ]
        }
      });
      
      return NextResponse.json({ connected: !!account }, { status: 200 });
    } else {
      // Check for the specified platform
      const account = await db.account.findFirst({
        where: {
          userId: session.user.id,
          provider: providerName
        }
      });
      
      return NextResponse.json({ connected: !!account }, { status: 200 });
    }
  } catch (error) {
    logger.error('Error checking social account:', error);
    return NextResponse.json(
      { error: 'Failed to check social account connection' }, 
      { status: 500 }
    );
  }
} 