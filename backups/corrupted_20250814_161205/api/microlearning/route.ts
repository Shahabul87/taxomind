// Microlearning API - Simplified
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, modules: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Module processed' });
}