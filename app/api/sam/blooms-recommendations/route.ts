import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, overview, category, subcategory, targetAudience, difficulty, intent, currentSelections } = await request.json();

    if (!title || !overview || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate Bloom's taxonomy recommendations
    const recommendations = await generateBloomsRecommendations({
      title,
      overview,
      category,
      subcategory,
      targetAudience,
      difficulty,
      intent,
      currentSelections
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    logger.error('Error generating Bloom\'s recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate Bloom\'s recommendations' }, { status: 500 });
  }
}

async function generateBloomsRecommendations(courseData: any) {
  const { category, difficulty, intent, targetAudience, currentSelections } = courseData;
  
  const baseRecommendations = getBaseRecommendationsForDifficulty(difficulty);
  const categoryAdjustments = getCategoryAdjustments(category);
  const intentAdjustments = getIntentAdjustments(intent);
  
  // Combine recommendations
  const recommendations = {
    primary: [...baseRecommendations.primary],
    secondary: [...baseRecommendations.secondary],
    reasoning: generateReasoningText(difficulty, category, intent, targetAudience),
    progressionPath: generateProgressionPath(difficulty),
    warnings: generateWarnings(currentSelections, difficulty)
  };

  // Apply category adjustments
  if (categoryAdjustments.emphasize) {
    recommendations.primary = Array.from(new Set([...recommendations.primary, ...categoryAdjustments.emphasize]));
  }
  if (categoryAdjustments.secondary) {
    recommendations.secondary = Array.from(new Set([...recommendations.secondary, ...categoryAdjustments.secondary]));
  }

  // Apply intent adjustments
  if (intentAdjustments.emphasize) {
    recommendations.primary = Array.from(new Set([...recommendations.primary, ...intentAdjustments.emphasize]));
  }

  return {
    recommendations: recommendations.primary.slice(0, 3), // Top 3 recommendations
    alternatives: recommendations.secondary.slice(0, 2), // Top 2 alternatives
    reasoning: recommendations.reasoning,
    progressionPath: recommendations.progressionPath,
    warnings: recommendations.warnings
  };
}

function getBaseRecommendationsForDifficulty(difficulty: string) {
  const difficultyMappings = {
    BEGINNER: {
      primary: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
      secondary: ['ANALYZE']
    },
    INTERMEDIATE: {
      primary: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
      secondary: ['EVALUATE', 'CREATE']
    },
    ADVANCED: {
      primary: ['ANALYZE', 'EVALUATE', 'CREATE'],
      secondary: ['APPLY', 'UNDERSTAND']
    }
  };

  return difficultyMappings[difficulty as keyof typeof difficultyMappings] || difficultyMappings.BEGINNER;
}

function getCategoryAdjustments(category: string) {
  const categoryMappings = {
    programming: {
      emphasize: ['APPLY', 'CREATE'],
      secondary: ['ANALYZE', 'EVALUATE']
    },
    business: {
      emphasize: ['ANALYZE', 'EVALUATE'],
      secondary: ['APPLY', 'CREATE']
    },
    design: {
      emphasize: ['CREATE', 'EVALUATE'],
      secondary: ['APPLY', 'ANALYZE']
    },
    marketing: {
      emphasize: ['ANALYZE', 'EVALUATE'],
      secondary: ['APPLY', 'CREATE']
    },
    data_science: {
      emphasize: ['ANALYZE', 'EVALUATE'],
      secondary: ['APPLY', 'CREATE']
    },
    personal_development: {
      emphasize: ['UNDERSTAND', 'APPLY'],
      secondary: ['ANALYZE', 'EVALUATE']
    },
    language: {
      emphasize: ['UNDERSTAND', 'APPLY'],
      secondary: ['ANALYZE', 'CREATE']
    },
    technology: {
      emphasize: ['UNDERSTAND', 'APPLY'],
      secondary: ['ANALYZE', 'EVALUATE']
    },
    health: {
      emphasize: ['UNDERSTAND', 'APPLY'],
      secondary: ['ANALYZE', 'EVALUATE']
    },
    finance: {
      emphasize: ['UNDERSTAND', 'ANALYZE'],
      secondary: ['APPLY', 'EVALUATE']
    }
  };

  return categoryMappings[category as keyof typeof categoryMappings] || { emphasize: [], secondary: [] };
}

