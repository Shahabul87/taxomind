/**
 * SAM AI - Certification Pathways API
 *
 * Provides certification recommendations based on user skills,
 * career goals, and market demand. Tracks certification progress
 * and generates learning paths toward credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getStore, getLearningPathStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetCertificationsSchema = z.object({
  skillId: z.string().uuid().optional(),
  category: z
    .enum(['CLOUD', 'SECURITY', 'DATA', 'DEVELOPMENT', 'PROJECT_MANAGEMENT', 'DESIGN', 'MARKETING', 'OTHER'])
    .optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  includeInProgress: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

const CreateCertProgressSchema = z.object({
  certificationId: z.string(),
  certificationName: z.string(),
  provider: z.string(),
  targetDate: z.string().datetime().optional(),
  studyPlanId: z.string().uuid().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

interface CertificationRecommendation {
  id: string;
  name: string;
  provider: string;
  category: string;
  difficulty: string;
  description: string;
  skillsRequired: Array<{ skillId: string; skillName: string; userLevel: number; requiredLevel: number }>;
  skillsCovered: string[];
  estimatedPrepTime: number; // hours
  examDuration: number; // minutes
  examCost: number;
  renewalPeriod?: number; // years
  marketValue: {
    salaryImpact: number; // percentage increase
    demandScore: number; // 0-100
    jobOpenings: number;
  };
  prerequisites: string[];
  matchScore: number; // 0-100
  readinessScore: number; // 0-100
  learningPath?: Array<{ step: number; title: string; description: string; duration: number }>;
}

interface CertificationProgress {
  certificationId: string;
  certificationName: string;
  provider: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED' | 'EXPIRED';
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;
  expiryDate?: Date;
  studyProgress: number; // 0-100
  practiceExamScores: number[];
  studyHoursLogged: number;
  nextMilestone?: { title: string; dueDate: Date };
}

// ============================================================================
// CERTIFICATION DATABASE (Mock data - would be external API in production)
// ============================================================================

const CERTIFICATION_DATABASE: CertificationRecommendation[] = [
  {
    id: 'aws-ccp',
    name: 'AWS Certified Cloud Practitioner',
    provider: 'Amazon Web Services',
    category: 'CLOUD',
    difficulty: 'beginner',
    description: 'Foundational understanding of AWS Cloud concepts, services, and terminology.',
    skillsRequired: [],
    skillsCovered: ['AWS', 'Cloud Computing', 'Cloud Architecture'],
    estimatedPrepTime: 40,
    examDuration: 90,
    examCost: 100,
    renewalPeriod: 3,
    marketValue: { salaryImpact: 12, demandScore: 85, jobOpenings: 15000 },
    prerequisites: [],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'aws-saa',
    name: 'AWS Solutions Architect Associate',
    provider: 'Amazon Web Services',
    category: 'CLOUD',
    difficulty: 'intermediate',
    description: 'Design and deploy scalable systems on AWS.',
    skillsRequired: [],
    skillsCovered: ['AWS', 'Cloud Architecture', 'System Design', 'Networking'],
    estimatedPrepTime: 80,
    examDuration: 130,
    examCost: 150,
    renewalPeriod: 3,
    marketValue: { salaryImpact: 20, demandScore: 92, jobOpenings: 25000 },
    prerequisites: ['aws-ccp'],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'gcp-ace',
    name: 'Google Cloud Associate Cloud Engineer',
    provider: 'Google Cloud',
    category: 'CLOUD',
    difficulty: 'intermediate',
    description: 'Deploy applications, monitor operations, and manage enterprise solutions on GCP.',
    skillsRequired: [],
    skillsCovered: ['GCP', 'Cloud Computing', 'DevOps', 'Kubernetes'],
    estimatedPrepTime: 60,
    examDuration: 120,
    examCost: 125,
    renewalPeriod: 2,
    marketValue: { salaryImpact: 18, demandScore: 78, jobOpenings: 12000 },
    prerequisites: [],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'az-900',
    name: 'Microsoft Azure Fundamentals',
    provider: 'Microsoft',
    category: 'CLOUD',
    difficulty: 'beginner',
    description: 'Foundational knowledge of cloud services and how they are provided with Azure.',
    skillsRequired: [],
    skillsCovered: ['Azure', 'Cloud Computing', 'Cloud Services'],
    estimatedPrepTime: 30,
    examDuration: 60,
    examCost: 99,
    renewalPeriod: undefined,
    marketValue: { salaryImpact: 10, demandScore: 75, jobOpenings: 10000 },
    prerequisites: [],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'pmp',
    name: 'Project Management Professional',
    provider: 'PMI',
    category: 'PROJECT_MANAGEMENT',
    difficulty: 'advanced',
    description: 'Gold standard for project management professionals.',
    skillsRequired: [],
    skillsCovered: ['Project Management', 'Leadership', 'Risk Management', 'Agile'],
    estimatedPrepTime: 150,
    examDuration: 230,
    examCost: 555,
    renewalPeriod: 3,
    marketValue: { salaryImpact: 25, demandScore: 88, jobOpenings: 30000 },
    prerequisites: [],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'csm',
    name: 'Certified ScrumMaster',
    provider: 'Scrum Alliance',
    category: 'PROJECT_MANAGEMENT',
    difficulty: 'intermediate',
    description: 'Foundation for Scrum and Agile methodologies.',
    skillsRequired: [],
    skillsCovered: ['Scrum', 'Agile', 'Team Leadership', 'Sprint Planning'],
    estimatedPrepTime: 16,
    examDuration: 60,
    examCost: 495,
    renewalPeriod: 2,
    marketValue: { salaryImpact: 15, demandScore: 82, jobOpenings: 18000 },
    prerequisites: [],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'security-plus',
    name: 'CompTIA Security+',
    provider: 'CompTIA',
    category: 'SECURITY',
    difficulty: 'intermediate',
    description: 'Baseline skills necessary to perform core security functions.',
    skillsRequired: [],
    skillsCovered: ['Cybersecurity', 'Network Security', 'Risk Management', 'Compliance'],
    estimatedPrepTime: 90,
    examDuration: 90,
    examCost: 392,
    renewalPeriod: 3,
    marketValue: { salaryImpact: 18, demandScore: 90, jobOpenings: 20000 },
    prerequisites: [],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'cissp',
    name: 'CISSP',
    provider: 'ISC2',
    category: 'SECURITY',
    difficulty: 'expert',
    description: 'Premier certification for information security professionals.',
    skillsRequired: [],
    skillsCovered: ['Security Architecture', 'Risk Management', 'Cryptography', 'Security Operations'],
    estimatedPrepTime: 200,
    examDuration: 360,
    examCost: 749,
    renewalPeriod: 3,
    marketValue: { salaryImpact: 35, demandScore: 95, jobOpenings: 15000 },
    prerequisites: ['security-plus'],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'tensorflow-dev',
    name: 'TensorFlow Developer Certificate',
    provider: 'Google',
    category: 'DATA',
    difficulty: 'intermediate',
    description: 'Build and train neural networks using TensorFlow.',
    skillsRequired: [],
    skillsCovered: ['TensorFlow', 'Machine Learning', 'Deep Learning', 'Python'],
    estimatedPrepTime: 100,
    examDuration: 300,
    examCost: 100,
    renewalPeriod: 3,
    marketValue: { salaryImpact: 22, demandScore: 85, jobOpenings: 8000 },
    prerequisites: [],
    matchScore: 0,
    readinessScore: 0,
  },
  {
    id: 'data-engineer-gcp',
    name: 'Google Cloud Professional Data Engineer',
    provider: 'Google Cloud',
    category: 'DATA',
    difficulty: 'advanced',
    description: 'Design and build data processing systems on Google Cloud.',
    skillsRequired: [],
    skillsCovered: ['Data Engineering', 'BigQuery', 'Cloud Dataflow', 'Machine Learning'],
    estimatedPrepTime: 120,
    examDuration: 120,
    examCost: 200,
    renewalPeriod: 2,
    marketValue: { salaryImpact: 28, demandScore: 88, jobOpenings: 12000 },
    prerequisites: ['gcp-ace'],
    matchScore: 0,
    readinessScore: 0,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateMatchScore(
  certification: CertificationRecommendation,
  userSkills: Map<string, number>,
  careerGoals: string[]
): number {
  let score = 50; // Base score

  // Check skill coverage alignment
  const coveredSkills = certification.skillsCovered.map((s) => s.toLowerCase());
  const userSkillNames = Array.from(userSkills.keys()).map((s) => s.toLowerCase());

  // Bonus for skills user already has
  const matchingSkills = coveredSkills.filter((s) =>
    userSkillNames.some((us) => us.includes(s) || s.includes(us))
  );
  score += Math.min(30, matchingSkills.length * 10);

  // Bonus for career goal alignment
  const categoryLower = certification.category.toLowerCase();
  if (careerGoals.some((g) => g.toLowerCase().includes(categoryLower))) {
    score += 15;
  }

  // Bonus for market value
  if (certification.marketValue.demandScore > 80) score += 5;
  if (certification.marketValue.salaryImpact > 20) score += 5;

  return Math.min(100, Math.max(0, score));
}

function calculateReadinessScore(
  certification: CertificationRecommendation,
  userSkills: Map<string, number>,
  completedCerts: string[]
): number {
  let score = 70; // Base readiness

  // Check prerequisites
  const missingPrereqs = certification.prerequisites.filter(
    (p) => !completedCerts.includes(p)
  );
  if (missingPrereqs.length > 0) {
    score -= missingPrereqs.length * 20;
  }

  // Check related skill levels
  const relatedSkills = certification.skillsCovered;
  const userSkillNames = Array.from(userSkills.keys());
  let totalLevel = 0;
  let matchCount = 0;

  for (const skill of relatedSkills) {
    const matchingSkill = userSkillNames.find(
      (us) => us.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(us.toLowerCase())
    );
    if (matchingSkill) {
      totalLevel += userSkills.get(matchingSkill) || 0;
      matchCount++;
    }
  }

  if (matchCount > 0) {
    const avgLevel = totalLevel / matchCount;
    if (avgLevel >= 80) score += 20;
    else if (avgLevel >= 60) score += 10;
    else if (avgLevel < 40) score -= 15;
  }

  return Math.min(100, Math.max(0, score));
}

function generateLearningPath(
  certification: CertificationRecommendation
): Array<{ step: number; title: string; description: string; duration: number }> {
  const totalHours = certification.estimatedPrepTime;
  const steps: Array<{ step: number; title: string; description: string; duration: number }> = [];

  // Standard learning path structure
  steps.push({
    step: 1,
    title: 'Foundation Review',
    description: `Review core concepts and prerequisites for ${certification.name}`,
    duration: Math.round(totalHours * 0.15),
  });

  steps.push({
    step: 2,
    title: 'Core Material Study',
    description: 'Study official documentation and training materials',
    duration: Math.round(totalHours * 0.35),
  });

  steps.push({
    step: 3,
    title: 'Hands-on Practice',
    description: 'Complete labs and practical exercises',
    duration: Math.round(totalHours * 0.25),
  });

  steps.push({
    step: 4,
    title: 'Practice Exams',
    description: 'Take practice tests and review weak areas',
    duration: Math.round(totalHours * 0.15),
  });

  steps.push({
    step: 5,
    title: 'Final Review',
    description: 'Review key topics and exam strategies',
    duration: Math.round(totalHours * 0.1),
  });

  return steps;
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - Get certification recommendations and progress
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
    const validatedParams = GetCertificationsSchema.parse({
      skillId: searchParams.get('skillId') || undefined,
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      includeInProgress: searchParams.get('includeInProgress') || 'true',
      limit: searchParams.get('limit') || '20',
    });

    const skillBuildTrackStore = getStore('skillBuildTrack');

    // Get user skill profiles
    const skillProfiles = await skillBuildTrackStore.getUserSkillProfiles(user.id);
    const userSkills = new Map<string, number>(
      skillProfiles.map((p) => [p.skill?.name ?? p.skillId, p.compositeScore])
    );

    // Get user career goals (would come from goal store in production)
    const careerGoals: string[] = ['cloud', 'development', 'data'];

    // Get completed certifications from database
    const completedCertRecords = await db.sAMCertificationProgress.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
      select: { certificationId: true },
    });
    const completedCerts = completedCertRecords.map((c) => c.certificationId);

    // Filter and score certifications
    let recommendations = CERTIFICATION_DATABASE.map((cert) => ({
      ...cert,
      matchScore: calculateMatchScore(cert, userSkills, careerGoals),
      readinessScore: calculateReadinessScore(cert, userSkills, completedCerts),
      learningPath: generateLearningPath(cert),
    }));

    // Apply filters
    if (validatedParams.category) {
      recommendations = recommendations.filter((r) => r.category === validatedParams.category);
    }
    if (validatedParams.difficulty) {
      recommendations = recommendations.filter((r) => r.difficulty === validatedParams.difficulty);
    }

    // Sort by match score and limit
    recommendations = recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, validatedParams.limit);

    // Get in-progress certifications
    let inProgress: CertificationProgress[] = [];
    if (validatedParams.includeInProgress) {
      const progressRecords = await db.sAMCertificationProgress.findMany({
        where: {
          userId: user.id,
          status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
        },
      });

      inProgress = progressRecords.map((record) => ({
        certificationId: record.certificationId,
        certificationName: record.certificationName,
        provider: record.provider,
        status: record.status as CertificationProgress['status'],
        startDate: record.startDate ?? undefined,
        targetDate: record.targetDate ?? undefined,
        completedDate: record.completedDate ?? undefined,
        studyProgress: record.studyProgress,
        practiceExamScores: (record.practiceExamScores as number[]) ?? [],
        studyHoursLogged: record.studyHoursLogged,
        nextMilestone: record.nextMilestone
          ? {
              title: (record.nextMilestone as { title: string; dueDate: string }).title,
              dueDate: new Date((record.nextMilestone as { title: string; dueDate: string }).dueDate),
            }
          : undefined,
      }));
    }

    // Calculate summary stats
    const totalCompleted = completedCerts.length;
    const avgReadiness =
      recommendations.length > 0
        ? Math.round(recommendations.reduce((sum, r) => sum + r.readinessScore, 0) / recommendations.length)
        : 0;
    const topCategory =
      recommendations.length > 0
        ? recommendations.reduce((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + r.matchScore;
            return acc;
          }, {} as Record<string, number>)
        : {};
    const bestCategory = Object.entries(topCategory).sort(([, a], [, b]) => b - a)[0]?.[0] || 'CLOUD';

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCompleted,
          inProgressCount: inProgress.length,
          recommendationCount: recommendations.length,
          avgReadinessScore: avgReadiness,
          suggestedCategory: bestCategory,
        },
        recommendations,
        inProgress,
        completedIds: completedCerts,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[CERTIFICATION PATHWAYS] Get error:', error);

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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get certification recommendations' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Start tracking a certification
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
    const validatedData = CreateCertProgressSchema.parse(body);

    // Check if already tracking this certification
    const existing = await db.sAMCertificationProgress.findFirst({
      where: {
        userId: user.id,
        certificationId: validatedData.certificationId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ALREADY_EXISTS', message: 'Already tracking this certification' },
        },
        { status: 400 }
      );
    }

    // Create new progress record
    const progress = await db.sAMCertificationProgress.create({
      data: {
        userId: user.id,
        certificationId: validatedData.certificationId,
        certificationName: validatedData.certificationName,
        provider: validatedData.provider,
        status: 'IN_PROGRESS',
        startDate: new Date(),
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        studyProgress: 0,
        studyHoursLogged: 0,
        practiceExamScores: [],
      },
    });

    logger.info('[CERTIFICATION PATHWAYS] Started tracking certification', {
      userId: user.id,
      certificationId: validatedData.certificationId,
    });

    return NextResponse.json({
      success: true,
      data: {
        progressId: progress.id,
        certificationId: progress.certificationId,
        status: progress.status,
        startDate: progress.startDate,
        message: `Started tracking ${validatedData.certificationName}`,
      },
    });
  } catch (error) {
    logger.error('[CERTIFICATION PATHWAYS] Create error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start certification tracking' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update certification progress
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
    const { certificationId, studyProgress, studyHoursLogged, practiceExamScore, status, completedDate } = body;

    if (!certificationId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'certificationId is required' } },
        { status: 400 }
      );
    }

    // Find existing progress
    const existing = await db.sAMCertificationProgress.findFirst({
      where: {
        userId: user.id,
        certificationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Certification progress not found' } },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (studyProgress !== undefined) updateData.studyProgress = studyProgress;
    if (studyHoursLogged !== undefined) updateData.studyHoursLogged = studyHoursLogged;
    if (status !== undefined) updateData.status = status;
    if (completedDate !== undefined) updateData.completedDate = new Date(completedDate);

    // Add practice exam score to array
    if (practiceExamScore !== undefined) {
      const currentScores = (existing.practiceExamScores as number[]) || [];
      updateData.practiceExamScores = [...currentScores, practiceExamScore];
    }

    // Update progress
    const updated = await db.sAMCertificationProgress.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        progressId: updated.id,
        certificationId: updated.certificationId,
        studyProgress: updated.studyProgress,
        status: updated.status,
        message: 'Progress updated successfully',
      },
    });
  } catch (error) {
    logger.error('[CERTIFICATION PATHWAYS] Update error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update certification progress' } },
      { status: 500 }
    );
  }
}
