import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function POST(req: Request, props: { params: Promise<{ billId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();
    const { amount, method, reference } = values;

    // Create payment record
    const payment = await db.billPayment.create({
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

    // Update bill status and last payment details
    await db.bill.update({
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

    return NextResponse.json(payment);
  } catch (error) {
    logger.error("[BILL_PAYMENT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 