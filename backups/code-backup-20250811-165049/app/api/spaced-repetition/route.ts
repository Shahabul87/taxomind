// Spaced Repetition API - Simplified
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, schedule: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Schedule updated' });
}