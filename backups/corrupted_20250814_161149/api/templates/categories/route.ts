import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType") || undefined;

    // Build where clause
    const where: any = {
      OR: [
        { isPublic: true },
        { userId: user.id }
      ]
    };

    // Note: contentType field doesn't exist in aIContentTemplate model
    // if (contentType) {
    //   where.contentType = contentType;
    // }

    // Note: category and contentType fields don't exist in aIContentTemplate model
    const categories: any[] = [];
    const contentTypes: any[] = [];

    // Note: tags field doesn't exist in aIContentTemplate model
    const popularTags: any[] = [];

    return NextResponse.json({
      categories: categories.map((cat: any) => ({
        name: cat.category || "Uncategorized",
        count: cat._count.id
      })),
      contentTypes: contentTypes.map((ct: any) => ({
        name: ct.contentType,
        count: ct._count.id
      })),
      popularTags
    });

  } catch (error: any) {
    logger.error("Template categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template categories" },
      { status: 500 }
    );
  }
}