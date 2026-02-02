/**
 * Enhanced Course Depth Analysis Engine
 * Integrates Webb's DOK, Course Type Detection, Assessment Quality, and Objective Analysis
 */
import { createHash } from 'crypto';
import { bloomsToDOK, getBloomsWeight, BLOOMS_KEYWORD_MAP, } from '../types/depth-analysis.types';
import { webbDOKAnalyzer, courseTypeDetector, assessmentQualityAnalyzer, objectiveAnalyzer, } from '../analyzers';
// Engine version for tracking
const ENGINE_VERSION = '2.0.0';
const noopLogger = {
    info: () => { },
    warn: () => { },
    error: () => { },
};
export function generateCourseContentHash(course) {
    const contentToHash = {
        title: course.title,
        description: course.description,
        whatYouWillLearn: course.whatYouWillLearn,
        categoryId: course.categoryId ?? null,
        price: course.price ?? null,
        chapters: course.chapters.map(ch => ({
            id: ch.id,
            title: ch.title,
            description: ch.description,
            position: ch.position,
            sections: ch.sections.map(s => ({
                id: s.id,
                title: s.title,
                description: s.description,
                position: s.position,
                duration: s.duration ?? null,
                videoUrl: s.videoUrl ?? null,
                exams: (s.exams ?? []).map(exam => ({
                    id: exam.id,
                    title: exam.title,
                    questions: (exam.ExamQuestion ?? []).map(q => ({
                        id: q.id,
                        text: q.text ?? q.question,
                        type: q.type,
                        bloomsLevel: q.bloomsLevel,
                        options: (q.options ?? []).map(o => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
                    })),
                })),
                questions: (s.Question ?? []).map(q => ({
                    id: q.id,
                    text: q.text ?? q.question,
                    type: q.type,
                    bloomsLevel: q.bloomsLevel,
                    options: q.options ?? [],
                })),
            })),
        })),
        attachmentsCount: course.attachments.length,
    };
    const contentString = JSON.stringify(contentToHash, Object.keys(contentToHash).sort());
    return createHash('sha256')
        .update(contentString)
        .digest('hex')
        .substring(0, 16);
}
export class EnhancedDepthAnalysisEngine {
    startTime = 0;
    samConfig;
    storage;
    logger;
    contentHasher;
    enableAIEnhancements;
    constructor(options = {}) {
        this.samConfig = options.samConfig;
        this.storage = options.storage;
        this.logger = options.logger ?? noopLogger;
        this.contentHasher = options.contentHasher ?? generateCourseContentHash;
        this.enableAIEnhancements = options.enableAIEnhancements ?? false;
    }
    /**
     * Check if AI-enhanced analysis is available
     */
    hasAICapabilities() {
        return !!(this.samConfig && this.enableAIEnhancements);
    }
    /**
     * Get the SAMConfig (for subclasses or testing)
     */
    getSAMConfig() {
        return this.samConfig;
    }
    /**
     * Perform comprehensive enhanced depth analysis
     */
    async analyze(courseData, options = {}) {
        this.startTime = Date.now();
        const { forceReanalyze = false, includeHistoricalSnapshot = true, analysisDepth = 'detailed' } = options;
        this.logger.info(`[EnhancedDepthEngine] Starting analysis for course: ${courseData.id}`);
        // Generate content hash
        const contentHash = this.contentHasher(courseData);
        // Check for cached analysis
        if (!forceReanalyze) {
            const cached = await this.getCachedAnalysis(courseData.id, contentHash, courseData);
            if (cached) {
                this.logger.info(`[EnhancedDepthEngine] Using cached analysis for course: ${courseData.id}`);
                return cached;
            }
        }
        // Perform analysis
        const courseMetadata = this.buildCourseMetadata(courseData);
        const courseTypeResult = courseTypeDetector.detectCourseType(courseMetadata);
        // Analyze chapters and sections
        const chapterAnalysis = await this.analyzeChapters(courseData.chapters, analysisDepth);
        // Calculate distributions
        const bloomsDistribution = this.calculateBloomsDistribution(chapterAnalysis);
        const dokDistribution = webbDOKAnalyzer.bloomsToEstimatedDOK(bloomsDistribution);
        // Analyze objectives
        const objectivesAnalysis = this.analyzeObjectives(courseData.whatYouWillLearn);
        const objectiveDeduplication = objectiveAnalyzer.analyzeAndDeduplicate(courseData.whatYouWillLearn);
        // Analyze assessments
        const assessmentQuality = this.analyzeAssessmentQuality(courseData.chapters);
        // Calculate cognitive depth
        const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
        // Determine balance
        const balance = this.determineBalance(bloomsDistribution);
        // Compare with ideal for course type
        const courseTypeMatch = courseTypeDetector.compareWithIdeal(bloomsDistribution, courseTypeResult.detectedType).alignmentScore;
        // Generate learning pathway
        const learningPathway = this.generateLearningPathway(bloomsDistribution, dokDistribution, chapterAnalysis, courseTypeResult.detectedType);
        // Generate recommendations
        const recommendations = this.generateEnhancedRecommendations(bloomsDistribution, dokDistribution, courseTypeResult, assessmentQuality, objectivesAnalysis, chapterAnalysis);
        // Analyze student impact
        const studentImpact = this.analyzeStudentImpact(bloomsDistribution, dokDistribution, courseTypeResult.detectedType);
        // Build metadata
        const processingTimeMs = Date.now() - this.startTime;
        const metadata = {
            analyzedAt: new Date().toISOString(),
            courseId: courseData.id,
            contentHash,
            engineVersion: ENGINE_VERSION,
            totalChapters: courseData.chapters.length,
            totalSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
            totalObjectives: courseData.whatYouWillLearn.length,
            completionPercentage: this.calculateCompletionPercentage(courseData),
            analysisDepth,
            cached: false,
            processingTimeMs,
        };
        const response = {
            courseLevel: {
                bloomsDistribution,
                dokDistribution,
                cognitiveDepth,
                balance,
                courseType: courseTypeResult.detectedType,
                courseTypeMatch,
            },
            chapterAnalysis,
            objectivesAnalysis,
            objectiveDeduplication,
            assessmentQuality,
            learningPathway,
            recommendations,
            studentImpact,
            metadata,
        };
        // Store analysis
        await this.storeAnalysis(courseData.id, response, contentHash);
        // Store historical snapshot if enabled
        if (includeHistoricalSnapshot) {
            await this.storeHistoricalSnapshot(courseData.id, response, contentHash);
        }
        this.logger.info(`[EnhancedDepthEngine] Analysis complete for course: ${courseData.id} in ${processingTimeMs}ms`);
        return response;
    }
    /**
     * Get historical trend data for a course
     */
    async getHistoricalTrends(courseId, limit = 10) {
        if (!this.storage?.listHistoricalSnapshots) {
            return { snapshots: [], trends: [] };
        }
        const snapshots = await this.storage.listHistoricalSnapshots(courseId, limit);
        const trends = [];
        if (snapshots.length >= 2) {
            const latest = snapshots[0];
            const previous = snapshots[1];
            const metrics = ['cognitiveDepth', 'balanceScore', 'completenessScore'];
            for (const metric of metrics) {
                const change = latest[metric] - previous[metric];
                let direction;
                if (Math.abs(change) < 1) {
                    direction = 'stable';
                }
                else if (change > 0) {
                    direction = 'improving';
                }
                else {
                    direction = 'declining';
                }
                trends.push({ metric, change: Math.round(change * 10) / 10, direction });
            }
        }
        return { snapshots, trends };
    }
    /**
     * Build course metadata for type detection
     */
    buildCourseMetadata(courseData) {
        const totalDuration = courseData.chapters.reduce((sum, ch) => sum + ch.sections.reduce((sSum, s) => sSum + (s.duration ?? 0), 0), 0);
        const sectionCount = courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
        return {
            title: courseData.title,
            description: courseData.description ?? '',
            category: courseData.category?.name ?? 'Uncategorized',
            learningObjectives: courseData.whatYouWillLearn,
            prerequisites: [],
            targetAudience: '',
            chaptersCount: courseData.chapters.length,
            averageSectionDuration: sectionCount > 0 ? totalDuration / sectionCount : 0,
            hasProjects: courseData.whatYouWillLearn.some(obj => /project|build|create|design/i.test(obj)),
            hasAssessments: courseData.chapters.some(ch => ch.sections.some(s => (s.exams?.length ?? 0) > 0 || (s.Question?.length ?? 0) > 0)),
            hasCodingExercises: courseData.whatYouWillLearn.some(obj => /code|program|develop|implement/i.test(obj)),
        };
    }
    /**
     * Analyze chapters with enhanced metrics
     */
    async analyzeChapters(chapters, depth) {
        const analyses = [];
        for (const chapter of chapters) {
            const sectionAnalyses = this.analyzeSections(chapter.sections, depth);
            const bloomsDistribution = this.calculateSectionBloomsDistribution(sectionAnalyses);
            const dokDistribution = webbDOKAnalyzer.bloomsToEstimatedDOK(bloomsDistribution);
            const primaryBloomsLevel = this.getPrimaryLevel(bloomsDistribution);
            const primaryDOKLevel = bloomsToDOK(primaryBloomsLevel);
            const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
            const { strengths, weaknesses } = this.analyzeChapterStrengthsWeaknesses(bloomsDistribution, sectionAnalyses);
            const recommendations = this.generateChapterRecommendations(chapter, bloomsDistribution, weaknesses);
            analyses.push({
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                position: chapter.position,
                bloomsDistribution,
                dokDistribution,
                primaryBloomsLevel,
                primaryDOKLevel,
                cognitiveDepth,
                complexity: {
                    vocabularyLevel: cognitiveDepth > 70 ? 'advanced' : cognitiveDepth > 50 ? 'intermediate' : 'basic',
                    conceptDensity: sectionAnalyses.length / (chapter.description?.length ?? 100) * 100,
                    prerequisiteCount: 0,
                    estimatedStudyTime: sectionAnalyses.reduce((sum, s) => sum + 15, 0),
                },
                sections: sectionAnalyses,
                strengths,
                weaknesses,
                recommendations,
            });
        }
        return analyses;
    }
    /**
     * Analyze sections
     */
    analyzeSections(sections, depth) {
        return sections.map(section => {
            const content = `${section.title} ${section.description ?? ''}`;
            const dokAnalysis = webbDOKAnalyzer.analyzeContent(content);
            const bloomsLevel = this.inferBloomsLevel(content);
            return {
                sectionId: section.id,
                sectionTitle: section.title,
                position: section.position,
                bloomsLevel,
                dokLevel: dokAnalysis.level,
                activities: this.extractActivities(section, bloomsLevel),
                learningObjectives: [],
                contentDepth: dokAnalysis.confidence,
                engagementScore: this.calculateEngagementScore(section),
            };
        });
    }
    /**
     * Extract activities from section
     */
    extractActivities(section, bloomsLevel) {
        const activities = [];
        if (section.videoUrl) {
            activities.push({
                type: 'Video Lesson',
                bloomsLevel,
                dokLevel: bloomsToDOK(bloomsLevel),
                description: 'Watch and understand concepts',
                engagementPotential: 75,
            });
        }
        if (section.exams && section.exams.length > 0) {
            activities.push({
                type: 'Assessment',
                bloomsLevel: 'EVALUATE',
                dokLevel: 3,
                description: 'Test understanding through exam',
                engagementPotential: 80,
            });
        }
        if (section.Question && section.Question.length > 0) {
            activities.push({
                type: 'Practice Questions',
                bloomsLevel: 'APPLY',
                dokLevel: 2,
                description: 'Apply knowledge through practice',
                engagementPotential: 70,
            });
        }
        return activities;
    }
    /**
     * Calculate engagement score
     */
    calculateEngagementScore(section) {
        let score = 50;
        if (section.videoUrl)
            score += 20;
        if (section.exams && section.exams.length > 0)
            score += 15;
        if (section.Question && section.Question.length > 0)
            score += 15;
        return Math.min(score, 100);
    }
    /**
     * Analyze objectives
     */
    analyzeObjectives(objectives) {
        return objectives.map(obj => objectiveAnalyzer.analyzeObjective(obj));
    }
    /**
     * Analyze assessment quality
     */
    analyzeAssessmentQuality(chapters) {
        const exams = [];
        for (const chapter of chapters) {
            for (const section of chapter.sections) {
                if (section.exams) {
                    for (const exam of section.exams) {
                        const questions = (exam.ExamQuestion ?? []).map(q => ({
                            id: q.id,
                            text: q.text ?? q.question ?? '',
                            type: q.type ?? 'multiple_choice',
                            bloomsLevel: q.bloomsLevel,
                            explanation: q.explanation,
                            options: q.options?.map(o => ({
                                id: o.id,
                                text: o.text,
                                isCorrect: o.isCorrect,
                            })),
                        }));
                        exams.push({
                            id: exam.id,
                            title: exam.title,
                            questions,
                        });
                    }
                }
            }
        }
        return assessmentQualityAnalyzer.analyzeAssessments(exams);
    }
    /**
     * Calculate Bloom's distribution from chapter analyses
     */
    calculateBloomsDistribution(chapters) {
        if (chapters.length === 0) {
            return { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
        }
        const distribution = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
        for (const chapter of chapters) {
            for (const level of Object.keys(distribution)) {
                distribution[level] += chapter.bloomsDistribution[level];
            }
        }
        // Average
        for (const level of Object.keys(distribution)) {
            distribution[level] = Math.round(distribution[level] / chapters.length);
        }
        return distribution;
    }
    /**
     * Calculate section-level Bloom's distribution
     */
    calculateSectionBloomsDistribution(sections) {
        const distribution = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
        if (sections.length === 0)
            return distribution;
        for (const section of sections) {
            distribution[section.bloomsLevel]++;
        }
        // Convert to percentages
        for (const level of Object.keys(distribution)) {
            distribution[level] = Math.round((distribution[level] / sections.length) * 100);
        }
        return distribution;
    }
    /**
     * Calculate cognitive depth score
     */
    calculateCognitiveDepth(distribution) {
        let weightedSum = 0;
        let totalPercentage = 0;
        for (const [level, percentage] of Object.entries(distribution)) {
            const weight = getBloomsWeight(level);
            weightedSum += weight * percentage;
            totalPercentage += percentage;
        }
        if (totalPercentage === 0)
            return 0;
        // Scale to 0-100 (max weighted average is 6, scale by 100/6 ≈ 16.67)
        return Math.round((weightedSum / totalPercentage) * 16.67);
    }
    /**
     * Determine balance
     */
    determineBalance(distribution) {
        const lower = distribution.REMEMBER + distribution.UNDERSTAND;
        const higher = distribution.EVALUATE + distribution.CREATE;
        if (lower > 60)
            return 'bottom-heavy';
        if (higher > 40)
            return 'top-heavy';
        return 'well-balanced';
    }
    calculateBalanceScore(distribution) {
        const ideal = {
            REMEMBER: 10,
            UNDERSTAND: 20,
            APPLY: 25,
            ANALYZE: 20,
            EVALUATE: 15,
            CREATE: 10,
        };
        let balanceScore = 100;
        Object.keys(ideal).forEach(level => {
            const diff = Math.abs((distribution[level] ?? 0) - ideal[level]);
            balanceScore -= diff * 0.5;
        });
        return Math.max(0, Math.round(balanceScore));
    }
    /**
     * Get primary Bloom's level
     */
    getPrimaryLevel(distribution) {
        let maxLevel = 'UNDERSTAND';
        let maxValue = 0;
        for (const [level, value] of Object.entries(distribution)) {
            if (value > maxValue) {
                maxValue = value;
                maxLevel = level;
            }
        }
        return maxLevel;
    }
    /**
     * Infer Bloom's level from text
     */
    inferBloomsLevel(text) {
        const lowerText = text.toLowerCase();
        // Check in reverse order (higher levels first)
        const levels = ['CREATE', 'EVALUATE', 'ANALYZE', 'APPLY', 'UNDERSTAND', 'REMEMBER'];
        for (const level of levels) {
            const mapping = BLOOMS_KEYWORD_MAP.find(m => m.level === level);
            if (mapping) {
                for (const keyword of mapping.keywords) {
                    if (lowerText.includes(keyword)) {
                        return level;
                    }
                }
            }
        }
        return 'UNDERSTAND';
    }
    /**
     * Analyze chapter strengths and weaknesses
     */
    analyzeChapterStrengthsWeaknesses(distribution, sections) {
        const strengths = [];
        const weaknesses = [];
        // Check for higher-order thinking
        if (distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE > 30) {
            strengths.push('Good coverage of higher-order thinking skills');
        }
        else {
            weaknesses.push('Limited higher-order thinking activities');
        }
        // Check for variety
        const activeTypes = new Set(sections.flatMap(s => s.activities.map(a => a.type)));
        if (activeTypes.size >= 3) {
            strengths.push('Diverse activity types');
        }
        else {
            weaknesses.push('Could benefit from more activity variety');
        }
        // Check engagement
        const avgEngagement = sections.reduce((sum, s) => sum + s.engagementScore, 0) / sections.length;
        if (avgEngagement >= 70) {
            strengths.push('High engagement potential');
        }
        else if (avgEngagement < 50) {
            weaknesses.push('Low engagement potential');
        }
        return { strengths, weaknesses };
    }
    /**
     * Generate chapter-specific recommendations
     */
    generateChapterRecommendations(chapter, distribution, weaknesses) {
        const recommendations = [];
        if (distribution.CREATE < 10) {
            recommendations.push({
                type: 'activity',
                priority: 'high',
                title: 'Add Creative Activities',
                description: 'Include project-based or creative tasks',
                impact: 'Improves cognitive depth and student engagement',
                implementation: ['Add a mini-project', 'Include a design challenge', 'Create a synthesis activity'],
            });
        }
        if (weaknesses.includes('Limited higher-order thinking activities')) {
            recommendations.push({
                type: 'content',
                priority: 'medium',
                title: 'Add Analysis Tasks',
                description: 'Include comparison and analytical exercises',
                impact: 'Develops critical thinking skills',
                implementation: ['Add case studies', 'Include compare/contrast exercises', 'Add data analysis tasks'],
            });
        }
        return recommendations;
    }
    /**
     * Generate learning pathway
     */
    generateLearningPathway(bloomsDistribution, dokDistribution, chapters, courseType) {
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const currentStages = levels.map((level, index) => ({
            level,
            dokLevel: bloomsToDOK(level),
            mastery: bloomsDistribution[level],
            activities: this.getActivitiesForLevel(chapters, level),
            timeEstimate: Math.round(bloomsDistribution[level] * 0.5),
        }));
        const recommendedStages = levels.map((level, index) => ({
            level,
            dokLevel: bloomsToDOK(level),
            mastery: Math.max(80 - index * 10, 40),
            activities: this.getRecommendedActivities(level),
            timeEstimate: 10 + index * 5,
        }));
        const gaps = this.identifyGaps(currentStages, recommendedStages);
        return {
            current: {
                stages: currentStages,
                currentStage: this.determineCurrentStage(currentStages),
                completionPercentage: this.calculatePathCompletion(currentStages),
            },
            recommended: {
                stages: recommendedStages,
                currentStage: 0,
                completionPercentage: 0,
            },
            gaps,
            milestones: this.generateMilestones(levels),
        };
    }
    /**
     * Get activities for a level
     */
    getActivitiesForLevel(chapters, level) {
        const activities = new Set();
        for (const chapter of chapters) {
            for (const section of chapter.sections) {
                if (section.bloomsLevel === level) {
                    for (const activity of section.activities) {
                        activities.add(activity.type);
                    }
                }
            }
        }
        return Array.from(activities);
    }
    /**
     * Get recommended activities for level
     */
    getRecommendedActivities(level) {
        const activities = {
            REMEMBER: ['Flashcards', 'Quizzes', 'Memorization exercises'],
            UNDERSTAND: ['Concept maps', 'Summaries', 'Explanations'],
            APPLY: ['Practice problems', 'Case studies', 'Simulations'],
            ANALYZE: ['Comparisons', 'Research projects', 'Data analysis'],
            EVALUATE: ['Critiques', 'Debates', 'Peer reviews'],
            CREATE: ['Projects', 'Presentations', 'Original works'],
        };
        return activities[level];
    }
    /**
     * Identify gaps between current and recommended
     */
    identifyGaps(current, recommended) {
        const gaps = [];
        for (let i = 0; i < current.length; i++) {
            const gap = recommended[i].mastery - current[i].mastery;
            if (gap > 20) {
                gaps.push({
                    level: current[i].level,
                    dokLevel: current[i].dokLevel,
                    severity: gap > 40 ? 'high' : gap > 30 ? 'medium' : 'low',
                    description: `${current[i].level} mastery is ${current[i].mastery.toFixed(1)}%, recommended is ${recommended[i].mastery}%`,
                    suggestions: this.getRecommendedActivities(current[i].level),
                    estimatedEffortHours: Math.ceil(gap / 10),
                });
            }
        }
        return gaps;
    }
    /**
     * Determine current stage
     */
    determineCurrentStage(stages) {
        for (let i = stages.length - 1; i >= 0; i--) {
            if (stages[i].mastery > 50) {
                return i;
            }
        }
        return 0;
    }
    /**
     * Calculate path completion
     */
    calculatePathCompletion(stages) {
        const totalMastery = stages.reduce((sum, stage) => sum + stage.mastery, 0);
        return Math.round(totalMastery / stages.length);
    }
    /**
     * Generate milestones
     */
    generateMilestones(levels) {
        return levels.map(level => ({
            title: `Master ${level.charAt(0) + level.slice(1).toLowerCase()} Skills`,
            bloomsLevel: level,
            dokLevel: bloomsToDOK(level),
            description: `Achieve proficiency in ${level.toLowerCase()}-level activities`,
            assessmentCriteria: [`Pass ${level.toLowerCase()}-level assessment`, `Complete ${level.toLowerCase()}-focused activities`],
        }));
    }
    /**
     * Generate enhanced recommendations
     */
    generateEnhancedRecommendations(bloomsDistribution, dokDistribution, courseTypeResult, assessmentQuality, objectivesAnalysis, chapters) {
        const immediate = [];
        const shortTerm = [];
        const longTerm = [];
        // Assessment quality recommendations
        if (assessmentQuality.overallScore < 70) {
            immediate.push({
                id: 'assessment-quality',
                priority: 'critical',
                type: 'assessment',
                category: 'Quality',
                title: 'Improve Assessment Quality',
                description: assessmentQuality.bloomsCoverage.recommendation,
                impact: 'Higher assessment quality leads to better learning outcomes',
                effort: 'medium',
                estimatedTime: '2-3 hours',
                actionSteps: ['Review existing questions', 'Add varied question types', 'Include explanations'],
                examples: ['Add case-based questions', 'Include practical scenarios'],
                bloomsTarget: 'ANALYZE',
                dokTarget: 3,
            });
        }
        // Objective clarity recommendations
        const weakObjectives = objectivesAnalysis.filter(o => o.clarityScore < 60);
        if (weakObjectives.length > 0) {
            immediate.push({
                id: 'objective-clarity',
                priority: 'high',
                type: 'objectives',
                category: 'Clarity',
                title: 'Clarify Learning Objectives',
                description: `${weakObjectives.length} objectives need improvement`,
                impact: 'Clear objectives improve student focus and outcomes',
                effort: 'low',
                estimatedTime: '1-2 hours',
                actionSteps: weakObjectives[0].suggestions,
                examples: [weakObjectives[0].improvedVersion],
                bloomsTarget: weakObjectives[0].bloomsLevel,
                dokTarget: weakObjectives[0].dokLevel,
            });
        }
        // Course type alignment recommendations
        if (courseTypeResult.confidence < 50) {
            shortTerm.push({
                id: 'course-positioning',
                priority: 'medium',
                type: 'content',
                category: 'Positioning',
                title: 'Clarify Course Positioning',
                description: 'Course type is unclear from content',
                impact: 'Better positioning attracts target audience',
                effort: 'medium',
                estimatedTime: '3-4 hours',
                actionSteps: courseTypeResult.recommendations,
                examples: [],
                bloomsTarget: 'UNDERSTAND',
                dokTarget: 2,
            });
        }
        // Bloom's balance recommendations
        if (bloomsDistribution.CREATE < 10) {
            longTerm.push({
                id: 'creative-activities',
                priority: 'medium',
                type: 'activity',
                category: 'Cognitive Depth',
                title: 'Add Creative Activities',
                description: 'Course lacks CREATE-level activities',
                impact: 'Creative activities develop innovation skills',
                effort: 'high',
                estimatedTime: '5-10 hours',
                actionSteps: ['Design a capstone project', 'Add portfolio assignments', 'Include open-ended challenges'],
                examples: ['Final project', 'Original design task', 'Synthesis essay'],
                bloomsTarget: 'CREATE',
                dokTarget: 4,
            });
        }
        return {
            immediate,
            shortTerm,
            longTerm,
            contentAdjustments: this.generateContentAdjustments(bloomsDistribution, chapters),
            assessmentChanges: this.generateAssessmentChanges(assessmentQuality),
            activitySuggestions: this.generateActivitySuggestions(dokDistribution),
        };
    }
    /**
     * Generate content adjustments
     */
    generateContentAdjustments(distribution, chapters) {
        const adjustments = [];
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        for (const level of levels) {
            if (distribution[level] < 10) {
                adjustments.push({
                    type: 'add',
                    targetChapter: null,
                    targetSection: null,
                    bloomsLevel: level,
                    dokLevel: bloomsToDOK(level),
                    description: `Add more ${level.toLowerCase()}-focused content`,
                    impact: 'high',
                    implementation: this.getRecommendedActivities(level),
                });
            }
        }
        return adjustments;
    }
    /**
     * Generate assessment changes
     */
    generateAssessmentChanges(quality) {
        const changes = [];
        for (const level of quality.bloomsCoverage.missingLevels) {
            changes.push({
                type: 'add',
                bloomsLevel: level,
                dokLevel: bloomsToDOK(level),
                description: `Add ${level.toLowerCase()}-level assessment questions`,
                examples: this.getRecommendedActivities(level),
                rubricSuggestion: `Create rubric for ${level.toLowerCase()}-level tasks`,
            });
        }
        return changes;
    }
    /**
     * Generate activity suggestions
     */
    generateActivitySuggestions(dokDistribution) {
        const suggestions = [];
        if (dokDistribution.level3 < 20) {
            suggestions.push({
                bloomsLevel: 'ANALYZE',
                dokLevel: 3,
                activityType: 'Case Study Analysis',
                description: 'Add strategic thinking activities',
                implementation: 'Present real-world scenarios requiring analysis and decision-making',
                expectedOutcome: 'Students develop analytical and problem-solving skills',
                materials: ['Case study documents', 'Analysis templates', 'Discussion guides'],
                timeRequired: '45-60 minutes per case',
            });
        }
        if (dokDistribution.level4 < 10) {
            suggestions.push({
                bloomsLevel: 'CREATE',
                dokLevel: 4,
                activityType: 'Extended Project',
                description: 'Add extended thinking projects',
                implementation: 'Assign multi-week projects requiring original research and creation',
                expectedOutcome: 'Students develop synthesis and innovation skills',
                materials: ['Project guidelines', 'Milestone checkpoints', 'Rubric'],
                timeRequired: '2-4 weeks',
            });
        }
        return suggestions;
    }
    /**
     * Analyze student impact
     */
    analyzeStudentImpact(bloomsDistribution, dokDistribution, courseType) {
        const skillsDeveloped = [];
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        for (const level of levels) {
            if (bloomsDistribution[level] > 10) {
                skillsDeveloped.push({
                    name: this.getSkillName(level),
                    bloomsLevel: level,
                    dokLevel: bloomsToDOK(level),
                    proficiency: bloomsDistribution[level],
                    description: this.getSkillDescription(level),
                    industryRelevance: this.getIndustryRelevance(level, courseType),
                });
            }
        }
        const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
        return {
            skillsDeveloped,
            cognitiveGrowth: {
                currentLevel: cognitiveDepth,
                projectedLevel: Math.min(cognitiveDepth + 20, 100),
                timeframe: '3-6 months',
                keyMilestones: ['Master foundational concepts', 'Develop analytical skills', 'Create original solutions'],
                confidenceInterval: { low: cognitiveDepth + 10, high: cognitiveDepth + 30 },
            },
            careerAlignment: this.getCareerAlignment(skillsDeveloped, courseType),
            competencyGains: [],
        };
    }
    /**
     * Get skill name
     */
    getSkillName(level) {
        const names = {
            REMEMBER: 'Information Retention',
            UNDERSTAND: 'Conceptual Understanding',
            APPLY: 'Practical Application',
            ANALYZE: 'Analytical Thinking',
            EVALUATE: 'Critical Evaluation',
            CREATE: 'Creative Innovation',
        };
        return names[level];
    }
    /**
     * Get skill description
     */
    getSkillDescription(level) {
        const descriptions = {
            REMEMBER: 'Ability to recall and recognize key information',
            UNDERSTAND: 'Capability to explain concepts and ideas clearly',
            APPLY: 'Skill in using knowledge in practical situations',
            ANALYZE: 'Competence in breaking down complex problems',
            EVALUATE: 'Expertise in making informed judgments',
            CREATE: 'Proficiency in generating original solutions',
        };
        return descriptions[level];
    }
    /**
     * Get industry relevance
     */
    getIndustryRelevance(level, courseType) {
        // Higher-order skills are generally more relevant
        const baseRelevance = {
            REMEMBER: 50,
            UNDERSTAND: 60,
            APPLY: 80,
            ANALYZE: 85,
            EVALUATE: 85,
            CREATE: 90,
        };
        // Adjust based on course type
        let adjustment = 0;
        if (courseType === 'technical' && (level === 'APPLY' || level === 'CREATE')) {
            adjustment = 10;
        }
        if (courseType === 'theoretical' && (level === 'ANALYZE' || level === 'EVALUATE')) {
            adjustment = 10;
        }
        return Math.min(baseRelevance[level] + adjustment, 100);
    }
    /**
     * Get career alignment
     */
    getCareerAlignment(skills, courseType) {
        const careers = [];
        const skillNames = skills.map(s => s.name);
        if (courseType === 'technical' || skillNames.includes('Practical Application')) {
            careers.push({
                role: 'Software Developer',
                alignment: 85,
                requiredSkills: ['Problem Solving', 'Critical Thinking', 'Creativity'],
                matchedSkills: skillNames,
                gapSkills: [],
                developmentPlan: 'Focus on practical projects and portfolio building',
            });
        }
        if (skillNames.includes('Analytical Thinking')) {
            careers.push({
                role: 'Data Analyst',
                alignment: 75,
                requiredSkills: ['Analytical Thinking', 'Problem Solving', 'Attention to Detail'],
                matchedSkills: skillNames.filter(s => s.includes('Analy') || s.includes('Evaluat')),
                gapSkills: ['Statistical Analysis'],
                developmentPlan: 'Add statistical and data visualization skills',
            });
        }
        return careers;
    }
    /**
     * Calculate completion percentage
     */
    calculateCompletionPercentage(courseData) {
        let score = 0;
        if (courseData.title)
            score += 15;
        if (courseData.description)
            score += 15;
        if (courseData.whatYouWillLearn.length > 0)
            score += 20;
        if (courseData.category)
            score += 10;
        if (courseData.chapters.length > 0)
            score += 25;
        if (courseData.attachments.length > 0)
            score += 15;
        return score;
    }
    /**
     * Get cached analysis
     */
    async getCachedAnalysis(courseId, contentHash, courseData) {
        if (!this.storage) {
            return null;
        }
        try {
            const existing = await this.storage.getCachedAnalysis(courseId);
            if (existing && existing.contentHash === contentHash) {
                // Reconstruct response from stored data
                // Note: Some fields may not exist in older cached entries
                return {
                    courseLevel: {
                        bloomsDistribution: existing.bloomsDistribution,
                        dokDistribution: existing.dokDistribution ?? webbDOKAnalyzer.bloomsToEstimatedDOK(existing.bloomsDistribution),
                        cognitiveDepth: existing.cognitiveDepth,
                        balance: this.determineBalance(existing.bloomsDistribution),
                        courseType: existing.courseType ?? 'intermediate',
                        courseTypeMatch: existing.courseTypeMatch ?? 50,
                    },
                    chapterAnalysis: [],
                    objectivesAnalysis: existing.objectiveAnalysis ?? [],
                    objectiveDeduplication: {
                        totalObjectives: 0,
                        uniqueClusters: 0,
                        duplicateGroups: [],
                        recommendations: [],
                        optimizedObjectives: [],
                    },
                    assessmentQuality: existing.assessmentQuality ?? assessmentQualityAnalyzer.analyzeAssessments([]),
                    learningPathway: existing.learningPathway,
                    recommendations: existing.recommendations,
                    studentImpact: {
                        skillsDeveloped: existing.skillsMatrix ?? [],
                        cognitiveGrowth: {
                            currentLevel: existing.cognitiveDepth,
                            projectedLevel: Math.min(existing.cognitiveDepth + 20, 100),
                            timeframe: '3-6 months',
                            keyMilestones: [],
                            confidenceInterval: { low: existing.cognitiveDepth + 10, high: existing.cognitiveDepth + 30 },
                        },
                        careerAlignment: [],
                        competencyGains: [],
                    },
                    metadata: {
                        analyzedAt: existing.analyzedAt.toISOString(),
                        courseId,
                        contentHash,
                        engineVersion: ENGINE_VERSION,
                        totalChapters: courseData?.chapters.length ?? 0,
                        totalSections: courseData ? courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0) : 0,
                        totalObjectives: courseData?.whatYouWillLearn.length ?? 0,
                        completionPercentage: courseData ? this.calculateCompletionPercentage(courseData) : 0,
                        analysisDepth: 'detailed',
                        cached: true,
                        processingTimeMs: 0,
                    },
                };
            }
        }
        catch (error) {
            this.logger.error('[EnhancedDepthEngine] Error fetching cached analysis:', error);
        }
        return null;
    }
    /**
     * Store analysis results
     */
    async storeAnalysis(courseId, response, contentHash) {
        if (!this.storage) {
            return;
        }
        try {
            const payload = {
                courseId,
                contentHash,
                analyzedAt: new Date(),
                bloomsDistribution: response.courseLevel.bloomsDistribution,
                cognitiveDepth: response.courseLevel.cognitiveDepth,
                learningPathway: response.learningPathway,
                skillsMatrix: response.studentImpact.skillsDeveloped,
                gapAnalysis: response.learningPathway.gaps,
                recommendations: response.recommendations,
                dokDistribution: response.courseLevel.dokDistribution,
                courseType: response.courseLevel.courseType,
                courseTypeMatch: response.courseLevel.courseTypeMatch,
                assessmentQuality: response.assessmentQuality,
                objectiveAnalysis: response.objectivesAnalysis,
            };
            await this.storage.saveAnalysis(courseId, payload);
        }
        catch (error) {
            this.logger.error('[EnhancedDepthEngine] Error storing analysis:', error);
        }
    }
    /**
     * Store historical snapshot
     */
    async storeHistoricalSnapshot(courseId, response, contentHash) {
        if (!this.storage?.createHistoricalSnapshot) {
            return;
        }
        try {
            // Check if we already have a recent snapshot (within the last hour) for this course
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (this.storage.hasRecentSnapshot) {
                const hasRecent = await this.storage.hasRecentSnapshot(courseId, oneHourAgo);
                if (hasRecent) {
                    return;
                }
            }
            await this.storage.createHistoricalSnapshot({
                courseId,
                snapshotAt: new Date(),
                cognitiveDepth: response.courseLevel.cognitiveDepth,
                balanceScore: this.calculateBalanceScore(response.courseLevel.bloomsDistribution),
                completenessScore: response.metadata.completionPercentage,
                totalChapters: response.metadata.totalChapters,
                totalObjectives: response.metadata.totalObjectives,
                metadata: {
                    contentHash,
                    engineVersion: ENGINE_VERSION,
                    totalSections: response.metadata.totalSections,
                    assessmentQuality: response.assessmentQuality.overallScore,
                    bloomsDistribution: response.courseLevel.bloomsDistribution,
                    dokDistribution: response.courseLevel.dokDistribution,
                },
            });
        }
        catch (error) {
            this.logger.error('[EnhancedDepthEngine] Error storing historical snapshot:', error);
        }
    }
}
// Export singleton instance
export const enhancedDepthEngine = new EnhancedDepthAnalysisEngine();
export const createEnhancedDepthAnalysisEngine = (options) => new EnhancedDepthAnalysisEngine(options);
