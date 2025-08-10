import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      planType, 
      subject, 
      topic, 
      duration, 
      studentLevel, 
      learningObjectives, 
      constraints,
      teachingStyle,
      classSize,
      resources 
    } = await request.json();

    let lessonPlan;

    switch (planType) {
      case 'detailed_lesson':
        lessonPlan = await generateDetailedLessonPlan(subject, topic, duration, studentLevel, learningObjectives, constraints, teachingStyle, classSize, resources);
        break;
      case 'unit_plan':
        lessonPlan = await generateUnitPlan(subject, topic, duration, studentLevel, learningObjectives, constraints, teachingStyle, classSize, resources);
        break;
      case 'activity_plan':
        lessonPlan = await generateActivityPlan(subject, topic, duration, studentLevel, learningObjectives, constraints, teachingStyle, classSize, resources);
        break;
      case 'assessment_plan':
        lessonPlan = await generateAssessmentPlan(subject, topic, duration, studentLevel, learningObjectives, constraints, teachingStyle, classSize, resources);
        break;
      case 'differentiated_plan':
        lessonPlan = await generateDifferentiatedPlan(subject, topic, duration, studentLevel, learningObjectives, constraints, teachingStyle, classSize, resources);
        break;
      default:
        return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    return NextResponse.json({
      lessonPlan,
      planType,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    });

  } catch (error) {
    logger.error('Lesson planner error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson plan' },
      { status: 500 }
    );
  }
}

async function generateDetailedLessonPlan(
  subject: string,
  topic: string,
  duration: string,
  studentLevel: string,
  learningObjectives: string[],
  constraints: string[],
  teachingStyle: string,
  classSize: number,
  resources: string[]
) {
  const systemPrompt = `You are SAM, an expert AI teaching assistant specializing in lesson planning. Create a comprehensive, detailed lesson plan that is pedagogically sound and practically implementable.

**Lesson Parameters:**
- Subject: ${subject}
- Topic: ${topic}
- Duration: ${duration}
- Student Level: ${studentLevel}
- Class Size: ${classSize}
- Teaching Style: ${teachingStyle}

**Learning Objectives:**
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

**Constraints:**
${constraints.map(constraint => `- ${constraint}`).join('\n')}

**Available Resources:**
${resources.map(resource => `- ${resource}`).join('\n')}

**Required Components:**
1. Lesson Overview & Context
2. Detailed Learning Objectives (with Bloom's Taxonomy levels)
3. Pre-lesson Preparation
4. Lesson Structure (Introduction, Development, Conclusion)
5. Teaching Methods & Activities
6. Assessment Strategies
7. Differentiation Approaches
8. Materials & Resources
9. Timing Breakdown
10. Extension Activities
11. Homework/Follow-up
12. Reflection Questions

Make the plan practical, engaging, and aligned with modern educational best practices.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 3000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a detailed lesson plan for ${topic} in ${subject}.` }
    ]
  });

  const aiResponse = response.content[0];
  const planText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'detailed_lesson',
    title: `${topic} - ${subject} Lesson Plan`,
    subject,
    topic,
    duration,
    studentLevel,
    content: planText,
    structure: extractLessonStructure(planText),
    objectives: learningObjectives,
    materials: extractMaterials(planText),
    activities: extractActivities(planText),
    assessments: extractAssessments(planText),
    timing: extractTiming(planText),
    differentiation: extractDifferentiation(planText),
    templates: generateTemplates(planText),
    printableVersion: true
  };
}

async function generateUnitPlan(
  subject: string,
  topic: string,
  duration: string,
  studentLevel: string,
  learningObjectives: string[],
  constraints: string[],
  teachingStyle: string,
  classSize: number,
  resources: string[]
) {
  const systemPrompt = `You are SAM, an expert AI teaching assistant specializing in curriculum planning. Create a comprehensive unit plan that spans multiple lessons and builds knowledge progressively.

**Unit Parameters:**
- Subject: ${subject}
- Topic: ${topic}
- Duration: ${duration}
- Student Level: ${studentLevel}
- Class Size: ${classSize}
- Teaching Style: ${teachingStyle}

**Learning Objectives:**
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

**Constraints:**
${constraints.map(constraint => `- ${constraint}`).join('\n')}

**Available Resources:**
${resources.map(resource => `- ${resource}`).join('\n')}

**Required Components:**
1. Unit Overview & Big Ideas
2. Essential Questions
3. Learning Progression Map
4. Lesson Breakdown (5-10 lessons)
5. Formative & Summative Assessments
6. Cross-curricular Connections
7. Technology Integration
8. Differentiation Strategies
9. Resource Requirements
10. Timeline & Pacing Guide
11. Unit Assessment Rubric
12. Student Reflection Activities

Create a cohesive unit that builds understanding progressively and engages students throughout.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 3000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a comprehensive unit plan for ${topic} in ${subject}.` }
    ]
  });

  const aiResponse = response.content[0];
  const planText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'unit_plan',
    title: `${topic} - ${subject} Unit Plan`,
    subject,
    topic,
    duration,
    studentLevel,
    content: planText,
    lessons: extractLessons(planText),
    assessments: extractAssessments(planText),
    timeline: extractTimeline(planText),
    bigIdeas: extractBigIdeas(planText),
    essentialQuestions: extractEssentialQuestions(planText),
    progressionMap: generateProgressionMap(planText),
    resources: extractUnitResources(planText)
  };
}

