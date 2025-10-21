import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  try {
    const user = await currentUser();
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: { sections: { orderBy: { position: 'asc' } } },
        },
      },
    });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    // Compute next incomplete section using per-user progress if available
    let nextSection: { chapterId: string; sectionId: string; chapterTitle: string | null; sectionTitle: string | null } | null = null;
    const allSections = (course.chapters || []).flatMap((ch: any) => (ch.sections || []).map((s: any) => ({ ch, s })));
    if (user?.id && allSections.length > 0) {
      const sectionIds = allSections.map(({ s }) => s.id);
      const [completions, tracking] = await Promise.all([
        db.userSectionCompletion.findMany({
          where: { userId: user.id, sectionId: { in: sectionIds } },
          select: { sectionId: true, progress: true, completedAt: true },
        }),
        db.sectionCompletionTracking.findMany({
          where: { userId: user.id, sectionId: { in: sectionIds } },
          select: { sectionId: true, status: true },
        })
      ]);
      const completedSet = new Set<string>();
      const trackBySection = new Map<string, { status: string }[]>();
      tracking.forEach((t) => {
        const list = trackBySection.get(t.sectionId) || [];
        list.push({ status: (t.status || '').toLowerCase() });
        trackBySection.set(t.sectionId, list);
      });
      for (const { s } of allSections) {
        const tr = trackBySection.get(s.id);
        if (tr && tr.length > 0) {
          const allCompleted = tr.every((r) => r.status === 'completed');
          if (allCompleted) completedSet.add(s.id);
        }
      }
      for (const rec of completions) {
        if (rec.completedAt || (rec.progress ?? 0) >= 0.999) completedSet.add(rec.sectionId);
      }
      const target = allSections.find(({ s }) => !completedSet.has(s.id));
      if (target) {
        nextSection = { chapterId: target.ch.id, sectionId: target.s.id, chapterTitle: target.ch.title, sectionTitle: target.s.title };
      }
    } else {
      // Anonymous or no progress table used: fallback to first section
      const first = allSections[0];
      if (first) nextSection = { chapterId: first.ch.id, sectionId: first.s.id, chapterTitle: first.ch.title, sectionTitle: first.s.title };
    }
    const hasCompleted = nextSection === null;
    // Course-level progress and last access (if available)
    let progressPercent: number | null = null;
    let lastAccessedAt: string | null = null;
    if (user?.id) {
      const enrollment = await db.userCourseEnrollment.findFirst({ where: { userId: user.id, courseId } });
      if (enrollment) {
        const raw = (enrollment.progress ?? 0);
        progressPercent = raw > 1 ? Math.min(100, Math.max(0, raw)) : Math.round(raw * 100);
        lastAccessedAt = enrollment.lastAccessedAt ? enrollment.lastAccessedAt.toISOString() : null;
      }
    }
    const name = user?.name || 'Student';
    const completionDateISO = hasCompleted ? new Date().toISOString() : null;
    const certificateId = hasCompleted ? `${courseId.slice(0, 8)}-${(user?.id || 'anon').slice(0, 8)}-${new Date().getFullYear()}` : null;
    const verificationUrl = hasCompleted ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/verify/${certificateId}` : null;

    // Pending counts by section type — prefer granular SectionCompletionTracking, fallback to Section.type
    const pendingCounts: { total: number; byType: Record<string, number> } = { total: 0, byType: {} };
    const typeKey = (t?: string | null) => {
      const v = (t || 'Other').toLowerCase();
      if (v.includes('video')) return 'Video';
      if (v.includes('quiz') || v.includes('exam') || v.includes('assessment')) return 'Quiz';
      if (v.includes('assign')) return 'Assignment';
      if (v.includes('read') || v.includes('article')) return 'Reading';
      return 'Other';
    };
    // Build completed set again for counts
    const completedSet = new Set<string>();
    if (user?.id && allSections.length > 0) {
      const sectionIds = allSections.map(({ s }) => s.id);
      const completions2 = await db.userSectionCompletion.findMany({ where: { userId: user.id, sectionId: { in: sectionIds } }, select: { sectionId: true, progress: true, completedAt: true } });
      for (const rec of completions2) {
        if (rec.completedAt || (rec.progress ?? 0) >= 0.999) completedSet.add(rec.sectionId);
      }
    }
    // Total = number of overall incomplete sections
    pendingCounts.total = allSections.reduce((acc, { s }) => acc + (completedSet.has(s.id) ? 0 : 1), 0);
    // Prefer granular SectionCompletionTracking by completionType
    const byType: Record<string, number> = {};
    if (user?.id && allSections.length > 0) {
      const sectionIds = allSections.map(({ s }) => s.id);
      const track = await db.sectionCompletionTracking.findMany({
        where: { userId: user.id, sectionId: { in: sectionIds } },
        select: { sectionId: true, completionType: true, status: true },
      });
      // Count incomplete by completionType
      for (const t of track) {
        const status = (t.status || '').toLowerCase();
        if (status !== 'completed') {
          const ct = (t.completionType || '').toLowerCase();
          const label = ct.includes('video') ? 'Video' : ct.includes('quiz') || ct.includes('exam') || ct.includes('assessment') ? 'Quiz' : ct.includes('assign') ? 'Assignment' : ct.includes('read') ? 'Reading' : 'Other';
          byType[label] = (byType[label] || 0) + 1;
        }
      }
    }
    // Fallback: for incomplete sections without granular tracking, use Section.type mapping
    const trackedCountsSum = Object.values(byType).reduce((a, b) => a + b, 0);
    const fallbackNeeded = trackedCountsSum === 0; // Only fallback when no granular data
    if (fallbackNeeded) {
      for (const { s } of allSections) {
        if (!completedSet.has(s.id)) {
          const k = typeKey((s as any).type);
          byType[k] = (byType[k] || 0) + 1;
        }
      }
    }
    pendingCounts.byType = byType;

    // Management capability (teacher/admin)
    const canManage = !!(user?.id && (course.userId === user.id || (user as any).role === 'ADMIN'));

    return NextResponse.json({
      hasCompleted,
      courseTitle: course.title,
      studentName: name,
      completionDateISO,
      certificateId,
      verificationUrl,
      issuer: 'Taxomind',
      nextSection,
      progressPercent,
      lastAccessedAt,
      pendingCounts,
      canManage,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load certificate' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    const canManage = course.userId === user.id || (user as any).role === 'ADMIN';
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    let targetUserId: string = body?.userId || user.id;
    if (!canManage && targetUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (action === 'issue') {
      // Mark enrollment complete and issue certificate
      const now = new Date();
      await db.userCourseEnrollment.upsert({
        where: { userId_courseId: { userId: targetUserId, courseId } },
        update: { progress: 1, completedAt: now, certificateIssued: true, lastAccessedAt: now },
        create: { userId: targetUserId, courseId, progress: 1, completedAt: now, certificateIssued: true, status: 'ACTIVE' },
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 });
  }
}
