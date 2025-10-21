import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, sections: { select: { id: true } } },
        },
      },
    });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const allSections = course.chapters.flatMap((ch) => ch.sections.map((s) => s.id));
    const completions = await db.userSectionCompletion.findMany({
      where: { userId: user.id, sectionId: { in: allSections } },
      select: { sectionId: true, progress: true, completedAt: true },
    });
    const completed = new Set<string>();
    for (const rec of completions) {
      if (rec.completedAt || (rec.progress ?? 0) >= 0.999) completed.add(rec.sectionId);
    }

    const result = course.chapters.map((ch) => {
      const total = ch.sections.length;
      const done = ch.sections.reduce((acc, s) => acc + (completed.has(s.id) ? 1 : 0), 0);
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { chapterId: ch.id, chapterTitle: ch.title, completed: done, total, percent };
    });

    return NextResponse.json({ courseId, chapters: result });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch chapter progress' }, { status: 500 });
  }
}

