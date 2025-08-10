import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BillCategory, BillStatus } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    const bill = await db.bill.create({
      data: {
        ...values,
        userId: session.user.id,
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
    });

    //console.log("All bills found:", bills);
    return NextResponse.json(bills);
  } catch (error) {
    logger.error("[BILLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 