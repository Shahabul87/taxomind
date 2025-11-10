import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Validation schema for search
const SearchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    courseId: z.string().optional(),
    category: z.enum(["GENERAL", "QUESTION", "ASSIGNMENT", "FEEDBACK", "TECHNICAL_ISSUE"]).optional(),
    senderId: z.string().optional(),
    hasAttachments: z.boolean().optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    unreadOnly: z.boolean().optional(),
  }).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// GET /api/messages/search - Advanced message search
export async function GET(req: Request) {
  try {
    const session = await currentUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const filters = searchParams.get("filters");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const parsedFilters = filters ? JSON.parse(filters) : {};

    const validatedData = SearchSchema.parse({
      query,
      filters: parsedFilters,
      limit,
      offset,
    });

    // Build where clause
    const where: any = {
      OR: [
        { senderId: session.id },
        { recipientId: session.id },
      ],
      // Full-text search in content
      content: {
        contains: validatedData.query,
        mode: "insensitive",
      },
    };

    // Apply filters
    if (validatedData.filters?.dateFrom) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(validatedData.filters.dateFrom),
      };
    }

    if (validatedData.filters?.dateTo) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(validatedData.filters.dateTo),
      };
    }

    if (validatedData.filters?.courseId) {
      where.courseId = validatedData.filters.courseId;
    }

    if (validatedData.filters?.category) {
      where.category = validatedData.filters.category;
    }

    if (validatedData.filters?.senderId) {
      where.senderId = validatedData.filters.senderId;
    }

    if (validatedData.filters?.priority) {
      where.priority = validatedData.filters.priority;
    }

    if (validatedData.filters?.unreadOnly) {
      where.read = false;
      where.recipientId = session.id;
    }

    if (validatedData.filters?.hasAttachments) {
      where.MessageAttachment = {
        some: {},
      };
    }

    // Execute search
    const messages = await db.message.findMany({
      where,
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        User_Message_recipientIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: validatedData.limit || 50,
      skip: validatedData.offset || 0,
    });

    // Get total count for pagination
    const total = await db.message.count({ where });

    // Highlight search terms in content
    const highlightedMessages = messages.map((message) => {
      const regex = new RegExp(`(${validatedData.query})`, "gi");
      const highlightedContent = message.content.replace(
        regex,
        "<mark>$1</mark>"
      );

      return {
        ...message,
        highlightedContent,
        searchQuery: validatedData.query,
      };
    });

    return NextResponse.json({
      messages: highlightedMessages,
      total,
      query: validatedData.query,
      filters: validatedData.filters,
      pagination: {
        limit: validatedData.limit || 50,
        offset: validatedData.offset || 0,
        hasMore: total > (validatedData.offset || 0) + messages.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[MESSAGES_SEARCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
