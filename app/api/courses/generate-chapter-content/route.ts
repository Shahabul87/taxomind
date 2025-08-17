import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface ChapterContentRequest {
  chapterId: string;
  courseId: string;
  chapterTitle: string;
  chapterDescription?: string;
  preferences: {
    contentType: string;
    generationMode: string;
    sectionCount: number;
    focusAreas: string;
    targetAudience: string;
    difficultyLevel: string;
  };
  existingSections: any[];
}

interface GeneratedContent {
  title: string;
  description: string;
  learningOutcomes: string[];
  sections: {
    title: string;
    description: string;
    contentType: 'video' | 'reading' | 'interactive' | 'assessment' | 'project';
    estimatedDuration: string;
    bloomsLevel: string;
    content: {
      summary: string;
      keyPoints: string[];
      activities?: string[];
      assessmentQuestions?: string[];
    };
  }[];
}

// AI Chapter Content Generator - Enhanced with educational best practices
async function generateChapterContent(
  request: ChapterContentRequest, 
  userId: string
): Promise<GeneratedContent> {
  
  const { chapterTitle, chapterDescription, preferences, existingSections } = request;
  
  // Bloom's taxonomy progression based on difficulty
  const bloomsProgression = {
    'beginner': ['REMEMBER', 'UNDERSTAND', 'APPLY'],
    'intermediate': ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    'advanced': ['APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']
  };
  
  const availableBloomsLevels = bloomsProgression[preferences.difficultyLevel as keyof typeof bloomsProgression];
  
  // Content type mappings
  const contentTypeDistribution = {
    'comprehensive': ['video', 'reading', 'interactive', 'assessment'],
    'video-focused': ['video', 'video', 'interactive', 'assessment'],
    'text-heavy': ['reading', 'reading', 'interactive', 'assessment'],
    'assessment-rich': ['reading', 'assessment', 'interactive', 'assessment'],
    'project-based': ['reading', 'project', 'interactive', 'project']
  };
  
  const contentTypes = contentTypeDistribution[preferences.contentType as keyof typeof contentTypeDistribution] || 
                     contentTypeDistribution['comprehensive'];
  
  // Generate enhanced chapter details
  const enhancedTitle = enhanceChapterTitle(chapterTitle, preferences.difficultyLevel);
  const enhancedDescription = generateChapterDescription(chapterTitle, chapterDescription, preferences);
  const learningOutcomes = generateLearningOutcomes(chapterTitle, preferences, availableBloomsLevels);
  
  // Generate sections
  const sections: GeneratedContent['sections'] = [];
  
  for (let i = 0; i < preferences.sectionCount; i++) {
    const contentType = contentTypes[i % contentTypes.length] as any;
    const bloomsLevel = availableBloomsLevels[Math.floor(i / preferences.sectionCount * availableBloomsLevels.length)] || availableBloomsLevels[0];
    
    const section = generateSection(
      chapterTitle,
      i + 1,
      contentType,
      bloomsLevel,
      preferences
    );
    
    sections.push(section);
  }
  
  return {
    title: enhancedTitle,
    description: enhancedDescription,
    learningOutcomes,
    sections
  };
}

function enhanceChapterTitle(originalTitle: string, difficulty: string): string {
  // Keep original title but ensure it's well-formatted
  return originalTitle.trim();
}

function generateChapterDescription(
  title: string, 
  originalDescription: string | undefined, 
  preferences: any
): string {
  const baseDescription = originalDescription || `This chapter covers essential concepts in ${title.toLowerCase()}.`;
  
  const audienceText = preferences.targetAudience ? 
    ` Designed specifically for ${preferences.targetAudience.toLowerCase()}.` : 
    ` Suitable for ${preferences.difficultyLevel} learners.`;
  
  const focusText = preferences.focusAreas ? 
    ` Special focus on ${preferences.focusAreas.toLowerCase()}.` : 
    ` Includes practical examples and real-world applications.`;
  
  return `${baseDescription}${audienceText}${focusText} By the end of this chapter, you'll have a solid understanding of the key concepts and be able to apply them effectively.`;
}