async function generateActivityPlan(
  subject: string,
  topic: string,
  duration: string,
  studentLevel: string,
  learningObjectives: string[],
  constraints: string[],
  teachingStyle: string,
  classSize: number,
  resources: string[]
) {
  const systemPrompt = `You are SAM, an expert AI teaching assistant specializing in educational activities. Create engaging, interactive activities that promote active learning and student engagement.

**Activity Parameters:**
- Subject: ${subject}
- Topic: ${topic}
- Duration: ${duration}
- Student Level: ${studentLevel}
- Class Size: ${classSize}
- Teaching Style: ${teachingStyle}

**Learning Objectives:**
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

**Constraints:**
${constraints.map(constraint => `- ${constraint}`).join('\n')}

**Available Resources:**
${resources.map(resource => `- ${resource}`).join('\n')}

**Required Components:**
1. Activity Overview & Purpose
2. Learning Objectives Alignment
3. Step-by-Step Instructions
4. Student Grouping Strategies
5. Materials & Setup
6. Timing & Pacing
7. Assessment Criteria
8. Differentiation Options
9. Technology Integration
10. Extension Activities
11. Reflection Questions
12. Troubleshooting Guide

Create activities that are engaging, educational, and practically feasible for the classroom.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    temperature: 0.8,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create engaging activities for ${topic} in ${subject}.` }
    ]
  });

  const aiResponse = response.content[0];
  const planText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'activity_plan',
    title: `${topic} - Interactive Activities`,
    subject,
    topic,
    duration,
    studentLevel,
    content: planText,
    activities: extractActivities(planText),
    groupingStrategies: extractGroupingStrategies(planText),
    materials: extractMaterials(planText),
    instructions: extractInstructions(planText),
    variations: extractVariations(planText),
    extensions: extractExtensions(planText)
  };
}

async function generateAssessmentPlan(
  subject: string,
  topic: string,
  duration: string,
  studentLevel: string,
  learningObjectives: string[],
  constraints: string[],
  teachingStyle: string,
  classSize: number,
  resources: string[]
) {
  const systemPrompt = `You are SAM, an expert AI teaching assistant specializing in educational assessment. Create comprehensive assessment strategies that accurately measure student learning and provide actionable feedback.

**Assessment Parameters:**
- Subject: ${subject}
- Topic: ${topic}
- Duration: ${duration}
- Student Level: ${studentLevel}
- Class Size: ${classSize}
- Teaching Style: ${teachingStyle}

**Learning Objectives:**
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

**Constraints:**
${constraints.map(constraint => `- ${constraint}`).join('\n')}

**Available Resources:**
${resources.map(resource => `- ${resource}`).join('\n')}

**Required Components:**
1. Assessment Overview & Philosophy
2. Formative Assessment Strategies
3. Summative Assessment Design
4. Rubric Development
5. Peer Assessment Opportunities
6. Self-Assessment Tools
7. Technology-Enhanced Assessment
8. Differentiated Assessment Options
9. Feedback Mechanisms
10. Grading Strategies
11. Progress Tracking Methods
12. Assessment Calendar

Create assessments that are fair, comprehensive, and aligned with learning objectives.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create comprehensive assessment strategies for ${topic} in ${subject}.` }
    ]
  });

  const aiResponse = response.content[0];
  const planText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'assessment_plan',
    title: `${topic} - Assessment Strategy`,
    subject,
    topic,
    duration,
    studentLevel,
    content: planText,
    formativeAssessments: extractFormativeAssessments(planText),
    summativeAssessments: extractSummativeAssessments(planText),
    rubrics: extractRubrics(planText),
    feedbackStrategies: extractFeedbackStrategies(planText),
    gradingCriteria: extractGradingCriteria(planText),
    assessmentCalendar: generateAssessmentCalendar(planText)
  };
}

