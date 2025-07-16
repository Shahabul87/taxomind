import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, overview, category, subcategory, targetAudience, difficulty, intent, count } = await request.json();

    if (!title || !overview || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate learning objectives based on course context
    const objectives = await generateLearningObjectives({
      title,
      overview,
      category,
      subcategory,
      targetAudience,
      difficulty,
      intent,
      count: count || 5
    });

    return NextResponse.json({ objectives });
  } catch (error) {
    console.error('Error generating learning objectives:', error);
    return NextResponse.json({ error: 'Failed to generate learning objectives' }, { status: 500 });
  }
}

async function generateLearningObjectives(courseData: any) {
  // For now, generate contextual objectives based on the course data
  // In a real implementation, this would call an AI service
  const { category, targetAudience, difficulty, intent, count } = courseData;
  
  const actionVerbs = getActionVerbsForDifficulty(difficulty);
  const skillArea = getSkillAreaFromCategory(category);
  const requestedCount = Math.min(Math.max(count || 5, 3), 10); // Ensure count is between 3 and 10
  
  const objectives = [
    {
      text: `${actionVerbs.primary} core concepts and principles of ${skillArea} as outlined in the course`,
      reasoning: `Essential foundational knowledge for ${targetAudience || 'learners'} at ${difficulty} level`,
      bloomsLevel: difficulty === 'BEGINNER' ? 'UNDERSTAND' : 'ANALYZE',
      confidence: 0.9
    },
    {
      text: `${actionVerbs.secondary} practical skills and techniques through hands-on exercises and projects`,
      reasoning: `Practical application is crucial for skill development in ${category}`,
      bloomsLevel: 'APPLY',
      confidence: 0.85
    },
    {
      text: `${actionVerbs.tertiary} real-world problems using the knowledge and skills acquired`,
      reasoning: `Problem-solving aligns with course intent: ${intent || 'practical application'}`,
      bloomsLevel: difficulty === 'ADVANCED' ? 'EVALUATE' : 'ANALYZE',
      confidence: 0.8
    },
    {
      text: `Demonstrate proficiency in ${skillArea} through completion of assessments and project work`,
      reasoning: `Assessment-based learning validates skill acquisition for ${targetAudience || 'learners'}`,
      bloomsLevel: 'APPLY',
      confidence: 0.82
    },
    {
      text: `${difficulty === 'BEGINNER' ? 'Recognize' : 'Evaluate'} best practices and methodologies within ${skillArea}`,
      reasoning: `Understanding industry standards is important for ${difficulty.toLowerCase()} level learning`,
      bloomsLevel: difficulty === 'BEGINNER' ? 'REMEMBER' : 'EVALUATE',
      confidence: 0.78
    },
    {
      text: `Communicate effectively about ${skillArea} concepts and solutions to various audiences`,
      reasoning: `Communication skills are essential for professional development in ${category}`,
      bloomsLevel: 'UNDERSTAND',
      confidence: 0.75
    },
    {
      text: `${actionVerbs.primary} the relationship between theoretical knowledge and practical application in ${skillArea}`,
      reasoning: `Connecting theory to practice enhances learning retention for ${targetAudience || 'learners'}`,
      bloomsLevel: 'ANALYZE',
      confidence: 0.80
    },
    {
      text: `${difficulty === 'ADVANCED' ? 'Create' : 'Identify'} innovative solutions to challenges in ${skillArea}`,
      reasoning: `Innovation and problem-solving are key outcomes for ${difficulty.toLowerCase()} level courses`,
      bloomsLevel: difficulty === 'ADVANCED' ? 'CREATE' : 'UNDERSTAND',
      confidence: 0.77
    },
    {
      text: `Reflect on personal learning progress and identify areas for continued growth in ${skillArea}`,
      reasoning: `Self-reflection promotes lifelong learning and aligns with course intent: ${intent || 'personal development'}`,
      bloomsLevel: 'EVALUATE',
      confidence: 0.73
    },
    {
      text: `Collaborate effectively with peers on ${skillArea} projects and discussions`,
      reasoning: `Collaborative learning enhances understanding and mirrors real-world professional environments`,
      bloomsLevel: 'APPLY',
      confidence: 0.79
    }
  ];

  // Add category-specific objectives
  if (category === 'programming') {
    objectives.push({
      text: `Write clean, efficient, and maintainable code following industry best practices`,
      reasoning: `Code quality is fundamental in programming education`,
      bloomsLevel: 'CREATE',
      confidence: 0.88
    });
  } else if (category === 'business') {
    objectives.push({
      text: `Develop strategic solutions and make informed business decisions`,
      reasoning: `Strategic thinking is essential for business education`,
      bloomsLevel: 'EVALUATE',
      confidence: 0.87
    });
  } else if (category === 'design') {
    objectives.push({
      text: `Create original designs that effectively communicate intended messages`,
      reasoning: `Creative output is the primary goal in design education`,
      bloomsLevel: 'CREATE',
      confidence: 0.9
    });
  }

  // Add difficulty-specific objectives
  if (difficulty === 'ADVANCED') {
    objectives.push({
      text: `Critically evaluate different approaches and methodologies in the field`,
      reasoning: `Advanced learners should develop critical thinking skills`,
      bloomsLevel: 'EVALUATE',
      confidence: 0.85
    });
  }

  return objectives.slice(0, requestedCount); // Return requested number of objectives
}

function getActionVerbsForDifficulty(difficulty: string) {
  const verbSets = {
    BEGINNER: {
      primary: 'Understand',
      secondary: 'Apply',
      tertiary: 'Analyze'
    },
    INTERMEDIATE: {
      primary: 'Analyze',
      secondary: 'Apply',
      tertiary: 'Evaluate'
    },
    ADVANCED: {
      primary: 'Evaluate',
      secondary: 'Create',
      tertiary: 'Synthesize'
    }
  };

  return verbSets[difficulty as keyof typeof verbSets] || verbSets.BEGINNER;
}

function getSkillAreaFromCategory(category: string) {
  const skillAreas = {
    programming: 'software development',
    business: 'business strategy',
    design: 'design principles',
    marketing: 'marketing strategies',
    data_science: 'data analysis',
    personal_development: 'personal growth',
    language: 'language skills',
    technology: 'technology concepts',
    health: 'health and wellness',
    finance: 'financial management'
  };

  return skillAreas[category as keyof typeof skillAreas] || 'the subject matter';
}