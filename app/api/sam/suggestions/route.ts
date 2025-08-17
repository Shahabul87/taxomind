import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { generateSamSuggestion } from "@/lib/anthropic-client";
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

interface SamSuggestionRequest {
  context: 'title_analysis' | 'overview_feedback' | 'audience_alignment' | 'difficulty_guidance' | 'general_encouragement' | 'bloom_taxonomy_help' | 'content_type_advice' | 'context_enrichment';
  userInput: {
    courseTitle?: string;
    courseShortOverview?: string;
    courseCategory?: string;
    courseSubcategory?: string;
    courseIntent?: string;
    targetAudience?: string;
    difficulty?: string;
    bloomsFocus?: string[];
    preferredContentTypes?: string[];
    chapterCount?: number;
    sectionsPerChapter?: number;
    // Rich context fields
    studentBackground?: string;
    prerequisites?: string[];
    realWorldApplications?: string[];
    careerOutcomes?: string[];
    industryContext?: string;
    toolsAndTechnologies?: string[];
    commonChallenges?: string[];
    successMetrics?: string[];
  };
  step: number;
}

interface SamResponse {
  message: string;
  type: 'encouragement' | 'suggestion' | 'validation' | 'warning' | 'tip';
  actionable: boolean;
  confidence: number;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: SamSuggestionRequest = await req.json();
    
    // Generate contextual suggestion based on the request
    const suggestion = await generateContextualSuggestion(body);
    
    return NextResponse.json(suggestion);
    
  } catch (error) {
    logger.error("[SAM] Error generating suggestion:", error);
    
    // Return a fallback response
    const fallbackResponse: SamResponse = {
      message: "I'm here to help you create an amazing course! Keep going, you're doing great! 🎓",
      type: 'encouragement',
      actionable: false,
      confidence: 0.5
    };
    
    return NextResponse.json(fallbackResponse);
  }
}

async function generateContextualSuggestion(request: SamSuggestionRequest): Promise<SamResponse> {
  const { context, userInput, step } = request;
  
  let contextPrompt = "";
  let expectedType: SamResponse['type'] = 'suggestion';
  
  switch (context) {
    case 'title_analysis':
      contextPrompt = `The user has entered a course title: "${userInput.courseTitle}". Analyze this title and provide feedback on clarity, engagement, and SEO-friendliness. Suggest improvements if needed.`;
      expectedType = 'suggestion';
      break;
      
    case 'overview_feedback':
      contextPrompt = `The user wrote this course overview: "${userInput.courseShortOverview}". Assess the description quality, clarity, and appeal to the target audience (${userInput.targetAudience}). Provide specific improvement suggestions.`;
      expectedType = 'suggestion';
      break;
      
    case 'audience_alignment':
      contextPrompt = `The user selected "${userInput.targetAudience}" as target audience and "${userInput.difficulty}" difficulty level. Check if these align well and suggest adjustments if needed. Course category: ${userInput.courseCategory}.`;
      expectedType = 'validation';
      break;
      
    case 'difficulty_guidance':
      contextPrompt = `The user chose "${userInput.difficulty}" difficulty for their course "${userInput.courseTitle}" targeting "${userInput.targetAudience}". Provide guidance on whether this difficulty level is appropriate and what it means for course structure.`;
      expectedType = 'tip';
      break;
      
    case 'general_encouragement':
      contextPrompt = `The user is on step ${step} of course creation. Their course is about "${userInput.courseTitle}" for "${userInput.targetAudience}". Provide encouraging, personalized feedback about their progress.`;
      expectedType = 'encouragement';
      break;
      
    case 'bloom_taxonomy_help':
      contextPrompt = `The user selected these Bloom's taxonomy levels: [${userInput.bloomsFocus?.join(', ')}] for a ${userInput.difficulty} level course. Explain why this combination works well or suggest improvements for better learning progression.`;
      expectedType = 'tip';
      break;
      
    case 'content_type_advice':
      contextPrompt = `The user chose these content types: [${userInput.preferredContentTypes?.join(', ')}] for their course. Given their target audience (${userInput.targetAudience}) and difficulty (${userInput.difficulty}), provide advice on this content mix.`;
      expectedType = 'suggestion';
      break;
      
    case 'context_enrichment':
      contextPrompt = `The user is providing rich context for their course "${userInput.courseTitle}". They've added: Student background: "${userInput.studentBackground}", Prerequisites: [${userInput.prerequisites?.join(', ')}], Industry context: "${userInput.industryContext}", Applications: [${userInput.realWorldApplications?.join(', ')}], Tools: [${userInput.toolsAndTechnologies?.join(', ')}]. Encourage them to continue adding context and explain how this will help generate better course content.`;
      expectedType = 'encouragement';
      break;
      
    default:
      contextPrompt = `The user is creating a course titled "${userInput.courseTitle}". Provide general encouragement and helpful tips.`;
      expectedType = 'encouragement';
  }
  
  try {
    const aiResponse = await generateSamSuggestion(contextPrompt, userInput as any);
    
    // Determine confidence based on context and input completeness
    const confidence = calculateConfidence(userInput, context);
    
    // Determine if the suggestion is actionable
    const actionable = context !== 'general_encouragement' && context !== 'difficulty_guidance';
    
    return {
      message: aiResponse,
      type: expectedType,
      actionable,
      confidence
    };
    
  } catch (error) {
    logger.error("[SAM] AI generation failed:", error);
    
    // Return context-specific fallback
    return getFallbackResponse(context, userInput);
  }
}

