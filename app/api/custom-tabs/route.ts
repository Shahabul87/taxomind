import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

const CreateTabSchema = z.object({
  label: z.string().min(1, "Label is required").max(50, "Label must be 50 characters or less").trim(),
  icon: z.string().min(1, "Icon is required").max(50, "Icon name too long").trim(),
});

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateTabSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { label, icon } = validated.data;

    const customTab = await db.customTab.create({
      data: {
        id: crypto.randomUUID(),
        label,
        icon,
        userId: user.id,
      },
    });

    return NextResponse.json(customTab);
  } catch (error) {
    logger.error("[CUSTOM_TABS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
} 