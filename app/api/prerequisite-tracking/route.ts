// Prerequisite Tracking API - Simplified
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, prerequisites: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Prerequisites updated' });
}