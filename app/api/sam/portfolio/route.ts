/**
 * SAM AI - Portfolio Builder API
 *
 * Provides portfolio management for showcasing skills, projects,
 * certifications, and achievements. Generates shareable portfolio
 * pages and export capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetPortfolioSchema = z.object({
  includeProjects: z.coerce.boolean().optional().default(true),
  includeSkills: z.coerce.boolean().optional().default(true),
  includeCertifications: z.coerce.boolean().optional().default(true),
  includeAchievements: z.coerce.boolean().optional().default(true),
  publicOnly: z.coerce.boolean().optional().default(false),
});

const CreateProjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  type: z.enum(['personal', 'course', 'open_source', 'professional', 'hackathon', 'research']),
  skills: z.array(z.string()).min(1).max(10),
  technologies: z.array(z.string()).optional().default([]),
  url: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  highlights: z.array(z.string()).max(5).optional().default([]),
  isPublic: z.boolean().optional().default(true),
  courseId: z.string().uuid().optional(),
});

const UpdatePortfolioSettingsSchema = z.object({
  isPublic: z.boolean().optional(),
  title: z.string().min(3).max(100).optional(),
  bio: z.string().max(500).optional(),
  headline: z.string().max(100).optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      twitter: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
  theme: z.enum(['professional', 'creative', 'minimal', 'dark']).optional(),
  featuredProjectIds: z.array(z.string().uuid()).max(6).optional(),
  featuredSkillIds: z.array(z.string()).max(10).optional(),
});

// ============================================================================
// TYPES
// ============================================================================

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  type: string;
  skills: string[];
  technologies: string[];
  url?: string;
  repositoryUrl?: string;
  imageUrl?: string;
  startDate?: Date;
  endDate?: Date;
  highlights: string[];
  isPublic: boolean;
  courseId?: string;
  courseName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PortfolioSkill {
  skillId: string;
  skillName: string;
  proficiencyLevel: string;
  compositeScore: number;
  category: string;
  lastPracticedAt?: Date;
  projectCount: number;
  certificationCount: number;
  verificationStatus: 'self_assessed' | 'course_verified' | 'certified' | 'peer_validated';
}

interface PortfolioCertification {
  certificationId: string;
  certificationName: string;
  provider: string;
  status: string;
  completedDate?: Date;
  expiryDate?: Date;
  credentialUrl?: string;
  credentialId?: string;
}

interface PortfolioAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  earnedAt: Date;
  badgeUrl?: string;
  metadata?: Record<string, unknown>;
}

interface Portfolio {
  userId: string;
  userName: string;
  userImage?: string;
  settings: {
    isPublic: boolean;
    title: string;
    bio?: string;
    headline?: string;
    socialLinks?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      website?: string;
    };
    theme: string;
    featuredProjectIds: string[];
    featuredSkillIds: string[];
  };
  projects: PortfolioProject[];
  skills: PortfolioSkill[];
  certifications: PortfolioCertification[];
  achievements: PortfolioAchievement[];
  stats: {
    totalProjects: number;
    totalSkills: number;
    totalCertifications: number;
    totalAchievements: number;
    totalStudyHours: number;
    coursesCompleted: number;
    avgSkillScore: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapProficiencyToLevel(compositeScore: number): string {
  if (compositeScore >= 95) return 'STRATEGIST';
  if (compositeScore >= 85) return 'EXPERT';
  if (compositeScore >= 70) return 'ADVANCED';
  if (compositeScore >= 55) return 'PROFICIENT';
  if (compositeScore >= 40) return 'COMPETENT';
  if (compositeScore >= 25) return 'BEGINNER';
  return 'NOVICE';
}

function determineVerificationStatus(
  hasCertification: boolean,
  courseVerified: boolean,
  peerValidated: boolean
): PortfolioSkill['verificationStatus'] {
  if (hasCertification) return 'certified';
  if (courseVerified) return 'course_verified';
  if (peerValidated) return 'peer_validated';
  return 'self_assessed';
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - Get user portfolio
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = GetPortfolioSchema.parse({
      includeProjects: searchParams.get('includeProjects') || 'true',
      includeSkills: searchParams.get('includeSkills') || 'true',
      includeCertifications: searchParams.get('includeCertifications') || 'true',
      includeAchievements: searchParams.get('includeAchievements') || 'true',
      publicOnly: searchParams.get('publicOnly') || 'false',
    });

    const skillBuildTrackStore = getStore('skillBuildTrack');

    // Get or create portfolio settings with fallback
    let portfolioSettings: {
      id?: string;
      userId: string;
      isPublic: boolean;
      title: string;
      bio?: string | null;
      headline?: string | null;
      socialLinks?: unknown;
      theme: string;
      featuredProjectIds: string[];
      featuredSkillIds: string[];
    };

    try {
      const existingSettings = await db.sAMPortfolioSettings.findUnique({
        where: { userId: user.id },
      });

      if (!existingSettings) {
        portfolioSettings = await db.sAMPortfolioSettings.create({
          data: {
            userId: user.id,
            isPublic: false,
            title: `${user.name || 'User'}&apos;s Portfolio`,
            theme: 'professional',
            featuredProjectIds: [],
            featuredSkillIds: [],
          },
        });
      } else {
        portfolioSettings = existingSettings;
      }
    } catch (settingsError) {
      logger.warn('[PORTFOLIO] Failed to get/create portfolio settings, using defaults:', settingsError);
      // Use default settings if database fails
      portfolioSettings = {
        userId: user.id,
        isPublic: false,
        title: `${user.name || 'User'}&apos;s Portfolio`,
        theme: 'professional',
        featuredProjectIds: [],
        featuredSkillIds: [],
      };
    }

    // Get projects with fallback
    let projects: PortfolioProject[] = [];
    if (validatedParams.includeProjects) {
      try {
        const projectRecords = await db.sAMPortfolioProject.findMany({
          where: {
            userId: user.id,
            ...(validatedParams.publicOnly ? { isPublic: true } : {}),
          },
          include: {
            course: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        projects = projectRecords.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          skills: (p.skills as string[]) || [],
          technologies: (p.technologies as string[]) || [],
          url: p.url ?? undefined,
          repositoryUrl: p.repositoryUrl ?? undefined,
          imageUrl: p.imageUrl ?? undefined,
          startDate: p.startDate ?? undefined,
          endDate: p.endDate ?? undefined,
          highlights: (p.highlights as string[]) || [],
          isPublic: p.isPublic,
          courseId: p.courseId ?? undefined,
          courseName: p.course?.title ?? undefined,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
      } catch (projectsError) {
        logger.warn('[PORTFOLIO] Failed to get projects, using empty array:', projectsError);
        // Projects will remain as empty array
      }
    }

    // Get skills
    let skills: PortfolioSkill[] = [];
    if (validatedParams.includeSkills) {
      // Get project counts per skill (do this first, doesn't depend on skillBuildTrack)
      const projectSkillCounts = new Map<string, number>();
      for (const project of projects) {
        for (const skill of project.skills) {
          projectSkillCounts.set(skill.toLowerCase(), (projectSkillCounts.get(skill.toLowerCase()) || 0) + 1);
        }
      }

      // Get certification counts per skill
      const certSkillCounts = new Map<string, number>();
      try {
        const certRecords = await db.sAMCertificationProgress.findMany({
          where: { userId: user.id, status: 'COMPLETED' },
          select: { certificationId: true },
        });
        // Note: certSkillCounts would need skill mapping from certifications
        // For now, keeping it empty as the original code doesn't populate it
      } catch (certError) {
        logger.warn('[PORTFOLIO] Failed to get certification records:', certError);
      }

      // Safely get skill profiles with fallback
      try {
        const skillProfiles = await skillBuildTrackStore.getUserSkillProfiles(user.id);

        skills = skillProfiles.map((profile) => {
          const skillNameLower = (profile.skill?.name ?? profile.skillId).toLowerCase();
          return {
            skillId: profile.skillId,
            skillName: profile.skill?.name ?? profile.skillId,
            proficiencyLevel: profile.proficiencyLevel,
            compositeScore: profile.compositeScore,
            category: profile.skill?.category ?? 'TECHNICAL',
            lastPracticedAt: profile.lastPracticedAt ?? undefined,
            projectCount: projectSkillCounts.get(skillNameLower) || 0,
            certificationCount: certSkillCounts.get(skillNameLower) || 0,
            verificationStatus: determineVerificationStatus(
              (certSkillCounts.get(skillNameLower) || 0) > 0,
              profile.practiceHistory.totalSessions > 10,
              false
            ),
          };
        });

        // Sort by composite score
        skills.sort((a, b) => b.compositeScore - a.compositeScore);
      } catch (skillError) {
        logger.warn('[PORTFOLIO] Failed to get skill profiles, using empty array:', skillError);
        // Skills will remain as empty array - this is acceptable for the portfolio
      }
    }

    // Get certifications with fallback
    let certifications: PortfolioCertification[] = [];
    if (validatedParams.includeCertifications) {
      try {
        const certRecords = await db.sAMCertificationProgress.findMany({
          where: {
            userId: user.id,
            status: { in: ['COMPLETED', 'IN_PROGRESS'] },
          },
          orderBy: { completedDate: 'desc' },
        });

        certifications = certRecords.map((c) => ({
          certificationId: c.certificationId,
          certificationName: c.certificationName,
          provider: c.provider,
          status: c.status,
          completedDate: c.completedDate ?? undefined,
          expiryDate: c.expiryDate ?? undefined,
          credentialUrl: c.credentialUrl ?? undefined,
          credentialId: c.credentialId ?? undefined,
        }));
      } catch (certError) {
        logger.warn('[PORTFOLIO] Failed to get certifications, using empty array:', certError);
        // Certifications will remain as empty array
      }
    }

    // Get achievements with fallback
    let achievements: PortfolioAchievement[] = [];
    if (validatedParams.includeAchievements) {
      try {
        const achievementRecords = await db.achievement.findMany({
          where: { userId: user.id },
          orderBy: { earnedAt: 'desc' },
        });

        achievements = achievementRecords.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description ?? '',
          earnedAt: a.earnedAt,
          badgeUrl: a.badgeUrl ?? undefined,
          metadata: (a.metadata as Record<string, unknown>) ?? undefined,
        }));
      } catch (achievementError) {
        logger.warn('[PORTFOLIO] Failed to get achievements, using empty array:', achievementError);
        // Achievements will remain as empty array
      }
    }

    // Calculate stats with fallbacks
    let completedCourses = 0;
    let totalStudyHours = 0;

    try {
      completedCourses = await db.enrollment.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
        },
      });
    } catch (enrollmentError) {
      logger.warn('[PORTFOLIO] Failed to get completed courses count:', enrollmentError);
    }

    try {
      const totalStudyMinutes = await db.learningSession.aggregate({
        where: { userId: user.id },
        _sum: { duration: true },
      });
      totalStudyHours = Math.round((totalStudyMinutes._sum.duration || 0) / 60);
    } catch (sessionError) {
      logger.warn('[PORTFOLIO] Failed to get study hours:', sessionError);
    }

    const stats = {
      totalProjects: projects.length,
      totalSkills: skills.length,
      totalCertifications: certifications.filter((c) => c.status === 'COMPLETED').length,
      totalAchievements: achievements.length,
      totalStudyHours,
      coursesCompleted: completedCourses,
      avgSkillScore:
        skills.length > 0 ? Math.round(skills.reduce((sum, s) => sum + s.compositeScore, 0) / skills.length) : 0,
    };

    const portfolio: Portfolio = {
      userId: user.id,
      userName: user.name || 'Anonymous',
      userImage: user.image ?? undefined,
      settings: {
        isPublic: portfolioSettings.isPublic,
        title: portfolioSettings.title,
        bio: portfolioSettings.bio ?? undefined,
        headline: portfolioSettings.headline ?? undefined,
        socialLinks: (portfolioSettings.socialLinks as Portfolio['settings']['socialLinks']) ?? undefined,
        theme: portfolioSettings.theme,
        featuredProjectIds: (portfolioSettings.featuredProjectIds as string[]) || [],
        featuredSkillIds: (portfolioSettings.featuredSkillIds as string[]) || [],
      },
      projects,
      skills,
      certifications,
      achievements,
      stats,
    };

    return NextResponse.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    logger.error('[PORTFOLIO] Get error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get portfolio' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a project to portfolio
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateProjectSchema.parse(body);

    // Create project
    const project = await db.sAMPortfolioProject.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        skills: validatedData.skills,
        technologies: validatedData.technologies,
        url: validatedData.url,
        repositoryUrl: validatedData.repositoryUrl,
        imageUrl: validatedData.imageUrl,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        highlights: validatedData.highlights,
        isPublic: validatedData.isPublic,
        courseId: validatedData.courseId,
      },
    });

    logger.info('[PORTFOLIO] Project created', { userId: user.id, projectId: project.id });

    return NextResponse.json({
      success: true,
      data: {
        projectId: project.id,
        title: project.title,
        message: 'Project added to portfolio successfully',
      },
    });
  } catch (error) {
    logger.error('[PORTFOLIO] Create project error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid project data', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update portfolio settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = UpdatePortfolioSettingsSchema.parse(body);

    // Update portfolio settings
    const settings = await db.sAMPortfolioSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isPublic: validatedData.isPublic ?? false,
        title: validatedData.title ?? `${user.name || 'User'}&apos;s Portfolio`,
        bio: validatedData.bio,
        headline: validatedData.headline,
        socialLinks: validatedData.socialLinks,
        theme: validatedData.theme ?? 'professional',
        featuredProjectIds: validatedData.featuredProjectIds ?? [],
        featuredSkillIds: validatedData.featuredSkillIds ?? [],
      },
      update: {
        ...(validatedData.isPublic !== undefined && { isPublic: validatedData.isPublic }),
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        ...(validatedData.headline !== undefined && { headline: validatedData.headline }),
        ...(validatedData.socialLinks !== undefined && { socialLinks: validatedData.socialLinks }),
        ...(validatedData.theme !== undefined && { theme: validatedData.theme }),
        ...(validatedData.featuredProjectIds !== undefined && {
          featuredProjectIds: validatedData.featuredProjectIds,
        }),
        ...(validatedData.featuredSkillIds !== undefined && { featuredSkillIds: validatedData.featuredSkillIds }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        settingsId: settings.id,
        isPublic: settings.isPublic,
        message: 'Portfolio settings updated successfully',
      },
    });
  } catch (error) {
    logger.error('[PORTFOLIO] Update settings error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid settings data', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update portfolio settings' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a project from portfolio
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'projectId is required' } },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const project = await db.sAMPortfolioProject.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    await db.sAMPortfolioProject.delete({
      where: { id: projectId },
    });

    logger.info('[PORTFOLIO] Project deleted', { userId: user.id, projectId });

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        message: 'Project removed from portfolio',
      },
    });
  } catch (error) {
    logger.error('[PORTFOLIO] Delete project error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete project' } },
      { status: 500 }
    );
  }
}
