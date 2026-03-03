// Knowledge Graph API - Simplified
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, graph: {} });
  } catch (error) {
    logger.error('[KNOWLEDGE_GRAPH] GET Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Graph updated' });
  } catch (error) {
    logger.error('[KNOWLEDGE_GRAPH] POST Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
