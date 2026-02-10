import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import {
  BLOOMS_TAXONOMY,
  CHAPTER_THINKING_FRAMEWORK,
  SECTION_THINKING_FRAMEWORK,
  LEARNING_OBJECTIVES_FRAMEWORK,
  buildChapterDescriptionPrompt,
  buildSectionDescriptionPrompt,
} from '@/lib/sam/prompts/content-generation-criteria';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
      formData,
      samContext = [],
      existingObjectives = [],
      bloomsFocus = [],
      preferredContentTypes = []
    } = requestBody;

    if (!formData) {
      return NextResponse.json({ error: 'Missing formData in request' }, { status: 400 });
    }

    if (!formData.courseTitle) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 });
    }

    if (!formData.courseShortOverview) {
      return NextResponse.json({ error: 'Course overview is required' }, { status: 400 });
    }

    // Generate complete course structure using SAM context
    const courseStructure = await generateCompleteStructureWithSAM({
      formData,
      samContext,
      existingObjectives,
      bloomsFocus,
      preferredContentTypes,
      userId: user.id
    });

    return NextResponse.json({ 
      success: true, 
      courseStructure,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        samContextUsed: samContext.length > 0,
        bloomsLevelsApplied: bloomsFocus.length
      }
    });
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Error generating complete course structure:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for common error types
    if (errorMessage.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json({
        error: 'AI service not configured',
        details: 'API key is missing'
      }, { status: 503 });
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return NextResponse.json({
        error: 'AI service temporarily unavailable',
        details: 'Rate limit exceeded. Please try again in a moment.'
      }, { status: 429 });
    }

    if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
      return NextResponse.json({
        error: 'Generation taking too long',
        details: 'The AI is taking longer than expected. Try with fewer chapters or simpler content.'
      }, { status: 504 });
    }

    return NextResponse.json({
      error: 'Failed to generate course structure',
      details: errorMessage
    }, { status: 500 });
  }
}

async function generateCompleteStructureWithSAM({
  formData,
  samContext,
  existingObjectives,
  bloomsFocus,
  preferredContentTypes,
  userId
}: {
  formData: any;
  samContext: string[];
  existingObjectives: string[];
  bloomsFocus: string[];
  preferredContentTypes: string[];
  userId: string;
}) {

  // Build comprehensive context for SAM
  const contextualKnowledge = buildSAMContext({
    formData,
    samContext,
    existingObjectives,
    bloomsFocus,
    preferredContentTypes
  });

  // Step 1: Generate enhanced course description using SAM context
  const courseDescription = await generateContextualCourseDescription(contextualKnowledge, userId);

  // Step 2: Generate comprehensive learning objectives with existing ones
  const learningObjectives = await generateContextualLearningObjectives(
    contextualKnowledge,
    existingObjectives,
    userId
  );

  // Step 3: Generate Bloom's-focused chapters with SAM context
  const chapters = await generateBloomsContextualChapters(
    contextualKnowledge,
    learningObjectives,
    userId
  );

  return {
    courseDescription,
    learningObjectives,
    chapters,
    metadata: {
      totalChapters: chapters.length,
      totalSections: chapters.reduce((sum: number, ch: any) => sum + ch.sections.length, 0),
      bloomsLevelsUsed: Array.from(new Set(chapters.map((ch: any) => ch.bloomsLevel))),
      contentTypesUsed: Array.from(new Set(chapters.flatMap((ch: any) => ch.sections.map((s: any) => s.contentType)))),
      contextSources: {
        samInteractions: samContext.length,
        existingObjectives: existingObjectives.length,
        bloomsFocus: bloomsFocus.length
      }
    }
  };
}

function buildSAMContext({
  formData,
  samContext,
  existingObjectives,
  bloomsFocus,
  preferredContentTypes
}: any) {
  return {
    // Core course information
    courseTitle: formData.courseTitle,
    courseOverview: formData.courseShortOverview,
    category: formData.courseCategory,
    subcategory: formData.courseSubcategory,
    targetAudience: formData.targetAudience,
    difficulty: formData.difficulty,
    intent: formData.courseIntent,

    // Structure preferences
    chapterCount: formData.chapterCount || 8,
    sectionsPerChapter: formData.sectionsPerChapter || 3,

    // Learning objectives configuration - Bloom's aligned
    learningObjectivesPerChapter: formData.learningObjectivesPerChapter || 5,
    learningObjectivesPerSection: formData.learningObjectivesPerSection || 3,

    // Educational framework
    bloomsFocus: bloomsFocus,
    preferredContentTypes: preferredContentTypes,
    includeAssessments: formData.includeAssessments,

    // SAM contextual knowledge
    previousSamInteractions: samContext,
    existingLearningObjectives: existingObjectives,

    // AI assistant personality with enhanced thinking
    samPersonality: `I am SAM, your intelligent course design assistant. I create educationally sound, engaging courses by thinking deeply about:

1. THE INTUITION: Why does each chapter/section exist? What gap does it fill?
2. THE TOPICS: What core concepts MUST be covered for meaningful learning?
3. BLOOM'S TAXONOMY: How do I incorporate cognitive progression from remembering to creating?
4. PRACTICAL APPLICATION: How will students USE this knowledge in real work?
5. SKILL DEVELOPMENT: What specific skills will grow inside students?
6. LEARNING PROGRESSION: How does this build on previous learning and prepare for future concepts?

I follow pedagogical best practices and ensure every piece of content has clear purpose and measurable outcomes.`
  };
}

