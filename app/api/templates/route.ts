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
    const contentType = searchParams.get("contentType");
    const category = searchParams.get("category");
    const isPublic = searchParams.get("isPublic");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};

    if (contentType) {
      where.contentType = contentType;
    }

    if (category) {
      where.category = category;
    }

    if (isPublic !== null) {
      where.OR = [
        { isPublic: isPublic === "true" },
        { authorId: user.id }
      ];
    } else {
      where.OR = [
        { isPublic: true },
        { authorId: user.id }
      ];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } }
      ];
    }

    // Get templates with pagination
    const templates = await db.contentTemplate.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count for pagination
    const total = await db.contentTemplate.count({ where });

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error("Templates GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      contentType,
      category,
      templateData,
      isPublic = false,
      tags = []
    } = body;

    // Validate required fields
    if (!name || !contentType || !templateData) {
      return NextResponse.json(
        { error: "Name, content type, and template data are required" },
        { status: 400 }
      );
    }

    // Create template
    const template = await db.contentTemplate.create({
      data: {
        name,
        description,
        contentType,
        category,
        templateData: JSON.stringify(templateData),
        authorId: user.id,
        isPublic,
        isOfficial: user.role === UserRole.ADMIN,
        tags
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(template, { status: 201 });

  } catch (error) {
    logger.error("Templates POST error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}