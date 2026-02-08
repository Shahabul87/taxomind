import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiClient } from '@/lib/ai/enterprise-client';
import { handleAIAccessError } from '@/lib/ai/route-helper';
import { logger } from '@/lib/logger';
import {
  createEnhancedDepthAnalysisEngine,
  deterministicRubricEngine,
  deepContentAnalyzer,
  distributionAnalyzer,
  generateCourseContentHash,
  getCitationString,
  getValidatedDistribution,
  olcEvaluator,
  qmEvaluator,
  serializeAnalysisResult,
  transcriptAnalyzer,
  type BloomsDistribution as EnhancedBloomsDistribution,
  type CourseAnalysisInput,
  type CourseData,
  type ChapterData,
  type SectionData,
  type ContentSource,
  type CourseTranscriptAnalysisResult,
  type DeepContentAnalysisResult,
  type DeterministicAnalysisResult,
  type DistributionAnalysisResult,
  type EnhancedDepthAnalysisResponse,
  type OLCEvaluationResult,
  type QMEvaluationResult,
  type TranscriptSource,
} from '@sam-ai/educational/depth-analysis';
import type { Prisma, BloomsLevel, QuestionType } from '@prisma/client';
import { PrismaCourseDepthAnalysisStore } from '@/lib/adapters';

const enhancedDepthEngine = createEnhancedDepthAnalysisEngine({
  storage: new PrismaCourseDepthAnalysisStore(),
  logger,
});

// Type for exam question options from JSON field
interface ExamQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// Type for the course with all relations included
type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    category: true;
    chapters: {
      include: {
        sections: {
          include: {
            exams: {
              include: {
                ExamQuestion: true;
              };
            };
            Question: true;
          };
        };
      };
    };
    attachments: true;
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

// Legacy SAM analysis for backward compatibility with AI-enhanced analysis
interface LegacySAMAnalysis {
  bloomsAnalysis: FallbackBloomsAnalysis | Record<string, unknown>;
  marketAnalysis: FallbackMarketAnalysis | Record<string, unknown>;
  qualityAnalysis: QualityMetrics | Record<string, unknown>;
  completionAnalysis: CompletionAnalysis | Record<string, unknown>;
}

// Forward declarations for types defined later
interface FallbackBloomsAnalysis {
  distribution: Record<string, number>;
  cognitiveDepth: number;
  balance: 'bottom-heavy' | 'top-heavy' | 'well-balanced';
  chapterAnalysis: Array<{
    chapterId: string;
    chapterTitle: string;
    bloomsDistribution: Record<string, number>;
    primaryLevel: string;
    cognitiveDepth: number;
    sections: Array<{
      sectionId: string;
      sectionTitle: string;
      bloomsLevel: string;
      activities: unknown[];
      learningObjectives: unknown[];
    }>;
  }>;
  learningPathway: {
    current: { stages: unknown[]; currentStage: number; completionPercentage: number };
    recommended: { stages: unknown[]; currentStage: number; completionPercentage: number };
    gaps: unknown[];
  };
  recommendations: {
    contentAdjustments: Array<{ type: string; bloomsLevel: string; description: string; impact: string }>;
    assessmentChanges: unknown[];
    activitySuggestions: unknown[];
  };
  studentImpact: {
    skillsDeveloped: unknown[];
    cognitiveGrowth: { currentLevel: number; projectedLevel: number; timeframe: string; keyMilestones: unknown[] };
    careerAlignment: unknown[];
  };
}

interface FallbackMarketAnalysis {
  demandLevel: string;
  competitionLevel: string;
  priceRecommendation: { suggested: number; range: { min: number; max: number } };
  marketPosition: string;
  growthPotential: number;
}

async function integrateSAMEngineAnalysis(courseContent: LegacyCourseContent): Promise<LegacySAMAnalysis> {
  const samAnalysis: LegacySAMAnalysis = {
    bloomsAnalysis: {},
    marketAnalysis: {},
    qualityAnalysis: {},
    completionAnalysis: {},
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

    // These don&apos;t require external API calls
    samAnalysis.qualityAnalysis = await analyzeQuality(courseContent);
    samAnalysis.completionAnalysis = analyzeCompletion(courseContent);
  } catch (error) {
    logger.error('SAM engine integration error:', error);
    // Use fallback analyses
    samAnalysis.bloomsAnalysis = generateFallbackBloomsAnalysis(courseContent);
    samAnalysis.marketAnalysis = generateFallbackMarketAnalysis(courseContent);
    samAnalysis.qualityAnalysis = await analyzeQuality(courseContent);
    samAnalysis.completionAnalysis = analyzeCompletion(courseContent);
  }

  return samAnalysis;
}

// Type definitions for legacy course content
interface LegacyCourseContent {
  title: string;
  description: string;
  learningObjectives: string[];
  category: string;
  price: number;
  priceType: string;
  hasImage: boolean;
  imageUrl: string | null;
  isPublished: boolean;
  completionStatus: Record<string, boolean>;
  completionPercentage: number;
  completedSections: number;
  totalSections: number;
  readinessScore: number;
  chaptersCount: number;
  sectionsCount: number;
  attachmentsCount: number;
  chapters: LegacyChapter[];
  resources: LegacyResource[];
  creator: { name: string; email: string | null };
  courseId: string;
}

interface LegacyChapter {
  title: string;
  description: string;
  learningOutcome: string;
  isPublished: boolean;
  isFree: boolean;
  position: number;
  sectionsCount: number;
  sections: LegacySection[];
}

interface LegacySection {
  title: string;
  position: number;
  isPublished: boolean;
}

interface LegacyResource {
  name: string;
  url: string;
  type: string;
}

// SAM Blooms Analysis Engine Integration - Using Unified Engine
async function analyzeBlooms(courseContent: LegacyCourseContent): Promise<FallbackBloomsAnalysis | Record<string, unknown>> {
  try {
    // Use the unified Bloom's engine from @sam-ai/educational
    const { createUnifiedBloomsEngine } = await import('@sam-ai/educational');
    const { getSAMConfig, getDatabaseAdapter } = await import('@/lib/adapters');

    const engine = createUnifiedBloomsEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600,
    });

    // Transform LegacyCourseContent to UnifiedCourseInput
    const courseInput = {
      id: courseContent.courseId,
      title: courseContent.title,
      description: courseContent.description,
      chapters: courseContent.chapters.map((chapter, chapterIndex) => ({
        id: `chapter-${chapterIndex}-${chapter.title.replace(/\s+/g, '-').toLowerCase()}`,
        title: chapter.title,
        position: chapter.position,
        sections: chapter.sections.map((section, sectionIndex) => ({
          id: `section-${sectionIndex}-${section.title.replace(/\s+/g, '-').toLowerCase()}`,
          title: section.title,
          content: chapter.description || '', // Use chapter description as content fallback
          description: chapter.learningOutcome || '', // Use learning outcome as description
          learningObjectives: [], // Legacy type doesn't have learning objectives
        })),
      })),
    };

    // Perform comprehensive analysis
    const analysis = await engine.analyzeCourse(courseInput, {
      depth: 'detailed',
      includeRecommendations: true,
      mode: 'standard',
    });

    // Transform UnifiedCourseResult to FallbackBloomsAnalysis format
    return {
      distribution: analysis.courseLevel.distribution,
      cognitiveDepth: analysis.courseLevel.cognitiveDepth,
      balance: analysis.courseLevel.balance,
      chapterAnalysis: analysis.chapters.map((ch) => ({
        chapterId: ch.chapterId,
        chapterTitle: ch.chapterTitle,
        bloomsDistribution: ch.distribution,
        primaryLevel: ch.primaryLevel,
        cognitiveDepth: ch.cognitiveDepth,
        sections: ch.sections.map((s) => ({
          sectionId: s.id,
          sectionTitle: s.title,
          bloomsLevel: s.level,
          activities: [],
          learningObjectives: [],
        })),
      })),
      learningPathway: analysis.learningPathway ? {
        current: {
          stages: analysis.learningPathway.stages.map((s) => ({
            level: s.level,
            mastery: s.mastery,
            activities: s.activities,
            timeEstimate: s.timeEstimate,
          })),
          currentStage: 0,
          completionPercentage: 0,
        },
        recommended: {
          stages: analysis.learningPathway.stages,
          currentStage: 0,
          completionPercentage: 100,
        },
        gaps: [],
      } : {
        current: { stages: [], currentStage: 0, completionPercentage: 0 },
        recommended: { stages: [], currentStage: 0, completionPercentage: 0 },
        gaps: [],
      },
      recommendations: {
        contentAdjustments: analysis.recommendations
          .filter((r) => r.type === 'content')
          .map((r) => ({
            type: 'modify' as const,
            bloomsLevel: r.targetLevel,
            description: r.description,
            impact: r.priority === 'high' ? 'high' : r.priority === 'medium' ? 'medium' : 'low',
          })),
        assessmentChanges: analysis.recommendations
          .filter((r) => r.type === 'assessment')
          .map((r) => ({
            type: 'add_questions',
            bloomsLevel: r.targetLevel,
            description: r.description,
            examples: r.examples || [],
          })),
        activitySuggestions: analysis.recommendations
          .filter((r) => r.type === 'activity')
          .map((r) => ({
            bloomsLevel: r.targetLevel,
            activityType: 'practice',
            description: r.description,
            implementation: r.description,
            expectedOutcome: r.expectedImpact || 'Improved learning outcomes',
          })),
      },
      studentImpact: {
        skillsDeveloped: [],
        cognitiveGrowth: {
          currentLevel: analysis.courseLevel.cognitiveDepth,
          projectedLevel: Math.min(100, analysis.courseLevel.cognitiveDepth + 15),
          timeframe: '4 weeks',
          keyMilestones: ['Complete foundational content', 'Practice with exercises', 'Apply knowledge'],
        },
        careerAlignment: [],
      },
      chapterInsights: analysis.chapters.map((ch) => ({
        id: ch.chapterId,
        title: ch.chapterTitle,
        primaryLevel: ch.primaryLevel,
        score: ch.cognitiveDepth,
        distribution: ch.distribution,
        sections: ch.sections,
      })),
    };
  } catch (error) {
    logger.error('SAM Blooms analysis failed:', error);
  }

  return generateFallbackBloomsAnalysis(courseContent);
}