async function generateContextualCourseDescription(context: any, userId: string) {
  // Build Bloom's progression description
  const bloomsProgressionDesc = context.bloomsFocus.map((level: string) => {
    const info = BLOOMS_TAXONOMY[level as keyof typeof BLOOMS_TAXONOMY];
    return info ? `${level} (${info.description})` : level;
  }).join(' → ');

  const prompt = `${context.samPersonality}

## TASK
Create a comprehensive, compelling course description that captures the essence of the learning journey.

## COURSE CONTEXT
- Title: "${context.courseTitle}"
- Current Overview: "${context.courseOverview}"
- Category: ${context.category}${context.subcategory ? ` → ${context.subcategory}` : ''}
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficulty}
- Learning Intent: ${context.intent}
- Structure: ${context.chapterCount} chapters, ${context.sectionsPerChapter} sections each

## EDUCATIONAL FRAMEWORK
- Bloom's Progression: ${bloomsProgressionDesc}
- Preferred Content Types: ${context.preferredContentTypes.join(', ')}
- Include Assessments: ${context.includeAssessments ? 'Yes' : 'No'}

## THINKING FRAMEWORK FOR COURSE DESCRIPTION

Before writing, consider these critical dimensions:

### 1. THE "WHY" - INTUITION & PURPOSE
- Why should ${context.targetAudience} take this course?
- What transformation will occur in the learner?
- What real-world problems will they be able to solve?
- What career or personal growth opportunities does this unlock?

### 2. THE "WHAT" - CORE VALUE PROPOSITION
- What specific knowledge and skills will students gain?
- What makes this course unique or comprehensive?
- What is the scope and depth of coverage?

### 3. THE "HOW" - LEARNING APPROACH
- How is the learning structured for maximum retention?
- What hands-on experiences are included?
- How does the course progress from basic to advanced?

### 4. THE OUTCOMES - PRACTICAL APPLICATIONS
- What will students be able to DO after completing this course?
- What projects, problems, or challenges will they be equipped to handle?
- What skills will they have developed?

### 5. THE AUDIENCE CONNECTION
- How does this address the specific needs of ${context.targetAudience}?
- What assumptions about prior knowledge are made?
- Why is this the right course for them?

## OUTPUT REQUIREMENTS

Write a compelling 3-paragraph course description:

**Paragraph 1 - Hook & Value Proposition:**
Open with a compelling statement about why this topic matters and what transformation students will experience. Address the "why" for ${context.targetAudience}.

**Paragraph 2 - Learning Journey & Content:**
Describe the structured learning path, key topics covered, and the Bloom's taxonomy progression (${context.bloomsFocus.join(' → ')}). Mention the ${context.chapterCount} comprehensive chapters and hands-on approach.

**Paragraph 3 - Practical Outcomes & Call to Action:**
Emphasize practical applications, skills developed, and real-world readiness. End with what students will be able to accomplish.

Write in second person ("you will learn...") to directly engage the learner. Be specific, not generic.

Return only the course description, no additional formatting.`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return responseText.trim() || context.courseOverview;
}

