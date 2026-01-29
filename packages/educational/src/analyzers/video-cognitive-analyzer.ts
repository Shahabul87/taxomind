/**
 * Video Cognitive Analyzer
 *
 * Phase 4: Multimedia Content Analysis
 * - Fetches and processes video transcripts (YouTube, etc.)
 * - Chunks content into analyzable segments
 * - Identifies cognitive transitions and pause points
 * - Provides Bloom's level distribution across video timeline
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { BloomsDistribution } from '../types/blooms.types';

// ============================================================================
// TYPES
// ============================================================================

export type VideoSource = 'youtube' | 'vimeo' | 'custom';

export interface VideoMetadata {
  /**
   * Video identifier
   */
  id: string;

  /**
   * Video source platform
   */
  source: VideoSource;

  /**
   * Video title
   */
  title?: string;

  /**
   * Video duration in seconds
   */
  durationSeconds?: number;

  /**
   * Video URL
   */
  url?: string;

  /**
   * Channel/author name
   */
  author?: string;

  /**
   * Publication date
   */
  publishedAt?: Date;
}

export interface TranscriptSegment {
  /**
   * Segment text content
   */
  text: string;

  /**
   * Start time in seconds
   */
  startTime: number;

  /**
   * End time in seconds
   */
  endTime: number;

  /**
   * Duration in seconds
   */
  duration: number;
}

export interface TranscriptChunk {
  /**
   * Combined text from multiple segments
   */
  text: string;

  /**
   * Start time of first segment
   */
  startTime: number;

  /**
   * End time of last segment
   */
  endTime: number;

  /**
   * Total duration
   */
  duration: number;

  /**
   * Number of segments in this chunk
   */
  segmentCount: number;

  /**
   * Chunk index in the video
   */
  index: number;
}

export interface ChunkAnalysis {
  /**
   * Chunk data
   */
  chunk: TranscriptChunk;

  /**
   * Dominant Bloom's level for this chunk
   */
  dominantLevel: BloomsLevel;

  /**
   * Distribution across Bloom's levels
   */
  distribution: BloomsDistribution;

  /**
   * Confidence in the classification
   */
  confidence: number;

  /**
   * Cognitive depth score (0-100)
   */
  cognitiveDepth: number;

  /**
   * Key topics/concepts in this chunk
   */
  keyTopics?: string[];

  /**
   * Sub-level if available
   */
  subLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface CognitiveTransition {
  /**
   * Time in seconds where transition occurs
   */
  timestamp: number;

  /**
   * Level before transition
   */
  fromLevel: BloomsLevel;

  /**
   * Level after transition
   */
  toLevel: BloomsLevel;

  /**
   * Direction of cognitive shift
   */
  direction: 'up' | 'down' | 'same';

  /**
   * Magnitude of shift (1-5)
   */
  magnitude: number;

  /**
   * Suggested action at this point
   */
  suggestedAction?: 'pause' | 'review' | 'reflect' | 'practice' | 'continue';
}

export interface PausePoint {
  /**
   * Time in seconds for the pause
   */
  timestamp: number;

  /**
   * Reason for suggesting a pause
   */
  reason: 'cognitive_shift' | 'complexity_spike' | 'concept_boundary' | 'practice_opportunity';

  /**
   * Priority of the pause
   */
  priority: 'high' | 'medium' | 'low';

  /**
   * Suggested activity during pause
   */
  suggestedActivity?: string;

  /**
   * Duration of suggested pause in seconds
   */
  suggestedDuration?: number;
}

export interface VideoAnalysisResult {
  /**
   * Video metadata
   */
  metadata: VideoMetadata;

  /**
   * Overall Bloom's distribution
   */
  overallDistribution: BloomsDistribution;

  /**
   * Dominant Bloom's level for the video
   */
  dominantLevel: BloomsLevel;

  /**
   * Overall cognitive depth
   */
  cognitiveDepth: number;

  /**
   * Balance assessment
   */
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';

  /**
   * Per-chunk analysis
   */
  chunkAnalyses: ChunkAnalysis[];

  /**
   * Cognitive transitions detected
   */
  transitions: CognitiveTransition[];