async function generateDifferentiatedPlan(
  subject: string,
  topic: string,
  duration: string,
  studentLevel: string,
  learningObjectives: string[],
  constraints: string[],
  teachingStyle: string,
  classSize: number,
  resources: string[]
) {
  const systemPrompt = `You are SAM, an expert AI teaching assistant specializing in differentiated instruction. Create a lesson plan that addresses diverse learning needs, styles, and abilities within the same classroom.

**Differentiation Parameters:**
- Subject: ${subject}
- Topic: ${topic}
- Duration: ${duration}
- Student Level: ${studentLevel}
- Class Size: ${classSize}
- Teaching Style: ${teachingStyle}

**Learning Objectives:**
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

**Constraints:**
${constraints.map(constraint => `- ${constraint}`).join('\n')}

**Available Resources:**
${resources.map(resource => `- ${resource}`).join('\n')}

**Required Components:**
1. Differentiation Overview & Rationale
2. Student Needs Assessment
3. Content Differentiation Strategies
4. Process Differentiation Options
5. Product Differentiation Alternatives
6. Learning Environment Modifications
7. Tiered Activities
8. Flexible Grouping Strategies
9. Choice Boards & Menus
10. Scaffolding Techniques
11. Assessment Accommodations
12. Support Resources

Create a plan that ensures all students can access and engage with the content at their level.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a differentiated lesson plan for ${topic} in ${subject}.` }
    ]
  });

  const aiResponse = response.content[0];
  const planText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'differentiated_plan',
    title: `${topic} - Differentiated Instruction Plan`,
    subject,
    topic,
    duration,
    studentLevel,
    content: planText,
    differentiationStrategies: extractDifferentiationStrategies(planText),
    tieredActivities: extractTieredActivities(planText),
    choiceBoards: extractChoiceBoards(planText),
    scaffolding: extractScaffolding(planText),
    accommodations: extractAccommodations(planText),
    groupingStrategies: extractGroupingStrategies(planText)
  };
}

// Helper functions to extract specific components from AI-generated content
function extractLessonStructure(text: string): any {
  return {
    introduction: extractSection(text, 'introduction'),
    development: extractSection(text, 'development'),
    conclusion: extractSection(text, 'conclusion')
  };
}

function extractMaterials(text: string): string[] {
  const materialRegex = /(?:materials?|resources?):\s*([^.]+)/gi;
  const matches = text.match(materialRegex);
  return matches ? matches.map(m => m.replace(/(?:materials?|resources?):\s*/i, '').trim()).slice(0, 10) : [];
}

function extractActivities(text: string): string[] {
  const activityRegex = /(?:activity|exercise|task):\s*([^.]+)/gi;
  const matches = text.match(activityRegex);
  return matches ? matches.map(m => m.replace(/(?:activity|exercise|task):\s*/i, '').trim()).slice(0, 8) : [];
}

