import { NextRequest, NextResponse } from 'next/server'

// Force this route to use Node.js runtime, not Edge
export const runtime = 'nodejs'

// Store the last auth error for debugging
let lastAuthError: { message: string; timestamp: string } | null = null;

export function getLastAuthError() {
  return lastAuthError;
}

// Import and re-export handlers using dynamic import to ensure build compatibility
export async function GET(request: NextRequest) {
  try {
    const { handlers } = await import('@/auth')
    return handlers.GET(request)
  } catch (error) {
    // Capture the actual error for debugging
    lastAuthError = {
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
    console.error('[NextAuth GET] Actual error:', lastAuthError);
    throw error; // Re-throw to let NextAuth handle the response
  }
}

export async function POST(request: NextRequest) {
  try {
    const { handlers } = await import('@/auth')
    return handlers.POST(request)
  } catch (error) {
    // Capture the actual error for debugging
    lastAuthError = {
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
    console.error('[NextAuth POST] Actual error:', lastAuthError);
    throw error; // Re-throw to let NextAuth handle the response
  }
} 