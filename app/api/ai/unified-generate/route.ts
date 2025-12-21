import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import * as z from "zod";
import { logger } from "@/lib/logger";

// Force Node.js runtime
export const runtime = "nodejs";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================================
// Schema Definitions
// ============================================================================

const BloomsLevelSchema = z.object({
  remember: z.boolean().optional(),
  understand: z.boolean().optional(),
  apply: z.boolean().optional(),
  analyze: z.boolean().optional(),
  evaluate: z.boolean().optional(),
  create: z.boolean().optional(),
});

const CourseContextSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  whatYouWillLearn: z.array(z.string()).optional(),
  courseGoals: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

const ChapterContextSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  learningOutcomes: z.string().nullable().optional(),
  position: z.number().optional(),
});

const SectionContextSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  learningObjectives: z.string().nullable().optional(),
  position: z.number().optional(),
});

const AdvancedSettingsSchema = z.object({
  targetAudience: z.string().optional(),
  difficulty: z.string().optional(),
  duration: z.string().optional(),
  tone: z.string().optional(),
  creativity: z.number().min(1).max(10).optional(),
  detailLevel: z.number().min(1).max(10).optional(),
  includeExamples: z.boolean().optional(),
  learningStyle: z.string().optional(),
  industryFocus: z.string().optional(),
});

const UnifiedGenerateRequestSchema = z.object({
  contentType: z.enum([
    "description",
    "learningObjectives",
    "content",
    "chapters",
    "sections",
    "questions",
    "codeExplanation",
    "mathExplanation",
  ]),
  entityLevel: z.enum(["course", "chapter", "section"]),
  entityTitle: z.string().min(1, "Entity title is required"),
  context: z.object({
    course: CourseContextSchema.optional(),
    chapter: ChapterContextSchema.optional(),
    section: SectionContextSchema.optional(),
  }),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  userPrompt: z.string().optional(),
  focusArea: z.string().optional(),
  bloomsEnabled: z.boolean().default(true),
  bloomsLevels: BloomsLevelSchema.optional(),
  advancedMode: z.boolean().optional(),
  advancedSettings: AdvancedSettingsSchema.optional(),
  existingContent: z.string().nullable().optional(),
  // Chapter-specific options
  chapterSettings: z.object({
    chapterCount: z.number().min(2).max(20),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    targetDuration: z.string(),
    focusAreas: z.array(z.string()),
    includeKeywords: z.string(),
    additionalInstructions: z.string(),
  }).optional(),
  // Section-specific options
  sectionSettings: z.object({
    sectionCount: z.number().min(2).max(15),
    contentType: z.enum(["mixed", "theory", "practical", "project"]),
    includeAssessment: z.boolean(),
    focusAreas: z.array(z.string()),
    additionalInstructions: z.string(),
  }).optional(),
});

type UnifiedGenerateRequest = z.infer<typeof UnifiedGenerateRequestSchema>;

// ============================================================================
// Bloom's Taxonomy Configuration
// ============================================================================

const BLOOMS_VERBS = {
  remember: ["Define", "List", "Recall", "Name", "Identify", "State", "Recognize"],
  understand: ["Describe", "Explain", "Summarize", "Interpret", "Classify", "Discuss"],
  apply: ["Apply", "Demonstrate", "Solve", "Use", "Implement", "Execute"],
  analyze: ["Analyze", "Compare", "Contrast", "Examine", "Differentiate", "Organize"],
  evaluate: ["Evaluate", "Judge", "Assess", "Critique", "Justify", "Defend"],
  create: ["Create", "Design", "Develop", "Construct", "Formulate", "Invent"],
};

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are an expert educational content creator who specializes in developing comprehensive course materials. You understand Bloom's Taxonomy and how to create content that targets specific cognitive levels.

Your expertise includes:
- Writing engaging course/chapter/section descriptions
- Creating measurable, achievable learning objectives using Bloom's Taxonomy
- Understanding different learning styles and student needs
- Aligning content with educational best practices
- Making content accessible and motivating

