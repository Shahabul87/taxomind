import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Generate a unique affiliate code
function generateAffiliateCode(userId: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AFF${userId.substring(0, 4).toUpperCase()}${randomSuffix}`;
}

export async function POST() {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is already an affiliate
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isAffiliate: true, affiliateCode: true }
    });

    if (existingUser?.isAffiliate) {
      return NextResponse.json(
        { success: false, error: "User is already an affiliate" },
        { status: 400 }
      );
    }

    // Generate unique affiliate code
    const affiliateCode = generateAffiliateCode(user.id);

    // Update user to become an affiliate
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isAffiliate: true,
        affiliateCode: affiliateCode,
        affiliateActivatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        isAffiliate: updatedUser.isAffiliate,
        affiliateCode: updatedUser.affiliateCode,
        affiliateActivatedAt: updatedUser.affiliateActivatedAt
      }
    });
  } catch (error) {
    console.error("[BECOME_AFFILIATE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}