async function generateContextualLearningObjectives(context: any, existingObjectives: string[], userId: string) {
  // Build Bloom's verb reference for the AI
  const bloomsVerbReference = context.bloomsFocus.map((level: string) => {
    const info = BLOOMS_TAXONOMY[level as keyof typeof BLOOMS_TAXONOMY];
    if (info) {
      return `${level} (Level ${info.level}):
  - Description: ${info.description}
  - Cognitive Process: ${info.cognitiveProcess}
  - Student Outcome: ${info.studentOutcome}
  - REQUIRED Verbs: ${info.verbs.join(', ')}`;
    }
    return level;
  }).join('\n\n');

  const prompt = `${context.samPersonality}

${LEARNING_OBJECTIVES_FRAMEWORK}

## TASK
Create comprehensive learning objectives for this course.

## COURSE CONTEXT
- Title: "${context.courseTitle}"
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficulty}
- Structure: ${context.chapterCount} chapters, ${context.sectionsPerChapter} sections each

## EXISTING LEARNING OBJECTIVES
${existingObjectives.length > 0 ?
    existingObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n') :
    'No existing objectives defined.'
  }

## BLOOM'S TAXONOMY REFERENCE
${bloomsVerbReference}

## CRITICAL THINKING FOR EACH OBJECTIVE

Before writing each objective, think through:

### 1. BLOOM'S VERB SELECTION
- Which cognitive level is appropriate for this objective?
- Select a SPECIFIC verb from the approved list for that level
- NEVER use vague verbs like "understand", "know", "learn", "appreciate"

### 2. SPECIFIC CONTENT
- What EXACTLY will students do?
- Be specific, not general
- Focus on one measurable outcome

### 3. MEASURABILITY
- How will we know students achieved this?
- What evidence demonstrates success?
- Can this be observed or assessed?

### 4. CONDITIONS (when appropriate)
- Under what circumstances?
- With what resources?
- Given what constraints?

### 5. REAL-WORLD APPLICATION
- Why does this matter professionally for ${context.targetAudience}?
- Where will students use this skill?
- What problem does this solve?

## QUALITY CHECKLIST FOR EACH OBJECTIVE
Before finalizing each objective, verify:
[ ] Uses an active, observable Bloom's taxonomy verb
[ ] Is specific and focused (not too broad)
[ ] Can be measured or observed
[ ] Is achievable within the course timeframe
[ ] Aligns with overall course goals
[ ] Is relevant to ${context.targetAudience}
[ ] Connects to practical application

## OUTPUT REQUIREMENTS
Generate 8-10 comprehensive learning objectives that:
1. Start with "Students will be able to..." or directly with the Bloom's verb
2. Progress through Bloom's levels: ${context.bloomsFocus.join(' → ')}
3. Cover the full scope of the course
4. Balance technical skills with cognitive abilities
5. Include at least 2 practical/application-focused objectives

Return as a JSON array of strings. Each objective should be a complete, well-formed sentence.

Example format:
[
  "Identify and describe the fundamental concepts of [topic], including [specific elements]",
  "Apply [specific techniques] to solve real-world problems in [domain]",
  "Analyze [complex scenarios] to determine optimal approaches based on [criteria]",
  "Design and implement [solutions] that demonstrate mastery of [skills]"
]`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const content = responseText.trim() || '[]';
    const objectives = JSON.parse(content);
    return Array.isArray(objectives) ? objectives : existingObjectives;
  } catch {
    // Fallback: Parse text format
    const lines = responseText
      .split('\n')
      .filter(line => line.includes('Students will be able to'));
    return lines.length > 0 ? lines : existingObjectives;
  }
}

