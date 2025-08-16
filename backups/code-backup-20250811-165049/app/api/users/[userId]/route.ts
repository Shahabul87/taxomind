import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const userDetails = await db.user.findUnique({
      where: {
        id: params.userId,
      },
      include: {
        profileLinks: true,
      },
    });

    return NextResponse.json(userDetails);
  } catch (error) {
    logger.error("[USER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    
    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { image } = await req.json();

    const updatedUser = await db.user.update({
      where: {
        id: params.userId
      },
      data: {
        image
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error("[USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 