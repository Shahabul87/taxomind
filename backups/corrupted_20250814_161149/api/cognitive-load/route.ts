// Cognitive Load Management API Endpoint - Simplified

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      cognitiveLoad: {
        currentLoad: 'optimal',
        loadScore: 65,
        recommendation: 'Current difficulty level is appropriate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get cognitive load data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Cognitive load data processed'
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process cognitive load data' }, { status: 500 });
  }
}