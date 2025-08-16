import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';


export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();

    // Simple emotion detection based on keywords and patterns
    const emotion = detectEmotionFromText(text);
    const confidence = calculateConfidence(text, emotion);

    return NextResponse.json({
      emotion,
      confidence,
      indicators: getEmotionalIndicators(text, emotion),
      suggestions: getSuggestedResponses(emotion)
    });

  } catch (error: any) {
    logger.error('Emotion detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect emotion' },
      { status: 500 }
    );
  }
}

function detectEmotionFromText(text: string): 'frustrated' | 'confused' | 'confident' | 'bored' | 'engaged' {
  const lowerText = text.toLowerCase();
  
  // Frustration indicators
  const frustrationWords = ['difficult', 'hard', 'stuck', 'frustrated', 'annoying', 'hate', 'can\'t', 'impossible', 'give up'];
  const frustrationCount = frustrationWords.filter(word => lowerText.includes(word)).length;
  
  // Confusion indicators
  const confusionWords = ['confused', 'don\'t understand', 'unclear', 'what does', 'how do', 'why does', 'explain', 'help'];
  const confusionCount = confusionWords.filter(word => lowerText.includes(word)).length;
  
  // Confidence indicators
  const confidenceWords = ['easy', 'got it', 'understand', 'clear', 'make sense', 'obvious', 'simple', 'know'];
  const confidenceCount = confidenceWords.filter(word => lowerText.includes(word)).length;
  
  // Boredom indicators
  const boredomWords = ['boring', 'tired', 'slow', 'already know', 'repetitive', 'same thing'];
  const boredomCount = boredomWords.filter(word => lowerText.includes(word)).length;
  
  // Engagement indicators
  const engagementWords = ['interesting', 'cool', 'wow', 'awesome', 'love', 'amazing', 'more', 'tell me'];
  const engagementCount = engagementWords.filter(word => lowerText.includes(word)).length;
  
  // Determine dominant emotion
  const scores = {
    frustrated: frustrationCount,
    confused: confusionCount,
    confident: confidenceCount,
    bored: boredomCount,
    engaged: engagementCount
  };
  
  const maxScore = Math.max(...Object.values(scores));
  const dominantEmotion = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
  
  // If no clear indicators, default to engaged
  return (dominantEmotion as any) || 'engaged';
}

function calculateConfidence(text: string, emotion: string): number {
  // Simple confidence calculation based on text length and keyword density
  const wordCount = text.split(' ').length;
  const emotionKeywords = getEmotionKeywords(emotion);
  const keywordCount = emotionKeywords.filter(word => text.toLowerCase().includes(word)).length;
  
  // Base confidence on keyword density and text length
  const keywordDensity = keywordCount / wordCount;
  const lengthFactor = Math.min(wordCount / 10, 1); // Longer text = higher confidence
  
  return Math.min(keywordDensity * lengthFactor * 2, 1);
}

function getEmotionKeywords(emotion: string): string[] {
  const keywords: Record<string, string[]> = {
    frustrated: ['difficult', 'hard', 'stuck', 'frustrated', 'annoying', 'hate', 'can\'t', 'impossible'],
    confused: ['confused', 'don\'t understand', 'unclear', 'what does', 'how do', 'why does', 'explain'],
    confident: ['easy', 'got it', 'understand', 'clear', 'make sense', 'obvious', 'simple', 'know'],
    bored: ['boring', 'tired', 'slow', 'already know', 'repetitive', 'same thing'],
    engaged: ['interesting', 'cool', 'wow', 'awesome', 'love', 'amazing', 'more', 'tell me']
  };
  
  return keywords[emotion] || [];
}

function getEmotionalIndicators(text: string, emotion: string): string[] {
  const keywords = getEmotionKeywords(emotion);
  const lowerText = text.toLowerCase();
  
  return keywords.filter(keyword => lowerText.includes(keyword));
}

function getSuggestedResponses(emotion: string): string[] {
  const responses: Record<string, string[]> = {
    frustrated: [
      "Take a break and come back to this",
      "Let's try a different approach",
      "Break this down into smaller steps"
    ],
    confused: [
      "Ask for clarification",
      "Look at examples",
      "Review the fundamentals"
    ],
    confident: [
      "Try a more challenging problem",
      "Teach someone else",
      "Apply to a real scenario"
    ],
    bored: [
      "Explore advanced topics",
      "Find real-world applications",
      "Try a different learning format"
    ],
    engaged: [
      "Continue with the current approach",
      "Ask deeper questions",
      "Explore related topics"
    ]
  };
  
  return responses[emotion] || responses.engaged;
}