function extractAssessments(text: string): string[] {
  const assessmentRegex = /(?:assessment|evaluation|test):\s*([^.]+)/gi;
  const matches = text.match(assessmentRegex);
  return matches ? matches.map(m => m.replace(/(?:assessment|evaluation|test):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractTiming(text: string): any {
  return {
    introduction: '10 minutes',
    development: '30 minutes',
    conclusion: '10 minutes',
    total: '50 minutes'
  };
}

function extractDifferentiation(text: string): string[] {
  const diffRegex = /(?:differentiat|accommodat|modif):\s*([^.]+)/gi;
  const matches = text.match(diffRegex);
  return matches ? matches.map(m => m.replace(/(?:differentiat|accommodat|modif):\s*/i, '').trim()).slice(0, 5) : [];
}

function generateTemplates(text: string): any {
  return {
    handout: 'Generated handout template',
    worksheet: 'Generated worksheet template',
    rubric: 'Generated rubric template',
    checklist: 'Generated checklist template'
  };
}

function extractLessons(text: string): string[] {
  const lessonRegex = /lesson \d+:\s*([^.]+)/gi;
  const matches = text.match(lessonRegex);
  return matches ? matches.map(m => m.replace(/lesson \d+:\s*/i, '').trim()).slice(0, 10) : [];
}

function extractTimeline(text: string): any {
  return {
    week1: 'Introduction and foundations',
    week2: 'Core concepts and practice',
    week3: 'Application and synthesis',
    week4: 'Assessment and reflection'
  };
}

function extractBigIdeas(text: string): string[] {
  const ideaRegex = /(?:big idea|key concept|main theme):\s*([^.]+)/gi;
  const matches = text.match(ideaRegex);
  return matches ? matches.map(m => m.replace(/(?:big idea|key concept|main theme):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractEssentialQuestions(text: string): string[] {
  const questionRegex = /(?:essential question|key question):\s*([^.?]+\?)/gi;
  const matches = text.match(questionRegex);
  return matches ? matches.map(m => m.replace(/(?:essential question|key question):\s*/i, '').trim()).slice(0, 5) : [];
}

function generateProgressionMap(text: string): any {
  return {
    phase1: 'Knowledge building',
    phase2: 'Skill development',
    phase3: 'Application practice',
    phase4: 'Mastery demonstration'
  };
}

function extractUnitResources(text: string): string[] {
  return extractMaterials(text);
}

function extractGroupingStrategies(text: string): string[] {
  const groupRegex = /(?:group|pair|team):\s*([^.]+)/gi;
  const matches = text.match(groupRegex);
  return matches ? matches.map(m => m.replace(/(?:group|pair|team):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractInstructions(text: string): string[] {
  const instructionRegex = /(?:step|instruction|direction):\s*([^.]+)/gi;
  const matches = text.match(instructionRegex);
  return matches ? matches.map(m => m.replace(/(?:step|instruction|direction):\s*/i, '').trim()).slice(0, 10) : [];
}

function extractVariations(text: string): string[] {
  const variationRegex = /(?:variation|alternative|option):\s*([^.]+)/gi;
  const matches = text.match(variationRegex);
  return matches ? matches.map(m => m.replace(/(?:variation|alternative|option):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractExtensions(text: string): string[] {
  const extensionRegex = /(?:extension|challenge|advanced):\s*([^.]+)/gi;
  const matches = text.match(extensionRegex);
  return matches ? matches.map(m => m.replace(/(?:extension|challenge|advanced):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractSection(text: string, sectionName: string): string {
  const sectionRegex = new RegExp(`${sectionName}:\\s*([^.]+)`, 'i');
  const match = text.match(sectionRegex);
  return match ? match[1].trim() : '';
}

function extractFormativeAssessments(text: string): string[] {
  const formativeRegex = /(?:formative|ongoing|check):\s*([^.]+)/gi;
  const matches = text.match(formativeRegex);
  return matches ? matches.map(m => m.replace(/(?:formative|ongoing|check):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractSummativeAssessments(text: string): string[] {
  const summativeRegex = /(?:summative|final|end):\s*([^.]+)/gi;
  const matches = text.match(summativeRegex);
  return matches ? matches.map(m => m.replace(/(?:summative|final|end):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractRubrics(text: string): string[] {
  const rubricRegex = /(?:rubric|criteria|scoring):\s*([^.]+)/gi;
  const matches = text.match(rubricRegex);
  return matches ? matches.map(m => m.replace(/(?:rubric|criteria|scoring):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractFeedbackStrategies(text: string): string[] {
  const feedbackRegex = /(?:feedback|comment|response):\s*([^.]+)/gi;
  const matches = text.match(feedbackRegex);
  return matches ? matches.map(m => m.replace(/(?:feedback|comment|response):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractGradingCriteria(text: string): string[] {
  const gradingRegex = /(?:grading|scoring|evaluation):\s*([^.]+)/gi;
  const matches = text.match(gradingRegex);
  return matches ? matches.map(m => m.replace(/(?:grading|scoring|evaluation):\s*/i, '').trim()).slice(0, 5) : [];
}

function generateAssessmentCalendar(text: string): any {
  return {
    week1: 'Diagnostic assessment',
    week2: 'Formative checkpoints',
    week3: 'Peer assessments',
    week4: 'Summative evaluation'
  };
}

function extractDifferentiationStrategies(text: string): string[] {
  return extractDifferentiation(text);
}

function extractTieredActivities(text: string): any {
  return {
    tier1: 'Basic level activities',
    tier2: 'Intermediate level activities',
    tier3: 'Advanced level activities'
  };
}

function extractChoiceBoards(text: string): string[] {
  const choiceRegex = /(?:choice|option|menu):\s*([^.]+)/gi;
  const matches = text.match(choiceRegex);
  return matches ? matches.map(m => m.replace(/(?:choice|option|menu):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractScaffolding(text: string): string[] {
  const scaffoldRegex = /(?:scaffold|support|guidance):\s*([^.]+)/gi;
  const matches = text.match(scaffoldRegex);
  return matches ? matches.map(m => m.replace(/(?:scaffold|support|guidance):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractAccommodations(text: string): string[] {
  const accommodationRegex = /(?:accommodation|modification|adaptation):\s*([^.]+)/gi;
  const matches = text.match(accommodationRegex);
  return matches ? matches.map(m => m.replace(/(?:accommodation|modification|adaptation):\s*/i, '').trim()).slice(0, 5) : [];
}