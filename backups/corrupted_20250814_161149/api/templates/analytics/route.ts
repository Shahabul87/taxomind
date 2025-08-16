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
    const templateId = searchParams.get("templateId") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const period = searchParams.get("period") || "7d"; // 7d, 30d, 90d, 1y

    // Calculate date range
    const now = new Date();
    const daysBack = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365
    }[period] || 7;

    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Base where clause
    const where: any = {
      createdAt: {
        gte: startDate
      }
    };

    // Filter by template or author
    if (templateId) {
      where.id = templateId;
    } else if (authorId) {
      where.userId = authorId;
    } else if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    }

    // Get template usage analytics
    const templates = await db.aIContentTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        usageCount: true,
        createdAt: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        usageCount: 'desc'
      }
    });

    // Get total statistics
    const totalTemplates = await db.aIContentTemplate.count({ where });
    const totalUsage = templates.reduce((sum: number, template: any) => sum + template.usageCount, 0);

    // Note: contentType and category fields don't exist in aIContentTemplate model
    const usageByType: any[] = [];
    const usageByCategory: any[] = [];

    // Note: Unable to group by author due to schema limitations
    let topAuthors: any[] = [];

    // Get recent activity
    const recentActivity = await db.aIContentTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        usageCount: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20
    });

    return NextResponse.json({
      overview: {
        totalTemplates,
        totalUsage,
        averageUsage: totalTemplates > 0 ? totalUsage / totalTemplates : 0,
        period
      },
      templates,
      usageByType: usageByType.map((item: any) => ({
        contentType: item.contentType,
        templateCount: item._count.id,
        totalUsage: item._sum.usageCount || 0
      })),
      usageByCategory: usageByCategory.map((item: any) => ({
        category: item.category || "Uncategorized",
        templateCount: item._count.id,
        totalUsage: item._sum.usageCount || 0
      })),
      topAuthors,
      recentActivity
    });

  } catch (error: any) {
    logger.error("Template analytics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template analytics" },
      { status: 500 }
    );
  }
}