  /**
   * Suggested pause points
   */
  pausePoints: PausePoint[];

  /**
   * Timeline distribution (Bloom's level at each minute)
   */
  timeline: Array<{
    minute: number;
    level: BloomsLevel;
    depth: number;
  }>;

  /**
   * Key concepts across the video
   */
  keyConcepts: string[];

  /**
   * Recommendations for the video
   */
  recommendations: string[];

  /**
   * Processing metadata
   */
  processingMetadata: {
    totalChunks: number;
    transcriptLength: number;
    processingTimeMs: number;
    analysisMethod: 'keyword' | 'ai' | 'hybrid';
  };
}

export interface VideoAnalyzerConfig {
  /**
   * Target chunk duration in seconds
   * @default 120 (2 minutes)
   */
  chunkDurationSeconds?: number;

  /**
   * Minimum chunk duration in seconds
   * @default 30
   */
  minChunkDurationSeconds?: number;

  /**
   * YouTube API key for fetching transcripts
   */
  youtubeApiKey?: string;

  /**
   * Confidence threshold for cognitive transition detection
   * @default 0.6
   */
  transitionConfidenceThreshold?: number;

  /**
   * Minimum level difference to flag as significant transition
   * @default 2
   */
  significantTransitionThreshold?: number;

  /**
   * Enable sub-level analysis
   * @default true
   */
  includeSubLevel?: boolean;

