import { NextRequest, NextResponse } from "next/server";
import { authenticateDynamicRoute } from "@/lib/auth-dynamic";
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {

    const user = await authenticateDynamicRoute(request);
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: "No valid authentication found",
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "Authentication successful",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error("[AUTH_TEST] Error:", error);
    return safeErrorResponse(error, 500, 'AUTH_DYNAMIC_TEST_GET');
  }
}

export async function POST(request: NextRequest) {
  try {

    const user = await authenticateDynamicRoute(request);
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: "No valid authentication found",
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }
    
    const body = await request.json();
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      requestBody: body,
      message: "Authentication and request processing successful",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error("[AUTH_TEST] Error:", error);
    return safeErrorResponse(error, 500, 'AUTH_DYNAMIC_TEST_POST');
  }
} 