import { NextRequest, NextResponse } from "next/server";
import { authenticateDynamicRoute } from "@/lib/auth-dynamic";
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {

    const user = await authenticateDynamicRoute(request);
    
    if (!user || !user.id) {
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
        role: user.role
      },
      message: "Authentication successful",
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    logger.error("[AUTH_TEST] Error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {

    const user = await authenticateDynamicRoute(request);
    
    if (!user || !user.id) {
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
        role: user.role
      },
      requestBody: body,
      message: "Authentication and request processing successful",
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    logger.error("[AUTH_TEST] Error:", error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 