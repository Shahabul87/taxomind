import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'nodejs';

interface ValidationRequest {
  field?: 'courseTitle' | 'courseOverview' | 'targetAudience' | 'learningGoals' | 'courseStructure' | 'bloomsAlignment';
  value?: any;
  context?: {
    courseCategory?: string;
    courseSubcategory?: string;
    difficulty?: string;
    targetAudience?: string;
    courseIntent?: string;
    otherFields?: Record<string, any>;
  };
  // Alternative format from AI Creator page
  formData?: any;
  step?: number;
  userExperience?: string;
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: {
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    field?: string;
  }[];
  suggestions: {
    type: 'improvement' | 'alternative' | 'enhancement';
    message: string;
    example?: string;
  }[];
  optimizedValue?: string;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: ValidationRequest = await req.json();
    
    // Handle different validation formats
    let validation: ValidationResult;
    
    if (body.formData) {
      // Handle AI Creator page format
      validation = await validateFormData(body.formData, body.step || 1);
    } else if (body.field) {
      // Handle individual field validation format
      validation = await validateField(body);
    } else {
      throw new Error("Invalid validation request format");
    }
    
    return NextResponse.json(validation);
    
  } catch (error) {
    logger.error("[VALIDATION] Error:", error);
    
    // Return basic validation result on error
    const fallbackResult: ValidationResult = {
      isValid: true,
      score: 70,
      issues: [],
      suggestions: [{
        type: 'improvement',
        message: 'Consider adding more detail to make your course more appealing to students.'
      }]
    };
    
    return NextResponse.json(fallbackResult);
  }
}

async function validateFormData(formData: any, step: number): Promise<ValidationResult> {
  // Create a comprehensive validation result based on the current form data
  const validations = [];
  
  // Always validate basic fields if they exist
  if (formData.courseTitle) {
    const titleValidation = await validateCourseTitle(formData.courseTitle, formData);
    validations.push({...titleValidation, field: 'courseTitle'});
  }
  
  if (formData.courseShortOverview) {
    const overviewValidation = await validateCourseOverview(formData.courseShortOverview, formData);
    validations.push({...overviewValidation, field: 'courseShortOverview'});
  }
  
  if (formData.targetAudience) {
    const audienceValidation = await validateTargetAudience(formData.targetAudience, formData);
    validations.push({...audienceValidation, field: 'targetAudience'});
  }
  
  if (formData.courseGoals && formData.courseGoals.length > 0) {
    const goalsValidation = await validateLearningGoals(formData.courseGoals, formData);
    validations.push({...goalsValidation, field: 'courseGoals'});
  }
  
  if (formData.chapterCount && formData.sectionsPerChapter) {
    const structureValidation = await validateCourseStructure({
      chapterCount: formData.chapterCount,
      sectionsPerChapter: formData.sectionsPerChapter
    }, formData);
    validations.push({...structureValidation, field: 'courseStructure'});
  }
  
  if (formData.bloomsFocus && formData.bloomsFocus.length > 0) {
    const bloomsValidation = await validateBloomsAlignment(formData.bloomsFocus, formData);
    validations.push({...bloomsValidation, field: 'bloomsFocus'});
  }
  
  // Combine all validations
  const averageScore = validations.length > 0 ? 
    Math.round(validations.reduce((sum, v) => sum + v.score, 0) / validations.length) : 70;
  
  const allIssues = validations.flatMap(v => v.issues || []);
  const allSuggestions = validations.flatMap(v => v.suggestions || []);
  
  return {
    isValid: allIssues.filter(i => i.type === 'error').length === 0,
    score: averageScore,
    issues: allIssues,
    suggestions: allSuggestions.slice(0, 3) // Limit to 3 suggestions to avoid overwhelm
  };
}

