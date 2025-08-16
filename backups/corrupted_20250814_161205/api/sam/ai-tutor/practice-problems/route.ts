import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/wexport const POST = withAuth(async (request, context) => {
  apiKey: process.env.ANTHROPIC_API_KEY!,
}, {
  rateLimit: { requests: 25, window: 60000 },
  auditLog: false
}););

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, count, difficulty, learningStyle, context } = await request.json();

    const systemPrompt = `You are SAM, an expert AI tutor that creates adaptive practice problems. Generate engaging, educational practice problems that match the student's level and learning style.

**Requirements:**
- Topic: ${topic}
- Number of problems: ${count}
- Difficulty: ${difficulty}
- Learning Style: ${learningStyle.type}
- Context: ${JSON.stringify(context)}

**Problem Guidelines:**
- Make problems progressively challenging
- Include real-world applications
- Provide clear problem statements
- For visual learners: Include scenario descriptions
- For kinesthetic learners: Include hands-on elements
- For auditory learners: Include discussion prompts
- For reading/writing learners: Include text analysis

**Response Format:**
Return a JSON array of problems, each with:
- question: The problem statement
- type: multiple-choice, short-answer, essay, practical, etc.
- difficulty: easy, medium, hard
- hints: Array of helpful hints
- solution: The correct answer/approach
- explanation: Why this is the correct answer
- bloomsLevel: Knowledge, Comprehension, Application, Analysis, Synthesis, Evaluation`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.8,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Generate ${count} practice problems about ${topic} at ${difficulty} difficulty level.` }
      ]
    });

    const aiResponse = response.content[0];
    let problemsText = aiResponse.type === 'text' ? aiResponse.text : '';

    // Try to parse as JSON, fallback to structured parsing
    let problems;
    try {
      problems = JSON.parse(problemsText);
    } catch {
      problems = parseProblemsFromText(problemsText, count, difficulty, topic);
    }

    return NextResponse.json({
      problems: Array.isArray(problems) ? problems : [problems],
      topic,
      difficulty,
      adaptedFor: learningStyle.type,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalProblems: Array.isArray(problems) ? problems.length : 1
      }
    });

  } catch (error: any) {
    logger.error('Practice problems generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate practice problems' },
      { status: 500 }
    );
  }
}

function parseProblemsFromText(text: string, count: number, difficulty: string, topic: string): any[] {
  // Fallback parser for when AI doesn't return JSON
  const problems = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  for (let i = 0; i < count; i++) {
    const problemText = lines[i] || `Practice problem ${i + 1} about ${topic}`;
    
    problems.push({
      question: problemText,
      type: 'short-answer',
      difficulty: difficulty,
      hints: [
        "Break the problem into smaller parts",
        "Consider what you know about the topic",
        "Think about similar problems you've solved"
      ],
      solution: "Solution would be provided based on the specific problem",
      explanation: "This problem helps reinforce understanding of key concepts",
      bloomsLevel: difficulty === 'easy' ? 'Knowledge' : 
                   difficulty === 'medium' ? 'Application' : 'Analysis'
    });
  }
  
  return problems;
}

// Helper function to determine Bloom's taxonomy level
function determineBloomsLevel(difficulty: string, problemType: string): string {
  const levels = {
    easy: ['Knowledge', 'Comprehension'],
    medium: ['Application', 'Analysis'],
    hard: ['Synthesis', 'Evaluation']
  };
  
  const possibleLevels = levels[difficulty as keyof typeof levels] || levels.medium;
  return possibleLevels[Math.floor(Math.random() * possibleLevels.length)];
}