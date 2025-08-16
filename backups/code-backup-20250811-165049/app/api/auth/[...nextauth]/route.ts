import { NextRequest } from 'next/server'

// Force this route to use Node.js runtime, not Edge
export const runtime = 'nodejs'

// Import and re-export handlers using dynamic import to ensure build compatibility
export async function GET(request: NextRequest) {
  const { handlers } = await import('@/auth')
  return handlers.GET(request)
}

export async function POST(request: NextRequest) {
  const { handlers } = await import('@/auth')
  return handlers.POST(request)
} 