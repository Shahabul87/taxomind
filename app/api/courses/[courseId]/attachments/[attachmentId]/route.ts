import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string, attachmentId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

    const userId = user?.id;
    
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const attachment = await db.attachment.delete({
      where: {
        courseId: params.courseId,
        id: params.attachmentId,
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}