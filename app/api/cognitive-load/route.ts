// Cognitive Load Management API Endpoint - Simplified

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({
      success: true,
      cognitiveLoad: {
        currentLoad: 'optimal',
        loadScore: 65,
        recommendation: 'Current difficulty level is appropriate'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get cognitive load data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cognitive load data processed'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process cognitive load data' }, { status: 500 });
  }
}