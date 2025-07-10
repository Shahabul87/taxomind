import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentGovernanceService } from "@/lib/content-governance";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const isActive = searchParams.get('isActive') === 'true';

    const templates = await db.approvalWorkflowTemplate.findMany({
      where: {
        ...(contentType && { contentType }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        },
        author: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return Response.json({ templates });
  } catch (error) {
    console.error("[WORKFLOW_TEMPLATES_GET]", error);
    return Response.json(
      { error: "Failed to fetch workflow templates" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, description, contentType, category, stages, isDefault } = body;

    if (!name || !contentType || !stages || !Array.isArray(stages)) {
      return Response.json(
        { error: "Name, content type, and stages are required" },
        { status: 400 }
      );
    }

    const template = await ContentGovernanceService.createWorkflowTemplate({
      name,
      description,
      contentType,
      category,
      stages,
      isDefault
    });

    return Response.json({ template });
  } catch (error) {
    console.error("[WORKFLOW_TEMPLATES_POST]", error);
    return Response.json(
      { error: "Failed to create workflow template" },
      { status: 500 }
    );
  }
});