/**
 * Knowledge Graph Integration Service
 *
 * Connects memories to course concepts, prerequisites, user skills,
 * and provides intelligent learning path recommendations.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAgenticMemorySystem } from '@/lib/sam/agentic-memory';
import {
  EntityType,
  RelationshipType,
  type GraphEntity,
  type GraphRelationship,
  type GraphPath,
  type GraphQueryOptions,
} from '@sam-ai/agentic';

// ==========================================
// TYPES
// ==========================================

export interface CourseGraphData {
  courseId: string;
  title: string;
  concepts: ConceptNode[];
  prerequisites: PrerequisiteRelation[];
  learningObjectives: string[];
}

export interface ConceptNode {
  id: string;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes?: number;
  tags?: string[];
}

export interface PrerequisiteRelation {
  conceptId: string;
  requiresConceptId: string;
  importance: 'required' | 'recommended' | 'optional';
}

export interface UserSkillProfile {
  userId: string;
  skills: UserSkill[];
  masteredConcepts: string[];
  inProgressConcepts: string[];
  strugglingConcepts: string[];
  totalLearningTime: number;
  lastActivityAt: Date;
}

export interface UserSkill {
  conceptId: string;
  conceptName: string;
  masteryLevel: number; // 0-100
  practiceCount: number;
  lastPracticedAt: Date;
  strengthTrend: 'improving' | 'stable' | 'declining';
}

export interface LearningPathRecommendation {
  userId: string;
  courseId?: string;
  recommendedPath: PathStep[];
  estimatedDuration: number;
  confidence: number;
  reason: string;
}

export interface PathStep {
  order: number;
  conceptId: string;
  conceptName: string;
  action: 'learn' | 'review' | 'practice' | 'assess';
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  reason: string;
}

export interface ConceptConnection {
  sourceConceptId: string;
  targetConceptId: string;
  relationshipType: string;
  strength: number;
}

// ==========================================
// COURSE GRAPH BUILDER
// ==========================================

/**
 * Builds knowledge graph entities from course content
 */
export async function buildCourseGraph(courseId: string): Promise<CourseGraphData | null> {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: true,
          },
          orderBy: { position: 'asc' },
        },
        category: true,
      },
    });

    if (!course) {
      logger.warn('[KnowledgeGraph] Course not found', { courseId });
      return null;
    }

    const memorySystem = getAgenticMemorySystem();
    const concepts: ConceptNode[] = [];
    const prerequisites: PrerequisiteRelation[] = [];

    // Create course entity
    const courseEntity = await memorySystem.knowledgeGraph.createEntity(
      EntityType.COURSE,
      course.title,
      {
        description: course.description ?? undefined,
        properties: {
          courseId: course.id,
          categoryId: course.categoryId,
          difficulty: course.difficulty,
          price: course.price,
        },
      }
    );

    let previousChapterEntity: GraphEntity | null = null;

    // Process chapters
    for (const chapter of course.chapters) {
      const chapterEntity = await memorySystem.knowledgeGraph.createEntity(
        EntityType.CHAPTER,
        chapter.title,
        {
          description: chapter.description ?? undefined,
          properties: {
            chapterId: chapter.id,
            courseId: course.id,
            position: chapter.position,
          },
        }
      );

      // Link chapter to course
      await memorySystem.knowledgeGraph.createRelationship(
        chapterEntity.id,
        courseEntity.id,
        RelationshipType.PART_OF
      );

      // Link to previous chapter (sequential ordering)
      if (previousChapterEntity) {
        await memorySystem.knowledgeGraph.createRelationship(
          chapterEntity.id,
          previousChapterEntity.id,
          RelationshipType.FOLLOWS
        );

        // Previous chapter is prerequisite
        prerequisites.push({
          conceptId: chapterEntity.id,
          requiresConceptId: previousChapterEntity.id,
          importance: 'required',
        });
      }

      // Process sections within chapter
      let previousSectionEntity: GraphEntity | null = null;

      for (const section of chapter.sections) {
        const sectionEntity = await memorySystem.knowledgeGraph.createEntity(
          EntityType.SECTION,
          section.title,
          {
            description: section.description ?? undefined,
            properties: {
              sectionId: section.id,
              chapterId: chapter.id,
              type: section.type,
              position: section.position,
            },
          }
        );

        // Link section to chapter
        await memorySystem.knowledgeGraph.createRelationship(
          sectionEntity.id,
          chapterEntity.id,
          RelationshipType.PART_OF
        );

        // Sequential ordering within chapter
        if (previousSectionEntity) {
          await memorySystem.knowledgeGraph.createRelationship(
            sectionEntity.id,
            previousSectionEntity.id,
            RelationshipType.FOLLOWS
          );
        }

        // Add to concepts list
        concepts.push({
          id: sectionEntity.id,
          name: section.title,
          description: section.description ?? undefined,
          difficulty: determineDifficulty(chapter.position, section.position),
          tags: [],
        });

        previousSectionEntity = sectionEntity;
      }

      previousChapterEntity = chapterEntity;
    }

    logger.info('[KnowledgeGraph] Course graph built', {
      courseId,
      conceptCount: concepts.length,
      prerequisiteCount: prerequisites.length,
    });

    return {
      courseId: course.id,
      title: course.title,
      concepts,
      prerequisites,
      learningObjectives: extractLearningObjectives(course),
    };
  } catch (error) {
    logger.error('[KnowledgeGraph] Failed to build course graph', { courseId, error });
    return null;
  }
}

