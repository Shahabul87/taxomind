import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import anthropic from '@/lib/anthropic-client';
import { logger } from '@/lib/logger';

// Import SAM evaluation engines
async function integrateSAMEngineAnalysis(courseContent: any) {
  let samAnalysis = {
    bloomsAnalysis: {},
    marketAnalysis: {},
    qualityAnalysis: {},
    completionAnalysis: {
}
  };

  try {
    // Run analyses in parallel for better performance
    const [bloomsResult, marketResult] = await Promise.allSettled([
      analyzeBlooms(courseContent),
      analyzeMarket(courseContent)
    ]);

    if (bloomsResult.status === 'fulfilled') {
      samAnalysis.bloomsAnalysis = bloomsResult.value;
    } else {
      logger.error('Blooms analysis failed:', bloomsResult.reason);
      samAnalysis.bloomsAnalysis = generateFallbackBloomsAnalysis(courseContent);
    }

    if (marketResult.status === 'fulfilled') {
      samAnalysis.marketAnalysis = marketResult.value;
    } else {
      logger.error('Market analysis failed:', marketResult.reason);
      samAnalysis.marketAnalysis = generateFallbackMarketAnalysis(courseContent);
    }

    // These don't require external API calls
    samAnalysis.qualityAnalysis = await analyzeQuality(courseContent);
    samAnalysis.completionAnalysis = analyzeCompletion(courseContent);
  } catch (error: any) {
    logger.error('SAM engine integration error:', error);
    // Use fallback analyses
    samAnalysis.bloomsAnalysis = generateFallbackBloomsAnalysis(courseContent);
    samAnalysis.marketAnalysis = generateFallbackMarketAnalysis(courseContent);
    samAnalysis.qualityAnalysis = await analyzeQuality(courseContent);
    samAnalysis.completionAnalysis = analyzeCompletion(courseContent);
  }
  
  return samAnalysis;
}

// SAM Blooms Analysis Engine Integration
async function analyzeBlooms(courseContent: any) {
  try {
    // Import the Blooms engine directly instead of making HTTP calls
    const { BloomsAnalysisEngine } = await import('@/lib/sam-blooms-engine');
    const engine = new BloomsAnalysisEngine();
    
    // Perform comprehensive analysis
    const analysis = await engine.analyzeCourse(
      courseContent.courseId, 
      'detailed', // Use detailed analysis for comprehensive data
      true // Include recommendations
    );
    
    return {
      distribution: analysis.courseLevel.distribution,
      cognitiveDepth: analysis.courseLevel.cognitiveDepth,
      balance: analysis.courseLevel.balance,
      chapterAnalysis: analysis.chapterAnalysis,
      learningPathway: analysis.learningPathway,
      recommendations: analysis.recommendations,
      studentImpact: analysis.studentImpact,
      chapterInsights: analysis.chapterAnalysis.map(ch => ({
        id: ch.chapterId,
        title: ch.chapterTitle,
        primaryLevel: ch.primaryLevel,
        score: ch.cognitiveDepth,
        distribution: ch.bloomsDistribution,
        sections: ch.sections
      }))
    };
  } catch (error: any) {
    logger.error('SAM Blooms analysis failed:', error);
  }
  
  return generateFallbackBloomsAnalysis(courseContent);
}

// SAM Market Analysis Engine Integration  
async function analyzeMarket(courseContent: any) {
  try {
    // For now, use the fallback market analysis
    // In a production environment, this would integrate with actual market data APIs
    return {
      demandLevel: courseContent.category.includes('Technology') || courseContent.category.includes('Business') ? 'high' : 'medium',
      competitionLevel: 'moderate',
      priceRecommendation: {
        suggested: courseContent.price === 0 ? 49 : courseContent.price,
        range: { min: 29, max: 199 }
      },
      marketPosition: courseContent.isPublished ? 'established' : 'developing',
      growthPotential: courseContent.chaptersCount > 5 ? 85 : 65,
      targetAudience: {
        primary: 'Professionals seeking skill enhancement',
        secondary: 'Students and beginners in the field'
      },
      competitorAnalysis: {
        averagePrice: 79,
        averageChapters: 8,
        marketShare: 'Growing segment'
      }
    };
  } catch (error: any) {
    logger.error('SAM Market analysis failed:', error);
  }
  
  return generateFallbackMarketAnalysis(courseContent);
}

// SAM Quality Analysis Engine Integration
async function analyzeQuality(courseContent: any) {
  const qualityMetrics = {
    contentDepth: calculateContentDepth(courseContent),
    structureQuality: calculateStructureQuality(courseContent),
    completionScore: courseContent.completionPercentage,
    engagementPotential: calculateEngagementPotential(courseContent),
    marketReadiness: calculateMarketReadiness(courseContent),
    overallScore: 0
  };
  
  qualityMetrics.overallScore = Math.round(
    (qualityMetrics.contentDepth + 
     qualityMetrics.structureQuality + 
     qualityMetrics.completionScore + 
     qualityMetrics.engagementPotential + 
     qualityMetrics.marketReadiness) / 5
  );
  
  return qualityMetrics;
}

