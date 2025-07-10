// Emotion Detection API - Simplified
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, emotion: 'neutral' });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Emotion analyzed' });
}