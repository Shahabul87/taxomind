import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Force Node.js runtime
export const runtime = 'nodejs';

const PublishRequestSchema = z.object({
  adminOverride: z.boolean().optional().default(false),
  skipQualityGate: z.boolean().optional().default(false),
});

interface QualityGateIssue {
  id: string;
  type: 'error' | 'warning';
  title: string;
  description: string;
  level?: string;
  fixAction?: string;
}

interface BloomsDistribution {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

const BLOOM_KEYWORDS = {
  create: ['create', 'design', 'build', 'compose', 'develop', 'generate', 'produce', 'construct', 'formulate', 'plan', 'project'],
  evaluate: ['evaluate', 'assess', 'critique', 'judge', 'review', 'validate', 'defend', 'justify', 'argue', 'recommend', 'decide'],
  analyze: ['analyze', 'examine', 'compare', 'contrast', 'investigate', 'categorize', 'differentiate', 'organize', 'deconstruct', 'debug'],
  apply: ['apply', 'implement', 'use', 'demonstrate', 'solve', 'execute', 'operate', 'practice', 'employ', 'utilize', 'exercise', 'hands-on'],
  understand: ['explain', 'describe', 'interpret', 'summarize', 'classify', 'discuss', 'identify', 'recognize', 'translate', 'example', 'concept'],
  remember: ['define', 'list', 'name', 'state', 'recall', 'repeat', 'memorize', 'match', 'select', 'choose', 'intro', 'overview'],
};

export async function PATCH(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user?.id;

    // Parse request body for override options
    let body = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, use defaults
    }
    const { adminOverride, skipQualityGate } = PublishRequestSchema.parse(body);

    // Check if user is admin (for override capability)
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
      include: {
        chapters: {
          include: {
            sections: {
              select: {
                id: true,
                title: true,
                isPublished: true,
              },
            },
          },
        },
        attachments: true,
        cognitiveQuality: true,
      }
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Define sections as individual items for tracking completion
    const sections = {
      titleDesc: Boolean(course.title && course.description),
      learningObj: Boolean(course.whatYouWillLearn && course.whatYouWillLearn.length > 0),
      image: Boolean(course.imageUrl),
      pricing: Boolean(course.price !== null && course.price !== undefined),
      category: Boolean(course.categoryId),
      chapters: Boolean(course.chapters.length > 0),
      attachments: Boolean(course.attachments.length > 0)
    };

    // Calculate completed sections
    const completedSections = Object.values(sections).filter(Boolean).length;

    // Allow publishing if at least 2 sections are completed
    const minSectionsRequired = 2;
    const isPublishable = completedSections >= minSectionsRequired;

    if (!isPublishable) {
      return new NextResponse("At least 2 sections must be completed before publishing", { status: 401 });
    }

    // === COGNITIVE QUALITY GATE ===
    const allSections = course.chapters.flatMap((c) => c.sections);

    // Get or calculate cognitive distribution
    let distribution: BloomsDistribution;
    let cognitiveScore: number;
    let cognitiveGrade: string;

    if (course.cognitiveQuality) {
      distribution = {
        remember: course.cognitiveQuality.rememberPercent,
        understand: course.cognitiveQuality.understandPercent,
        apply: course.cognitiveQuality.applyPercent,
        analyze: course.cognitiveQuality.analyzePercent,
        evaluate: course.cognitiveQuality.evaluatePercent,
        create: course.cognitiveQuality.createPercent,
      };
      cognitiveScore = course.cognitiveQuality.cognitiveScore;
      cognitiveGrade = course.cognitiveQuality.cognitiveGrade;
    } else {
      // Calculate from content
      const analysis = analyzeContent(allSections);
      distribution = analysis.distribution;
      cognitiveScore = analysis.score;
      cognitiveGrade = analysis.grade;

      // Store the analysis
      await db.courseCognitiveQuality.create({
        data: {
          courseId: params.courseId,
          cognitiveGrade,
          cognitiveScore,
          rememberPercent: distribution.remember,
          understandPercent: distribution.understand,
          applyPercent: distribution.apply,
          analyzePercent: distribution.analyze,
          evaluatePercent: distribution.evaluate,
          createPercent: distribution.create,
        },
      });
    }

    // Check quality gate requirements
    const qualityGateResult = checkQualityGate(distribution, cognitiveScore);

    // If quality gate fails and no override, return detailed feedback
    if (!qualityGateResult.passes && !skipQualityGate) {
      if (adminOverride && isAdmin) {
        // Log admin override for audit
        logger.info(`[PUBLISH] Admin override used for course ${params.courseId} by ${userId}`);
      } else {
        return NextResponse.json({
          success: false,
          error: {
            code: 'QUALITY_GATE_FAILED',
            message: 'Course does not meet cognitive quality standards',
          },
          qualityGate: {
            passes: false,
            cognitiveGrade,
            cognitiveScore,
            issues: qualityGateResult.issues,
            distribution,
          },
          requiresAdminOverride: true,
        }, { status: 400 });
      }
    }

