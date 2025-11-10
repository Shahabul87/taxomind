import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Validation schema for creating templates
const CreateTemplateSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  category: z.string().min(1).max(50),
  variables: z.array(z.string()).optional().default([]),
  isDefault: z.boolean().optional().default(false),
});

// Validation schema for updating templates
const UpdateTemplateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(5000).optional(),
  category: z.string().min(1).max(50).optional(),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/messages/templates - Get message templates
export async function GET(req: Request) {
  try {
    const session = await currentUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const includeDefaults = searchParams.get("includeDefaults") !== "false";

    const where: any = {
      OR: [
        { userId: session.id },
      ],
    };

    // Include default templates
    if (includeDefaults) {
      where.OR.push({ isDefault: true, userId: null });
    }

    if (category) {
      where.category = category;
    }

    const templates = await db.messageTemplate.findMany({
      where,
      orderBy: [
        { isDefault: "desc" }, // Default templates first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[TEMPLATES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/messages/templates - Create a new template
export async function POST(req: Request) {
  try {
    const session = await currentUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateTemplateSchema.parse(body);

    const template = await db.messageTemplate.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category,
        variables: validatedData.variables,
        isDefault: false, // Users cannot create default templates
        userId: session.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[TEMPLATES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/templates - Update a template
export async function PATCH(req: Request) {
  try {
    const session = await currentUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, ...updateData } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    const validatedData = UpdateTemplateSchema.parse(updateData);

    // Verify ownership
    const template = await db.messageTemplate.findFirst({
      where: {
        id: templateId,
        userId: session.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found or access denied" },
        { status: 404 }
      );
    }

    // Cannot make user templates default
    if (validatedData.isDefault === true) {
      delete validatedData.isDefault;
    }

    const updatedTemplate = await db.messageTemplate.update({
      where: { id: templateId },
      data: validatedData,
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[TEMPLATES_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/templates - Delete a template
export async function DELETE(req: Request) {
  try {
    const session = await currentUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const template = await db.messageTemplate.findFirst({
      where: {
        id: templateId,
        userId: session.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found or access denied" },
        { status: 404 }
      );
    }

    await db.messageTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEMPLATES_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
