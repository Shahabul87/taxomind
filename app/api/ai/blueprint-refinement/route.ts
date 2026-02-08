import { getCombinedSession } from "@/lib/auth/combined-session";
import { aiClient } from '@/lib/ai/enterprise-client';
import { handleAIAccessError } from '@/lib/ai/route-helper';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

interface BlueprintRefinementRequest {
  blueprint: any;
  refinementGoals: string[];
  userFeedback?: string;
  targetImprovements?: string[];
  preserveStructure?: boolean;
}

interface RefinementSuggestion {
  type: 'structure' | 'content' | 'pedagogy' | 'engagement' | 'assessment';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  rationale: string;
  implementation: {
    action: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  };
  appliedChanges?: any;
  confidence: number;
}

interface RefinementResult {
  originalBlueprint: any;
  refinedBlueprint: any;
  suggestions: RefinementSuggestion[];
  improvements: {
    structuralChanges: string[];
    contentEnhancements: string[];
    pedagogicalImprovements: string[];
    engagementBoosts: string[];
    assessmentRefinements: string[];
  };
  qualityMetrics: {
    educationalEffectiveness: number;
    learnerEngagement: number;
    contentQuality: number;
    structuralCoherence: number;
    assessmentAlignment: number;
  };
  comparisonAnalysis: {
    improvementAreas: string[];
    strengthsPreserved: string[];
    overallImprovement: number;
  };
}

