import { db } from '@/lib/db';
import { BloomsLevel, CognitiveSkillType, MasteryLevel } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';

// Limit parallel section analyses to avoid LLM spikes
const SECTION_ANALYSIS_CONCURRENCY = Number(process.env.SAM_BLOOMS_CONCURRENCY || 3);

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) break;
      results[i] = await mapper(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, () => worker());
  await Promise.all(workers);
  return results;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface ChapterBloomsAnalysis {
  chapterId: string;
  chapterTitle: string;
  bloomsDistribution: BloomsDistribution;
  primaryLevel: BloomsLevel;
  cognitiveDepth: number;
  sections: SectionBloomsAnalysis[];
}

export interface SectionBloomsAnalysis {
  sectionId: string;
  sectionTitle: string;
  bloomsLevel: BloomsLevel;
  activities: ActivityAnalysis[];
  learningObjectives: string[];
}

export interface ActivityAnalysis {
  type: string;
  bloomsLevel: BloomsLevel;
  description: string;
}

export interface LearningGap {
  level: BloomsLevel;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

export interface CognitivePath {
  stages: CognitiveStage[];
  currentStage: number;
  completionPercentage: number;
}

export interface CognitiveStage {
  level: BloomsLevel;
  mastery: number;
  activities: string[];
  timeEstimate: number;
}

export interface BloomsAnalysisResponse {
  courseLevel: {
    distribution: BloomsDistribution;
    cognitiveDepth: number;
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  };
  chapterAnalysis: ChapterBloomsAnalysis[];
  learningPathway: {
    current: CognitivePath;
    recommended: CognitivePath;
    gaps: LearningGap[];
  };
  recommendations: {
    contentAdjustments: ContentRecommendation[];
    assessmentChanges: AssessmentRecommendation[];
    activitySuggestions: ActivitySuggestion[];
  };
  studentImpact: {
    skillsDeveloped: Skill[];
    cognitiveGrowth: GrowthProjection;
    careerAlignment: CareerPath[];
  };
}

export interface ContentRecommendation {
  type: 'add' | 'modify' | 'remove';
  targetChapter?: string;
  targetSection?: string;
  bloomsLevel: BloomsLevel;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface AssessmentRecommendation {
  type: string;
  bloomsLevel: BloomsLevel;
  description: string;
  examples: string[];
}

export interface ActivitySuggestion {
  bloomsLevel: BloomsLevel;
  activityType: string;
  description: string;
  implementation: string;
  expectedOutcome: string;
}

export interface Skill {
  name: string;
  bloomsLevel: BloomsLevel;
  proficiency: number;
  description: string;
}

export interface GrowthProjection {
  currentLevel: number;
  projectedLevel: number;
  timeframe: string;
  keyMilestones: string[];
}

export interface CareerPath {
  role: string;
  alignment: number;
  requiredSkills: string[];
  matchedSkills: string[];
}

// ==========================================
// Cognitive Skill Mapping (Exam Evaluation System)
// ==========================================

export interface CognitiveSkillMapping {
  bloomsLevel: BloomsLevel;
  cognitiveSkills: CognitiveSkillType[];
  weight: number;
  description: string;
}

export interface CognitiveProgressAnalysis {
  userId: string;
  conceptId: string;
  masteryLevels: Record<BloomsLevel, number>;
  overallMastery: number;
  currentLevel: BloomsLevel;
  masteryStatus: MasteryLevel;
  cognitiveSkillBreakdown: CognitiveSkillBreakdown[];
  recommendations: CognitiveRecommendation[];
}

export interface CognitiveSkillBreakdown {
  skill: CognitiveSkillType;
  mastery: number;
  recentActivity: string;
  nextAction: string;
}

export interface CognitiveRecommendation {
  type: 'review' | 'practice' | 'advance' | 'reinforce';
  targetLevel: BloomsLevel;
  activity: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
}

export interface QuestionBloomsAnalysis {
  questionText: string;
  bloomsLevel: BloomsLevel;
  cognitiveSkills: CognitiveSkillType[];
  confidence: number;
  keywords: string[];
  rationale: string;
}

export interface SpacedRepetitionParams {
  userId: string;
  conceptId: string;
  performance: number; // 0-5 scale (SM-2)
  currentEaseFactor?: number;
  currentInterval?: number;
  repetitions?: number;
}

export class BloomsAnalysisEngine {
  private bloomsLevels: BloomsLevel[] = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
  ];

  // International Standards Compliance
  private standards = {
    primary: 'Bloom\'s Taxonomy (Anderson & Krathwohl, 2001)',
    secondary: [
      'Webb\'s Depth of Knowledge (DOK)',
      'Marzano\'s New Taxonomy',
      'Quality Matters Rubric (Alignment Standard 2)',
    ],
    compliance: {
      bloomsTaxonomy: 'Full Implementation',
      webbsDOK: 'Planned Integration',
      marzanoTaxonomy: 'Planned Integration',
      qualityMatters: 'Partial Implementation',
    },
  };

  // Cognitive Skill Mapping - Maps Bloom's levels to cognitive skills
  private cognitiveSkillMap: CognitiveSkillMapping[] = [
    {
      bloomsLevel: 'REMEMBER',
      cognitiveSkills: ['INFORMATION_PROCESSING'],
      weight: 1,
      description: 'Basic recall and recognition of facts',
    },
    {
      bloomsLevel: 'UNDERSTAND',
      cognitiveSkills: ['INFORMATION_PROCESSING', 'LOGICAL_REASONING'],
      weight: 2,
      description: 'Comprehension and interpretation of meaning',
    },
    {
      bloomsLevel: 'APPLY',
      cognitiveSkills: ['PROBLEM_SOLVING', 'DECISION_MAKING'],
      weight: 3,
      description: 'Using knowledge in new situations',
    },
    {
      bloomsLevel: 'ANALYZE',
      cognitiveSkills: ['ANALYTICAL_THINKING', 'CRITICAL_THINKING', 'LOGICAL_REASONING'],
      weight: 4,
      description: 'Breaking down information into component parts',
    },
    {
      bloomsLevel: 'EVALUATE',
      cognitiveSkills: ['CRITICAL_THINKING', 'DECISION_MAKING', 'METACOGNITION'],
      weight: 5,
      description: 'Making judgments based on criteria',
    },
    {
      bloomsLevel: 'CREATE',
      cognitiveSkills: ['CREATIVE_THINKING', 'PROBLEM_SOLVING', 'METACOGNITION'],
      weight: 6,
      description: 'Producing original work or novel solutions',
    },
  ];

