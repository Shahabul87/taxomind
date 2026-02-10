import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

interface InteractionPatterns {
  scrollSpeed: number;
  pauseDuration: number;
  clickFrequency: number;
  backtrackCount: number;
  timeOnSection: number;
  videoSeekCount: number;
  notesTaken: boolean;
}

interface DetectEmotionBody {
  text?: string;
  interactionPatterns?: InteractionPatterns;
  sessionDuration?: number;
  userId?: string;
  courseId?: string;
  sectionId?: string;
  recentInteractions?: Array<{ type: string; timestamp: number }>;
}

type EmotionResult = 'frustrated' | 'confused' | 'confident' | 'bored' | 'engaged' | 'focused' | 'neutral' | 'overwhelmed';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DetectEmotionBody = await request.json();

    let emotion: EmotionResult;
    let confidence: number;
    let recommendation: string | undefined;
    let suggestedAction: { type: string; message: string; priority: string } | undefined;

    if (body.text) {
      // Text-based detection (e.g. from chat messages)
      emotion = detectEmotionFromText(body.text);
      confidence = calculateTextConfidence(body.text, emotion);
    } else if (body.interactionPatterns) {
      // Pattern-based detection (from the useEmotionDetection hook)
      const result = detectEmotionFromPatterns(body.interactionPatterns, body.sessionDuration ?? 0);
      emotion = result.emotion;
      confidence = result.confidence;
    } else {
      // No data provided — default to neutral
      emotion = 'neutral';
      confidence = 0.3;
    }

    recommendation = getRecommendation(emotion);
    suggestedAction = getSuggestedAction(emotion);

    return NextResponse.json({
      success: true,
      data: {
        emotion,
        confidence,
        recommendation,
        suggestedAction,
      },
    });
  } catch (error) {
    logger.error('Emotion detection error:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          emotion: 'neutral',
          confidence: 0.3,
          recommendation: undefined,
          suggestedAction: undefined,
        },
      },
      { status: 200 }
    );
  }
}

// --- Pattern-based detection (interaction behavior) ---

function detectEmotionFromPatterns(
  patterns: InteractionPatterns,
  sessionDuration: number
): { emotion: EmotionResult; confidence: number } {
  const { scrollSpeed, pauseDuration, clickFrequency, backtrackCount, timeOnSection, videoSeekCount, notesTaken } = patterns;

  const sessionMinutes = sessionDuration / 60_000;

  // Frustrated: lots of backtracking, high click frequency, long time on section
  if (backtrackCount > 5 && clickFrequency > 0.5 && sessionMinutes > 3) {
    return { emotion: 'frustrated', confidence: Math.min(0.5 + backtrackCount * 0.05, 0.9) };
  }

  // Confused: frequent backtracking, moderate pause, video seeks
  if (backtrackCount > 3 || videoSeekCount > 3) {
    return { emotion: 'confused', confidence: Math.min(0.4 + (backtrackCount + videoSeekCount) * 0.05, 0.85) };
  }

  // Overwhelmed: very long pause + long session
  if (pauseDuration > 120_000 && sessionMinutes > 5) {
    return { emotion: 'overwhelmed', confidence: 0.6 };
  }

  // Bored: very fast scrolling, low click frequency, no notes
  if (scrollSpeed > 500 && clickFrequency < 0.1 && !notesTaken) {
    return { emotion: 'bored', confidence: 0.55 };
  }

  // Focused: moderate scroll, notes taken, reasonable time
  if (notesTaken && scrollSpeed < 200 && sessionMinutes > 1) {
    return { emotion: 'focused', confidence: 0.65 };
  }

  // Engaged: moderate activity, some clicks
  if (clickFrequency > 0.1 && clickFrequency < 0.5 && scrollSpeed < 300) {
    return { emotion: 'engaged', confidence: 0.5 };
  }

  // Default: neutral
  return { emotion: 'neutral', confidence: 0.4 };
}

// --- Text-based detection (chat/input analysis) ---

