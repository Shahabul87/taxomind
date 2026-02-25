// ML Predictions API - Simplified
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, predictions: [] });
  } catch (error) {
    console.error('[ML_PREDICTIONS] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Prediction generated' });
  } catch (error) {
    console.error('[ML_PREDICTIONS] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
