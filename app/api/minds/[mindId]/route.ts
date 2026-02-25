import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { z } from "zod";
import { successResponse, apiErrors } from "@/lib/utils/api-response";

const UpdateMindSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  content: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  visibility: z.string().max(50).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.string().max(50).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

interface MindUpdateData {
  title?: string;
  description?: string | null;
  content?: string | null;
  category?: string | null;
  visibility?: string | null;
  tags?: string[];
  status?: string | null;
}

export async function PATCH(req: Request, props: { params: Promise<{ mindId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    if (!params.mindId) {
      return apiErrors.badRequest("Mind ID is required");
    }

    const values = await req.json();
    const result = UpdateMindSchema.safeParse(values);

    if (!result.success) {
      return apiErrors.validationError({ errors: result.error.flatten().fieldErrors });
    }

    const { title, description, content, category, visibility, tags, status } = result.data;

    const updateData: MindUpdateData = {};

    // Only include fields that are provided in the request
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;

    const mind = await db.mind.update({
      where: {
        id: params.mindId,
        userId: session.user.id,
      },
      data: updateData,
    });

    return successResponse(mind);
  } catch (error) {
    logger.error("[MIND_PATCH]", error);
    return apiErrors.internal();
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ mindId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    if (!params.mindId) {
      return apiErrors.badRequest("Mind ID is required");
    }

    await db.mind.delete({
      where: {
        id: params.mindId,
        userId: session.user.id,
      },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    logger.error("[MIND_DELETE]", error);
    return apiErrors.internal();
  }
}