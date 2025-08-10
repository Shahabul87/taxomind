import { db } from '@/lib/db';
import { BloomsLevel } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';

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
    const sectionAnalyses = await Promise.all(
      chapter.sections.map((section: any) => this.analyzeSection(section))
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
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
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
      bloomsDistribution: analysis.courseLevel.distribution,
      cognitiveDepth: analysis.courseLevel.cognitiveDepth,
      learningPathway: analysis.learningPathway,
      skillsMatrix: analysis.studentImpact.skillsDeveloped,
      gapAnalysis: analysis.learningPathway.gaps,
      recommendations: analysis.recommendations,
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
          secondaryLevels: [],
          activities: section.activities,
          assessments: [],
          learningObjectives: section.learningObjectives,
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
}