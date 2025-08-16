import Anthropic from '@anthropic-ai/sdk';
import { generateIntelligentCourseContent, type EnhancedContentRequest } from './ai-content-generator';
import { logger } from '@/lib/logger';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Course Blueprint Generation Types
export interface CourseGenerationRequest {
  courseTitle: string;
  courseShortOverview: string;
  courseCategory: string;
  courseSubcategory?: string;
  courseIntent: string;
  targetAudience: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  chapterCount: number;
  sectionsPerChapter: number;
  courseGoals: string[];
  includeAssessments: boolean;
  bloomsFocus: string[];
  preferredContentTypes: string[];
}

export interface AIGeneratedBlueprint {
  course: {
    title: string;
    description: string;
    subtitle: string;
    learningOutcomes: string[];
    prerequisites: string[];
    targetAudience: string;
    estimatedDuration: string;
    difficulty: string;
  };
  chapters: {
    title: string;
    description: string;
    learningOutcomes: string[];
    bloomsLevel: string;
    estimatedDuration: string;
    sections: {
      title: string;
      description: string;
      contentType: string;
      bloomsLevel: string;
      estimatedDuration: string;
      learningObjectives: string[];
      keyTopics: string[];
      activities: string[];
    }[];
  }[];
  metadata: {
    aiGenerated: boolean;
    generatedAt: string;
    bloomsDistribution: Record<string, number>;
    contentTypeDistribution: Record<string, number>;
    totalEstimatedHours: number;
  };
}

// Sam AI Personality responses
export const samPersonality = {
  greetings: [
    "Hi there! I'm Sam, your AI Teaching Assistant. Let's create an amazing course together! 🎓",
    "Hello! I'm Sam, and I'm excited to help you build a fantastic learning experience! ✨",
    "Welcome! I'm Sam, your AI course creation partner. Ready to make something incredible? 🚀"
  ],
  
  encouragement: [
    "That's a fantastic course idea! Let me help you structure it perfectly.",
    "I love the direction you're taking! This is going to be a great course.",
    "Excellent choice! Your students are going to learn so much from this.",
    "Perfect! I can already see this becoming a highly engaging course."
  ],
  
  suggestions: [
    "Based on your target audience, I recommend focusing on practical applications.",
    "For this difficulty level, we should include more hands-on exercises.",
    "Your course intent suggests we need a good balance of theory and practice.",
    "Given your category, students typically respond well to project-based learning."
  ],
  
  validation: [
    "Great! Your course structure looks well-balanced and engaging.",
    "Perfect! This learning progression follows educational best practices.",
    "Excellent! Your Bloom's taxonomy distribution will promote deep learning.",
    "Wonderful! This course design optimizes for student success."
  ]
};

