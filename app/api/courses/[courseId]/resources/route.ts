import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

type AggregatedResource = {
  id: string;
  name: string;
  url?: string | null;
  type?: string | null;
  size?: string | null;
  chapterId?: string | null;
  chapterTitle?: string | null;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            resources: true,
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const downloadable: AggregatedResource[] = [];
    const external: AggregatedResource[] = [];

    const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());
    const fileType = (s: string) => {
      const m = s.toLowerCase().match(/\.([a-z0-9]{2,5})(?:$|\?|#)/);
      return m ? m[1].toUpperCase() : null;
    };

    for (const ch of course.chapters) {
      const src = ch.resources;
      if (!src) continue;
      let items: any[] = [];
      try {
        const parsed = JSON.parse(src);
        if (Array.isArray(parsed)) items = parsed;
      } catch {
        // ignore invalid JSON
      }
      for (const raw of items) {
        const value: string = typeof raw === 'string' ? raw : (raw?.name || '');
        if (!value) continue;
        const url = typeof raw === 'string' ? (isUrl(raw) ? raw : null) : (raw?.url || null);
        const type = fileType(value) || (url ? fileType(url) : null);
        const base: AggregatedResource = {
          id: `${ch.id}:${value.slice(0, 40)}`,
          name: value,
          url,
          type,
          size: null,
          chapterId: ch.id,
          chapterTitle: ch.title,
        };
        if (type && ['PDF','ZIP','DOC','DOCX','XLS','XLSX','PPT','PPTX','MP4','MP3'].includes(type)) {
          downloadable.push(base);
        } else if (url) {
          external.push(base);
        } else {
          external.push(base); // default to external/text reference
        }
      }
    }

    return NextResponse.json({ courseId, downloadable, external });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

