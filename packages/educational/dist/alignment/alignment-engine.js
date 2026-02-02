/**
 * Alignment Engine
 * Enhanced Depth Analysis - January 2026
 *
 * Analyzes course alignment between:
 * - Learning Objectives → Sections → Assessments
 * - Produces coverage scores, redundancy scores, and gap identification
 */
const ALIGNMENT_ENGINE_VERSION = '1.0.0';
// ═══════════════════════════════════════════════════════════════
// KEYWORD PATTERNS
// ═══════════════════════════════════════════════════════════════
const BLOOMS_KEYWORDS = {
    REMEMBER: [
        'recall', 'identify', 'recognize', 'list', 'name', 'define', 'match',
        'quote', 'memorize', 'label', 'state', 'describe', 'locate', 'retrieve',
    ],
    UNDERSTAND: [
        'explain', 'summarize', 'interpret', 'classify', 'compare', 'infer',
        'paraphrase', 'discuss', 'distinguish', 'translate', 'illustrate',
    ],
    APPLY: [
        'apply', 'implement', 'execute', 'use', 'demonstrate', 'solve',
        'compute', 'operate', 'practice', 'calculate', 'employ', 'perform',
    ],
    ANALYZE: [
        'analyze', 'differentiate', 'organize', 'attribute', 'examine',
        'investigate', 'dissect', 'contrast', 'categorize', 'deconstruct',
    ],
    EVALUATE: [
        'evaluate', 'judge', 'critique', 'assess', 'argue', 'defend',
        'justify', 'appraise', 'prioritize', 'validate', 'recommend',
    ],
    CREATE: [
        'create', 'design', 'develop', 'produce', 'construct', 'generate',
        'compose', 'synthesize', 'invent', 'formulate', 'devise', 'build',
    ],
};
const DOK_KEYWORDS = {
    1: ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match', 'memorize', 'label'],
    2: ['summarize', 'interpret', 'classify', 'compare', 'organize', 'estimate', 'predict', 'explain'],
    3: ['analyze', 'investigate', 'formulate', 'differentiate', 'conclude', 'critique', 'assess', 'justify'],
    4: ['design', 'create', 'synthesize', 'connect', 'critique across', 'prove', 'research', 'develop'],
};
// ═══════════════════════════════════════════════════════════════
// DEFAULT OPTIONS
// ═══════════════════════════════════════════════════════════════
const DEFAULT_OPTIONS = {
    alignmentThreshold: 0.3,
    includeAssessments: true,
    includeEvidence: true,
    maxKeywords: 50,
};
// ═══════════════════════════════════════════════════════════════
// ALIGNMENT ENGINE
// ═══════════════════════════════════════════════════════════════
export class AlignmentEngine {
    options;
    logger;
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
        this.logger = options.logger;
    }
    /**
     * Analyze course alignment
     */
    async analyzeAlignment(course) {
        this.logger?.info(`Starting alignment analysis for course: ${course.id}`);
        const startTime = Date.now();
        // 1. Map objectives to sections
        const objectiveAlignments = this.mapObjectivesToSections(course.objectives, course.sections);
        // 2. Map sections to assessments
        const sectionAlignments = this.mapSectionsToAssessments(course.sections, course.assessments, objectiveAlignments);
        // 3. Map assessments to objectives
        const assessmentAlignments = this.options.includeAssessments
            ? this.mapAssessmentsToObjectives(course.assessments, course.objectives)
            : [];
        // 4. Update objective alignments with assessment info
        this.updateObjectiveAssessmentLinks(objectiveAlignments, assessmentAlignments);
        // 5. Calculate scores
        const coverageScore = this.calculateCoverageScore(objectiveAlignments);
        const redundancyScore = this.calculateRedundancyScore(objectiveAlignments);
        const alignmentScore = this.calculateOverallAlignmentScore(coverageScore, redundancyScore);
        // 6. Identify gaps
        const gaps = this.identifyGaps(objectiveAlignments, sectionAlignments, assessmentAlignments);
        const criticalGapCount = gaps.filter((g) => g.severity === 'critical').length;
        // 7. Build summary
        const summary = this.buildSummary(objectiveAlignments);
        const durationMs = Date.now() - startTime;
        this.logger?.info(`Alignment analysis completed in ${durationMs}ms`);
        return {
            courseId: course.id,
            objectiveAlignments,
            sectionAlignments,
            assessmentAlignments,
            coverageScore,
            redundancyScore,
            alignmentScore,
            gaps,
            criticalGapCount,
            summary,
            analysisVersion: ALIGNMENT_ENGINE_VERSION,
            analyzedAt: new Date(),
        };
    }
    // ═══════════════════════════════════════════════════════════════
    // OBJECTIVE TO SECTION MAPPING
    // ═══════════════════════════════════════════════════════════════
    /**
     * Map objectives to sections based on content similarity
     */
    mapObjectivesToSections(objectives, sections) {
        return objectives.map((objective) => {
            const objectiveKeywords = this.extractKeywords(objective.text);
            const objectiveBloomsLevel = objective.bloomsLevel || this.inferBloomsLevel(objective.text);
            const objectiveDokLevel = objective.dokLevel || this.inferDOKLevel(objective.text);
            const linkedSections = [];
            for (const section of sections) {
                const sectionText = this.getSectionText(section);
                const matchResult = this.matchText(objectiveKeywords, sectionText);
                if (matchResult.score >= this.options.alignmentThreshold) {
                    const alignmentType = this.determineAlignmentType(matchResult.score);
                    linkedSections.push({
                        sectionId: section.id,
                        sectionTitle: section.title,
                        alignmentScore: matchResult.score,
                        alignmentType,
                        evidence: this.options.includeEvidence
                            ? [...matchResult.matchedKeywords, ...matchResult.matchedPhrases]
                            : [],
                    });
                }
            }
            // Sort by alignment score descending
            linkedSections.sort((a, b) => b.alignmentScore - a.alignmentScore);
            return {
                objectiveId: objective.id,
                objectiveText: objective.text,
                bloomsLevel: objectiveBloomsLevel,
                dokLevel: objectiveDokLevel,
                linkedSections,
                linkedAssessments: [], // Will be populated later
                hasSectionCoverage: linkedSections.length > 0,
                hasAssessmentCoverage: false, // Will be updated later
                isFullyCovered: false, // Will be updated later
                coverageGaps: [],
            };
        });
    }
    // ═══════════════════════════════════════════════════════════════
    // SECTION TO ASSESSMENT MAPPING
    // ═══════════════════════════════════════════════════════════════
    /**
     * Map sections to assessments and analyze coverage
     */
    mapSectionsToAssessments(sections, assessments, objectiveAlignments) {
        return sections.map((section) => {
            // Get assessments for this section
            const sectionAssessments = assessments.filter((a) => a.sectionId === section.id);
            const assessmentIds = sectionAssessments.map((a) => a.id);
            // Get objectives covered by this section
            const coveredObjectives = [];
            const partialObjectives = [];
            for (const alignment of objectiveAlignments) {
                const sectionLink = alignment.linkedSections.find((s) => s.sectionId === section.id);
                if (sectionLink) {
                    if (sectionLink.alignmentType === 'direct') {
                        coveredObjectives.push(alignment.objectiveId);
                    }
                    else {
                        partialObjectives.push(alignment.objectiveId);
                    }
                }
            }
            // Calculate Bloom's distribution from section content
            const bloomsDistribution = section.bloomsDistribution || this.analyzeBloomsDistribution(this.getSectionText(section));
            const primaryBloomsLevel = section.primaryBloomsLevel || this.getPrimaryBloomsLevel(bloomsDistribution);
            const dokLevel = section.dokLevel || this.inferDOKFromBlooms(primaryBloomsLevel);
            // Check if assessment Bloom's levels match section levels
            let assessmentBloomsMatch = true;
            if (sectionAssessments.length > 0) {
                const assessmentBlooms = this.getAssessmentBloomsLevels(sectionAssessments);
                assessmentBloomsMatch = this.checkBloomsMatch(primaryBloomsLevel, assessmentBlooms);
            }
            return {
                sectionId: section.id,
                sectionTitle: section.title,
                chapterId: section.chapterId,
                bloomsDistribution,
                primaryBloomsLevel,
                dokLevel,
                coveredObjectives,
                partialObjectives,
                hasAssessment: sectionAssessments.length > 0,
                assessmentIds,
                assessmentBloomsMatch,
            };
        });
    }
    // ═══════════════════════════════════════════════════════════════
    // ASSESSMENT TO OBJECTIVE MAPPING
    // ═══════════════════════════════════════════════════════════════
    /**
     * Map assessments to objectives at question level
     */
    mapAssessmentsToObjectives(assessments, objectives) {
        return assessments.map((assessment) => {
            const questionAlignments = assessment.questions.map((question) => {
                const questionKeywords = this.extractKeywords(question.text);
                const bloomsLevel = question.bloomsLevel || this.inferBloomsLevel(question.text);
                const dokLevel = question.dokLevel || this.inferDOKLevel(question.text);
                // Find matching objectives
                const linkedObjectives = [];
                let maxConfidence = 0;
                for (const objective of objectives) {
                    const objectiveKeywords = this.extractKeywords(objective.text);
                    const matchResult = this.matchKeywords(questionKeywords.keywords, objectiveKeywords.keywords);
                    if (matchResult.score >= this.options.alignmentThreshold) {
                        linkedObjectives.push(objective.id);
                        maxConfidence = Math.max(maxConfidence, matchResult.score);
                    }
                }
                return {
                    questionId: question.id,
                    questionText: question.text,
                    bloomsLevel,
                    dokLevel,
                    linkedObjectives,
                    alignmentConfidence: maxConfidence,
                };
            });
            // Aggregate objectives covered by all questions
            const objectivesCovered = [
                ...new Set(questionAlignments.flatMap((qa) => qa.linkedObjectives)),
            ];
            // Calculate Bloom's coverage from questions
            const bloomsCoverage = this.calculateBloomsFromQuestions(questionAlignments);
            // Calculate overall alignment score
            const overallAlignmentScore = questionAlignments.length > 0
                ? questionAlignments.reduce((sum, qa) => sum + qa.alignmentConfidence, 0) /
                    questionAlignments.length
                : 0;
            return {
                assessmentId: assessment.id,
                assessmentType: assessment.type,
                sectionId: assessment.sectionId,
                questionAlignments,
                objectivesCovered,
                bloomsCoverage,
                overallAlignmentScore,
            };
        });
    }
    // ═══════════════════════════════════════════════════════════════
    // SCORING METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Calculate coverage score (0-100)
     * Percentage of objectives with adequate coverage
     */
    calculateCoverageScore(alignments) {
        if (alignments.length === 0)
            return 0;
        const coveredCount = alignments.filter((a) => a.hasSectionCoverage && a.hasAssessmentCoverage).length;
        const partialCount = alignments.filter((a) => a.hasSectionCoverage || a.hasAssessmentCoverage).length;
        // Full coverage = 100%, partial = 50%
        const score = (coveredCount * 100 + (partialCount - coveredCount) * 50) / alignments.length;
        return Math.round(score * 10) / 10;
    }
    /**
     * Calculate redundancy score (0-100)
     * Higher = more redundancy/overlap
     */
    calculateRedundancyScore(alignments) {
        if (alignments.length === 0)
            return 0;
        let totalRedundancy = 0;
        for (const alignment of alignments) {
            // Count sections with direct coverage
            const directSections = alignment.linkedSections.filter((s) => s.alignmentType === 'direct').length;
            // More than 2 direct sections indicates redundancy
            if (directSections > 2) {
                totalRedundancy += (directSections - 2) * 10;
            }
            // Multiple assessments for same objective
            if (alignment.linkedAssessments.length > 2) {
                totalRedundancy += (alignment.linkedAssessments.length - 2) * 5;
            }
        }
        const score = Math.min(100, totalRedundancy / alignments.length);
        return Math.round(score * 10) / 10;
    }
    /**
     * Calculate overall alignment score
     */
    calculateOverallAlignmentScore(coverage, redundancy) {
        // Alignment = high coverage + low redundancy
        const score = coverage * 0.7 + (100 - redundancy) * 0.3;
        return Math.round(score * 10) / 10;
    }
    // ═══════════════════════════════════════════════════════════════
    // GAP IDENTIFICATION
    // ═══════════════════════════════════════════════════════════════
    /**
     * Identify gaps in alignment
     */
    identifyGaps(objectiveAlignments, sectionAlignments, assessmentAlignments) {
        const gaps = [];
        // 1. Objectives without content coverage
        for (const alignment of objectiveAlignments) {
            if (!alignment.hasSectionCoverage) {
                gaps.push({
                    type: 'objective_no_content',
                    severity: 'critical',
                    objectiveId: alignment.objectiveId,
                    description: `Objective "${this.truncate(alignment.objectiveText, 50)}" has no content coverage`,
                    recommendation: 'Add course content that addresses this learning objective',
                });
            }
            if (!alignment.hasAssessmentCoverage && this.options.includeAssessments) {
                gaps.push({
                    type: 'objective_no_assessment',
                    severity: 'warning',
                    objectiveId: alignment.objectiveId,
                    description: `Objective "${this.truncate(alignment.objectiveText, 50)}" has no assessment coverage`,
                    recommendation: 'Add quiz or exam questions that assess this learning objective',
                });
            }
            // Bloom's mismatch between objective and content
            for (const section of alignment.linkedSections) {
                const sectionAlignment = sectionAlignments.find((s) => s.sectionId === section.sectionId);
                if (sectionAlignment && !this.bloomsLevelsCompatible(alignment.bloomsLevel, sectionAlignment.primaryBloomsLevel)) {
                    gaps.push({
                        type: 'blooms_mismatch',
                        severity: 'warning',
                        objectiveId: alignment.objectiveId,
                        sectionId: section.sectionId,
                        description: `Objective requires ${alignment.bloomsLevel} but section focuses on ${sectionAlignment.primaryBloomsLevel}`,
                        recommendation: `Adjust content to include ${alignment.bloomsLevel}-level activities`,
                    });
                }
            }
        }
        // 2. Redundant coverage detection
        const objectiveCoverageCount = new Map();
        for (const alignment of objectiveAlignments) {
            const directSectionCount = alignment.linkedSections.filter((s) => s.alignmentType === 'direct').length;
            objectiveCoverageCount.set(alignment.objectiveId, directSectionCount);
            if (directSectionCount > 3) {
                gaps.push({
                    type: 'redundant_coverage',
                    severity: 'info',
                    objectiveId: alignment.objectiveId,
                    description: `Objective covered directly by ${directSectionCount} sections`,
                    recommendation: 'Consider consolidating content to reduce redundancy',
                });
            }
        }
        // 3. Sections without assessment
        for (const section of sectionAlignments) {
            if (!section.hasAssessment && section.coveredObjectives.length > 0) {
                gaps.push({
                    type: 'objective_no_assessment',
                    severity: 'warning',
                    sectionId: section.sectionId,
                    description: `Section "${section.sectionTitle}" covers objectives but has no assessment`,
                    recommendation: 'Add assessment to verify learning from this section',
                });
            }
        }
        // Sort by severity
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        return gaps;
    }
    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Update objective alignments with assessment links
     */
    updateObjectiveAssessmentLinks(objectiveAlignments, assessmentAlignments) {
        for (const objective of objectiveAlignments) {
            const linkedAssessments = [];
            for (const assessment of assessmentAlignments) {
                if (assessment.objectivesCovered.includes(objective.objectiveId)) {
                    // Find questions that link to this objective
                    const linkedQuestionIds = assessment.questionAlignments
                        .filter((qa) => qa.linkedObjectives.includes(objective.objectiveId))
                        .map((qa) => qa.questionId);
                    // Calculate coverage score
                    const coverageScore = linkedQuestionIds.length / Math.max(1, assessment.questionAlignments.length);
                    // Check Bloom's match
                    const questionBlooms = assessment.questionAlignments
                        .filter((qa) => qa.linkedObjectives.includes(objective.objectiveId))
                        .map((qa) => qa.bloomsLevel);
                    const bloomsMatch = questionBlooms.some((bl) => this.bloomsLevelsCompatible(objective.bloomsLevel, bl));
                    // Check DOK match
                    const questionDoks = assessment.questionAlignments
                        .filter((qa) => qa.linkedObjectives.includes(objective.objectiveId))
                        .map((qa) => qa.dokLevel);
                    const dokMatch = questionDoks.some((dok) => Math.abs(dok - objective.dokLevel) <= 1);
                    linkedAssessments.push({
                        assessmentId: assessment.assessmentId,
                        assessmentType: assessment.assessmentType,
                        questionIds: linkedQuestionIds,
                        coverageScore,
                        bloomsMatch,
                        dokMatch,
                    });
                }
            }
            objective.linkedAssessments = linkedAssessments;
            objective.hasAssessmentCoverage = linkedAssessments.length > 0;
            objective.isFullyCovered = objective.hasSectionCoverage && objective.hasAssessmentCoverage;
            // Identify specific coverage gaps
            if (!objective.hasSectionCoverage) {
                objective.coverageGaps.push('No content coverage');
            }
            if (!objective.hasAssessmentCoverage) {
                objective.coverageGaps.push('No assessment coverage');
            }
        }
    }
    /**
     * Build alignment summary
     */
    buildSummary(alignments) {
        const totalObjectives = alignments.length;
        const fullyCoveredObjectives = alignments.filter((a) => a.isFullyCovered).length;
        const partialObjectives = alignments.filter((a) => !a.isFullyCovered && (a.hasSectionCoverage || a.hasAssessmentCoverage)).length;
        const uncoveredObjectives = alignments.filter((a) => !a.hasSectionCoverage && !a.hasAssessmentCoverage).length;
        const assessmentCoverage = totalObjectives > 0
            ? Math.round((alignments.filter((a) => a.hasAssessmentCoverage).length / totalObjectives) * 100)
            : 0;
        return {
            totalObjectives,
            fullyCoveredObjectives,
            partialObjectives,
            uncoveredObjectives,
            assessmentCoverage,
        };
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const normalizedText = text.toLowerCase();
        const words = normalizedText.split(/\s+/).filter((w) => w.length > 2);
        // Remove common stop words
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
            'used', 'this', 'that', 'these', 'those', 'their', 'they', 'them', 'it',
            'its', 'you', 'your', 'we', 'our', 'i', 'me', 'my', 'able', 'about',
        ]);
        const keywords = words
            .filter((w) => !stopWords.has(w) && !/^\d+$/.test(w))
            .slice(0, this.options.maxKeywords);
        // Extract phrases (2-3 word combinations)
        const phrases = [];
        for (let i = 0; i < words.length - 1; i++) {
            if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
                phrases.push(`${words[i]} ${words[i + 1]}`);
            }
        }
        // Find Bloom's indicators
        const bloomsIndicators = [];
        for (const [, verbs] of Object.entries(BLOOMS_KEYWORDS)) {
            for (const verb of verbs) {
                if (normalizedText.includes(verb)) {
                    bloomsIndicators.push(verb);
                }
            }
        }
        // Find DOK indicators
        const dokIndicators = [];
        for (const [, terms] of Object.entries(DOK_KEYWORDS)) {
            for (const term of terms) {
                if (normalizedText.includes(term)) {
                    dokIndicators.push(term);
                }
            }
        }
        return {
            keywords,
            phrases: phrases.slice(0, 20),
            bloomsIndicators,
            dokIndicators,
        };
    }
    /**
     * Match text using keywords
     */
    matchText(extraction, targetText) {
        const normalizedTarget = targetText.toLowerCase();
        const matchedKeywords = extraction.keywords.filter((kw) => normalizedTarget.includes(kw));
        const matchedPhrases = extraction.phrases.filter((phrase) => normalizedTarget.includes(phrase));
        // Calculate score
        const keywordScore = extraction.keywords.length > 0
            ? matchedKeywords.length / extraction.keywords.length
            : 0;
        const phraseScore = extraction.phrases.length > 0
            ? matchedPhrases.length / extraction.phrases.length
            : 0;
        // Phrases are weighted higher
        const score = keywordScore * 0.4 + phraseScore * 0.6;
        return {
            score: Math.min(1, score),
            matchedKeywords,
            matchedPhrases,
        };
    }
    /**
     * Match keywords between two keyword sets
     */
    matchKeywords(keywords1, keywords2) {
        const set2 = new Set(keywords2);
        const matchedKeywords = keywords1.filter((kw) => set2.has(kw));
        const score = keywords1.length > 0
            ? matchedKeywords.length / keywords1.length
            : 0;
        return {
            score,
            matchedKeywords,
            matchedPhrases: [],
        };
    }
    /**
     * Get combined text from section
     */
    getSectionText(section) {
        const parts = [section.title];
        if (section.description) {
            parts.push(section.description);
        }
        if (section.extractedText) {
            parts.push(section.extractedText);
        }
        return parts.join(' ');
    }
    /**
     * Determine alignment type based on score
     */
    determineAlignmentType(score) {
        if (score >= 0.7)
            return 'direct';
        if (score >= 0.5)
            return 'partial';
        return 'contextual';
    }
    /**
     * Infer Bloom's level from text
     */
    inferBloomsLevel(text) {
        const normalizedText = text.toLowerCase();
        const scores = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS)) {
            for (const keyword of keywords) {
                if (normalizedText.includes(keyword)) {
                    scores[level]++;
                }
            }
        }
        // Find level with highest score
        let maxLevel = 'UNDERSTAND';
        let maxScore = 0;
        for (const [level, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                maxLevel = level;
            }
        }
        return maxLevel;
    }
    /**
     * Infer DOK level from text
     */
    inferDOKLevel(text) {
        const normalizedText = text.toLowerCase();
        const scores = { 1: 0, 2: 0, 3: 0, 4: 0 };
        for (const [level, keywords] of Object.entries(DOK_KEYWORDS)) {
            for (const keyword of keywords) {
                if (normalizedText.includes(keyword)) {
                    scores[parseInt(level)]++;
                }
            }
        }
        // Find level with highest score
        let maxLevel = 2;
        let maxScore = 0;
        for (const [level, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                maxLevel = parseInt(level);
            }
        }
        return maxLevel;
    }
    /**
     * Analyze Bloom's distribution from text
     */
    analyzeBloomsDistribution(text) {
        const normalizedText = text.toLowerCase();
        const counts = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS)) {
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    counts[level] += matches.length;
                }
            }
        }
        // Normalize to percentages
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const level of Object.keys(counts)) {
                counts[level] = Math.round((counts[level] / total) * 100);
            }
        }
        return counts;
    }
    /**
     * Get primary Bloom's level from distribution
     */
    getPrimaryBloomsLevel(distribution) {
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
     * Infer DOK level from Bloom's level
     */
    inferDOKFromBlooms(bloomsLevel) {
        const mapping = {
            REMEMBER: 1,
            UNDERSTAND: 2,
            APPLY: 2,
            ANALYZE: 3,
            EVALUATE: 3,
            CREATE: 4,
        };
        return mapping[bloomsLevel];
    }
    /**
     * Get Bloom's levels from assessments
     */
    getAssessmentBloomsLevels(assessments) {
        const levels = [];
        for (const assessment of assessments) {
            for (const question of assessment.questions) {
                const level = question.bloomsLevel || this.inferBloomsLevel(question.text);
                levels.push(level);
            }
        }
        return levels;
    }
    /**
     * Check if Bloom's levels match
     */
    checkBloomsMatch(sectionLevel, assessmentLevels) {
        // Consider it a match if any assessment question is at or above section level
        const levelOrder = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const sectionIndex = levelOrder.indexOf(sectionLevel);
        return assessmentLevels.some((level) => {
            const assessIndex = levelOrder.indexOf(level);
            return Math.abs(assessIndex - sectionIndex) <= 1; // Within 1 level
        });
    }
    /**
     * Check if two Bloom's levels are compatible
     */
    bloomsLevelsCompatible(level1, level2) {
        const levelOrder = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const index1 = levelOrder.indexOf(level1);
        const index2 = levelOrder.indexOf(level2);
        // Compatible if within 1 level of each other
        return Math.abs(index1 - index2) <= 1;
    }
    /**
     * Calculate Bloom's distribution from question alignments
     */
    calculateBloomsFromQuestions(questions) {
        const counts = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const question of questions) {
            counts[question.bloomsLevel]++;
        }
        // Normalize to percentages
        const total = questions.length;
        if (total > 0) {
            for (const level of Object.keys(counts)) {
                counts[level] = Math.round((counts[level] / total) * 100);
            }
        }
        return counts;
    }
    /**
     * Truncate text for display
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}
/**
 * Create an alignment engine instance
 */
export function createAlignmentEngine(options) {
    return new AlignmentEngine(options);
}
