/**
 * Prisma Skill Store Adapter
 * Implements SkillStore interface from @sam-ai/agentic package
 */

import { db } from '@/lib/db';
import type {
  SkillStore,
  UserSkillProfile,
  UserSkill,
  SkillTrend,
} from '@sam-ai/agentic';

// ============================================================================
// PRISMA SKILL STORE ADAPTER
// ============================================================================

export class PrismaSkillStore implements SkillStore {
  /**
   * Get user's skill profile
   */
  async getSkillProfile(userId: string): Promise<UserSkillProfile | null> {
    try {
      const skillProgress = await db.skillProgress.findMany({
        where: { userId },
        include: { skill: true },
      });

      if (skillProgress.length === 0) {
        return null;
      }

      const skills: UserSkill[] = skillProgress.map((sp) =>
        this.mapSkillProgressToUserSkill(sp)
      );

      const masteredConcepts = skills
        .filter((s) => s.masteryLevel >= 80)
        .map((s) => s.conceptId);
      const inProgressConcepts = skills
        .filter((s) => s.masteryLevel >= 40 && s.masteryLevel < 80)
        .map((s) => s.conceptId);
      const strugglingConcepts = skills
        .filter((s) => s.masteryLevel < 40)
        .map((s) => s.conceptId);

      // Calculate total time and streak from user data
      const totalLearningTimeMinutes = skillProgress.reduce(
        (sum, sp) => sum + Math.floor((sp.timeSpent ?? 0) / 60),
        0
      );

      const lastActivityAt = skillProgress.reduce((latest, sp) => {
        const spDate = sp.lastPracticed ?? new Date(0);
        return spDate > latest ? spDate : latest;
      }, new Date(0));

      return {
        userId,
        skills,
        masteredConcepts,
        inProgressConcepts,
        strugglingConcepts,
        totalLearningTimeMinutes,
        streakDays: 0, // Will be calculated separately
        lastActivityAt,
        createdAt: skillProgress[0]?.createdAt ?? new Date(),
        updatedAt: skillProgress[0]?.updatedAt ?? new Date(),
      };
    } catch (error) {
      console.error('Failed to get skill profile:', error);
      return null;
    }
  }

  /**
   * Save user's skill profile (updates individual skills)
   */
  async saveSkillProfile(profile: UserSkillProfile): Promise<void> {
    try {
      for (const skill of profile.skills) {
        await this.updateSkill(profile.userId, skill);
      }
    } catch (error) {
      console.error('Failed to save skill profile:', error);
      throw error;
    }
  }

  /**
   * Get a specific skill for a user
   */
  async getSkill(userId: string, conceptId: string): Promise<UserSkill | null> {
    try {
      const skillProgress = await db.skillProgress.findFirst({
        where: {
          userId,
          skillId: conceptId,
        },
        include: { skill: true },
      });

      if (!skillProgress) {
        return null;
      }

      return this.mapSkillProgressToUserSkill(skillProgress);
    } catch (error) {
      console.error('Failed to get skill:', error);
      return null;
    }
  }