// ==========================================
// USER SKILL TRACKING
// ==========================================

/**
 * Gets or creates a user's skill profile
 */
export async function getUserSkillProfile(userId: string): Promise<UserSkillProfile> {
  try {
    // Get user's completed sections and progress
    const userProgress = await db.user_progress.findMany({
      where: { userId },
      include: {
        Section: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    // Get user's long-term memories about concepts
    const memories = await db.sAMLongTermMemory.findMany({
      where: {
        userId,
        type: { in: ['CONCEPT', 'SKILL', 'STRUGGLE_POINT'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const skills: UserSkill[] = [];
    const masteredConcepts: string[] = [];
    const inProgressConcepts: string[] = [];
    const strugglingConcepts: string[] = [];
    let totalLearningTime = 0;

    // Process user progress to build skill profile
    for (const progress of userProgress) {
      if (!progress.Section) continue;

      const conceptId = progress.Section.id;
      const conceptName = progress.Section.title;
      const isCompleted = progress.isCompleted;

      // Calculate mastery level based on completion and quiz performance
      const masteryLevel = calculateMasteryLevel(progress);

      if (masteryLevel >= 80) {
        masteredConcepts.push(conceptId);
      } else if (masteryLevel >= 30) {
        inProgressConcepts.push(conceptId);
      }

      skills.push({
        conceptId,
        conceptName,
        masteryLevel,
        practiceCount: progress.attempts ?? 1,
        lastPracticedAt: progress.updatedAt,
        strengthTrend: determineStrengthTrend(memories, conceptId),
      });
    }

    // Identify struggling concepts from memories
    const struggleMemories = memories.filter((m) => m.type === 'STRUGGLE_POINT');
    for (const memory of struggleMemories) {
      if (memory.topicIds.length > 0) {
        strugglingConcepts.push(...memory.topicIds);
      }
    }

    // Calculate total learning time from SAM sessions
    const sessions = await db.sAMLearningSession.findMany({
      where: { userId },
      select: {
        startTime: true,
        endTime: true,
        duration: true,
      },
    });

    for (const session of sessions) {
      // Use duration field if available, otherwise calculate from timestamps
      if (session.duration > 0) {
        totalLearningTime += session.duration;
      } else if (session.endTime) {
        const duration = session.endTime.getTime() - session.startTime.getTime();
        totalLearningTime += Math.floor(duration / 60000); // Convert to minutes
      }
    }

    return {
      userId,
      skills,
      masteredConcepts: [...new Set(masteredConcepts)],
      inProgressConcepts: [...new Set(inProgressConcepts)],
      strugglingConcepts: [...new Set(strugglingConcepts)],
      totalLearningTime,
      lastActivityAt: userProgress[0]?.updatedAt ?? new Date(),
    };
  } catch (error) {
    logger.error('[KnowledgeGraph] Failed to get user skill profile', { userId, error });
    return {
      userId,
      skills: [],
      masteredConcepts: [],
      inProgressConcepts: [],
      strugglingConcepts: [],
      totalLearningTime: 0,
      lastActivityAt: new Date(),
    };
  }
}

/**
 * Updates user skill after completing a concept
 */
export async function updateUserSkill(
  userId: string,
  conceptId: string,
  performance: {
    completed: boolean;
    score?: number;
    timeSpent?: number;
    struggled?: boolean;
  }
): Promise<void> {
  try {
    const memorySystem = getAgenticMemorySystem();

    // Get the concept entity
    const concepts = await memorySystem.knowledgeGraph.findEntities(
      EntityType.SECTION,
      conceptId,
      1
    );

    if (concepts.length === 0) {
      logger.warn('[KnowledgeGraph] Concept not found for skill update', { conceptId });
      return;
    }

    const concept = concepts[0];

    // Determine relationship type based on performance
    let relationshipType: string;
    if (performance.struggled) {
      relationshipType = RelationshipType.STRUGGLED_WITH;
    } else if (performance.completed && (performance.score ?? 0) >= 80) {
      relationshipType = RelationshipType.MASTERED_BY;
    } else if (performance.completed) {
      relationshipType = RelationshipType.COMPLETED;
    } else {
      return; // No update needed for incomplete without struggle
    }

    // Find or create user entity
    let userEntities = await memorySystem.knowledgeGraph.findEntities(
      EntityType.USER,
      userId,
      1
    );

    let userEntity: GraphEntity;
    if (userEntities.length === 0) {
      userEntity = await memorySystem.knowledgeGraph.createEntity(
        EntityType.USER,
        userId,
        { properties: { userId } }
      );
    } else {
      userEntity = userEntities[0];
    }

    // Create relationship
    await memorySystem.knowledgeGraph.createRelationship(
      userEntity.id,
      concept.id,
      relationshipType as typeof RelationshipType[keyof typeof RelationshipType]
    );

    // Store as long-term memory if significant
    if (performance.struggled || (performance.score ?? 0) >= 90) {
      await db.sAMLongTermMemory.create({
        data: {
          userId,
          type: performance.struggled ? 'STRUGGLE_POINT' : 'SKILL',
          title: `${performance.struggled ? 'Struggled with' : 'Mastered'}: ${concept.name}`,
          content: `User ${performance.struggled ? 'had difficulty with' : 'successfully completed'} ${concept.name}${performance.score ? ` with score ${performance.score}%` : ''}.`,
          importance: performance.struggled ? 'HIGH' : 'MEDIUM',
          topicIds: [conceptId],
          tags: [performance.struggled ? 'struggle' : 'mastery', concept.type],
        },
      });
    }

    logger.info('[KnowledgeGraph] User skill updated', {
      userId,
      conceptId,
      relationshipType,
    });
  } catch (error) {
    logger.error('[KnowledgeGraph] Failed to update user skill', { userId, conceptId, error });
  }
}

// ==========================================
// LEARNING PATH RECOMMENDATIONS
// ==========================================

/**
 * Generates personalized learning path recommendations
 */
export async function generateLearningPath(
  userId: string,
  options: {
    courseId?: string;
    targetConceptId?: string;
    maxSteps?: number;
    focusOnWeakAreas?: boolean;
  } = {}
): Promise<LearningPathRecommendation> {
  try {
    const maxSteps = options.maxSteps ?? 10;
    const focusOnWeakAreas = options.focusOnWeakAreas ?? true;

    // Get user's current skill profile
    const skillProfile = await getUserSkillProfile(userId);

    // Get available concepts for the course (if specified)
    let availableConcepts: ConceptNode[] = [];
    if (options.courseId) {
      const courseGraph = await buildCourseGraph(options.courseId);
      if (courseGraph) {
        availableConcepts = courseGraph.concepts;
      }
    }

    const recommendedPath: PathStep[] = [];
    let estimatedDuration = 0;

    // Priority 1: Address struggling concepts
    if (focusOnWeakAreas && skillProfile.strugglingConcepts.length > 0) {
      for (const conceptId of skillProfile.strugglingConcepts.slice(0, 3)) {
        const concept = availableConcepts.find((c) => c.id === conceptId);
        if (concept && recommendedPath.length < maxSteps) {
          recommendedPath.push({
            order: recommendedPath.length + 1,
            conceptId: concept.id,
            conceptName: concept.name,
            action: 'review',
            priority: 'high',
            estimatedMinutes: concept.estimatedMinutes ?? 15,
            reason: 'Previously struggled with this concept - review recommended',
          });
          estimatedDuration += concept.estimatedMinutes ?? 15;
        }
      }
    }

    // Priority 2: Continue in-progress concepts
    for (const conceptId of skillProfile.inProgressConcepts.slice(0, 3)) {
      const concept = availableConcepts.find((c) => c.id === conceptId);
      if (concept && recommendedPath.length < maxSteps) {
        const skill = skillProfile.skills.find((s) => s.conceptId === conceptId);
        const action = (skill?.masteryLevel ?? 0) >= 60 ? 'practice' : 'learn';

        recommendedPath.push({
          order: recommendedPath.length + 1,
          conceptId: concept.id,
          conceptName: concept.name,
          action,
          priority: 'medium',
          estimatedMinutes: concept.estimatedMinutes ?? 20,
          reason: `Continue learning - ${skill?.masteryLevel ?? 0}% mastered`,
        });
        estimatedDuration += concept.estimatedMinutes ?? 20;
      }
    }

    // Priority 3: New concepts (not started)
    const masteredAndInProgress = new Set([
      ...skillProfile.masteredConcepts,
      ...skillProfile.inProgressConcepts,
    ]);

    const newConcepts = availableConcepts.filter(
      (c) => !masteredAndInProgress.has(c.id)
    );

    // Sort by difficulty for gradual progression
    newConcepts.sort((a, b) => {
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });

    for (const concept of newConcepts) {
      if (recommendedPath.length >= maxSteps) break;

      // Check if prerequisites are met
      const prerequisitesMet = await checkPrerequisitesMet(
        userId,
        concept.id,
        skillProfile.masteredConcepts
      );

      if (prerequisitesMet) {
        recommendedPath.push({
          order: recommendedPath.length + 1,
          conceptId: concept.id,
          conceptName: concept.name,
          action: 'learn',
          priority: 'low',
          estimatedMinutes: concept.estimatedMinutes ?? 25,
          reason: 'Next concept in learning sequence',
        });
        estimatedDuration += concept.estimatedMinutes ?? 25;
      }
    }

    // Priority 4: Spaced repetition for mastered concepts
    const masteredSkills = skillProfile.skills.filter(
      (s) => skillProfile.masteredConcepts.includes(s.conceptId)
    );

    // Find concepts that need review (not practiced recently)
    const needsReview = masteredSkills.filter((s) => {
      const daysSinceLastPractice =
        (Date.now() - s.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastPractice > 7; // Review if not practiced in 7 days
    });

    for (const skill of needsReview.slice(0, 2)) {
      if (recommendedPath.length >= maxSteps) break;

      const concept = availableConcepts.find((c) => c.id === skill.conceptId);
      if (concept) {
        recommendedPath.push({
          order: recommendedPath.length + 1,
          conceptId: concept.id,
          conceptName: concept.name,
          action: 'assess',
          priority: 'low',
          estimatedMinutes: 10,
          reason: 'Spaced repetition - reinforce long-term memory',
        });
        estimatedDuration += 10;
      }
    }

    // Calculate confidence based on data quality
    const confidence = calculateRecommendationConfidence(
      skillProfile,
      availableConcepts.length,
      recommendedPath.length
    );

    const recommendation: LearningPathRecommendation = {
      userId,
      courseId: options.courseId,
      recommendedPath,
      estimatedDuration,
      confidence,
      reason: generatePathReason(skillProfile, recommendedPath),
    };

    logger.info('[KnowledgeGraph] Learning path generated', {
      userId,
      courseId: options.courseId,
      stepCount: recommendedPath.length,
      estimatedDuration,
      confidence,
    });

    return recommendation;
  } catch (error) {
    logger.error('[KnowledgeGraph] Failed to generate learning path', { userId, error });
    return {
      userId,
      courseId: options.courseId,
      recommendedPath: [],
      estimatedDuration: 0,
      confidence: 0,
      reason: 'Unable to generate recommendations - please try again later',
    };
  }
}

/**
 * Gets related concepts for a given concept
 */
export async function getRelatedConcepts(
  conceptId: string,
  options: {
    maxDepth?: number;
    includePrerequisites?: boolean;
    includeFollowing?: boolean;
    limit?: number;
  } = {}
): Promise<ConceptConnection[]> {
  try {
    const memorySystem = getAgenticMemorySystem();
    const maxDepth = options.maxDepth ?? 2;
    const limit = options.limit ?? 10;

    const relationshipTypes: Array<typeof RelationshipType[keyof typeof RelationshipType]> = [
      RelationshipType.RELATED_TO,
      RelationshipType.SIMILAR_TO,
    ];

    if (options.includePrerequisites !== false) {
      relationshipTypes.push(RelationshipType.PREREQUISITE_OF);
      relationshipTypes.push(RelationshipType.REQUIRES);
    }

    if (options.includeFollowing !== false) {
      relationshipTypes.push(RelationshipType.FOLLOWS);
    }

    const traversalResult = await memorySystem.knowledgeGraph.traverse(conceptId, {
      maxDepth,
      relationshipTypes,
      limit,
      direction: 'both',
    });

    const connections: ConceptConnection[] = traversalResult.relationships.map((rel) => ({
      sourceConceptId: rel.sourceId,
      targetConceptId: rel.targetId,
      relationshipType: rel.type,
      strength: rel.weight,
    }));

    return connections;
  } catch (error) {
    logger.error('[KnowledgeGraph] Failed to get related concepts', { conceptId, error });
    return [];
  }
}

/**
 * Finds the optimal path between two concepts
 */
export async function findConceptPath(
  sourceConceptId: string,
  targetConceptId: string
): Promise<GraphPath | null> {
  try {
    const memorySystem = getAgenticMemorySystem();

    return await memorySystem.knowledgeGraph.findPath(
      sourceConceptId,
      targetConceptId,
      {
        maxDepth: 10,
        relationshipTypes: [
          RelationshipType.FOLLOWS,
          RelationshipType.PREREQUISITE_OF,
          RelationshipType.PART_OF,
        ],
      }
    );
  } catch (error) {
    logger.error('[KnowledgeGraph] Failed to find concept path', {
      sourceConceptId,
      targetConceptId,
      error,
    });
    return null;
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function determineDifficulty(
  chapterPosition: number,
  sectionPosition: number
): 'beginner' | 'intermediate' | 'advanced' {
  const overallPosition = chapterPosition * 10 + sectionPosition;
  if (overallPosition <= 20) return 'beginner';
  if (overallPosition <= 50) return 'intermediate';
  return 'advanced';
}

function extractLearningObjectives(course: { description?: string | null }): string[] {
  // Extract learning objectives from course description
  const description = course.description ?? '';
  const objectives: string[] = [];

  // Look for bullet points or numbered lists
  const lines = description.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('-') ||
      trimmed.startsWith('•') ||
      /^\d+\./.test(trimmed)
    ) {
      objectives.push(trimmed.replace(/^[-•\d.]\s*/, ''));
    }
  }

  return objectives.slice(0, 10); // Limit to 10 objectives
}

function calculateMasteryLevel(progress: {
  isCompleted: boolean;
  viewCount?: number | null;
}): number {
  let mastery = 0;

  if (progress.isCompleted) {
    mastery += 50;
  }

  // Add points for multiple views (practice)
  const viewCount = progress.viewCount ?? 0;
  mastery += Math.min(viewCount * 10, 30);

  return Math.min(mastery, 100);
}

function determineStrengthTrend(
  memories: Array<{ type: string; topicIds: string[]; createdAt: Date }>,
  conceptId: string
): 'improving' | 'stable' | 'declining' {
  const relatedMemories = memories.filter((m) =>
    m.topicIds.includes(conceptId)
  );

  if (relatedMemories.length < 2) return 'stable';

  // Check recent memories for struggle points
  const recentMemories = relatedMemories.slice(0, 5);
  const struggleCount = recentMemories.filter(
    (m) => m.type === 'STRUGGLE_POINT'
  ).length;

  if (struggleCount >= 3) return 'declining';
  if (struggleCount === 0) return 'improving';
  return 'stable';
}

async function checkPrerequisitesMet(
  userId: string,
  conceptId: string,
  masteredConcepts: string[]
): Promise<boolean> {
  try {
    const memorySystem = getAgenticMemorySystem();

    // Get prerequisites for this concept
    const relationships = await memorySystem.knowledgeGraph.getRelationships(conceptId, {
      relationshipTypes: [RelationshipType.PREREQUISITE_OF, RelationshipType.REQUIRES],
      direction: 'incoming',
    });

    if (relationships.length === 0) return true;

    // Check if all prerequisites are mastered
    for (const rel of relationships) {
      if (!masteredConcepts.includes(rel.sourceId)) {
        return false;
      }
    }

    return true;
  } catch {
    return true; // Default to allowing if we can't check
  }
}

function calculateRecommendationConfidence(
  skillProfile: UserSkillProfile,
  totalConcepts: number,
  recommendedSteps: number
): number {
  let confidence = 0.5; // Base confidence

  // More data = higher confidence
  if (skillProfile.skills.length > 10) confidence += 0.2;
  else if (skillProfile.skills.length > 5) confidence += 0.1;

  // Good coverage of concepts
  if (totalConcepts > 0) {
    const coverage = skillProfile.skills.length / totalConcepts;
    confidence += coverage * 0.2;
  }

  // Has generated meaningful recommendations
  if (recommendedSteps >= 3) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

function generatePathReason(
  skillProfile: UserSkillProfile,
  path: PathStep[]
): string {
  const parts: string[] = [];

  const reviewSteps = path.filter((p) => p.action === 'review').length;
  const learnSteps = path.filter((p) => p.action === 'learn').length;
  const practiceSteps = path.filter((p) => p.action === 'practice').length;

  if (reviewSteps > 0) {
    parts.push(`${reviewSteps} concept${reviewSteps > 1 ? 's' : ''} to review`);
  }
  if (learnSteps > 0) {
    parts.push(`${learnSteps} new concept${learnSteps > 1 ? 's' : ''} to learn`);
  }
  if (practiceSteps > 0) {
    parts.push(`${practiceSteps} concept${practiceSteps > 1 ? 's' : ''} to practice`);
  }

  if (skillProfile.strugglingConcepts.length > 0) {
    parts.push('focusing on areas that need improvement');
  }

  return parts.length > 0
    ? `Personalized path with ${parts.join(', ')}.`
    : 'Continue your learning journey with these recommended steps.';
}