function getIntentAdjustments(intent: string) {
  const intentMappings = {
    'Skill Building': {
      emphasize: ['APPLY', 'CREATE']
    },
    'Certification Prep': {
      emphasize: ['REMEMBER', 'UNDERSTAND', 'APPLY']
    },
    'Career Advancement': {
      emphasize: ['APPLY', 'ANALYZE', 'EVALUATE']
    },
    'Academic Study': {
      emphasize: ['UNDERSTAND', 'ANALYZE', 'EVALUATE']
    },
    'Personal Interest': {
      emphasize: ['UNDERSTAND', 'APPLY']
    },
    'Professional Development': {
      emphasize: ['APPLY', 'ANALYZE', 'EVALUATE']
    }
  };

  return intentMappings[intent as keyof typeof intentMappings] || { emphasize: [] };
}

function generateReasoningText(difficulty: string, category: string, intent: string, targetAudience: string) {
  const difficultyExplanation = {
    BEGINNER: 'focus on foundational understanding and basic application',
    INTERMEDIATE: 'emphasize practical application and analytical thinking',
    ADVANCED: 'prioritize critical evaluation and creative problem-solving'
  };

  const categoryExplanation = {
    programming: 'Technical subjects benefit from hands-on practice and creative implementation',
    business: 'Business education requires analytical thinking and strategic evaluation',
    design: 'Creative fields emphasize original creation and aesthetic evaluation',
    marketing: 'Marketing requires analysis of markets and evaluation of strategies',
    data_science: 'Data science demands analytical skills and evidence-based evaluation'
  };

  const baseReasoning = `For ${difficulty.toLowerCase()} level learners, I recommend you ${difficultyExplanation[difficulty as keyof typeof difficultyExplanation] || 'balance understanding with practical application'}.`;
  
  const categoryReasoning = categoryExplanation[category as keyof typeof categoryExplanation];
  
  const intentReasoning = intent ? ` Given your focus on "${intent}", this cognitive approach will best serve your learning objectives.` : '';

  return baseReasoning + (categoryReasoning ? ` ${categoryReasoning}.` : '') + intentReasoning;
}

function generateProgressionPath(difficulty: string) {
  const paths = {
    BEGINNER: [
      { level: 'REMEMBER', description: 'Start with key facts and concepts' },
      { level: 'UNDERSTAND', description: 'Build comprehension of principles' },
      { level: 'APPLY', description: 'Practice with guided exercises' }
    ],
    INTERMEDIATE: [
      { level: 'UNDERSTAND', description: 'Deepen conceptual knowledge' },
      { level: 'APPLY', description: 'Solve practical problems' },
      { level: 'ANALYZE', description: 'Break down complex scenarios' }
    ],
    ADVANCED: [
      { level: 'ANALYZE', description: 'Examine complex relationships' },
      { level: 'EVALUATE', description: 'Assess and critique approaches' },
      { level: 'CREATE', description: 'Design original solutions' }
    ]
  };

  return paths[difficulty as keyof typeof paths] || paths.BEGINNER;
}

function generateWarnings(currentSelections: string[], difficulty: string) {
  const warnings = [];

  if (currentSelections && currentSelections.length > 0) {
    // Check for difficulty mismatch
    if (difficulty === 'BEGINNER' && currentSelections.includes('CREATE')) {
      warnings.push({
        type: 'difficulty_mismatch',
        message: 'Creating original content may be challenging for beginner learners. Consider focusing on understanding and application first.',
        severity: 'medium'
      });
    }

    if (difficulty === 'ADVANCED' && currentSelections.includes('REMEMBER') && !currentSelections.includes('EVALUATE')) {
      warnings.push({
        type: 'underutilized_potential',
        message: 'Advanced learners can benefit from higher-order thinking skills like evaluation and creation.',
        severity: 'low'
      });
    }

    // Check for cognitive overload
    if (currentSelections.length > 4) {
      warnings.push({
        type: 'cognitive_overload',
        message: 'Focusing on too many cognitive levels may dilute learning effectiveness. Consider narrowing to 2-3 primary levels.',
        severity: 'high'
      });
    }
  }

  return warnings;
}