IMPORTANT RULES:
1. You MUST respond with ONLY the requested content
2. Do NOT include any prefixes, explanations, or additional text
3. Do NOT say "Here is..." or "Here are..." - just provide the content directly
4. For learning objectives, use proper HTML formatting as specified
5. Always align content with the provided context hierarchy`;

// ============================================================================
// Prompt Builders
// ============================================================================

function buildContextSection(request: UnifiedGenerateRequest): string {
  let contextSection = "";

  const { context } = request;

  // Course Context
  if (context.course) {
    const { title, description, whatYouWillLearn, courseGoals, difficulty, category } = context.course;
    contextSection += "\n## COURSE CONTEXT (Align content with this):\n";
    if (title) contextSection += `- Course Title: ${title}\n`;
    if (description) contextSection += `- Course Description: ${description}\n`;
    if (difficulty) contextSection += `- Difficulty Level: ${difficulty}\n`;
    if (category) contextSection += `- Category: ${category}\n`;
    if (courseGoals) contextSection += `- Course Goals: ${courseGoals}\n`;
    if (whatYouWillLearn && whatYouWillLearn.length > 0) {
      contextSection += `- Course Learning Outcomes:\n`;
      whatYouWillLearn.forEach((outcome, i) => {
        contextSection += `  ${i + 1}. ${outcome}\n`;
      });
    }
  }

  // Chapter Context
  if (context.chapter) {
    const { title, description, learningOutcomes, position } = context.chapter;
    contextSection += "\n## CHAPTER CONTEXT:\n";
    if (title) contextSection += `- Chapter Title: ${title}\n`;
    if (position) contextSection += `- Chapter Position: ${position}\n`;
    if (description) contextSection += `- Chapter Description: ${description}\n`;
    if (learningOutcomes) contextSection += `- Chapter Learning Outcomes: ${learningOutcomes}\n`;
  }

  // Section Context
  if (context.section) {
    const { title, description, learningObjectives, position } = context.section;
    contextSection += "\n## SECTION CONTEXT:\n";
    if (title) contextSection += `- Section Title: ${title}\n`;
    if (position) contextSection += `- Section Position: ${position}\n`;
    if (description) contextSection += `- Section Description: ${description}\n`;
    if (learningObjectives) contextSection += `- Existing Objectives: ${learningObjectives}\n`;
  }

  return contextSection;
}

function buildBloomsSection(request: UnifiedGenerateRequest): string {
  if (!request.bloomsEnabled || !request.bloomsLevels) {
    return "";
  }

  const selectedLevels = Object.entries(request.bloomsLevels)
    .filter(([, enabled]) => enabled)
    .map(([level]) => level);

  if (selectedLevels.length === 0) {
    return "";
  }

  let bloomsSection = "\n## BLOOM'S TAXONOMY REQUIREMENTS:\n";
  bloomsSection += "Target these cognitive levels in the generated content:\n\n";

  selectedLevels.forEach((level) => {
    const verbs = BLOOMS_VERBS[level as keyof typeof BLOOMS_VERBS];
    bloomsSection += `### ${level.toUpperCase()}\n`;
    bloomsSection += `Use action verbs like: ${verbs.join(", ")}\n\n`;
  });

  return bloomsSection;
}

function buildAdvancedSettingsSection(request: UnifiedGenerateRequest): string {
  if (!request.advancedMode || !request.advancedSettings) {
    return "";
  }

  const settings = request.advancedSettings;
  let section = "\n## ADVANCED SETTINGS:\n";

  if (settings.targetAudience) section += `- Target Audience: ${settings.targetAudience}\n`;
  if (settings.difficulty) section += `- Content Difficulty: ${settings.difficulty}\n`;
  if (settings.tone) section += `- Writing Tone: ${settings.tone}\n`;
  if (settings.learningStyle) section += `- Learning Style: ${settings.learningStyle}\n`;
  if (settings.industryFocus) section += `- Industry Focus: ${settings.industryFocus}\n`;
  if (settings.creativity) section += `- Creativity Level: ${settings.creativity}/10\n`;
  if (settings.detailLevel) section += `- Detail Level: ${settings.detailLevel}/10\n`;
  if (settings.includeExamples !== undefined) {
    section += `- Include Examples: ${settings.includeExamples ? "Yes" : "No"}\n`;
  }

  return section;
}