export async function POST(req: Request) {
  try {
    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    if (!session.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Only admins can access blueprint refinement
    if (!session.isAdmin) {
      return new Response("Forbidden - Admin access required", { status: 403 });
    }

    const body = await req.json();
    const request: BlueprintRefinementRequest = body;

    // Validate required fields
    if (!request.blueprint) {
      return new Response("Blueprint is required", { status: 400 });
    }

    if (!request.refinementGoals || request.refinementGoals.length === 0) {
      return new Response("Refinement goals are required", { status: 400 });
    }

    // Generate blueprint refinement
    const refinementResult = await generateBlueprintRefinement(request, session.userId);

    return Response.json(refinementResult);

  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[BLUEPRINT_REFINEMENT] Error:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function generateBlueprintRefinement(
  request: BlueprintRefinementRequest,
  userId: string
): Promise<RefinementResult> {
  
  // anthropic is already imported
  
  // Analyze current blueprint and generate refinement suggestions
  const analysisPrompt = `As an expert educational designer and curriculum specialist, analyze this course blueprint and provide detailed refinement suggestions.

COURSE BLUEPRINT TO ANALYZE:
${JSON.stringify(request.blueprint, null, 2)}

REFINEMENT GOALS:
${request.refinementGoals.join(', ')}

USER FEEDBACK (if any):
${request.userFeedback || 'No specific feedback provided'}

TARGET IMPROVEMENTS:
${request.targetImprovements?.join(', ') || 'General improvement'}

PRESERVE STRUCTURE: ${request.preserveStructure ? 'Yes - maintain overall structure' : 'No - structure can be modified'}

Please provide a comprehensive analysis and refinement plan that includes:

1. STRUCTURAL ANALYSIS:
   - Course flow and logical progression
   - Chapter organization and balance
   - Learning path coherence
   - Difficulty progression

2. CONTENT QUALITY ASSESSMENT:
   - Learning objectives clarity and measurability
   - Content depth and breadth
   - Real-world relevance
   - Knowledge gaps or redundancies

3. PEDAGOGICAL EFFECTIVENESS:
   - Teaching methodology alignment
   - Learning style accommodation
   - Engagement strategies
   - Assessment integration

4. SPECIFIC REFINEMENT SUGGESTIONS:
   For each suggestion, provide:
   - Type (structure/content/pedagogy/engagement/assessment)
   - Priority (high/medium/low)
   - Category (clear classification)
   - Title (concise action)
   - Description (detailed explanation)
   - Rationale (educational reasoning)
   - Implementation (actionable steps)
   - Expected impact
   - Effort required
   - Confidence level (0-1)

5. QUALITY METRICS:
   Rate the current blueprint (0-100) on:
   - Educational effectiveness
   - Learner engagement potential
   - Content quality
   - Structural coherence
   - Assessment alignment

6. REFINED BLUEPRINT:
   Provide an improved version of the blueprint incorporating the highest-priority suggestions.

Format your response as a JSON object with the structure matching the RefinementResult interface.`;

  try {
    const response = await aiClient.chat({
      userId,
      capability: 'course',
      maxTokens: 8000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      extended: true,
    });

    const responseText = response.content;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Parse the AI response
    let aiResult;
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      logger.error('Failed to parse AI response:', parseError);
      // Fallback: create a basic refinement result
      aiResult = createFallbackRefinementResult(request.blueprint);
    }

    // Ensure the result has the correct structure
    const refinementResult: RefinementResult = {
      originalBlueprint: request.blueprint,
      refinedBlueprint: aiResult.refinedBlueprint || generateBasicRefinedBlueprint(request.blueprint),
      suggestions: aiResult.suggestions || [],
      improvements: aiResult.improvements || {
        structuralChanges: [],
        contentEnhancements: [],
        pedagogicalImprovements: [],
        engagementBoosts: [],
        assessmentRefinements: []
      },
      qualityMetrics: aiResult.qualityMetrics || {
        educationalEffectiveness: 75,
        learnerEngagement: 70,
        contentQuality: 80,
        structuralCoherence: 85,
        assessmentAlignment: 75
      },
      comparisonAnalysis: aiResult.comparisonAnalysis || {
        improvementAreas: ['Content depth', 'Engagement strategies'],
        strengthsPreserved: ['Clear structure', 'Learning objectives'],
        overallImprovement: 15
      }
    };

    return refinementResult;

  } catch (error) {
    logger.error('Error in blueprint refinement generation:', error);
    throw new Error('Failed to generate blueprint refinement');
  }
}

function createFallbackRefinementResult(originalBlueprint: any): RefinementResult {
  return {
    originalBlueprint,
    refinedBlueprint: generateBasicRefinedBlueprint(originalBlueprint),
    suggestions: [
      {
        type: 'content',
        priority: 'medium',
        category: 'Learning Objectives',
        title: 'Enhance Learning Objectives Specificity',
        description: 'Make learning objectives more specific and measurable using action verbs from Bloom\'s taxonomy.',
        rationale: 'Specific objectives help learners understand expectations and enable better assessment.',
        implementation: {
          action: 'Revise objectives to include measurable outcomes',
          impact: 'Improved learner clarity and assessment alignment',
          effort: 'medium'
        },
        confidence: 0.8
      },
      {
        type: 'engagement',
        priority: 'high',
        category: 'Interactive Elements',
        title: 'Add Interactive Activities',
        description: 'Incorporate more hands-on activities and interactive elements throughout the course.',
        rationale: 'Interactive elements increase engagement and improve knowledge retention.',
        implementation: {
          action: 'Add practical exercises and interactive components',
          impact: 'Higher engagement and better learning outcomes',
          effort: 'medium'
        },
        confidence: 0.9
      }
    ],
    improvements: {
      structuralChanges: ['Improved chapter flow'],
      contentEnhancements: ['More specific learning objectives'],
      pedagogicalImprovements: ['Added interactive elements'],
      engagementBoosts: ['Hands-on activities'],
      assessmentRefinements: ['Clearer assessment criteria']
    },
    qualityMetrics: {
      educationalEffectiveness: 75,
      learnerEngagement: 70,
      contentQuality: 80,
      structuralCoherence: 85,
      assessmentAlignment: 75
    },
    comparisonAnalysis: {
      improvementAreas: ['Content specificity', 'Engagement strategies'],
      strengthsPreserved: ['Clear structure', 'Comprehensive coverage'],
      overallImprovement: 15
    }
  };
}

function generateBasicRefinedBlueprint(originalBlueprint: any): any {
  // Create a refined version with basic improvements
  const refined = JSON.parse(JSON.stringify(originalBlueprint));
  
  // Enhance course description
  if (refined.course?.description) {
    refined.course.description = `${refined.course.description} This comprehensive course includes hands-on activities, real-world applications, and interactive learning experiences designed to maximize engagement and retention.`;
  }
  
  // Add assessment indicators to chapters
  if (refined.chapters) {
    refined.chapters.forEach((chapter: any, index: number) => {
      chapter.assessmentType = index % 2 === 0 ? 'formative' : 'summative';
      chapter.interactiveElements = ['Discussion forum', 'Practical exercise', 'Knowledge check'];
      
      if (chapter.sections) {
        chapter.sections.forEach((section: any) => {
          section.engagementFeatures = ['Interactive quiz', 'Hands-on activity'];
        });
      }
    });
  }
  
  return refined;
}