async function validateField(request: ValidationRequest): Promise<ValidationResult> {
  const { field, value, context } = request;
  
  if (!field) {
    throw new Error(`Field is required for validation`);
  }
  
  switch (field) {
    case 'courseTitle':
      return await validateCourseTitle(value, context);
    case 'courseOverview':
      return await validateCourseOverview(value, context);
    case 'targetAudience':
      return await validateTargetAudience(value, context);
    case 'learningGoals':
      return await validateLearningGoals(value, context);
    case 'courseStructure':
      return await validateCourseStructure(value, context);
    case 'bloomsAlignment':
      return await validateBloomsAlignment(value, context);
    default:
      throw new Error(`Unknown field: ${field}`);
  }
}

async function validateCourseTitle(title: string, context: any): Promise<ValidationResult> {
  if (!title || title.length < 5) {
    return {
      isValid: false,
      score: 20,
      issues: [
        {
          type: 'error',
          message: 'Course title must be at least 5 characters long.'
        }
      ],
      suggestions: [
        {
          type: 'improvement',
          message: 'Include the main topic, skill level, and target outcome in your title.',
          example: 'Complete React Development: From Beginner to Professional'
        }
      ]
    };
  }

  const prompt = `Analyze this course title for educational effectiveness and marketing appeal.

TITLE: "${title}"
CONTEXT: 
- Category: ${context.courseCategory || 'Not specified'}
- Subcategory: ${context.courseSubcategory || 'Not specified'}
- Target Audience: ${context.targetAudience || 'Not specified'}
- Difficulty: ${context.difficulty || 'Not specified'}

ANALYSIS CRITERIA:
1. Clarity: Is it clear what the course teaches?
2. Appeal: Would the target audience find it attractive?
3. SEO potential: Does it include searchable keywords?
4. Specificity: Does it indicate the level and scope?
5. Length: Is it appropriate for course platforms (30-60 characters ideal)?

Return ONLY valid JSON in this format:
{
  "isValid": boolean,
  "score": number (0-100),
  "issues": [
    {
      "type": "error|warning|suggestion",
      "message": "Specific issue description"
    }
  ],
  "suggestions": [
    {
      "type": "improvement|alternative|enhancement", 
      "message": "Specific actionable suggestion",
      "example": "Example of improved title (optional)"
    }
  ],
  "optimizedValue": "Suggested improved title (if needed)"
}

Focus on actionable feedback that will help create a more successful course.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(content.text);
  } catch (error) {
    logger.error('Title validation error:', error);
    return getBasicTitleValidation(title);
  }
}

async function validateCourseOverview(overview: string, context: any): Promise<ValidationResult> {
  if (!overview || overview.length < 50) {
    return {
      isValid: false,
      score: 30,
      issues: [
        {
          type: 'error',
          message: 'Course overview must be at least 50 characters long.'
        }
      ],
      suggestions: [
        {
          type: 'improvement',
          message: 'Describe what students will learn, what problems the course solves, and what outcomes they can expect.',
        }
      ]
    };
  }

  const prompt = `Analyze this course overview for clarity, appeal, and educational value.

OVERVIEW: "${overview}"
CONTEXT:
- Category: ${context.courseCategory || 'Not specified'}
- Target Audience: ${context.targetAudience || 'Not specified'}
- Course Intent: ${context.courseIntent || 'Not specified'}
- Difficulty: ${context.difficulty || 'Not specified'}

EVALUATION CRITERIA:
1. Value Proposition: Clear benefits for students
2. Target Audience Alignment: Appropriate for the intended learners
3. Learning Outcomes: Specific skills/knowledge students will gain
4. Problem-Solution Fit: Addresses real needs
5. Engagement: Compelling and motivating language
6. Length: Appropriate detail (150-300 words ideal)

Return ONLY valid JSON with validation results and specific suggestions for improvement.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1200,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(content.text);
  } catch (error) {
    logger.error('Overview validation error:', error);
    return getBasicOverviewValidation(overview);
  }
}

