import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, studentAnswer, context, personality } = await request.json();

    const systemPrompt = `You are SAM, an expert AI tutor skilled in the Socratic method. Your goal is to guide students to understanding through thoughtful questioning rather than direct answers.

**Socratic Method Guidelines:**
- Ask open-ended questions that encourage critical thinking
- Build on the student's existing knowledge
- Guide them to discover answers themselves
- Use leading questions to address misconceptions
- Encourage deeper analysis and reflection
- Be patient and encouraging

**Current Context:**
- Topic: ${topic}
- Student's Answer: ${studentAnswer}
- Learning Context: ${JSON.stringify(context)}
- Personality: ${personality.tone} tone, ${personality.teachingMethod} method

Generate a thoughtful Socratic question that will help the student think more deeply about this topic.`;

    const question = await withRetryableTimeout(
      () => runSAMChatWithPreference({
        userId: user.id,
        capability: 'chat',
        maxTokens: 500,
        temperature: 0.7,
        systemPrompt,
        messages: [
          { role: 'user', content: `Please provide a Socratic question about ${topic} based on the student's answer: "${studentAnswer}"` }
        ],
      }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'socratic-generateQuestion'
    );

    return NextResponse.json({
      question: question.trim(),
      method: 'socratic',
      followUp: generateFollowUpQuestions(topic, studentAnswer)
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Socratic method timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Socratic method error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Socratic question' },
      { status: 500 }
    );
  }
}

function generateFollowUpQuestions(topic: string, studentAnswer: string): string[] {
  // Generate contextual follow-up questions
  return [
    "What evidence supports your reasoning?",
    "How might this apply to other situations?",
    "What assumptions are you making?",
    "Can you think of a counterexample?"
  ];
}
