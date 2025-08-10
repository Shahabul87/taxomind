import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface CognitiveAssessment {
  courseId: string;
  overallHealth: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  bloomsDistribution: {
    level: BloomsLevel;
    percentage: number;
    sectionCount: number;
    optimalPercentage: number;
    deviation: number;
    status: 'missing' | 'deficient' | 'balanced' | 'excessive';
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'structure' | 'content' | 'assessment' | 'progression';
    action: string;
    rationale: string;
    estimatedImpact: number; // 0-1 scale
    implementation: string[];
  }[];
  learningPathOptimization: {
    currentPath: string[];
    optimizedPath: string[];
    improvements: string[];
  };
  cognitiveGaps: {
    level: BloomsLevel;
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    solutions: string[];
  }[];
}

type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

const OPTIMAL_BLOOM_DISTRIBUTION = {
  REMEMBER: 20,
  UNDERSTAND: 25, 
  APPLY: 20,
  ANALYZE: 15,
  EVALUATE: 10,
  CREATE: 10
};

const BLOOM_HIERARCHY = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {

    // Get current user
    const user = await currentUser();
    
    if (!user?.id) {

      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check user role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true }
    });
    
    const userRole = dbUser?.role;
    
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {

      return new NextResponse(`Forbidden - Teachers only. Your role: ${userRole}`, { status: 403 });
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
                // TODO: Add bloomsLevel, contentType fields when available
              },
            },
          },
        },
      },
    });
    
    if (!course) {
      return new NextResponse("Course not found or access denied", { status: 404 });
    }

    // Perform cognitive assessment
    const assessment = await analyzeCognitiveStructure(course);

    return NextResponse.json(assessment);
    
  } catch (error) {
    logger.error("[COGNITIVE_ASSESSMENT] Error:", error);
    
    if (error instanceof Error) {
      logger.error("[COGNITIVE_ASSESSMENT] Error message:", error.message);
      logger.error("[COGNITIVE_ASSESSMENT] Error stack:", error.stack);
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function analyzeCognitiveStructure(course: any): Promise<CognitiveAssessment> {

  const allSections = course.chapters.flatMap((chapter: any) => chapter.sections);
  const totalSections = allSections.length;
  
  if (totalSections === 0) {
    return {
      courseId: course.id,
      overallHealth: 'poor',
      bloomsDistribution: [],
      recommendations: [{
        priority: 'high',
        category: 'structure',
        action: 'Add course content',
        rationale: 'Course has no sections to analyze',
        estimatedImpact: 1.0,
        implementation: ['Create chapters and sections', 'Add learning content', 'Define learning objectives']
      }],
      learningPathOptimization: {
        currentPath: [],
        optimizedPath: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
        improvements: ['Start with foundational content']
      },
      cognitiveGaps: [{
        level: 'REMEMBER',
        severity: 'critical',
        description: 'No content available for analysis',
        solutions: ['Create basic learning content']
      }]
    };
  }
  
  // Analyze Bloom's distribution (using content analysis since bloomsLevel field doesn't exist yet)
  const bloomsDistribution = await analyzeBloomsDistribution(allSections, totalSections);
  
  // Calculate overall health
  const overallHealth = calculateOverallHealth(bloomsDistribution);
  
  // Generate recommendations
  const recommendations = generateCognitiveRecommendations(bloomsDistribution, course);
  
  // Optimize learning path
  const learningPathOptimization = optimizeLearningPath(bloomsDistribution, course);
  
  // Identify cognitive gaps
  const cognitiveGaps = identifyCognitiveGaps(bloomsDistribution);
  
  return {
    courseId: course.id,
    overallHealth,
    bloomsDistribution,
    recommendations,
    learningPathOptimization,
    cognitiveGaps
  };
}

async function analyzeBloomsDistribution(sections: any[], totalSections: number) {

  // Since we don't have bloomsLevel field yet, we'll analyze based on content patterns
  const bloomsCount: Record<BloomsLevel, number> = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0
  };
  
  // Analyze each section based on title and description patterns
  sections.forEach(section => {
    const level = inferBloomsLevel(section.title, section.description);
    bloomsCount[level]++;
  });
  
  // Calculate distribution
  return (Object.keys(bloomsCount) as BloomsLevel[]).map(level => {
    const count = bloomsCount[level];
    const percentage = (count / totalSections) * 100;
    const optimal = OPTIMAL_BLOOM_DISTRIBUTION[level];
    const deviation = percentage - optimal;
    
    let status: 'missing' | 'deficient' | 'balanced' | 'excessive';
    if (count === 0) status = 'missing';
    else if (deviation < -10) status = 'deficient';
    else if (deviation > 15) status = 'excessive';
    else status = 'balanced';
    
    return {
      level,
      percentage,
      sectionCount: count,
      optimalPercentage: optimal,
      deviation,
      status
    };
  });
}

function inferBloomsLevel(title: string, description: string): BloomsLevel {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Keywords for each Bloom's level
  const keywords = {
    CREATE: ['create', 'design', 'build', 'compose', 'develop', 'generate', 'produce', 'construct', 'formulate', 'plan'],
    EVALUATE: ['evaluate', 'assess', 'critique', 'judge', 'review', 'validate', 'defend', 'justify', 'argue', 'recommend'],
    ANALYZE: ['analyze', 'examine', 'compare', 'contrast', 'investigate', 'categorize', 'differentiate', 'organize', 'deconstruct'],
    APPLY: ['apply', 'implement', 'use', 'demonstrate', 'solve', 'execute', 'operate', 'practice', 'employ', 'utilize'],
    UNDERSTAND: ['explain', 'describe', 'interpret', 'summarize', 'classify', 'discuss', 'identify', 'recognize', 'translate'],
    REMEMBER: ['define', 'list', 'name', 'state', 'recall', 'repeat', 'memorize', 'match', 'select', 'choose']
  };
  
  // Check for highest-order matches first
  for (const level of ['CREATE', 'EVALUATE', 'ANALYZE', 'APPLY', 'UNDERSTAND', 'REMEMBER'] as BloomsLevel[]) {
    if (keywords[level].some(keyword => text.includes(keyword))) {
      return level;
    }
  }
  
  // Default to UNDERSTAND if no clear patterns
  return 'UNDERSTAND';
}

function calculateOverallHealth(distribution: any[]): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
  const totalDeviation = distribution.reduce((sum, item) => sum + Math.abs(item.deviation), 0);
  const avgDeviation = totalDeviation / distribution.length;
  const missingLevels = distribution.filter(item => item.status === 'missing').length;
  
  if (missingLevels > 2 || avgDeviation > 20) return 'poor';
  if (missingLevels > 1 || avgDeviation > 15) return 'needs-improvement';
  if (avgDeviation > 8) return 'good';
  return 'excellent';
}