// SAM Market Analysis Engine Integration
async function analyzeMarket(courseContent: LegacyCourseContent): Promise<FallbackMarketAnalysis | Record<string, unknown>> {
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
  } catch (error) {
    logger.error('SAM Market analysis failed:', error);
  }

  return generateFallbackMarketAnalysis(courseContent);
}

// SAM Quality Analysis Engine Integration
interface QualityMetrics {
  contentDepth: number;
  structureQuality: number;
  completionScore: number;
  engagementPotential: number;
  marketReadiness: number;
  overallScore: number;
}

async function analyzeQuality(courseContent: LegacyCourseContent): Promise<QualityMetrics> {
  const qualityMetrics: QualityMetrics = {
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
interface CompletionSection {
  completed: boolean;
  score: number;
  feedback: string;
  recommendations: string[];
}

interface CompletionSectionWithExtra extends CompletionSection {
  bloomsAlignment?: string;
  marketFit?: string;
  marketAnalysis?: string;
  structureAnalysis?: string;
  adequacyAnalysis?: string;
}

interface CompletionAnalysis {
  titleDescription: CompletionSection;
  learningObjectives: CompletionSectionWithExtra;
  category: CompletionSectionWithExtra;
  pricing: CompletionSectionWithExtra;
  courseImage: CompletionSection;
  chapters: CompletionSectionWithExtra;
  resources: CompletionSectionWithExtra;
}

function analyzeCompletion(courseContent: LegacyCourseContent): CompletionAnalysis {
  const completionAnalysis: CompletionAnalysis = {
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

// GET endpoint to check for saved analysis without running full analysis
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // Check if the course exists and belongs to the user
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        userId: true,
        title: true,
        chapters: {
          select: {
            id: true,
            sections: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch existing analysis
    const existingAnalysis = await db.courseBloomsAnalysis.findUnique({
      where: { courseId },
      select: {
        id: true,
        courseId: true,
        bloomsDistribution: true,
        cognitiveDepth: true,
        learningPathway: true,
        skillsMatrix: true,
        gapAnalysis: true,
        recommendations: true,
        contentHash: true,
        analyzedAt: true,
      }
    });

    if (!existingAnalysis) {
      return NextResponse.json({
        success: true,
        hasSavedAnalysis: false,
        message: 'No saved analysis found for this course'
      });
    }

    // Generate current content hash to check if it's still valid
    const fullCourse = await db.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        chapters: {
          orderBy: { position: 'asc' },
          include: {
            sections: {
              orderBy: { position: 'asc' },
              include: {
                exams: { include: { ExamQuestion: true } },
                Question: true,
              }
            }
          }
        },
        attachments: true,
      }
    });

    const currentContentHash = fullCourse
      ? generateCourseContentHash(fullCourse as unknown as CourseData)
      : null;
    const isStale = currentContentHash !== existingAnalysis.contentHash;

    // Normalize the distribution for response
    const normalizedDistribution = normalizeBloomsDistribution(existingAnalysis.bloomsDistribution as Record<string, number>);

    // Calculate total stats
    const totalChapters = course.chapters.length;
    const totalSections = course.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);

    return NextResponse.json({
      success: true,
      hasSavedAnalysis: true,
      isStale,
      savedAnalysis: {
        id: existingAnalysis.id,
        courseId: existingAnalysis.courseId,
        analyzedAt: existingAnalysis.analyzedAt,
        cognitiveDepth: existingAnalysis.cognitiveDepth,
        analysis: {
          overallDistribution: normalizedDistribution,
          chapterAnalysis: [],
          objectivesAnalysis: [],
          scores: {
            depth: existingAnalysis.cognitiveDepth ?? 0,
            balance: 70,
            complexity: 75,
            completeness: 0
          },
          gaps: existingAnalysis.gapAnalysis as Array<{ level: string; severity: string; description: string }> ?? [],
          recommendations: existingAnalysis.recommendations as Array<{ priority: string; type: string; title: string; description: string; examples: string[] }> ?? [],
          bloomsInsights: {
            dominantLevel: Object.entries(normalizedDistribution).reduce((a, b) => a[1] > b[1] ? a : b)[0],
            missingLevels: Object.entries(normalizedDistribution).filter(([, v]) => v < 5).map(([k]) => k),
            balanceScore: 70,
            improvementSuggestions: []
          },
          metadata: {
            analyzedAt: existingAnalysis.analyzedAt?.toISOString(),
            courseId,
            totalChapters,
            totalSections,
            cached: true,
            contentHash: existingAnalysis.contentHash
          }
        }
      }
    });

  } catch (error) {
    logger.error('Error checking saved analysis:', error);
    return NextResponse.json({
      error: 'Failed to check saved analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      courseId,
      forceReanalyze = false,
      useEnhancedEngine = true,  // CHANGED: Default to deterministic engine
      useDeterministicEngine = true,  // NEW: Enable deterministic rubric analysis
      useLLMEnhancement = false,  // NEW: Optional LLM enhancement on top of deterministic
      analysisDepth = 'detailed',
      analysisLevel = 'course',  // NEW: Support for course/chapter/section level analysis
      targetId,  // NEW: ID of the specific chapter or section to analyze
    } = await req.json() as {
      courseId: string;
      forceReanalyze?: boolean;
      useEnhancedEngine?: boolean;
      useDeterministicEngine?: boolean;
      useLLMEnhancement?: boolean;
      analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
      analysisLevel?: 'course' | 'chapter' | 'section';
      targetId?: string;
    };

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
              },
              include: {
                exams: {
                  include: {
                    ExamQuestion: true
                  }
                },
                Question: true,
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
    }) as CourseWithRelations | null;

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Validate targetId for chapter/section analysis
    if (analysisLevel !== 'course' && !targetId) {
      return NextResponse.json({
        error: `targetId is required for ${analysisLevel} level analysis`
      }, { status: 400 });
    }

    // Filter course data based on analysis level
    let filteredCourse = course;
    let targetChapter = null;
    let targetSection = null;

    if (analysisLevel === 'chapter' && targetId) {
      targetChapter = course.chapters.find(ch => ch.id === targetId);
      if (!targetChapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      }
      // Filter to just this chapter
      filteredCourse = {
        ...course,
        chapters: [targetChapter],
      };
      logger.info(`[API] Analyzing chapter: ${targetChapter.title} (${targetId})`);
    } else if (analysisLevel === 'section' && targetId) {
      // Find the section and its parent chapter
      for (const ch of course.chapters) {
        const section = ch.sections.find(s => s.id === targetId);
        if (section) {
          targetChapter = ch;
          targetSection = section;
          break;
        }
      }
      if (!targetSection || !targetChapter) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }
      // Filter to just this section
      filteredCourse = {
        ...course,
        chapters: [{
          ...targetChapter,
          sections: [targetSection],
        }],
      };
      logger.info(`[API] Analyzing section: ${targetSection.title} (${targetId})`);
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

    // Use Enhanced Depth Analysis Engine if requested
    if (useEnhancedEngine) {
      logger.info(`[API] Using Enhanced Depth Engine for course: ${courseId}`);

      // Transform course data to enhanced engine format (using filteredCourse for chapter/section analysis)
      const enhancedCourseData: CourseData = {
        id: filteredCourse.id,
        title: filteredCourse.title ?? 'Untitled Course',
        description: filteredCourse.description,
        whatYouWillLearn: filteredCourse.whatYouWillLearn ?? [],
        categoryId: filteredCourse.categoryId ?? null,
        price: filteredCourse.price ?? null,
        category: filteredCourse.category ? { name: filteredCourse.category.name } : null,
        chapters: filteredCourse.chapters.map((ch): ChapterData => ({
          id: ch.id,
          title: ch.title ?? 'Untitled Chapter',
          description: ch.description,
          learningOutcomes: ch.learningOutcomes,
          position: ch.position,
          sections: ch.sections.map((s): SectionData => ({
            id: s.id,
            title: s.title ?? 'Untitled Section',
            description: s.description,
            position: s.position,
            videoUrl: s.videoUrl,
            duration: s.duration,
            exams: s.exams?.map(exam => ({
              id: exam.id,
              title: exam.title ?? 'Assessment',
              ExamQuestion: exam.ExamQuestion?.map(q => {
                // Options is a JSON field, cast it properly
                const optionsData = (q.options as ExamQuestionOption[] | null) ?? [];
                return {
                  id: q.id,
                  text: q.question, // ExamQuestion uses 'question' field, not 'text'
                  type: String(q.questionType), // Convert enum to string
                  bloomsLevel: q.bloomsLevel ?? undefined,
                  explanation: q.explanation ?? undefined,
                  options: optionsData.map(o => ({
                    id: o.id ?? '',
                    text: o.text ?? '',
                    isCorrect: o.isCorrect ?? false,
                  })),
                };
              }),
            })),
            // Question model is simpler (has text field only, no options/bloomsLevel)
            Question: s.Question?.map(q => ({
              id: q.id,
              text: q.text,
              type: 'MULTIPLE_CHOICE',
              bloomsLevel: undefined,
              explanation: undefined,
              options: [],
            })),
          })),
        })),
        attachments: filteredCourse.attachments.map(att => ({
          id: att.id,
          name: att.name,
        })),
      };

      // ═══════════════════════════════════════════════════════════════
      // PHASE 1: DETERMINISTIC RUBRIC ENGINE (PRIMARY ANALYSIS)
      // ═══════════════════════════════════════════════════════════════
      let deterministicResult: DeterministicAnalysisResult | null = null;

      if (useDeterministicEngine) {
        logger.info(`[API] Running Deterministic Rubric Engine for ${analysisLevel}: ${targetId ?? courseId}`);

        // Transform to deterministic engine input format (using filteredCourse)
        const deterministicInput: CourseAnalysisInput = {
          courseId: filteredCourse.id,
          title: filteredCourse.title ?? 'Untitled Course',
          description: filteredCourse.description ?? undefined,
          imageUrl: filteredCourse.imageUrl ?? undefined,
          objectives: filteredCourse.whatYouWillLearn ?? [],
          chapters: filteredCourse.chapters.map(ch => ({
            id: ch.id,
            title: ch.title ?? 'Untitled Chapter',
            position: ch.position,
            learningOutcome: ch.learningOutcomes ?? undefined,
            sections: ch.sections.map(s => ({
              id: s.id,
              title: s.title ?? 'Untitled Section',
              position: s.position,
              videoUrl: s.videoUrl ?? undefined,
              description: s.description ?? undefined,
            })),
          })),
          assessments: filteredCourse.chapters.flatMap(ch =>
            ch.sections.flatMap(s =>
              (s.exams ?? []).map(exam => ({
                id: exam.id,
                title: exam.title ?? 'Assessment',
                type: 'quiz' as const,
                questions: (exam.ExamQuestion ?? []).map(q => {
                  const optionsData = (q.options as ExamQuestionOption[] | null) ?? [];
                  return {
                    id: q.id,
                    text: q.question,
                    type: String(q.questionType),
                    difficulty: undefined,
                    bloomsLevel: q.bloomsLevel ?? undefined,
                    explanation: q.explanation ?? undefined,
                    feedback: undefined,
                    options: optionsData.map(o => ({
                      id: o.id ?? '',
                      text: o.text ?? '',
                      isCorrect: o.isCorrect ?? false,
                    })),
                  };
                }),
              }))
            )
          ),
          attachments: filteredCourse.attachments.map(att => ({
            id: att.id,
            name: att.name,
            url: att.url,
          })),
        };

        // Run deterministic analysis
        deterministicResult = deterministicRubricEngine.analyze(deterministicInput);

        logger.info(`[API] Deterministic analysis complete. Score: ${deterministicResult.percentageScore}%`);

        // ═══════════════════════════════════════════════════════════════
        // QM AND OLC STANDARDS EVALUATION
        // ═══════════════════════════════════════════════════════════════
        logger.info(`[API] Running QM and OLC compliance evaluation for course: ${courseId}`);

        const qmResult = qmEvaluator.evaluate(deterministicInput);
        const olcResult = olcEvaluator.evaluate(deterministicInput);

        logger.info(`[API] QM Score: ${qmResult.percentageScore}%, OLC Score: ${olcResult.percentageScore}%`);

        // Store compliance results for later use
        (deterministicResult as DeterministicAnalysisResult & {
          qmCompliance?: QMEvaluationResult;
          olcCompliance?: OLCEvaluationResult;
          distributionAnalysis?: DistributionAnalysisResult;
        }).qmCompliance = qmResult;
        (deterministicResult as DeterministicAnalysisResult & {
          qmCompliance?: QMEvaluationResult;
          olcCompliance?: OLCEvaluationResult;
          distributionAnalysis?: DistributionAnalysisResult;
        }).olcCompliance = olcResult;
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 2: ENHANCED DEPTH ENGINE (ADDITIONAL ANALYSIS)
      // ═══════════════════════════════════════════════════════════════
      const enhancedAnalysis = await enhancedDepthEngine.analyze(enhancedCourseData, {
        forceReanalyze,
        includeHistoricalSnapshot: true,
        analysisDepth,
      });

      const normalizedAnalysis = mapEnhancedToLegacy(enhancedAnalysis);

      // ═══════════════════════════════════════════════════════════════
      // PHASE 3: DISTRIBUTION ANALYSIS (RESEARCH-VALIDATED)
      // ═══════════════════════════════════════════════════════════════
      let distributionResult: DistributionAnalysisResult | null = null;

      if (enhancedAnalysis.courseLevel?.bloomsDistribution) {
        logger.info(`[API] Running Distribution Analysis for course: ${courseId}`);

        // Transform Bloom's distribution to the format expected by distributionAnalyzer
        const bloomsDist = {
          REMEMBER: enhancedAnalysis.courseLevel.bloomsDistribution.REMEMBER ?? 0,
          UNDERSTAND: enhancedAnalysis.courseLevel.bloomsDistribution.UNDERSTAND ?? 0,
          APPLY: enhancedAnalysis.courseLevel.bloomsDistribution.APPLY ?? 0,
          ANALYZE: enhancedAnalysis.courseLevel.bloomsDistribution.ANALYZE ?? 0,
          EVALUATE: enhancedAnalysis.courseLevel.bloomsDistribution.EVALUATE ?? 0,
          CREATE: enhancedAnalysis.courseLevel.bloomsDistribution.CREATE ?? 0,
        };

        // Get DOK distribution if available
        const dokDist = enhancedAnalysis.courseLevel.dokDistribution ? {
          level1: enhancedAnalysis.courseLevel.dokDistribution.level1 ?? 0,
          level2: enhancedAnalysis.courseLevel.dokDistribution.level2 ?? 0,
          level3: enhancedAnalysis.courseLevel.dokDistribution.level3 ?? 0,
          level4: enhancedAnalysis.courseLevel.dokDistribution.level4 ?? 0,
        } : undefined;

        // Detect or use provided course type
        const courseType = enhancedAnalysis.courseLevel.courseType ?? 'intermediate';

        distributionResult = distributionAnalyzer.analyze(bloomsDist, courseType, dokDist);

        logger.info(`[API] Distribution Analysis complete. Alignment: ${distributionResult.alignmentScore}%, Rigor: ${distributionResult.cognitiveRigorScore}%`);

        // Store in extended result
        if (deterministicResult) {
          (deterministicResult as DeterministicAnalysisResult & {
            qmCompliance?: QMEvaluationResult;
            olcCompliance?: OLCEvaluationResult;
            distributionAnalysis?: DistributionAnalysisResult;
            deepContentAnalysis?: DeepContentAnalysisResult;
            transcriptAnalysis?: CourseTranscriptAnalysisResult;
          }).distributionAnalysis = distributionResult;
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 4: DEEP CONTENT ANALYSIS
      // ═══════════════════════════════════════════════════════════════
      let deepContentResult: DeepContentAnalysisResult | null = null;
      let transcriptResult: CourseTranscriptAnalysisResult | null = null;

      // Collect content sources from course data
      const contentSources: ContentSource[] = [];
      const transcriptSources: TranscriptSource[] = [];

      // Add course description as content source (use filteredCourse for chapter/section analysis)
      if (filteredCourse.description && filteredCourse.description.length >= 50) {
        contentSources.push({
          type: 'text',
          content: filteredCourse.description,
          metadata: {
            sourceId: `course-${courseId}-description`,
            title: 'Course Description',
            wordCount: filteredCourse.description.split(/\s+/).length,
          },
        });
      }

      // Collect chapter and section content (use filteredCourse for chapter/section analysis)
      for (const chapter of filteredCourse.chapters) {
        // Add chapter description if available
        if (chapter.description && chapter.description.length >= 50) {
          contentSources.push({
            type: 'lesson_content',
            content: chapter.description,
            metadata: {
              sourceId: `chapter-${chapter.id}-description`,
              chapterId: chapter.id,
              title: chapter.title,
              wordCount: chapter.description.split(/\s+/).length,
            },
          });
        }

        for (const section of chapter.sections) {
          // Add section description/content if available
          if (section.description && section.description.length >= 50) {
            contentSources.push({
              type: 'lesson_content',
              content: section.description,
              metadata: {
                sourceId: `section-${section.id}-description`,
                sectionId: section.id,
                chapterId: chapter.id,
                title: section.title,
                wordCount: section.description.split(/\s+/).length,
              },
            });
          }

          // Add video URL for transcript analysis
          if (section.videoUrl) {
            transcriptSources.push({
              videoUrl: section.videoUrl,
              sectionId: section.id,
              chapterId: chapter.id,
              sectionTitle: section.title,
              chapterTitle: chapter.title,
            });
          }

          // Add quiz questions as assessment content
          for (const exam of section.exams) {
            const examQuestions = exam.ExamQuestion;
            if (examQuestions && examQuestions.length > 0) {
              const quizContent = examQuestions
                .map(q => `Question: ${q.question}`)
                .join('\n\n');

              if (quizContent.length >= 50) {
                contentSources.push({
                  type: 'quiz',
                  content: quizContent,
                  metadata: {
                    sourceId: `exam-${exam.id}`,
                    sectionId: section.id,
                    chapterId: chapter.id,
                    title: exam.title ?? 'Quiz',
                    wordCount: quizContent.split(/\s+/).length,
                  },
                });
              }
            }
          }

          // Add standalone questions
          const questions = section.Question;
          if (questions && questions.length > 0) {
            const questionContent = questions
              .map(q => `Question: ${q.text}`)
              .join('\n\n');

            if (questionContent.length >= 50) {
              contentSources.push({
                type: 'quiz',
                content: questionContent,
                metadata: {
                  sourceId: `section-${section.id}-questions`,
                  sectionId: section.id,
                  chapterId: chapter.id,
                  title: 'Section Questions',
                  wordCount: questionContent.split(/\s+/).length,
                },
              });
            }
          }
        }
      }

      // Run deep content analysis if we have content
      if (contentSources.length > 0) {
        logger.info(`[API] Running Deep Content Analysis on ${contentSources.length} content sources`);

        try {
          deepContentResult = await deepContentAnalyzer.analyzeContent(contentSources);
          logger.info(`[API] Deep Content Analysis complete. Confidence: ${deepContentResult.overallConfidence}%`);

          // Store in extended result
          if (deterministicResult) {
            (deterministicResult as DeterministicAnalysisResult & {
              qmCompliance?: QMEvaluationResult;
              olcCompliance?: OLCEvaluationResult;
              distributionAnalysis?: DistributionAnalysisResult;
              deepContentAnalysis?: DeepContentAnalysisResult;
              transcriptAnalysis?: CourseTranscriptAnalysisResult;
            }).deepContentAnalysis = deepContentResult;
          }
        } catch (contentError) {
          logger.error(`[API] Deep Content Analysis error: ${contentError}`);
        }
      }

      // Run transcript analysis if we have video sources
      if (transcriptSources.length > 0) {
        logger.info(`[API] Running Transcript Analysis on ${transcriptSources.length} videos`);

        try {
          transcriptResult = await transcriptAnalyzer.analyzeCourseTranscripts(courseId, transcriptSources);
          logger.info(`[API] Transcript Analysis complete. Coverage: ${transcriptResult.transcriptCoveragePercent}%`);

          // Store in extended result
          if (deterministicResult) {
            (deterministicResult as DeterministicAnalysisResult & {
              qmCompliance?: QMEvaluationResult;
              olcCompliance?: OLCEvaluationResult;
              distributionAnalysis?: DistributionAnalysisResult;
              deepContentAnalysis?: DeepContentAnalysisResult;
              transcriptAnalysis?: CourseTranscriptAnalysisResult;
            }).transcriptAnalysis = transcriptResult;
          }
        } catch (transcriptError) {
          logger.error(`[API] Transcript Analysis error: ${transcriptError}`);
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // COMBINE RESULTS
      // ═══════════════════════════════════════════════════════════════
      const combinedResponse: Record<string, unknown> = {
        success: true,
        enhanced: true,
        analysisMethod: useDeterministicEngine ? 'deterministic_primary' : 'enhanced_only',
        analysis: normalizedAnalysis,
        rawEnhanced: enhancedAnalysis,
      };

      // Add deterministic results if available
      if (deterministicResult) {
        const extendedResult = deterministicResult as DeterministicAnalysisResult & {
          qmCompliance?: QMEvaluationResult;
          olcCompliance?: OLCEvaluationResult;
          distributionAnalysis?: DistributionAnalysisResult;
          deepContentAnalysis?: DeepContentAnalysisResult;
          transcriptAnalysis?: CourseTranscriptAnalysisResult;
        };

        combinedResponse.deterministic = serializeAnalysisResult(deterministicResult);
        combinedResponse.standards = {
          engineVersion: deterministicResult.engineVersion,
          rulesEvaluated: deterministicResult.metadata.rulesEvaluated,
          rulesPassed: deterministicResult.metadata.rulesPassed,
          rulesFailed: deterministicResult.metadata.rulesFailed,
          overallScore: deterministicResult.percentageScore,
          categoryScores: Object.fromEntries(
            Array.from(deterministicResult.categoryScores.entries()).map(([cat, score]) => [
              cat,
              {
                earned: score.earned,
                max: score.max,
                percentage: score.percentage,
              },
            ])
          ),
          prioritizedRecommendations: deterministicResult.recommendations.slice(0, 5).map(rec => ({
            priority: rec.priority,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            actionSteps: rec.actionSteps,
            source: rec.source ? {
              standard: rec.source.standard,
              id: rec.source.id,
              description: rec.source.description,
            } : undefined,
          })),
          researchCitations: getResearchCitationsUsed(deterministicResult),
        };

        // Add QM Compliance Results
        if (extendedResult.qmCompliance) {
          combinedResponse.qmCompliance = {
            overallScore: extendedResult.qmCompliance.percentageScore,
            essentialsMet: extendedResult.qmCompliance.essentialsMet,
            essentialsCount: extendedResult.qmCompliance.essentialsCount,
            qmCertifiable: extendedResult.qmCompliance.qmCertifiable,
            categoryScores: extendedResult.qmCompliance.categoryScores,
            topRecommendations: extendedResult.qmCompliance.recommendations.slice(0, 5).map(rec => ({
              standardId: rec.standardId,
              priority: rec.priority,
              title: rec.title,
              description: rec.description,
              isEssential: rec.isEssential,
              actionSteps: rec.actionSteps,
            })),
            standardsEvaluated: extendedResult.qmCompliance.standardResults.length,
            standardsMet: extendedResult.qmCompliance.standardResults.filter(r => r.status === 'met').length,
          };
        }

        // Add OLC Compliance Results
        if (extendedResult.olcCompliance) {
          combinedResponse.olcCompliance = {
            overallScore: extendedResult.olcCompliance.percentageScore,
            qualityLevel: extendedResult.olcCompliance.qualityLevel,
            categoryScores: extendedResult.olcCompliance.categoryScores,
            strengths: extendedResult.olcCompliance.strengths,
            areasForImprovement: extendedResult.olcCompliance.areasForImprovement,
            topRecommendations: extendedResult.olcCompliance.recommendations.slice(0, 5).map(rec => ({
              indicatorId: rec.indicatorId,
              category: rec.category,
              priority: rec.priority,
              currentLevel: rec.currentLevel,
              targetLevel: rec.targetLevel,
              actionSteps: rec.actionSteps,
            })),
          };
        }

        // Add combined compliance summary
        if (extendedResult.qmCompliance && extendedResult.olcCompliance) {
          combinedResponse.complianceSummary = {
            qmScore: extendedResult.qmCompliance.percentageScore,
            olcScore: extendedResult.olcCompliance.percentageScore,
            combinedScore: Math.round(
              (extendedResult.qmCompliance.percentageScore + extendedResult.olcCompliance.percentageScore) / 2
            ),
            qmCertifiable: extendedResult.qmCompliance.qmCertifiable,
            olcQualityLevel: extendedResult.olcCompliance.qualityLevel,
            criticalIssues: [
              ...extendedResult.qmCompliance.recommendations
                .filter(r => r.priority === 'critical')
                .map(r => ({ source: 'QM', ...r })),
              ...extendedResult.olcCompliance.recommendations
                .filter(r => r.priority === 'critical')
                .map(r => ({ source: 'OLC', ...r })),
            ].slice(0, 5),
          };
        }

        // Add Distribution Analysis Results (Phase 3)
        if (extendedResult.distributionAnalysis) {
          combinedResponse.distributionAnalysis = {
            courseType: extendedResult.distributionAnalysis.courseType,
            detectedType: extendedResult.distributionAnalysis.detectedType,
            typeConfidence: extendedResult.distributionAnalysis.typeConfidence,
            alignmentScore: extendedResult.distributionAnalysis.alignmentScore,
            cognitiveRigorScore: extendedResult.distributionAnalysis.cognitiveRigorScore,
            balanceAssessment: {
              type: extendedResult.distributionAnalysis.balanceAssessment.type,
              lowerOrder: extendedResult.distributionAnalysis.balanceAssessment.lowerOrder,
              middleOrder: extendedResult.distributionAnalysis.balanceAssessment.middleOrder,
              higherOrder: extendedResult.distributionAnalysis.balanceAssessment.higherOrder,
              idealRatio: extendedResult.distributionAnalysis.balanceAssessment.idealRatio,
              deviation: extendedResult.distributionAnalysis.balanceAssessment.deviation,
              recommendation: extendedResult.distributionAnalysis.balanceAssessment.recommendation,
            },
            cognitiveRigorMatrix: {
              dominantQuadrant: extendedResult.distributionAnalysis.cognitiveRigorMatrix.dominantQuadrant,
              coverage: extendedResult.distributionAnalysis.cognitiveRigorMatrix.coverage,
              balance: extendedResult.distributionAnalysis.cognitiveRigorMatrix.balance,
              recommendations: extendedResult.distributionAnalysis.cognitiveRigorMatrix.recommendations,
            },
            levelAnalysis: extendedResult.distributionAnalysis.levelAnalysis.map(level => ({
              level: level.level,
              actual: level.actual,
              target: level.target,
              deviation: level.deviation,
              status: level.status,
              percentile: level.percentile,
              actionRequired: level.actionRequired,
              suggestedActions: level.suggestedActions,
            })),
            dokAnalysis: {
              distribution: extendedResult.distributionAnalysis.dokAnalysis.distribution,
              targetDistribution: extendedResult.distributionAnalysis.dokAnalysis.targetDistribution,
              alignmentScore: extendedResult.distributionAnalysis.dokAnalysis.alignmentScore,
              dominantLevel: extendedResult.distributionAnalysis.dokAnalysis.dominantLevel,
              strategicThinkingPercent: extendedResult.distributionAnalysis.dokAnalysis.strategicThinkingPercent,
              recommendations: extendedResult.distributionAnalysis.dokAnalysis.recommendations,
            },
            statisticalConfidence: {
              sampleBasis: extendedResult.distributionAnalysis.statisticalConfidence.sampleBasis,
              confidenceLevel: extendedResult.distributionAnalysis.statisticalConfidence.confidenceLevel,
              marginOfError: extendedResult.distributionAnalysis.statisticalConfidence.marginOfError,
              effectSize: extendedResult.distributionAnalysis.statisticalConfidence.effectSize,
              interpretation: extendedResult.distributionAnalysis.statisticalConfidence.interpretation,
            },
            topRecommendations: extendedResult.distributionAnalysis.recommendations.slice(0, 5).map(rec => ({
              priority: rec.priority,
              level: rec.level,
              type: rec.type,
              description: rec.description,
              actionSteps: rec.actionSteps,
              researchSupport: rec.researchSupport,
              estimatedImpact: rec.estimatedImpact,
            })),
            researchBasis: {
              citation: extendedResult.distributionAnalysis.researchBasis.citation,
              applicability: extendedResult.distributionAnalysis.researchBasis.applicability,
              limitations: extendedResult.distributionAnalysis.researchBasis.limitations,
            },
          };
        }

        // Add Deep Content Analysis Results (Phase 4)
        if (extendedResult.deepContentAnalysis) {
          combinedResponse.deepContentAnalysis = {
            bloomsDistribution: extendedResult.deepContentAnalysis.bloomsDistribution,
            dokDistribution: extendedResult.deepContentAnalysis.dokDistribution,
            weightedBloomsDistribution: extendedResult.deepContentAnalysis.weightedBloomsDistribution,
            overallConfidence: extendedResult.deepContentAnalysis.overallConfidence,
            analysisMethod: extendedResult.deepContentAnalysis.analysisMethod,
            contentCoverage: {
              totalSources: extendedResult.deepContentAnalysis.contentCoverage.totalSources,
              analyzedSources: extendedResult.deepContentAnalysis.contentCoverage.analyzedSources,
              skippedSources: extendedResult.deepContentAnalysis.contentCoverage.skippedSources,
              totalWords: extendedResult.deepContentAnalysis.contentCoverage.totalWords,
              totalSentences: extendedResult.deepContentAnalysis.contentCoverage.totalSentences,
              averageWordsPerSentence: extendedResult.deepContentAnalysis.contentCoverage.averageWordsPerSentence,
              contentTypes: extendedResult.deepContentAnalysis.contentCoverage.contentTypes,
            },
            contextDistribution: extendedResult.deepContentAnalysis.contextDistribution,
            contentGaps: extendedResult.deepContentAnalysis.contentGaps.slice(0, 5).map(gap => ({
              type: gap.type,
              level: gap.level,
              context: gap.context,
              severity: gap.severity,
              description: gap.description,
              recommendation: gap.recommendation,
            })),
            topRecommendations: extendedResult.deepContentAnalysis.recommendations.slice(0, 5),
            verbFrequencySummary: extendedResult.deepContentAnalysis.verbFrequency.slice(0, 10).map(vf => ({
              verb: vf.verb,
              count: vf.count,
              level: vf.level,
            })),
            researchBasis: extendedResult.deepContentAnalysis.researchBasis,
          };
        }

        // Add Transcript Analysis Results (Phase 4)
        if (extendedResult.transcriptAnalysis) {
          combinedResponse.transcriptAnalysis = {
            totalVideos: extendedResult.transcriptAnalysis.totalVideos,
            videosWithTranscripts: extendedResult.transcriptAnalysis.videosWithTranscripts,
            videosAnalyzed: extendedResult.transcriptAnalysis.videosAnalyzed,
            videosMissingTranscripts: extendedResult.transcriptAnalysis.videosMissingTranscripts,
            transcriptCoveragePercent: extendedResult.transcriptAnalysis.transcriptCoveragePercent,
            totalWordCount: extendedResult.transcriptAnalysis.totalWordCount,
            totalDuration: extendedResult.transcriptAnalysis.totalDuration,
            averageWordsPerMinute: extendedResult.transcriptAnalysis.averageWordsPerMinute,
            averageConfidence: extendedResult.transcriptAnalysis.averageConfidence,
            qualityDistribution: extendedResult.transcriptAnalysis.qualityDistribution,
            recommendations: extendedResult.transcriptAnalysis.recommendations.slice(0, 5),
            aggregatedAnalysis: extendedResult.transcriptAnalysis.aggregatedAnalysis ? {
              bloomsDistribution: extendedResult.transcriptAnalysis.aggregatedAnalysis.bloomsDistribution,
              dokDistribution: extendedResult.transcriptAnalysis.aggregatedAnalysis.dokDistribution,
              overallConfidence: extendedResult.transcriptAnalysis.aggregatedAnalysis.overallConfidence,
            } : null,
          };
        }
      }

      // Add distribution result if available but no deterministic result
      if (distributionResult && !deterministicResult) {
        combinedResponse.distributionAnalysis = {
          courseType: distributionResult.courseType,
          detectedType: distributionResult.detectedType,
          typeConfidence: distributionResult.typeConfidence,
          alignmentScore: distributionResult.alignmentScore,
          cognitiveRigorScore: distributionResult.cognitiveRigorScore,
          balanceAssessment: distributionResult.balanceAssessment,
          cognitiveRigorMatrix: {
            dominantQuadrant: distributionResult.cognitiveRigorMatrix.dominantQuadrant,
            coverage: distributionResult.cognitiveRigorMatrix.coverage,
            balance: distributionResult.cognitiveRigorMatrix.balance,
            recommendations: distributionResult.cognitiveRigorMatrix.recommendations,
          },
          levelAnalysis: distributionResult.levelAnalysis,
          dokAnalysis: distributionResult.dokAnalysis,
          statisticalConfidence: distributionResult.statisticalConfidence,
          topRecommendations: distributionResult.recommendations.slice(0, 5),
          researchBasis: {
            citation: distributionResult.researchBasis.citation,
            applicability: distributionResult.researchBasis.applicability,
            limitations: distributionResult.researchBasis.limitations,
          },
        };
      }

      // Add deep content result if available but no deterministic result
      if (deepContentResult && !deterministicResult) {
        combinedResponse.deepContentAnalysis = {
          bloomsDistribution: deepContentResult.bloomsDistribution,
          dokDistribution: deepContentResult.dokDistribution,
          weightedBloomsDistribution: deepContentResult.weightedBloomsDistribution,
          overallConfidence: deepContentResult.overallConfidence,
          analysisMethod: deepContentResult.analysisMethod,
          contentCoverage: deepContentResult.contentCoverage,
          contextDistribution: deepContentResult.contextDistribution,
          contentGaps: deepContentResult.contentGaps.slice(0, 5),
          topRecommendations: deepContentResult.recommendations.slice(0, 5),
          researchBasis: deepContentResult.researchBasis,
        };
      }

      // Add transcript result if available but no deterministic result
      if (transcriptResult && !deterministicResult) {
        combinedResponse.transcriptAnalysis = {
          totalVideos: transcriptResult.totalVideos,
          videosWithTranscripts: transcriptResult.videosWithTranscripts,
          videosAnalyzed: transcriptResult.videosAnalyzed,
          videosMissingTranscripts: transcriptResult.videosMissingTranscripts,
          transcriptCoveragePercent: transcriptResult.transcriptCoveragePercent,
          totalWordCount: transcriptResult.totalWordCount,
          averageConfidence: transcriptResult.averageConfidence,
          qualityDistribution: transcriptResult.qualityDistribution,
          recommendations: transcriptResult.recommendations.slice(0, 5),
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // SAVE ANALYSIS TO DATABASE (for Recent Analyses feature)
      // ═══════════════════════════════════════════════════════════════
      if (enhancedAnalysis.courseLevel?.bloomsDistribution) {
        try {
          const currentContentHash = generateCourseContentHash(course as unknown as CourseData);

          await db.courseBloomsAnalysis.upsert({
            where: { courseId },
            update: {
              bloomsDistribution: enhancedAnalysis.courseLevel.bloomsDistribution,
              cognitiveDepth: normalizedAnalysis.scores?.depth ?? 0,
              learningPathway: normalizedAnalysis.learningPathway ?? {},
              skillsMatrix: enhancedAnalysis.studentImpact?.skillsDeveloped ?? [],
              gapAnalysis: normalizedAnalysis.gaps ?? [],
              recommendations: normalizedAnalysis.recommendations ?? [],
              contentHash: currentContentHash,
              analyzedAt: new Date(),
            },
            create: {
              courseId,
              bloomsDistribution: enhancedAnalysis.courseLevel.bloomsDistribution,
              cognitiveDepth: normalizedAnalysis.scores?.depth ?? 0,
              learningPathway: normalizedAnalysis.learningPathway ?? {},
              skillsMatrix: enhancedAnalysis.studentImpact?.skillsDeveloped ?? [],
              gapAnalysis: normalizedAnalysis.gaps ?? [],
              recommendations: normalizedAnalysis.recommendations ?? [],
              contentHash: currentContentHash,
              analyzedAt: new Date(),
            }
          });
          logger.info(`[API] Analysis saved to database for course: ${courseId}`);
        } catch (dbError) {
          logger.error(`[API] Failed to save analysis to database:`, dbError);
          // Don't fail the request if DB save fails - analysis still succeeded
        }
      }

      return NextResponse.json(combinedResponse);
    }

    // Generate content hash and check for existing analysis
    const currentContentHash = generateCourseContentHash(course as unknown as CourseData);

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
        const cachedDistribution = normalizeBloomsDistribution(existingAnalysis.bloomsDistribution as any);
        
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
              { bloomsAnalysis: {}, marketAnalysis: {}, qualityAnalysis: {}, completionAnalysis: {} }
            ),
            bloomsInsights: generateBloomsInsights(cachedDistribution, { bloomsAnalysis: {}, marketAnalysis: {}, qualityAnalysis: {}, completionAnalysis: {} }),
            metadata: {
              analyzedAt: existingAnalysis.analyzedAt.toISOString(),
              courseId,
              analysisLevel,
              targetId: targetId ?? courseId,
              totalChapters: filteredCourse.chapters.length,
              totalObjectives: filteredCourse.whatYouWillLearn?.length || 0,
              completionPercentage,
              cached: true,
              contentHash: currentContentHash
            }
          }
        });
      }
    }

    // Prepare comprehensive content for analysis (use filteredCourse for chapter/section analysis)
    const courseContent = {
      // Basic Course Information
      title: filteredCourse.title || 'Untitled Course',
      description: filteredCourse.description || '',
      learningObjectives: filteredCourse.whatYouWillLearn || [],

      // Course Metadata
      category: filteredCourse.category?.name || 'Uncategorized',
      price: filteredCourse.price || 0,
      priceType: filteredCourse.price === 0 ? 'Free' : 'Paid',
      hasImage: Boolean(filteredCourse.imageUrl),
      imageUrl: filteredCourse.imageUrl,
      isPublished: filteredCourse.isPublished,

      // Analysis Level Info
      analysisLevel,
      targetId: targetId ?? courseId,

      // Completion Status Analysis
      completionStatus,
      completionPercentage,
      completedSections,
      totalSections,
      readinessScore: completionPercentage,

      // Content Structure (based on filtered data)
      chaptersCount: filteredCourse.chapters.length,
      sectionsCount: filteredCourse.chapters.reduce((total, ch) => total + ch.sections.length, 0),
      attachmentsCount: filteredCourse.attachments.length,

      // Detailed Chapter Analysis (based on filtered data)
      chapters: filteredCourse.chapters.map(ch => ({
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
      resources: filteredCourse.attachments.map(att => ({
        name: att.name,
        url: att.url,
        type: att.name.split('.').pop()?.toLowerCase() || 'unknown'
      })),

      // Course Creator Information
      creator: {
        name: filteredCourse.user?.name || 'Unknown Creator',
        email: filteredCourse.user?.email
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

    const response = await aiClient.chat({
      userId: user.id,
      capability: 'analysis',
      maxTokens: 4000,
      temperature: 0.3,
      systemPrompt: "You are an expert instructional designer specializing in Bloom's Taxonomy and course depth analysis. Provide precise, actionable insights.",
      messages: [{
        role: "user",
        content: analysisPrompt
      }],
      extended: true,
    });

    const responseText = response.content;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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

    // Normalize and guard against missing fields
    analysis = sanitizeAnalysis(analysis, completionPercentage);

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
        analysisLevel,
        targetId: targetId ?? courseId,
        totalChapters: filteredCourse.chapters.length,
        totalSections: filteredCourse.chapters.reduce((total, ch) => total + ch.sections.length, 0),
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
      } catch (error) {
        logger.error('Failed to store analysis in database:', error);
      }
    }

    return NextResponse.json({
      success: true,
      analysis: enhancedAnalysis
    });

  } catch (error: any) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Course depth analysis error:', error);

    // Handle specific AI API errors
    let errorMessage = 'Failed to analyze course depth';
    let statusCode = 500;

    if (error.status === 529 || error.status === 503) {
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      statusCode = 503;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: [529, 503, 429].includes(error.status)
    }, { status: statusCode });
  }
}

// Map enhanced engine output to the legacy client contract the UI expects
function mapEnhancedToLegacy(enhanced: EnhancedDepthAnalysisResponse) {
  const overallDistribution = normalizeBloomsDistribution(enhanced.courseLevel.bloomsDistribution);
  const bloomsInsights = generateBloomsInsights(overallDistribution, {
    bloomsAnalysis: {},
    marketAnalysis: {},
    qualityAnalysis: {},
    completionAnalysis: {}
  });

  const scores = {
    depth: Math.round(enhanced.courseLevel.cognitiveDepth || 0),
    balance: bloomsInsights.balanceScore,
    complexity: Math.round(enhanced.assessmentQuality?.overallScore ?? enhanced.courseLevel.cognitiveDepth ?? 0),
    completeness: enhanced.metadata?.completionPercentage ?? 0,
  };

  const chapterAnalysis = (enhanced.chapterAnalysis || []).map(ch => ({
    chapterTitle: ch.chapterTitle,
    bloomsLevel: ch.primaryBloomsLevel,
    score: Math.round(ch.cognitiveDepth || 0),
    strengths: ch.strengths || [],
    weaknesses: ch.weaknesses || [],
  }));

  const objectivesAnalysis = (enhanced.objectivesAnalysis || []).map(obj => ({
    objective: obj.objective,
    bloomsLevel: obj.bloomsLevel,
    actionVerb: obj.actionVerb,
    smartCriteria: obj.smartCriteria,
    clarityScore: obj.clarityScore,
    verbStrength: obj.verbStrength,
    suggestions: obj.suggestions || [],
    improvedVersion: obj.improvedVersion,
    dokLevel: obj.dokLevel,
  }));

  const gaps = (enhanced.learningPathway?.gaps || []).map(gap => ({
    level: gap.level,
    severity: gap.severity,
    description: gap.description,
  }));

  const recommendations = flattenRecommendations(enhanced.recommendations);

  return {
    overallDistribution,
    chapterAnalysis,
    objectivesAnalysis,
    scores,
    gaps,
    recommendations,
    bloomsInsights,
    assessmentQuality: enhanced.assessmentQuality,
    dokDistribution: enhanced.courseLevel.dokDistribution,
    courseType: enhanced.courseLevel.courseType,
    courseTypeMatch: enhanced.courseLevel.courseTypeMatch,
    objectiveDeduplication: enhanced.objectiveDeduplication,
    learningPathway: enhanced.learningPathway,
    metadata: enhanced.metadata,
  };
}

function normalizeBloomsDistribution(dist: EnhancedBloomsDistribution | Record<string, number>) {
  const normalized: Record<string, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };

  Object.entries(dist || {}).forEach(([key, value]) => {
    normalized[key.toLowerCase()] = Math.round(value as number);
  });

  return normalized;
}