function detectEmotionFromText(text: string): EmotionResult {
  const lowerText = text.toLowerCase();

  const scores: Record<EmotionResult, number> = {
    frustrated: countMatches(lowerText, ['difficult', 'hard', 'stuck', 'frustrated', 'annoying', 'hate', "can't", 'impossible', 'give up']),
    confused: countMatches(lowerText, ['confused', "don't understand", 'unclear', 'what does', 'how do', 'why does', 'explain', 'help']),
    confident: countMatches(lowerText, ['easy', 'got it', 'understand', 'clear', 'make sense', 'obvious', 'simple', 'know']),
    bored: countMatches(lowerText, ['boring', 'tired', 'slow', 'already know', 'repetitive', 'same thing']),
    engaged: countMatches(lowerText, ['interesting', 'cool', 'wow', 'awesome', 'love', 'amazing', 'more', 'tell me']),
    focused: 0,
    neutral: 0,
    overwhelmed: countMatches(lowerText, ['too much', 'overwhelmed', 'lost', "can't keep up", 'information overload']),
  };

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'engaged';

  const dominant = Object.entries(scores).find(([, score]) => score === maxScore);
  return (dominant?.[0] as EmotionResult) ?? 'engaged';
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.filter((word) => text.includes(word)).length;
}

function calculateTextConfidence(text: string, emotion: string): number {
  const wordCount = text.split(' ').length;
  const keywords = getEmotionKeywords(emotion);
  const keywordCount = keywords.filter((word) => text.toLowerCase().includes(word)).length;

  const keywordDensity = wordCount > 0 ? keywordCount / wordCount : 0;
  const lengthFactor = Math.min(wordCount / 10, 1);

  return Math.min(keywordDensity * lengthFactor * 2, 1);
}

function getEmotionKeywords(emotion: string): string[] {
  const keywords: Record<string, string[]> = {
    frustrated: ['difficult', 'hard', 'stuck', 'frustrated', 'annoying', 'hate', "can't", 'impossible'],
    confused: ['confused', "don't understand", 'unclear', 'what does', 'how do', 'why does', 'explain'],
    confident: ['easy', 'got it', 'understand', 'clear', 'make sense', 'obvious', 'simple', 'know'],
    bored: ['boring', 'tired', 'slow', 'already know', 'repetitive', 'same thing'],
    engaged: ['interesting', 'cool', 'wow', 'awesome', 'love', 'amazing', 'more', 'tell me'],
    overwhelmed: ['too much', 'overwhelmed', 'lost', "can't keep up", 'information overload'],
  };
  return keywords[emotion] ?? [];
}

// --- Recommendations ---

function getRecommendation(emotion: EmotionResult): string {
  const recommendations: Record<string, string> = {
    frustrated: "It looks like you might be finding this challenging. Try breaking it into smaller steps or take a short break.",
    confused: "This topic can be tricky. Try reviewing the examples or asking SAM for a different explanation.",
    overwhelmed: "There is a lot to take in. Consider focusing on one concept at a time or taking a break.",
    bored: "Ready for more of a challenge? Try the practice problems or move to the next section.",
    engaged: "Great focus! Keep up the excellent work.",
    excited: "Your enthusiasm is awesome! Ready to dive deeper?",
    focused: "You are in the zone! Perfect time for complex topics.",
    confident: "You seem to have a good grasp. Try applying what you learned!",
    neutral: "How can I help you learn better?",
  };
  return recommendations[emotion] ?? recommendations.neutral;
}

function getSuggestedAction(emotion: EmotionResult): { type: string; message: string; priority: string } {
  const actions: Record<string, { type: string; message: string; priority: string }> = {
    frustrated: { type: 'show_help', message: 'Would you like hints or a different explanation?', priority: 'high' },
    confused: { type: 'simplify_content', message: 'Let me break this down for you.', priority: 'high' },
    overwhelmed: { type: 'take_break', message: 'Consider taking a 5-minute break.', priority: 'medium' },
    bored: { type: 'suggest_exercise', message: 'Try a practice exercise to stay engaged.', priority: 'medium' },
    engaged: { type: 'none', message: 'Keep going!', priority: 'low' },
    focused: { type: 'none', message: 'You are doing great.', priority: 'low' },
    confident: { type: 'suggest_exercise', message: 'Challenge yourself with advanced problems.', priority: 'low' },
    neutral: { type: 'offer_encouragement', message: 'You are making progress!', priority: 'low' },
  };
  return actions[emotion] ?? actions.neutral;
}
