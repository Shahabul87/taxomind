import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Request data export (GDPR compliance)
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const format = body.format || 'json'; // json or csv

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Invalid format. Must be 'json' or 'csv'" },
        { status: 400 }
      );
    }

    // Check if there's already a pending export request
    const existingRequest = await db.dataExportRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['pending', 'processing'],
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending export request. Please wait for it to complete."
        },
        { status: 400 }
      );
    }

    // Create new export request
    const exportRequest = await db.dataExportRequest.create({
      data: {
        userId: user.id,
        format: format,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // In a real implementation, you would:
    // 1. Queue a background job to gather all user data
    // 2. Generate the export file (JSON or CSV)
    // 3. Upload to secure storage (S3, etc.)
    // 4. Send email notification when ready
    // 5. Update the export request with downloadUrl

    // For now, we'll just return the request ID
    return NextResponse.json({
      success: true,
      data: {
        requestId: exportRequest.id,
        format: exportRequest.format,
        status: exportRequest.status,
        message: "Export request created successfully. You will receive an email when your data is ready to download.",
        estimatedTime: "Within 48 hours",
        expiresAt: exportRequest.expiresAt,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Data export request error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create export request",
      },
      { status: 500 }
    );
  }
}

// GET - Get export request status
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all export requests for this user
    const exportRequests = await db.dataExportRequest.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Last 10 requests
    });

    return NextResponse.json({
      success: true,
      data: exportRequests.map((request) => ({
        id: request.id,
        format: request.format,
        status: request.status,
        downloadUrl: request.downloadUrl,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        expiresAt: request.expiresAt,
        isExpired: request.expiresAt ? new Date(request.expiresAt) < new Date() : false,
      })),
      metadata: {
        timestamp: new Date().toISOString(),
        count: exportRequests.length,
      },
    });

  } catch (error) {
    console.error("Export request fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch export requests",
      },
      { status: 500 }
    );
  }
}
