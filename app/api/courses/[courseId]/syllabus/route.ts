import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: { sections: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const syllabus = course.chapters.map((ch: any, ci: number) => ({
      chapterIndex: ci + 1,
      id: ch.id,
      title: ch.title,
      description: ch.description,
      summary: ch.description ? String(ch.description).replace(/<[^>]*>/g, '') : null,
      status: ch.status,
      difficulty: ch.difficulty,
      estimatedTime: ch.estimatedTime,
      tags: ch.tags || [],
      sections: (ch.sections || []).map((s: any, si: number) => ({
        sectionIndex: si + 1,
        id: s.id,
        title: s.title,
        type: s.type,
        duration: s.duration,
        isFree: s.isFree,
        isPreview: s.isPreview,
        completionStatus: s.completionStatus,
      }))
    }));

    if (format === 'csv') {
      const header = ['Chapter #','Chapter Title','Section #','Section Title','Type','Duration (min)','Free','Preview'];
      const rows: string[] = [];
      rows.push(header.join(','));
      syllabus.forEach((ch: any) => {
        ch.sections.forEach((s: any) => {
          const cols = [
            String(ch.chapterIndex),
            '"' + (ch.title || '').replace(/"/g, '""') + '"',
            String(s.sectionIndex),
            '"' + (s.title || '').replace(/"/g, '""') + '"',
            s.type || '',
            String(s.duration || 0),
            String(s.isFree ? 1 : 0),
            String(s.isPreview ? 1 : 0),
          ];
          rows.push(cols.join(','));
        });
      });
      const csv = rows.join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="course_syllabus_${courseId}.csv"`,
        },
      });
    }

    return NextResponse.json({ courseId, syllabus });
  } catch (err) {
    console.error('[COURSE_SYLLABUS]', err);
    return NextResponse.json({ error: 'Failed to generate syllabus' }, { status: 500 });
  }
}
