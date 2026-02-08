/**
 * Structure Analyzer (Step 1)
 *
 * Extracts and validates the hierarchical structure of a course.
 * Identifies empty/incomplete areas and structure issues.
 */

import type { CourseInput, StructureAnalysisResult } from '../types';

/**
 * Analyze the structure of a course
 */
export async function analyzeStructure(
  course: CourseInput
): Promise<StructureAnalysisResult> {
  const emptyChapters: Array<{ id: string; title: string }> = [];
  const emptySections: Array<{
    id: string;
    title: string;
    chapterId: string;
    chapterTitle: string;
  }> = [];
  const unpublishedChapters: Array<{ id: string; title: string }> = [];
  const unpublishedSections: Array<{
    id: string;
    title: string;
    chapterId: string;
  }> = [];

  let totalSections = 0;
  let totalAssessments = 0;
  let sectionsWithObjectives = 0;
  let sectionsWithContent = 0;
  let sectionsWithVideo = 0;
  let sectionsWithAssessment = 0;

  for (const chapter of course.chapters) {
    // Check for empty chapters (no sections or all empty sections)
    if (chapter.sections.length === 0) {
      emptyChapters.push({ id: chapter.id, title: chapter.title });
    }

    // Check for unpublished chapters
    if (!chapter.isPublished) {
      unpublishedChapters.push({ id: chapter.id, title: chapter.title });
    }

    for (const section of chapter.sections) {
      totalSections++;

      // Check for empty sections
      const hasContent = section.content && section.content.trim().length > 50;
      const hasDescription =
        section.description && section.description.trim().length > 20;
      const hasVideo = !!section.videoUrl;
      const hasObjectives = section.objectives && section.objectives.length > 0;

      if (!hasContent && !hasDescription && !hasVideo) {
        emptySections.push({
          id: section.id,
          title: section.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
        });
      }

      // Check for unpublished sections
      if (!section.isPublished) {
        unpublishedSections.push({
          id: section.id,
          title: section.title,
          chapterId: chapter.id,
        });
      }

      // Count content types
      if (hasObjectives) sectionsWithObjectives++;
      if (hasContent) sectionsWithContent++;
      if (hasVideo) sectionsWithVideo++;

      // Count assessments
      if (section.exams && section.exams.length > 0) {
        sectionsWithAssessment++;
        totalAssessments += section.exams.length;
      }
    }
  }

  const averageSectionsPerChapter =
    course.chapters.length > 0
      ? Math.round((totalSections / course.chapters.length) * 10) / 10
      : 0;

  return {
    totalChapters: course.chapters.length,
    totalSections,
    totalAssessments,
    emptyChapters,
    emptySections,
    unpublishedChapters,
    unpublishedSections,
    averageSectionsPerChapter,
    contentDepth: {
      hasObjectives: totalSections > 0
        ? Math.round((sectionsWithObjectives / totalSections) * 100)
        : 0,
      hasContent: totalSections > 0
        ? Math.round((sectionsWithContent / totalSections) * 100)
        : 0,
      hasVideo: totalSections > 0
        ? Math.round((sectionsWithVideo / totalSections) * 100)
        : 0,
      hasAssessment: totalSections > 0
        ? Math.round((sectionsWithAssessment / totalSections) * 100)
        : 0,
    },
  };
}
