import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const QuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  categories: z.string().optional(),
  dateRange: z.enum(['today', 'week', 'month', 'year', 'all']).optional().default('all'),
  sort: z.enum(['latest', 'popular', 'trending', 'mostCommented']).optional().default('latest'),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('9'),
  authors: z.string().optional(), // comma-separated
  tags: z.string().optional(),    // comma-separated
});

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const params = QuerySchema.parse({
      q: sp.get('q') || undefined,
      category: sp.get('category') || undefined,
      categories: sp.get('categories') || undefined,
      dateRange: (sp.get('dateRange') as any) || undefined,
      sort: (sp.get('sort') as any) || undefined,
      page: sp.get('page') || '1',
      limit: sp.get('limit') || '9',
      authors: sp.get('authors') || undefined,
      tags: sp.get('tags') || undefined,
    });

    const page = Math.max(1, params.page);
    const limit = Math.min(50, Math.max(1, params.limit));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      published: true,
      isArchived: false,
    };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { category: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    // Category filters: support single or multiple (comma-separated)
    const categoryNames: string[] = [];
    if (params.category) categoryNames.push(params.category);
    if (params.categories) {
      params.categories.split(',').map(c => c.trim()).filter(Boolean).forEach(c => categoryNames.push(c));
    }
    if (categoryNames.length > 0) {
      where.category = { in: Array.from(new Set(categoryNames)) };
    }

    const authorList = params.authors?.split(',').map(a => a.trim()).filter(Boolean) || [];
    if (authorList.length > 0) {
      where.User = { is: { name: { in: authorList } } };
    }

    const tagList = params.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
    if (tagList.length > 0) {
      where.Tag = { some: { name: { in: tagList } } };
    }

    if (params.dateRange && params.dateRange !== 'all') {
      const now = new Date();
      let from = new Date(now);
      switch (params.dateRange) {
        case 'today':
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          from.setDate(now.getDate() - 7);
          break;
        case 'month':
          from.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          from.setFullYear(now.getFullYear() - 1);
          break;
      }
      where.createdAt = { gte: from };
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    switch (params.sort) {
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      case 'mostCommented':
        orderBy = { comments: { _count: 'desc' } };
        break;
      case 'trending':
        // Trending heuristic: recent window + views
        // If no explicit dateRange filter, restrict to last 30 days
        if (!where.createdAt) {
          const from = new Date();
          from.setDate(from.getDate() - 30);
          where.createdAt = { gte: from };
        }
        orderBy = [{ views: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Total count
    const totalCount = await db.post.count({ where });

    // Fetch posts
    const posts = await db.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        User: { select: { name: true, image: true } },
        Tag: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    });

    const transformed = posts.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      category: p.category,
      createdAt: p.createdAt.toISOString(),
      views: p.views,
      readingTime: p.description ? `${Math.max(2, Math.ceil(p.description.replace(/<[^>]*>/g, '').split(' ').length / 200))} min read` : undefined,
      user: { name: p.User?.name || null, image: (p as any).User?.image || null },
      comments: { length: (p as any)._count?.comments || 0 },
      tags: Array.isArray((p as any).Tag) ? (p as any).Tag.map((t: any) => t.name) : [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        posts: transformed,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    logger.error('[PUBLIC_POSTS_GET]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch posts' } }, { status: 500 });
  }
}
