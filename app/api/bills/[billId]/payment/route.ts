import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const PaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.string().min(1).max(100),
  reference: z.string().min(1).max(200),
});

export async function POST(req: NextRequest, props: { params: Promise<{ billId: string }> }) {
  const params = await props.params;

  const rateLimitResponse = await withRateLimit(req, 'heavy');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = PaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, method, reference } = parsed.data;

    // Verify bill belongs to current user before creating payment
    const bill = await db.bill.findFirst({
      where: {
        id: params.billId,
        userId: session.user.id,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Use transaction to ensure atomicity
    const payment = await db.$transaction(async (tx) => {
      const newPayment = await tx.billPayment.create({
        data: {
          id: `payment-${Date.now()}`,
          amount,
          method,
          reference,
          paymentDate: new Date(),
          status: "successful",
          billId: params.billId,
        },
      });

      await tx.bill.update({
        where: {
          id: params.billId,
          userId: session.user.id,
        },
        data: {
          status: "PAID",
          lastPaidAmount: amount,
          lastPaidDate: new Date(),
        },
      });

      return newPayment;
    });

    return NextResponse.json(payment);
  } catch (error) {
    logger.error("[BILL_PAYMENT_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
