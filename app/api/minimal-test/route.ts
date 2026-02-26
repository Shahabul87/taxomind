import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: "working",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MINIMAL_TEST] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
