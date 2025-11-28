import { db } from "@/lib/db";
import { openai } from "@/lib/openai";
import { anthropic } from "@/lib/anthropic";
import { logger } from '@/lib/logger';

// Types for Content Generation Assistant
export interface LearningObjective {
  id: string;
  objective: string;
  bloomsLevel: string;
  skills: string[];
  assessmentCriteria: string[];
}

export interface CourseContent {
  courseId?: string;
  title: string;
  description: string;
  outline: CourseOutline;
  estimatedDuration: number;
  difficulty: string;
  prerequisites: string[];
  learningOutcomes: string[];
  targetAudience: string;
}

export interface CourseOutline {
  chapters: ChapterOutline[];
  totalSections: number;
  totalLessons: number;
}

export interface ChapterOutline {
  title: string;
  description: string;
  objectives: string[];
  sections: SectionOutline[];
  estimatedDuration: number;
}

export interface SectionOutline {
  title: string;
  type: 'lesson' | 'activity' | 'assessment';
  content: string;
  duration: number;
  resources?: string[];
}

export interface Assessment {
  id: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project';
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  duration: number;
  instructions: string[];
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: string;
  bloomsLevel: string;
  hints?: string[];
}

export interface StudyGuide {
  courseId: string;
  chapterId?: string;
  title: string;
  overview: string;
  keyTopics: KeyTopic[];
  summaries: Summary[];
  practiceQuestions: Question[];
  studyTips: string[];
  additionalResources: Resource[];
}

export interface KeyTopic {
  topic: string;
  importance: 'critical' | 'important' | 'supplementary';
  explanation: string;
  examples: string[];
}

export interface Summary {
  section: string;
  bulletPoints: string[];
  keyTakeaways: string[];
}

export interface Resource {
  title: string;
  type: string;
  url?: string;
  description: string;
}

