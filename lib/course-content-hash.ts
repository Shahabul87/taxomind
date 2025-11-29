import { createHash } from 'crypto';

interface CourseContent {
  title?: string | null;
  description?: string | null;
  whatYouWillLearn?: string[] | null;
  categoryId?: string | null;
  price?: number | null;
  chapters: Array<{
    id: string;
    title?: string | null;
    description?: string | null;
    position: number;
    sections?: Array<{
      id: string;
      title?: string | null;
      description?: string | null;
      position: number;
    }>;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Generates a hash of course content to detect changes
 * Only includes fields that affect the depth analysis
 */
export function generateCourseContentHash(course: CourseContent): string {
  const contentToHash = {
    title: course.title,
    description: course.description,
    whatYouWillLearn: course.whatYouWillLearn,
    categoryId: course.categoryId,
    price: course.price,
    chapters: course.chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
      sections: ch.sections?.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        position: s.position,
        duration: (s as any).duration ?? null,
        videoUrl: (s as any).videoUrl ?? null,
        exams: (s as any).exams?.map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          questions: exam.ExamQuestion?.map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            bloomsLevel: q.bloomsLevel,
            options: q.options?.map((o: any) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })) || []
          })) || []
        })) || [],
        questions: (s as any).Question?.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          bloomsLevel: q.bloomsLevel,
          options: (q as any).options || []
        })) || []
      })) || []
    })),
    attachmentsCount: course.attachments?.length || 0
  };

  // Create a stable string representation
  const contentString = JSON.stringify(contentToHash, Object.keys(contentToHash).sort());
  
  // Generate SHA-256 hash
  return createHash('sha256')
    .update(contentString)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for brevity
}

/**
 * Compares two content hashes to determine if content has changed
 */
export function hasContentChanged(oldHash: string | null, newHash: string): boolean {
  return oldHash !== newHash;
}
