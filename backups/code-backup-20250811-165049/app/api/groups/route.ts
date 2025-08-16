import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const createGroupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Please provide a meaningful description"),
  imageUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  category: z.string(),
  categoryId: z.string().optional(),
  privacy: z.enum(["public", "private", "invite-only"]),
  isPrivate: z.boolean().default(false),
  rules: z.array(z.string()),
  tags: z.array(z.string()),
  courseId: z.string().optional().nullable(),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  meetUrl: z.string().optional(),
  allowJoinRequests: z.boolean().default(true),
  autoApproveMembers: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = createGroupSchema.parse(body);

    if (validatedData.courseId) {
      const enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: validatedData.courseId,
          },
        },
      });

      if (!enrollment) {
        return new NextResponse("Not enrolled in this course", { status: 403 });
      }
    }

    // If categoryId is provided, validate it exists
    if (validatedData.categoryId) {
      const category = await db.category.findUnique({
        where: { id: validatedData.categoryId }
      });

      if (!category) {
        validatedData.categoryId = undefined;
      }
    }

    const group = await db.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        category: validatedData.category,
        privacy: validatedData.privacy,
        isPrivate: validatedData.isPrivate, // Use the isPrivate field from form
        rules: validatedData.rules,
        tags: validatedData.tags,
        courseId: validatedData.courseId || undefined,
        categoryId: validatedData.categoryId || undefined,
        creatorId: session.user.id,
      },
    });

    await db.groupMember.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        groupId: group.id,
        role: "admin",
        status: "active",
      },
    });

    // Create a welcome post for the group
    await db.groupDiscussion.create({
      data: {
        id: randomUUID(),
        title: "Welcome to the group!",
        content: `👋 Welcome to ${validatedData.name}! This is the first discussion in our group. Feel free to introduce yourself and share what you hope to gain from this community.`,
        groupId: group.id,
        authorId: session.user.id,
      }
    });

    const groupWithMember = await db.group.findUnique({
      where: { id: group.id },
      include: {
        GroupMember: true,
        Course: {
          select: {
            title: true,
            imageUrl: true,
          },
        },
        Category: true,
      },
    });

    return NextResponse.json(groupWithMember);
  } catch (error) {
    logger.error("[GROUPS_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
} 