function buildPrompt(request: UnifiedGenerateRequest): string {
  const contextSection = buildContextSection(request);
  const bloomsSection = buildBloomsSection(request);
  const advancedSection = buildAdvancedSettingsSection(request);

  const userInstructions = request.userPrompt ? `\n## USER INSTRUCTIONS:\n${request.userPrompt}\n` : "";
  const focusArea = request.focusArea ? `\n## FOCUS AREA:\n${request.focusArea}\n` : "";

  let typeSpecificPrompt = "";

  switch (request.contentType) {
    case "description":
      typeSpecificPrompt = buildDescriptionPrompt(request);
      break;
    case "learningObjectives":
      typeSpecificPrompt = buildLearningObjectivesPrompt(request);
      break;
    case "content":
      typeSpecificPrompt = buildContentPrompt(request);
      break;
    case "chapters":
      typeSpecificPrompt = buildChaptersPrompt(request);
      break;
    case "sections":
      typeSpecificPrompt = buildSectionsPrompt(request);
      break;
    default:
      typeSpecificPrompt = buildGenericPrompt(request);
  }

  return `${contextSection}${bloomsSection}${advancedSection}${userInstructions}${focusArea}\n${typeSpecificPrompt}`;
}

function buildDescriptionPrompt(request: UnifiedGenerateRequest): string {
  const entityType = request.entityLevel.charAt(0).toUpperCase() + request.entityLevel.slice(1);

  return `Create a compelling ${request.entityLevel} description for: "${request.entityTitle}"

**Requirements for ${entityType} Description**:

1. **Engaging Opening**: Start with what learners will achieve
2. **Clear Value Proposition**: Explain why this ${request.entityLevel} matters
3. **Learning Journey**: Describe what learners will experience
4. **Context Alignment**: Ensure consistency with course/chapter context above
5. **Outcomes Focus**: Emphasize practical results and skills gained

**Tone and Style**:
- Professional yet accessible
- Inspiring and motivational
- Clear and specific
- Action-oriented language
- 100-200 words for sections, 150-250 for chapters/courses

**Format**: Write as a cohesive, flowing description. Use HTML paragraphs if needed.

Generate the ${request.entityLevel} description:`;
}

function buildLearningObjectivesPrompt(request: UnifiedGenerateRequest): string {
  const entityType = request.entityLevel.charAt(0).toUpperCase() + request.entityLevel.slice(1);

  return `Create clear learning objectives for: "${request.entityTitle}"

**Requirements for Learning Objectives**:

1. **Measurable Outcomes**: Use action verbs from Bloom's Taxonomy
2. **Specific Skills**: Be precise about what learners will be able to do
3. **Progressive Learning**: Show skill building from basic to advanced
4. **Context Alignment**: Align with the ${request.entityLevel}'s role in the overall course
5. **Clear Structure**: Provide 3-5 well-defined objectives for sections, 4-7 for chapters

**Format**: Provide as an HTML unordered list with proper styling:
<ul class="list-disc pl-6 space-y-1 mb-3">
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Objective 1 using action verb</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Objective 2 using action verb</li>
</ul>

Generate the learning objectives:`;
}

function buildContentPrompt(request: UnifiedGenerateRequest): string {
  return `Create comprehensive educational content for: "${request.entityTitle}"

**Requirements**:
1. Well-structured content with clear headings
2. Examples and illustrations where appropriate
3. Progressive difficulty
4. Practical applications
5. Summary/key takeaways

**Format**: Use HTML formatting with proper headings (h3, h4), paragraphs, and lists.

Generate the educational content:`;
}

