import { NextResponse } from 'next/server';
import { z } from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const RecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(['quick_win', 'improvement', 'advanced']),
  title: z.string(),
  description: z.string(),
  level: z.string(),
  impact: z.number().min(0).max(30),
  chapterId: z.string().optional(),
  chapterTitle: z.string().optional(),
  actionLabel: z.string(),
});

type Recommendation = z.infer<typeof RecommendationSchema>;

interface BloomsDistribution {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

const OPTIMAL_DISTRIBUTION = {
  remember: 15,
  understand: 25,
  apply: 25,
  analyze: 15,
  evaluate: 10,
  create: 10,
};

const LEVEL_NAMES = {
  remember: 'REMEMBER',
  understand: 'UNDERSTAND',
  apply: 'APPLY',
  analyze: 'ANALYZE',
  evaluate: 'EVALUATE',
  create: 'CREATE',
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: {
            sections: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                isPublished: true,
              },
            },
          },
        },
        cognitiveQuality: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Get or calculate distribution
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
      // Analyze course if no cognitive quality exists
      const allSections = course.chapters.flatMap((c) => c.sections);
      const analysis = analyzeContent(allSections);
      distribution = analysis.distribution;
      cognitiveScore = analysis.score;
      cognitiveGrade = analysis.grade;

      // Store the analysis
      await db.courseCognitiveQuality.create({
        data: {
          courseId,
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

    // Generate recommendations based on distribution
    const recommendations = generateRecommendations(
      distribution,
      course.chapters,
      cognitiveScore
    );

    return NextResponse.json({
      success: true,
      data: {
        courseId,
        currentGrade: cognitiveGrade,
        currentScore: cognitiveScore,
        distribution,
        recommendations,
      },
    });
  } catch (error) {
    logger.error('[COGNITIVE_RECOMMENDATIONS]', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    );
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

  const keywords = {
    create: ['create', 'design', 'build', 'compose', 'develop', 'generate', 'produce', 'construct', 'formulate', 'plan', 'project'],
    evaluate: ['evaluate', 'assess', 'critique', 'judge', 'review', 'validate', 'defend', 'justify', 'argue', 'recommend', 'decide'],
    analyze: ['analyze', 'examine', 'compare', 'contrast', 'investigate', 'categorize', 'differentiate', 'organize', 'deconstruct', 'debug'],
    apply: ['apply', 'implement', 'use', 'demonstrate', 'solve', 'execute', 'operate', 'practice', 'employ', 'utilize', 'exercise', 'hands-on'],
    understand: ['explain', 'describe', 'interpret', 'summarize', 'classify', 'discuss', 'identify', 'recognize', 'translate', 'example', 'concept'],
    remember: ['define', 'list', 'name', 'state', 'recall', 'repeat', 'memorize', 'match', 'select', 'choose', 'intro', 'overview'],
  };

  sections.forEach((section) => {
    const title = section.title.toLowerCase();
    let assigned = false;

    for (const [level, words] of Object.entries(keywords)) {
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

  // Calculate score based on cognitive diversity and balance
  const levels = Object.values(distribution);
  const activeLevels = levels.filter((v) => v > 5).length;
  const higherOrder = distribution.apply + distribution.analyze + distribution.evaluate + distribution.create;
  const maxLevel = Math.max(...levels);

  let score = 50;
  score += activeLevels * 5; // Up to 30 points for diversity
  score += Math.min(higherOrder / 2, 15); // Up to 15 points for higher-order
  score -= maxLevel > 50 ? (maxLevel - 50) / 2 : 0; // Penalize dominance
  score = Math.max(0, Math.min(100, score));

  let grade = 'D';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';

  return { distribution, score: Math.round(score), grade };
}

function generateRecommendations(
  distribution: BloomsDistribution,
  chapters: { id: string; title: string; sections: { id: string; title: string }[] }[],
  currentScore: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let recId = 0;

  // Find chapters with the most imbalance (good targets for improvement)
  const chapterAnalysis = chapters.map((chapter) => {
    const sectionCount = chapter.sections.length;
    return {
      id: chapter.id,
      title: chapter.title,
      sectionCount,
    };
  });

  const targetChapter = chapterAnalysis.find((c) => c.sectionCount > 0) || chapterAnalysis[0];

  // Quick Wins: Easy changes with high impact
  if (distribution.apply < 15) {
    recommendations.push({
      id: `rec_${++recId}`,
      type: 'quick_win',
      title: 'Add a Hands-on Exercise',
      description: `Add a practice exercise or coding challenge to ${targetChapter?.title || 'one of your chapters'}. Hands-on activities help students apply what they learn.`,
      level: LEVEL_NAMES.apply,
      impact: 8,
      chapterId: targetChapter?.id,
      chapterTitle: targetChapter?.title,
      actionLabel: 'Add Exercise',
    });
  }

  if (distribution.analyze < 10) {
    recommendations.push({
      id: `rec_${++recId}`,
      type: 'quick_win',
      title: 'Add a Case Study',
      description: 'Include a real-world case study that students can analyze. This helps develop critical thinking skills.',
      level: LEVEL_NAMES.analyze,
      impact: 7,
      chapterId: targetChapter?.id,
      chapterTitle: targetChapter?.title,
      actionLabel: 'Add Case Study',
    });
  }

  if (distribution.evaluate < 5 && currentScore < 80) {
    recommendations.push({
      id: `rec_${++recId}`,
      type: 'quick_win',
      title: 'Add an Evaluation Quiz',
      description: 'Create a quiz where students must critique or compare two different approaches to solving a problem.',
      level: LEVEL_NAMES.evaluate,
      impact: 6,
      actionLabel: 'Add Quiz',
    });
  }

  // Improvements: Moderate effort, good impact
  const maxLevel = Math.max(...Object.values(distribution));
  const dominantLevel = Object.entries(distribution).find(([, v]) => v === maxLevel)?.[0];

  if (maxLevel > 50 && dominantLevel) {
    recommendations.push({
      id: `rec_${++recId}`,
      type: 'improvement',
      title: `Balance ${dominantLevel.charAt(0).toUpperCase() + dominantLevel.slice(1)} Content`,
      description: `Your course has ${maxLevel}% ${dominantLevel} content. Consider converting some sections to higher-order activities.`,
      level: LEVEL_NAMES[dominantLevel as keyof typeof LEVEL_NAMES],
      impact: 10,
      actionLabel: 'View Sections',
    });
  }

  if (distribution.create < 5) {
    recommendations.push({
      id: `rec_${++recId}`,
      type: 'improvement',
      title: 'Add a Creative Project',
      description: 'Include a project where students create something original - a design, code, or solution of their own.',
      level: LEVEL_NAMES.create,
      impact: 9,
      actionLabel: 'Create Project',
    });
  }

  const activeLevels = Object.values(distribution).filter((v) => v > 5).length;
  if (activeLevels < 4) {
    const missingLevels = Object.entries(distribution)
      .filter(([, v]) => v <= 5)
      .map(([k]) => k);

    recommendations.push({
      id: `rec_${++recId}`,
      type: 'improvement',
      title: 'Increase Cognitive Diversity',
      description: `Your course is missing or weak in: ${missingLevels.join(', ')}. Adding content at these levels improves learning outcomes.`,
      level: missingLevels[0] ? LEVEL_NAMES[missingLevels[0] as keyof typeof LEVEL_NAMES] : 'APPLY',
      impact: 12,
      actionLabel: 'Add Content',
    });
  }

  // Advanced: Higher effort, transformational impact
  if (currentScore < 70) {
    recommendations.push({
      id: `rec_${++recId}`,
      type: 'advanced',
      title: 'Implement Problem-Based Learning',
      description: 'Restructure a chapter around a complex problem students must solve progressively, touching all cognitive levels.',
      level: LEVEL_NAMES.analyze,
      impact: 15,
      actionLabel: 'Learn More',
    });
  }

  if (distribution.evaluate < 10 && distribution.create < 10) {
    recommendations.push({
      id: `rec_${++recId}`,
      type: 'advanced',
      title: 'Add Peer Review Assignment',
      description: 'Students create work, then evaluate peer submissions. This develops both creation and evaluation skills.',
      level: LEVEL_NAMES.evaluate,
      impact: 12,
      actionLabel: 'Setup Peer Review',
    });
  }

  recommendations.push({
    id: `rec_${++recId}`,
    type: 'advanced',
    title: 'Create Capstone Project',
    description: 'Design a comprehensive final project that integrates all concepts and requires students to create an original solution.',
    level: LEVEL_NAMES.create,
    impact: 15,
    actionLabel: 'Design Capstone',
  });

  // Sort by type priority, then by impact
  const typePriority = { quick_win: 3, improvement: 2, advanced: 1 };
  return recommendations.sort((a, b) => {
    const typeCompare = typePriority[b.type] - typePriority[a.type];
    if (typeCompare !== 0) return typeCompare;
    return b.impact - a.impact;
  });
}
