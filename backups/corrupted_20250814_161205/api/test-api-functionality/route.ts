import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {

    const user = await currentUser();
    
    return NextResponse.json({
      success: true,
      message: "API is working correctly",
      timestamp: new Date().toISOString(),
      method: "GET",
      authenticated: !!user,
      userId: user?.id || null,
      environment: process.env.NODE_ENV
    });
  } catch (error: any) {
    logger.error("[API_TEST] GET error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      method: "GET"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {

    const body = await req.json().catch(() => ({}));
    const user = await currentUser();
    
    // Test database connection
    let dbTest = null;
    try {
      const courseCount = await db.course.count();
      dbTest = { success: true, courseCount };
    } catch (dbError) {
      dbTest = { success: false, error: dbError instanceof Error ? dbError.message : "DB error" };
    }
    
    return NextResponse.json({
      success: true,
      message: "API POST is working correctly",
      timestamp: new Date().toISOString(),
      method: "POST",
      receivedData: body,
      authenticated: !!user,
      userId: user?.id || null,
      environment: process.env.NODE_ENV,
      databaseTest: dbTest
    });
  } catch (error: any) {
    logger.error("[API_TEST] POST error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      method: "POST"
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {

    const body = await req.json().catch(() => ({}));
    const user = await currentUser();
    
    return NextResponse.json({
      success: true,
      message: "API PUT is working correctly",
      timestamp: new Date().toISOString(),
      method: "PUT",
      receivedData: body,
      authenticated: !!user,
      userId: user?.id || null,
      environment: process.env.NODE_ENV
    });
  } catch (error: any) {
    logger.error("[API_TEST] PUT error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      method: "PUT"
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {

    const user = await currentUser();
    
    return NextResponse.json({
      success: true,
      message: "API DELETE is working correctly",
      timestamp: new Date().toISOString(),
      method: "DELETE",
      authenticated: !!user,
      userId: user?.id || null,
      environment: process.env.NODE_ENV
    });
  } catch (error: any) {
    logger.error("[API_TEST] DELETE error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      method: "DELETE"
    }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 