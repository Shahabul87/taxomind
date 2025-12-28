import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runSAMChat } from '@/lib/sam/ai-provider';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, format, learningStyle, context, personality } = await request.json();

    const systemPrompt = buildAdaptiveContentPrompt(format, learningStyle, personality, context);

    const content = await runSAMChat({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1500,
      temperature: 0.7,
      systemPrompt,
      messages: [
        { role: 'user', content: `Create ${format} content about: ${topic}` }
      ],
    });

    return NextResponse.json({
      content: content.trim(),
      format,
      adaptedFor: learningStyle.type,
      metadata: {
        complexity: determineComplexity(content),
        estimatedReadingTime: Math.ceil(content.split(' ').length / 200),
        keyTopics: extractKeyTopics(content, topic)
      }
    });

  } catch (error) {
    logger.error('Adaptive content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate adaptive content' },
      { status: 500 }
    );
  }
}

function buildAdaptiveContentPrompt(
  format: string,
  learningStyle: any,
  personality: any,
  context: any
): string {
  const basePrompt = `You are SAM, an expert AI tutor that creates personalized educational content. Adapt your content to the student's learning style and context.

**Learning Style Adaptation:**
- Type: ${learningStyle.type}
- Content Preferences: ${learningStyle.preferences.contentFormat.join(', ')}
- Pace: ${learningStyle.preferences.pacePreference}
- Practice Frequency: ${learningStyle.preferences.practiceFrequency}

**Personality Settings:**
- Tone: ${personality.tone}
- Teaching Method: ${personality.teachingMethod}
- Response Style: ${personality.responseStyle}

**Context:**
- User Role: ${context.userRole || 'student'}
- Current Course: ${context.currentCourse?.title || 'General'}
- Current Chapter: ${context.currentChapter?.title || 'General'}`;

  switch (format) {
    case 'explanation':
      return `${basePrompt}

**Task:** Create a clear, engaging explanation that:
- Breaks down complex concepts into digestible parts
- Uses analogies and examples appropriate to the learning style
- Includes visual descriptions if the learner is visual
- Uses step-by-step progression for kinesthetic learners
- Incorporates storytelling for auditory learners
- Provides detailed text for reading/writing learners`;

    case 'example':
      return `${basePrompt}

**Task:** Create practical examples that:
- Show real-world applications
- Demonstrate the concept in action
- Use concrete scenarios the student can relate to
- Include step-by-step breakdowns
- Connect to the student's interests and context`;

    case 'practice':
      return `${basePrompt}

**Task:** Create practice exercises that:
- Match the student's current skill level
- Progress from simple to complex
- Include multiple question types
- Provide immediate feedback opportunities
- Connect to real-world scenarios`;

    default:
      return basePrompt;
  }
}

function determineComplexity(content: string): 'beginner' | 'intermediate' | 'advanced' {
  const complexWords = content.split(' ').filter(word => word.length > 8).length;
  const totalWords = content.split(' ').length;
  const ratio = complexWords / totalWords;
  
  if (ratio < 0.1) return 'beginner';
  if (ratio < 0.2) return 'intermediate';
  return 'advanced';
}

function extractKeyTopics(content: string, originalTopic: string): string[] {
  // Simple keyword extraction - in production, use more sophisticated NLP
  const words = content.toLowerCase().split(/\W+/);
  const keyWords = words.filter(word => 
    word.length > 4 && 
    !['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'their'].includes(word)
  );
  
  const wordFreq = keyWords.reduce((acc: any, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([word]) => word);
}
