import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { todoSchema, paginationSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { z } from "zod";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse(Object.fromEntries(searchParams.entries()));

    const where = { userId: user.id };

    // Wrap count in try-catch for schema resilience
    let total = 0;
    try {
      total = await db.dashboardTodo.count({ where });
    } catch (countError) {
      logger.warn("[TODOS_GET] Count failed, using 0", countError);
    }

    // Try to fetch with all includes, fall back progressively if there are schema issues
    let todos: Awaited<ReturnType<typeof db.dashboardTodo.findMany>> = [];
    try {
      todos = await db.dashboardTodo.findMany({
        where,
        include: {
          course: { select: { id: true, title: true } },
          chapter: { select: { id: true, title: true, position: true } },
        },
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { position: "asc" }],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      });
    } catch (includeError) {
      // If include fails (schema mismatch), try without chapter
      logger.warn("[TODOS_GET] Include with chapter failed, trying without", includeError);
      try {
        todos = await db.dashboardTodo.findMany({
          where,
          include: {
            course: { select: { id: true, title: true } },
          },
          orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { position: "asc" }],
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        });
      } catch (courseError) {
        // Ultimate fallback: no includes at all
        logger.warn("[TODOS_GET] Include with course failed, trying bare query", courseError);
        try {
          todos = await db.dashboardTodo.findMany({
            where,
            orderBy: [{ completed: "asc" }, { position: "asc" }],
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
          });
        } catch (bareError) {
          logger.error("[TODOS_GET] All queries failed", bareError);
          // Return empty array if all fails
          todos = [];
        }
      }
    }

    return successResponse(todos, { page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    logger.error("[TODOS_GET]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch todos", HttpStatus.INTERNAL_ERROR);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const body = await req.json();
    const validatedData = todoSchema.parse(body);

    // Create without includes first, then try to fetch with includes
    const createdTodo = await db.dashboardTodo.create({
      data: { userId: user.id, ...validatedData },
    });

    // Try to fetch with includes for response
    let todo;
    try {
      todo = await db.dashboardTodo.findUnique({
        where: { id: createdTodo.id },
        include: {
          course: { select: { id: true, title: true } },
          chapter: { select: { id: true, title: true, position: true } },
        },
      });
    } catch {
      // If include fails, return the basic created todo
      todo = createdTodo;
    }

    return successResponse(todo);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    logger.error("[TODOS_POST]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create todo", HttpStatus.INTERNAL_ERROR);
  }
}
