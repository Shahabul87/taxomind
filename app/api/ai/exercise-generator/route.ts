import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Exercise generation request schema
const ExerciseGeneratorRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  sectionTitle: z.string().optional(),
  chapterTitle: z.string().optional(),
  courseTitle: z.string().optional(),
  exerciseType: z.enum([
    "coding_challenge", 
    "problem_solving", 
    "case_study", 
    "project", 
    "simulation", 
    "creative_task",
    "analysis",
    "design_challenge"
  ]).default("problem_solving"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  estimatedTime: z.string().optional(),
  exerciseCount: z.number().min(1).max(10).default(3),
  includeHints: z.boolean().default(true),
  includeSolutions: z.boolean().default(true),
  includeRubric: z.boolean().default(false),
  targetSkills: z.array(z.string()).optional(),
  userPrompt: z.string().optional(),
});

type ExerciseGeneratorRequest = z.infer<typeof ExerciseGeneratorRequestSchema>;

const EXERCISE_GENERATOR_SYSTEM_PROMPT = `You are an expert educational exercise designer with extensive experience in creating engaging, practical learning activities. You specialize in designing exercises that reinforce learning objectives, provide hands-on practice, and help students apply theoretical knowledge to real-world scenarios.

Your expertise includes:
- Creating progressive difficulty exercises that build skills systematically
- Designing authentic, real-world problem scenarios
- Providing clear instructions and expectations
- Creating comprehensive assessment criteria
- Balancing challenge with achievability
- Incorporating various learning styles and approaches

You MUST respond with ONLY a valid JSON array containing exercise objects. Do not include any text outside the JSON array.`;

function buildExerciseGeneratorPrompt(request: ExerciseGeneratorRequest): string {
  const contextInfo = [
    request.courseTitle && `Course: ${request.courseTitle}`,
    request.chapterTitle && `Chapter: ${request.chapterTitle}`,
    request.sectionTitle && `Section: ${request.sectionTitle}`
  ].filter(Boolean).join('\n');

  const skillsText = request.targetSkills?.length ? 
    `\n**Target Skills**: ${request.targetSkills.join(', ')}` : '';
  const timeText = request.estimatedTime ? `\n**Time Per Exercise**: ${request.estimatedTime}` : '';
  const userInstructions = request.userPrompt ? `\n**Special Instructions**: ${request.userPrompt}` : '';

  const exerciseTypeDescriptions = {
    coding_challenge: "Programming or technical implementation challenges",
    problem_solving: "Analytical problems requiring logical thinking and solution development",
    case_study: "Real-world scenarios requiring analysis and decision-making",
    project: "Comprehensive projects that integrate multiple concepts",
    simulation: "Role-playing or scenario-based activities",
    creative_task: "Open-ended creative assignments that encourage innovation",
    analysis: "Critical analysis and evaluation exercises",
    design_challenge: "Design thinking and creative problem-solving tasks"
  };

  return `Generate ${request.exerciseCount} ${request.exerciseType.replace('_', ' ')} exercise(s) for the topic: "${request.topic}"

${contextInfo}${skillsText}${timeText}${userInstructions}

**Exercise Type**: ${exerciseTypeDescriptions[request.exerciseType]}
**Difficulty Level**: ${request.difficulty}
**Include Hints**: ${request.includeHints}
**Include Solutions**: ${request.includeSolutions}
**Include Rubric**: ${request.includeRubric}

**Exercise Design Guidelines**:

1. **Relevance**: Exercises must directly relate to ${request.topic} and reinforce key concepts
2. **Clarity**: Provide clear, unambiguous instructions and expectations
3. **Progression**: Design exercises with appropriate difficulty for ${request.difficulty} level
4. **Engagement**: Create interesting, real-world scenarios that motivate learners
5. **Assessment**: Include clear success criteria and evaluation methods

**Exercise Structure Requirements**:
- Clear title and description
- Detailed instructions and requirements
- Learning objectives alignment
- Success criteria and deliverables
- Estimated completion time
- Required resources or tools
${request.includeHints ? '- Progressive hints to guide learning' : ''}
${request.includeSolutions ? '- Complete solution with explanation' : ''}
${request.includeRubric ? '- Detailed assessment rubric' : ''}

**Difficulty Calibration for ${request.difficulty}**:
${request.difficulty === 'beginner' ? `
- Use fundamental concepts and basic applications
- Provide more guidance and scaffolding
- Focus on single-concept application
- Include step-by-step instructions` : 
request.difficulty === 'intermediate' ? `
- Combine multiple concepts
- Require some independent problem-solving
- Include moderate complexity scenarios
- Balance guidance with discovery` : `
- Involve complex, multi-faceted problems
- Require creative and critical thinking
- Minimal scaffolding and guidance
- Real-world complexity and constraints`}

**Response Format**:
Return a JSON array where each exercise object has this structure:

{
  "title": "Exercise title",
  "description": "Detailed exercise description",
  "type": "${request.exerciseType}",
  "difficulty": "${request.difficulty}",
  "estimatedTime": "Time estimate (e.g., '45 minutes')",
  "learningObjectives": ["Objective 1", "Objective 2", ...],
  "instructions": "Detailed step-by-step instructions",
  "requirements": ["Requirement 1", "Requirement 2", ...],
  "deliverables": ["Deliverable 1", "Deliverable 2", ...],
  "resources": ["Resource 1", "Resource 2", ...],
  "successCriteria": ["Criteria 1", "Criteria 2", ...],
  ${request.includeHints ? '"hints": ["Hint 1", "Hint 2", ...],' : ''}
  ${request.includeSolutions ? '"solution": {"approach": "Solution approach", "implementation": "Detailed solution", "explanation": "Why this solution works"},' : ''}
  ${request.includeRubric ? '"rubric": {"excellent": "Criteria for excellent work", "good": "Criteria for good work", "needs_improvement": "Criteria for improvement needed"},' : ''}
  "tags": ["tag1", "tag2", ...]
}

Generate the practice exercises:`;
}

