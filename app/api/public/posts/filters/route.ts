import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const posts = await db.post.findMany({
      where: { published: true, isArchived: false },
      select: {
        category: true,
        User: { select: { name: true } },
        Tag: { select: { name: true } },
      },
    });

    const authorSet = new Set<string>();
    const tagSet = new Set<string>();
    const categoryCounts: Record<string, number> = {};

    posts.forEach(p => {
      const name = p.User?.name ?? '';
      if (name) authorSet.add(name);
      if (Array.isArray(p.Tag)) {
        p.Tag.forEach(t => t?.name && tagSet.add(t.name));
      }
      const cat = p.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const authors = Array.from(authorSet).sort((a, b) => a.localeCompare(b));
    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    const categories = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      success: true,
      data: { authors, tags, categories },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[PUBLIC_POSTS_FILTERS_GET]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}

