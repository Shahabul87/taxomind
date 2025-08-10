import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType");

    // Build where clause
    const where: any = {
      OR: [
        { isPublic: true },
        { authorId: user.id }
      ]
    };

    if (contentType) {
      where.contentType = contentType;
    }

    // Get unique categories with counts
    const categories = await db.contentTemplate.groupBy({
      by: ['category'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get content types with counts
    const contentTypes = await db.contentTemplate.groupBy({
      by: ['contentType'],
      where: {
        OR: [
          { isPublic: true },
          { authorId: user.id }
        ]
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get popular tags
    const templates = await db.contentTemplate.findMany({
      where,
      select: {
        tags: true
      }
    });

    const tagCounts = new Map<string, number>();
    templates.forEach(template => {
      template.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const popularTags = Array.from(tagCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({
      categories: categories.map(cat => ({
        name: cat.category || "Uncategorized",
        count: cat._count.id
      })),
      contentTypes: contentTypes.map(ct => ({
        name: ct.contentType,
        count: ct._count.id
      })),
      popularTags
    });

  } catch (error) {
    logger.error("Template categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template categories" },
      { status: 500 }
    );
  }
}