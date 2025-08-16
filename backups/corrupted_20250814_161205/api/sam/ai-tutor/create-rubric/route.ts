import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/wexport const POST = withAuth(async (request, context) => {'
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

    const { assignment } = await request.json();

    const systemPrompt = `You are SAM, an expert AI tutor that creates comprehensive, fair, and educational assessment rubrics. Create a detailed rubric that promotes learning and provides clear guidance for both students and teachers.

**Rubric Creation Guidelines:**
- Create 4-5 main criteria relevant to the assignment
- Use 4 performance levels (Excellent, Good, Satisfactory, Needs Improvement)
- Provide specific, actionable descriptors for each level
- Include point values that total 100 points
- Make criteria measurable and observable
- Align with learning objectives
- Include both content and process criteria

**Assignment Details:**
${JSON.stringify(assignment, null, 2)}

**Response Format:**
Return a JSON object with:
- title: Rubric title
- description: Brief description of the rubric
- totalPoints: Total possible points (100)
- criteria: Array of criterion objects
- scaleLevels: Array of performance levels
- instructions: Instructions for use

Each criterion should have:
- name: Criterion name
- description: What this criterion measures
- weight: Percentage of total grade
- levels: Object with descriptors for each performance level
- pointsRange: Point range for this criterion`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Create a comprehensive rubric for this assignment: ${JSON.stringify(assignment)}` }
      ]
    });

    const aiResponse = response.content[0];
    let rubricText = aiResponse.type === 'text' ? aiResponse.text : '';

    // Try to parse as JSON, fallback to structured parsing
    let rubric;
    try {
      rubric = JSON.parse(rubricText);
    } catch {
      rubric = parseRubricFromText(rubricText, assignment);
    }

    return NextResponse.json({
      rubric,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      assignment: assignment
    });

  } catch (error: any) {
    logger.error('Rubric creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create rubric' },
      { status: 500 }
    );
  }
}

function parseRubricFromText(text: string, assignment: any): any {
  // Fallback parser for when AI doesn't return JSON'
  const rubric = {
    title: `${assignment.title || 'Assignment'} Rubric`,
    description: 'AI-generated assessment rubric',
    totalPoints: 100,
    scaleLevels: [
      { name: 'Excellent', range: '90-100', description: 'Exceeds expectations' },
      { name: 'Good', range: '80-89', description: 'Meets expectations' },
      { name: 'Satisfactory', range: '70-79', description: 'Approaches expectations' },
      { name: 'Needs Improvement', range: '0-69', description: 'Below expectations' }
    ],
    criteria: [
      {
        name: 'Content Quality',
        description: 'Accuracy and depth of content',
        weight: 40,
        pointsRange: '0-40',
        levels: {
          excellent: 'Demonstrates thorough understanding with accurate, detailed content',
          good: 'Shows good understanding with mostly accurate content',
          satisfactory: 'Shows basic understanding with some accuracy',
          needsImprovement: 'Limited understanding with significant inaccuracies'
        }
      },
      {
        name: 'Organization',
        description: 'Structure and logical flow',
        weight: 25,
        pointsRange: '0-25',
        levels: {
          excellent: 'Clear, logical structure with smooth transitions',
          good: 'Generally well-organized with minor structural issues',
          satisfactory: 'Basic organization with some unclear sections',
          needsImprovement: 'Poor organization, difficult to follow'
        }
      },
      {
        name: 'Analysis',
        description: 'Critical thinking and analysis',
        weight: 25,
        pointsRange: '0-25',
        levels: {
          excellent: 'Demonstrates sophisticated analysis and critical thinking',
          good: 'Shows good analytical skills with supported arguments',
          satisfactory: 'Basic analysis with limited support',
          needsImprovement: 'Minimal analysis, mostly descriptive'
        }
      },
      {
        name: 'Presentation',
        description: 'Grammar, style, and formatting',
        weight: 10,
        pointsRange: '0-10',
        levels: {
          excellent: 'Professional presentation with proper grammar and formatting',
          good: 'Generally well-presented with minor errors',
          satisfactory: 'Adequate presentation with some errors',
          needsImprovement: 'Poor presentation with numerous errors'
        }
      }
    ],
    instructions: [
      'Review each criterion carefully',
      'Provide specific feedback for each level',
      'Consider the assignment objectives',
      'Be consistent in your evaluation',
      'Offer constructive suggestions for improvement'
    ]
  };

  return rubric;
}

// Helper function to generate criterion based on assignment type
function generateCriteriaForAssignmentType(type: string): any[] {
  const criteriaTemplates: Record<string, any[]> = {
    essay: [
      { name: 'Thesis and Argument', weight: 30 },
      { name: 'Evidence and Support', weight: 25 },
      { name: 'Organization', weight: 20 },
      { name: 'Writing Quality', weight: 15 },
      { name: 'Citations', weight: 10 }
    ],
    presentation: [
      { name: 'Content Knowledge', weight: 35 },
      { name: 'Delivery', weight: 25 },
      { name: 'Visual Aids', weight: 20 },
      { name: 'Organization', weight: 20 }
    ],
    project: [
      { name: 'Completion', weight: 30 },
      { name: 'Quality', weight: 25 },
      { name: 'Creativity', weight: 20 },
      { name: 'Process', weight: 15 },
      { name: 'Presentation', weight: 10 }
    ]
  };

  return criteriaTemplates[type] || criteriaTemplates.essay;
}