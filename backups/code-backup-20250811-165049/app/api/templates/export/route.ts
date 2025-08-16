import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateIds = searchParams.get("templateIds")?.split(",") || [];
    const contentType = searchParams.get("contentType");
    const category = searchParams.get("category");
    const authorId = searchParams.get("authorId");
    const format = searchParams.get("format") || "json";

    // Build where clause
    const where: any = {};

    if (templateIds.length > 0) {
      where.id = { in: templateIds };
    }

    if (contentType) {
      where.contentType = contentType;
    }

    if (category) {
      where.category = category;
    }

    if (authorId) {
      where.authorId = authorId;
    } else if (user.role !== UserRole.ADMIN) {
      where.authorId = user.id;
    }

    // Ensure user can only export templates they have access to
    if (user.role !== UserRole.ADMIN) {
      where.OR = [
        { authorId: user.id },
        { isPublic: true }
      ];
    }

    // Get templates
    const templates = await db.contentTemplate.findMany({
      where,
      include: {
        author: {
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
    const exportData = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      contentType: template.contentType,
      category: template.category,
      templateData: JSON.parse(template.templateData as string),
      tags: template.tags,
      isPublic: template.isPublic,
      isOfficial: template.isOfficial,
      usageCount: template.usageCount,
      author: template.author,
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

      const csvRows = exportData.map(template => [
        template.id,
        template.name,
        template.description || "",
        template.contentType,
        template.category || "",
        template.tags.join(";"),
        template.isPublic.toString(),
        template.isOfficial.toString(),
        template.usageCount.toString(),
        template.author.name || "",
        template.author.email || "",
        template.createdAt.toISOString(),
        template.updatedAt.toISOString()
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(","))
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

  } catch (error) {
    logger.error("Template export error:", error);
    return NextResponse.json(
      { error: "Failed to export templates" },
      { status: 500 }
    );
  }
}