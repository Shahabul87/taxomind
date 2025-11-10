import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { todoSchema, paginationSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse(Object.fromEntries(searchParams.entries()));

    const where = { userId: user.id };
    const total = await db.dashboardTodo.count({ where });

    const todos = await db.dashboardTodo.findMany({
      where,
      include: { course: { select: { id: true, title: true } } },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { position: "asc" }],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(todos, { page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    console.error("[TODOS_GET]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch todos", HttpStatus.INTERNAL_ERROR);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const body = await req.json();
    const validatedData = todoSchema.parse(body);

    const todo = await db.dashboardTodo.create({
      data: { userId: user.id, ...validatedData },
      include: { course: { select: { id: true, title: true } } },
    });

    return successResponse(todo);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    console.error("[TODOS_POST]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create todo", HttpStatus.INTERNAL_ERROR);
  }
}