// Generate course blueprint using Anthropic Claude
export async function generateCourseBlueprint(
  requirements: CourseGenerationRequest
): Promise<AIGeneratedBlueprint> {
  try {
    // First, try the enhanced intelligent generation
    const enhancedRequirements: EnhancedContentRequest = {
      ...requirements,
      // Infer learning methodology from course intent
      learningMethodology: inferLearningMethodology(requirements),
      // Enhance with industry context
      industryContext: extractIndustryContext(requirements),
      // Determine assessment style from preferences
      assessmentStyle: (requirements.includeAssessments ? 'mixed' : 'milestone') as EnhancedContentRequest['assessmentStyle']
    };

    try {

      const intelligentBlueprint = await generateIntelligentCourseContent(enhancedRequirements);
      
      // Transform to the expected format
      const transformedBlueprint: AIGeneratedBlueprint = {
        course: {
          title: intelligentBlueprint.course.title,
          description: intelligentBlueprint.course.description,
          subtitle: intelligentBlueprint.course.subtitle,
          learningOutcomes: intelligentBlueprint.course.learningOutcomes,
          prerequisites: intelligentBlueprint.course.prerequisites,
          targetAudience: intelligentBlueprint.course.targetAudience,
          estimatedDuration: intelligentBlueprint.course.estimatedDuration,
          difficulty: intelligentBlueprint.course.difficulty
        },
        chapters: intelligentBlueprint.chapters.map(chapter => ({
          title: chapter.title,
          description: chapter.description,
          learningOutcomes: chapter.learningOutcomes,
          bloomsLevel: chapter.bloomsLevel,
          estimatedDuration: chapter.estimatedDuration,
          sections: chapter.sections.map(section => ({
            title: section.title,
            description: section.description,
            contentType: section.contentType,
            bloomsLevel: section.bloomsLevel,
            estimatedDuration: section.estimatedDuration,
            learningObjectives: section.learningObjectives,
            keyTopics: section.keyTopics,
            activities: section.activities
          }))
        })),
        metadata: intelligentBlueprint.metadata
      };

      return transformedBlueprint;
      
    } catch (enhancedError) {
      logger.warn('[BLUEPRINT] Enhanced generation failed, falling back to standard generation:', enhancedError);
      
      // Fallback to the original generation method
      const prompt = createCourseGenerationPrompt(requirements);
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic API');
      }

      // Parse the JSON response
      const blueprint = JSON.parse(content.text) as AIGeneratedBlueprint;
      
      // Add metadata
      blueprint.metadata = {
        ...blueprint.metadata,
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        bloomsDistribution: calculateBloomsDistribution(blueprint.chapters),
        contentTypeDistribution: calculateContentDistribution(blueprint.chapters),
        totalEstimatedHours: calculateTotalDuration(blueprint.chapters)
      };

      return blueprint;
    }
    
  } catch (error: any) {
    logger.error('Error generating course blueprint:', error);
    throw new Error(`Failed to generate course blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate contextual suggestions for Sam's personality
export async function generateSamSuggestion(
  context: string,
  userInput: Partial<CourseGenerationRequest>
): Promise<string> {
  try {
    const prompt = `You are Sam, an enthusiastic and helpful AI Teaching Assistant. You're helping an instructor create a course.

Context: ${context}
Current user input: ${JSON.stringify(userInput, null, 2)}

Provide a brief, encouraging, and helpful suggestion (1-2 sentences) that:
1. Acknowledges what they've shared
2. Offers specific, actionable advice
3. Shows enthusiasm for their course idea
4. Uses a friendly, supportive tone

Keep it concise and focused on helping them improve their course design.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 150,
      temperature: 0.8,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    return content.text.trim();
    
  } catch (error: any) {
    logger.error('Error generating Sam suggestion:', error);
    // Fallback to pre-defined responses
    return samPersonality.suggestions[Math.floor(Math.random() * samPersonality.suggestions.length)];
  }
}

// Create the detailed prompt for course generation
function createCourseGenerationPrompt(requirements: CourseGenerationRequest): string {
  return `You are Sam, an expert AI Teaching Assistant and course design specialist. Create a comprehensive course blueprint based on the following requirements.

COURSE REQUIREMENTS:
- Title: "${requirements.courseTitle}"
- Category: ${requirements.courseCategory} ${requirements.courseSubcategory ? `(${requirements.courseSubcategory})` : ''}
- Intent: ${requirements.courseIntent}
- Short Overview: "${requirements.courseShortOverview}"
- Target Audience: ${requirements.targetAudience}
- QuestionDifficulty: ${requirements.difficulty}
- Duration: ${requirements.duration}
- Chapters: ${requirements.chapterCount}
- Sections per Chapter: ${requirements.sectionsPerChapter}
- Learning Goals: ${requirements.courseGoals.join(', ')}
- Bloom's Focus: ${requirements.bloomsFocus.join(', ')}
- Preferred Content Types: ${requirements.preferredContentTypes.join(', ')}
- Include Assessments: ${requirements.includeAssessments}

INSTRUCTIONS:
1. Generate a comprehensive course description (200-300 words) that expands on the short overview
2. Create an engaging subtitle that captures the course value proposition
3. Develop ${requirements.chapterCount} chapters, each with ${requirements.sectionsPerChapter} sections
4. Ensure Bloom's taxonomy progression: start with lower-order thinking skills and progress to higher-order
5. Distribute content types intelligently based on learning objectives
6. Create realistic time estimates for each section (15-45 minutes typical)
7. Align all content with the specified difficulty level and target audience
8. Include practical, actionable learning outcomes
9. Ensure logical prerequisite flow between chapters

BLOOM'S TAXONOMY LEVELS (use these exact terms):
- REMEMBER: Recall facts and basic concepts
- UNDERSTAND: Explain ideas and concepts  
- APPLY: Use information in new situations
- ANALYZE: Draw connections among ideas
- EVALUATE: Justify decisions and actions
- CREATE: Produce new or original work

CONTENT TYPES (map to these exact terms):
- Video Lecture: For explanations and demonstrations
- Reading Material: For theoretical foundations
- Interactive Exercise: For hands-on practice
- Quiz/Assessment: For knowledge checking
- Hands-on Project: For practical application
- Discussion Activity: For peer learning

Return ONLY valid JSON in this exact format:

{
  "course": {
    "title": "Enhanced version of the course title",
    "description": "Comprehensive 200-300 word course description",
    "subtitle": "Engaging subtitle that shows value",
    "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
    "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
    "targetAudience": "Refined target audience description",
    "estimatedDuration": "Total course duration estimate",
    "difficulty": "${requirements.difficulty}"
  },
  "chapters": [
    {
      "title": "Chapter title focusing on specific topic",
      "description": "2-3 sentence chapter description",
      "learningOutcomes": ["Chapter outcome 1", "Chapter outcome 2"],
      "bloomsLevel": "PRIMARY_BLOOM_LEVEL",
      "estimatedDuration": "Chapter duration estimate",
      "sections": [
        {
          "title": "Section title",
          "description": "1-2 sentence section description",
          "contentType": "Video Lecture",
          "bloomsLevel": "REMEMBER",
          "estimatedDuration": "15-20 minutes",
          "learningObjectives": ["Objective 1", "Objective 2"],
          "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
          "activities": ["Activity description 1", "Activity description 2"]
        }
      ]
    }
  ]
}

Ensure the JSON is properly formatted and complete. Focus on creating an educationally sound, engaging, and practical course structure.`;
}