function sanitizeAnalysis(analysis: any, completionPercentage: number) {
  const safeDistribution = normalizeBloomsDistribution(analysis?.overallDistribution || {});
  const scores = analysis?.scores || {};

  return {
    ...analysis,
    overallDistribution: safeDistribution,
    scores: {
      depth: scores.depth ?? 60,
      balance: scores.balance ?? 60,
      complexity: scores.complexity ?? 60,
      completeness: scores.completeness ?? completionPercentage,
    },
    gaps: analysis?.gaps || [],
    recommendations: analysis?.recommendations || [],
    objectivesAnalysis: analysis?.objectivesAnalysis || [],
    chapterAnalysis: analysis?.chapterAnalysis || [],
  };
}

function flattenRecommendations(recs: any): Array<{ priority: any; type: any; category?: string; title: string; description: string; impact?: string; effort?: any; examples: string[]; actionSteps?: string[]; }> {
  if (!recs) return [];

  const buckets = [recs.immediate, recs.shortTerm, recs.longTerm, recs.contentAdjustments, recs.assessmentChanges, recs.activitySuggestions];

  return buckets
    .filter(Boolean)
    .flat()
    .map((rec: any, idx: number) => ({
      priority: rec.priority ?? 'medium',
      type: rec.type ?? 'content',
      category: rec.category ?? rec.bloomsLevel ?? 'general',
      title: rec.title ?? rec.description ?? `Recommendation ${idx + 1}`,
      description: rec.description ?? rec.implementation?.join('\n') ?? '',
      impact: rec.impact,
      effort: rec.effort ?? (rec.estimatedTime ? 'medium' : undefined),
      examples: rec.examples ?? [],
      actionSteps: rec.actionSteps ?? rec.implementation ?? [],
    }));
}

