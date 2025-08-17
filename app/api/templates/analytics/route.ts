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
    const templateId = searchParams.get("templateId");
    const authorId = searchParams.get("authorId");
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
      where.authorId = authorId;
    } else if (user.role !== UserRole.ADMIN) {
      where.authorId = user.id;
    }

    // Get template usage analytics
    const templates = await db.aIContentTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        usageCount: true,
        createdAt: true,
        templateType: true,
        category: true,
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

    // Get usage by content type
    const usageByType = await db.aIContentTemplate.groupBy({
      by: ['templateType'],
      where,
      _sum: {
        usageCount: true
      },
      _count: {
        id: true
      }
    });

    // Get usage by category
    const usageByCategory = await db.aIContentTemplate.groupBy({
      by: ['category'],
      where,
      _sum: {
        usageCount: true
      },
      _count: {
        id: true
      }
    });

    // Get most active authors (if admin)
    let topAuthors: any[] = [];
    if (user.role === UserRole.ADMIN) {
      topAuthors = []; // Simplified - groupBy operation too complex for current schema

      // Get author details
      const authorIds = topAuthors.map(a => a.authorId);
      const authors = await db.user.findMany({
        where: { id: { in: authorIds } },
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      });

      topAuthors = topAuthors.map(author => ({
        ...author,
        author: authors.find(a => a.id === author.authorId)
      }));
    }

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

  } catch (error) {
    logger.error("Template analytics GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template analytics" },
      { status: 500 }
    );
  }
}