  /**
   * Update or create a skill for a user
   */
  async updateSkill(userId: string, skill: UserSkill): Promise<void> {
    try {
      await db.skillProgress.upsert({
        where: {
          userId_skillId: {
            userId,
            skillId: skill.conceptId,
          },
        },
        update: {
          currentLevel: Math.round(skill.masteryLevel),
          mastery: skill.masteryLevel,
          attempts: skill.practiceCount,
          timeSpent: 0, // Updated separately
          lastPracticed: skill.lastPracticedAt,
          metadata: {
            confidenceScore: skill.confidenceScore,
            strengthTrend: skill.strengthTrend,
            nextReviewAt: skill.nextReviewAt?.toISOString(),
            retentionScore: skill.retentionScore,
            correctCount: skill.correctCount,
          },
        },
        create: {
          userId,
          skillId: skill.conceptId,
          currentLevel: Math.round(skill.masteryLevel),
          targetLevel: 100,
          mastery: skill.masteryLevel,
          attempts: skill.practiceCount,
          timeSpent: 0,
          lastPracticed: skill.lastPracticedAt,
          metadata: {
            confidenceScore: skill.confidenceScore,
            strengthTrend: skill.strengthTrend,
            nextReviewAt: skill.nextReviewAt?.toISOString(),
            retentionScore: skill.retentionScore,
            correctCount: skill.correctCount,
            firstLearnedAt: skill.firstLearnedAt.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to update skill:', error);
      throw error;
    }
  }

  /**
   * Get all skills for a course
   * Note: Skills are not directly linked to courses in the schema,
   * so we return all user skills. Course-skill mapping can be added later.
   */
  async getSkillsForCourse(
    userId: string,
    _courseId: string
  ): Promise<UserSkill[]> {
    try {
      // Get all skill progress for the user
      // TODO: Add course-skill mapping when CourseSkill relation is available
      const skillProgress = await db.skillProgress.findMany({
        where: { userId },
        include: { skill: true },
      });

      return skillProgress.map((sp) => this.mapSkillProgressToUserSkill(sp));
    } catch (error) {
      console.error('Failed to get skills for course:', error);
      return [];
    }
  }

  /**
   * Get concepts user is struggling with
   */
  async getStrugglingConcepts(
    userId: string,
    limit: number = 5
  ): Promise<UserSkill[]> {
    try {
      const skillProgress = await db.skillProgress.findMany({
        where: {
          userId,
          mastery: { lt: 40 },
        },
        include: { skill: true },
        orderBy: { mastery: 'asc' },
        take: limit,
      });

      return skillProgress.map((sp) => this.mapSkillProgressToUserSkill(sp));
    } catch (error) {
      console.error('Failed to get struggling concepts:', error);
      return [];
    }
  }

  /**
   * Get concepts due for spaced repetition review
   */
  async getConceptsDueForReview(
    userId: string,
    limit: number = 10
  ): Promise<UserSkill[]> {
    try {
      const now = new Date();

      const skillProgress = await db.skillProgress.findMany({
        where: {
          userId,
          mastery: { gt: 0 },
        },
        include: { skill: true },
        orderBy: { lastPracticed: 'asc' },
        take: limit * 2, // Get more to filter
      });

      // Filter by nextReviewAt from metadata
      const dueForReview = skillProgress.filter((sp) => {
        const metadata = sp.metadata as Record<string, unknown> | null;
        if (!metadata?.nextReviewAt) return true; // No review scheduled, needs review
        const nextReview = new Date(metadata.nextReviewAt as string);
        return nextReview <= now;
      });

      return dueForReview
        .slice(0, limit)
        .map((sp) => this.mapSkillProgressToUserSkill(sp));
    } catch (error) {
      console.error('Failed to get concepts due for review:', error);
      return [];
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapSkillProgressToUserSkill(
    sp: Awaited<ReturnType<typeof db.skillProgress.findFirst>> & {
      skill: { id: string; name: string };
    }
  ): UserSkill {
    if (!sp) {
      throw new Error('SkillProgress is null');
    }

    const metadata = (sp.metadata as Record<string, unknown>) ?? {};

    return {
      conceptId: sp.skillId,
      conceptName: sp.skill?.name ?? '',
      masteryLevel: sp.mastery ?? 0,
      confidenceScore: (metadata.confidenceScore as number) ?? 0.5,
      practiceCount: sp.attempts ?? 0,
      correctCount: (metadata.correctCount as number) ?? 0,
      lastPracticedAt: sp.lastPracticed ?? new Date(),
      firstLearnedAt: metadata.firstLearnedAt
        ? new Date(metadata.firstLearnedAt as string)
        : (sp.createdAt ?? new Date()),
      strengthTrend: (metadata.strengthTrend as SkillTrend) ?? 'stable',
      nextReviewAt: metadata.nextReviewAt
        ? new Date(metadata.nextReviewAt as string)
        : undefined,
      retentionScore: metadata.retentionScore as number | undefined,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaSkillStore(): PrismaSkillStore {
  return new PrismaSkillStore();
}
