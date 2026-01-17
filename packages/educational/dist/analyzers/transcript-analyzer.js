/**
 * Transcript Analyzer
 * Phase 4: Video transcript extraction and analysis for cognitive depth
 *
 * Key Features:
 * - Video transcript aggregation from multiple sources
 * - Integration with DeepContentAnalyzer for cognitive analysis
 * - Support for YouTube, Vimeo, and custom video platforms
 * - Transcript quality assessment
 *
 * Note: Actual transcript extraction requires external API integration
 * (YouTube Data API, Whisper API, etc.)
 */
import { deepContentAnalyzer, } from './deep-content-analyzer';
// ═══════════════════════════════════════════════════════════════
// TRANSCRIPT ANALYZER CLASS
// ═══════════════════════════════════════════════════════════════
export class TranscriptAnalyzer {
    contentAnalyzer;
    MIN_TRANSCRIPT_LENGTH = 100; // Minimum characters
    WORDS_PER_MINUTE_THRESHOLD = 100; // Typical speech rate
    constructor(contentAnalyzer) {
        this.contentAnalyzer = contentAnalyzer ?? deepContentAnalyzer;
    }
    /**
     * Analyze transcripts for an entire course
     */
    async analyzeCourseTranscripts(courseId, sources) {
        const videoResults = [];
        const contentSources = [];
        let totalWordCount = 0;
        let totalDuration = 0;
        let totalConfidence = 0;
        let analyzedCount = 0;
        const qualityDistribution = {
            excellent: 0,
            good: 0,
            acceptable: 0,
            poor: 0,
        };
        for (const source of sources) {
            const result = await this.analyzeTranscript(source);
            videoResults.push(result);
            if (result.hasTranscript && result.contentAnalysis) {
                analyzedCount++;
                totalWordCount += result.wordCount;
                totalConfidence += result.confidence;
                if (result.duration) {
                    totalDuration += result.duration;
                }
                if (result.transcriptQuality) {
                    qualityDistribution[result.transcriptQuality.qualityRating]++;
                }
                // Collect content sources for aggregated analysis
                if (source.transcript) {
                    contentSources.push({
                        type: 'video_transcript',
                        content: source.transcript,
                        metadata: {
                            sourceId: source.sectionId,
                            sectionId: source.sectionId,
                            chapterId: source.chapterId,
                            title: source.sectionTitle ?? 'Video Transcript',
                            wordCount: result.wordCount,
                            duration: source.duration,
                        },
                    });
                }
            }
        }
        // Calculate aggregated analysis if we have transcripts
        let aggregatedAnalysis = null;
        if (contentSources.length > 0) {
            aggregatedAnalysis = await this.contentAnalyzer.analyzeContent(contentSources);
        }
        const videosWithTranscripts = videoResults.filter(r => r.hasTranscript).length;
        const averageWordsPerMinute = totalDuration > 0
            ? Math.round((totalWordCount / totalDuration) * 60)
            : 0;
        // Generate recommendations
        const recommendations = this.generateCourseRecommendations(sources.length, videosWithTranscripts, qualityDistribution, aggregatedAnalysis);
        return {
            courseId,
            totalVideos: sources.length,
            videosWithTranscripts,
            videosAnalyzed: analyzedCount,
            videosMissingTranscripts: sources.length - videosWithTranscripts,
            totalWordCount,
            totalDuration,
            averageWordsPerMinute,
            aggregatedAnalysis,
            averageConfidence: analyzedCount > 0 ? Math.round(totalConfidence / analyzedCount) : 0,
            videoResults,
            transcriptCoveragePercent: sources.length > 0
                ? Math.round((videosWithTranscripts / sources.length) * 100)
                : 0,
            qualityDistribution,
            recommendations,
        };
    }
    /**
     * Analyze a single video transcript
     */
    async analyzeTranscript(source) {
        // Try to get transcript
        const extractionResult = await this.getTranscript(source);
        if (!extractionResult.success || !extractionResult.transcript) {
            return {
                sectionId: source.sectionId,
                chapterId: source.chapterId,
                sectionTitle: source.sectionTitle,
                chapterTitle: source.chapterTitle,
                hasTranscript: false,
                transcriptSource: 'custom',
                transcriptQuality: null,
                wordCount: 0,
                duration: source.duration,
                contentAnalysis: null,
                confidence: 0,
                error: extractionResult.error ?? 'Transcript not available',
            };
        }
        // Assess transcript quality
        const transcriptQuality = this.assessTranscriptQuality(extractionResult.transcript, extractionResult.language);
        // Skip analysis if quality is too poor
        if (transcriptQuality.qualityRating === 'poor') {
            return {
                sectionId: source.sectionId,
                chapterId: source.chapterId,
                sectionTitle: source.sectionTitle,
                chapterTitle: source.chapterTitle,
                hasTranscript: true,
                transcriptSource: extractionResult.source,
                transcriptQuality,
                wordCount: transcriptQuality.wordCount,
                duration: source.duration,
                wordsPerMinute: source.duration
                    ? Math.round((transcriptQuality.wordCount / source.duration) * 60)
                    : undefined,
                contentAnalysis: null,
                confidence: 0,
                error: 'Transcript quality too low for reliable analysis',
            };
        }
        // Perform deep content analysis
        const contentSource = {
            type: 'video_transcript',
            content: extractionResult.transcript,
            metadata: {
                sourceId: source.sectionId,
                sectionId: source.sectionId,
                chapterId: source.chapterId,
                title: source.sectionTitle ?? 'Video Transcript',
                wordCount: transcriptQuality.wordCount,
                duration: source.duration,
            },
        };
        const contentAnalysis = await this.contentAnalyzer.analyzeSingleSource(contentSource);
        return {
            sectionId: source.sectionId,
            chapterId: source.chapterId,
            sectionTitle: source.sectionTitle,
            chapterTitle: source.chapterTitle,
            hasTranscript: true,
            transcriptSource: extractionResult.source,
            transcriptQuality,
            wordCount: transcriptQuality.wordCount,
            duration: source.duration,
            wordsPerMinute: source.duration
                ? Math.round((transcriptQuality.wordCount / source.duration) * 60)
                : undefined,
            contentAnalysis,
            confidence: contentAnalysis.overallConfidence,
        };
    }
    /**
     * Get transcript from various sources
     */
    async getTranscript(source) {
        // If transcript is already provided
        if (source.transcript && source.transcript.length >= this.MIN_TRANSCRIPT_LENGTH) {
            return {
                success: true,
                transcript: source.transcript,
                source: 'provided',
                language: source.language ?? 'en',
                wordCount: source.transcript.split(/\s+/).length,
                confidence: 100,
            };
        }
        // Try to detect video platform and extract
        const platform = this.detectVideoPlatform(source.videoUrl);
        switch (platform) {
            case 'youtube':
                return this.extractYouTubeTranscript(source.videoUrl);
            case 'vimeo':
                return this.extractVimeoTranscript(source.videoUrl);
            case 'mux':
                return this.extractMuxTranscript(source.videoUrl);
            default:
                // No transcript available
                return {
                    success: false,
                    transcript: null,
                    source: 'custom',
                    language: 'en',
                    wordCount: 0,
                    confidence: 0,
                    error: 'Transcript extraction not available for this video platform',
                };
        }
    }
    /**
     * Detect video platform from URL
     */
    detectVideoPlatform(url) {
        if (!url)
            return 'custom';
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
            return 'youtube';
        }
        if (lowerUrl.includes('vimeo.com')) {
            return 'vimeo';
        }
        if (lowerUrl.includes('mux.com') || lowerUrl.includes('stream.mux.com')) {
            return 'mux';
        }
        if (lowerUrl.includes('cloudflarestream') || lowerUrl.includes('videodelivery.net')) {
            return 'cloudflare';
        }
        return 'custom';
    }
    /**
     * Extract YouTube transcript
     * Note: Requires YouTube Data API integration
     */
    async extractYouTubeTranscript(url) {
        // TODO: Implement YouTube transcript extraction
        // This would require:
        // 1. Extract video ID from URL
        // 2. Call YouTube Data API for captions
        // 3. Parse and return transcript
        // For now, return not available
        return {
            success: false,
            transcript: null,
            source: 'youtube',
            language: 'en',
            wordCount: 0,
            confidence: 0,
            error: 'YouTube transcript extraction not yet implemented. Provide transcript directly.',
        };
    }
    /**
     * Extract Vimeo transcript
     * Note: Requires Vimeo API integration
     */
    async extractVimeoTranscript(url) {
        // TODO: Implement Vimeo transcript extraction
        return {
            success: false,
            transcript: null,
            source: 'vimeo',
            language: 'en',
            wordCount: 0,
            confidence: 0,
            error: 'Vimeo transcript extraction not yet implemented. Provide transcript directly.',
        };
    }
    /**
     * Extract Mux transcript
     * Note: Mux provides auto-generated captions
     */
    async extractMuxTranscript(url) {
        // TODO: Implement Mux transcript extraction
        return {
            success: false,
            transcript: null,
            source: 'mux',
            language: 'en',
            wordCount: 0,
            confidence: 0,
            error: 'Mux transcript extraction not yet implemented. Provide transcript directly.',
        };
    }
    /**
     * Assess transcript quality
     */
    assessTranscriptQuality(transcript, language = 'en') {
        const words = transcript.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        // Split into sentences
        const sentences = transcript
            .split(/[.!?]+/)
            .filter(s => s.trim().length > 0);
        const sentenceCount = Math.max(sentences.length, 1);
        const averageSentenceLength = wordCount / sentenceCount;
        // Calculate vocabulary richness (type-token ratio)
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0;
        // Simplified readability score (Flesch-Kincaid approximation)
        // Lower is easier to read
        const avgSyllables = this.estimateAverageSyllables(words);
        const readabilityScore = Math.max(0, 0.39 * averageSentenceLength + 11.8 * avgSyllables - 15.59);
        // Check for timestamps (common in transcripts)
        const hasTimestamps = /\d{1,2}:\d{2}/.test(transcript);
        // Determine quality rating
        let qualityRating;
        if (wordCount < 50) {
            qualityRating = 'poor';
        }
        else if (wordCount < 200 || vocabularyRichness < 0.3) {
            qualityRating = 'acceptable';
        }
        else if (wordCount >= 500 && vocabularyRichness >= 0.4 && averageSentenceLength >= 8) {
            qualityRating = 'excellent';
        }
        else {
            qualityRating = 'good';
        }
        return {
            wordCount,
            averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
            vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
            readabilityScore: Math.round(readabilityScore * 10) / 10,
            hasTimestamps,
            language,
            qualityRating,
        };
    }
    /**
     * Estimate average syllables per word
     */
    estimateAverageSyllables(words) {
        if (words.length === 0)
            return 1;
        let totalSyllables = 0;
        for (const word of words) {
            totalSyllables += this.countSyllables(word);
        }
        return totalSyllables / words.length;
    }
    /**
     * Count syllables in a word (English approximation)
     */
    countSyllables(word) {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length <= 3)
            return 1;
        // Count vowel groups
        const vowelGroups = cleanWord.match(/[aeiouy]+/g);
        let count = vowelGroups ? vowelGroups.length : 1;
        // Subtract silent e
        if (cleanWord.endsWith('e')) {
            count = Math.max(1, count - 1);
        }
        // Add for -le endings
        if (cleanWord.match(/[^aeiou]le$/)) {
            count++;
        }
        return Math.max(1, count);
    }
    /**
     * Generate recommendations for course transcript coverage
     */
    generateCourseRecommendations(totalVideos, videosWithTranscripts, qualityDistribution, analysis) {
        const recommendations = [];
        // Coverage recommendations
        const coveragePercent = totalVideos > 0
            ? Math.round((videosWithTranscripts / totalVideos) * 100)
            : 0;
        if (coveragePercent < 50) {
            recommendations.push(`[Critical] Only ${coveragePercent}% of videos have transcripts. Add transcripts to improve accessibility and enable cognitive analysis.`);
        }
        else if (coveragePercent < 80) {
            recommendations.push(`[Important] ${100 - coveragePercent}% of videos are missing transcripts. Consider adding them for complete coverage.`);
        }
        // Quality recommendations
        const poorCount = qualityDistribution.poor;
        const acceptableCount = qualityDistribution.acceptable;
        if (poorCount > 0) {
            recommendations.push(`${poorCount} video(s) have poor quality transcripts. Review and improve these transcripts.`);
        }
        if (acceptableCount > 2) {
            recommendations.push(`${acceptableCount} transcripts are only acceptable quality. Consider improving vocabulary and sentence structure.`);
        }
        // Cognitive analysis recommendations
        if (analysis) {
            const { bloomsDistribution } = analysis;
            const lowerOrder = bloomsDistribution.REMEMBER + bloomsDistribution.UNDERSTAND;
            if (lowerOrder > 60) {
                recommendations.push('Video content is heavily focused on recall and understanding. Add more application and analysis examples.');
            }
            if (bloomsDistribution.CREATE < 5 && bloomsDistribution.EVALUATE < 10) {
                recommendations.push('Video content lacks higher-order thinking prompts. Include evaluation questions and creative challenges.');
            }
        }
        // Accessibility recommendation
        if (videosWithTranscripts < totalVideos) {
            recommendations.push('Add transcripts to all videos for accessibility compliance (WCAG 2.1) and improved SEO.');
        }
        return recommendations.slice(0, 8);
    }
    /**
     * Get summary statistics for transcript analysis
     */
    getSummary(result) {
        const { transcriptCoveragePercent, qualityDistribution, averageConfidence } = result;
        // Determine status
        let status;
        if (transcriptCoveragePercent >= 90)
            status = 'complete';
        else if (transcriptCoveragePercent >= 50)
            status = 'partial';
        else if (transcriptCoveragePercent > 0)
            status = 'minimal';
        else
            status = 'none';
        // Determine grade
        let coverageGrade;
        const qualityScore = (qualityDistribution.excellent * 4 +
            qualityDistribution.good * 3 +
            qualityDistribution.acceptable * 2 +
            qualityDistribution.poor * 1) /
            Math.max(result.videosWithTranscripts, 1);
        const combinedScore = (transcriptCoveragePercent * 0.6 + qualityScore * 10 * 0.4);
        if (combinedScore >= 85)
            coverageGrade = 'A';
        else if (combinedScore >= 70)
            coverageGrade = 'B';
        else if (combinedScore >= 55)
            coverageGrade = 'C';
        else if (combinedScore >= 40)
            coverageGrade = 'D';
        else
            coverageGrade = 'F';
        // Key metrics
        const keyMetrics = {
            'Total Videos': result.totalVideos,
            'With Transcripts': result.videosWithTranscripts,
            'Coverage': `${transcriptCoveragePercent}%`,
            'Total Words': result.totalWordCount.toLocaleString(),
            'Avg Confidence': `${averageConfidence}%`,
        };
        if (result.totalDuration > 0) {
            const minutes = Math.round(result.totalDuration / 60);
            keyMetrics['Total Duration'] = `${minutes} min`;
            keyMetrics['Words/Min'] = result.averageWordsPerMinute;
        }
        // Priority action items
        const actionItems = result.recommendations.slice(0, 3);
        return {
            status,
            coverageGrade,
            keyMetrics,
            actionItems,
        };
    }
}
// Export singleton instance
export const transcriptAnalyzer = new TranscriptAnalyzer();