async function generateBloomsContextualChapters(context: any, learningObjectives: string[], userId: string) {
  // Get Bloom's level details for enhanced prompting
  const bloomsDetails = context.bloomsFocus.map((level: string) => {
    const info = BLOOMS_TAXONOMY[level as keyof typeof BLOOMS_TAXONOMY];
    return info ? `${level}: ${info.description} (Verbs: ${info.verbs.slice(0, 5).join(', ')})` : level;
  }).join('\n');

  const prompt = `${context.samPersonality}

${CHAPTER_THINKING_FRAMEWORK}

I need to create ${context.chapterCount} chapters for this course, each with ${context.sectionsPerChapter} sections.

## COURSE CONTEXT
- Title: "${context.courseTitle}"
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficulty}
- Category: ${context.category}

## LEARNING OBJECTIVES TO FULFILL
${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## BLOOM'S TAXONOMY PROGRESSION
${bloomsDetails}

## CONTENT PREFERENCES
- Content Types: ${context.preferredContentTypes.join(', ')}
- Include Assessments: ${context.includeAssessments ? 'Yes' : 'No'}
- Learning Objectives Per Chapter: ${context.learningObjectivesPerChapter}
- Learning Objectives Per Section: ${context.learningObjectivesPerSection}

## CRITICAL THINKING REQUIREMENTS

For EACH chapter, you MUST think through:

### 1. INTUITION BEHIND DEVELOPMENT
- Why does this chapter exist in the learning journey?
- What knowledge gap does it fill?
- What misconceptions does it address?
- How does it prepare students for advanced concepts?

### 2. MAIN TOPICS TO COVER
- What are the 3-5 CORE topics for this chapter?
- How do these topics build on each other?
- What practical applications connect to each topic?

### 3. BLOOM'S COGNITIVE INTEGRATION
For the assigned level, ensure the description reflects that cognitive process:
- REMEMBER: Focus on definitions, terminology, facts
- UNDERSTAND: Explain relationships, use analogies
- APPLY: Show use cases, problem-solving scenarios
- ANALYZE: Break down complexity, identify patterns
- EVALUATE: Present criteria for judgment, trade-offs
- CREATE: Design challenges, synthesis opportunities

### 4. PRACTICAL APPLICATIONS
- How will students USE this in real work?
- What problems can they solve after this chapter?
- What hands-on projects reinforce learning?

### 5. SKILLS DEVELOPED
- What technical skills are gained?
- What cognitive abilities are enhanced?
- What professional competencies are built?

### 6. LEARNING PROGRESSION
- What must students know BEFORE this chapter?
- How does this build on previous chapters?
- What does this enable in future learning?

## OUTPUT FORMAT

Return JSON with this EXACT structure:
{
  "chapters": [
    {
      "title": "Chapter Title - Clear and Specific",
      "description": "A compelling 3-4 sentence description that incorporates: (1) the intuition behind why this chapter matters, (2) main topics covered, (3) practical applications, and (4) skills students will develop. Write directly to the learner.",
      "learningOutcomes": [
        "Objective 1 using appropriate Bloom's verb...",
        "Objective 2...",
        // Exactly ${context.learningObjectivesPerChapter} objectives per chapter
      ],
      "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "practicalApplications": ["Real-world application 1", "Application 2"],
      "skillsDeveloped": ["Skill 1", "Skill 2"],
      "bloomsLevel": "UNDERSTAND",
      "position": 1,
      "estimatedTime": "2 hours",
      "prerequisites": "What students should know before this chapter",
      "sections": [
        {
          "title": "Section Title",
          "description": "Focused 2-3 sentence description of what students will learn and DO in this section. Include hands-on activities.",
          "learningObjectives": [
            "Section objective 1...",
            // Exactly ${context.learningObjectivesPerSection} objectives per section
          ],
          "contentType": "video|reading|assignment|quiz|project",
          "estimatedDuration": "20 minutes",
          "position": 1,
          "keyConceptsCovered": ["Concept 1", "Concept 2"],
          "practicalActivity": "Description of hands-on activity"
        }
      ]
    }
  ]
}

IMPORTANT QUALITY REQUIREMENTS:
1. Each chapter description MUST mention practical applications
2. Each learning objective MUST start with a Bloom's taxonomy verb appropriate to the chapter's level
3. Sections MUST have specific, actionable learning objectives
4. Content MUST progress logically from chapter to chapter
5. Skills developed MUST be concrete and measurable`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 4000,
    messages: [{ role: 'user', content: prompt }],
    extended: true, // Use extended timeout for complex chapter generation
  });

  try {
    const content = responseText.trim() || '{"chapters": []}';
    // Clean up the response to ensure valid JSON
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedContent);
    return result.chapters || [];
  } catch (error) {
    logger.error('Error parsing chapters JSON:', error);
    // Fallback: Generate basic structure
    return generateFallbackChapters(context);
  }
}

/**
 * Generate fallback chapters when AI parsing fails
 * Creates meaningful, Bloom's-aligned content instead of generic placeholders
 */
