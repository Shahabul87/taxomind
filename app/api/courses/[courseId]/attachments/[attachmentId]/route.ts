import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/google-drive";
import { logger } from "@/lib/logger";

export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; attachmentId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch attachment to get fileId before deletion
    const existing = await db.attachment.findUnique({
      where: {
        id: params.attachmentId,
        courseId: params.courseId,
      },
      select: { fileId: true },
    });

    // Delete from Google Drive if a fileId exists (log errors, don't block)
    if (existing?.fileId) {
      const deleted = await deleteFile(existing.fileId);
      if (!deleted) {
        logger.warn('[Attachment] Google Drive file deletion failed, proceeding with DB deletion', {
          fileId: existing.fileId,
          attachmentId: params.attachmentId,
        });
      }
    }

    const attachment = await db.attachment.delete({
      where: {
        courseId: params.courseId,
        id: params.attachmentId,
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    logger.error('[Attachment] Delete failed', { error });
    return new NextResponse("Internal Error", { status: 500 });
  }
}
