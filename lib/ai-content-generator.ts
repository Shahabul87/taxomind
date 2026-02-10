import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import type { CourseGenerationRequest } from './course-blueprint-generator';
import { logger } from '@/lib/logger';

export interface EnhancedContentRequest extends CourseGenerationRequest {
  // Additional context for better generation
  industryContext?: string;
  learningMethodology?: 'project-based' | 'theory-first' | 'practical-first' | 'mixed';
  assessmentStyle?: 'continuous' | 'milestone' | 'final-only' | 'mixed';
  previousExperience?: string;
  specificSkills?: string[];
  realWorldApplications?: string[];
}

export interface DetailedSection {
  title: string;
  description: string;
  contentType: string;
  bloomsLevel: string;
  estimatedDuration: string;
  learningObjectives: string[];
  keyTopics: string[];
  activities: string[];
  prerequisites: string[];
  practicalExercises: string[];
  assessmentQuestions: string[];
  realWorldExamples: string[];
  commonPitfalls: string[];
  successTips: string[];
}

export interface EnhancedChapter {
  title: string;
  description: string;
  learningOutcomes: string[];
  bloomsLevel: string;
  estimatedDuration: string;
  prerequisites: string[];
  keySkills: string[];
  realWorldRelevance: string;
  sections: DetailedSection[];
  chapterProject?: {
    title: string;
    description: string;
    deliverables: string[];
    evaluationCriteria: string[];
  };
  assessments: {
    formative: string[];
    summative: string[];
  };
}

export interface IntelligentCourseBlueprint {
  course: {
    title: string;
    description: string;
    subtitle: string;
    learningOutcomes: string[];
    prerequisites: string[];
    targetAudience: string;
    estimatedDuration: string;
    difficulty: string;
    uniqueSellingPoints: string[];
    careerOutcomes: string[];
    industryRelevance: string;
  };
  chapters: EnhancedChapter[];
  courseLevelProject?: {
    title: string;
    description: string;
    phases: string[];
    timeline: string;
    portfolioValue: string;
  };
  metadata: {
    aiGenerated: boolean;
    generatedAt: string;
    bloomsDistribution: Record<string, number>;
    contentTypeDistribution: Record<string, number>;
    totalEstimatedHours: number;
    difficultyProgression: string;
    pedagogicalApproach: string;
    innovationFactors: string[];
  };
}