async function validateTargetAudience(audience: string, context: any): Promise<ValidationResult> {
  if (!audience || audience.length < 10) {
    return {
      isValid: false,
      score: 25,
      issues: [
        {
          type: 'error',
          message: 'Target audience description is too brief.'
        }
      ],
      suggestions: [
        {
          type: 'improvement',
          message: 'Be specific about experience level, background, and goals.',
          example: 'Working professionals with basic HTML/CSS knowledge looking to advance to full-stack development'
        }
      ]
    };
  }

  const prompt = `Evaluate this target audience definition for a course.

AUDIENCE: "${audience}"
CONTEXT:
- Category: ${context.courseCategory || 'Not specified'}
- Difficulty: ${context.difficulty || 'Not specified'}
- Course Intent: ${context.courseIntent || 'Not specified'}

ANALYSIS:
1. Specificity: Is the audience clearly defined?
2. Achievability: Are the expectations realistic?
3. Market Size: Is this a viable audience size?
4. Alignment: Does it match the difficulty and category?
5. Clarity: Would course creators understand this audience?

Return JSON with validation score, issues, and suggestions for improvement.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 800,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(content.text);
  } catch (error) {
    logger.error('Audience validation error:', error);
    return getBasicAudienceValidation(audience);
  }
}

async function validateLearningGoals(goals: string[], context: any): Promise<ValidationResult> {
  if (!goals || goals.length === 0) {
    return {
      isValid: false,
      score: 20,
      issues: [
        {
          type: 'error',
          message: 'At least one learning goal is required.'
        }
      ],
      suggestions: [
        {
          type: 'improvement',
          message: 'Add 3-5 specific, measurable learning objectives.',
          example: 'Build a full-stack web application using React and Node.js'
        }
      ]
    };
  }

  // Basic validation for goals
  let score = 60;
  const issues = [];
  const suggestions = [];

  if (goals.length < 3) {
    issues.push({
      type: 'warning' as const,
      message: 'Consider adding more learning goals (3-5 recommended).'
    });
    score -= 15;
  }

  if (goals.some(goal => goal.length < 20)) {
    issues.push({
      type: 'suggestion' as const,
      message: 'Some goals are quite brief. Consider adding more specific details.'
    });
    score -= 10;
  }

  if (goals.length > 7) {
    issues.push({
      type: 'warning' as const,
      message: 'Too many goals may overwhelm students. Consider consolidating to 3-5 key objectives.'
    });
    score -= 10;
  }

  // Add suggestions
  suggestions.push({
    type: 'improvement' as const,
    message: 'Use action verbs like "build", "create", "analyze", "implement" to make goals more concrete.'
  });

  return {
    isValid: issues.filter((i: any) => i.type === 'error').length === 0,
    score: Math.max(score, 30),
    issues,
    suggestions
  };
}

async function validateCourseStructure(structure: any, context: any): Promise<ValidationResult> {
  const { chapterCount, sectionsPerChapter } = structure;
  
  let score = 70;
  const issues = [];
  const suggestions = [];

  // Validate chapter count
  if (!chapterCount || chapterCount < 3) {
    issues.push({
      type: 'warning' as const,
      message: 'Consider having at least 3 chapters for comprehensive coverage.'
    });
    score -= 15;
  }

  if (chapterCount > 15) {
    issues.push({
      type: 'warning' as const,
      message: 'Too many chapters may make the course overwhelming. Consider consolidating content.'
    });
    score -= 10;
  }

  // Validate sections per chapter
  if (!sectionsPerChapter || sectionsPerChapter < 2) {
    issues.push({
      type: 'suggestion' as const,
      message: 'Consider having at least 2-3 sections per chapter for better content organization.'
    });
    score -= 10;
  }

  if (sectionsPerChapter > 8) {
    issues.push({
      type: 'warning' as const,
      message: 'Too many sections per chapter may create cognitive overload.'
    });
    score -= 10;
  }

  // Calculate total sections
  const totalSections = chapterCount * sectionsPerChapter;
  if (totalSections > 60) {
    issues.push({
      type: 'warning' as const,
      message: 'Course structure seems very large. Consider if all content is essential.'
    });
    score -= 15;
  }

  suggestions.push({
    type: 'improvement' as const,
    message: 'Aim for 4-8 chapters with 3-5 sections each for optimal learning progression.'
  });

  return {
    isValid: issues.filter((i: any) => i.type === 'error').length === 0,
    score: Math.max(score, 40),
    issues,
    suggestions
  };
}

async function validateBloomsAlignment(bloomsLevels: string[], context: any): Promise<ValidationResult> {
  if (!bloomsLevels || bloomsLevels.length === 0) {
    return {
      isValid: false,
      score: 30,
      issues: [
        {
          type: 'error',
          message: 'At least one Bloom\'s taxonomy level must be selected.'
        }
      ],
      suggestions: [
        {
          type: 'improvement',
          message: 'Select cognitive levels that align with your course difficulty and learning objectives.'
        }
      ]
    };
  }

  const bloomsOrder = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const difficulty = context.difficulty;
  
  let score = 80;
  const issues = [];
  const suggestions = [];

  // Check progression logic
  const selectedLevels = bloomsLevels.map(level => bloomsOrder.indexOf(level)).filter(index => index !== -1);
  const hasProgression = selectedLevels.length > 1 && Math.max(...selectedLevels) > Math.min(...selectedLevels);

  if (!hasProgression && bloomsLevels.length > 1) {
    suggestions.push({
      type: 'enhancement' as const,
      message: 'Consider including a range of cognitive levels for better learning progression.'
    });
    score -= 10;
  }

  // Check alignment with difficulty
  if (difficulty === 'BEGINNER' && bloomsLevels.includes('CREATE')) {
    issues.push({
      type: 'warning' as const,
      message: 'CREATE level might be too advanced for beginner courses. Consider focusing on REMEMBER, UNDERSTAND, and APPLY.'
    });
    score -= 15;
  }

  if (difficulty === 'ADVANCED' && !bloomsLevels.some(level => ['ANALYZE', 'EVALUATE', 'CREATE'].includes(level))) {
    issues.push({
      type: 'suggestion' as const,
      message: 'Advanced courses typically benefit from higher-order thinking skills like ANALYZE, EVALUATE, or CREATE.'
    });
    score -= 10;
  }

  return {
    isValid: issues.filter((i: any) => i.type === 'error').length === 0,
    score: Math.max(score, 50),
    issues,
    suggestions
  };
}

// Fallback validation functions
function getBasicTitleValidation(title: string): ValidationResult {
  let score = 60;
  const issues = [];
  const suggestions = [];

  if (title.length < 20) {
    issues.push({ type: 'suggestion' as const, message: 'Consider making your title more descriptive.' });
    score -= 20;
  }

  if (title.length > 80) {
    issues.push({ type: 'warning' as const, message: 'Title might be too long for some platforms.' });
    score -= 10;
  }

  if (!title.match(/\b(learn|master|complete|guide|course|training)\b/i)) {
    suggestions.push({
      type: 'enhancement' as const,
      message: 'Consider including action words like "Learn", "Master", or "Complete" to make the title more engaging.'
    });
  }

  return { isValid: true, score, issues, suggestions };
}

function getBasicOverviewValidation(overview: string): ValidationResult {
  let score = 70;
  const issues = [];
  const suggestions = [];

  if (overview.length < 100) {
    issues.push({ type: 'suggestion' as const, message: 'Consider expanding your overview to provide more value proposition.' });
    score -= 15;
  }

  if (!overview.match(/\b(will|learn|build|create|develop|gain)\b/i)) {
    suggestions.push({
      type: 'improvement' as const,
      message: 'Include specific outcomes students will achieve.'
    });
    score -= 10;
  }

  return { isValid: true, score, issues, suggestions };
}

function getBasicAudienceValidation(audience: string): ValidationResult {
  let score = 75;
  const issues = [];
  const suggestions = [];

  if (audience.length < 20) {
    issues.push({ type: 'suggestion' as const, message: 'Provide more specific details about your target audience.' });
    score -= 15;
  }

  if (!audience.match(/\b(beginner|intermediate|advanced|experience|background|knowledge)\b/i)) {
    suggestions.push({
      type: 'improvement' as const,
      message: 'Specify the experience level or background of your target audience.'
    });
    score -= 10;
  }

  return { isValid: true, score, issues, suggestions };
}