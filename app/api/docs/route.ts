import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

export async function GET() {
  // Only expose API docs in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    return NextResponse.json(swaggerSpec)
  } catch (error) {
    console.error('[DOCS] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
