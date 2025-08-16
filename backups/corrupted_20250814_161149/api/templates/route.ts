import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole, AITemplateType } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType") || undefined;
    const category = searchParams.get("category") || undefined;
    const isPublic = searchParams.get("isPublic") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};

    // Note: contentType and category fields don't exist in aIContentTemplate model
    // if (contentType) {
    //   where.contentType = contentType;
    // }

    // if (category) {
    //   where.category = category;
    // }

    if (isPublic !== null) {
      where.OR = [
        { isPublic: isPublic === "true" },
        { creatorId: user.id }
      ];
    } else {
      where.OR = [
        { isPublic: true },
        { creatorId: user.id }
      ];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
        // Note: tags field doesn't exist in aIContentTemplate model
        // { tags: { hasSome: [search] } }
      ];
    }

    // Get templates with pagination
    const templates = await db.aIContentTemplate.findMany({
      where,
      include: {
        User: {
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
    const total = await db.aIContentTemplate.count({ where });

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
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
    if (!user || !user.id) {
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
    if (!name || !templateData) {
      return NextResponse.json(
        { error: "Name and template data are required" },
        { status: 400 }
      );
    }

    // Create template
    const template = await db.aIContentTemplate.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        templateType: AITemplateType.COURSE_OUTLINE,
        promptTemplate: JSON.stringify(templateData),
        updatedAt: new Date()
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

    return NextResponse.json(template, { status: 201 });

  } catch (error: any) {
    logger.error("Templates POST error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}