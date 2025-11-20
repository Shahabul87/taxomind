import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { templateId } = await params;
    const template = await db.aIContentTemplate.findUnique({
      where: { id: templateId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user can access this template
    // Check if user is admin - admins are now in AdminAccount table
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: user.id },
    });
    const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

    if (!template.isPublic && template.creatorId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(template);

  } catch (error) {
    logger.error("Template GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { templateId } = await params;
    const template = await db.aIContentTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check permissions
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: user.id },
    });
    const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

    if (template.creatorId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      templateData,
      isPublic,
      tags
    } = body;

    const updatedTemplate = await db.aIContentTemplate.update({
      where: { id: templateId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(templateData && { templateData: JSON.stringify(templateData) }),
        ...(isPublic !== undefined && { isPublic }),
        ...(tags && { tags }),
        ...(isAdmin && { isOfficial: true })
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    logger.error("Template PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { templateId } = await params;
    const template = await db.aIContentTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check permissions
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: user.id },
    });
    const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

    if (template.creatorId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await db.aIContentTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ message: "Template deleted successfully" });

  } catch (error) {
    logger.error("Template DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}