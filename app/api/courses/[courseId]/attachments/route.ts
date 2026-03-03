import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

export const runtime = 'nodejs';

const AttachmentSchema = z.object({
  url: z.string().min(1, "URL is required"),
  name: z.string().optional(),
  fileId: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  storageProvider: z.string().optional(),
});

export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const userId = user.id;
    const body = await req.json();
    const validated = AttachmentSchema.parse(body);

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    const attachment = await db.attachment.create({
      data: {
        url: validated.url,
        name: validated.name ?? validated.url.split("/").pop() ?? "Untitled",
        courseId: params.courseId,
        fileId: validated.fileId,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        storageProvider: validated.storageProvider ?? "google-drive",
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return ApiResponses.internal();
  }
}