  async analyzeCourse(
    courseId: string,
    depth: 'basic' | 'detailed' | 'comprehensive' = 'detailed',
    includeRecommendations = true,
    forceReanalyze = false
  ): Promise<BloomsAnalysisResponse> {
    // Get course data with all content
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                exams: {
                  include: {
                    ExamQuestion: true,
                  },
                },
                Question: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Generate content hash
    const { generateCourseContentHash } = await import('@/lib/course-content-hash');
    const currentContentHash = generateCourseContentHash(course);

    // Check for existing analysis
    const existingAnalysis = await db.courseBloomsAnalysis.findUnique({
      where: { courseId },
    });

    // Use cached analysis if content hasn't changed and not forced
    if (existingAnalysis && !forceReanalyze && existingAnalysis.contentHash === currentContentHash) {

      return this.parseStoredAnalysis(existingAnalysis);
    }

    // Log why we're re-analyzing
    if (forceReanalyze) {

    } else if (existingAnalysis && existingAnalysis.contentHash !== currentContentHash) {

    } else {
}
    // Perform new analysis
    const analysis = await this.performAnalysis(course, depth, includeRecommendations);

    // Store the analysis with content hash
    await this.storeAnalysis(courseId, analysis, currentContentHash);

    // Store section mappings
    await this.storeSectionMappings(analysis.chapterAnalysis);

    return analysis;
  }

  private async performAnalysis(
    course: any,
    depth: string,
    includeRecommendations: boolean
  ): Promise<BloomsAnalysisResponse> {
    const chapterAnalyses = await Promise.all(
      course.chapters.map((chapter: any) => this.analyzeChapter(chapter))
    );

    const courseDistribution = this.calculateCourseDistribution(chapterAnalyses);
    const cognitiveDepth = this.calculateCognitiveDepth(courseDistribution);
    const balance = this.determineBalance(courseDistribution);

    const learningPathway = this.analyzeLearningPathway(chapterAnalyses);
    const recommendations = includeRecommendations
      ? await this.generateRecommendations(course, chapterAnalyses, courseDistribution)
      : { contentAdjustments: [], assessmentChanges: [], activitySuggestions: [] };

    const studentImpact = this.analyzeStudentImpact(courseDistribution, chapterAnalyses);

    return {
      courseLevel: {
        distribution: courseDistribution,
        cognitiveDepth,
        balance,
      },
      chapterAnalysis: chapterAnalyses,
      learningPathway,
      recommendations,
      studentImpact,
    };
  }

  private async analyzeChapter(chapter: any): Promise<ChapterBloomsAnalysis> {
    const sectionAnalyses = await mapWithConcurrency(
      chapter.sections,
      SECTION_ANALYSIS_CONCURRENCY,
      (section: any) => this.analyzeSection(section)
    );

    const chapterDistribution = this.calculateChapterDistribution(sectionAnalyses);
    const primaryLevel = this.determinePrimaryLevel(chapterDistribution);
    const cognitiveDepth = this.calculateCognitiveDepth(chapterDistribution);

    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      bloomsDistribution: chapterDistribution,
      primaryLevel,
      cognitiveDepth,
      sections: sectionAnalyses,
    };
  }

  private async analyzeSection(section: any): Promise<SectionBloomsAnalysis> {
    // Analyze content to determine Bloom's level
    const contentAnalysis = await this.analyzeContent(section);
    const examAnalysis = this.analyzeExams(section.exams);
    const questionAnalysis = this.analyzeQuestions(section.Question);

    const bloomsLevel = this.determineBloomsLevel(contentAnalysis, examAnalysis, questionAnalysis);
    const activities = this.extractActivities(section, bloomsLevel);
    const learningObjectives = this.extractLearningObjectives(section);

    return {
      sectionId: section.id,
      sectionTitle: section.title,
      bloomsLevel,
      activities,
      learningObjectives,
    };
  }