    // Update cognitive quality with gate status
    await db.courseCognitiveQuality.upsert({
      where: { courseId: params.courseId },
      create: {
        courseId: params.courseId,
        cognitiveGrade,
        cognitiveScore,
        meetsQualityGate: qualityGateResult.passes,
        rememberPercent: distribution.remember,
        understandPercent: distribution.understand,
        applyPercent: distribution.apply,
        analyzePercent: distribution.analyze,
        evaluatePercent: distribution.evaluate,
        createPercent: distribution.create,
      },
      update: {
        meetsQualityGate: qualityGateResult.passes || (adminOverride && isAdmin),
      },
    });

    const publishedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId,
      },
      data: {
        isPublished: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: publishedCourse,
      qualityGate: {
        passes: qualityGateResult.passes,
        cognitiveGrade,
        cognitiveScore,
        adminOverrideUsed: adminOverride && isAdmin && !qualityGateResult.passes,
      },
    });
  } catch (error) {
    logger.error("[COURSE_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

function analyzeContent(sections: { id: string; title: string }[]): {
  distribution: BloomsDistribution;
  score: number;
  grade: string;
} {
  if (sections.length === 0) {
    return {
      distribution: { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 },
      score: 0,
      grade: 'D',
    };
  }

  const counts = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };

  sections.forEach((section) => {
    const title = section.title.toLowerCase();
    let assigned = false;

    for (const [level, words] of Object.entries(BLOOM_KEYWORDS)) {
      if (words.some((word) => title.includes(word))) {
        counts[level as keyof typeof counts]++;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      counts.understand++;
    }
  });

  const total = sections.length;
  const distribution: BloomsDistribution = {
    remember: Math.round((counts.remember / total) * 100),
    understand: Math.round((counts.understand / total) * 100),
    apply: Math.round((counts.apply / total) * 100),
    analyze: Math.round((counts.analyze / total) * 100),
    evaluate: Math.round((counts.evaluate / total) * 100),
    create: Math.round((counts.create / total) * 100),
  };

  // Calculate score
  const levels = Object.values(distribution);
  const activeLevels = levels.filter((v) => v > 5).length;
  const higherOrder = distribution.apply + distribution.analyze + distribution.evaluate + distribution.create;
  const maxLevel = Math.max(...levels);

  let score = 50;
  score += activeLevels * 5;
  score += Math.min(higherOrder / 2, 15);
  score -= maxLevel > 50 ? (maxLevel - 50) / 2 : 0;
  score = Math.max(0, Math.min(100, score));

  let grade = 'D';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';

  return { distribution, score: Math.round(score), grade };
}

function checkQualityGate(distribution: BloomsDistribution, score: number): {
  passes: boolean;
  issues: QualityGateIssue[];
} {
  const issues: QualityGateIssue[] = [];

  // Check 1: Minimum 3 Bloom's levels represented (> 5%)
  const activeLevels = Object.values(distribution).filter((v) => v > 5).length;
  if (activeLevels < 3) {
    issues.push({
      id: 'level_diversity',
      type: 'error',
      title: 'Insufficient Cognitive Diversity',
      description: `Only ${activeLevels} Bloom's levels are represented. Minimum 3 required.`,
      fixAction: 'Add content at different cognitive levels',
    });
  }

  // Check 2: No single level > 50%
  const levels = Object.entries(distribution);
  const dominantLevel = levels.find(([, v]) => v > 50);
  if (dominantLevel) {
    issues.push({
      id: 'single_dominance',
      type: 'error',
      title: 'Single Level Dominance',
      description: `${dominantLevel[0].charAt(0).toUpperCase() + dominantLevel[0].slice(1)} content is ${dominantLevel[1]}% of the course. Maximum 50% allowed.`,
      level: dominantLevel[0].toUpperCase(),
      fixAction: 'Diversify content across cognitive levels',
    });
  }

  // Check 3: At least 15% in Apply+ levels (3-6)
  const higherOrderRatio = distribution.apply + distribution.analyze + distribution.evaluate + distribution.create;
  if (higherOrderRatio < 15) {
    issues.push({
      id: 'higher_order_ratio',
      type: 'error',
      title: 'Insufficient Higher-Order Content',
      description: `Only ${Math.round(higherOrderRatio)}% of content is at Apply+ levels. Minimum 15% required.`,
      fixAction: 'Add hands-on exercises, case studies, or projects',
    });
  }

  // Warning: Low evaluation/creation content
  if (distribution.evaluate + distribution.create < 5) {
    issues.push({
      id: 'low_evaluation_creation',
      type: 'warning',
      title: 'Limited Evaluation/Creation Content',
      description: 'Consider adding peer review activities or creative projects.',
    });
  }

  // Warning: Very low overall score
  if (score < 50) {
    issues.push({
      id: 'low_score',
      type: 'warning',
      title: 'Low Cognitive Quality Score',
      description: `Your course scored ${score}/100. Consider improving content diversity.`,
    });
  }

  const hasErrors = issues.some((i) => i.type === 'error');

  return {
    passes: !hasErrors,
    issues,
  };
}