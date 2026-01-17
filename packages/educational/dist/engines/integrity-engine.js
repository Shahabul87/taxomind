/**
 * Portable Integrity Engine - Academic Integrity & Plagiarism Detection
 *
 * Provides comprehensive academic integrity checks including:
 * - Plagiarism detection using similarity analysis
 * - AI-generated content detection
 * - Writing style consistency checking
 * - Cross-submission comparison
 *
 * @version 1.0.0
 * @module @sam-ai/educational
 */
// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════
/**
 * Tokenize text into words
 */
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0);
}
/**
 * Generate n-grams from text
 */
function generateNgrams(text, n) {
    const words = tokenize(text);
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
}
/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}
/**
 * Calculate cosine similarity between two texts
 */
function cosineSimilarity(text1, text2) {
    const words1 = tokenize(text1);
    const words2 = tokenize(text2);
    const allWords = new Set([...words1, ...words2]);
    const vector1 = new Map();
    const vector2 = new Map();
    for (const word of allWords) {
        vector1.set(word, words1.filter(w => w === word).length);
        vector2.set(word, words2.filter(w => w === word).length);
    }
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    for (const word of allWords) {
        const v1 = vector1.get(word) ?? 0;
        const v2 = vector2.get(word) ?? 0;
        dotProduct += v1 * v2;
        magnitude1 += v1 * v1;
        magnitude2 += v2 * v2;
    }
    const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return denominator > 0 ? (dotProduct / denominator) * 100 : 0;
}
/**
 * Calculate perplexity score (simplified)
 */
function calculatePerplexity(text) {
    const words = tokenize(text);
    const wordFreq = new Map();
    for (const word of words) {
        wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
    }
    let entropy = 0;
    for (const count of wordFreq.values()) {
        const p = count / words.length;
        entropy -= p * Math.log2(p);
    }
    return Math.pow(2, entropy);
}
/**
 * Calculate burstiness (variance in sentence lengths)
 */
function calculateBurstiness(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2)
        return 0;
    const lengths = sentences.map(s => tokenize(s).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    // Normalize to 0-100 scale
    return Math.min(100, (variance / mean) * 10);
}
/**
 * Calculate standard deviation
 */
function calculateStdDev(values) {
    if (values.length === 0)
        return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}
// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
    enablePlagiarismCheck: true,
    enableAIDetection: true,
    enableConsistencyCheck: true,
    plagiarismThreshold: 30,
    aiProbabilityThreshold: 70,
    minTextLength: 50,
    compareWithCourseContent: true,
    compareWithOtherStudents: true,
    compareWithExternalSources: false,
};
// ═══════════════════════════════════════════════════════════════
// MAIN INTEGRITY ENGINE CLASS
// ═══════════════════════════════════════════════════════════════
export class IntegrityEngine {
    config;
    database;
    constructor(engineConfig) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...engineConfig?.checkConfig,
        };
        this.database = engineConfig?.database;
    }
    // ─────────────────────────────────────────────────────────────
    // CONFIGURATION
    // ─────────────────────────────────────────────────────────────
    getConfig() {
        return { ...this.config };
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    // ─────────────────────────────────────────────────────────────
    // PLAGIARISM DETECTION
    // ─────────────────────────────────────────────────────────────
    /**
     * Check text for plagiarism against a corpus
     */
    async checkPlagiarism(text, corpus) {
        if (text.length < this.config.minTextLength) {
            return {
                isPlagiarized: false,
                overallSimilarity: 0,
                matches: [],
                confidence: 100,
                analysisMethod: 'ngram',
                timestamp: new Date().toISOString(),
            };
        }
        const matches = [];
        const textNgrams = new Set(generateNgrams(text, 3));
        const textNgrams5 = new Set(generateNgrams(text, 5));
        for (const source of corpus) {
            // Skip if comparing to itself
            if (source.content === text)
                continue;
            // N-gram similarity (3-grams)
            const sourceNgrams = new Set(generateNgrams(source.content, 3));
            const ngramSimilarity = jaccardSimilarity(textNgrams, sourceNgrams);
            // 5-gram similarity for exact phrase matching
            const sourceNgrams5 = new Set(generateNgrams(source.content, 5));
            const exactPhraseSimilarity = jaccardSimilarity(textNgrams5, sourceNgrams5);
            // Cosine similarity for overall content
            const cosineSim = cosineSimilarity(text, source.content);
            // Weighted average
            const overallSimilarity = ngramSimilarity * 0.4 + exactPhraseSimilarity * 0.4 + cosineSim * 0.2;
            if (overallSimilarity > 20) {
                // Find matching segments
                const matchedSegments = this.findMatchingSegments(text, source.content);
                for (const segment of matchedSegments) {
                    matches.push({
                        sourceId: source.id,
                        sourceType: source.type,
                        matchedText: segment.matched,
                        originalText: segment.original,
                        similarity: segment.similarity,
                        startPosition: segment.start,
                        endPosition: segment.end,
                    });
                }
            }
        }
        // Calculate overall similarity
        const maxSimilarity = matches.length > 0
            ? Math.max(...matches.map(m => m.similarity))
            : 0;
        const avgSimilarity = matches.length > 0
            ? matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length
            : 0;
        const overallSimilarity = Math.max(maxSimilarity, avgSimilarity);
        return {
            isPlagiarized: overallSimilarity >= this.config.plagiarismThreshold,
            overallSimilarity: Math.round(overallSimilarity * 100) / 100,
            matches: matches.slice(0, 10), // Top 10 matches
            confidence: this.calculatePlagiarismConfidence(matches, text.length),
            analysisMethod: 'ngram',
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Find matching text segments between two texts
     */
    findMatchingSegments(text, source) {
        const segments = [];
        // Split into sentences and compare
        const textSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const sourceSentences = source.split(/[.!?]+/).filter(s => s.trim().length > 10);
        let position = 0;
        for (const sentence of textSentences) {
            const trimmedSentence = sentence.trim();
            const start = text.indexOf(trimmedSentence, position);
            for (const sourceSentence of sourceSentences) {
                const similarity = cosineSimilarity(trimmedSentence, sourceSentence.trim());
                if (similarity > 60) {
                    segments.push({
                        matched: trimmedSentence,
                        original: sourceSentence.trim(),
                        similarity,
                        start,
                        end: start + trimmedSentence.length,
                    });
                    break;
                }
            }
            position = start + trimmedSentence.length;
        }
        return segments;
    }
    /**
     * Calculate confidence in plagiarism detection
     */
    calculatePlagiarismConfidence(matches, textLength) {
        if (matches.length === 0)
            return 95;
        // More text = more confident
        const lengthFactor = Math.min(1, textLength / 500);
        // More matches = more confident
        const matchFactor = Math.min(1, matches.length / 5);
        // Higher similarity = more confident
        const avgSimilarity = matches.reduce((s, m) => s + m.similarity, 0) / matches.length;
        const similarityFactor = avgSimilarity / 100;
        return Math.round((lengthFactor * 30 + matchFactor * 30 + similarityFactor * 40) * 100) / 100;
    }
    // ─────────────────────────────────────────────────────────────
    // AI CONTENT DETECTION
    // ─────────────────────────────────────────────────────────────
    /**
     * Detect if text is likely AI-generated
     */
    async detectAIContent(text) {
        if (text.length < this.config.minTextLength) {
            return {
                isAIGenerated: false,
                probability: 0,
                confidence: 50,
                indicators: [],
                perplexityScore: 0,
                burstinessScore: 0,
                analysisDetails: {
                    averageSentenceLength: 0,
                    vocabularyDiversity: 0,
                    repetitivePatterns: 0,
                    formalityScore: 0,
                },
            };
        }
        const indicators = [];
        const words = tokenize(text);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        // 1. Perplexity Analysis
        const perplexityScore = calculatePerplexity(text);
        const normalizedPerplexity = Math.min(100, perplexityScore);
        // AI text typically has low perplexity (predictable)
        if (normalizedPerplexity < 50) {
            indicators.push({
                type: 'perplexity',
                score: 100 - normalizedPerplexity,
                description: 'Low perplexity suggests predictable, possibly AI-generated text',
                weight: 0.25,
            });
        }
        // 2. Burstiness Analysis
        const burstinessScore = calculateBurstiness(text);
        // AI text typically has low burstiness (uniform sentence lengths)
        if (burstinessScore < 30) {
            indicators.push({
                type: 'burstiness',
                score: 100 - burstinessScore,
                description: 'Uniform sentence lengths suggest AI generation',
                weight: 0.2,
            });
        }
        // 3. Vocabulary Diversity
        const uniqueWords = new Set(words);
        const vocabularyDiversity = (uniqueWords.size / words.length) * 100;
        // AI often has moderate vocabulary diversity
        if (vocabularyDiversity > 40 && vocabularyDiversity < 60) {
            indicators.push({
                type: 'vocabulary',
                score: 60,
                description: 'Vocabulary diversity in typical AI range',
                weight: 0.15,
            });
        }
        // 4. Sentence Structure Analysis
        const avgSentenceLength = words.length / sentences.length;
        const sentenceLengths = sentences.map(s => tokenize(s).length);
        const sentenceLengthStdDev = calculateStdDev(sentenceLengths);
        // AI tends to have consistent sentence structures
        if (sentenceLengthStdDev < avgSentenceLength * 0.3) {
            indicators.push({
                type: 'structure',
                score: 70,
                description: 'Highly consistent sentence structure',
                weight: 0.2,
            });
        }
        // 5. Repetitive Patterns
        const ngrams = generateNgrams(text, 4);
        const ngramFreq = new Map();
        for (const ngram of ngrams) {
            ngramFreq.set(ngram, (ngramFreq.get(ngram) ?? 0) + 1);
        }
        const repetitivePatterns = [...ngramFreq.values()].filter(v => v > 2).length;
        if (repetitivePatterns > 5) {
            indicators.push({
                type: 'repetition',
                score: Math.min(100, repetitivePatterns * 10),
                description: 'Repetitive phrase patterns detected',
                weight: 0.2,
            });
        }
        // Calculate weighted probability
        let probability = 0;
        let totalWeight = 0;
        for (const indicator of indicators) {
            probability += indicator.score * indicator.weight;
            totalWeight += indicator.weight;
        }
        if (totalWeight > 0) {
            probability = probability / totalWeight;
        }
        // Calculate formality score
        const formalWords = ['therefore', 'however', 'furthermore', 'consequently', 'additionally', 'moreover'];
        const formalWordCount = words.filter(w => formalWords.includes(w)).length;
        const formalityScore = Math.min(100, (formalWordCount / words.length) * 1000);
        return {
            isAIGenerated: probability >= this.config.aiProbabilityThreshold,
            probability: Math.round(probability * 100) / 100,
            confidence: this.calculateAIDetectionConfidence(text.length, indicators.length),
            indicators,
            perplexityScore: Math.round(normalizedPerplexity * 100) / 100,
            burstinessScore: Math.round(burstinessScore * 100) / 100,
            analysisDetails: {
                averageSentenceLength: Math.round(avgSentenceLength * 100) / 100,
                vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
                repetitivePatterns,
                formalityScore: Math.round(formalityScore * 100) / 100,
            },
        };
    }
    calculateAIDetectionConfidence(textLength, indicatorCount) {
        // Longer text = more confident
        const lengthFactor = Math.min(1, textLength / 500);
        // More indicators = more confident
        const indicatorFactor = Math.min(1, indicatorCount / 4);
        return Math.round((50 + lengthFactor * 25 + indicatorFactor * 25) * 100) / 100;
    }
    // ─────────────────────────────────────────────────────────────
    // WRITING STYLE CONSISTENCY
    // ─────────────────────────────────────────────────────────────
    /**
     * Check writing style consistency against previous submissions
     */
    async checkConsistency(currentText, previousSubmissions) {
        if (previousSubmissions.length === 0) {
            return {
                isConsistent: true,
                consistencyScore: 100,
                styleMetrics: this.extractStyleMetrics(currentText),
                anomalies: [],
                recommendation: 'pass',
            };
        }
        const currentMetrics = this.extractStyleMetrics(currentText);
        const previousMetricsList = previousSubmissions.map(s => this.extractStyleMetrics(s));
        // Calculate average metrics from previous submissions
        const avgMetrics = this.calculateAverageMetrics(previousMetricsList);
        // Find anomalies
        const anomalies = this.detectAnomalies(currentMetrics, avgMetrics);
        // Calculate consistency score
        const consistencyScore = this.calculateConsistencyScore(currentMetrics, avgMetrics);
        return {
            isConsistent: consistencyScore >= 60,
            consistencyScore: Math.round(consistencyScore * 100) / 100,
            styleMetrics: currentMetrics,
            anomalies,
            recommendation: this.getRecommendation(consistencyScore, anomalies),
        };
    }
    extractStyleMetrics(text) {
        const words = tokenize(text);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const uniqueWords = new Set(words);
        // Calculate vocabulary level (average word length as proxy)
        const avgWordLength = words.length > 0
            ? words.reduce((sum, w) => sum + w.length, 0) / words.length
            : 0;
        // Sentence complexity (words per sentence)
        const sentenceComplexity = sentences.length > 0
            ? words.length / sentences.length
            : 0;
        // Common phrases (2-grams that appear multiple times)
        const bigrams = generateNgrams(text, 2);
        const bigramFreq = new Map();
        for (const bigram of bigrams) {
            bigramFreq.set(bigram, (bigramFreq.get(bigram) ?? 0) + 1);
        }
        const commonPhrases = [...bigramFreq.entries()]
            .filter(([, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([phrase]) => phrase);
        // Writing patterns (sentence starters)
        const writingPatterns = sentences
            .map(s => tokenize(s.trim()).slice(0, 2).join(' '))
            .filter((p, i, arr) => arr.indexOf(p) === i)
            .slice(0, 5);
        // Punctuation style
        const punctuationStyle = {
            commas: (text.match(/,/g) ?? []).length / Math.max(1, sentences.length),
            semicolons: (text.match(/;/g) ?? []).length / Math.max(1, sentences.length),
            colons: (text.match(/:/g) ?? []).length / Math.max(1, sentences.length),
            dashes: (text.match(/-/g) ?? []).length / Math.max(1, sentences.length),
        };
        return {
            vocabularyLevel: avgWordLength,
            sentenceComplexity,
            writingPatterns,
            commonPhrases,
            punctuationStyle,
            averageWordLength: avgWordLength,
            uniqueWordRatio: words.length > 0 ? uniqueWords.size / words.length : 0,
        };
    }
    calculateAverageMetrics(metricsList) {
        const n = metricsList.length;
        if (n === 0) {
            return {
                vocabularyLevel: 0,
                sentenceComplexity: 0,
                writingPatterns: [],
                commonPhrases: [],
                punctuationStyle: { commas: 0, semicolons: 0, colons: 0, dashes: 0 },
                averageWordLength: 0,
                uniqueWordRatio: 0,
            };
        }
        return {
            vocabularyLevel: metricsList.reduce((s, m) => s + m.vocabularyLevel, 0) / n,
            sentenceComplexity: metricsList.reduce((s, m) => s + m.sentenceComplexity, 0) / n,
            writingPatterns: metricsList.flatMap(m => m.writingPatterns).filter((p, i, arr) => arr.indexOf(p) === i),
            commonPhrases: metricsList.flatMap(m => m.commonPhrases).filter((p, i, arr) => arr.indexOf(p) === i),
            punctuationStyle: {
                commas: metricsList.reduce((s, m) => s + m.punctuationStyle.commas, 0) / n,
                semicolons: metricsList.reduce((s, m) => s + m.punctuationStyle.semicolons, 0) / n,
                colons: metricsList.reduce((s, m) => s + m.punctuationStyle.colons, 0) / n,
                dashes: metricsList.reduce((s, m) => s + m.punctuationStyle.dashes, 0) / n,
            },
            averageWordLength: metricsList.reduce((s, m) => s + m.averageWordLength, 0) / n,
            uniqueWordRatio: metricsList.reduce((s, m) => s + m.uniqueWordRatio, 0) / n,
        };
    }
    detectAnomalies(current, average) {
        const anomalies = [];
        const threshold = 0.3; // 30% deviation threshold
        // Guard against division by zero
        if (average.vocabularyLevel === 0 || average.sentenceComplexity === 0) {
            return anomalies;
        }
        // Vocabulary level shift
        const vocabDeviation = Math.abs(current.vocabularyLevel - average.vocabularyLevel) / average.vocabularyLevel;
        if (vocabDeviation > threshold) {
            anomalies.push({
                type: 'vocabulary_shift',
                severity: vocabDeviation > 0.5 ? 'high' : 'medium',
                description: `Vocabulary level differs by ${Math.round(vocabDeviation * 100)}% from average`,
                evidence: `Current: ${current.vocabularyLevel.toFixed(2)}, Average: ${average.vocabularyLevel.toFixed(2)}`,
            });
        }
        // Sentence complexity change
        const complexityDeviation = Math.abs(current.sentenceComplexity - average.sentenceComplexity) / average.sentenceComplexity;
        if (complexityDeviation > threshold) {
            anomalies.push({
                type: 'complexity_change',
                severity: complexityDeviation > 0.5 ? 'high' : 'medium',
                description: `Sentence complexity differs by ${Math.round(complexityDeviation * 100)}%`,
                evidence: `Current: ${current.sentenceComplexity.toFixed(2)} words/sentence, Average: ${average.sentenceComplexity.toFixed(2)}`,
            });
        }
        // Quality jump (both vocabulary and complexity improved significantly)
        if (current.vocabularyLevel > average.vocabularyLevel * 1.3 &&
            current.sentenceComplexity > average.sentenceComplexity * 1.3) {
            anomalies.push({
                type: 'quality_jump',
                severity: 'high',
                description: 'Sudden improvement in writing quality detected',
                evidence: 'Both vocabulary level and sentence complexity significantly higher than historical average',
            });
        }
        return anomalies;
    }
    calculateConsistencyScore(current, average) {
        // Guard against division by zero
        if (average.vocabularyLevel === 0 || average.sentenceComplexity === 0 || average.uniqueWordRatio === 0) {
            return 100; // No history to compare against
        }
        const deviations = [
            Math.abs(current.vocabularyLevel - average.vocabularyLevel) / average.vocabularyLevel,
            Math.abs(current.sentenceComplexity - average.sentenceComplexity) / average.sentenceComplexity,
            Math.abs(current.uniqueWordRatio - average.uniqueWordRatio) / average.uniqueWordRatio,
        ];
        const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        return Math.max(0, (1 - avgDeviation) * 100);
    }
    getRecommendation(score, anomalies) {
        const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
        if (highSeverityCount >= 2 || score < 40) {
            return 'flag';
        }
        else if (highSeverityCount >= 1 || score < 60) {
            return 'review';
        }
        return 'pass';
    }
    // ─────────────────────────────────────────────────────────────
    // COMPREHENSIVE INTEGRITY CHECK
    // ─────────────────────────────────────────────────────────────
    /**
     * Run comprehensive integrity check
     */
    async runIntegrityCheck(answerId, text, studentId, examId, options) {
        const report = {
            id: `integrity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            answerId,
            studentId,
            examId,
            timestamp: new Date().toISOString(),
            plagiarism: null,
            aiDetection: null,
            consistency: null,
            overallRisk: 'low',
            flaggedForReview: false,
            autoApproved: true,
            recommendations: [],
            requiredActions: [],
        };
        // Run enabled checks
        if (this.config.enablePlagiarismCheck && options?.corpus) {
            report.plagiarism = await this.checkPlagiarism(text, options.corpus);
        }
        if (this.config.enableAIDetection) {
            report.aiDetection = await this.detectAIContent(text);
        }
        if (this.config.enableConsistencyCheck && options?.previousSubmissions) {
            report.consistency = await this.checkConsistency(text, options.previousSubmissions);
        }
        // Calculate overall risk
        report.overallRisk = this.calculateOverallRisk(report);
        report.flaggedForReview = report.overallRisk === 'high' || report.overallRisk === 'critical';
        report.autoApproved = report.overallRisk === 'low';
        // Generate recommendations
        report.recommendations = this.generateRecommendations(report);
        report.requiredActions = this.generateRequiredActions(report);
        // Store report in database if adapter is available
        if (this.database) {
            await this.database.storeIntegrityReport(report);
        }
        return report;
    }
    calculateOverallRisk(report) {
        let riskScore = 0;
        if (report.plagiarism?.isPlagiarized) {
            riskScore += report.plagiarism.overallSimilarity >= 50 ? 40 : 20;
        }
        if (report.aiDetection?.isAIGenerated) {
            riskScore += report.aiDetection.probability >= 80 ? 30 : 15;
        }
        if (report.consistency && !report.consistency.isConsistent) {
            const highAnomalies = report.consistency.anomalies.filter(a => a.severity === 'high').length;
            riskScore += highAnomalies * 15;
        }
        if (riskScore >= 60)
            return 'critical';
        if (riskScore >= 40)
            return 'high';
        if (riskScore >= 20)
            return 'medium';
        return 'low';
    }
    generateRecommendations(report) {
        const recommendations = [];
        if (report.plagiarism?.isPlagiarized) {
            recommendations.push('Review matched sources and compare with student submission');
            if (report.plagiarism.overallSimilarity >= 50) {
                recommendations.push('Consider requesting the student to resubmit with proper citations');
            }
        }
        if (report.aiDetection?.isAIGenerated) {
            recommendations.push('Consider asking the student to explain their answer verbally');
            recommendations.push('Check if AI assistance was permitted for this assignment');
        }
        if (report.consistency && !report.consistency.isConsistent) {
            recommendations.push('Compare this submission with previous work from the same student');
            if (report.consistency.anomalies.some(a => a.type === 'quality_jump')) {
                recommendations.push('Consider a follow-up assessment to verify understanding');
            }
        }
        return recommendations;
    }
    generateRequiredActions(report) {
        const actions = [];
        if (report.overallRisk === 'critical') {
            actions.push('REQUIRED: Manual review by instructor before grading');
            actions.push('REQUIRED: Document findings in student academic record');
        }
        else if (report.overallRisk === 'high') {
            actions.push('REQUIRED: Instructor review recommended');
        }
        if (report.plagiarism?.overallSimilarity && report.plagiarism.overallSimilarity >= 70) {
            actions.push('REQUIRED: Academic integrity office notification');
        }
        return actions;
    }
    // ─────────────────────────────────────────────────────────────
    // BATCH PROCESSING
    // ─────────────────────────────────────────────────────────────
    /**
     * Run integrity checks on multiple submissions
     */
    async runBatchIntegrityCheck(submissions) {
        // Build corpus from all submissions for cross-checking
        const corpus = submissions.map(s => ({
            id: s.answerId,
            content: s.text,
            type: 'student_answer',
        }));
        const reports = [];
        for (const submission of submissions) {
            // Exclude current submission from corpus
            const filteredCorpus = corpus.filter(c => c.id !== submission.answerId);
            const report = await this.runIntegrityCheck(submission.answerId, submission.text, submission.studentId, submission.examId, { corpus: filteredCorpus });
            reports.push(report);
        }
        return reports;
    }
}
// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════
export function createIntegrityEngine(config) {
    return new IntegrityEngine(config);
}
export default IntegrityEngine;
