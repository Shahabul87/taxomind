import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface ContentAnalysis {
  currentBloomsLevel: string;
  suggestedLevel: string;
  contentGaps: string[];
  strengthAreas: string[];
  recommendations: string[];
  engagementScore: number;
  clarityScore: number;
  completenessScore: number;
}

interface AIContentSuggestion {
  type: 'video' | 'blog' | 'code' | 'math' | 'quiz' | 'exercise';
  title: string;
  description: string;
  content: string;
  bloomsLevel: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export async function POST(req: Request) {
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
    
    const body = await req.json();
    const { sectionId, chapterId, courseId, sectionData, context } = body;

    // Verify section ownership through course
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      },
      include: {
        chapters: {
          where: { id: chapterId },
          include: {
            sections: {
              where: { id: sectionId },
              include: {
                videos: true,
                blogs: true,
                codeExplanations: true,
                mathExplanations: true
              }
            }
          }
        }
      }
    });
    
    if (!course || course.chapters.length === 0 || course.chapters[0].sections.length === 0) {
      return new NextResponse("Section not found or access denied", { status: 404 });
    }
    
    const section = course.chapters[0].sections[0];
    
    // Perform AI content analysis
    const analysis = await analyzeSectionContent(section, context);
    const suggestions = await generateContentSuggestions(section, context);

    return NextResponse.json({
      analysis,
      suggestions
    });
    
  } catch (error) {
    logger.error("[SECTION_ANALYSIS] Error:", error);
    
    if (error instanceof Error) {
      logger.error("[SECTION_ANALYSIS] Error message:", error.message);
      logger.error("[SECTION_ANALYSIS] Error stack:", error.stack);
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function analyzeSectionContent(section: any, context: any): Promise<ContentAnalysis> {

  // Analyze current content
  const contentItems = [
    ...(section.videos || []),
    ...(section.blogs || []),
    ...(section.codeExplanations || []),
    ...(section.mathExplanations || [])
  ];
  
  const totalContent = contentItems.length;
  const hasVideo = section.videos?.length > 0;
  const hasBlog = section.blogs?.length > 0;
  const hasCode = section.codeExplanations?.length > 0;
  const hasMath = section.mathExplanations?.length > 0;
  
  // Analyze section title and description for Bloom's level
  const currentBloomsLevel = inferBloomsLevel(section.title, section.description || '');
  
  // Calculate scores
  const engagementScore = calculateEngagementScore(section, contentItems);
  const clarityScore = calculateClarityScore(section, context);
  const completenessScore = calculateCompletenessScore(section, contentItems);
  
  // Generate recommendations
  const recommendations = generateRecommendations(section, contentItems, {
    engagement: engagementScore,
    clarity: clarityScore,
    completeness: completenessScore
  });
  
  // Identify content gaps
  const contentGaps = identifyContentGaps(section, contentItems);
  
  // Identify strength areas
  const strengthAreas = identifyStrengthAreas(section, contentItems);
  
  // Suggest optimal Bloom's level
  const suggestedLevel = suggestOptimalBloomsLevel(currentBloomsLevel, context);
  
  return {
    currentBloomsLevel,
    suggestedLevel,
    contentGaps,
    strengthAreas,
    recommendations,
    engagementScore,
    clarityScore,
    completenessScore
  };
}

async function generateContentSuggestions(section: any, context: any): Promise<AIContentSuggestion[]> {

  const suggestions: AIContentSuggestion[] = [];
  const currentBloomsLevel = inferBloomsLevel(section.title, section.description || '');
  
  // Suggest missing content types
  if (!section.videos?.length) {
    suggestions.push({
      type: 'video',
      title: `Video Explanation: ${section.title}`,
      description: 'Create an engaging video explanation to help students visualize and understand the concepts',
      content: `A comprehensive video covering the key concepts of ${section.title}`,
      bloomsLevel: currentBloomsLevel,
      estimatedTime: '10-15 minutes',
      difficulty: inferDifficulty(section.title, section.description),
      tags: ['visual-learning', 'explanation', 'core-concepts']
    });
  }
  
  if (!section.blogs?.length) {
    suggestions.push({
      type: 'blog',
      title: `In-depth Article: ${section.title}`,
      description: 'Comprehensive written content with examples and detailed explanations',
      content: `A detailed article exploring ${section.title} with practical examples`,
      bloomsLevel: currentBloomsLevel,
      estimatedTime: '15-20 minutes read',
      difficulty: inferDifficulty(section.title, section.description),
      tags: ['comprehensive', 'examples', 'reference']
    });
  }
  
  if (!section.codeExplanations?.length && shouldHaveCode(section.title, context)) {
    suggestions.push({
      type: 'code',
      title: `Code Examples: ${section.title}`,
      description: 'Practical code demonstrations with step-by-step explanations',
      content: `Interactive code examples demonstrating ${section.title}`,
      bloomsLevel: 'APPLY',
      estimatedTime: '20-30 minutes',
      difficulty: inferDifficulty(section.title, section.description),
      tags: ['hands-on', 'practical', 'coding']
    });
  }
  
  // Always suggest a quiz for assessment
  suggestions.push({
    type: 'quiz',
    title: `Knowledge Check: ${section.title}`,
    description: 'Interactive quiz to test understanding and retention',
    content: `Assessment questions covering key concepts from ${section.title}`,
    bloomsLevel: getAssessmentBloomsLevel(currentBloomsLevel),
    estimatedTime: '5-10 minutes',
    difficulty: inferDifficulty(section.title, section.description),
    tags: ['assessment', 'knowledge-check', 'interactive']
  });
  
  // Suggest practice exercise if applicable
  if (shouldHaveExercise(section.title, context)) {
    suggestions.push({
      type: 'exercise',
      title: `Practice Exercise: ${section.title}`,
      description: 'Hands-on practice to reinforce learning through application',
      content: `Practical exercise applying concepts from ${section.title}`,
      bloomsLevel: 'APPLY',
      estimatedTime: '30-45 minutes',
      difficulty: inferDifficulty(section.title, section.description),
      tags: ['practice', 'application', 'skill-building']
    });
  }
  
  return suggestions;
}

function inferBloomsLevel(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
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
  for (const level of ['CREATE', 'EVALUATE', 'ANALYZE', 'APPLY', 'UNDERSTAND', 'REMEMBER']) {
    if (keywords[level].some(keyword => text.includes(keyword))) {
      return level;
    }
  }
  
  // Default to UNDERSTAND if no clear patterns
  return 'UNDERSTAND';
}

function calculateEngagementScore(section: any, contentItems: any[]): number {
  let score = 0.3; // Base score
  
  // Content variety bonus
  const contentTypes = new Set();
  if (section.videos?.length > 0) contentTypes.add('video');
  if (section.blogs?.length > 0) contentTypes.add('blog');
  if (section.codeExplanations?.length > 0) contentTypes.add('code');
  if (section.mathExplanations?.length > 0) contentTypes.add('math');
  
  score += contentTypes.size * 0.15;
  
  // Content quantity (diminishing returns)
  const totalItems = contentItems.length;
  score += Math.min(totalItems * 0.1, 0.3);
  
  // Interactive elements bonus
  if (section.codeExplanations?.length > 0) score += 0.1;
  if (section.mathExplanations?.length > 0) score += 0.1;
  
  return Math.min(score, 1.0);
}

function calculateClarityScore(section: any, context: any): number {
  let score = 0.5; // Base score
  
  // Title clarity
  if (section.title && section.title.length > 10 && section.title.length < 80) {
    score += 0.2;
  }
  
  // Description presence and quality
  if (section.description && section.description.length > 50) {
    score += 0.2;
  }
  
  // Context alignment
  if (context.chapterTitle && section.title.toLowerCase().includes(context.chapterTitle.toLowerCase().split(' ')[0])) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

function calculateCompletenessScore(section: any, contentItems: any[]): number {
  let score = 0.2; // Base score
  
  // Content presence
  if (contentItems.length > 0) score += 0.3;
  if (contentItems.length > 2) score += 0.2;
  
  // Content diversity
  const hasVideo = section.videos?.length > 0;
  const hasBlog = section.blogs?.length > 0;
  const hasCode = section.codeExplanations?.length > 0;
  
  if (hasVideo) score += 0.1;
  if (hasBlog) score += 0.1;
  if (hasCode) score += 0.1;
  
  return Math.min(score, 1.0);
}

function generateRecommendations(section: any, contentItems: any[], scores: any): string[] {
  const recommendations: string[] = [];
  
  if (scores.engagement < 0.6) {
    recommendations.push("Add interactive content like code examples or practical exercises to boost engagement");
  }
  
  if (scores.clarity < 0.7) {
    recommendations.push("Improve section description with clear learning objectives and expectations");
  }
  
  if (scores.completeness < 0.6) {
    recommendations.push("Add more content types (video, blog, code examples) for comprehensive coverage");
  }
  
  if (!section.videos?.length) {
    recommendations.push("Consider adding a video explanation for visual learners");
  }
  
  if (!section.blogs?.length) {
    recommendations.push("Add written content for detailed reference and review");
  }
  
  if (contentItems.length === 0) {
    recommendations.push("This section needs content - start with a basic explanation or video");
  }
  
  return recommendations;
}

function identifyContentGaps(section: any, contentItems: any[]): string[] {
  const gaps: string[] = [];
  
  if (!section.videos?.length) {
    gaps.push("Missing video content for visual explanation");
  }
  
  if (!section.blogs?.length) {
    gaps.push("No written content for detailed reference");
  }
  
  if (!section.codeExplanations?.length && shouldHaveCode(section.title, {})) {
    gaps.push("Missing practical code examples");
  }
  
  if (contentItems.length === 0) {
    gaps.push("Section has no learning content");
  }
  
  return gaps;
}

function identifyStrengthAreas(section: any, contentItems: any[]): string[] {
  const strengths: string[] = [];
  
  if (section.videos?.length > 0) {
    strengths.push("Has engaging video content");
  }
  
  if (section.blogs?.length > 0) {
    strengths.push("Includes comprehensive written material");
  }
  
  if (section.codeExplanations?.length > 0) {
    strengths.push("Features hands-on code examples");
  }
  
  if (contentItems.length > 2) {
    strengths.push("Rich content variety for different learning styles");
  }
  
  if (section.title && section.description) {
    strengths.push("Well-structured with clear title and description");
  }
  
  return strengths;
}

function suggestOptimalBloomsLevel(current: string, context: any): string {
  // Simple logic - could be enhanced with AI
  const hierarchy = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const currentIndex = hierarchy.indexOf(current);
  
  // If it's basic content, suggest moving up one level
  if (currentIndex < 2 && context.chapterTitle) {
    return hierarchy[Math.min(currentIndex + 1, hierarchy.length - 1)];
  }
  
  return current;
}

function shouldHaveCode(title: string, context: any): boolean {
  const codeIndicators = ['programming', 'code', 'function', 'algorithm', 'implementation', 'development', 'script', 'api'];
  return codeIndicators.some(indicator => title.toLowerCase().includes(indicator));
}

function shouldHaveExercise(title: string, context: any): boolean {
  const exerciseIndicators = ['practice', 'exercise', 'assignment', 'project', 'lab', 'hands-on', 'activity'];
  return exerciseIndicators.some(indicator => title.toLowerCase().includes(indicator));
}

function inferDifficulty(title: string, description: string): 'beginner' | 'intermediate' | 'advanced' {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('basic') || text.includes('introduction') || text.includes('beginner')) {
    return 'beginner';
  }
  
  if (text.includes('advanced') || text.includes('expert') || text.includes('complex')) {
    return 'advanced';
  }
  
  return 'intermediate';
}

function getAssessmentBloomsLevel(contentLevel: string): string {
  // Assessment should typically be at the same level or one level higher
  const hierarchy = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const currentIndex = hierarchy.indexOf(contentLevel);
  
  return hierarchy[Math.min(currentIndex + 1, hierarchy.length - 1)];
}