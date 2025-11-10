import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateBlogPlanSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const blogPlan = await db.dashboardBlogPlan.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!blogPlan) return errorResponse(ErrorCodes.NOT_FOUND, "Blog plan not found", HttpStatus.NOT_FOUND);
    return successResponse(blogPlan);
  } catch (error) {
    console.error("[BLOG_PLAN_GET]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch blog plan", HttpStatus.INTERNAL_ERROR);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const existing = await db.dashboardBlogPlan.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return errorResponse(ErrorCodes.NOT_FOUND, "Blog plan not found", HttpStatus.NOT_FOUND);

    const body = await req.json();
    const validatedData = updateBlogPlanSchema.parse({ ...body, id: params.id });

    const blogPlan = await db.dashboardBlogPlan.update({
      where: { id: params.id },
      data: validatedData,
    });

    return successResponse(blogPlan);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    console.error("[BLOG_PLAN_PATCH]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update blog plan", HttpStatus.INTERNAL_ERROR);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const existing = await db.dashboardBlogPlan.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return errorResponse(ErrorCodes.NOT_FOUND, "Blog plan not found", HttpStatus.NOT_FOUND);

    await db.dashboardBlogPlan.delete({ where: { id: params.id } });
    return successResponse({ id: params.id });
  } catch (error) {
    console.error("[BLOG_PLAN_DELETE]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to delete blog plan", HttpStatus.INTERNAL_ERROR);
  }
}
