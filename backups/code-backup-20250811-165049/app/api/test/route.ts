import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint that always returns success
export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, message: "API endpoint is working" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({ 
      success: true, 
      message: "API endpoint is working",
      receivedData: body
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: "Error parsing request body",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
} 