function generateLearningOutcomes(
  title: string, 
  preferences: any, 
  bloomsLevels: string[]
): string[] {
  const outcomes: string[] = [];
  
  // Generate outcomes based on Bloom's levels
  for (const level of bloomsLevels) {
    switch (level) {
      case 'REMEMBER':
        outcomes.push(`Recall and identify key concepts in ${title.toLowerCase()}`);
        break;
      case 'UNDERSTAND':
        outcomes.push(`Explain the fundamental principles and relationships in ${title.toLowerCase()}`);
        break;
      case 'APPLY':
        outcomes.push(`Apply ${title.toLowerCase()} concepts to solve practical problems`);
        break;
      case 'ANALYZE':
        outcomes.push(`Analyze complex scenarios involving ${title.toLowerCase()}`);
        break;
      case 'EVALUATE':
        outcomes.push(`Evaluate different approaches and solutions in ${title.toLowerCase()}`);
        break;
      case 'CREATE':
        outcomes.push(`Create original solutions and strategies using ${title.toLowerCase()}`);
        break;
    }
  }
  
  // Add a practical outcome
  if (preferences.focusAreas) {
    outcomes.push(`Demonstrate proficiency in ${preferences.focusAreas.toLowerCase()}`);
  }
  
  return outcomes;
}

function generateSection(
  chapterTitle: string,
  sectionNumber: number,
  contentType: string,
  bloomsLevel: string,
  preferences: any
): GeneratedContent['sections'][0] {
  
  // Generate section title based on Bloom's level and content type
  const actionWords = {
    'REMEMBER': ['Introduction to', 'Overview of', 'Fundamentals of'],
    'UNDERSTAND': ['Understanding', 'Exploring', 'Learning About'],
    'APPLY': ['Applying', 'Implementing', 'Using', 'Practicing'],
    'ANALYZE': ['Analyzing', 'Examining', 'Investigating'],
    'EVALUATE': ['Evaluating', 'Assessing', 'Comparing'],
    'CREATE': ['Creating', 'Building', 'Designing', 'Developing']
  };
  
  const actions = actionWords[bloomsLevel as keyof typeof actionWords] || actionWords['UNDERSTAND'];
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  const sectionTitle = `${action} ${chapterTitle} Concepts`;
  
  // Generate content based on type
  const content = generateSectionContent(contentType, bloomsLevel, chapterTitle, preferences);
  
  // Estimate duration based on content type
  const durations = {
    'video': '15-20 minutes',
    'reading': '10-15 minutes',
    'interactive': '20-30 minutes',
    'assessment': '15-25 minutes',
    'project': '45-60 minutes'
  };
  
  return {
    title: sectionTitle,
    description: generateSectionDescription(contentType, bloomsLevel, chapterTitle),
    contentType: contentType as any,
    estimatedDuration: durations[contentType as keyof typeof durations] || '15-20 minutes',
    bloomsLevel,
    content
  };
}

function generateSectionDescription(
  contentType: string,
  bloomsLevel: string,
  chapterTitle: string
): string {
  const descriptions = {
    'video': `An engaging video lesson that ${bloomsLevel.toLowerCase()}s key concepts in ${chapterTitle.toLowerCase()}.`,
    'reading': `Comprehensive reading material covering essential ${chapterTitle.toLowerCase()} topics.`,
    'interactive': `Hands-on activities and exercises to practice ${chapterTitle.toLowerCase()} skills.`,
    'assessment': `Knowledge check and assessment to evaluate understanding of ${chapterTitle.toLowerCase()}.`,
    'project': `Practical project work applying ${chapterTitle.toLowerCase()} concepts to real scenarios.`
  };
  
  return descriptions[contentType as keyof typeof descriptions] || 
         `Learning content focused on ${chapterTitle.toLowerCase()} concepts.`;
}

function generateSectionContent(
  contentType: string,
  bloomsLevel: string,
  chapterTitle: string,
  preferences: any
): GeneratedContent['sections'][0]['content'] {
  
  const baseContent: any = {
    summary: `This section covers important aspects of ${chapterTitle.toLowerCase()} with a focus on ${bloomsLevel.toLowerCase()}-level learning.`,
    keyPoints: generateKeyPoints(chapterTitle, bloomsLevel, preferences),
  };
  
  // Add content type specific elements
  if (contentType === 'interactive' || contentType === 'project') {
    baseContent.activities = generateActivities(chapterTitle, bloomsLevel, contentType);
  }
  
  if (contentType === 'assessment') {
    baseContent.assessmentQuestions = generateAssessmentQuestions(chapterTitle, bloomsLevel);
  }
  
  return baseContent;
}

