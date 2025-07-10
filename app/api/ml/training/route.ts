// ML Training API - Simplified
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, models: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Training started' });
}