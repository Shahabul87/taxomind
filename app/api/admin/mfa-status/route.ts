import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminMFAInfo } from "@/lib/auth/mfa-enforcement";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request as Request);
    const rateLimitResult = await rateLimit(
      identifier,
      10, // 10 requests
      60 * 1000 // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    // Get MFA info for the admin user
    const mfaInfo = await getAdminMFAInfo(session.user.id);

    if (!mfaInfo) {
      return NextResponse.json(
        { error: "Failed to retrieve MFA information" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mfaInfo,
    });
  } catch (error) {
    console.error("[ADMIN_MFA_STATUS_API_ERROR]", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}