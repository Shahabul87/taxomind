import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      formData, 
      samContext = [], 
      existingObjectives = [],
      bloomsFocus = [],
      preferredContentTypes = []
    } = await request.json();

    if (!formData.courseTitle || !formData.courseShortOverview) {
      return NextResponse.json({ error: 'Missing required course information' }, { status: 400 });
    }

    // Generate complete course structure using SAM context
    const courseStructure = await generateCompleteStructureWithSAM({
      formData,
      samContext,
      existingObjectives,
      bloomsFocus,
      preferredContentTypes
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
    logger.error('Error generating complete course structure:', error);
    return NextResponse.json({ 
      error: 'Failed to generate course structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateCompleteStructureWithSAM({
  formData,
  samContext,
  existingObjectives,
  bloomsFocus,
  preferredContentTypes
}: {
  formData: any;
  samContext: string[];
  existingObjectives: string[];
  bloomsFocus: string[];
  preferredContentTypes: string[];
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
  const courseDescription = await generateContextualCourseDescription(contextualKnowledge);

  // Step 2: Generate comprehensive learning objectives with existing ones
  const learningObjectives = await generateContextualLearningObjectives(
    contextualKnowledge,
    existingObjectives
  );

  // Step 3: Generate Bloom's-focused chapters with SAM context
  const chapters = await generateBloomsContextualChapters(
    contextualKnowledge,
    learningObjectives
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
    
    // Educational framework
    bloomsFocus: bloomsFocus,
    preferredContentTypes: preferredContentTypes,
    includeAssessments: formData.includeAssessments,
    
    // SAM contextual knowledge
    previousSamInteractions: samContext,
    existingLearningObjectives: existingObjectives,
    
    // AI assistant personality
    samPersonality: "I am SAM, your intelligent course design assistant. I create educationally sound, engaging courses that follow pedagogical best practices."
  };
}

async function generateContextualCourseDescription(context: any) {
  const prompt = `${context.samPersonality}

Based on our previous conversations and your course requirements, I need to create a comprehensive course description.

COURSE CONTEXT:
- Title: "${context.courseTitle}"
- Current Overview: "${context.courseOverview}"
- Category: ${context.category}${context.subcategory ? ` → ${context.subcategory}` : ''}
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficulty}
- Learning Intent: ${context.intent}

PREVIOUS SAM INTERACTIONS:
${context.previousSamInteractions.length > 0 ? 
  context.previousSamInteractions.map((interaction: string, i: number) => `${i + 1}. ${interaction}`).join('\n') :
  'No previous interactions available.'
}

EDUCATIONAL FRAMEWORK:
- Bloom's Focus: ${context.bloomsFocus.join(', ')}
- Preferred Content Types: ${context.preferredContentTypes.join(', ')}
- Include Assessments: ${context.includeAssessments ? 'Yes' : 'No'}

TASK: Create an enhanced, comprehensive course description that:
1. Builds upon our previous conversations and context
2. Incorporates the educational framework preferences
3. Clearly communicates value proposition to the target audience
4. Maintains the core intent while enhancing clarity and appeal
5. Uses pedagogically sound language for ${context.difficulty} level learners
6. Addresses specific needs of ${context.targetAudience}

Return only the enhanced course description (2-3 paragraphs), no additional formatting or explanations.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : context.courseOverview;
}

async function generateContextualLearningObjectives(context: any, existingObjectives: string[]) {
  const prompt = `${context.samPersonality}

I need to create comprehensive learning objectives for this course, building upon our existing context and any objectives we've already identified.

COURSE CONTEXT:
- Title: "${context.courseTitle}"
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficulty}
- Structure: ${context.chapterCount} chapters, ${context.sectionsPerChapter} sections each

EXISTING LEARNING OBJECTIVES:
${existingObjectives.length > 0 ? 
  existingObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n') :
  'No existing objectives defined.'
}

BLOOM'S TAXONOMY FOCUS:
${context.bloomsFocus.join(', ')}

PREVIOUS SAM CONTEXT:
${context.previousSamInteractions.slice(-3).join(' | ')}

TASK: Generate 6-8 comprehensive learning objectives that:
1. Include and enhance any existing objectives provided
2. Follow the specified Bloom's taxonomy levels: ${context.bloomsFocus.join(', ')}
3. Progress from basic to advanced concepts appropriate for ${context.difficulty} level
4. Use measurable action verbs aligned with Bloom's taxonomy
5. Are specific, achievable, and relevant to ${context.targetAudience}
6. Build upon our previous SAM conversations and course context

Format each objective as a complete sentence starting with "Students will be able to..."

Return as a JSON array of strings, no additional formatting.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  try {
    const content = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
    const objectives = JSON.parse(content);
    return Array.isArray(objectives) ? objectives : existingObjectives;
  } catch {
    // Fallback: Parse text format
    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const lines = content.split('\n').filter(line => line.includes('Students will be able to'));
    return lines.length > 0 ? lines : existingObjectives;
  }
}

async function generateBloomsContextualChapters(context: any, learningObjectives: string[]) {
  const prompt = `${context.samPersonality}

I need to create ${context.chapterCount} chapters for this course, each with ${context.sectionsPerChapter} sections, using our contextual knowledge and Bloom's taxonomy focus.

COURSE CONTEXT:
- Title: "${context.courseTitle}"
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficulty}
- Category: ${context.category}

LEARNING OBJECTIVES TO FULFILL:
${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

BLOOM'S TAXONOMY FOCUS:
${context.bloomsFocus.join(', ')}

PREFERRED CONTENT TYPES:
${context.preferredContentTypes.join(', ')}

PREVIOUS SAM INTERACTIONS:
${context.previousSamInteractions.slice(-2).join(' | ')}

TASK: Create ${context.chapterCount} chapters that:
1. Progress through Bloom's taxonomy levels: ${context.bloomsFocus.join(' → ')}
2. Each chapter focuses on one primary Bloom's level
3. Build upon our previous conversations and context
4. Address specific needs of ${context.targetAudience}
5. Use preferred content types: ${context.preferredContentTypes.join(', ')}
6. Include ${context.includeAssessments ? 'assessments and practice activities' : 'engaging content without formal assessments'}

For each chapter, create:
- Title (clear, engaging, specific to content)
- Description (2-3 sentences explaining what students will learn)
- Primary Bloom's level (from: ${context.bloomsFocus.join(', ')})
- ${context.sectionsPerChapter} sections with titles, brief descriptions, content types, and estimated durations

Return as JSON in this exact format:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "description": "Chapter description...",
      "bloomsLevel": "UNDERSTAND",
      "position": 1,
      "sections": [
        {
          "title": "Section Title",
          "description": "Section description...",
          "contentType": "video|reading|assignment|quiz|project",
          "estimatedDuration": "15 minutes",
          "position": 1
        }
      ]
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  try {
    const content = response.content[0].type === 'text' ? response.content[0].text.trim() : '{"chapters": []}';
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

function generateFallbackChapters(context: any) {
  const bloomsProgression = context.bloomsFocus.length > 0 ? context.bloomsFocus : ['UNDERSTAND', 'APPLY', 'ANALYZE'];
  const contentTypes = context.preferredContentTypes.length > 0 ? context.preferredContentTypes : ['video', 'reading', 'assignment'];
  
  return Array.from({ length: context.chapterCount }, (_, i) => ({
    title: `Chapter ${i + 1}: ${context.courseTitle} - Part ${i + 1}`,
    description: `This chapter covers essential concepts for ${context.targetAudience} at ${context.difficulty} level.`,
    bloomsLevel: bloomsProgression[i % bloomsProgression.length],
    position: i + 1,
    sections: Array.from({ length: context.sectionsPerChapter }, (_, j) => ({
      title: `Section ${j + 1}: Core Concepts`,
      description: `Learn fundamental concepts and apply them in practical scenarios.`,
      contentType: contentTypes[j % contentTypes.length],
      estimatedDuration: '20 minutes',
      position: j + 1
    }))
  }));
}