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
          select: {
            id: true,
            title: true,
            sections: {
              orderBy: { position: 'asc' },
              select: { id: true, type: true, title: true }
            }
          }
        }
      }
    });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const result: Array<{ chapterId: string; byType: Record<string, number>; total: number; nextSection?: { id: string; title: string | null } | null }> = [];

    for (const ch of course.chapters) {
      const sectionIds = ch.sections.map((s) => s.id);
      if (sectionIds.length === 0) {
        result.push({ chapterId: ch.id, byType: {}, total: 0 });
        continue;
      }
      const [completions, tracking] = await Promise.all([
        db.userSectionCompletion.findMany({ where: { userId: user.id, sectionId: { in: sectionIds } }, take: 200, select: { sectionId: true, progress: true, completedAt: true } }),
        db.sectionCompletionTracking.findMany({ where: { userId: user.id, sectionId: { in: sectionIds } }, take: 200, select: { sectionId: true, status: true, completionType: true } }),
      ]);
      const completedSet = new Set<string>();
      // Consider granular tracking: all completionType status completed
      const mapTrack = new Map<string, Array<{ status: string; completionType: string }>>();
      for (const t of tracking) {
        const arr = mapTrack.get(t.sectionId) || [];
        arr.push({ status: (t.status || '').toLowerCase(), completionType: (t.completionType || '').toLowerCase() });
        mapTrack.set(t.sectionId, arr);
      }
      for (const s of ch.sections) {
        const arr = mapTrack.get(s.id);
        if (arr && arr.length > 0) {
          const allDone = arr.every((a) => a.status === 'completed');
          if (allDone) completedSet.add(s.id);
        }
      }
      for (const rec of completions) {
        if (rec.completedAt || (rec.progress ?? 0) >= 0.999) completedSet.add(rec.sectionId);
      }

      const byType: Record<string, number> = {};
      const typeFrom = (label?: string | null) => {
        const v = (label || 'Other').toLowerCase();
        if (v.includes('video')) return 'Video';
        if (v.includes('quiz') || v.includes('exam') || v.includes('assessment')) return 'Quiz';
        if (v.includes('assign')) return 'Assignment';
        if (v.includes('read') || v.includes('article')) return 'Reading';
        return 'Other';
      };
      // Count granular incomplete types
      for (const t of tracking) {
        const status = (t.status || '').toLowerCase();
        if (status !== 'completed') {
          const label = typeFrom(t.completionType);
          byType[label] = (byType[label] || 0) + 1;
        }
      }
      // Fallback: sections without granular data count by Section.type if incomplete overall
      const granularCount = Object.values(byType).reduce((a, b) => a + b, 0);
      if (granularCount === 0) {
        for (const s of ch.sections) {
          if (!completedSet.has(s.id)) {
            const label = typeFrom(s.type as any);
            byType[label] = (byType[label] || 0) + 1;
          }
        }
      }

      const totalIncomplete = ch.sections.reduce((acc, s) => acc + (completedSet.has(s.id) ? 0 : 1), 0);
      // Next section in this chapter
      const next = ch.sections.find((s) => !completedSet.has(s.id));
      result.push({ chapterId: ch.id, byType, total: totalIncomplete, nextSection: next ? { id: next.id, title: next.title } : null });
    }

    return NextResponse.json({ courseId, chapters: result });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch pending by chapter' }, { status: 500 });
  }
}