  /**
   * Logger for debugging
   */
  logger?: {
    debug?: (message: string, ...args: unknown[]) => void;
    warn?: (message: string, ...args: unknown[]) => void;
    error?: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Transcript fetcher interface for different video sources
 */
export interface TranscriptFetcher {
  /**
   * Fetch transcript for a video
   */
  fetchTranscript(videoId: string): Promise<TranscriptSegment[]>;

  /**
   * Fetch video metadata
   */
  fetchMetadata(videoId: string): Promise<VideoMetadata>;

  /**
   * Check if video has captions available
   */
  hasCaptions(videoId: string): Promise<boolean>;
}

/**
 * Content analyzer interface (dependency injection for Bloom's analysis)
 */
export interface ContentAnalyzer {
  /**
   * Analyze content and return Bloom's classification
   */
  analyze(content: string, options?: { includeSubLevel?: boolean }): Promise<{
    dominantLevel: BloomsLevel;
    distribution: BloomsDistribution;
    confidence: number;
    cognitiveDepth: number;
    subLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  }>;
}

// ============================================================================
// BLOOM'S LEVEL UTILITIES
// ============================================================================

const BLOOMS_LEVEL_ORDER: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

function getLevelIndex(level: BloomsLevel): number {
  return BLOOMS_LEVEL_ORDER.indexOf(level);
}

function getLevelDifference(from: BloomsLevel, to: BloomsLevel): number {
  return getLevelIndex(to) - getLevelIndex(from);
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class VideoCognitiveAnalyzer {
  private readonly config: Required<Omit<VideoAnalyzerConfig, 'youtubeApiKey' | 'logger'>> & {
    youtubeApiKey?: string;
    logger?: VideoAnalyzerConfig['logger'];
  };
  private readonly transcriptFetcher?: TranscriptFetcher;
  private readonly contentAnalyzer: ContentAnalyzer;

  constructor(
    contentAnalyzer: ContentAnalyzer,
    config: VideoAnalyzerConfig = {},
    transcriptFetcher?: TranscriptFetcher
  ) {
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
  async analyzeVideo(
    videoIdOrUrl: string,
    source: VideoSource = 'youtube'
  ): Promise<VideoAnalysisResult> {
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
  async analyzeTranscript(
    segments: TranscriptSegment[],
    metadata: VideoMetadata,
    startTime: number = Date.now()
  ): Promise<VideoAnalysisResult> {
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
    const recommendations = this.generateRecommendations(
      overallDistribution,
      dominantLevel,
      transitions,
      cognitiveDepth
    );

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
  private extractVideoId(videoIdOrUrl: string, source: VideoSource): string {
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
  private chunkTranscript(segments: TranscriptSegment[]): TranscriptChunk[] {
    const chunks: TranscriptChunk[] = [];
    let currentChunk: TranscriptSegment[] = [];
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
      if (
        currentDuration < this.config.minChunkDurationSeconds &&
        chunks.length > 0
      ) {
        const lastChunk = chunks[chunks.length - 1];
        const mergedText = lastChunk.text + ' ' + currentChunk.map((s) => s.text).join(' ');
        chunks[chunks.length - 1] = {
          ...lastChunk,
          text: mergedText,
          endTime: currentChunk[currentChunk.length - 1].endTime,
          duration: currentChunk[currentChunk.length - 1].endTime - lastChunk.startTime,
          segmentCount: lastChunk.segmentCount + currentChunk.length,
        };
      } else {
        chunks.push(this.createChunk(currentChunk, chunkIndex));
      }
    }

    return chunks;
  }

  /**
   * Create a chunk from segments
   */
  private createChunk(segments: TranscriptSegment[], index: number): TranscriptChunk {
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
  private async analyzeChunks(chunks: TranscriptChunk[]): Promise<ChunkAnalysis[]> {
    const analyses: ChunkAnalysis[] = [];

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
      } catch (error) {
        this.config.logger?.warn?.(
          `[VideoCognitiveAnalyzer] Failed to analyze chunk ${chunk.index}`,
          error
        );

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
  private calculateOverallDistribution(
    chunkAnalyses: ChunkAnalysis[]
  ): BloomsDistribution {
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

    const totals: BloomsDistribution = {
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
  private findDominantLevel(distribution: BloomsDistribution): BloomsLevel {
    let maxLevel: BloomsLevel = 'REMEMBER';
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
  private calculateOverallCognitiveDepth(chunkAnalyses: ChunkAnalysis[]): number {
    if (chunkAnalyses.length === 0) return 0;

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
  private detectTransitions(chunkAnalyses: ChunkAnalysis[]): CognitiveTransition[] {
    const transitions: CognitiveTransition[] = [];

    for (let i = 1; i < chunkAnalyses.length; i++) {
      const prev = chunkAnalyses[i - 1];
      const curr = chunkAnalyses[i];

      // Only consider transitions where both chunks have good confidence
      if (
        prev.confidence < this.config.transitionConfidenceThreshold ||
        curr.confidence < this.config.transitionConfidenceThreshold
      ) {
        continue;
      }

      const levelDiff = getLevelDifference(prev.dominantLevel, curr.dominantLevel);

      if (Math.abs(levelDiff) >= 1) {
        const magnitude = Math.abs(levelDiff);
        let suggestedAction: CognitiveTransition['suggestedAction'];

        if (levelDiff > 0) {
          // Moving to higher cognitive level
          suggestedAction = magnitude >= 2 ? 'pause' : 'continue';
        } else {
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
  private identifyPausePoints(
    chunkAnalyses: ChunkAnalysis[],
    transitions: CognitiveTransition[]
  ): PausePoint[] {
    const pausePoints: PausePoint[] = [];

    // Add pause points for significant transitions
    for (const transition of transitions) {
      if (transition.magnitude >= this.config.significantTransitionThreshold) {
        pausePoints.push({
          timestamp: transition.timestamp,
          reason: 'cognitive_shift',
          priority: transition.magnitude >= 3 ? 'high' : 'medium',
          suggestedActivity:
            transition.direction === 'up'
              ? 'Take a moment to reflect on the previous concepts before moving to more complex material.'
              : 'Good opportunity to practice what you just learned.',
          suggestedDuration: transition.magnitude * 30,
        });
      }
    }

    // Add pause points for complexity spikes
    const avgDepth =
      chunkAnalyses.reduce((sum, a) => sum + a.cognitiveDepth, 0) / chunkAnalyses.length;

    for (const analysis of chunkAnalyses) {
      if (analysis.cognitiveDepth > avgDepth * 1.5 && analysis.confidence > 0.6) {
        // Check if we already have a pause point nearby
        const hasNearbyPause = pausePoints.some(
          (p) => Math.abs(p.timestamp - analysis.chunk.startTime) < 60
        );

        if (!hasNearbyPause) {
          pausePoints.push({
            timestamp: analysis.chunk.startTime,
            reason: 'complexity_spike',
            priority: 'medium',
            suggestedActivity:
              'This section covers complex material. Consider pausing to take notes.',
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
  private buildTimeline(
    chunkAnalyses: ChunkAnalysis[]
  ): Array<{ minute: number; level: BloomsLevel; depth: number }> {
    if (chunkAnalyses.length === 0) return [];

    const timeline: Array<{ minute: number; level: BloomsLevel; depth: number }> = [];
    const lastChunk = chunkAnalyses[chunkAnalyses.length - 1];
    const totalMinutes = Math.ceil(lastChunk.chunk.endTime / 60);

    for (let minute = 0; minute < totalMinutes; minute++) {
      const timeInSeconds = minute * 60;

      // Find the chunk that covers this minute
      const chunk = chunkAnalyses.find(
        (a) =>
          timeInSeconds >= a.chunk.startTime && timeInSeconds < a.chunk.endTime
      );

      if (chunk) {
        timeline.push({
          minute,
          level: chunk.dominantLevel,
          depth: chunk.cognitiveDepth,
        });
      } else if (timeline.length > 0) {
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
  private extractKeyConcepts(chunkAnalyses: ChunkAnalysis[]): string[] {
    const concepts: string[] = [];

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
  private generateRecommendations(
    distribution: BloomsDistribution,
    dominantLevel: BloomsLevel,
    transitions: CognitiveTransition[],
    cognitiveDepth: number
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations based on dominant level
    if (dominantLevel === 'REMEMBER' || dominantLevel === 'UNDERSTAND') {
      recommendations.push(
        'This video focuses on foundational concepts. Consider supplementing with practice exercises to move to higher cognitive levels.'
      );
    } else if (dominantLevel === 'CREATE' || dominantLevel === 'EVALUATE') {
      recommendations.push(
        'This video covers advanced cognitive activities. Ensure you have a solid foundation in the prerequisites.'
      );
    }

    // Recommendations based on transitions
    const upTransitions = transitions.filter((t) => t.direction === 'up').length;
    const downTransitions = transitions.filter((t) => t.direction === 'down').length;

    if (upTransitions > downTransitions * 2) {
      recommendations.push(
        'This video progressively increases in complexity. Take breaks at suggested pause points to consolidate learning.'
      );
    } else if (downTransitions > upTransitions * 2) {
      recommendations.push(
        'This video alternates between complex and simpler material. Use the simpler sections to reinforce understanding.'
      );
    }

    // Recommendations based on cognitive depth
    if (cognitiveDepth > 70) {
      recommendations.push(
        'High cognitive demand detected. Consider watching in multiple sessions for better retention.'
      );
    } else if (cognitiveDepth < 30) {
      recommendations.push(
        'Low cognitive demand. This video may be suitable for quick review or introduction to the topic.'
      );
    }

    // Balance recommendations
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const higherLevels = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

    if (lowerLevels > 70) {
      recommendations.push(
        'Most content focuses on lower-order thinking. Supplement with analysis and application exercises.'
      );
    } else if (higherLevels > 70) {
      recommendations.push(
        'Most content focuses on higher-order thinking. Ensure prerequisite knowledge is solid.'
      );
    }

    return recommendations;
  }

  /**
   * Assess balance of Bloom's distribution
   */
  private assessBalance(
    distribution: BloomsDistribution
  ): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND + distribution.APPLY;
    const higherLevels = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

    if (Math.abs(lowerLevels - higherLevels) < 20) {
      return 'well-balanced';
    } else if (lowerLevels > higherLevels) {
      return 'bottom-heavy';
    } else {
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
export function createVideoCognitiveAnalyzer(
  contentAnalyzer: ContentAnalyzer,
  config?: VideoAnalyzerConfig,
  transcriptFetcher?: TranscriptFetcher
): VideoCognitiveAnalyzer {
  return new VideoCognitiveAnalyzer(contentAnalyzer, config, transcriptFetcher);
}