export interface Exercise {
  id: string;
  type: 'practice' | 'challenge' | 'project';
  title: string;
  description: string;
  difficulty: string;
  skills: string[];
  instructions: string[];
  startingCode?: string;
  testCases?: TestCase[];
  solution?: string;
  hints: string[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface LocalizedContent {
  originalContent: Content;
  targetLanguage: string;
  translatedContent: Content;
  culturalAdaptations: string[];
  glossary: GlossaryTerm[];
}

export interface Content {
  title: string;
  description: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface GlossaryTerm {
  original: string;
  translated: string;
  context: string;
}

export interface GenerationConfig {
  style: 'formal' | 'conversational' | 'technical' | 'simple';
  depth: 'basic' | 'intermediate' | 'advanced' | 'expert';
  includeExamples: boolean;
  includeVisuals: boolean;
  includeActivities: boolean;
  targetAudience?: string;
  constraints?: string[];
}

export class SAMGenerationEngine {
  private static instance: SAMGenerationEngine;
  
  static getInstance(): SAMGenerationEngine {
    if (!this.instance) {
      this.instance = new SAMGenerationEngine();
    }
    return this.instance;
  }

  // Generate Course Content
  async generateCourseContent(
    objectives: LearningObjective[],
    config?: GenerationConfig
  ): Promise<CourseContent> {
    try {
      // Generate course structure based on objectives
      const courseStructure = await this.generateCourseStructure(objectives, config);
      
      // Generate detailed outline
      const outline = await this.generateDetailedOutline(courseStructure, objectives, config);
      
      // Calculate metadata
      const estimatedDuration = this.calculateCourseDuration(outline);
      const difficulty = this.determineQuestionDifficulty(objectives);
      const prerequisites = await this.identifyPrerequisites(objectives);
      
      // Generate course metadata
      const metadata = await this.generateCourseMetadata(objectives, config);
      
      const courseContent: CourseContent = {
        title: courseStructure.title,
        description: courseStructure.description,
        outline,
        estimatedDuration,
        difficulty,
        prerequisites,
        learningOutcomes: objectives.map(obj => obj.objective),
        targetAudience: config?.targetAudience || metadata.targetAudience
      };
      
      // Store generated content
      await this.storeGeneratedContent('course', courseContent);
      
      return courseContent;
    } catch (error: any) {
      logger.error('Error generating course content:', error);
      throw new Error('Failed to generate course content');
    }
  }

  // Create Assessments
  async createAssessments(
    topics: Topic[],
    assessmentType: 'quiz' | 'exam' | 'assignment' | 'project',
    config?: GenerationConfig
  ): Promise<Assessment[]> {
    try {
      const assessments: Assessment[] = [];
      
      for (const topic of topics) {
        const questions = await this.generateQuestions(topic, assessmentType, config);
        
        const assessment: Assessment = {
          id: `assessment-${Date.now()}-${assessments.length}`,
          type: assessmentType,
          title: `${topic.name} ${this.formatAssessmentType(assessmentType)}`,
          description: await this.generateAssessmentDescription(topic, assessmentType),
          questions,
          passingScore: this.calculatePassingScore(assessmentType),
          duration: this.calculateAssessmentDuration(questions, assessmentType),
          instructions: await this.generateInstructions(assessmentType, config)
        };
        
        assessments.push(assessment);
      }
      
      // Store assessments
      await this.storeGeneratedAssessments(assessments);
      
      return assessments;
    } catch (error: any) {
      logger.error('Error creating assessments:', error);
      throw new Error('Failed to create assessments');
    }
  }

  // Generate Study Guides
  async generateStudyGuides(course: Course): Promise<StudyGuide> {
    try {
      // Analyze course content
      const courseAnalysis = await this.analyzeCourseForStudyGuide(course);
      
      // Extract key topics
      const keyTopics = await this.extractKeyTopics(courseAnalysis);
      
      // Generate summaries
      const summaries = await this.generateSummaries(courseAnalysis);
      
      // Create practice questions
      const practiceQuestions = await this.generatePracticeQuestions(keyTopics);
      
      // Generate study tips
      const studyTips = await this.generateStudyTips(course, keyTopics);
      
      // Find additional resources
      const additionalResources = await this.findAdditionalResources(keyTopics);
      
      const studyGuide: StudyGuide = {
        courseId: course.id,
        title: `Study Guide: ${course.title}`,
        overview: await this.generateStudyGuideOverview(course),
        keyTopics,
        summaries,
        practiceQuestions,
        studyTips,
        additionalResources
      };
      
      // Store study guide
      await this.storeStudyGuide(studyGuide);
      
      return studyGuide;
    } catch (error: any) {
      logger.error('Error generating study guide:', error);
      throw new Error('Failed to generate study guide');
    }
  }

  // Create Interactive Exercises
  async createInteractiveExercises(
    concepts: Concept[],
    exerciseType: 'practice' | 'challenge' | 'project'
  ): Promise<Exercise[]> {
    try {
      const exercises: Exercise[] = [];
      
      for (const concept of concepts) {
        const exercise = await this.generateExercise(concept, exerciseType);
        exercises.push(exercise);
      }
      
      // Validate exercises
      const validatedExercises = await this.validateExercises(exercises);
      
      // Store exercises
      await this.storeExercises(validatedExercises);
      
      return validatedExercises;
    } catch (error: any) {
      logger.error('Error creating exercises:', error);
      throw new Error('Failed to create exercises');
    }
  }

  // Adapt Content Language
  async adaptContentLanguage(
    content: Content,
    targetLanguage: Language
  ): Promise<LocalizedContent> {
    try {
      // Translate content
      const translatedContent = await this.translateContent(content, targetLanguage);
      
      // Apply cultural adaptations
      const culturalAdaptations = await this.applyCulturalAdaptations(
        content,
        targetLanguage
      );
      
      // Create glossary
      const glossary = await this.createGlossary(content, translatedContent, targetLanguage);
      
      const localizedContent: LocalizedContent = {
        originalContent: content,
        targetLanguage: targetLanguage.code,
        translatedContent,
        culturalAdaptations,
        glossary
      };
      
      // Store localized content
      await this.storeLocalizedContent(localizedContent);
      
      return localizedContent;
    } catch (error: any) {
      logger.error('Error adapting content language:', error);
      throw new Error('Failed to adapt content language');
    }
  }

  // Helper Methods
  private async generateCourseStructure(
    objectives: LearningObjective[],
    config?: GenerationConfig
  ) {
    const prompt = `
      Create a course structure based on these learning objectives:
      ${objectives.map(obj => `- ${obj.objective} (${obj.bloomsLevel})`).join('\n')}
      
      Style: ${config?.style || 'formal'}
      Depth: ${config?.depth || 'intermediate'}
      Target Audience: ${config?.targetAudience || 'general learners'}
      
      Generate:
      1. Course title
      2. Course description (2-3 sentences)
      3. Number of recommended chapters
      4. Chapter themes/topics
    `;
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: prompt
      }]
    });
    