// Form Completion Analysis
function analyzeCompletion(courseContent: any) {
  const completionAnalysis = {
    titleDescription: {
      completed: Boolean(courseContent.title && courseContent.description),
      score: (courseContent.title ? 50 : 0) + (courseContent.description ? 50 : 0),
      feedback: generateTitleDescFeedback(courseContent),
      recommendations: generateTitleDescRecommendations(courseContent)
    },
    learningObjectives: {
      completed: courseContent.learningObjectives.length > 0,
      score: Math.min(courseContent.learningObjectives.length * 20, 100),
      feedback: generateObjectivesFeedback(courseContent),
      bloomsAlignment: assessBloomsAlignment(courseContent.learningObjectives),
      recommendations: generateObjectivesRecommendations(courseContent)
    },
    category: {
      completed: courseContent.category !== 'Uncategorized',
      score: courseContent.category !== 'Uncategorized' ? 100 : 0,
      feedback: generateCategoryFeedback(courseContent),
      marketFit: assessMarketFit(courseContent),
      recommendations: generateCategoryRecommendations(courseContent)
    },
    pricing: {
      completed: courseContent.price !== null,
      score: courseContent.price !== null ? 100 : 0,
      feedback: generatePricingFeedback(courseContent),
      marketAnalysis: analyzePricingStrategy(courseContent),
      recommendations: generatePricingRecommendations(courseContent)
    },
    courseImage: {
      completed: courseContent.hasImage,
      score: courseContent.hasImage ? 100 : 0,
      feedback: generateImageFeedback(courseContent),
      recommendations: generateImageRecommendations(courseContent)
    },
    chapters: {
      completed: courseContent.chaptersCount > 0,
      score: Math.min(courseContent.chaptersCount * 25, 100),
      feedback: generateChaptersFeedback(courseContent),
      structureAnalysis: analyzeChapterStructure(courseContent),
      recommendations: generateChaptersRecommendations(courseContent)
    },
    resources: {
      completed: courseContent.attachmentsCount > 0,
      score: Math.min(courseContent.attachmentsCount * 20, 100),
      feedback: generateResourcesFeedback(courseContent),
      adequacyAnalysis: analyzeResourceAdequacy(courseContent),
      recommendations: generateResourcesRecommendations(courseContent)
    }
  };
  
  return completionAnalysis;
}

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
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, forceReanalyze = false } = await req.json();

    // Fetch complete course data with ALL form data
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
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
        },
        attachments: {
          orderBy: {
            createdAt: "desc"
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Calculate completion status for all forms
    const completionStatus = {
      titleDesc: Boolean(course.title && course.description),
      learningObj: Boolean(course.whatYouWillLearn && course.whatYouWillLearn.length > 0),
      image: Boolean(course.imageUrl),
      price: Boolean(course.price !== null && course.price !== undefined),
      category: Boolean(course.categoryId),
      chapters: Boolean(course.chapters.length > 0),
      attachments: Boolean(course.attachments.length > 0)
    };

    // Calculate completion metrics
    const completedSections = Object.values(completionStatus).filter(Boolean).length;
    const totalSections = Object.values(completionStatus).length;
    const completionPercentage = Math.round((completedSections / totalSections) * 100);

    // Generate content hash and check for existing analysis
    const { generateCourseContentHash } = await import('@/lib/course-content-hash');
    const currentContentHash = generateCourseContentHash(course);

    // Check if we have a recent analysis with the same content hash
    if (!forceReanalyze) {
      const existingAnalysis = await db.courseBloomsAnalysis.findUnique({
        where: { courseId },
        select: {
          contentHash: true,
          analyzedAt: true,
          bloomsDistribution: true,
          cognitiveDepth: true,
          learningPathway: true,
          skillsMatrix: true,
          gapAnalysis: true,
          recommendations: true,
        }
      });

      if (existingAnalysis && existingAnalysis.contentHash === currentContentHash) {

        // Return the cached analysis
        const cachedDistribution = existingAnalysis.bloomsDistribution as any;
        
        return NextResponse.json({
          success: true,
          cached: true,
          analysis: {
            overallDistribution: cachedDistribution,
            chapterAnalysis: [], // Would need to be stored separately for full cache
            objectivesAnalysis: [],
            scores: {
              depth: existingAnalysis.cognitiveDepth,
              balance: 70, // Calculate from distribution
              complexity: 75,
              completeness: completionPercentage
            },
            gaps: existingAnalysis.gapAnalysis as any,
            recommendations: existingAnalysis.recommendations as any,
            insights: generateInsights(
              { overallDistribution: cachedDistribution },
              {
}
            ),
            bloomsInsights: generateBloomsInsights(cachedDistribution, {}),
            metadata: {
              analyzedAt: existingAnalysis.analyzedAt.toISOString(),
              courseId,
              totalChapters: course.chapters.length,
              totalObjectives: course.whatYouWillLearn?.length || 0,
              completionPercentage,
              cached: true,
              contentHash: currentContentHash
            }
          }
        });
      }
    }

    // Prepare comprehensive content for analysis
    const courseContent = {
      // Basic Course Information
      title: course.title || 'Untitled Course',
      description: course.description || '',
      learningObjectives: course.whatYouWillLearn || [],
      
      // Course Metadata
      category: course.category?.name || 'Uncategorized',
      price: course.price || 0,
      priceType: course.price === 0 ? 'Free' : 'Paid',
      hasImage: Boolean(course.imageUrl),
      imageUrl: course.imageUrl,
      isPublished: course.isPublished,
      
      // Completion Status Analysis
      completionStatus,
      completionPercentage,
      completedSections,
      totalSections,
      readinessScore: completionPercentage,
      
      // Content Structure
      chaptersCount: course.chapters.length,
      sectionsCount: course.chapters.reduce((total, ch) => total + ch.sections.length, 0),
      attachmentsCount: course.attachments.length,
      
      // Detailed Chapter Analysis
      chapters: course.chapters.map(ch => ({
        title: ch.title || 'Untitled Chapter',
        description: ch.description || '',
        learningOutcome: ch.learningOutcomes || '',
        isPublished: ch.isPublished,
        isFree: ch.isFree,
        position: ch.position,
        sectionsCount: ch.sections.length,
        sections: ch.sections.map(s => ({
          title: s.title || 'Untitled Section',
          position: s.position,
          isPublished: s.isPublished
        }))
      })),
      
      // Resources and Attachments
      resources: course.attachments.map(att => ({
        name: att.name,
        url: att.url,
        type: att.name.split('.').pop()?.toLowerCase() || 'unknown'
      })),
      
      // Course Creator Information
      creator: {
        name: course.user?.name || 'Unknown Creator',
        email: course.user?.email
      },
      
      // Add courseId for SAM integration
      courseId: courseId
    };

    // Integrate SAM Engine Analysis

    const samAnalysis = await integrateSAMEngineAnalysis(courseContent);

    // Call AI for comprehensive analysis
    const analysisPrompt = `Conduct a comprehensive course depth analysis using Bloom's Taxonomy and educational best practices:

## COURSE OVERVIEW
Title: ${courseContent.title}
Category: ${courseContent.category}
Price: ${courseContent.priceType} (${courseContent.price === 0 ? 'Free' : '$' + courseContent.price})
Status: ${courseContent.isPublished ? 'Published' : 'Draft'}

## COMPLETION STATUS ANALYSIS
Overall Completion: ${courseContent.completionPercentage}% (${courseContent.completedSections}/${courseContent.totalSections} sections)
- Title & Description: ${completionStatus.titleDesc ? '✓' : '✗'}
- Learning Objectives: ${completionStatus.learningObj ? '✓' : '✗'} 
- Category: ${completionStatus.category ? '✓' : '✗'}
- Pricing: ${completionStatus.price ? '✓' : '✗'}
- Course Image: ${completionStatus.image ? '✓' : '✗'}
- Chapters: ${completionStatus.chapters ? '✓' : '✗'} (${courseContent.chaptersCount} chapters)
- Resources: ${completionStatus.attachments ? '✓' : '✗'} (${courseContent.attachmentsCount} files)

## COURSE CONTENT STRUCTURE
Description: ${courseContent.description || 'No description provided'}
Learning Objectives: ${JSON.stringify(courseContent.learningObjectives, null, 2)}
Total Sections: ${courseContent.sectionsCount} across ${courseContent.chaptersCount} chapters
Chapters: ${JSON.stringify(courseContent.chapters, null, 2)}

Provide a comprehensive course analysis in JSON format covering:

## ANALYSIS REQUIREMENTS:
1. **Bloom's Taxonomy Distribution** (percentage for each cognitive level)
2. **Form Completion Analysis** (evaluate each course setup form)
3. **Content Quality Assessment** (depth, engagement, clarity)
4. **Structure Optimization** (chapter flow, section organization)
5. **Learning Objectives Evaluation** (SMART criteria, Bloom's alignment)
6. **Course Readiness Assessment** (publishing requirements)
7. **Market Positioning Analysis** (category fit, pricing strategy)
8. **Resource Adequacy** (attachments, supporting materials)
9. **Specific Improvement Recommendations** (prioritized by impact)
10. **Next Action Steps** (immediate tasks for improvement)

For Learning Objectives, analyze each objective and provide:
- SMART criteria compliance (Specific, Measurable, Achievable, Relevant, Time-bound)
- Bloom's taxonomy level mapping
- Action verb strength assessment
- Clarity score (1-100)
- Improvement suggestions

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
      "actionVerb": "",
      "smartCriteria": {
        "specific": { "score": 0, "feedback": "" },
        "measurable": { "score": 0, "feedback": "" },
        "achievable": { "score": 0, "feedback": "" },
        "relevant": { "score": 0, "feedback": "" },
        "timeBound": { "score": 0, "feedback": "" }
      },
      "clarityScore": 0,
      "verbStrength": "weak|moderate|strong",
      "suggestions": [],
      "improvedVersion": ""
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
  "formCompletionAnalysis": {
    "titleDescription": {
      "completed": false,
      "score": 0,
      "feedback": "",
      "recommendations": []
    },
    "learningObjectives": {
      "completed": false,
      "score": 0,
      "feedback": "",
      "bloomsAlignment": "",
      "recommendations": []
    },
    "category": {
      "completed": false,
      "score": 0,
      "feedback": "",
      "marketFit": "",
      "recommendations": []
    },
    "pricing": {
      "completed": false,
      "score": 0,
      "feedback": "",
      "marketAnalysis": "",
      "recommendations": []
    },
    "courseImage": {
      "completed": false,
      "score": 0,
      "feedback": "",
      "recommendations": []
    },
    "chapters": {
      "completed": false,
      "score": 0,
      "feedback": "",
      "structureAnalysis": "",
      "recommendations": []
    },
    "resources": {
      "completed": false,
      "score": 0,
      "feedback": "",
      "adequacyAnalysis": "",
      "recommendations": []
    }
  },
  "courseQualityMetrics": {
    "overallScore": 0,
    "contentDepth": 0,
    "structureQuality": 0,
    "engagementPotential": 0,
    "marketReadiness": 0,
    "publishingReadiness": 0
  },
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "type": "content|structure|completion|marketing|technical",
      "category": "title|description|objectives|chapters|resources|pricing|image",
      "title": "",
      "description": "",
      "impact": "",
      "effort": "low|medium|high",
      "examples": [],
      "actionSteps": []
    }
  ],
  "nextActions": [
    {
      "order": 1,
      "action": "",
      "reason": "",
      "estimatedTime": "",
      "category": ""
    }
  ],
  "bloomsInsights": {
    "dominantLevel": "",
    "missingLevels": [],
    "balanceScore": 0,
    "improvementSuggestions": []
  }
}`;

    // Retry logic for Anthropic API calls
    async function callAnthropicWithRetry(messageRequest: any, maxRetries: number = 3): Promise<any> {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await anthropic.messages.create(messageRequest);
        } catch (error: any) {
          logger.error(`Anthropic API attempt ${attempt} failed:`, error);
          
          // Check if it's a rate limit or overload error
          if (error.status === 529 || error.status === 503 || error.status === 429) {
            if (attempt < maxRetries) {
              const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff

              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          // If it's not a retryable error or we've exhausted retries, throw
          throw error;
        }
      }
    }

    const response = await callAnthropicWithRetry({
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
      logger.error('Failed to parse AI response:', parseError);
      // Fallback analysis
      analysis = generateFallbackAnalysis(courseContent);
    }

    // Calculate additional metrics with SAM integration
    const enhancedAnalysis = {
      ...analysis,
      
      // Add SAM Engine Results
      samEngineResults: {
        bloomsAnalysis: samAnalysis.bloomsAnalysis,
        marketAnalysis: samAnalysis.marketAnalysis,
        qualityMetrics: samAnalysis.qualityAnalysis,
        completionAnalysis: samAnalysis.completionAnalysis
      },
      
      // Override form completion analysis with SAM results
      formCompletionAnalysis: samAnalysis.completionAnalysis,
      courseQualityMetrics: samAnalysis.qualityAnalysis,
      
      // Ensure bloomsInsights is always present
      bloomsInsights: analysis.bloomsInsights || generateBloomsInsights(analysis.overallDistribution || {}, samAnalysis),
      
      metadata: {
        analyzedAt: new Date().toISOString(),
        courseId,
        totalChapters: course.chapters.length,
        totalObjectives: courseContent.learningObjectives.length,
        completionPercentage: courseContent.completionPercentage,
        samEnginesUsed: ['bloomsAnalysis', 'marketAnalysis', 'qualityAnalysis', 'completionAnalysis'],
        contentHash: currentContentHash
      },
      insights: generateInsights(analysis, samAnalysis),
      improvementPlan: generateImprovementPlan(analysis, samAnalysis)
    };

    // Store the analysis with content hash (only if using Bloom's engine directly)
    if (samAnalysis.bloomsAnalysis && 'distribution' in samAnalysis.bloomsAnalysis) {
      try {
        await db.courseBloomsAnalysis.upsert({
          where: { courseId },
          update: {
            bloomsDistribution: samAnalysis.bloomsAnalysis.distribution as any,
            cognitiveDepth: (samAnalysis.bloomsAnalysis as any).cognitiveDepth || analysis.scores.depth,
            learningPathway: analysis.learningPathway || {},
            skillsMatrix: analysis.studentImpact?.skillsDeveloped || [],
            gapAnalysis: analysis.gaps || [],
            recommendations: analysis.recommendations || [],
            contentHash: currentContentHash,
            analyzedAt: new Date(),
          },
          create: {
            courseId,
            bloomsDistribution: samAnalysis.bloomsAnalysis.distribution as any,
            cognitiveDepth: (samAnalysis.bloomsAnalysis as any).cognitiveDepth || analysis.scores.depth,
            learningPathway: analysis.learningPathway || {},
            skillsMatrix: analysis.studentImpact?.skillsDeveloped || [],
            gapAnalysis: analysis.gaps || [],
            recommendations: analysis.recommendations || [],
            contentHash: currentContentHash,
            analyzedAt: new Date(),
          }
        });
      } catch (error: any) {
        logger.error('Failed to store analysis in database:', error);
      }
    }

    return NextResponse.json({
      success: true,
      analysis: enhancedAnalysis
    });

  } catch (error: any) {
    logger.error('Course depth analysis error:', error);
    
    // Handle specific Anthropic API errors
    let errorMessage = 'Failed to analyze course depth';
    let statusCode = 500;
    
    if (error.status === 529) {
      errorMessage = 'AI service is currently overloaded. Please try again in a few minutes.';
      statusCode = 503;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.status === 503) {
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      statusCode = 503;
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: [529, 503, 429].includes(error.status)
    }, { status: statusCode });
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

// Enhanced SAM Integration Helper Functions
function generateTitleDescFeedback(courseContent: any): string {
  if (!courseContent.title) {
    return 'Course title is missing. A compelling title is essential for attracting learners.';
  }
  if (!courseContent.description) {
    return 'Course description is missing. A detailed description helps learners understand what they will gain.';
  }
  if (courseContent.title.length < 10) {
    return 'Course title is too short. Consider a more descriptive title that clearly communicates the course value.';
  }
  if (courseContent.description.length < 100) {
    return 'Course description is too brief. Expand to include learning outcomes, target audience, and key benefits.';
  }
  return 'Title and description are well-developed and provide clear course information.';
}

function generateTitleDescRecommendations(courseContent: any): string[] {
  const recommendations = [];
  if (!courseContent.title) {
    recommendations.push('Create a compelling course title that includes key benefits and target audience');
  }
  if (!courseContent.description || courseContent.description.length < 100) {
    recommendations.push('Write a comprehensive description covering learning outcomes, prerequisites, and course structure');
  }
  if (courseContent.title && courseContent.title.length > 60) {
    recommendations.push('Consider shortening the title while maintaining clarity and appeal');
  }
  return recommendations;
}

function generateObjectivesFeedback(courseContent: any): string {
  const objectives = courseContent.learningObjectives || [];
  if (objectives.length === 0) {
    return 'No learning objectives defined. Clear objectives are crucial for student success and course effectiveness.';
  }
  if (objectives.length < 3) {
    return 'Too few learning objectives. Consider adding 3-8 specific, measurable objectives.';
  }
  if (objectives.length > 10) {
    return 'Too many learning objectives may overwhelm learners. Consider consolidating to 5-8 core objectives.';
  }
  return `${objectives.length} learning objectives defined. Ensure they follow SMART criteria and cover different Bloom\'s levels.`;
}

function assessBloomsAlignment(objectives: string[]): string {
  if (!objectives || objectives.length === 0) {
    return 'No objectives to assess for Bloom\'s alignment';
  }
  
  const bloomsKeywords = {
    remember: ['define', 'identify', 'list', 'name', 'recall', 'recognize'],
    understand: ['explain', 'summarize', 'interpret', 'classify', 'compare'],
    apply: ['apply', 'demonstrate', 'solve', 'use', 'implement'],
    analyze: ['analyze', 'examine', 'investigate', 'categorize'],
    evaluate: ['evaluate', 'judge', 'critique', 'assess', 'defend'],
    create: ['create', 'design', 'develop', 'formulate', 'construct']
  };
  
  const levels = new Set();
  objectives.forEach(obj => {
    const lowerObj = obj.toLowerCase();
    for (const [level, keywords] of Object.entries(bloomsKeywords)) {
      if (keywords.some(keyword => lowerObj.includes(keyword))) {
        levels.add(level);
        break;
      }
    }
  });
  
  return `Covers ${levels.size} Bloom\'s levels: ${Array.from(levels).join(', ')}`;
}

function generateObjectivesRecommendations(courseContent: any): string[] {
  const recommendations = [];
  const objectives = courseContent.learningObjectives || [];
  
  if (objectives.length === 0) {
    recommendations.push('Define 5-8 specific learning objectives using action verbs');
    recommendations.push('Ensure objectives are measurable and aligned with course assessments');
  } else if (objectives.length < 3) {
    recommendations.push('Add more learning objectives to comprehensively cover course content');
  }
  
  recommendations.push('Use Bloom\'s taxonomy verbs to create objectives at different cognitive levels');
  recommendations.push('Make objectives specific, measurable, achievable, relevant, and time-bound (SMART)');
  
  return recommendations;
}

function generateCategoryFeedback(courseContent: any): string {
  const category = courseContent.category;
  if (category === 'Uncategorized') {
    return 'Course needs proper categorization for discoverability and market positioning.';
  }
  return `Course is categorized as ${category}. Ensure this aligns with content and target audience.`;
}

function assessMarketFit(courseContent: any): string {
  const category = courseContent.category;
  if (category === 'Uncategorized') {
    return 'Cannot assess market fit without proper categorization';
  }
  
  // Simple market fit assessment based on category
  const highDemandCategories = ['Technology', 'Business', 'Data Science', 'Marketing', 'Design'];
  const isHighDemand = highDemandCategories.some(cat => category.includes(cat));
  
  return isHighDemand ? 'Good market fit - high demand category' : 'Moderate market fit - consider niche positioning';
}

function generateCategoryRecommendations(courseContent: any): string[] {
  const recommendations = [];
  if (courseContent.category === 'Uncategorized') {
    recommendations.push('Select an appropriate category that matches your course content');
    recommendations.push('Research competitor courses in your chosen category');
  }
  recommendations.push('Verify your category choice aligns with learner expectations');
  return recommendations;
}

function generatePricingFeedback(courseContent: any): string {
  const price = courseContent.price;
  if (price === null || price === undefined) {
    return 'Pricing strategy not defined. Consider your target audience, competition, and value proposition.';
  }
  if (price === 0) {
    return 'Free course strategy can increase enrollment but may affect perceived value.';
  }
  return `Course priced at $${price}. Ensure pricing reflects course value and market positioning.`;
}

function analyzePricingStrategy(courseContent: any): string {
  const price = courseContent.price;
  if (price === null) return 'No pricing strategy defined';
  if (price === 0) return 'Free strategy for maximum reach';
  if (price < 50) return 'Low-price strategy for accessibility';
  if (price < 200) return 'Moderate pricing for value-conscious learners';
  return 'Premium pricing strategy';
}

function generatePricingRecommendations(courseContent: any): string[] {
  const recommendations = [];
  const price = courseContent.price;
  
  if (price === null) {
    recommendations.push('Research competitor pricing in your category');
    recommendations.push('Consider value-based pricing aligned with learning outcomes');
  }
  recommendations.push('Test different price points to optimize revenue');
  recommendations.push('Consider offering payment plans or tiered pricing');
  
  return recommendations;
}

function generateImageFeedback(courseContent: any): string {
  if (!courseContent.hasImage) {
    return 'Course image missing. A compelling image increases enrollment by up to 40%.';
  }
  return 'Course image uploaded. Ensure it\'s high-quality and represents course content effectively.';
}

function generateImageRecommendations(courseContent: any): string[] {
  const recommendations = [];
  if (!courseContent.hasImage) {
    recommendations.push('Add a professional course image that represents your content');
    recommendations.push('Use high-resolution images (minimum 1200x675px)');
  }
  recommendations.push('Ensure image includes relevant visual elements for your topic');
  recommendations.push('Test different images to see which performs better');
  return recommendations;
}

function generateChaptersFeedback(courseContent: any): string {
  const count = courseContent.chaptersCount;
  if (count === 0) {
    return 'No chapters created. Course structure is essential for organized learning.';
  }
  if (count < 3) {
    return 'Consider adding more chapters for comprehensive coverage.';
  }
  if (count > 15) {
    return 'Many chapters - ensure each has substantial content and clear learning outcomes.';
  }
  return `${count} chapters created. Good structure for comprehensive learning.`;
}

function analyzeChapterStructure(courseContent: any): string {
  const chapters = courseContent.chapters || [];
  if (chapters.length === 0) return 'No structure to analyze';
  
  const sectionsPerChapter = chapters.map((ch: any) => ch.sectionsCount || 0);
  const avgSections = sectionsPerChapter.reduce((a: number, b: number) => a + b, 0) / chapters.length;
  
  return `Average ${avgSections.toFixed(1)} sections per chapter. ${chapters.length} total chapters.`;
}

function generateChaptersRecommendations(courseContent: any): string[] {
  const recommendations = [];
  const count = courseContent.chaptersCount;
  
  if (count === 0) {
    recommendations.push('Create 5-8 chapters with clear learning progression');
    recommendations.push('Each chapter should have 3-5 sections for optimal learning');
  } else if (count < 3) {
    recommendations.push('Add more chapters to provide comprehensive coverage');
  }
  
  recommendations.push('Ensure logical flow between chapters');
  recommendations.push('Include learning objectives for each chapter');
  
  return recommendations;
}

function generateResourcesFeedback(courseContent: any): string {
  const count = courseContent.attachmentsCount;
  if (count === 0) {
    return 'No resources attached. Additional materials enhance learning effectiveness.';
  }
  return `${count} resources attached. Ensure they\'re relevant and add value to learning.`;
}

function analyzeResourceAdequacy(courseContent: any): string {
  const count = courseContent.attachmentsCount;
  const chaptersCount = courseContent.chaptersCount;
  
  if (count === 0) return 'No resources available';
  if (chaptersCount === 0) return 'Resources available but no chapter structure';
  
  const resourcesPerChapter = count / chaptersCount;
  if (resourcesPerChapter < 1) return 'Consider adding more resources per chapter';
  if (resourcesPerChapter > 5) return 'Many resources - ensure quality over quantity';
  
  return `Good resource distribution: ${resourcesPerChapter.toFixed(1)} resources per chapter`;
}

function generateResourcesRecommendations(courseContent: any): string[] {
  const recommendations = [];
  const count = courseContent.attachmentsCount;
  
  if (count === 0) {
    recommendations.push('Add relevant resources like PDFs, worksheets, or reference materials');
    recommendations.push('Include practical exercises and templates');
  }
  
  recommendations.push('Organize resources by chapter or topic');
  recommendations.push('Ensure all resources are accessible and properly formatted');
  
  return recommendations;
}

function calculateContentDepth(courseContent: any): number {
  let score = 0;
  
  // Title and description depth
  if (courseContent.title && courseContent.title.length > 20) score += 10;
  if (courseContent.description && courseContent.description.length > 200) score += 15;
  
  // Learning objectives depth
  const objectives = courseContent.learningObjectives || [];
  if (objectives.length >= 5) score += 20;
  
  // Chapter depth
  if (courseContent.chaptersCount >= 5) score += 25;
  if (courseContent.sectionsCount >= 15) score += 20;
  
  // Resource depth
  if (courseContent.attachmentsCount >= 3) score += 10;
  
  return Math.min(score, 100);
}

function calculateStructureQuality(courseContent: any): number {
  let score = 0;
  
  // Basic structure
  if (courseContent.chaptersCount > 0) score += 30;
  if (courseContent.sectionsCount > 0) score += 20;
  
  // Structure balance
  if (courseContent.chaptersCount >= 3 && courseContent.chaptersCount <= 12) score += 20;
  
  // Section distribution
  const avgSectionsPerChapter = courseContent.chaptersCount > 0 
    ? courseContent.sectionsCount / courseContent.chaptersCount 
    : 0;
  if (avgSectionsPerChapter >= 2 && avgSectionsPerChapter <= 6) score += 15;
  
  // Learning objectives alignment
  const objectives = courseContent.learningObjectives || [];
  if (objectives.length >= 3) score += 15;
  
  return Math.min(score, 100);
}

function calculateEngagementPotential(courseContent: any): number {
  let score = 0;
  
  // Content variety
  if (courseContent.chaptersCount > 0) score += 20;
  if (courseContent.attachmentsCount > 0) score += 15;
  
  // Description engagement
  if (courseContent.description && courseContent.description.length > 150) score += 15;
  
  // Visual appeal
  if (courseContent.hasImage) score += 20;
  
  // Learning objectives clarity
  const objectives = courseContent.learningObjectives || [];
  if (objectives.length >= 3) score += 15;
  
  // Course structure
  if (courseContent.sectionsCount >= 10) score += 15;
  
  return Math.min(score, 100);
}

function calculateMarketReadiness(courseContent: any): number {
  let score = 0;
  
  // Essential elements
  if (courseContent.title) score += 15;
  if (courseContent.description && courseContent.description.length > 100) score += 15;
  if (courseContent.hasImage) score += 15;
  if (courseContent.category !== 'Uncategorized') score += 15;
  if (courseContent.price !== null) score += 10;
  
  // Content readiness
  if (courseContent.chaptersCount >= 3) score += 15;
  if (courseContent.sectionsCount >= 8) score += 10;
  
  // Learning objectives
  const objectives = courseContent.learningObjectives || [];
  if (objectives.length >= 3) score += 5;
  
  return Math.min(score, 100);
}

function generateFallbackBloomsAnalysis(courseContent: any): any {
  const objectives = courseContent.learningObjectives || [];
  const distribution = {
    REMEMBER: 20,
    UNDERSTAND: 25,
    APPLY: 25,
    ANALYZE: 15,
    EVALUATE: 10,
    CREATE: 5
  };
  
  // Generate chapter analysis based on available data
  const chapterAnalysis = courseContent.chapters.map((chapter: any) => ({
    chapterId: chapter.id || Math.random().toString(),
    chapterTitle: chapter.title,
    bloomsDistribution: distribution,
    primaryLevel: 'UNDERSTAND' as const,
    cognitiveDepth: 65,
    sections: chapter.sections?.map((section: any) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      bloomsLevel: 'UNDERSTAND' as const,
      activities: [],
      learningObjectives: []
    })) || []
  }));
  
  return {
    distribution,
    cognitiveDepth: 65,
    balance: 'bottom-heavy' as const,
    chapterAnalysis,
    learningPathway: {
      current: {
        stages: [],
        currentStage: 1,
        completionPercentage: 40
      },
      recommended: {
        stages: [],
        currentStage: 0,
        completionPercentage: 0
      },
      gaps: []
    },
    recommendations: {
      contentAdjustments: [
        {
          type: 'add' as const,
          bloomsLevel: 'CREATE' as const,
          description: 'Add project-based learning activities',
          impact: 'high' as const
        }
      ],
      assessmentChanges: [],
      activitySuggestions: []
    },
    studentImpact: {
      skillsDeveloped: [],
      cognitiveGrowth: {
        currentLevel: 65,
        projectedLevel: 85,
        timeframe: '3-6 months',
        keyMilestones: []
      },
      careerAlignment: []
    }
  };
}