export async function generateIntelligentCourseContent(
  requirements: EnhancedContentRequest,
  userId: string
): Promise<IntelligentCourseBlueprint> {
  try {
    // Step 1: Generate course strategy and approach
    const courseStrategy = await generateCourseStrategy(requirements, userId);

    // Step 2: Generate detailed course structure
    const courseStructure = await generateDetailedCourseStructure(requirements, courseStrategy, userId);

    // Step 3: Generate individual chapters with full details
    const enhancedChapters = await generateEnhancedChapters(requirements, courseStructure, userId);

    // Step 4: Generate course-level project if applicable
    const courseLevelProject = await generateCourseLevelProject(requirements, enhancedChapters, userId);
    
    // Step 5: Compile final blueprint
    const blueprint: IntelligentCourseBlueprint = {
      course: courseStructure.course,
      chapters: enhancedChapters,
      courseLevelProject,
      metadata: {
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        bloomsDistribution: calculateBloomsDistribution(enhancedChapters),
        contentTypeDistribution: calculateContentDistribution(enhancedChapters),
        totalEstimatedHours: calculateTotalDuration(enhancedChapters),
        difficultyProgression: analyzeQuestionDifficultyProgression(enhancedChapters),
        pedagogicalApproach: courseStrategy.approach,
        innovationFactors: courseStrategy.innovations
      }
    };
    
    return blueprint;
    
  } catch (error: any) {
    logger.error('Error generating intelligent course content:', error);
    throw new Error(`Failed to generate intelligent course content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateCourseStrategy(requirements: EnhancedContentRequest, userId: string): Promise<{
  approach: string;
  innovations: string[];
  learningPath: string;
  assessmentStrategy: string;
}> {
  const prompt = `As an expert instructional designer and AI course creation specialist, analyze this course request and develop a comprehensive learning strategy.

COURSE DETAILS:
- Title: "${requirements.courseTitle}"
- Category: ${requirements.courseCategory} ${requirements.courseSubcategory ? `(${requirements.courseSubcategory})` : ''}
- Intent: ${requirements.courseIntent}
- Overview: "${requirements.courseShortOverview}"
- Target Audience: ${requirements.targetAudience}
- QuestionDifficulty: ${requirements.difficulty}
- Duration: ${requirements.duration}
- Bloom's Focus: ${requirements.bloomsFocus.join(', ')}
- Content Types: ${requirements.preferredContentTypes.join(', ')}

ANALYSIS REQUIRED:
1. Determine the most effective pedagogical approach for this specific course
2. Identify innovative teaching methods that would work best for this audience
3. Design the optimal learning path progression
4. Recommend assessment strategy aligned with learning goals

Return ONLY valid JSON in this format:
{
  "approach": "Brief description of the recommended pedagogical approach (2-3 sentences)",
  "innovations": ["Innovation 1", "Innovation 2", "Innovation 3"],
  "learningPath": "Description of how learning should progress through the course",
  "assessmentStrategy": "Recommended assessment approach and frequency"
}

Focus on evidence-based educational practices and modern learning science principles.`;

  const content = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 1000,
    temperature: 0.6,
    extended: true,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(content);
}

async function generateDetailedCourseStructure(
  requirements: EnhancedContentRequest,
  strategy: { approach: string; innovations: string[]; learningPath: string; assessmentStrategy: string; },
  userId: string
): Promise<{ course: IntelligentCourseBlueprint['course']; chapterOutlines: Array<{ title: string; focus: string; bloomsLevel: string; }> }> {
  const prompt = `Create a detailed course structure based on the requirements and learning strategy.

COURSE REQUIREMENTS:
- Title: "${requirements.courseTitle}"
- Overview: "${requirements.courseShortOverview}"
- Target Audience: ${requirements.targetAudience}
- QuestionDifficulty: ${requirements.difficulty}
- Duration: ${requirements.duration}
- Chapter Count: ${requirements.chapterCount}
- Learning Goals: ${requirements.courseGoals.join(', ')}

LEARNING STRATEGY:
- Pedagogical Approach: ${strategy.approach}
- Learning Path: ${strategy.learningPath}
- Innovations: ${strategy.innovations.join(', ')}

GENERATE:
1. Enhanced course details with compelling description, unique selling points, and career outcomes
2. Chapter outlines that follow optimal learning progression
3. Ensure each chapter builds logically on the previous ones

Return ONLY valid JSON in this format:
{
  "course": {
    "title": "Enhanced course title that's compelling and clear",
    "description": "Comprehensive 250-300 word description that sells the course value",
    "subtitle": "Compelling subtitle that captures the unique value proposition",
    "learningOutcomes": ["Specific, measurable outcome 1", "Outcome 2", "Outcome 3", "Outcome 4", "Outcome 5"],
    "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
    "targetAudience": "Refined and specific target audience description",
    "estimatedDuration": "Realistic total duration estimate",
    "difficulty": "${requirements.difficulty}",
    "uniqueSellingPoints": ["What makes this course special 1", "USP 2", "USP 3"],
    "careerOutcomes": ["Career benefit 1", "Career benefit 2", "Career benefit 3"],
    "industryRelevance": "Why this course matters in today's industry"
  },
  "chapterOutlines": [
    {
      "title": "Chapter title that clearly indicates the focus",
      "focus": "What this chapter specifically teaches",
      "bloomsLevel": "Primary Bloom's level for this chapter"
    }
  ]
}

Make this course irresistible to the target audience while ensuring educational excellence.`;

  const content = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 2000,
    temperature: 0.7,
    extended: true,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(content);
}

async function generateEnhancedChapters(
  requirements: EnhancedContentRequest,
  courseStructure: { course: IntelligentCourseBlueprint['course']; chapterOutlines: Array<{ title: string; focus: string; bloomsLevel: string; }> },
  userId: string
): Promise<EnhancedChapter[]> {
  const chapters: EnhancedChapter[] = [];
  
  for (let i = 0; i < courseStructure.chapterOutlines.length; i++) {
    const chapterOutline = courseStructure.chapterOutlines[i];
    const previousChapters = chapters.map(c => c.title);
    
    const chapterPrompt = `Generate a comprehensive chapter with detailed sections.

COURSE CONTEXT:
- course: "${courseStructure.course.title}"
- Target Audience: ${requirements.targetAudience}
- QuestionDifficulty: ${requirements.difficulty}
- Previous Chapters: ${previousChapters.join(', ') || 'None'}

CHAPTER TO GENERATE:
- Title: "${chapterOutline.title}"
- Focus: ${chapterOutline.focus}
- Primary Bloom's Level: ${chapterOutline.bloomsLevel}
- Sections Needed: ${requirements.sectionsPerChapter}
- Preferred Content Types: ${requirements.preferredContentTypes.join(', ')}

REQUIREMENTS:
1. Create ${requirements.sectionsPerChapter} sections that progressively build knowledge
2. Include practical exercises and real-world applications
3. Provide assessment questions and common pitfalls
4. Ensure content aligns with Bloom's taxonomy progression
5. Include specific, actionable learning objectives

Return ONLY valid JSON in this format:
{
  "title": "Chapter title",
  "description": "2-3 sentence chapter description",
  "learningOutcomes": ["Specific outcome 1", "Outcome 2", "Outcome 3"],
  "bloomsLevel": "${chapterOutline.bloomsLevel}",
  "estimatedDuration": "Realistic duration for this chapter",
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "keySkills": ["Skill 1", "Skill 2", "Skill 3"],
  "realWorldRelevance": "How this chapter applies in real professional scenarios",
  "sections": [
    {
      "title": "Section title",
      "description": "Brief section description",
      "contentType": "Content type from preferred list",
      "bloomsLevel": "Specific Bloom's level",
      "estimatedDuration": "Section duration",
      "learningObjectives": ["Objective 1", "Objective 2"],
      "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "activities": ["Activity 1", "Activity 2"],
      "prerequisites": ["Prerequisite if any"],
      "practicalExercises": ["Exercise 1", "Exercise 2"],
      "assessmentQuestions": ["Question 1", "Question 2"],
      "realWorldExamples": ["Example 1", "Example 2"],
      "commonPitfalls": ["Pitfall 1", "Pitfall 2"],
      "successTips": ["Tip 1", "Tip 2"]
    }
  ],
  "chapterProject": {
    "title": "Optional project title",
    "description": "Project description",
    "deliverables": ["Deliverable 1", "Deliverable 2"],
    "evaluationCriteria": ["Criteria 1", "Criteria 2"]
  },
  "assessments": {
    "formative": ["Formative assessment 1", "Assessment 2"],
    "summative": ["Summative assessment 1", "Assessment 2"]
  }
}

Make each section rich with practical, actionable content that students can immediately apply.`;

    const chapterContent = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      maxTokens: 3000,
      temperature: 0.7,
      extended: true,
      messages: [{ role: "user", content: chapterPrompt }]
    });

    const chapter = JSON.parse(chapterContent) as EnhancedChapter;
    chapters.push(chapter);
  }
  
  return chapters;
}

async function generateCourseLevelProject(
  requirements: EnhancedContentRequest,
  chapters: EnhancedChapter[],
  userId: string
): Promise<IntelligentCourseBlueprint['courseLevelProject'] | undefined> {
  if (!requirements.preferredContentTypes.includes('projects')) {
    return undefined;
  }

  const prompt = `Design a comprehensive course-level project that integrates all learning from the chapters.

COURSE CONTEXT:
- Title: "${requirements.courseTitle}"
- Target Audience: ${requirements.targetAudience}
- QuestionDifficulty: ${requirements.difficulty}
- Intent: ${requirements.courseIntent}

CHAPTERS COVERED:
${chapters.map((c, i) => `${i + 1}. ${c.title}: ${c.description}`).join('\n')}

DESIGN a capstone project that:
1. Integrates knowledge from all chapters
2. Provides portfolio value for students
3. Simulates real-world scenarios
4. Is achievable within the course timeframe
5. Demonstrates mastery of course objectives

Return ONLY valid JSON:
{
  "title": "Compelling project title",
  "description": "Detailed project description (3-4 sentences)",
  "phases": ["Phase 1 description", "Phase 2", "Phase 3", "Phase 4"],
  "timeline": "Realistic timeline for completion",
  "portfolioValue": "How this project enhances student's portfolio and career prospects"
}`;

  const content = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 800,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(content);
}

// Helper functions
function calculateBloomsDistribution(chapters: EnhancedChapter[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  let total = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      distribution[section.bloomsLevel] = (distribution[section.bloomsLevel] || 0) + 1;
      total++;
    });
  });

  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

function calculateContentDistribution(chapters: EnhancedChapter[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  let total = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      distribution[section.contentType] = (distribution[section.contentType] || 0) + 1;
      total++;
    });
  });

  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

function calculateTotalDuration(chapters: EnhancedChapter[]): number {
  let totalMinutes = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      const match = section.estimatedDuration.match(/(\d+)(?:-(\d+))?\s*minutes?/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        totalMinutes += (min + max) / 2;
      } else {
        totalMinutes += 20;
      }
    });
  });

  return Math.round(totalMinutes / 60 * 10) / 10;
}

function analyzeQuestionDifficultyProgression(chapters: EnhancedChapter[]): string {
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const progression = chapters.map(c => bloomsLevels.indexOf(c.bloomsLevel));
  
  if (progression.every((level, i) => i === 0 || level >= progression[i - 1])) {
    return 'Progressive - builds from basic to advanced concepts';
  } else if (progression.every(level => level !== -1)) {
    return 'Mixed - combines different cognitive levels strategically';
  } else {
    return 'Adaptive - adjusts difficulty based on learning objectives';
  }
}