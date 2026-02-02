/**
 * Video Cognitive Analyzer
 *
 * Phase 4: Multimedia Content Analysis
 * - Fetches and processes video transcripts (YouTube, etc.)
 * - Chunks content into analyzable segments
 * - Identifies cognitive transitions and pause points
 * - Provides Bloom's level distribution across video timeline
 */
// ============================================================================
// BLOOM'S LEVEL UTILITIES
// ============================================================================
const BLOOMS_LEVEL_ORDER = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
];
function getLevelIndex(level) {
    return BLOOMS_LEVEL_ORDER.indexOf(level);
}
function getLevelDifference(from, to) {
    return getLevelIndex(to) - getLevelIndex(from);
}
// ============================================================================
// IMPLEMENTATION
// ============================================================================
export class VideoCognitiveAnalyzer {
    config;
    transcriptFetcher;
    contentAnalyzer;
    constructor(contentAnalyzer, config = {}, transcriptFetcher) {
        this.contentAnalyzer = contentAnalyzer;
        this.transcriptFetcher = transcriptFetcher;
        this.config = {
            chunkDurationSeconds: config.chunkDurationSeconds ?? 120,
            minChunkDurationSeconds: config.minChunkDurationSeconds ?? 30,
            transitionConfidenceThreshold: config.transitionConfidenceThreshold ?? 0.6,
            significantTransitionThreshold: config.significantTransitionThreshold ?? 2,
            includeSubLevel: config.includeSubLevel ?? true,
            youtubeApiKey: config.youtubeApiKey,
            logger: config.logger,
        };
    }
    /**
     * Analyze a video from a URL or video ID
     */
    async analyzeVideo(videoIdOrUrl, source = 'youtube') {
        const startTime = Date.now();
        // Extract video ID from URL if needed
        const videoId = this.extractVideoId(videoIdOrUrl, source);
        // Fetch transcript and metadata
        if (!this.transcriptFetcher) {
            throw new Error('TranscriptFetcher is required to analyze videos');
        }
        const [transcript, metadata] = await Promise.all([
            this.transcriptFetcher.fetchTranscript(videoId),
            this.transcriptFetcher.fetchMetadata(videoId),
        ]);
        return this.analyzeTranscript(transcript, metadata, startTime);
    }
    /**
     * Analyze a pre-fetched transcript
     */
    async analyzeTranscript(segments, metadata, startTime = Date.now()) {
        // Chunk the transcript
        const chunks = this.chunkTranscript(segments);
        // Analyze each chunk
        const chunkAnalyses = await this.analyzeChunks(chunks);
        // Calculate overall distribution
        const overallDistribution = this.calculateOverallDistribution(chunkAnalyses);
        // Find dominant level
        const dominantLevel = this.findDominantLevel(overallDistribution);
        // Calculate cognitive depth
        const cognitiveDepth = this.calculateOverallCognitiveDepth(chunkAnalyses);
        // Detect cognitive transitions
        const transitions = this.detectTransitions(chunkAnalyses);
        // Identify pause points
        const pausePoints = this.identifyPausePoints(chunkAnalyses, transitions);
        // Build timeline
        const timeline = this.buildTimeline(chunkAnalyses);
        // Extract key concepts
        const keyConcepts = this.extractKeyConcepts(chunkAnalyses);
        // Generate recommendations
        const recommendations = this.generateRecommendations(overallDistribution, dominantLevel, transitions, cognitiveDepth);
        // Determine balance
        const balance = this.assessBalance(overallDistribution);
        return {
            metadata,
            overallDistribution,
            dominantLevel,
            cognitiveDepth,
            balance,
            chunkAnalyses,
            transitions,
            pausePoints,
            timeline,
            keyConcepts,
            recommendations,
            processingMetadata: {
                totalChunks: chunks.length,
                transcriptLength: segments.reduce((sum, s) => sum + s.text.length, 0),
                processingTimeMs: Date.now() - startTime,
                analysisMethod: 'hybrid',
            },
        };
    }
    /**
     * Extract video ID from URL
     */
    extractVideoId(videoIdOrUrl, source) {
        if (source === 'youtube') {
            // Handle various YouTube URL formats
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
                /^([a-zA-Z0-9_-]{11})$/,
            ];
            for (const pattern of patterns) {
                const match = videoIdOrUrl.match(pattern);
                if (match) {
                    return match[1];
                }
            }
        }
        // If no pattern matches, assume it's already a video ID
        return videoIdOrUrl;
    }
    /**
     * Chunk transcript into analyzable segments
     */
    chunkTranscript(segments) {
        const chunks = [];
        let currentChunk = [];
        let currentDuration = 0;
        let chunkIndex = 0;
        for (const segment of segments) {
            currentChunk.push(segment);
            currentDuration += segment.duration;
            // Check if we should close this chunk
            if (currentDuration >= this.config.chunkDurationSeconds) {
                chunks.push(this.createChunk(currentChunk, chunkIndex));
                chunkIndex++;
                currentChunk = [];
                currentDuration = 0;
            }
        }
        // Handle remaining segments
        if (currentChunk.length > 0) {
            // If the remaining chunk is too short, merge with previous
            if (currentDuration < this.config.minChunkDurationSeconds &&
                chunks.length > 0) {
                const lastChunk = chunks[chunks.length - 1];
                const mergedText = lastChunk.text + ' ' + currentChunk.map((s) => s.text).join(' ');
                chunks[chunks.length - 1] = {
                    ...lastChunk,
                    text: mergedText,
                    endTime: currentChunk[currentChunk.length - 1].endTime,
                    duration: currentChunk[currentChunk.length - 1].endTime - lastChunk.startTime,
                    segmentCount: lastChunk.segmentCount + currentChunk.length,
                };
            }
            else {
                chunks.push(this.createChunk(currentChunk, chunkIndex));
            }
        }
        return chunks;
    }
    /**
     * Create a chunk from segments
     */
    createChunk(segments, index) {
        const text = segments.map((s) => s.text).join(' ');
        const startTime = segments[0].startTime;
        const endTime = segments[segments.length - 1].endTime;
        return {
            text,
            startTime,
            endTime,
            duration: endTime - startTime,
            segmentCount: segments.length,
            index,
        };
    }
    /**
     * Analyze all chunks
     */
    async analyzeChunks(chunks) {
        const analyses = [];
        for (const chunk of chunks) {
            try {
                const result = await this.contentAnalyzer.analyze(chunk.text, {
                    includeSubLevel: this.config.includeSubLevel,
                });
                analyses.push({
                    chunk,
                    dominantLevel: result.dominantLevel,
                    distribution: result.distribution,
                    confidence: result.confidence,
                    cognitiveDepth: result.cognitiveDepth,
                    subLevel: result.subLevel,
                });
            }
            catch (error) {
                this.config.logger?.warn?.(`[VideoCognitiveAnalyzer] Failed to analyze chunk ${chunk.index}`, error);
                // Add a fallback analysis
                analyses.push({
                    chunk,
                    dominantLevel: 'UNDERSTAND',
                    distribution: {
                        REMEMBER: 20,
                        UNDERSTAND: 40,
                        APPLY: 20,
                        ANALYZE: 10,
                        EVALUATE: 5,
                        CREATE: 5,
                    },
                    confidence: 0.3,
                    cognitiveDepth: 35,
                });
            }
        }
        return analyses;
    }
    /**
     * Calculate overall distribution from chunk analyses
     */
    calculateOverallDistribution(chunkAnalyses) {
        if (chunkAnalyses.length === 0) {
            return {
                REMEMBER: 16.67,
                UNDERSTAND: 16.67,
                APPLY: 16.67,
                ANALYZE: 16.67,
                EVALUATE: 16.66,
                CREATE: 16.66,
            };
        }
        const totals = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        // Weight by chunk duration and confidence
        let totalWeight = 0;
        for (const analysis of chunkAnalyses) {
            const weight = analysis.chunk.duration * analysis.confidence;
            totalWeight += weight;
            for (const level of BLOOMS_LEVEL_ORDER) {
                totals[level] += (analysis.distribution[level] || 0) * weight;
            }
        }
        // Normalize
        if (totalWeight > 0) {
            for (const level of BLOOMS_LEVEL_ORDER) {
                totals[level] = totals[level] / totalWeight;
            }
        }
        return totals;
    }
    /**
     * Find dominant level from distribution
     */
    findDominantLevel(distribution) {
        let maxLevel = 'REMEMBER';
        let maxValue = 0;
        for (const level of BLOOMS_LEVEL_ORDER) {
            if (distribution[level] > maxValue) {
                maxValue = distribution[level];
                maxLevel = level;
            }
        }
        return maxLevel;
    }
    /**
     * Calculate overall cognitive depth
     */
    calculateOverallCognitiveDepth(chunkAnalyses) {
        if (chunkAnalyses.length === 0)
            return 0;
        let weightedSum = 0;
        let totalWeight = 0;
        for (const analysis of chunkAnalyses) {
            const weight = analysis.chunk.duration * analysis.confidence;
            weightedSum += analysis.cognitiveDepth * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    /**
     * Detect cognitive transitions between chunks
     */
    detectTransitions(chunkAnalyses) {
        const transitions = [];
        for (let i = 1; i < chunkAnalyses.length; i++) {
            const prev = chunkAnalyses[i - 1];
            const curr = chunkAnalyses[i];
            // Only consider transitions where both chunks have good confidence
            if (prev.confidence < this.config.transitionConfidenceThreshold ||
                curr.confidence < this.config.transitionConfidenceThreshold) {
                continue;
            }
            const levelDiff = getLevelDifference(prev.dominantLevel, curr.dominantLevel);
            if (Math.abs(levelDiff) >= 1) {
                const magnitude = Math.abs(levelDiff);
                let suggestedAction;
                if (levelDiff > 0) {
                    // Moving to higher cognitive level
                    suggestedAction = magnitude >= 2 ? 'pause' : 'continue';
                }
                else {
                    // Moving to lower cognitive level
                    suggestedAction = magnitude >= 2 ? 'review' : 'continue';
                }
                transitions.push({
                    timestamp: curr.chunk.startTime,
                    fromLevel: prev.dominantLevel,
                    toLevel: curr.dominantLevel,
                    direction: levelDiff > 0 ? 'up' : 'down',
                    magnitude,
                    suggestedAction,
                });
            }
        }
        return transitions;
    }
    /**
     * Identify pause points based on transitions and complexity
     */
    identifyPausePoints(chunkAnalyses, transitions) {
        const pausePoints = [];
        // Add pause points for significant transitions
        for (const transition of transitions) {
            if (transition.magnitude >= this.config.significantTransitionThreshold) {
                pausePoints.push({
                    timestamp: transition.timestamp,
                    reason: 'cognitive_shift',
                    priority: transition.magnitude >= 3 ? 'high' : 'medium',
                    suggestedActivity: transition.direction === 'up'
                        ? 'Take a moment to reflect on the previous concepts before moving to more complex material.'
                        : 'Good opportunity to practice what you just learned.',
                    suggestedDuration: transition.magnitude * 30,
                });
            }
        }
        // Add pause points for complexity spikes
        const avgDepth = chunkAnalyses.reduce((sum, a) => sum + a.cognitiveDepth, 0) / chunkAnalyses.length;
        for (const analysis of chunkAnalyses) {
            if (analysis.cognitiveDepth > avgDepth * 1.5 && analysis.confidence > 0.6) {
                // Check if we already have a pause point nearby
                const hasNearbyPause = pausePoints.some((p) => Math.abs(p.timestamp - analysis.chunk.startTime) < 60);
                if (!hasNearbyPause) {
                    pausePoints.push({
                        timestamp: analysis.chunk.startTime,
                        reason: 'complexity_spike',
                        priority: 'medium',
                        suggestedActivity: 'This section covers complex material. Consider pausing to take notes.',
                        suggestedDuration: 60,
                    });
                }
            }
        }
        // Sort by timestamp
        pausePoints.sort((a, b) => a.timestamp - b.timestamp);
        return pausePoints;
    }
    /**
     * Build minute-by-minute timeline
     */
    buildTimeline(chunkAnalyses) {
        if (chunkAnalyses.length === 0)
            return [];
        const timeline = [];
        const lastChunk = chunkAnalyses[chunkAnalyses.length - 1];
        const totalMinutes = Math.ceil(lastChunk.chunk.endTime / 60);
        for (let minute = 0; minute < totalMinutes; minute++) {
            const timeInSeconds = minute * 60;
            // Find the chunk that covers this minute
            const chunk = chunkAnalyses.find((a) => timeInSeconds >= a.chunk.startTime && timeInSeconds < a.chunk.endTime);
            if (chunk) {
                timeline.push({
                    minute,
                    level: chunk.dominantLevel,
                    depth: chunk.cognitiveDepth,
                });
            }
            else if (timeline.length > 0) {
                // Use previous minute's data
                timeline.push({
                    minute,
                    level: timeline[timeline.length - 1].level,
                    depth: timeline[timeline.length - 1].depth,
                });
            }
        }
        return timeline;
    }
    /**
     * Extract key concepts from chunk analyses
     */
    extractKeyConcepts(chunkAnalyses) {
        const concepts = [];
        for (const analysis of chunkAnalyses) {
            if (analysis.keyTopics) {
                concepts.push(...analysis.keyTopics);
            }
        }
        // Remove duplicates
        return Array.from(new Set(concepts));
    }
    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(distribution, dominantLevel, transitions, cognitiveDepth) {
        const recommendations = [];
        // Recommendations based on dominant level
        if (dominantLevel === 'REMEMBER' || dominantLevel === 'UNDERSTAND') {
            recommendations.push('This video focuses on foundational concepts. Consider supplementing with practice exercises to move to higher cognitive levels.');
        }
        else if (dominantLevel === 'CREATE' || dominantLevel === 'EVALUATE') {
            recommendations.push('This video covers advanced cognitive activities. Ensure you have a solid foundation in the prerequisites.');
        }
        // Recommendations based on transitions
        const upTransitions = transitions.filter((t) => t.direction === 'up').length;
        const downTransitions = transitions.filter((t) => t.direction === 'down').length;
        if (upTransitions > downTransitions * 2) {
            recommendations.push('This video progressively increases in complexity. Take breaks at suggested pause points to consolidate learning.');
        }
        else if (downTransitions > upTransitions * 2) {
            recommendations.push('This video alternates between complex and simpler material. Use the simpler sections to reinforce understanding.');
        }
        // Recommendations based on cognitive depth
        if (cognitiveDepth > 70) {
            recommendations.push('High cognitive demand detected. Consider watching in multiple sessions for better retention.');
        }
        else if (cognitiveDepth < 30) {
            recommendations.push('Low cognitive demand. This video may be suitable for quick review or introduction to the topic.');
        }
        // Balance recommendations
        const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
        const higherLevels = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;
        if (lowerLevels > 70) {
            recommendations.push('Most content focuses on lower-order thinking. Supplement with analysis and application exercises.');
        }
        else if (higherLevels > 70) {
            recommendations.push('Most content focuses on higher-order thinking. Ensure prerequisite knowledge is solid.');
        }
        return recommendations;
    }
    /**
     * Assess balance of Bloom's distribution
     */
    assessBalance(distribution) {
        const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND + distribution.APPLY;
        const higherLevels = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;
        if (Math.abs(lowerLevels - higherLevels) < 20) {
            return 'well-balanced';
        }
        else if (lowerLevels > higherLevels) {
            return 'bottom-heavy';
        }
        else {
            return 'top-heavy';
        }
    }
}
// ============================================================================
// FACTORY
// ============================================================================
/**
 * Create a video cognitive analyzer
 */
export function createVideoCognitiveAnalyzer(contentAnalyzer, config, transcriptFetcher) {
    return new VideoCognitiveAnalyzer(contentAnalyzer, config, transcriptFetcher);
}