function generateKeyPoints(
  chapterTitle: string,
  bloomsLevel: string,
  preferences: any
): string[] {
  const points: string[] = [];
  
  // Generate 4-6 key points based on Bloom's level
  switch (bloomsLevel) {
    case 'REMEMBER':
      points.push(
        `Definition and basic terminology of ${chapterTitle.toLowerCase()}`,
        `Key characteristics and features`,
        `Historical context and development`,
        `Important facts and figures`
      );
      break;
    case 'UNDERSTAND':
      points.push(
        `Core principles and how they work`,
        `Relationships between different concepts`,
        `Cause and effect patterns`,
        `Common examples and use cases`
      );
      break;
    case 'APPLY':
      points.push(
        `Step-by-step implementation process`,
        `Best practices and techniques`,
        `Common tools and resources`,
        `Troubleshooting and problem-solving approaches`
      );
      break;
    case 'ANALYZE':
      points.push(
        `Components and their interactions`,
        `Patterns and trends analysis`,
        `Comparison of different approaches`,
        `Critical factors for success`
      );
      break;
    case 'EVALUATE':
      points.push(
        `Criteria for assessment and evaluation`,
        `Strengths and weaknesses analysis`,
        `Decision-making frameworks`,
        `Quality and effectiveness measures`
      );
      break;
    case 'CREATE':
      points.push(
        `Design principles and methodologies`,
        `Innovation strategies and techniques`,
        `Creative problem-solving approaches`,
        `Implementation and testing methods`
      );
      break;
  }
  
  // Add focus area specific points if provided
  if (preferences.focusAreas) {
    points.push(`Specific insights on ${preferences.focusAreas.toLowerCase()}`);
  }
  
  return points;
}

function generateActivities(
  chapterTitle: string,
  bloomsLevel: string,
  contentType: string
): string[] {
  const activities: string[] = [];
  
  if (contentType === 'interactive') {
    switch (bloomsLevel) {
      case 'REMEMBER':
        activities.push(
          'Flashcard review exercise',
          'Matching terms and definitions',
          'Multiple choice knowledge check'
        );
        break;
      case 'UNDERSTAND':
        activities.push(
          'Concept mapping exercise',
          'Explain-in-your-own-words activity',
          'Example identification task'
        );
        break;
      case 'APPLY':
        activities.push(
          'Guided practice scenario',
          'Step-by-step implementation exercise',
          'Tool usage demonstration'
        );
        break;
      default:
        activities.push(
          'Interactive simulation',
          'Problem-solving exercise',
          'Case study analysis'
        );
    }
  } else if (contentType === 'project') {
    activities.push(
      `Design a ${chapterTitle.toLowerCase()} solution`,
      'Research and planning phase',
      'Implementation and testing',
      'Reflection and improvement'
    );
  }
  
  return activities;
}

function generateAssessmentQuestions(
  chapterTitle: string,
  bloomsLevel: string
): string[] {
  const questions: string[] = [];
  
  switch (bloomsLevel) {
    case 'REMEMBER':
      questions.push(
        `What are the key components of ${chapterTitle.toLowerCase()}?`,
        `List the main characteristics of ${chapterTitle.toLowerCase()}`,
        `Define the primary terms related to ${chapterTitle.toLowerCase()}`
      );
      break;
    case 'UNDERSTAND':
      questions.push(
        `Explain how ${chapterTitle.toLowerCase()} works in practice`,
        `Describe the relationship between different concepts`,
        `Why is ${chapterTitle.toLowerCase()} important in this context?`
      );
      break;
    case 'APPLY':
      questions.push(
        `How would you implement ${chapterTitle.toLowerCase()} in a real project?`,
        `What steps would you take to solve this problem using ${chapterTitle.toLowerCase()}?`,
        `Demonstrate the use of ${chapterTitle.toLowerCase()} in this scenario`
      );
      break;
    default:
      questions.push(
        `Analyze the effectiveness of different ${chapterTitle.toLowerCase()} approaches`,
        `Evaluate the pros and cons of this ${chapterTitle.toLowerCase()} solution`,
        `Create an innovative approach to ${chapterTitle.toLowerCase()}`
      );
  }
  
  return questions;
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
    
    if (userRole !== 'ADMIN') {

      return new NextResponse(`Forbidden - Admin access required. Your role: ${userRole}`, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const contentRequest: ChapterContentRequest = body;

    // Validate required fields
    if (!contentRequest.chapterId || !contentRequest.courseId || !contentRequest.chapterTitle) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Verify chapter ownership
    const chapter = await db.chapter.findUnique({
      where: {
        id: contentRequest.chapterId,
        courseId: contentRequest.courseId,
      },
      include: {
        course: {
          select: {
            userId: true,
          },
        },
      },
    });
    
    if (!chapter || chapter.course.userId !== user.id) {
      return new NextResponse("Chapter not found or access denied", { status: 404 });
    }

    // Generate chapter content using AI
    const generatedContent = await generateChapterContent(contentRequest, user.id);

    return NextResponse.json(generatedContent);
    
  } catch (error) {
    logger.error("[CHAPTER_CONTENT] Error generating chapter content:", error);
    
    if (error instanceof Error) {
      logger.error("[CHAPTER_CONTENT] Error message:", error.message);
      logger.error("[CHAPTER_CONTENT] Error stack:", error.stack);
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}