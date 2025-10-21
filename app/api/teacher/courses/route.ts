import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CourseQuerySchema } from '@/lib/validations/course-schemas';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    // Coerce and validate query params via zod schema
    const parsed = CourseQuerySchema.safeParse({
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      search: searchParams.search,
      category: searchParams.category,
      status: searchParams.status as any,
      priceMin: searchParams.priceMin,
      priceMax: searchParams.priceMax,
      sortBy: searchParams.sortBy as any,
      sortOrder: searchParams.sortOrder as any,
    });

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        metadata: { validationErrors: parsed.error.flatten() },
      }, { status: 400 });
    }

    const {
      page,
      pageSize,
      search,
      category,
      status,
      priceMin,
      priceMax,
      sortBy,
      sortOrder,
    } = parsed.data;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: any = {
      userId: user.id,
    };

    // Optional tenant scoping if session exposes organizationId
    const orgId = (user as any)?.organizationId as string | undefined;
    if (orgId) {
      where.organizationId = orgId;
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (category) {
      // Filter by related category name (1:1 optional relation)
      where.category = { is: { name: category } };
    }

    if (status === 'published') where.isPublished = true;
    if (status === 'draft') where.isPublished = false;

    if (typeof priceMin === 'number' || typeof priceMax === 'number') {
      where.price = {};
      if (typeof priceMin === 'number') where.price.gte = priceMin;
      if (typeof priceMax === 'number') where.price.lte = priceMax;
    }

    const orderBy = (() => {
      switch (sortBy) {
        case 'title':
          return { title: sortOrder } as const;
        case 'price':
          return { price: sortOrder } as const;
        case 'updatedAt':
          return { updatedAt: sortOrder } as const;
        case 'createdAt':
        default:
          return { createdAt: sortOrder } as const;
      }
    })();

    const [total, courses] = await Promise.all([
      db.course.count({ where }),
      db.course.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          price: true,
          isPublished: true,
          createdAt: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: {
        courses,
        pagination: { page, pageSize, total, totalPages },
      },
    });
  } catch (error: any) {
    logger.error('GET /api/teacher/courses failed', {
      error: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
