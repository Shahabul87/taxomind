/**
 * Blog Plans API Routes
 * Enterprise-grade CRUD operations for dashboard blog plans
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { blogPlanSchema, paginationSchema, filterSchema } from "@/lib/validations/dashboard";
import { z } from "zod";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  metadata?: { timestamp: string; page?: number; limit?: number; total?: number };
}

function successResponse<T>(data: T, metadata?: Partial<ApiResponse["metadata"]>): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    metadata: { timestamp: new Date().toISOString(), ...metadata },
  });
}

function errorResponse(code: string, message: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      metadata: { timestamp: new Date().toISOString() },
    },
    { status }
  );
}

// GET /api/dashboard/blog-plans
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const pagination = paginationSchema.parse(queryParams);
    const filters = filterSchema.parse(queryParams);

    const where = {
      userId: user.id,
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate && { startPublishingDate: { gte: filters.startDate } }),
    };

    const total = await db.dashboardBlogPlan.count({ where });

    const blogPlans = await db.dashboardBlogPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(blogPlans, { page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("VALIDATION_ERROR", error.errors[0].message);
    }
    console.error("[BLOG_PLANS_GET]", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch blog plans", 500);
  }
}

// POST /api/dashboard/blog-plans
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validatedData = blogPlanSchema.parse(body);

    const blogPlan = await db.dashboardBlogPlan.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
    });

    return successResponse(blogPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("VALIDATION_ERROR", error.errors[0].message);
    }
    console.error("[BLOG_PLANS_POST]", error);
    return errorResponse("INTERNAL_ERROR", "Failed to create blog plan", 500);
  }
}
