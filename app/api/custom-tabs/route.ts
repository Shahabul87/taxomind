import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const userId = user?.id

    const { label, icon } = await req.json();

    const customTab = await db.customTab.create({
      data: {
        id: crypto.randomUUID(),
        label,
        icon,
        userId: userId,
      },
    });

    return NextResponse.json(customTab);
  } catch (error) {
    logger.error("[CUSTOM_TABS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 