/**
 * Prisma Course Graph Store Adapter
 * Implements CourseGraphStore interface from @sam-ai/agentic package
 */

import { db } from '@/lib/db';
import type {
  CourseGraphStore,
  CourseGraph,
  ConceptNode,
  PrerequisiteRelation,
  DifficultyLevel,
  PrerequisiteImportance,
} from '@sam-ai/agentic';

// ============================================================================
// PRISMA COURSE GRAPH STORE ADAPTER
// ============================================================================

export class PrismaCourseGraphStore implements CourseGraphStore {
  /**
   * Get course graph with all concepts and prerequisites
   */
  async getCourseGraph(courseId: string): Promise<CourseGraph | null> {
    try {
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: {
          chapters: {
            orderBy: { position: 'asc' },
            include: {
              sections: {
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      });

      // Get skills related to the course (via skill-based learning objectives)
      const courseSkills = await db.skill.findMany({
        where: {
          isActive: true,
        },
        take: 50, // Limit for performance
      });

      if (!course) {
        return null;
      }

      // Build concept nodes from chapters and sections
      const concepts: ConceptNode[] = [];
      const prerequisites: PrerequisiteRelation[] = [];
      let totalEstimatedMinutes = 0;

      // Add chapter-level concepts
      for (const chapter of course.chapters) {
        const chapterDifficulty = this.mapDifficulty(
          chapter.position,
          course.chapters.length
        );

        concepts.push({
          id: `chapter-${chapter.id}`,
          name: chapter.title,
          description: chapter.description ?? undefined,
          courseId: course.id,
          chapterId: chapter.id,
          difficulty: chapterDifficulty,
          estimatedMinutes: chapter.totalDuration ?? 30,
          learningObjectives: chapter.learningOutcomes
            ? [chapter.learningOutcomes]
            : undefined,
        });

        totalEstimatedMinutes += chapter.totalDuration ?? 30;

        // Add section-level concepts
        for (const section of chapter.sections) {
          concepts.push({
            id: `section-${section.id}`,
            name: section.title,
            description: section.description ?? undefined,
            courseId: course.id,
            chapterId: chapter.id,
            difficulty: chapterDifficulty,
            estimatedMinutes: section.duration ?? 15,
          });

          totalEstimatedMinutes += section.duration ?? 15;

          // Section depends on chapter
          prerequisites.push({
            conceptId: `section-${section.id}`,
            requiresConceptId: `chapter-${chapter.id}`,
            importance: 'required',
          });
        }

        // Chapter depends on previous chapter
        if (chapter.position > 0) {
          const prevChapter = course.chapters[chapter.position - 1];
          if (prevChapter) {
            prerequisites.push({
              conceptId: `chapter-${chapter.id}`,
              requiresConceptId: `chapter-${prevChapter.id}`,
              importance: 'recommended',
            });
          }
        }
      }

      // Add skill-based concepts
      for (const skill of courseSkills) {
        const skillPrereqs = (skill.prerequisites ?? []) as string[];

        concepts.push({
          id: `skill-${skill.id}`,
          name: skill.name,
          description: skill.description ?? undefined,
          courseId: course.id,
          difficulty: this.mapSkillDifficulty(skill.difficulty),
          tags: skill.category ? [skill.category] : undefined,
        });

        // Add skill prerequisites
        for (const prereqId of skillPrereqs) {
          prerequisites.push({
            conceptId: `skill-${skill.id}`,
            requiresConceptId: `skill-${prereqId}`,
            importance: 'required',
          });
        }
      }

      // Parse learning objectives from course goals
      const learningObjectives = course.courseGoals
        ? course.courseGoals.split('\n').filter(Boolean)
        : [];

      return {
        courseId: course.id,
        title: course.title,
        concepts,
        prerequisites,
        learningObjectives,
        totalEstimatedMinutes,
      };
    } catch (error) {
      console.error('Failed to get course graph:', error);
      return null;
    }
  }

  /**
   * Save course graph (updates course structure)
   */
  async saveCourseGraph(graph: CourseGraph): Promise<void> {
    try {
      // Update course learning objectives
      await db.course.update({
        where: { id: graph.courseId },
        data: {
          courseGoals: graph.learningObjectives.join('\n'),
        },
      });

      // Store the full graph in CourseBloomsAnalysis for reference
      await db.courseBloomsAnalysis.upsert({
        where: { courseId: graph.courseId },
        update: {
          learningPathway: {
            concepts: graph.concepts,
            prerequisites: graph.prerequisites,
            totalEstimatedMinutes: graph.totalEstimatedMinutes,
          },
          analyzedAt: new Date(),
        },
        create: {
          courseId: graph.courseId,
          bloomsDistribution: {},
          cognitiveDepth: 0,
          learningPathway: {
            concepts: graph.concepts,
            prerequisites: graph.prerequisites,
            totalEstimatedMinutes: graph.totalEstimatedMinutes,
          },
          skillsMatrix: {},
          gapAnalysis: {},
          recommendations: {},
        },
      });
    } catch (error) {
      console.error('Failed to save course graph:', error);
      throw error;
    }
  }

  /**
   * Get a specific concept by ID
   */
  async getConcept(conceptId: string): Promise<ConceptNode | null> {
    try {
      // Parse the concept type from ID
      const [type, id] = conceptId.split('-');

      if (type === 'chapter') {
        const chapter = await db.chapter.findUnique({
          where: { id },
          include: { course: true },
        });

        if (!chapter) return null;

        return {
          id: conceptId,
          name: chapter.title,
          description: chapter.description ?? undefined,
          courseId: chapter.courseId,
          chapterId: chapter.id,
          difficulty: 'intermediate',
          estimatedMinutes: chapter.totalDuration ?? 30,
          learningObjectives: chapter.learningOutcomes
            ? [chapter.learningOutcomes]
            : undefined,
        };
      }

      if (type === 'section') {
        const section = await db.section.findUnique({
          where: { id },
          include: { chapter: true },
        });

        if (!section) return null;

        return {
          id: conceptId,
          name: section.title,
          description: section.description ?? undefined,
          courseId: section.chapter.courseId,
          chapterId: section.chapterId,
          difficulty: 'intermediate',
          estimatedMinutes: section.duration ?? 15,
        };
      }

      if (type === 'skill') {
        const skill = await db.skill.findUnique({
          where: { id },
        });

        if (!skill) return null;

        return {
          id: conceptId,
          name: skill.name,
          description: skill.description ?? undefined,
          difficulty: this.mapSkillDifficulty(skill.difficulty),
          tags: skill.category ? [skill.category] : undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get concept:', error);
      return null;
    }
  }

  /**
   * Get prerequisites for a concept
   */
  async getPrerequisites(conceptId: string): Promise<PrerequisiteRelation[]> {
    try {
      const [type, id] = conceptId.split('-');

      if (type === 'skill') {
        const skill = await db.skill.findUnique({
          where: { id },
        });

        if (!skill) return [];

        const prereqs = (skill.prerequisites ?? []) as string[];
        return prereqs.map((prereqId) => ({
          conceptId,
          requiresConceptId: `skill-${prereqId}`,
          importance: 'required' as PrerequisiteImportance,
        }));
      }

      if (type === 'chapter') {
        const chapter = await db.chapter.findUnique({
          where: { id },
          include: {
            course: {
              include: {
                chapters: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        });

        if (!chapter) return [];

        // Find previous chapter
        const prevChapter = chapter.course.chapters.find(
          (c) => c.position === chapter.position - 1
        );

        if (prevChapter) {
          return [
            {
              conceptId,
              requiresConceptId: `chapter-${prevChapter.id}`,
              importance: 'recommended',
            },
          ];
        }
      }

      if (type === 'section') {
        const section = await db.section.findUnique({
          where: { id },
        });

        if (!section) return [];

        return [
          {
            conceptId,
            requiresConceptId: `chapter-${section.chapterId}`,
            importance: 'required',
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Failed to get prerequisites:', error);
      return [];
    }
  }

  /**
   * Get concepts that depend on this concept
   */
  async getDependents(conceptId: string): Promise<string[]> {
    try {
      const [type, id] = conceptId.split('-');

      if (type === 'chapter') {
        const chapter = await db.chapter.findUnique({
          where: { id },
          include: {
            sections: true,
            course: {
              include: {
                chapters: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        });

        if (!chapter) return [];

        const dependents: string[] = [];

        // All sections in this chapter depend on it
        for (const section of chapter.sections) {
          dependents.push(`section-${section.id}`);
        }

        // Next chapter depends on this one
        const nextChapter = chapter.course.chapters.find(
          (c) => c.position === chapter.position + 1
        );
        if (nextChapter) {
          dependents.push(`chapter-${nextChapter.id}`);
        }

        return dependents;
      }

      if (type === 'skill') {
        // Find skills that have this skill as a prerequisite
        const skills = await db.skill.findMany({
          where: {
            prerequisites: {
              path: [],
              array_contains: [id],
            },
          },
        });

        return skills.map((s) => `skill-${s.id}`);
      }

      return [];
    } catch (error) {
      console.error('Failed to get dependents:', error);
      return [];
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapDifficulty(position: number, total: number): DifficultyLevel {
    const progress = position / total;
    if (progress < 0.25) return 'beginner';
    if (progress < 0.5) return 'intermediate';
    if (progress < 0.75) return 'advanced';
    return 'expert';
  }

  private mapSkillDifficulty(difficulty: number): DifficultyLevel {
    if (difficulty <= 3) return 'beginner';
    if (difficulty <= 5) return 'intermediate';
    if (difficulty <= 7) return 'advanced';
    return 'expert';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaCourseGraphStore(): PrismaCourseGraphStore {
  return new PrismaCourseGraphStore();
}
