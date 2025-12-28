import { NextRequest, NextResponse } from 'next/server';
import { createAnthropicAdapter } from '@sam-ai/core';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  validateContent,
  type GeneratedContent,
  type DifficultyLevel,
} from '@sam-ai/quality';

let aiAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;

function getAIAdapter() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  if (!aiAdapter) {
    aiAdapter = createAnthropicAdapter({
      apiKey,
      model: 'claude-sonnet-4-5-20250929',
      timeout: 60000,
      maxRetries: 2,
    });
  }
  return aiAdapter;
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
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

    const response = await getAIAdapter().chat({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 2000,
      temperature: 0.8,
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} practice problems about ${topic} at ${difficulty} difficulty level.`,
        },
      ],
    });

    let problemsText = response.content ?? '';

    // Try to parse as JSON, fallback to structured parsing
    let problems;
    try {
      problems = JSON.parse(problemsText);
    } catch {
      problems = parseProblemsFromText(problemsText, count, difficulty, topic);
    }

    // Validate content quality using quality gates
    const problemsArray = Array.isArray(problems) ? problems : [problems];
    const contentToValidate: GeneratedContent = {
      content: JSON.stringify(problemsArray, null, 2),
      type: 'exercise',
      targetDifficulty: mapDifficultyLevel(difficulty),
      context: {
        topic,
        studentLevel: mapDifficultyLevel(difficulty),
      },
      generationMetadata: {
        model: 'claude-sonnet-4-5-20250929',
        timestamp: new Date().toISOString(),
      },
    };

    const validationResult = await validateContent(contentToValidate, {
      threshold: 70,
      parallel: true,
      enableEnhancement: false, // Don't auto-enhance, just report
    });

    // Log validation results
    if (!validationResult.passed) {
      logger.warn('[PracticeProblems] Quality validation issues detected', {
        score: validationResult.overallScore,
        failedGates: validationResult.failedGates,
        suggestions: validationResult.allSuggestions.slice(0, 3),
      });
    }

    return NextResponse.json({
      problems: problemsArray,
      topic,
      difficulty,
      adaptedFor: learningStyle.type,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalProblems: problemsArray.length,
      },
      qualityValidation: {
        passed: validationResult.passed,
        score: validationResult.overallScore,
        suggestions: validationResult.allSuggestions.slice(0, 5),
        gateResults: validationResult.gateResults.map((g) => ({
          gate: g.gateName,
          passed: g.passed,
          score: g.score,
        })),
      },
    });

  } catch (error) {
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

// Helper function to map difficulty string to DifficultyLevel type
function mapDifficultyLevel(difficulty: string): DifficultyLevel {
  const mapping: Record<string, DifficultyLevel> = {
    easy: 'beginner',
    medium: 'intermediate',
    hard: 'advanced',
    expert: 'expert',
  };
  return mapping[difficulty.toLowerCase()] ?? 'intermediate';
}
