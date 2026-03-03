import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BillCategory, BillStatus, RecurringType } from "@prisma/client";
import { logger } from '@/lib/logger';
import { z } from 'zod';

const BillCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  category: z.nativeEnum(BillCategory),
  amount: z.number().positive().max(999999999),
  currency: z.string().max(10).default("USD"),
  startDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  status: z.nativeEnum(BillStatus).default("UNPAID"),
  recurringType: z.nativeEnum(RecurringType).optional().nullable(),
  recurringPeriod: z.number().int().positive().optional().nullable(),
  notifyBefore: z.number().int().min(0).max(90).default(3),
  notifyEmail: z.boolean().default(true),
  notifySMS: z.boolean().default(false),
  autoPayEnabled: z.boolean().default(false),
  paymentMethod: z.string().max(100).optional().nullable(),
  accountNumber: z.string().max(100).optional().nullable(),
  provider: z.string().max(255).optional().nullable(),
  accountId: z.string().max(255).optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
  supportContact: z.string().max(255).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const values = BillCreateSchema.parse(body);

    const bill = await db.bill.create({
      data: {
        id: crypto.randomUUID(),
        ...values,
        userId: session.user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    logger.error("[BILLS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    //console.log("Session:", session);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Remove date filter temporarily to check if any bills exist
    const bills = await db.bill.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        BillAttachment: true,
        BillPayment: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 200,
    });
    return NextResponse.json(bills);
  } catch (error) {
    logger.error("[BILLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
