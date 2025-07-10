// External Integrations API - Simplified
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, integrations: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Integration processed' });
}