// Helper functions
interface FallbackAnalysis {
  overallDistribution: Record<string, number>;
  chapterAnalysis: Array<{
    chapterTitle: string;
    bloomsLevel: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  objectivesAnalysis: Array<{
    objective: string;
    bloomsLevel: string;
    suggestions: string[];
  }>;
  scores: {
    depth: number;
    balance: number;
    complexity: number;
    completeness: number;
  };
  gaps: Array<{
    level: string;
    severity: string;
    description: string;
  }>;
  recommendations: Array<{
    priority: string;
    type: string;
    title: string;
    description: string;
    examples: string[];
  }>;
}

function generateFallbackAnalysis(courseContent: LegacyCourseContent): FallbackAnalysis {
  // Basic analysis when AI fails
  const distribution = analyzeContentKeywords(courseContent);

  return {
    overallDistribution: distribution,
    chapterAnalysis: courseContent.chapters.map((ch: LegacyChapter) => ({
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

function analyzeContentKeywords(content: LegacyCourseContent): Record<string, number> {
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
function generateTitleDescFeedback(courseContent: LegacyCourseContent): string {
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

function generateTitleDescRecommendations(courseContent: LegacyCourseContent): string[] {
  const recommendations: string[] = [];
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

function generateObjectivesFeedback(courseContent: LegacyCourseContent): string {
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

function generateObjectivesRecommendations(courseContent: LegacyCourseContent): string[] {
  const recommendations: string[] = [];
  const objectives = courseContent.learningObjectives || [];

  if (objectives.length === 0) {
    recommendations.push('Define 5-8 specific learning objectives using action verbs');
    recommendations.push('Ensure objectives are measurable and aligned with course assessments');
  } else if (objectives.length < 3) {
    recommendations.push('Add more learning objectives to comprehensively cover course content');
  }

  recommendations.push('Use Bloom&apos;s taxonomy verbs to create objectives at different cognitive levels');
  recommendations.push('Make objectives specific, measurable, achievable, relevant, and time-bound (SMART)');

  return recommendations;
}

function generateCategoryFeedback(courseContent: LegacyCourseContent): string {
  const category = courseContent.category;
  if (category === 'Uncategorized') {
    return 'Course needs proper categorization for discoverability and market positioning.';
  }
  return `Course is categorized as ${category}. Ensure this aligns with content and target audience.`;
}

function assessMarketFit(courseContent: LegacyCourseContent): string {
  const category = courseContent.category;
  if (category === 'Uncategorized') {
    return 'Cannot assess market fit without proper categorization';
  }

  // Simple market fit assessment based on category
  const highDemandCategories = ['Technology', 'Business', 'Data Science', 'Marketing', 'Design'];
  const isHighDemand = highDemandCategories.some(cat => category.includes(cat));

  return isHighDemand ? 'Good market fit - high demand category' : 'Moderate market fit - consider niche positioning';
}

function generateCategoryRecommendations(courseContent: LegacyCourseContent): string[] {
  const recommendations: string[] = [];
  if (courseContent.category === 'Uncategorized') {
    recommendations.push('Select an appropriate category that matches your course content');
    recommendations.push('Research competitor courses in your chosen category');
  }
  recommendations.push('Verify your category choice aligns with learner expectations');
  return recommendations;
}

function generatePricingFeedback(courseContent: LegacyCourseContent): string {
  const price = courseContent.price;
  if (price === null || price === undefined) {
    return 'Pricing strategy not defined. Consider your target audience, competition, and value proposition.';
  }
  if (price === 0) {
    return 'Free course strategy can increase enrollment but may affect perceived value.';
  }
  return `Course priced at $${price}. Ensure pricing reflects course value and market positioning.`;
}

function analyzePricingStrategy(courseContent: LegacyCourseContent): string {
  const price = courseContent.price;
  if (price === null) return 'No pricing strategy defined';
  if (price === 0) return 'Free strategy for maximum reach';
  if (price < 50) return 'Low-price strategy for accessibility';
  if (price < 200) return 'Moderate pricing for value-conscious learners';
  return 'Premium pricing strategy';
}

function generatePricingRecommendations(courseContent: LegacyCourseContent): string[] {
  const recommendations: string[] = [];
  const price = courseContent.price;

  if (price === null) {
    recommendations.push('Research competitor pricing in your category');
    recommendations.push('Consider value-based pricing aligned with learning outcomes');
  }
  recommendations.push('Test different price points to optimize revenue');
  recommendations.push('Consider offering payment plans or tiered pricing');

  return recommendations;
}

function generateImageFeedback(courseContent: LegacyCourseContent): string {
  if (!courseContent.hasImage) {
    return 'Course image missing. A compelling image increases enrollment by up to 40%.';
  }
  return 'Course image uploaded. Ensure it&apos;s high-quality and represents course content effectively.';
}

function generateImageRecommendations(courseContent: LegacyCourseContent): string[] {
  const recommendations: string[] = [];
  if (!courseContent.hasImage) {
    recommendations.push('Add a professional course image that represents your content');
    recommendations.push('Use high-resolution images (minimum 1200x675px)');
  }
  recommendations.push('Ensure image includes relevant visual elements for your topic');
  recommendations.push('Test different images to see which performs better');
  return recommendations;
}

function generateChaptersFeedback(courseContent: LegacyCourseContent): string {
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

function analyzeChapterStructure(courseContent: LegacyCourseContent): string {
  const chapters = courseContent.chapters || [];
  if (chapters.length === 0) return 'No structure to analyze';

  const sectionsPerChapter = chapters.map((ch: LegacyChapter) => ch.sectionsCount || 0);
  const avgSections = sectionsPerChapter.reduce((a: number, b: number) => a + b, 0) / chapters.length;

  return `Average ${avgSections.toFixed(1)} sections per chapter. ${chapters.length} total chapters.`;
}

function generateChaptersRecommendations(courseContent: LegacyCourseContent): string[] {
  const recommendations: string[] = [];
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

function generateResourcesFeedback(courseContent: LegacyCourseContent): string {
  const count = courseContent.attachmentsCount;
  if (count === 0) {
    return 'No resources attached. Additional materials enhance learning effectiveness.';
  }
  return `${count} resources attached. Ensure they&apos;re relevant and add value to learning.`;
}

function analyzeResourceAdequacy(courseContent: LegacyCourseContent): string {
  const count = courseContent.attachmentsCount;
  const chaptersCount = courseContent.chaptersCount;

  if (count === 0) return 'No resources available';
  if (chaptersCount === 0) return 'Resources available but no chapter structure';

  const resourcesPerChapter = count / chaptersCount;
  if (resourcesPerChapter < 1) return 'Consider adding more resources per chapter';
  if (resourcesPerChapter > 5) return 'Many resources - ensure quality over quantity';

  return `Good resource distribution: ${resourcesPerChapter.toFixed(1)} resources per chapter`;
}

function generateResourcesRecommendations(courseContent: LegacyCourseContent): string[] {
  const recommendations: string[] = [];
  const count = courseContent.attachmentsCount;
  
  if (count === 0) {
    recommendations.push('Add relevant resources like PDFs, worksheets, or reference materials');
    recommendations.push('Include practical exercises and templates');
  }
  
  recommendations.push('Organize resources by chapter or topic');
  recommendations.push('Ensure all resources are accessible and properly formatted');
  
  return recommendations;
}

function calculateContentDepth(courseContent: LegacyCourseContent): number {
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

function calculateStructureQuality(courseContent: LegacyCourseContent): number {
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

function calculateEngagementPotential(courseContent: LegacyCourseContent): number {
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

function calculateMarketReadiness(courseContent: LegacyCourseContent): number {
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

function generateFallbackBloomsAnalysis(courseContent: LegacyCourseContent): FallbackBloomsAnalysis {
  const distribution = {
    REMEMBER: 20,
    UNDERSTAND: 25,
    APPLY: 25,
    ANALYZE: 15,
    EVALUATE: 10,
    CREATE: 5
  };

  // Generate chapter analysis based on available data
  const chapterAnalysis = courseContent.chapters.map((chapter: LegacyChapter) => ({
    chapterId: Math.random().toString(),
    chapterTitle: chapter.title,
    bloomsDistribution: distribution,
    primaryLevel: 'UNDERSTAND' as const,
    cognitiveDepth: 65,
    sections: chapter.sections?.map((section: LegacySection) => ({
      sectionId: Math.random().toString(),
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

function generateFallbackMarketAnalysis(_courseContent: LegacyCourseContent): FallbackMarketAnalysis {
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

interface BloomsInsights {
  dominantLevel: string;
  missingLevels: string[];
  balanceScore: number;
  improvementSuggestions: string[];
}

function generateBloomsInsights(distribution: Record<string, number>, _samAnalysis: LegacySAMAnalysis): BloomsInsights {
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

interface AnalysisForInsights {
  overallDistribution?: Record<string, number>;
  scores?: { balance?: number };
  recommendations?: Array<{ priority: string }>;
}

/**
 * Extract unique research citations from deterministic analysis results
 */
function getResearchCitationsUsed(result: DeterministicAnalysisResult): Array<{
  standard: string;
  id: string;
  description: string;
}> {
  const citations = new Map<string, { standard: string; id: string; description: string }>();

  for (const rule of result.rulesApplied) {
    if (rule.source) {
      const key = `${rule.source.standard}-${rule.source.id}`;
      if (!citations.has(key)) {
        citations.set(key, {
          standard: rule.source.standard,
          id: rule.source.id,
          description: rule.source.description,
        });
      }
    }
  }

  return Array.from(citations.values());
}

function generateInsights(analysis: AnalysisForInsights, samAnalysis: LegacySAMAnalysis): string[] {
  const insights: string[] = [];
  const dist = analysis.overallDistribution ?? {};

  // Check for imbalances
  if ((dist.remember ?? 0) + (dist.understand ?? 0) > 60) {
    insights.push('Course is heavily focused on lower-order thinking skills');
  }

  if ((dist.create ?? 0) < 10) {
    insights.push('Limited opportunities for creative synthesis and original work');
  }

  if ((dist.evaluate ?? 0) < 15) {
    insights.push('Students need more opportunities to develop critical judgment');
  }

  if ((analysis.scores?.balance ?? 100) < 70) {
    insights.push('Consider rebalancing content across all Bloom&apos;s levels');
  }

  // Add SAM-powered insights
  const qualityAnalysis = samAnalysis.qualityAnalysis as unknown as QualityMetrics | undefined;
  if (qualityAnalysis?.overallScore !== undefined && qualityAnalysis.overallScore < 70) {
    insights.push('Course quality metrics suggest need for content enhancement');
  }

  const marketAnalysis = samAnalysis.marketAnalysis as { demandLevel?: string } | undefined;
  if (marketAnalysis?.demandLevel === 'low') {
    insights.push('Market analysis indicates low demand - consider repositioning');
  }

  return insights;
}

interface ImprovementPlan {
  immediate: Array<{ priority: string }>;
  shortTerm: Array<{ priority: string }>;
  longTerm: Array<{ priority: string }>;
  timeline: string;
  samPoweredActions: string[];
}

function generateImprovementPlan(analysis: AnalysisForInsights, _samAnalysis: LegacySAMAnalysis): ImprovementPlan {
  const recommendations = analysis.recommendations ?? [];

  return {
    immediate: recommendations.filter((r: { priority: string }) => r.priority === 'critical' || r.priority === 'high'),
    shortTerm: recommendations.filter((r: { priority: string }) => r.priority === 'medium'),
    longTerm: recommendations.filter((r: { priority: string }) => r.priority === 'low'),
    timeline: '4-6 weeks for full implementation',
    samPoweredActions: [
      'Run comprehensive Bloom&apos;s analysis',
      'Optimize market positioning',
      'Enhance content quality metrics'
    ]
  };
}