function generateCognitiveRecommendations(distribution: any[], course: any) {

  const recommendations: any[] = [];
  
  // Check for missing levels
  const missingLevels = distribution.filter(item => item.status === 'missing');
  missingLevels.forEach(level => {
    recommendations.push({
      priority: 'high',
      category: 'structure',
      action: `Add ${level.level.toLowerCase()} level content`,
      rationale: `Missing ${level.level.toLowerCase()} level content creates gaps in cognitive progression`,
      estimatedImpact: 0.8,
      implementation: [
        `Create sections focused on ${level.level.toLowerCase()} skills`,
        `Add ${getContentTypeForLevel(level.level)} activities`,
        `Design assessments that test ${level.level.toLowerCase()} abilities`
      ]
    });
  });
  
  // Check for deficient levels
  const deficientLevels = distribution.filter(item => item.status === 'deficient');
  deficientLevels.forEach(level => {
    recommendations.push({
      priority: level.deviation < -15 ? 'high' : 'medium',
      category: 'content',
      action: `Strengthen ${level.level.toLowerCase()} content`,
      rationale: `${level.level} level is ${Math.abs(level.deviation).toFixed(1)}% below optimal distribution`,
      estimatedImpact: 0.6,
      implementation: [
        `Add ${Math.ceil(Math.abs(level.deviation) / 100 * distribution.length)} more ${level.level.toLowerCase()} sections`,
        `Enhance existing content with ${level.level.toLowerCase()} activities`,
        `Review and upgrade current ${level.level.toLowerCase()} assessments`
      ]
    });
  });
  
  // Check for excessive levels
  const excessiveLevels = distribution.filter(item => item.status === 'excessive');
  excessiveLevels.forEach(level => {
    recommendations.push({
      priority: 'medium',
      category: 'progression',
      action: `Balance ${level.level.toLowerCase()} content distribution`,
      rationale: `${level.level} level is over-represented by ${level.deviation.toFixed(1)}%`,
      estimatedImpact: 0.5,
      implementation: [
        `Convert some ${level.level.toLowerCase()} content to other cognitive levels`,
        `Redistribute content to create better progression`,
        `Ensure prerequisite levels are adequately covered`
      ]
    });
  });
  
  // Check cognitive progression
  const progressionIssues = checkCognitiveProgression(distribution);
  progressionIssues.forEach(issue => {
    recommendations.push(issue);
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function checkCognitiveProgression(distribution: any[]) {
  const issues: any[] = [];
  
  // Check if higher-order thinking has sufficient foundation
  const higherOrder = ['ANALYZE', 'EVALUATE', 'CREATE'];
  const foundation = ['REMEMBER', 'UNDERSTAND', 'APPLY'];
  
  const higherOrderTotal = higherOrder.reduce((sum, level) => {
    const item = distribution.find(d => d.level === level);
    return sum + (item?.percentage || 0);
  }, 0);
  
  const foundationTotal = foundation.reduce((sum, level) => {
    const item = distribution.find(d => d.level === level);
    return sum + (item?.percentage || 0);
  }, 0);
  
  if (higherOrderTotal > foundationTotal) {
    issues.push({
      priority: 'high',
      category: 'progression',
      action: 'Strengthen foundational cognitive levels',
      rationale: 'Higher-order thinking requires stronger foundational knowledge base',
      estimatedImpact: 0.9,
      implementation: [
        'Increase REMEMBER and UNDERSTAND content',
        'Ensure clear progression from basic to advanced concepts',
        'Add prerequisite knowledge checks'
      ]
    });
  }
  
  return issues;
}

function optimizeLearningPath(distribution: any[], course: any) {

  const currentPath = distribution
    .filter(item => item.sectionCount > 0)
    .map(item => item.level);
  
  const optimizedPath = [...BLOOM_HIERARCHY].filter(level => {
    const item = distribution.find(d => d.level === level);
    return item && item.sectionCount > 0;
  });
  
  const improvements: string[] = [];
  
  // Ensure proper progression
  if (!currentPath.includes('REMEMBER') && currentPath.length > 0) {
    improvements.push('Add foundational REMEMBER level content at the beginning');
  }
  
  if (!currentPath.includes('UNDERSTAND') && currentPath.includes('APPLY')) {
    improvements.push('Include UNDERSTAND level before APPLY to ensure comprehension');
  }
  
  // Check for gaps in progression
  const missingSteps = BLOOM_HIERARCHY.filter(level => 
    !currentPath.includes(level as BloomsLevel) && 
    currentPath.some(existing => BLOOM_HIERARCHY.indexOf(existing) > BLOOM_HIERARCHY.indexOf(level))
  );
  
  missingSteps.forEach(step => {
    improvements.push(`Add ${step.toLowerCase()} level content to bridge cognitive gaps`);
  });
  
  return {
    currentPath,
    optimizedPath,
    improvements
  };
}

function identifyCognitiveGaps(distribution: any[]) {

  const gaps: any[] = [];
  
  distribution.forEach(item => {
    if (item.status === 'missing') {
      gaps.push({
        level: item.level,
        severity: 'critical',
        description: `Complete absence of ${item.level.toLowerCase()} level content`,
        solutions: [
          `Create ${item.level.toLowerCase()} focused sections`,
          `Add ${getContentTypeForLevel(item.level)} activities`,
          `Design appropriate assessments`
        ]
      });
    } else if (item.status === 'deficient') {
      gaps.push({
        level: item.level,
        severity: item.deviation < -15 ? 'critical' : 'moderate',
        description: `Insufficient ${item.level.toLowerCase()} content (${Math.abs(item.deviation).toFixed(1)}% below optimal)`,
        solutions: [
          `Increase ${item.level.toLowerCase()} content by ${Math.ceil(Math.abs(item.deviation))}%`,
          `Enhance existing activities with ${item.level.toLowerCase()} elements`,
          `Review current content for upgrade opportunities`
        ]
      });
    }
  });
  
  return gaps;
}

function getContentTypeForLevel(level: BloomsLevel): string {
  const contentTypes = {
    REMEMBER: 'flashcards, quizzes, and memorization exercises',
    UNDERSTAND: 'explanations, examples, and concept mapping',
    APPLY: 'practice problems, simulations, and hands-on activities',
    ANALYZE: 'case studies, comparisons, and analytical tasks',
    EVALUATE: 'critiques, assessments, and judgment exercises',
    CREATE: 'projects, designs, and creative assignments'
  };
  
  return contentTypes[level];
}