function generateFallbackMarketAnalysis(courseContent: any): any {
  return {
    demandLevel: 'medium',
    competitionLevel: 'moderate',
    priceRecommendation: {
      suggested: 99,
      range: { min: 49, max: 199 }
    },
    marketPosition: 'developing',
    growthPotential: 65
  };
}

function generateBloomsInsights(distribution: any, samAnalysis: any): any {
  // Convert distribution keys to uppercase if needed
  const normalizedDist: Record<string, number> = {};
  Object.entries(distribution).forEach(([key, value]) => {
    normalizedDist[key.toUpperCase()] = value as number;
  });
  
  // Find dominant level
  let dominantLevel = 'UNDERSTAND';
  let maxPercentage = 0;
  Object.entries(normalizedDist).forEach(([level, percentage]) => {
    if (percentage > maxPercentage) {
      maxPercentage = percentage;
      dominantLevel = level;
    }
  });
  
  // Find missing levels (less than 5%)
  const missingLevels: string[] = [];
  ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'].forEach(level => {
    if ((normalizedDist[level] || 0) < 5) {
      missingLevels.push(level);
    }
  });
  
  // Calculate balance score
  const idealDistribution = {
    REMEMBER: 10,
    UNDERSTAND: 20,
    APPLY: 25,
    ANALYZE: 20,
    EVALUATE: 15,
    CREATE: 10
  };
  
  let balanceScore = 100;
  Object.entries(idealDistribution).forEach(([level, ideal]) => {
    const actual = normalizedDist[level] || 0;
    const diff = Math.abs(actual - ideal);
    balanceScore -= diff * 0.5; // Deduct 0.5 points per percentage point difference
  });
  balanceScore = Math.max(0, Math.round(balanceScore));
  
  // Generate improvement suggestions
  const improvementSuggestions: string[] = [];
  if ((normalizedDist.REMEMBER || 0) > 20) {
    improvementSuggestions.push('Reduce memorization-focused content');
  }
  if ((normalizedDist.CREATE || 0) < 10) {
    improvementSuggestions.push('Add more creative projects and synthesis activities');
  }
  if ((normalizedDist.EVALUATE || 0) < 10) {
    improvementSuggestions.push('Include more critical evaluation and judgment tasks');
  }
  if (balanceScore < 70) {
    improvementSuggestions.push('Rebalance activities across all cognitive levels');
  }
  
  return {
    dominantLevel,
    missingLevels,
    balanceScore,
    improvementSuggestions
  };
}