// Generate mock exercises for fallback
function generateMockExercises(request: ExerciseGeneratorRequest): any[] {
  const exercises = [];
  
  for (let i = 1; i <= request.exerciseCount; i++) {
    const exercise: any = {
      title: `${request.topic} Exercise ${i}: Practical Application`,
      description: `This exercise focuses on applying ${request.topic} concepts in a practical scenario`,
      type: request.exerciseType,
      difficulty: request.difficulty,
      estimatedTime: request.estimatedTime || "30-45 minutes",
      learningObjectives: [
        `Apply ${request.topic} concepts to solve real problems`,
        `Develop practical skills in ${request.topic}`,
        `Build confidence through hands-on practice`
      ],
      instructions: `1. Review the ${request.topic} concepts covered in the lesson\n2. Analyze the given scenario\n3. Apply appropriate techniques to solve the problem\n4. Document your approach and reasoning\n5. Validate your solution`,
      requirements: [
        `Understanding of ${request.topic} fundamentals`,
        "Access to necessary tools and resources",
        "Time for reflection and analysis"
      ],
      deliverables: [
        "Complete solution to the problem",
        "Written explanation of your approach",
        "Reflection on lessons learned"
      ],
      resources: [
        "Course materials and notes",
        "Online documentation and references",
        "Practice datasets or examples"
      ],
      successCriteria: [
        "Solution addresses all requirements",
        "Approach is well-reasoned and documented",
        "Demonstrates understanding of key concepts"
      ],
      tags: [request.topic.toLowerCase(), request.difficulty, request.exerciseType]
    };

    if (request.includeHints) {
      exercise.hints = [
        "Start by breaking down the problem into smaller components",
        "Review similar examples from the course materials",
        "Consider multiple approaches before settling on one"
      ];
    }

    if (request.includeSolutions) {
      exercise.solution = {
        approach: `The optimal approach for this ${request.topic} exercise involves systematic analysis and step-by-step implementation`,
        implementation: "Detailed implementation steps would be provided here based on the specific exercise requirements",
        explanation: "This solution works because it follows established best practices and addresses all the key requirements"
      };
    }

    if (request.includeRubric) {
      exercise.rubric = {
        excellent: "Demonstrates mastery of concepts, creative problem-solving, and thorough documentation",
        good: "Shows good understanding, correct application, and adequate documentation",
        needs_improvement: "Basic understanding evident but solution incomplete or poorly documented"
      };
    }

    exercises.push(exercise);
  }

  return exercises;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    if (!session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = ExerciseGeneratorRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const exerciseRequest = parseResult.data;

    // Generate exercises using AI
    try {
      const prompt = buildExerciseGeneratorPrompt(exerciseRequest);

      const responseText = await withRetryableTimeout(
        () => runSAMChatWithPreference({
          maxTokens: 5000,
          temperature: 0.7,
          systemPrompt: EXERCISE_GENERATOR_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          userId: session.userId,
          capability: 'course',
        }),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'exercise-generation'
      );

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      // Parse JSON response
      let aiExercises;
      try {
        // Clean the response to extract just the JSON array
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        aiExercises = JSON.parse(jsonString);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI model');
      }

      // Validate the response is an array
      if (!Array.isArray(aiExercises)) {
        logger.warn('AI response validation failed, using mock response');
        const mockExercises = generateMockExercises(exerciseRequest);
        return NextResponse.json({ 
          success: true, 
          exercises: mockExercises,
          warning: 'AI response validation failed, using template response'
        });
      }

      return NextResponse.json({
        success: true,
        exercises: aiExercises,
        metadata: {
          tokensUsed: 0,
          model: 'claude-sonnet-4-5-20250929',
          generatedAt: new Date().toISOString(),
          exerciseType: exerciseRequest.exerciseType,
          difficulty: exerciseRequest.difficulty
        }
      });

    } catch (apiError: any) {
      logger.error('Anthropic API error:', apiError);
      
      // Fall back to mock response for API errors
      const mockExercises = generateMockExercises(exerciseRequest);
      return NextResponse.json({ 
        success: true, 
        exercises: mockExercises,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: any) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Exercise generator error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}