// Helper functions
function calculateBloomsDistribution(chapters: AIGeneratedBlueprint['chapters']): Record<string, number> {
  const distribution: Record<string, number> = {};
  let total = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      distribution[section.bloomsLevel] = (distribution[section.bloomsLevel] || 0) + 1;
      total++;
    });
  });

  // Convert to percentages
  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

function calculateContentDistribution(chapters: AIGeneratedBlueprint['chapters']): Record<string, number> {
  const distribution: Record<string, number> = {};
  let total = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      distribution[section.contentType] = (distribution[section.contentType] || 0) + 1;
      total++;
    });
  });

  // Convert to percentages
  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

function calculateTotalDuration(chapters: AIGeneratedBlueprint['chapters']): number {
  let totalMinutes = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      // Extract minutes from duration string (e.g., "15-20 minutes" -> 17.5)
      const match = section.estimatedDuration.match(/(\d+)(?:-(\d+))?\s*minutes?/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        totalMinutes += (min + max) / 2;
      } else {
        // Default to 20 minutes if parsing fails
        totalMinutes += 20;
      }
    });
  });

  return Math.round(totalMinutes / 60 * 10) / 10; // Convert to hours with 1 decimal place
}

// Helper functions for enhanced generation
function inferLearningMethodology(requirements: CourseGenerationRequest): EnhancedContentRequest['learningMethodology'] {
  const intent = requirements.courseIntent.toLowerCase();
  const category = requirements.courseCategory.toLowerCase();
  
  if (intent.includes('project') || category === 'technology') {
    return 'project-based';
  } else if (intent.includes('certification') || intent.includes('academic')) {
    return 'theory-first';
  } else if (intent.includes('skill') || intent.includes('practical')) {
    return 'practical-first';
  } else {
    return 'mixed';
  }
}

function extractIndustryContext(requirements: CourseGenerationRequest): string {
  const category = requirements.courseCategory;
  const subcategory = requirements.courseSubcategory;
  const title = requirements.courseTitle.toLowerCase();
  
  // Enhanced industry context based on course details
  const industryMap: Record<string, string> = {
    'technology': 'Fast-paced tech industry with emphasis on practical skills and continuous learning',
    'business': 'Corporate business environment focusing on ROI and practical applications',
    'creative': 'Creative industry emphasizing portfolio development and artistic growth',
    'personal': 'Personal development sector focusing on life improvement and skill building',
    'health': 'Healthcare and wellness industry with emphasis on evidence-based practices',
    'education': 'Educational sector focusing on pedagogy and student success'
  };
  
  let context = industryMap[category] || 'Professional development context';
  
  if (subcategory) {
    context += ` with specific focus on ${subcategory.toLowerCase()}`;
  }
  
  // Add context based on course title keywords
  if (title.includes('advanced') || title.includes('expert')) {
    context += ', targeting senior professionals and experts';
  } else if (title.includes('beginner') || title.includes('intro')) {
    context += ', designed for newcomers and career changers';
  }
  
  return context;
}

export default anthropic;