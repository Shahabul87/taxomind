import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BillCategory, BillStatus, RecurringType } from "@prisma/client";
import { logger } from '@/lib/logger';
import { z } from 'zod';

const BillUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.nativeEnum(BillCategory).optional(),
  amount: z.number().positive().max(999999999).optional(),
  currency: z.string().max(10).optional(),
  startDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  status: z.nativeEnum(BillStatus).optional(),
  recurringType: z.nativeEnum(RecurringType).optional().nullable(),
  recurringPeriod: z.number().int().positive().optional().nullable(),
  notifyBefore: z.number().int().min(0).max(90).optional(),
  notifyEmail: z.boolean().optional(),
  notifySMS: z.boolean().optional(),
  autoPayEnabled: z.boolean().optional(),
  paymentMethod: z.string().max(100).optional().nullable(),
  accountNumber: z.string().max(100).optional().nullable(),
  provider: z.string().max(255).optional().nullable(),
  accountId: z.string().max(255).optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
  supportContact: z.string().max(255).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  lastPaidAmount: z.number().positive().optional().nullable(),
  lastPaidDate: z.string().or(z.date()).optional().nullable(),
}).strict();

export async function PATCH(req: Request, props: { params: Promise<{ billId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const values = BillUpdateSchema.parse(body);
    const bill = await db.bill.update({
      where: {
        id: params.billId,
        userId: session.user.id,
      },
      data: values,
    });

    return NextResponse.json(bill);
  } catch (error) {
    logger.error("[BILL_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ billId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.bill.delete({
      where: {
        id: params.billId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[BILL_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