function buildChaptersPrompt(request: UnifiedGenerateRequest): string {
  const settings = request.chapterSettings || {
    chapterCount: 5,
    difficulty: 'intermediate',
    targetDuration: '3-4 hours',
    focusAreas: [],
    includeKeywords: '',
    additionalInstructions: '',
  };

  const difficultyDescriptions = {
    beginner: 'Foundational concepts with step-by-step explanations, suitable for those new to the subject',
    intermediate: 'Building on basics with practical applications, suitable for learners with some background',
    advanced: 'Complex topics and expert-level content for experienced learners',
  };

  const courseTitle = request.entityTitle;
  const courseDesc = request.context.course?.description || '';
  const learningOutcomes = request.context.course?.whatYouWillLearn || [];
  const courseGoals = request.context.course?.courseGoals || '';

  return `You are creating a structured course curriculum. Generate exactly ${settings.chapterCount} chapter titles for this course.

## COURSE INFORMATION (Use this to create relevant chapters):
- **Course Title**: ${courseTitle}
${courseDesc ? `- **Course Description**: ${courseDesc}` : ''}
${courseGoals ? `- **Course Goals**: ${courseGoals}` : ''}
${learningOutcomes.length > 0 ? `- **Learning Outcomes** (chapters MUST help students achieve these):
${learningOutcomes.map((outcome, i) => `  ${i + 1}. ${outcome}`).join('\n')}` : ''}

## CHAPTER REQUIREMENTS:
- **Total Chapters**: Exactly ${settings.chapterCount}
- **Difficulty**: ${settings.difficulty.toUpperCase()} - ${difficultyDescriptions[settings.difficulty as keyof typeof difficultyDescriptions]}
- **Duration**: Each chapter ~${settings.targetDuration} of learning

## CHAPTER STRUCTURE GUIDELINES:
1. **Chapter 1**: Always start with introduction/fundamentals
2. **Middle Chapters**: Core concepts, building progressively
3. **Final Chapter(s)**: Advanced topics, projects, or capstone
4. Each title should be 3-8 words, clear and specific to the course topic
5. Titles must directly relate to "${courseTitle}" - NOT generic titles

${settings.focusAreas.length > 0 ? `## FOCUS AREAS (incorporate these themes):
${settings.focusAreas.map(area => `- ${area}`).join('\n')}` : ''}

${settings.includeKeywords ? `## KEYWORDS TO INCLUDE: ${settings.includeKeywords}` : ''}

${settings.additionalInstructions ? `## ADDITIONAL INSTRUCTIONS: ${settings.additionalInstructions}` : ''}

## OUTPUT FORMAT:
Return ONLY a raw JSON array. NO markdown, NO code blocks, NO explanation.
Example: ["Introduction to X", "Understanding Y", "Building Z"]

Generate ${settings.chapterCount} chapter titles for "${courseTitle}" now:`;
}

function buildSectionsPrompt(request: UnifiedGenerateRequest): string {
  const settings = request.sectionSettings || {
    sectionCount: 5,
    contentType: 'mixed',
    includeAssessment: true,
    focusAreas: [],
    additionalInstructions: '',
  };

  const contentTypeDescriptions = {
    mixed: 'A balanced mix of theory and practical content',
    theory: 'Focus on concepts, explanations, and definitions',
    practical: 'Hands-on exercises, examples, and code samples',
    project: 'Step-by-step project building with real applications',
  };

  const chapterTitle = request.entityTitle;
  const chapterDesc = request.context.chapter?.description || '';
  const chapterOutcomes = request.context.chapter?.learningOutcomes || '';
  const courseTitle = request.context.course?.title || '';
  const courseDesc = request.context.course?.description || '';

  return `You are creating a structured chapter curriculum. Generate exactly ${settings.sectionCount} section titles for this chapter.

## CHAPTER INFORMATION (Use this to create relevant sections):
- **Chapter Title**: ${chapterTitle}
${chapterDesc ? `- **Chapter Description**: ${chapterDesc}` : ''}
${chapterOutcomes ? `- **Chapter Learning Outcomes**: ${chapterOutcomes}` : ''}

## COURSE CONTEXT:
${courseTitle ? `- **Course**: ${courseTitle}` : ''}
${courseDesc ? `- **Course Description**: ${courseDesc}` : ''}

## SECTION REQUIREMENTS:
- **Total Sections**: Exactly ${settings.sectionCount}
- **Content Type**: ${settings.contentType.toUpperCase()} - ${contentTypeDescriptions[settings.contentType as keyof typeof contentTypeDescriptions]}
${settings.includeAssessment ? '- **Include Assessment**: Yes - Include a quiz, exercise, or assessment section' : ''}

## SECTION STRUCTURE GUIDELINES:
1. **Section 1**: Start with introduction/overview of the chapter topic
2. **Middle Sections**: Core concepts, building progressively in complexity
3. **Final Section(s)**: ${settings.includeAssessment ? 'Practice exercises or assessment' : 'Summary and key takeaways'}
4. Each title should be 3-8 words, clear and specific to "${chapterTitle}"
5. Titles must directly relate to the chapter content - NOT generic titles

${settings.focusAreas.length > 0 ? `## FOCUS AREAS (incorporate these elements):
${settings.focusAreas.map(area => `- ${area}`).join('\n')}` : ''}

${settings.additionalInstructions ? `## ADDITIONAL INSTRUCTIONS: ${settings.additionalInstructions}` : ''}

## OUTPUT FORMAT:
Return ONLY a raw JSON array. NO markdown, NO code blocks, NO explanation.
Example: ["Introduction to X", "Understanding Y", "Building Z"]

Generate ${settings.sectionCount} section titles for chapter "${chapterTitle}" now:`;
}

function buildGenericPrompt(request: UnifiedGenerateRequest): string {
  return `Create ${request.contentType} for: "${request.entityTitle}"

Generate high-quality, context-aware content that aligns with the provided context and requirements.`;
}

// ============================================================================
// Mock Content Generator
// ============================================================================

function generateMockContent(request: UnifiedGenerateRequest): string {
  const { contentType, entityTitle, entityLevel } = request;

  if (contentType === "description") {
    return `This comprehensive ${entityTitle} ${entityLevel} is designed to provide learners with practical skills and theoretical knowledge essential for success. Through hands-on exercises, real-world projects, and expert guidance, you will develop the confidence and competency needed to excel. The ${entityLevel} combines interactive learning experiences with industry best practices, ensuring that you not only understand the concepts but can also apply them effectively.`;
  }

  if (contentType === "learningObjectives") {
    return `<ul class="list-disc pl-6 space-y-1 mb-3">
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Master the fundamental concepts and principles of ${entityTitle}</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Apply practical skills through hands-on projects and real-world scenarios</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Analyze and evaluate different approaches to problem-solving</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Create original solutions demonstrating your understanding</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Develop critical thinking abilities for independent work</li>
</ul>`;
  }

  if (contentType === "chapters") {
    const chapterCount = request.chapterSettings?.chapterCount || 5;
    const chapterTemplates = [
      `Introduction to ${entityTitle}`,
      `${entityTitle} Fundamentals`,
      `Core Concepts of ${entityTitle}`,
      `Practical ${entityTitle} Applications`,
      `Working with ${entityTitle}`,
      `Advanced ${entityTitle} Techniques`,
      `${entityTitle} Best Practices`,
      `${entityTitle} Problem Solving`,
      `Real-World ${entityTitle} Projects`,
      `Mastering ${entityTitle}`,
      `${entityTitle} Case Studies`,
      `${entityTitle} Integration`,
      `Optimizing ${entityTitle}`,
      `${entityTitle} Architecture`,
      `${entityTitle} Security`,
      `Testing ${entityTitle}`,
      `Deploying ${entityTitle}`,
      `${entityTitle} Maintenance`,
      `Future of ${entityTitle}`,
      `${entityTitle} Capstone Project`,
    ];
    // Return exactly the requested number of chapters
    const chapters = chapterTemplates.slice(0, chapterCount);
    return JSON.stringify(chapters);
  }

  if (contentType === "sections") {
    const sectionCount = request.sectionSettings?.sectionCount || 5;
    const sectionTemplates = [
      `Introduction to ${entityTitle}`,
      `Understanding ${entityTitle} Basics`,
      `Key Concepts in ${entityTitle}`,
      `${entityTitle} in Practice`,
      `Working with ${entityTitle}`,
      `${entityTitle} Examples`,
      `Common ${entityTitle} Patterns`,
      `${entityTitle} Best Practices`,
      `Troubleshooting ${entityTitle}`,
      `${entityTitle} Exercises`,
      `${entityTitle} Quiz`,
      `${entityTitle} Summary`,
      `Advanced ${entityTitle} Topics`,
      `${entityTitle} Resources`,
      `${entityTitle} Review`,
    ];
    // Return exactly the requested number of sections
    const sections = sectionTemplates.slice(0, sectionCount);
    return JSON.stringify(sections);
  }

  return `Generated content for ${entityTitle}. This is placeholder content that would be replaced with AI-generated content when the API is properly configured.`;
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = UnifiedGenerateRequestSchema.safeParse(body);

    if (!parseResult.success) {
      logger.error("Validation error:", parseResult.error.errors);
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    const contentRequest = parseResult.data;

    // Log request for debugging
    logger.info("Unified AI Generate request:", {
      contentType: contentRequest.contentType,
      entityLevel: contentRequest.entityLevel,
      entityTitle: contentRequest.entityTitle,
      bloomsEnabled: contentRequest.bloomsEnabled,
      advancedMode: contentRequest.advancedMode,
    });

    // Check if ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn("ANTHROPIC_API_KEY not configured, using mock response");
      const mockContent = generateMockContent(contentRequest);
      return NextResponse.json({
        success: true,
        content: mockContent,
        warning: "Using template response - API key not configured",
      });
    }

    // Generate content using Anthropic Claude
    try {
      const prompt = buildPrompt(contentRequest);

      logger.debug("Generated prompt:", prompt.substring(0, 500) + "...");

      const completion = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        temperature: contentRequest.advancedSettings?.creativity
          ? contentRequest.advancedSettings.creativity / 10
          : 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Extract response
      const responseText =
        completion.content[0]?.type === "text" ? completion.content[0].text : "";

      if (!responseText) {
        throw new Error("Empty response from AI model");
      }

      // Clean up response (remove any "Here is..." prefixes and markdown code blocks)
      let cleanedResponse = responseText.trim();

      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '');
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/i, '');

      const prefixPatterns = [
        /^Here (?:is|are) (?:the|a|an)?.*?:\s*/i,
        /^I've (?:created|generated|written).*?:\s*/i,
        /^Below (?:is|are).*?:\s*/i,
      ];
      prefixPatterns.forEach((pattern) => {
        cleanedResponse = cleanedResponse.replace(pattern, "");
      });

      // For chapters and sections content type, ensure we return valid JSON array
      if (contentRequest.contentType === "chapters" || contentRequest.contentType === "sections") {
        try {
          // Try to parse as JSON to validate
          const parsed = JSON.parse(cleanedResponse.trim());
          if (Array.isArray(parsed)) {
            // Clean each title (remove quotes, commas if somehow included)
            const cleanTitles = parsed.map((item: string | { title: string }) => {
              if (typeof item === 'string') {
                return item.trim();
              } else if (item && typeof item === 'object' && 'title' in item) {
                return item.title.trim();
              }
              return String(item).trim();
            });
            cleanedResponse = JSON.stringify(cleanTitles);
          }
        } catch {
          // If JSON parsing fails, try to extract titles from the text
          logger.warn(`Failed to parse ${contentRequest.contentType} JSON, attempting line extraction`);
          const lines = cleanedResponse.split('\n')
            .map(line => line.trim())
            .filter(line => {
              // Skip empty lines, brackets, backticks
              if (!line || line === '[' || line === ']' || line.startsWith('```')) return false;
              return true;
            })
            .map(line => {
              // Remove quotes, commas, and numbering
              return line
                .replace(/^["']|["'],?$/g, '') // Remove surrounding quotes and trailing comma
                .replace(/^\d+\.\s*/, '') // Remove numbering like "1. "
                .replace(/^-\s*/, '') // Remove bullet points
                .trim();
            })
            .filter(line => line.length > 0);

          cleanedResponse = JSON.stringify(lines);
        }
      }

      return NextResponse.json({
        success: true,
        content: cleanedResponse.trim(),
        metadata: {
          tokensUsed: completion.usage?.input_tokens || 0,
          model: "claude-sonnet-4-5-20250929",
          generatedAt: new Date().toISOString(),
          bloomsLevels: contentRequest.bloomsEnabled ? contentRequest.bloomsLevels : undefined,
        },
      });
    } catch (apiError) {
      logger.error("Anthropic API error:", apiError);

      // Fall back to mock response
      const mockContent = generateMockContent(contentRequest);
      return NextResponse.json({
        success: true,
        content: mockContent,
        warning: "AI service temporarily unavailable, using template response",
      });
    }
  } catch (error) {
    logger.error("Unified generate error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