function generateInsights(analysis: any, samAnalysis: any): string[] {
  const insights = [];
  const dist = analysis.overallDistribution || {};
  
  // Check for imbalances
  if ((dist.remember || 0) + (dist.understand || 0) > 60) {
    insights.push('Course is heavily focused on lower-order thinking skills');
  }
  
  if ((dist.create || 0) < 10) {
    insights.push('Limited opportunities for creative synthesis and original work');
  }
  
  if ((dist.evaluate || 0) < 15) {
    insights.push('Students need more opportunities to develop critical judgment');
  }
  
  if (analysis.scores?.balance < 70) {
    insights.push('Consider rebalancing content across all Bloom\'s levels');
  }
  
  // Add SAM-powered insights
  if (samAnalysis?.qualityAnalysis?.overallScore < 70) {
    insights.push('Course quality metrics suggest need for content enhancement');
  }
  
  if (samAnalysis?.marketAnalysis?.demandLevel === 'low') {
    insights.push('Market analysis indicates low demand - consider repositioning');
  }
  
  return insights;
}

function generateImprovementPlan(analysis: any, samAnalysis: any): any {
  const recommendations = analysis.recommendations || [];
  
  return {
    immediate: recommendations.filter((r: any) => r.priority === 'critical' || r.priority === 'high'),
    shortTerm: recommendations.filter((r: any) => r.priority === 'medium'),
    longTerm: recommendations.filter((r: any) => r.priority === 'low'),
    timeline: '4-6 weeks for full implementation',
    samPoweredActions: [
      'Run comprehensive Bloom\'s analysis',
      'Optimize market positioning',
      'Enhance content quality metrics'
    ]
  };
}