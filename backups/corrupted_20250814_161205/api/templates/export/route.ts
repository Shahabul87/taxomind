import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateIds = searchParams.get("templateIds")?.split(",") || [];
    const contentType = searchParams.get("contentType") || undefined;
    const category = searchParams.get("category") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const format = searchParams.get("format") || "json";

    // Build where clause
    const where: any = {};

    if (templateIds.length > 0) {
      where.id = { in: templateIds };
    }

    // Note: contentType and category fields don't exist in aIContentTemplate model
    // if (contentType) {
    //   where.contentType = contentType;
    // }

    // if (category) {
    //   where.category = category;
    // }

    if (authorId) {
      where.userId = authorId;
    } else if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    }

    // Ensure user can only export templates they have access to
    if (user.role !== UserRole.ADMIN) {
      where.OR = [
        { userId: user.id },
        { isPublic: true }
      ];
    }

    // Get templates
    const templates = await db.aIContentTemplate.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format for export
    const exportData = templates.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description || "",
      contentType: "", // Field doesn't exist in aIContentTemplate
      category: "", // Field doesn't exist in aIContentTemplate
      templateData: template.templateData ? JSON.parse(template.templateData as string) : {},
      tags: [], // Field doesn't exist in aIContentTemplate
      isPublic: template.isPublic || false,
      isOfficial: template.isOfficial || false,
      usageCount: template.usageCount || 0,
      author: template.User,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }));

    if (format === "csv") {
      // Convert to CSV format
      const csvHeaders = [
        "ID",
        "Name",
        "Description",
        "Content Type",
        "Category",
        "Tags",
        "Is Public",
        "Is Official",
        "Usage Count",
        "Author Name",
        "Author Email",
        "Created At",
        "Updated At"
      ];

      const csvRows = exportData.map((template: any) => [
        template.id,
        template.name,
        template.description || "",
        template.contentType,
        template.category || "",
        template.tags?.join(";") || "",
        template.isPublic.toString(),
        template.isOfficial.toString(),
        template.usageCount.toString(),
        template.author.name || "",
        template.author.email || "",
        template.createdAt.toISOString(),
        template.updatedAt.toISOString()
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map((cell: any) => `"${cell}"`).join(","))
        .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="templates-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Default JSON format
    const exportPackage = {
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      totalTemplates: exportData.length,
      templates: exportData
    };

    return new NextResponse(JSON.stringify(exportPackage, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="templates-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error: any) {
    logger.error("Template export error:", error);
    return NextResponse.json(
      { error: "Failed to export templates" },
      { status: 500 }
    );
  }
}