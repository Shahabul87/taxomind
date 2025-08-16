import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {

    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        authenticated: false 
      }, { status: 401 });
    }

        // Try to perform a simple write operation using existing field    const testResult = await db.user.update({      where: { id: user.id },      data: {         name: user.name || `Test-${Date.now()}` // Update name field      }    });    console.log("[DB_WRITE_TEST] Write operation successful");        return NextResponse.json({       success: true,      message: "Database write test successful",      userId: testResult.id,      timestamp: new Date().toISOString()    });
    
  } catch (error) {
    logger.error("[DB_WRITE_TEST] Error:", error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: "Database write operation failed"
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test read operation
    const userCount = await db.user.count();
    
    return NextResponse.json({ 
      success: true,
      message: "Database read test successful",
      userCount
    });
    
  } catch (error) {
    logger.error("[DB_READ_TEST] Error:", error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 