function generateFallbackChapters(context: any) {
  const bloomsProgression = context.bloomsFocus.length > 0
    ? context.bloomsFocus
    : ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const contentTypes = context.preferredContentTypes.length > 0
    ? context.preferredContentTypes
    : ['video', 'reading', 'assignment', 'quiz'];

  // Bloom's taxonomy verb mapping for generating objectives
  const bloomsVerbs: Record<string, string[]> = {
    REMEMBER: ['Define', 'List', 'Identify', 'Name', 'Recall'],
    UNDERSTAND: ['Explain', 'Summarize', 'Interpret', 'Describe', 'Compare'],
    APPLY: ['Apply', 'Demonstrate', 'Implement', 'Use', 'Execute'],
    ANALYZE: ['Analyze', 'Examine', 'Differentiate', 'Investigate', 'Organize'],
    EVALUATE: ['Evaluate', 'Assess', 'Critique', 'Justify', 'Recommend'],
    CREATE: ['Create', 'Design', 'Develop', 'Construct', 'Produce'],
  };

  // Topic progression templates based on course structure
  const topicTemplates = [
    'Introduction and Fundamentals',
    'Core Principles and Concepts',
    'Practical Techniques and Methods',
    'Advanced Strategies and Patterns',
    'Real-World Applications',
    'Best Practices and Optimization',
    'Integration and Implementation',
    'Mastery and Projects',
  ];

  const sectionTemplates = [
    ['Key Concepts Overview', 'Fundamental Principles', 'Getting Started'],
    ['Deep Dive into Theory', 'Understanding the Mechanics', 'Core Components'],
    ['Hands-On Practice', 'Implementation Workshop', 'Applied Techniques'],
    ['Advanced Topics', 'Complex Scenarios', 'Expert Strategies'],
  ];

  const courseTitle = context.courseTitle || 'Course';
  const targetAudience = context.targetAudience || 'learners';
  const difficulty = context.difficulty || 'intermediate';
  const objectivesPerChapter = context.learningObjectivesPerChapter || 5;
  const objectivesPerSection = context.learningObjectivesPerSection || 3;

  return Array.from({ length: context.chapterCount }, (_, i) => {
    const bloomsLevel = bloomsProgression[i % bloomsProgression.length] || 'UNDERSTAND';
    const verbs = bloomsVerbs[bloomsLevel] || bloomsVerbs['UNDERSTAND'];
    const topicFocus = topicTemplates[i % topicTemplates.length];

    // Generate chapter title based on progression
    const chapterTitle = `${topicFocus} of ${courseTitle}`;

    // Generate chapter description with educational context
    const chapterDescription = `In this chapter, you will explore ${topicFocus.toLowerCase()} related to ${courseTitle.toLowerCase()}. ` +
      `Designed for ${targetAudience} at the ${difficulty} level, this chapter focuses on ${bloomsLevel.toLowerCase()}-level cognitive skills. ` +
      `Through a combination of theory and practical exercises, you will build a solid foundation for advancing your expertise.`;

    // Generate Bloom's-aligned learning outcomes for chapter
    const learningOutcomes = Array.from({ length: objectivesPerChapter }, (_, objIndex) => {
      const verb = verbs[objIndex % verbs.length];
      const objectives = [
        `${verb} the key concepts and terminology of ${topicFocus.toLowerCase()}`,
        `${verb} the relationship between ${topicFocus.toLowerCase()} and practical applications`,
        `${verb} common challenges and solutions in ${topicFocus.toLowerCase()}`,
        `${verb} best practices for implementing ${topicFocus.toLowerCase()} concepts`,
        `${verb} real-world examples demonstrating ${topicFocus.toLowerCase()}`,
      ];
      return objectives[objIndex % objectives.length];
    });

    const sectionGroup = sectionTemplates[i % sectionTemplates.length];

    return {
      title: `Chapter ${i + 1}: ${chapterTitle}`,
      description: chapterDescription,
      bloomsLevel,
      position: i + 1,
      learningOutcomes,
      keyTopics: [`${topicFocus} fundamentals`, `Practical ${topicFocus.toLowerCase()}`, `${topicFocus} applications`],
      practicalApplications: [`Apply ${topicFocus.toLowerCase()} in real projects`, `Build practical solutions`],
      skillsDeveloped: [`${bloomsLevel.toLowerCase()}-level cognitive skills`, `Practical expertise in ${topicFocus.toLowerCase()}`],
      estimatedTime: `${context.sectionsPerChapter * 20} minutes`,
      prerequisites: i > 0 ? `Completion of Chapter ${i}` : 'Basic understanding of the subject matter',
      sections: Array.from({ length: context.sectionsPerChapter }, (_, j) => {
        const sectionTitle = sectionGroup[j % sectionGroup.length];
        const contentType = contentTypes[j % contentTypes.length];

        // Generate Bloom's-aligned learning objectives for section
        const sectionObjectives = Array.from({ length: objectivesPerSection }, (_, secObjIndex) => {
          const verb = verbs[secObjIndex % verbs.length];
          return `${verb} ${sectionTitle.toLowerCase()} concepts through ${contentType} content`;
        });

        return {
          title: `Section ${j + 1}: ${sectionTitle}`,
          description: `This section covers ${sectionTitle.toLowerCase()} through ${contentType} content. ` +
            `You will gain practical experience and reinforce your understanding of the chapter's core concepts.`,
          contentType,
          estimatedDuration: '15-20 minutes',
          position: j + 1,
          learningObjectives: sectionObjectives,
          keyConceptsCovered: [`${sectionTitle} fundamentals`, `Practical ${sectionTitle.toLowerCase()} techniques`],
          practicalActivity: `Complete ${contentType}-based exercises on ${sectionTitle.toLowerCase()}`,
        };
      }),
    };
  });
}
