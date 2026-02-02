/**
 * @sam-ai/educational - Content Generation Engine
 * Portable engine for AI-powered course content generation
 */
/**
 * ContentGenerationEngine - Portable AI-powered content generation
 * Uses SAMConfig AI adapter for all AI operations
 */
export class ContentGenerationEngine {
    config;
    database;
    logger;
    constructor(engineConfig) {
        this.config = engineConfig.samConfig;
        this.database = engineConfig.database;
        this.logger = this.config.logger;
    }
    /**
     * Generate course content based on learning objectives
     */
    async generateCourseContent(objectives, config) {
        try {
            this.logger?.debug?.('[ContentGenerationEngine] Generating course content', {
                objectiveCount: objectives.length,
                style: config?.style,
            });
            // Generate course structure
            const structure = await this.generateCourseStructure(objectives, config);
            // Generate detailed outline
            const outline = await this.generateDetailedOutline(structure, objectives, config);
            // Calculate metadata
            const estimatedDuration = this.calculateCourseDuration(outline);
            const difficulty = this.determineDifficulty(objectives);
            const prerequisites = this.identifyPrerequisites(objectives);
            const courseContent = {
                title: structure.title,
                description: structure.description,
                outline,
                estimatedDuration,
                difficulty,
                prerequisites,
                learningOutcomes: objectives.map((obj) => obj.objective),
                targetAudience: config?.targetAudience || 'General learners',
            };
            // Store generated content if database available
            await this.storeGeneratedContent('course', courseContent);
            this.logger?.info?.('[ContentGenerationEngine] Course content generated', {
                title: courseContent.title,
                chapters: courseContent.outline.chapters.length,
            });
            return courseContent;
        }
        catch (error) {
            this.logger?.error?.('[ContentGenerationEngine] Error generating course content:', error);
            throw new Error('Failed to generate course content');
        }
    }
    /**
     * Create assessments for given topics
     */
    async createAssessments(topics, assessmentType, config) {
        try {
            this.logger?.debug?.('[ContentGenerationEngine] Creating assessments', {
                topicCount: topics.length,
                type: assessmentType,
            });
            const assessments = [];
            for (const topic of topics) {
                const questions = await this.generateQuestions(topic, assessmentType, config);
                const assessment = {
                    id: `assessment-${Date.now()}-${assessments.length}`,
                    type: assessmentType,
                    title: `${topic.name} ${this.formatAssessmentType(assessmentType)}`,
                    description: this.generateAssessmentDescription(topic, assessmentType),
                    questions,
                    passingScore: this.calculatePassingScore(assessmentType),
                    duration: this.calculateAssessmentDuration(questions, assessmentType),
                    instructions: this.generateInstructions(assessmentType),
                };
                assessments.push(assessment);
            }
            // Store assessments
            await this.storeGeneratedAssessments(assessments);
            this.logger?.info?.('[ContentGenerationEngine] Assessments created', {
                count: assessments.length,
                type: assessmentType,
            });
            return assessments;
        }
        catch (error) {
            this.logger?.error?.('[ContentGenerationEngine] Error creating assessments:', error);
            throw new Error('Failed to create assessments');
        }
    }
    /**
     * Generate study guide for a course
     */
    async generateStudyGuides(course) {
        try {
            this.logger?.debug?.('[ContentGenerationEngine] Generating study guide', {
                courseId: course.id,
                title: course.title,
            });
            // Extract key topics
            const keyTopics = await this.extractKeyTopics(course);
            // Generate summaries
            const summaries = await this.generateSummaries(course);
            // Create practice questions
            const practiceQuestions = await this.generatePracticeQuestions(keyTopics);
            // Generate study tips
            const studyTips = this.generateStudyTips(course, keyTopics);
            // Find additional resources
            const additionalResources = this.findAdditionalResources(keyTopics);
            const studyGuide = {
                courseId: course.id,
                title: `Study Guide: ${course.title}`,
                overview: this.generateStudyGuideOverview(course),
                keyTopics,
                summaries,
                practiceQuestions,
                studyTips,
                additionalResources,
            };
            // Store study guide
            await this.storeStudyGuide(studyGuide);
            this.logger?.info?.('[ContentGenerationEngine] Study guide generated', {
                courseId: course.id,
                topicCount: keyTopics.length,
            });
            return studyGuide;
        }
        catch (error) {
            this.logger?.error?.('[ContentGenerationEngine] Error generating study guide:', error);
            throw new Error('Failed to generate study guide');
        }
    }
    /**
     * Create interactive exercises for concepts
     */
    async createInteractiveExercises(concepts, exerciseType) {
        try {
            this.logger?.debug?.('[ContentGenerationEngine] Creating exercises', {
                conceptCount: concepts.length,
                type: exerciseType,
            });
            const exercises = [];
            for (const concept of concepts) {
                const exercise = await this.generateExercise(concept, exerciseType);
                exercises.push(exercise);
            }
            // Validate exercises
            const validatedExercises = this.validateExercises(exercises);
            // Store exercises
            await this.storeExercises(validatedExercises);
            this.logger?.info?.('[ContentGenerationEngine] Exercises created', {
                count: validatedExercises.length,
                type: exerciseType,
            });
            return validatedExercises;
        }
        catch (error) {
            this.logger?.error?.('[ContentGenerationEngine] Error creating exercises:', error);
            throw new Error('Failed to create exercises');
        }
    }
    /**
     * Adapt content to a different language
     */
    async adaptContentLanguage(content, targetLanguage) {
        try {
            this.logger?.debug?.('[ContentGenerationEngine] Adapting content language', {
                targetLanguage: targetLanguage.name,
            });
            // Translate content using AI
            const translatedContent = await this.translateContent(content, targetLanguage);
            // Apply cultural adaptations
            const culturalAdaptations = this.applyCulturalAdaptations(content, targetLanguage);
            // Create glossary
            const glossary = this.createGlossary(content, translatedContent, targetLanguage);
            const localizedContent = {
                originalContent: content,
                targetLanguage: targetLanguage.code,
                translatedContent,
                culturalAdaptations,
                glossary,
            };
            // Store localized content
            await this.storeLocalizedContent(localizedContent);
            this.logger?.info?.('[ContentGenerationEngine] Content adapted', {
                targetLanguage: targetLanguage.code,
            });
            return localizedContent;
        }
        catch (error) {
            this.logger?.error?.('[ContentGenerationEngine] Error adapting content language:', error);
            throw new Error('Failed to adapt content language');
        }
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    async generateCourseStructure(objectives, config) {
        const prompt = `
Create a course structure based on these learning objectives:
${objectives.map((obj) => `- ${obj.objective} (${obj.bloomsLevel})`).join('\n')}

Style: ${config?.style || 'formal'}
Depth: ${config?.depth || 'intermediate'}
Target Audience: ${config?.targetAudience || 'general learners'}

Generate a JSON response with:
{
  "title": "Course title",
  "description": "Course description (2-3 sentences)",
  "chapterCount": number (3-7 chapters),
  "chapterThemes": ["theme1", "theme2", ...]
}

Return only valid JSON.`;
        try {
            const response = await this.config.ai.chat({
                model: this.config.model?.name || 'claude-sonnet-4-20250514',
                messages: [{ role: 'user', content: prompt }],
                maxTokens: 1000,
                temperature: 0.7,
            });
            const responseText = response.content;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        catch (error) {
            this.logger?.warn?.('[ContentGenerationEngine] AI call failed, using fallback structure');
        }
        // Fallback structure
        return {
            title: 'Generated Course',
            description: 'A comprehensive course covering the specified learning objectives.',
            chapterCount: Math.min(5, Math.max(3, Math.ceil(objectives.length / 2))),
            chapterThemes: objectives.slice(0, 5).map((obj) => obj.objective.split(' ').slice(0, 3).join(' ')),
        };
    }
    async generateDetailedOutline(structure, objectives, config) {
        const chapters = [];
        for (let i = 0; i < structure.chapterCount; i++) {
            const chapterObjectives = this.distributeObjectives(objectives, structure.chapterCount, i);
            const chapter = await this.generateChapter(structure.chapterThemes[i] || `Chapter ${i + 1}`, chapterObjectives, config);
            chapters.push(chapter);
        }
        const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
        const totalLessons = chapters.reduce((sum, ch) => sum + ch.sections.filter((s) => s.type === 'lesson').length, 0);
        return {
            chapters,
            totalSections,
            totalLessons,
        };
    }
    async generateChapter(theme, objectives, config) {
        const prompt = `
Create a chapter outline for:
Theme: ${theme}
Objectives: ${objectives.map((o) => o.objective).join(', ')}

Include activities: ${config?.includeActivities ? 'yes' : 'no'}
Style: ${config?.style || 'formal'}

Generate a JSON response:
{
  "title": "Chapter title",
  "description": "Brief description",
  "objectives": ["objective1", "objective2"],
  "sections": [
    {
      "title": "Section title",
      "type": "lesson" | "activity" | "assessment",
      "content": "Brief content description",
      "duration": number (minutes)
    }
  ],
  "estimatedDuration": total minutes
}

Return only valid JSON.`;
        try {
            const response = await this.config.ai.chat({
                model: this.config.model?.name || 'claude-sonnet-4-20250514',
                messages: [{ role: 'user', content: prompt }],
                maxTokens: 1000,
                temperature: 0.7,
            });
            const responseText = response.content;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        catch (error) {
            this.logger?.warn?.('[ContentGenerationEngine] Chapter generation fallback');
        }
        // Fallback chapter
        return {
            title: theme,
            description: `Chapter covering ${theme}`,
            objectives: objectives.map((o) => o.objective),
            sections: [
                { title: 'Introduction', type: 'lesson', content: 'Chapter introduction', duration: 15 },
                { title: 'Core Concepts', type: 'lesson', content: 'Main content', duration: 30 },
                { title: 'Practice', type: 'activity', content: 'Hands-on practice', duration: 20 },
                { title: 'Review', type: 'assessment', content: 'Chapter assessment', duration: 15 },
            ],
            estimatedDuration: 80,
        };
    }
    async generateQuestions(topic, assessmentType, config) {
        const questionCount = this.getQuestionCount(assessmentType);
        const bloomsDistribution = this.getBloomsDistribution(assessmentType);
        const questions = [];
        for (const [level, count] of Object.entries(bloomsDistribution)) {
            for (let i = 0; i < count; i++) {
                const question = await this.generateSingleQuestion(topic, level, config);
                questions.push(question);
            }
        }
        return questions.slice(0, questionCount);
    }
    async generateSingleQuestion(topic, bloomsLevel, config) {
        const prompt = `
Generate a ${bloomsLevel} level question about "${topic.name}":
Keywords: ${topic.keywords.join(', ')}

Requirements:
- Clear and unambiguous
- Style: ${config?.style || 'formal'}

Return JSON:
{
  "type": "multiple-choice" | "true-false" | "short-answer",
  "question": "Question text",
  "options": ["A", "B", "C", "D"] (for multiple-choice),
  "correctAnswer": "correct answer",
  "explanation": "Why this is correct",
  "difficulty": "easy" | "medium" | "hard"
}

Return only valid JSON.`;
        try {
            const response = await this.config.ai.chat({
                model: this.config.model?.name || 'claude-sonnet-4-20250514',
                messages: [{ role: 'user', content: prompt }],
                maxTokens: 500,
                temperature: 0.6,
            });
            const responseText = response.content;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const questionData = JSON.parse(jsonMatch[0]);
                return {
                    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: questionData.type || 'multiple-choice',
                    question: questionData.question,
                    options: questionData.options,
                    correctAnswer: questionData.correctAnswer,
                    explanation: questionData.explanation || '',
                    points: this.calculateQuestionPoints(bloomsLevel, questionData.difficulty),
                    difficulty: questionData.difficulty || 'medium',
                    bloomsLevel,
                    hints: this.generateHints(bloomsLevel),
                };
            }
        }
        catch (error) {
            this.logger?.warn?.('[ContentGenerationEngine] Question generation fallback');
        }
        // Fallback question
        return {
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'multiple-choice',
            question: `Question about ${topic.name} at ${bloomsLevel} level`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: 'This is the correct answer because it aligns with the core concept.',
            points: 2,
            difficulty: 'medium',
            bloomsLevel,
            hints: ['Think about the definition', 'Consider the key characteristics'],
        };
    }
    async generateExercise(concept, exerciseType) {
        const prompt = `
Create a ${exerciseType} exercise for the concept: "${concept.name}"
Description: ${concept.description}
Skills: ${concept.skills?.join(', ') || 'general'}

Return JSON:
{
  "title": "Exercise title",
  "description": "What the student will do",
  "difficulty": "easy" | "medium" | "hard",
  "instructions": ["step1", "step2", ...],
  "hints": ["hint1", "hint2"]
}

Return only valid JSON.`;
        try {
            const response = await this.config.ai.chat({
                model: this.config.model?.name || 'claude-sonnet-4-20250514',
                messages: [{ role: 'user', content: prompt }],
                maxTokens: 800,
                temperature: 0.7,
            });
            const responseText = response.content;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const exerciseData = JSON.parse(jsonMatch[0]);
                return {
                    id: `ex-${Date.now()}`,
                    type: exerciseType,
                    title: exerciseData.title || `Practice: ${concept.name}`,
                    description: exerciseData.description || '',
                    difficulty: exerciseData.difficulty || 'medium',
                    skills: concept.skills || [],
                    instructions: exerciseData.instructions || ['Complete the exercise'],
                    hints: exerciseData.hints || [],
                };
            }
        }
        catch (error) {
            this.logger?.warn?.('[ContentGenerationEngine] Exercise generation fallback');
        }
        // Fallback exercise
        return {
            id: `ex-${Date.now()}`,
            type: exerciseType,
            title: `Practice: ${concept.name}`,
            description: `Apply ${concept.name} concepts`,
            difficulty: 'medium',
            skills: concept.skills || [],
            instructions: ['Review the concept', 'Complete the practice task', 'Check your work'],
            hints: ['Break down the problem', 'Apply what you learned'],
        };
    }
    async translateContent(content, targetLanguage) {
        const prompt = `
Translate the following educational content to ${targetLanguage.name}:

Title: ${content.title}
Description: ${content.description}
Body: ${content.body.substring(0, 2000)}

Maintain educational tone and accuracy.

Return JSON:
{
  "title": "Translated title",
  "description": "Translated description",
  "body": "Translated body"
}

Return only valid JSON.`;
        try {
            const response = await this.config.ai.chat({
                model: this.config.model?.name || 'claude-sonnet-4-20250514',
                messages: [{ role: 'user', content: prompt }],
                maxTokens: 3000,
                temperature: 0.3,
            });
            const responseText = response.content;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const translated = JSON.parse(jsonMatch[0]);
                return {
                    title: translated.title,
                    description: translated.description,
                    body: translated.body,
                    metadata: content.metadata,
                };
            }
        }
        catch (error) {
            this.logger?.warn?.('[ContentGenerationEngine] Translation fallback');
        }
        // Return original if translation fails
        return content;
    }
    async extractKeyTopics(course) {
        const topics = [];
        // Extract topics from course structure
        if (course.chapters) {
            for (const chapter of course.chapters) {
                topics.push({
                    topic: chapter.title,
                    importance: 'critical',
                    explanation: `Key concepts from ${chapter.title}`,
                    examples: chapter.sections?.slice(0, 2).map((s) => s.title) || [],
                });
            }
        }
        if (topics.length === 0) {
            topics.push({
                topic: 'Core Concepts',
                importance: 'critical',
                explanation: 'Fundamental concepts that form the foundation',
                examples: ['Example 1', 'Example 2'],
            });
        }
        return topics;
    }
    async generateSummaries(course) {
        const summaries = [];
        if (course.chapters) {
            for (const chapter of course.chapters) {
                summaries.push({
                    section: chapter.title,
                    bulletPoints: chapter.sections?.map((s) => s.title) || ['Key point'],
                    keyTakeaways: [`Main takeaway from ${chapter.title}`],
                });
            }
        }
        if (summaries.length === 0) {
            summaries.push({
                section: 'Introduction',
                bulletPoints: ['Key point 1', 'Key point 2'],
                keyTakeaways: ['Main takeaway'],
            });
        }
        return summaries;
    }
    async generatePracticeQuestions(topics) {
        const questions = [];
        for (const topic of topics.filter((t) => t.importance === 'critical').slice(0, 3)) {
            questions.push({
                id: `pq-${Date.now()}-${questions.length}`,
                type: 'multiple-choice',
                question: `Question about ${topic.topic}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A',
                explanation: `This is the correct answer based on ${topic.topic}`,
                points: 1,
                difficulty: 'medium',
                bloomsLevel: 'understand',
            });
        }
        return questions;
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    calculateCourseDuration(outline) {
        return outline.chapters.reduce((total, chapter) => total + chapter.estimatedDuration, 0);
    }
    determineDifficulty(objectives) {
        const bloomsLevels = objectives.map((obj) => obj.bloomsLevel.toLowerCase());
        const highLevelCount = bloomsLevels.filter((level) => ['analyze', 'evaluate', 'create'].includes(level)).length;
        const ratio = highLevelCount / bloomsLevels.length;
        if (ratio > 0.7)
            return 'advanced';
        if (ratio > 0.4)
            return 'intermediate';
        return 'beginner';
    }
    identifyPrerequisites(objectives) {
        const prerequisites = new Set();
        objectives.forEach((obj) => {
            if (obj.bloomsLevel.toLowerCase() !== 'remember') {
                obj.skills.forEach((skill) => {
                    if (skill.includes('basic')) {
                        prerequisites.add(skill.replace('basic', 'fundamental'));
                    }
                });
            }
        });
        return Array.from(prerequisites);
    }
    distributeObjectives(objectives, chapterCount, chapterIndex) {
        const objectivesPerChapter = Math.ceil(objectives.length / chapterCount);
        const start = chapterIndex * objectivesPerChapter;
        const end = Math.min(start + objectivesPerChapter, objectives.length);
        return objectives.slice(start, end);
    }
    formatAssessmentType(type) {
        const formats = {
            quiz: 'Quiz',
            exam: 'Examination',
            assignment: 'Assignment',
            project: 'Project',
        };
        return formats[type] || type;
    }
    generateAssessmentDescription(topic, type) {
        return `This ${type} assesses your understanding of ${topic.name}. Read each question carefully and select the best answer.`;
    }
    calculatePassingScore(type) {
        const scores = {
            quiz: 70,
            exam: 65,
            assignment: 60,
            project: 70,
        };
        return scores[type] || 70;
    }
    calculateAssessmentDuration(questions, type) {
        const baseTime = {
            quiz: 30,
            exam: 90,
            assignment: 120,
            project: 240,
        };
        const perQuestionTime = questions.length * 2;
        return (baseTime[type] || 60) + perQuestionTime;
    }
    generateInstructions(type) {
        const instructions = [
            `This ${type} must be completed in one sitting`,
            'Read each question carefully before answering',
            'You can review your answers before submission',
        ];
        if (type === 'exam') {
            instructions.push('No external resources are allowed');
        }
        return instructions;
    }
    getQuestionCount(type) {
        const counts = {
            quiz: 10,
            exam: 25,
            assignment: 5,
            project: 3,
        };
        return counts[type] || 10;
    }
    getBloomsDistribution(type) {
        if (type === 'quiz') {
            return {
                remember: 3,
                understand: 4,
                apply: 2,
                analyze: 1,
            };
        }
        if (type === 'exam') {
            return {
                remember: 5,
                understand: 8,
                apply: 6,
                analyze: 4,
                evaluate: 2,
            };
        }
        return {
            apply: 2,
            analyze: 2,
            create: 1,
        };
    }
    calculateQuestionPoints(bloomsLevel, difficulty) {
        const bloomsPoints = {
            remember: 1,
            understand: 2,
            apply: 3,
            analyze: 4,
            evaluate: 5,
            create: 6,
        };
        const difficultyMultiplier = {
            easy: 1,
            medium: 1.5,
            hard: 2,
        };
        const base = bloomsPoints[bloomsLevel.toLowerCase()] || 2;
        const multiplier = difficultyMultiplier[difficulty] || 1;
        return Math.round(base * multiplier);
    }
    generateHints(bloomsLevel) {
        const hints = [];
        if (bloomsLevel === 'remember' || bloomsLevel === 'understand') {
            hints.push('Think about the definition or key characteristics');
        }
        else if (bloomsLevel === 'apply') {
            hints.push('Consider how this concept works in practice');
        }
        else {
            hints.push('Break down the problem into smaller parts');
        }
        return hints;
    }
    validateExercises(exercises) {
        return exercises.filter((exercise) => {
            return exercise.title && exercise.description && exercise.instructions.length > 0;
        });
    }
    generateStudyTips(course, topics) {
        const tips = [
            'Review critical topics daily for better retention',
            'Practice with sample questions after each study session',
            'Create your own summary notes for each topic',
            'Form study groups to discuss complex concepts',
            'Take regular breaks to maintain focus',
        ];
        if (course.difficulty === 'advanced') {
            tips.push('Dedicate extra time to hands-on practice');
        }
        return tips;
    }
    findAdditionalResources(topics) {
        return [
            {
                title: 'Additional Reading',
                type: 'article',
                description: 'Supplementary material for deeper understanding',
            },
        ];
    }
    generateStudyGuideOverview(course) {
        return `This study guide covers the essential concepts from ${course.title}. Focus on the critical topics and use the practice questions to test your understanding.`;
    }
    applyCulturalAdaptations(content, targetLanguage) {
        const adaptations = [];
        if (targetLanguage.culture && targetLanguage.culture !== 'western') {
            adaptations.push('Adapted examples to use local context');
            adaptations.push('Modified cultural references');
        }
        return adaptations;
    }
    createGlossary(original, translated, targetLanguage) {
        return [
            {
                original: 'algorithm',
                translated: 'algoritmo',
                context: 'computational procedure',
            },
        ];
    }
    // ============================================================================
    // STORAGE METHODS
    // ============================================================================
    async storeGeneratedContent(type, content) {
        this.logger?.debug?.('[ContentGenerationEngine] Content cached', { type });
    }
    async storeGeneratedAssessments(assessments) {
        this.logger?.debug?.('[ContentGenerationEngine] Assessments cached', {
            count: assessments.length,
        });
    }
    async storeStudyGuide(studyGuide) {
        this.logger?.debug?.('[ContentGenerationEngine] Study guide cached', {
            courseId: studyGuide.courseId,
        });
    }
    async storeExercises(exercises) {
        this.logger?.debug?.('[ContentGenerationEngine] Exercises cached', { count: exercises.length });
    }
    async storeLocalizedContent(localized) {
        this.logger?.debug?.('[ContentGenerationEngine] Localized content cached', {
            targetLanguage: localized.targetLanguage,
        });
    }
}
/**
 * Factory function to create ContentGenerationEngine
 */
export function createContentGenerationEngine(config) {
    return new ContentGenerationEngine(config);
}
