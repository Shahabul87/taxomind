// File: /pages/api/users/[userId]/profile-links/reorder.ts

import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function PUT(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { list } = await req.json();
    
    // Validate input data
    if (!Array.isArray(list) || list.length === 0) {
      return new NextResponse("Invalid data: 'list' must be a non-empty array", { status: 400 });
    }

    // Validate each item in the list
    for (const item of list) {
      if (typeof item.id !== "string" || typeof item.position !== "number") {

        return new NextResponse("Each item must have a valid 'id' (string) and 'position' (number)", { status: 400 });
      }
    }

    // Extract IDs for validation
    const linkIds = list.map(item => item.id);
    
    // Verify all links belong to this user
    const existingLinks = await db.profileLink.findMany({
      where: {
        id: { in: linkIds },
        userId: params.userId
      },
      select: { id: true }
    });
    
    if (existingLinks.length !== linkIds.length) {
      return new NextResponse("Some profile links don't exist or don't belong to this user", { status: 400 });
    }

    // Performance optimization: Use Prisma transactions for bulk updates
    // This creates a single transaction for all updates instead of separate queries
    await db.$transaction(
      list.map(item => 
        db.profileLink.update({
          where: { id: item.id },
          data: { position: item.position }
        })
      )
    );

    return new NextResponse("Profile links reordered successfully", { status: 200 });
  } catch (error) {
    logger.error("[REORDER ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
  