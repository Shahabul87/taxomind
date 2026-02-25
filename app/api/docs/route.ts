import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

export async function GET() {
  try {
    return NextResponse.json(swaggerSpec)
  } catch (error) {
    console.error('[DOCS] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
