import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { z } from 'zod';

const TicketCreateSchema = z.object({
  subject: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  message: z.string().min(1).max(10000),
}).strict();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const values = TicketCreateSchema.parse(body);

    const ticket = await db.supportTicket.create({
      data: {
        id: crypto.randomUUID(),
        ...values,
        userId: session.user.id,
        status: "OPEN",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    logger.error("[SUPPORT_TICKET_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 