  private async analyzeContent(section: any): Promise<BloomsLevel> {
    const systemPrompt = `You are SAM, an expert educational psychologist specializing in Bloom's Taxonomy. Analyze educational content and accurately classify it according to Bloom's cognitive levels.

**Bloom's Taxonomy Levels:**
1. REMEMBER: Recall facts and basic concepts
2. UNDERSTAND: Explain ideas or concepts
3. APPLY: Use information in new situations
4. ANALYZE: Draw connections among ideas
5. EVALUATE: Justify a stand or decision
6. CREATE: Produce new or original work

Analyze the content and determine the primary cognitive level required.`;

    const content = `
Section Title: ${section.title}
Content Type: ${section.type || 'General'}
Has Video: ${section.videoUrl ? 'Yes' : 'No'}
Duration: ${section.duration || 'Unknown'} minutes
Description: ${section.description || 'No description'}
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Analyze this section and determine its primary Bloom's Taxonomy level:\n\n${content}` }
      ],
    });

    const aiResponse = response.content[0];
    const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

    return this.parseBloomsLevel(analysisText);
  }

  private analyzeExams(exams: any[]): BloomsLevel[] {
    if (!exams || exams.length === 0) return [];

    const levels: BloomsLevel[] = [];
    
    exams.forEach(exam => {
      exam.ExamQuestion?.forEach((question: any) => {
        if (question.bloomsLevel) {
          levels.push(question.bloomsLevel);
        }
      });
    });

    return levels;
  }

  private analyzeQuestions(questions: any[]): BloomsLevel[] {
    if (!questions || questions.length === 0) return [];

    // Analyze question text to determine Bloom's level
    return questions.map(q => this.analyzeQuestionText(q.text));
  }

  private analyzeQuestionText(text: string): BloomsLevel {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('define') || lowerText.includes('list') || lowerText.includes('name')) {
      return 'REMEMBER';
    } else if (lowerText.includes('explain') || lowerText.includes('describe') || lowerText.includes('summarize')) {
      return 'UNDERSTAND';
    } else if (lowerText.includes('apply') || lowerText.includes('solve') || lowerText.includes('use')) {
      return 'APPLY';
    } else if (lowerText.includes('analyze') || lowerText.includes('compare') || lowerText.includes('contrast')) {
      return 'ANALYZE';
    } else if (lowerText.includes('evaluate') || lowerText.includes('judge') || lowerText.includes('critique')) {
      return 'EVALUATE';
    } else if (lowerText.includes('create') || lowerText.includes('design') || lowerText.includes('develop')) {
      return 'CREATE';
    }
    
    return 'UNDERSTAND'; // Default
  }

  private parseBloomsLevel(text: string): BloomsLevel {
    const upperText = text.toUpperCase();
    
    for (const level of this.bloomsLevels) {
      if (upperText.includes(level)) {
        return level;
      }
    }
    
    return 'UNDERSTAND'; // Default
  }

  private determineBloomsLevel(
    contentLevel: BloomsLevel,
    examLevels: BloomsLevel[],
    questionLevels: BloomsLevel[]
  ): BloomsLevel {
    // Combine all levels and find the most common
    const allLevels = [contentLevel, ...examLevels, ...questionLevels];
    
    if (allLevels.length === 0) return 'REMEMBER';
    
    const levelCounts = allLevels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<BloomsLevel, number>);
    
    return Object.entries(levelCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as BloomsLevel;
  }

  private extractActivities(section: any, bloomsLevel: BloomsLevel): ActivityAnalysis[] {
    const activities: ActivityAnalysis[] = [];
    
    if (section.videoUrl) {
      activities.push({
        type: 'Video Lesson',
        bloomsLevel: bloomsLevel,
        description: 'Watch and understand concepts',
      });
    }
    
    if (section.exams?.length > 0) {
      activities.push({
        type: 'Assessment',
        bloomsLevel: bloomsLevel,
        description: 'Test understanding through exam',
      });
    }
    
    if (section.Question?.length > 0) {
      activities.push({
        type: 'Practice Questions',
        bloomsLevel: bloomsLevel,
        description: 'Apply knowledge through practice',
      });
    }
    
    return activities;
  }

  private extractLearningObjectives(section: any): string[] {
    // Extract learning objectives from section content
    // This would be enhanced with actual content analysis
    return [
      `Master ${section.title} concepts`,
      `Apply knowledge in practical scenarios`,
      `Develop critical thinking skills`,
    ];
  }

  private calculateChapterDistribution(sections: SectionBloomsAnalysis[]): BloomsDistribution {
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
    
    if (sections.length === 0) return distribution;
    
    sections.forEach(section => {
      distribution[section.bloomsLevel]++;
    });
    
    // Convert to percentages
    const total = sections.length;
    Object.keys(distribution).forEach(key => {
      distribution[key as BloomsLevel] = (distribution[key as BloomsLevel] / total) * 100;
    });
    
    return distribution;
  }

  private calculateCourseDistribution(chapters: ChapterBloomsAnalysis[]): BloomsDistribution {
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
    
    if (chapters.length === 0) return distribution;
    
    // Average the chapter distributions
    chapters.forEach(chapter => {
      Object.keys(distribution).forEach(key => {
        distribution[key as BloomsLevel] += chapter.bloomsDistribution[key as BloomsLevel];
      });
    });
    
    // Calculate average
    Object.keys(distribution).forEach(key => {
      distribution[key as BloomsLevel] /= chapters.length;
    });
    
    return distribution;
  }

  private calculateCognitiveDepth(distribution: BloomsDistribution): number {
    // Weighted calculation based on cognitive complexity
    const weights = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };
    
    let totalWeight = 0;
    let totalPercentage = 0;
    
    Object.entries(distribution).forEach(([level, percentage]) => {
      totalWeight += weights[level as BloomsLevel] * percentage;
      totalPercentage += percentage;
    });
    
    return totalPercentage > 0 ? (totalWeight / totalPercentage) * 20 : 0; // Scale to 0-100
  }

  private determinePrimaryLevel(distribution: BloomsDistribution): BloomsLevel {
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)[0][0] as BloomsLevel;
  }

  private determineBalance(distribution: BloomsDistribution): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const middleLevels = distribution.APPLY + distribution.ANALYZE;
    const higherLevels = distribution.EVALUATE + distribution.CREATE;
    
    if (lowerLevels > 60) return 'bottom-heavy';
    if (higherLevels > 40) return 'top-heavy';
    return 'well-balanced';
  }

  private analyzeLearningPathway(chapters: ChapterBloomsAnalysis[]): {
    current: CognitivePath;
    recommended: CognitivePath;
    gaps: LearningGap[];
  } {
    const current = this.buildCurrentPath(chapters);
    const recommended = this.buildRecommendedPath(chapters);
    const gaps = this.identifyLearningGaps(current, recommended);
    
    return { current, recommended, gaps };
  }

  private buildCurrentPath(chapters: ChapterBloomsAnalysis[]): CognitivePath {
    const stages: CognitiveStage[] = this.bloomsLevels.map(level => ({
      level,
      mastery: this.calculateLevelMastery(chapters, level),
      activities: this.getActivitiesForLevel(chapters, level),
      timeEstimate: this.estimateTimeForLevel(chapters, level),
    }));
    
    const currentStage = this.determineCurrentStage(stages);
    const completionPercentage = this.calculatePathCompletion(stages);
    
    return { stages, currentStage, completionPercentage };
  }

  private buildRecommendedPath(chapters: ChapterBloomsAnalysis[]): CognitivePath {
    // Build an ideal learning path
    const stages: CognitiveStage[] = this.bloomsLevels.map((level, index) => ({
      level,
      mastery: Math.max(80 - (index * 10), 40), // Decreasing mastery for higher levels
      activities: this.getRecommendedActivities(level),
      timeEstimate: 10 + (index * 5), // Increasing time for higher levels
    }));
    
    return {
      stages,
      currentStage: 0,
      completionPercentage: 0,
    };
  }

  private calculateLevelMastery(chapters: ChapterBloomsAnalysis[], level: BloomsLevel): number {
    let totalSections = 0;
    let levelSections = 0;
    
    chapters.forEach(chapter => {
      chapter.sections.forEach(section => {
        totalSections++;
        if (section.bloomsLevel === level) {
          levelSections++;
        }
      });
    });
    
    return totalSections > 0 ? (levelSections / totalSections) * 100 : 0;
  }

  private getActivitiesForLevel(chapters: ChapterBloomsAnalysis[], level: BloomsLevel): string[] {
    const activities: string[] = [];
    
    chapters.forEach(chapter => {
      chapter.sections
        .filter(section => section.bloomsLevel === level)
        .forEach(section => {
          section.activities.forEach(activity => {
            if (!activities.includes(activity.type)) {
              activities.push(activity.type);
            }
          });
        });
    });
    
    return activities;
  }

  private estimateTimeForLevel(chapters: ChapterBloomsAnalysis[], level: BloomsLevel): number {
    let sectionCount = 0;
    
    chapters.forEach(chapter => {
      sectionCount += chapter.sections.filter(s => s.bloomsLevel === level).length;
    });
    
    return sectionCount * 30; // 30 minutes per section estimate
  }

  private determineCurrentStage(stages: CognitiveStage[]): number {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (stages[i].mastery > 50) {
        return i;
      }
    }
    return 0;
  }

  private calculatePathCompletion(stages: CognitiveStage[]): number {
    const totalMastery = stages.reduce((sum, stage) => sum + stage.mastery, 0);
    const maxMastery = stages.length * 100;
    return (totalMastery / maxMastery) * 100;
  }

  private getRecommendedActivities(level: BloomsLevel): string[] {
    const activities: { [key in BloomsLevel]: string[] } = {
      REMEMBER: ['Flashcards', 'Quizzes', 'Memorization exercises'],
      UNDERSTAND: ['Concept maps', 'Summaries', 'Explanations'],
      APPLY: ['Practice problems', 'Case studies', 'Simulations'],
      ANALYZE: ['Comparisons', 'Research projects', 'Data analysis'],
      EVALUATE: ['Critiques', 'Debates', 'Peer reviews'],
      CREATE: ['Projects', 'Presentations', 'Original works'],
    };
    
    return activities[level];
  }

  private identifyLearningGaps(current: CognitivePath, recommended: CognitivePath): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    current.stages.forEach((stage, index) => {
      const recommendedMastery = recommended.stages[index].mastery;
      const gap = recommendedMastery - stage.mastery;
      
      if (gap > 20) {
        gaps.push({
          level: stage.level,
          severity: gap > 40 ? 'high' : gap > 30 ? 'medium' : 'low',
          description: `${stage.level} mastery is ${stage.mastery.toFixed(1)}%, recommended is ${recommendedMastery}%`,
          suggestions: this.getGapSuggestions(stage.level, gap),
        });
      }
    });
    
    return gaps;
  }

  private getGapSuggestions(level: BloomsLevel, gap: number): string[] {
    const suggestions: string[] = [];
    
    if (gap > 30) {
      suggestions.push(`Add more ${level.toLowerCase()}-focused content`);
      suggestions.push(`Include additional assessments at the ${level} level`);
    }
    
    suggestions.push(...this.getRecommendedActivities(level));
    
    return suggestions;
  }

  private async generateRecommendations(
    course: any,
    chapterAnalyses: ChapterBloomsAnalysis[],
    distribution: BloomsDistribution
  ): Promise<{
    contentAdjustments: ContentRecommendation[];
    assessmentChanges: AssessmentRecommendation[];
    activitySuggestions: ActivitySuggestion[];
  }> {
    const contentAdjustments = this.generateContentRecommendations(chapterAnalyses, distribution);
    const assessmentChanges = this.generateAssessmentRecommendations(distribution);
    const activitySuggestions = this.generateActivitySuggestions(distribution);
    
    return {
      contentAdjustments,
      assessmentChanges,
      activitySuggestions,
    };
  }

  private generateContentRecommendations(
    chapters: ChapterBloomsAnalysis[],
    distribution: BloomsDistribution
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    // Check for underrepresented levels
    Object.entries(distribution).forEach(([level, percentage]) => {
      if (percentage < 10) {
        recommendations.push({
          type: 'add',
          bloomsLevel: level as BloomsLevel,
          description: `Add more ${level.toLowerCase()}-focused content`,
          impact: 'high',
        });
      }
    });
    
    return recommendations;
  }

  private generateAssessmentRecommendations(distribution: BloomsDistribution): AssessmentRecommendation[] {
    const recommendations: AssessmentRecommendation[] = [];
    
    if (distribution.ANALYZE < 15) {
      recommendations.push({
        type: 'analytical',
        bloomsLevel: 'ANALYZE',
        description: 'Add case study analysis questions',
        examples: [
          'Compare and contrast two approaches',
          'Analyze the causes and effects',
          'Break down the problem into components',
        ],
      });
    }
    
    if (distribution.CREATE < 10) {
      recommendations.push({
        type: 'creative',
        bloomsLevel: 'CREATE',
        description: 'Include project-based assessments',
        examples: [
          'Design a solution for...',
          'Create an original project',
          'Develop a new approach to...',
        ],
      });
    }
    
    return recommendations;
  }

  private generateActivitySuggestions(distribution: BloomsDistribution): ActivitySuggestion[] {
    const suggestions: ActivitySuggestion[] = [];
    
    Object.entries(distribution).forEach(([level, percentage]) => {
      if (percentage < 15) {
        const activities = this.getRecommendedActivities(level as BloomsLevel);
        
        suggestions.push({
          bloomsLevel: level as BloomsLevel,
          activityType: activities[0],
          description: `Implement ${activities[0].toLowerCase()} to strengthen ${level.toLowerCase()} skills`,
          implementation: `Create ${activities[0].toLowerCase()} that focus on ${level.toLowerCase()} objectives`,
          expectedOutcome: `Improved student performance at the ${level} cognitive level`,
        });
      }
    });
    
    return suggestions;
  }

  private analyzeStudentImpact(
    distribution: BloomsDistribution,
    chapters: ChapterBloomsAnalysis[]
  ): {
    skillsDeveloped: Skill[];
    cognitiveGrowth: GrowthProjection;
    careerAlignment: CareerPath[];
  } {
    const skillsDeveloped = this.identifyDevelopedSkills(distribution, chapters);
    const cognitiveGrowth = this.projectCognitiveGrowth(distribution);
    const careerAlignment = this.analyzeCareerAlignment(skillsDeveloped);
    
    return {
      skillsDeveloped,
      cognitiveGrowth,
      careerAlignment,
    };
  }

  private identifyDevelopedSkills(
    distribution: BloomsDistribution,
    chapters: ChapterBloomsAnalysis[]
  ): Skill[] {
    const skills: Skill[] = [];
    
    Object.entries(distribution).forEach(([level, percentage]) => {
      if (percentage > 10) {
        skills.push({
          name: this.getSkillName(level as BloomsLevel),
          bloomsLevel: level as BloomsLevel,
          proficiency: percentage,
          description: this.getSkillDescription(level as BloomsLevel),
        });
      }
    });
    
    return skills;
  }

  private getSkillName(level: BloomsLevel): string {
    const skillNames: { [key in BloomsLevel]: string } = {
      REMEMBER: 'Information Retention',
      UNDERSTAND: 'Conceptual Understanding',
      APPLY: 'Practical Application',
      ANALYZE: 'Analytical Thinking',
      EVALUATE: 'Critical Evaluation',
      CREATE: 'Creative Innovation',
    };
    
    return skillNames[level];
  }

  private getSkillDescription(level: BloomsLevel): string {
    const descriptions: { [key in BloomsLevel]: string } = {
      REMEMBER: 'Ability to recall and recognize key information',
      UNDERSTAND: 'Capability to explain concepts and ideas clearly',
      APPLY: 'Skill in using knowledge in practical situations',
      ANALYZE: 'Competence in breaking down complex problems',
      EVALUATE: 'Expertise in making informed judgments',
      CREATE: 'Proficiency in generating original solutions',
    };
    
    return descriptions[level];
  }

  private projectCognitiveGrowth(distribution: BloomsDistribution): GrowthProjection {
    const currentLevel = this.calculateCognitiveDepth(distribution);
    const projectedLevel = Math.min(currentLevel + 20, 100);
    
    return {
      currentLevel,
      projectedLevel,
      timeframe: '3-6 months',
      keyMilestones: [
        'Master foundational concepts',
        'Develop analytical skills',
        'Apply knowledge practically',
        'Create original solutions',
      ],
    };
  }

  private analyzeCareerAlignment(skills: Skill[]): CareerPath[] {
    // This would be enhanced with actual career data
    return [
      {
        role: 'Software Developer',
        alignment: 85,
        requiredSkills: ['Problem Solving', 'Critical Thinking', 'Creativity'],
        matchedSkills: skills.map(s => s.name),
      },
      {
        role: 'Data Analyst',
        alignment: 75,
        requiredSkills: ['Analytical Thinking', 'Problem Solving', 'Attention to Detail'],
        matchedSkills: skills.filter(s => s.bloomsLevel === 'ANALYZE' || s.bloomsLevel === 'EVALUATE').map(s => s.name),
      },
    ];
  }

  private async storeAnalysis(courseId: string, analysis: BloomsAnalysisResponse, contentHash?: string): Promise<void> {
    const data = {
      courseId,
      bloomsDistribution: analysis.courseLevel.distribution as any,
      cognitiveDepth: analysis.courseLevel.cognitiveDepth,
      learningPathway: analysis.learningPathway as any,
      skillsMatrix: analysis.studentImpact.skillsDeveloped as any,
      gapAnalysis: analysis.learningPathway.gaps as any,
      recommendations: analysis.recommendations as any,
      contentHash: contentHash || null,
      analyzedAt: new Date(),
    };
    
    await db.courseBloomsAnalysis.upsert({
      where: { courseId },
      update: data,
      create: data,
    });
  }

  private async storeSectionMappings(chapterAnalyses: ChapterBloomsAnalysis[]): Promise<void> {
    for (const chapter of chapterAnalyses) {
      for (const section of chapter.sections) {
        const data = {
          sectionId: section.sectionId,
          bloomsLevel: section.bloomsLevel,
          primaryLevel: section.bloomsLevel,
          secondaryLevels: [] as any,
          activities: section.activities as any,
          assessments: [] as any,
          learningObjectives: section.learningObjectives as any,
        };
        
        await db.sectionBloomsMapping.upsert({
          where: { sectionId: section.sectionId },
          update: data,
          create: data,
        });
      }
    }
  }

  private parseStoredAnalysis(analysis: any): BloomsAnalysisResponse {
    return {
      courseLevel: {
        distribution: analysis.bloomsDistribution as BloomsDistribution,
        cognitiveDepth: analysis.cognitiveDepth,
        balance: this.determineBalance(analysis.bloomsDistribution as BloomsDistribution),
      },
      chapterAnalysis: [],
      learningPathway: analysis.learningPathway as any,
      recommendations: analysis.recommendations as any,
      studentImpact: {
        skillsDeveloped: analysis.skillsMatrix as any || [],
        cognitiveGrowth: {
          currentLevel: analysis.cognitiveDepth,
          projectedLevel: Math.min(analysis.cognitiveDepth + 20, 100),
          timeframe: '3-6 months',
          keyMilestones: [],
        },
        careerAlignment: [],
      },
    };
  }

  // ==========================================
  // Cognitive Skill Mapping Methods
  // ==========================================

  /**
   * Get cognitive skills associated with a Bloom's level
   */
  getCognitiveSkillsForBloomsLevel(level: BloomsLevel): CognitiveSkillType[] {
    const mapping = this.cognitiveSkillMap.find(m => m.bloomsLevel === level);
    return mapping?.cognitiveSkills || [];
  }

  /**
   * Get all cognitive skill mappings
   */
  getCognitiveSkillMappings(): CognitiveSkillMapping[] {
    return this.cognitiveSkillMap;
  }

  /**
   * Analyze a question to determine its Bloom's level and cognitive skills using AI
   */
  async analyzeQuestionBlooms(questionText: string): Promise<QuestionBloomsAnalysis> {
    const systemPrompt = `You are an expert educational psychologist specializing in Bloom's Taxonomy. Analyze the given question and determine:
1. The primary Bloom's Taxonomy level (REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE)
2. The cognitive skills being assessed
3. Keywords that indicate the cognitive level
4. Your confidence level (0-100)

Respond in JSON format:
{
  "bloomsLevel": "LEVEL",
  "cognitiveSkills": ["skill1", "skill2"],
  "confidence": 85,
  "keywords": ["keyword1", "keyword2"],
  "rationale": "Brief explanation"
}

Cognitive skill options: CRITICAL_THINKING, PROBLEM_SOLVING, CREATIVE_THINKING, ANALYTICAL_THINKING, LOGICAL_REASONING, METACOGNITION, INFORMATION_PROCESSING, DECISION_MAKING`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Analyze this question: "${questionText}"` }
      ],
    });

    const aiResponse = response.content[0];
    const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionText,
          bloomsLevel: parsed.bloomsLevel as BloomsLevel,
          cognitiveSkills: parsed.cognitiveSkills as CognitiveSkillType[],
          confidence: parsed.confidence,
          keywords: parsed.keywords,
          rationale: parsed.rationale,
        };
      }
    } catch {
      // Fallback to keyword analysis
    }

    // Fallback to keyword-based analysis
    const bloomsLevel = this.analyzeQuestionText(questionText);
    return {
      questionText,
      bloomsLevel,
      cognitiveSkills: this.getCognitiveSkillsForBloomsLevel(bloomsLevel),
      confidence: 60,
      keywords: [],
      rationale: 'Analyzed using keyword matching',
    };
  }

  /**
   * Update cognitive skill progress for a user
   */
  async updateCognitiveProgress(
    userId: string,
    conceptId: string,
    bloomsLevel: BloomsLevel,
    score: number // 0-100
  ): Promise<void> {
    const existingProgress = await db.cognitiveSkillProgress.findUnique({
      where: { userId_conceptId: { userId, conceptId } },
    });

    const normalizedScore = Math.min(100, Math.max(0, score));
    const levelKey = `${bloomsLevel.toLowerCase()}Mastery` as keyof typeof levelUpdates;

    // Calculate weighted update (blend old and new scores)
    const blendFactor = 0.3; // New score contributes 30%
    const levelUpdates = {
      rememberMastery: existingProgress?.rememberMastery || 0,
      understandMastery: existingProgress?.understandMastery || 0,
      applyMastery: existingProgress?.applyMastery || 0,
      analyzeMastery: existingProgress?.analyzeMastery || 0,
      evaluateMastery: existingProgress?.evaluateMastery || 0,
      createMastery: existingProgress?.createMastery || 0,
    };

    // Update the specific level
    const currentValue = levelUpdates[levelKey] || 0;
    levelUpdates[levelKey] = currentValue * (1 - blendFactor) + normalizedScore * blendFactor;

    // Calculate overall mastery
    const overallMastery =
      levelUpdates.rememberMastery * 0.1 +
      levelUpdates.understandMastery * 0.15 +
      levelUpdates.applyMastery * 0.2 +
      levelUpdates.analyzeMastery * 0.2 +
      levelUpdates.evaluateMastery * 0.15 +
      levelUpdates.createMastery * 0.2;

    // Determine current Bloom's level and mastery status
    const currentBloomsLevel = this.determineCurrentBloomsLevel(levelUpdates);
    const masteryLevel = this.determineMasteryStatus(overallMastery);

    await db.cognitiveSkillProgress.upsert({
      where: { userId_conceptId: { userId, conceptId } },
      update: {
        ...levelUpdates,
        overallMastery,
        currentBloomsLevel,
        masteryLevel,
        totalAttempts: { increment: 1 },
        lastAttemptDate: new Date(),
      },
      create: {
        userId,
        conceptId,
        ...levelUpdates,
        overallMastery,
        currentBloomsLevel,
        masteryLevel,
        totalAttempts: 1,
        lastAttemptDate: new Date(),
      },
    });
  }

  /**
   * Determine the current Bloom's level based on mastery scores
   */
  private determineCurrentBloomsLevel(mastery: Record<string, number>): BloomsLevel {
    const threshold = 60; // 60% mastery to consider level achieved

    if (mastery.createMastery >= threshold) return 'CREATE';
    if (mastery.evaluateMastery >= threshold) return 'EVALUATE';
    if (mastery.analyzeMastery >= threshold) return 'ANALYZE';
    if (mastery.applyMastery >= threshold) return 'APPLY';
    if (mastery.understandMastery >= threshold) return 'UNDERSTAND';
    return 'REMEMBER';
  }

  /**
   * Determine mastery status based on overall score
   */
  private determineMasteryStatus(overallMastery: number): MasteryLevel {
    if (overallMastery >= 90) return 'MASTERED';
    if (overallMastery >= 75) return 'PROFICIENT';
    if (overallMastery >= 50) return 'PROGRESSING';
    if (overallMastery >= 25) return 'DEVELOPING';
    return 'NOT_STARTED';
  }

  /**
   * Calculate spaced repetition schedule using SM-2 algorithm
   */
  async calculateSpacedRepetition(params: SpacedRepetitionParams): Promise<{
    nextReviewDate: Date;
    easeFactor: number;
    interval: number;
    repetitions: number;
  }> {
    const {
      userId,
      conceptId,
      performance,
      currentEaseFactor = 2.5,
      currentInterval = 1,
      repetitions = 0,
    } = params;

    // SM-2 Algorithm
    let newEaseFactor = currentEaseFactor;
    let newInterval = currentInterval;
    let newRepetitions = repetitions;

    if (performance >= 3) {
      // Correct response
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * newEaseFactor);
      }
      newRepetitions++;
    } else {
      // Incorrect response - reset
      newRepetitions = 0;
      newInterval = 1;
    }

    // Update ease factor
    newEaseFactor = Math.max(
      1.3,
      currentEaseFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02))
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Store in database
    await db.spacedRepetitionSchedule.upsert({
      where: { userId_conceptId: { userId, conceptId } },
      update: {
        nextReviewDate,
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        lastScore: performance,
        retentionEstimate: this.calculateRetention(newInterval),
      },
      create: {
        userId,
        conceptId,
        nextReviewDate,
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        lastScore: performance,
        retentionEstimate: this.calculateRetention(newInterval),
      },
    });

    return {
      nextReviewDate,
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
    };
  }

  /**
   * Estimate retention based on interval (forgetting curve)
   */
  private calculateRetention(interval: number): number {
    // Simple forgetting curve: R = e^(-t/S) where S is stability
    const stability = 20; // Average stability in days
    return Math.exp(-interval / stability) * 100;
  }

  /**
   * Get comprehensive cognitive progress analysis for a user
   */
  async getCognitiveProgressAnalysis(
    userId: string,
    conceptId: string
  ): Promise<CognitiveProgressAnalysis> {
    const progress = await db.cognitiveSkillProgress.findUnique({
      where: { userId_conceptId: { userId, conceptId } },
    });

    if (!progress) {
      return this.getEmptyCognitiveProgress(userId, conceptId);
    }

    const masteryLevels: Record<BloomsLevel, number> = {
      REMEMBER: progress.rememberMastery,
      UNDERSTAND: progress.understandMastery,
      APPLY: progress.applyMastery,
      ANALYZE: progress.analyzeMastery,
      EVALUATE: progress.evaluateMastery,
      CREATE: progress.createMastery,
    };

    const cognitiveSkillBreakdown = this.buildCognitiveBreakdown(masteryLevels);
    const recommendations = this.generateCognitiveRecommendations(masteryLevels);

    return {
      userId,
      conceptId,
      masteryLevels,
      overallMastery: progress.overallMastery,
      currentLevel: progress.currentBloomsLevel,
      masteryStatus: progress.masteryLevel,
      cognitiveSkillBreakdown,
      recommendations,
    };
  }

  /**
   * Get empty cognitive progress for new users
   */
  private getEmptyCognitiveProgress(userId: string, conceptId: string): CognitiveProgressAnalysis {
    return {
      userId,
      conceptId,
      masteryLevels: {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0,
      },
      overallMastery: 0,
      currentLevel: 'REMEMBER',
      masteryStatus: 'NOT_STARTED',
      cognitiveSkillBreakdown: [],
      recommendations: [
        {
          type: 'practice',
          targetLevel: 'REMEMBER',
          activity: 'Start with basic recall exercises',
          estimatedTime: 15,
          priority: 'high',
        },
      ],
    };
  }

  /**
   * Build cognitive skill breakdown from mastery levels
   */
  private buildCognitiveBreakdown(masteryLevels: Record<BloomsLevel, number>): CognitiveSkillBreakdown[] {
    const skillMastery: Record<CognitiveSkillType, number[]> = {
      CRITICAL_THINKING: [],
      PROBLEM_SOLVING: [],
      CREATIVE_THINKING: [],
      ANALYTICAL_THINKING: [],
      LOGICAL_REASONING: [],
      METACOGNITION: [],
      INFORMATION_PROCESSING: [],
      DECISION_MAKING: [],
    };

    // Aggregate mastery per cognitive skill
    for (const mapping of this.cognitiveSkillMap) {
      const levelMastery = masteryLevels[mapping.bloomsLevel];
      for (const skill of mapping.cognitiveSkills) {
        skillMastery[skill].push(levelMastery);
      }
    }

    const breakdowns: CognitiveSkillBreakdown[] = [];
    for (const [skill, masteryValues] of Object.entries(skillMastery)) {
      if (masteryValues.length > 0) {
        const avgMastery = masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length;
        breakdowns.push({
          skill: skill as CognitiveSkillType,
          mastery: avgMastery,
          recentActivity: this.getRecentActivityForSkill(skill as CognitiveSkillType),
          nextAction: this.getNextActionForSkill(skill as CognitiveSkillType, avgMastery),
        });
      }
    }

    return breakdowns.sort((a, b) => b.mastery - a.mastery);
  }

  /**
   * Get recent activity description for a cognitive skill
   */
  private getRecentActivityForSkill(skill: CognitiveSkillType): string {
    const activities: Record<CognitiveSkillType, string> = {
      CRITICAL_THINKING: 'Evaluated and analyzed content',
      PROBLEM_SOLVING: 'Solved practical problems',
      CREATIVE_THINKING: 'Created original solutions',
      ANALYTICAL_THINKING: 'Analyzed data and patterns',
      LOGICAL_REASONING: 'Applied logical principles',
      METACOGNITION: 'Reflected on learning process',
      INFORMATION_PROCESSING: 'Processed new information',
      DECISION_MAKING: 'Made informed decisions',
    };
    return activities[skill];
  }

  /**
   * Get next action recommendation for a cognitive skill
   */
  private getNextActionForSkill(skill: CognitiveSkillType, mastery: number): string {
    if (mastery < 30) {
      return `Practice basic ${skill.toLowerCase().replace(/_/g, ' ')} exercises`;
    } else if (mastery < 60) {
      return `Engage in intermediate ${skill.toLowerCase().replace(/_/g, ' ')} challenges`;
    } else if (mastery < 80) {
      return `Tackle advanced ${skill.toLowerCase().replace(/_/g, ' ')} problems`;
    }
    return `Maintain ${skill.toLowerCase().replace(/_/g, ' ')} through varied application`;
  }

  /**
   * Generate cognitive recommendations based on mastery levels
   */
  private generateCognitiveRecommendations(masteryLevels: Record<BloomsLevel, number>): CognitiveRecommendation[] {
    const recommendations: CognitiveRecommendation[] = [];

    // Find weakest levels
    const sortedLevels = Object.entries(masteryLevels)
      .sort(([, a], [, b]) => a - b);

    // Add recommendations for weak areas
    for (const [level, mastery] of sortedLevels.slice(0, 3)) {
      if (mastery < 50) {
        recommendations.push({
          type: mastery < 20 ? 'practice' : 'reinforce',
          targetLevel: level as BloomsLevel,
          activity: this.getActivityForLevel(level as BloomsLevel),
          estimatedTime: 20 + (this.bloomsLevels.indexOf(level as BloomsLevel) * 5),
          priority: mastery < 20 ? 'high' : 'medium',
        });
      }
    }

    // Add advancement recommendation if ready
    const highestMasteredLevel = sortedLevels
      .reverse()
      .find(([, mastery]) => mastery >= 70);

    if (highestMasteredLevel) {
      const currentIndex = this.bloomsLevels.indexOf(highestMasteredLevel[0] as BloomsLevel);
      if (currentIndex < this.bloomsLevels.length - 1) {
        const nextLevel = this.bloomsLevels[currentIndex + 1];
        recommendations.push({
          type: 'advance',
          targetLevel: nextLevel,
          activity: this.getActivityForLevel(nextLevel),
          estimatedTime: 30 + (currentIndex * 10),
          priority: 'medium',
        });
      }
    }

    return recommendations;
  }

  /**
   * Get recommended activity for a Bloom's level
   */
  private getActivityForLevel(level: BloomsLevel): string {
    const activities: Record<BloomsLevel, string> = {
      REMEMBER: 'Flashcard review and terminology practice',
      UNDERSTAND: 'Concept explanation and summarization exercises',
      APPLY: 'Problem-solving and case study analysis',
      ANALYZE: 'Comparative analysis and pattern identification',
      EVALUATE: 'Critical evaluation and argument assessment',
      CREATE: 'Project creation and original solution design',
    };
    return activities[level];
  }

  /**
   * Log a learning activity for tracking
   */
  async logLearningActivity(
    userId: string,
    activityType: 'READ_CONTENT' | 'WATCH_VIDEO' | 'PRACTICE_QUESTIONS' | 'DISCUSSION' | 'CREATE_PROJECT' | 'PEER_REVIEW' | 'REFLECTION' | 'TAKE_EXAM' | 'REVIEW_MISTAKES',
    options: {
      sectionId?: string;
      courseId?: string;
      bloomsLevel?: BloomsLevel;
      duration?: number;
      score?: number;
      contentId?: string;
      contentType?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await db.learningActivityLog.create({
      data: {
        userId,
        activityType,
        sectionId: options.sectionId,
        courseId: options.courseId,
        bloomsLevel: options.bloomsLevel,
        duration: options.duration,
        score: options.score,
        contentId: options.contentId,
        contentType: options.contentType,
        metadata: options.metadata as any,
      },
    });
  }

  /**
   * Create a progress intervention for a user
   */
  async createProgressIntervention(
    userId: string,
    interventionType: 'ENCOURAGEMENT' | 'CHALLENGE_INCREASE' | 'SUPPORT_NEEDED' | 'REVIEW_REQUIRED' | 'CELEBRATION' | 'GUIDANCE' | 'REMEDIATION',
    title: string,
    message: string,
    options?: {
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
      courseId?: string;
      sectionId?: string;
      conceptId?: string;
      suggestedActions?: string[];
      expiresAt?: Date;
    }
  ): Promise<void> {
    await db.progressIntervention.create({
      data: {
        userId,
        interventionType,
        title,
        message,
        priority: options?.priority || 'MEDIUM',
        courseId: options?.courseId,
        sectionId: options?.sectionId,
        conceptId: options?.conceptId,
        suggestedActions: options?.suggestedActions as any,
        expiresAt: options?.expiresAt,
      },
    });
  }

  /**
   * Get due concepts for spaced repetition review
   */
  async getDueReviews(userId: string, limit = 10): Promise<{
    conceptId: string;
    nextReviewDate: Date;
    interval: number;
    retentionEstimate: number;
  }[]> {
    const now = new Date();
    const schedules = await db.spacedRepetitionSchedule.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
      orderBy: { nextReviewDate: 'asc' },
      take: limit,
    });

    return schedules.map(s => ({
      conceptId: s.conceptId,
      nextReviewDate: s.nextReviewDate,
      interval: s.interval,
      retentionEstimate: s.retentionEstimate,
    }));
  }
}