function calculateConfidence(userInput: SamSuggestionRequest['userInput'], context: string): number {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence based on available information
  if (userInput.courseTitle && userInput.courseTitle.length > 10) confidence += 0.1;
  if (userInput.courseShortOverview && userInput.courseShortOverview.length > 50) confidence += 0.1;
  if (userInput.targetAudience) confidence += 0.05;
  if (userInput.courseCategory) confidence += 0.05;
  
  // Context-specific adjustments
  switch (context) {
    case 'title_analysis':
      if (userInput.courseTitle && userInput.courseTitle.length > 5) confidence += 0.1;
      break;
    case 'overview_feedback':
      if (userInput.courseShortOverview && userInput.courseShortOverview.length > 100) confidence += 0.15;
      break;
    case 'audience_alignment':
      if (userInput.targetAudience && userInput.difficulty) confidence += 0.2;
      break;
  }
  
  return Math.min(confidence, 1.0);
}

function getFallbackResponse(context: string, userInput: SamSuggestionRequest['userInput']): SamResponse {
  const fallbacks: Record<string, SamResponse> = {
    title_analysis: {
      message: "Your course title looks interesting! Make sure it clearly communicates what students will learn and who it's for. Consider including key benefits or outcomes. 📚",
      type: 'suggestion',
      actionable: true,
      confidence: 0.6
    },
    overview_feedback: {
      message: "Great start on your course overview! Consider adding more specific details about what students will achieve and how this course will help them reach their goals. ✨",
      type: 'suggestion',
      actionable: true,
      confidence: 0.6
    },
    audience_alignment: {
      message: "Your target audience and difficulty level look well-matched! This combination should provide the right challenge level for your students. 👍",
      type: 'validation',
      actionable: false,
      confidence: 0.7
    },
    difficulty_guidance: {
      message: `${userInput.difficulty} level is a great choice! This means your course will ${getDifficultyDescription(userInput.difficulty)}. Keep this in mind as we structure your content. 🎯`,
      type: 'tip',
      actionable: false,
      confidence: 0.8
    },
    general_encouragement: {
      message: "You're making excellent progress! Your course idea has great potential, and I'm excited to help you bring it to life. Keep going! 🚀",
      type: 'encouragement',
      actionable: false,
      confidence: 0.9
    },
    bloom_taxonomy_help: {
      message: "Your Bloom's taxonomy selection promotes great learning progression! This combination will help students build knowledge systematically from basic understanding to higher-order thinking. 🧠",
      type: 'tip',
      actionable: false,
      confidence: 0.7
    },
    content_type_advice: {
      message: "Your content type mix looks engaging! This variety will cater to different learning styles and keep students actively involved throughout the course. 🎥📚",
      type: 'suggestion',
      actionable: false,
      confidence: 0.7
    },
    context_enrichment: {
      message: "Excellent work enriching the course context! The more details you provide about your students' backgrounds, industry challenges, and practical applications, the better I can generate relevant content, projects, and assessments. 🧠✨",
      type: 'encouragement',
      actionable: false,
      confidence: 0.9
    }
  };
  
  return fallbacks[context] || fallbacks.general_encouragement;
}

function getDifficultyDescription(difficulty?: string): string {
  switch (difficulty) {
    case 'BEGINNER':
      return 'start with foundational concepts and build up gradually, perfect for newcomers';
    case 'INTERMEDIATE':
      return 'build on existing knowledge and introduce more complex applications';
    case 'ADVANCED':
      return 'focus on sophisticated concepts and expert-level applications';
    default:
      return 'be appropriately challenging for your target audience';
  }
}