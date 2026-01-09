/**
 * Google Calendar OAuth Authorization
 * Phase 4: Google Calendar Integration
 *
 * GET /api/calendar/auth - Get OAuth authorization URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { generateAuthUrl } from '@/lib/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if Google Calendar credentials are configured
    if (!process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_CONFIGURED',
            message: 'Google Calendar integration is not configured',
          },
        },
        { status: 503 }
      );
    }

    // Generate state parameter with user ID for security
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7),
      })
    ).toString('base64');

    const authUrl = generateAuthUrl(state);

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });
  } catch (error) {
    console.error('Calendar Auth Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate authorization URL',
        },
      },
      { status: 500 }
    );
  }
}
