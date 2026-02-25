// Emotion Detection API - Simplified
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json({ success: true, emotion: 'neutral' });
}

export async function POST() {
  const user = await currentUser();
  if (!user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json({ success: true, message: 'Emotion analyzed' });
}