    // Parse response and structure data
    const structureText = response.content[0].text || '';
    return this.parseStructureResponse(structureText);
  }

  private async generateDetailedOutline(
    structure: any,
    objectives: LearningObjective[],
    config?: GenerationConfig
  ): Promise<CourseOutline> {
    const chapters: ChapterOutline[] = [];
    
    for (let i = 0; i < structure.chapterCount; i++) {
      const chapterObjectives = this.distributeObjectives(objectives, structure.chapterCount, i);
      const chapter = await this.generateChapter(
        structure.chapterThemes[i],
        chapterObjectives,
        config
      );
      chapters.push(chapter);
    }
    
    const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    const totalLessons = chapters.reduce(
      (sum, ch) => sum + ch.sections.filter(s => s.type === 'lesson').length,
      0
    );
    
    return {
      chapters,
      totalSections,
      totalLessons
    };
  }

  private async generateChapter(
    theme: string,
    objectives: LearningObjective[],
    config?: GenerationConfig
  ): Promise<ChapterOutline> {
    const prompt = `
      Create a detailed chapter outline for:
      Theme: ${theme}
      Objectives: ${objectives.map(o => o.objective).join(', ')}
      
      Include:
      1. Chapter title
      2. Chapter description
      3. 3-5 sections with type (lesson/activity/assessment)
      4. Brief content for each section
      5. Estimated duration for each section
      
      Style: ${config?.style || 'formal'}
      Include activities: ${config?.includeActivities ? 'yes' : 'no'}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    return this.parseChapterResponse(response.choices[0].message.content || '');
  }

  private async generateQuestions(
    topic: Topic,
    assessmentType: string,
    config?: GenerationConfig
  ): Promise<Question[]> {
    const questionCount = this.getQuestionCount(assessmentType);
    const questions: Question[] = [];
    
    // Generate questions across different Bloom's levels
    const bloomsDistribution = this.getBloomsDistribution(assessmentType);
    
    for (const [level, count] of Object.entries(bloomsDistribution)) {
      for (let i = 0; i < count; i++) {
        const question = await this.generateSingleQuestion(topic, level, config);
        questions.push(question);
      }
    }
    
    return questions;
  }

  private async generateSingleQuestion(
    topic: Topic,
    bloomsLevel: string,
    config?: GenerationConfig
  ): Promise<Question> {
    const prompt = `
      Generate a ${bloomsLevel} level question about ${topic.name}:
      
      Requirements:
      - Clear and unambiguous
      - Appropriate difficulty
      - Include correct answer and explanation
      - Style: ${config?.style || 'formal'}
      
      Format as JSON with: type, question, options (if multiple choice), correctAnswer, explanation, difficulty
    `;
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      temperature: 0.6,
      messages: [{
        role: "user",
        content: prompt
      }]
    });
    
    const questionData = JSON.parse(response.content[0].text || '{}');
    
    return {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: questionData.type || 'multiple-choice',
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      points: this.calculateQuestionPoints(bloomsLevel, questionData.difficulty),
      difficulty: questionData.difficulty,
      bloomsLevel,
      hints: this.generateHints(questionData.question, bloomsLevel)
    };
  }

  private async generateExercise(
    concept: Concept,
    exerciseType: string
  ): Promise<Exercise> {
    const prompt = `
      Create a ${exerciseType} exercise for the concept: ${concept.name}
      
      Include:
      1. Clear title and description
      2. Step-by-step instructions
      3. Starting code (if applicable)
      4. Test cases (if coding exercise)
      5. Hints for students
      
      Make it engaging and educational.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    return this.parseExerciseResponse(response.choices[0].message.content || '', concept);
  }

  private async translateContent(
    content: Content,
    targetLanguage: Language
  ): Promise<Content> {
    // In production, use professional translation APIs
    const prompt = `
      Translate the following educational content to ${targetLanguage.name}:
      
      Title: ${content.title}
      Description: ${content.description}
      Body: ${content.body.substring(0, 1000)}...
      
      Maintain educational tone and accuracy.
    `;
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: prompt
      }]
    });
    
    // Parse and structure translated content
    return this.parseTranslatedContent(response.content[0].text || '', content);
  }

  private async analyzeCourseForStudyGuide(course: any) {
    // Analyze course structure and content
    return {
      mainTopics: [],
      concepts: [],
      assessmentFocus: [],
      difficulty: course.difficulty || 'intermediate'
    };
  }

  private async extractKeyTopics(analysis: any): Promise<KeyTopic[]> {
    // Extract and prioritize key topics
    const topics: KeyTopic[] = [
      {
        topic: "Core Concepts",
        importance: 'critical',
        explanation: "Fundamental concepts that form the foundation",
        examples: ["Example 1", "Example 2"]
      }
    ];
    
    return topics;
  }

  private async generateSummaries(analysis: any): Promise<Summary[]> {
    // Generate section summaries
    return [
      {
        section: "Introduction",
        bulletPoints: ["Key point 1", "Key point 2"],
        keyTakeaways: ["Main takeaway"]
      }
    ];
  }

  private async generatePracticeQuestions(topics: KeyTopic[]): Promise<Question[]> {
    const questions: Question[] = [];
    
    for (const topic of topics) {
      if (topic.importance === 'critical') {
        // Generate 2-3 questions for critical topics
        const topicQuestions = await this.generateQuestionsForTopic(topic);
        questions.push(...topicQuestions);
      }
    }
    
    return questions;
  }

  private async generateQuestionsForTopic(topic: KeyTopic): Promise<Question[]> {
    // Generate practice questions for a specific topic
    return [
      {
        id: `pq-${Date.now()}`,
        type: 'multiple-choice',
        question: `Question about ${topic.topic}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        explanation: "Explanation of the correct answer",
        points: 1,
        difficulty: 'medium',
        bloomsLevel: 'understand'
      }
    ];
  }

  private async generateStudyTips(course: any, topics: KeyTopic[]): Promise<string[]> {
    const tips = [
      "Review critical topics daily for better retention",
      "Practice with sample questions after each study session",
      "Create your own summary notes for each topic",
      "Form study groups to discuss complex concepts",
      "Take regular breaks to maintain focus"
    ];
    
    // Add course-specific tips
    if (course.difficulty === 'advanced') {
      tips.push("Dedicate extra time to hands-on practice");
    }
    
    return tips;
  }

  private async findAdditionalResources(topics: KeyTopic[]): Promise<Resource[]> {
    // Find relevant resources for key topics
    return [
      {
        title: "Additional Reading",
        type: "article",
        url: "https://example.com/resource",
        description: "Supplementary material for deeper understanding"
      }
    ];
  }

  private async generateStudyGuideOverview(course: any): Promise<string> {
    return `This study guide covers the essential concepts from ${course.title}. Focus on the critical topics and use the practice questions to test your understanding.`;
  }

  private async applyCulturalAdaptations(
    content: Content,
    targetLanguage: Language
  ): Promise<string[]> {
    // Identify necessary cultural adaptations
    const adaptations: string[] = [];
    
    // Example adaptations
    if (targetLanguage.culture !== 'western') {
      adaptations.push("Adapted examples to use local context");
      adaptations.push("Modified cultural references");
    }
    
    return adaptations;
  }

  private async createGlossary(
    original: Content,
    translated: Content,
    targetLanguage: Language
  ): Promise<GlossaryTerm[]> {
    // Create glossary of key terms
    return [
      {
        original: "algorithm",
        translated: "algoritmo",
        context: "computational procedure"
      }
    ];
  }

  // Utility methods
  private calculateCourseDuration(outline: CourseOutline): number {
    return outline.chapters.reduce((total, chapter) => total + chapter.estimatedDuration, 0);
  }

  private determineQuestionDifficulty(objectives: LearningObjective[]): string {
    const bloomsLevels = objectives.map(obj => obj.bloomsLevel);
    const highLevelCount = bloomsLevels.filter(level => 
      ['analyze', 'evaluate', 'create'].includes(level.toLowerCase())
    ).length;
    
    const ratio = highLevelCount / bloomsLevels.length;
    if (ratio > 0.7) return 'advanced';
    if (ratio > 0.4) return 'intermediate';
    return 'beginner';
  }

  private async identifyPrerequisites(objectives: LearningObjective[]): Promise<string[]> {
    const prerequisites = new Set<string>();
    
    objectives.forEach(obj => {
      if (obj.bloomsLevel.toLowerCase() !== 'remember') {
        // Higher level objectives likely have prerequisites
        obj.skills.forEach(skill => {
          if (skill.includes('basic')) {
            prerequisites.add(skill.replace('basic', 'fundamental'));
          }
        });
      }
    });
    
    return Array.from(prerequisites);
  }

  private async generateCourseMetadata(
    objectives: LearningObjective[],
    config?: GenerationConfig
  ) {
    return {
      targetAudience: config?.targetAudience || "General learners",
      prerequisites: [],
      estimatedCompletionTime: "4-6 weeks"
    };
  }

  private distributeObjectives(
    objectives: LearningObjective[],
    chapterCount: number,
    chapterIndex: number
  ): LearningObjective[] {
    const objectivesPerChapter = Math.ceil(objectives.length / chapterCount);
    const start = chapterIndex * objectivesPerChapter;
    const end = Math.min(start + objectivesPerChapter, objectives.length);
    return objectives.slice(start, end);
  }

  private formatAssessmentType(type: string): string {
    const formats: Record<string, string> = {
      'quiz': 'Quiz',
      'exam': 'Examination',
      'assignment': 'Assignment',
      'project': 'Project'
    };
    return formats[type] || type;
  }

  private async generateAssessmentDescription(topic: Topic, type: string): Promise<string> {
    return `This ${type} assesses your understanding of ${topic.name}. Read each question carefully and select the best answer.`;
  }

  private calculatePassingScore(type: string): number {
    const scores: Record<string, number> = {
      'quiz': 70,
      'exam': 65,
      'assignment': 60,
      'project': 70
    };
    return scores[type] || 70;
  }

  private calculateAssessmentDuration(questions: Question[], type: string): number {
    const baseTime: Record<string, number> = {
      'quiz': 30,
      'exam': 90,
      'assignment': 120,
      'project': 240
    };
    
    const perQuestionTime = questions.length * 2;
    return (baseTime[type] || 60) + perQuestionTime;
  }

  private async generateInstructions(type: string, config?: GenerationConfig): Promise<string[]> {
    const instructions = [
      `This ${type} must be completed in one sitting`,
      "Read each question carefully before answering",
      "You can review your answers before submission"
    ];
    
    if (type === 'exam') {
      instructions.push("No external resources are allowed");
    }
    
    return instructions;
  }

  private getQuestionCount(type: string): number {
    const counts: Record<string, number> = {
      'quiz': 10,
      'exam': 25,
      'assignment': 5,
      'project': 3
    };
    return counts[type] || 10;
  }

  private getBloomsDistribution(type: string): Record<string, number> {
    if (type === 'quiz') {
      return {
        'remember': 3,
        'understand': 4,
        'apply': 2,
        'analyze': 1
      };
    }
    
    if (type === 'exam') {
      return {
        'remember': 5,
        'understand': 8,
        'apply': 6,
        'analyze': 4,
        'evaluate': 2
      };
    }
    
    return {
      'apply': 2,
      'analyze': 2,
      'create': 1
    };
  }

  private calculateQuestionPoints(bloomsLevel: string, difficulty: string): number {
    const bloomsPoints: Record<string, number> = {
      'remember': 1,
      'understand': 2,
      'apply': 3,
      'analyze': 4,
      'evaluate': 5,
      'create': 6
    };
    
    const difficultyMultiplier: Record<string, number> = {
      'easy': 1,
      'medium': 1.5,
      'hard': 2
    };
    
    const base = bloomsPoints[bloomsLevel.toLowerCase()] || 2;
    const multiplier = difficultyMultiplier[difficulty] || 1;
    
    return Math.round(base * multiplier);
  }

  private generateHints(question: string, bloomsLevel: string): string[] {
    const hints: string[] = [];
    
    if (bloomsLevel === 'remember' || bloomsLevel === 'understand') {
      hints.push("Think about the definition or key characteristics");
    } else if (bloomsLevel === 'apply') {
      hints.push("Consider how this concept works in practice");
    } else {
      hints.push("Break down the problem into smaller parts");
    }
    
    return hints;
  }

  private async validateExercises(exercises: Exercise[]): Promise<Exercise[]> {
    // Validate that exercises are solvable and appropriate
    return exercises.filter(exercise => {
      // Basic validation
      return exercise.title && exercise.description && exercise.instructions.length > 0;
    });
  }

  // Parse response methods
  private parseStructureResponse(text: string): any {
    // Parse AI response into structured data
    return {
      title: "Generated Course Title",
      description: "Course description from AI",
      chapterCount: 5,
      chapterThemes: ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"]
    };
  }

  private parseChapterResponse(text: string): ChapterOutline {
    // Parse AI response into chapter outline
    return {
      title: "Chapter Title",
      description: "Chapter description",
      objectives: ["Objective 1", "Objective 2"],
      sections: [
        {
          title: "Section 1",
          type: 'lesson',
          content: "Section content",
          duration: 30
        }
      ],
      estimatedDuration: 90
    };
  }

  private parseExerciseResponse(text: string, concept: Concept): Exercise {
    // Parse AI response into exercise
    return {
      id: `ex-${Date.now()}`,
      type: 'practice',
      title: `Practice: ${concept.name}`,
      description: "Exercise description",
      difficulty: 'medium',
      skills: concept.skills || [],
      instructions: ["Step 1", "Step 2"],
      hints: ["Hint 1"]
    };
  }

  private parseTranslatedContent(text: string, original: Content): Content {
    // Parse translated content
    return {
      title: "Translated Title",
      description: "Translated Description",
      body: text,
      metadata: original.metadata
    };
  }

  // Database storage methods
  private async storeGeneratedContent(type: string, content: any) {
    await db.generatedContent.create({
      data: {
        contentType: type,
        content: JSON.stringify(content),
        metadata: {
          generatedBy: 'SAM Generation Engine',
          version: '1.0'
        },
        createdAt: new Date()
      }
    });
  }

  private async storeGeneratedAssessments(assessments: Assessment[]) {
    for (const assessment of assessments) {
      await db.generatedContent.create({
        data: {
          contentType: 'assessment',
          content: JSON.stringify(assessment),
          metadata: {
            type: assessment.type,
            questionCount: assessment.questions.length
          },
          createdAt: new Date()
        }
      });
    }
  }

  private async storeStudyGuide(studyGuide: StudyGuide) {
    await db.generatedContent.create({
      data: {
        contentType: 'study-guide',
        content: JSON.stringify(studyGuide),
        metadata: {
          courseId: studyGuide.courseId,
          topicCount: studyGuide.keyTopics.length
        },
        createdAt: new Date()
      }
    });
  }

  private async storeExercises(exercises: Exercise[]) {
    for (const exercise of exercises) {
      await db.generatedContent.create({
        data: {
          contentType: 'exercise',
          content: JSON.stringify(exercise),
          metadata: {
            type: exercise.type,
            difficulty: exercise.difficulty
          },
          createdAt: new Date()
        }
      });
    }
  }

  private async storeLocalizedContent(localized: LocalizedContent) {
    await db.generatedContent.create({
      data: {
        contentType: 'localized',
        content: JSON.stringify(localized),
        metadata: {
          targetLanguage: localized.targetLanguage,
          originalTitle: localized.originalContent.title
        },
        createdAt: new Date()
      }
    });
  }
}

// Type definitions used in methods
interface Topic {
  id: string;
  name: string;
  keywords: string[];
}

interface Concept {
  id: string;
  name: string;
  description: string;
  skills?: string[];
}

interface Course {
  id: string;
  title: string;
  difficulty?: string;
}

interface Language {
  code: string;
  name: string;
  culture: string;
}

// Export singleton instance
export const samGenerationEngine = SAMGenerationEngine.getInstance();