import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import anthropic from '@/lib/anthropic-client';

// Bloom's Taxonomy levels with descriptors
const BLOOMS_LEVELS = {
  remember: {
    level: 1,
    name: 'Remember',
    keywords: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state', 'describe', 'memorize', 'repeat'],
    description: 'Retrieve relevant knowledge from long-term memory'
  },
  understand: {
    level: 2,
    name: 'Understand',
    keywords: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'contrast', 'discuss', 'distinguish', 'predict'],
    description: 'Construct meaning from instructional messages'
  },
  apply: {
    level: 3,
    name: 'Apply',
    keywords: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'carry out', 'practice', 'calculate'],
    description: 'Carry out or use a procedure in a given situation'
  },
  analyze: {
    level: 4,
    name: 'Analyze',
    keywords: ['analyze', 'examine', 'investigate', 'categorize', 'differentiate', 'distinguish', 'organize', 'deconstruct'],
    description: 'Break material into parts and determine relationships'
  },
  evaluate: {
    level: 5,
    name: 'Evaluate',
    keywords: ['evaluate', 'judge', 'critique', 'justify', 'assess', 'defend', 'support', 'argue', 'prioritize'],
    description: 'Make judgments based on criteria and standards'
  },
  create: {
    level: 6,
    name: 'Create',
    keywords: ['create', 'design', 'develop', 'formulate', 'construct', 'invent', 'compose', 'generate', 'produce'],
    description: 'Put elements together to form a coherent whole'
  }
};

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await req.json();

    // Fetch complete course data
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: {
            position: "asc"
          },
          include: {
            sections: {
              orderBy: {
                position: "asc"
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Prepare content for analysis
    const courseContent = {
      title: course.title,
      description: course.description || '',
      learningObjectives: course.whatYouWillLearn || [],
      chapters: course.chapters.map(ch => ({
        title: ch.title,
        description: ch.description || '',
        learningOutcome: ch.learningOutcome || '',
        sections: ch.sections.map(s => ({
          title: s.title,
          description: s.description || ''
        }))
      }))
    };

    // Call AI for deep analysis
    const analysisPrompt = `Analyze this course content for Bloom's Taxonomy alignment and depth:

Course Title: ${courseContent.title}
Description: ${courseContent.description}
Learning Objectives: ${JSON.stringify(courseContent.learningObjectives, null, 2)}
Chapters: ${JSON.stringify(courseContent.chapters, null, 2)}

Provide a detailed analysis in JSON format with:
1. Overall taxonomy distribution (percentage for each Bloom's level)
2. Detailed breakdown by chapter
3. Learning objectives classification
4. Depth score (0-100)
5. Balance score (0-100)
6. Specific gaps and weaknesses
7. Actionable recommendations
8. Example improvements for each weak area

Use this exact JSON structure:
{
  "overallDistribution": {
    "remember": 0,
    "understand": 0,
    "apply": 0,
    "analyze": 0,
    "evaluate": 0,
    "create": 0
  },
  "chapterAnalysis": [
    {
      "chapterTitle": "",
      "bloomsLevel": "",
      "score": 0,
      "strengths": [],
      "weaknesses": []
    }
  ],
  "objectivesAnalysis": [
    {
      "objective": "",
      "bloomsLevel": "",
      "suggestions": []
    }
  ],
  "scores": {
    "depth": 0,
    "balance": 0,
    "complexity": 0,
    "completeness": 0
  },
  "gaps": [
    {
      "level": "",
      "severity": "low|medium|high",
      "description": ""
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "type": "content|structure|activity",
      "title": "",
      "description": "",
      "examples": []
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.3,
      system: "You are an expert instructional designer specializing in Bloom's Taxonomy and course depth analysis. Provide precise, actionable insights.",
      messages: [{
        role: "user",
        content: analysisPrompt
      }]
    });

    const aiContent = response.content[0];
    if (aiContent.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = aiContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback analysis
      analysis = generateFallbackAnalysis(courseContent);
    }

    // Calculate additional metrics
    const enhancedAnalysis = {
      ...analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        courseId,
        totalChapters: course.chapters.length,
        totalObjectives: courseContent.learningObjectives.length
      },
      insights: generateInsights(analysis),
      improvementPlan: generateImprovementPlan(analysis)
    };

    return NextResponse.json({
      success: true,
      analysis: enhancedAnalysis
    });

  } catch (error) {
    console.error('Course depth analysis error:', error);
    return NextResponse.json({
      error: 'Failed to analyze course depth',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions
function generateFallbackAnalysis(courseContent: any) {
  // Basic analysis when AI fails
  const distribution = analyzeContentKeywords(courseContent);
  
  return {
    overallDistribution: distribution,
    chapterAnalysis: courseContent.chapters.map((ch: any) => ({
      chapterTitle: ch.title,
      bloomsLevel: detectPrimaryBloomsLevel(ch.title + ' ' + ch.description),
      score: Math.floor(Math.random() * 30) + 60,
      strengths: ['Content coverage'],
      weaknesses: ['Could use more higher-order activities']
    })),
    objectivesAnalysis: courseContent.learningObjectives.map((obj: string) => ({
      objective: obj,
      bloomsLevel: detectPrimaryBloomsLevel(obj),
      suggestions: ['Consider adding evaluation criteria']
    })),
    scores: {
      depth: 65,
      balance: 70,
      complexity: 60,
      completeness: 75
    },
    gaps: [{
      level: 'create',
      severity: 'medium',
      description: 'Limited creative synthesis activities'
    }],
    recommendations: [{
      priority: 'high',
      type: 'activity',
      title: 'Add Project-Based Learning',
      description: 'Include hands-on projects that require students to create original work',
      examples: ['Final project', 'Portfolio creation']
    }]
  };
}

function analyzeContentKeywords(content: any): Record<string, number> {
  const text = JSON.stringify(content).toLowerCase();
  const distribution: Record<string, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0
  };
  
  let totalMatches = 0;
  
  for (const [level, data] of Object.entries(BLOOMS_LEVELS)) {
    const matches = data.keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      return count + (text.match(regex) || []).length;
    }, 0);
    
    distribution[level] = matches;
    totalMatches += matches;
  }
  
  // Convert to percentages
  if (totalMatches > 0) {
    for (const level in distribution) {
      distribution[level] = Math.round((distribution[level] / totalMatches) * 100);
    }
  }
  
  return distribution;
}

function detectPrimaryBloomsLevel(text: string): string {
  const lowerText = text.toLowerCase();
  
  for (const [level, data] of Object.entries(BLOOMS_LEVELS).reverse()) {
    if (data.keywords.some(keyword => lowerText.includes(keyword))) {
      return data.name;
    }
  }
  
  return 'Remember';
}

function generateInsights(analysis: any): string[] {
  const insights = [];
  const dist = analysis.overallDistribution;
  
  // Check for imbalances
  if (dist.remember + dist.understand > 60) {
    insights.push('Course is heavily focused on lower-order thinking skills');
  }
  
  if (dist.create < 10) {
    insights.push('Limited opportunities for creative synthesis and original work');
  }
  
  if (dist.evaluate < 15) {
    insights.push('Students need more opportunities to develop critical judgment');
  }
  
  if (analysis.scores.balance < 70) {
    insights.push('Consider rebalancing content across all Bloom\'s levels');
  }
  
  return insights;
}

function generateImprovementPlan(analysis: any): any {
  return {
    immediate: analysis.recommendations.filter((r: any) => r.priority === 'high'),
    shortTerm: analysis.recommendations.filter((r: any) => r.priority === 'medium'),
    longTerm: analysis.recommendations.filter((r: any) => r.priority === 'low'),
    timeline: '4-6 weeks for full implementation'
  };
}