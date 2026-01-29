/**
 * Multimedia Bloom's Engine
 *
 * Phase 4: Multimedia Content Analysis
 * - Unified interface for analyzing video and image content
 * - Integrates with the Unified Bloom's Engine for text analysis
 * - Provides comprehensive multimedia educational assessments
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { BloomsDistribution } from '../types/blooms.types';
import type { UnifiedBloomsResult, AnalysisMetadata } from '../types/unified-blooms.types';
import {
  VideoCognitiveAnalyzer,
  createVideoCognitiveAnalyzer,
  type VideoAnalysisResult,
  type VideoAnalyzerConfig,
  type TranscriptFetcher,
  type TranscriptSegment,
  type VideoMetadata,
  type VideoSource,
} from '../analyzers/video-cognitive-analyzer';
import {
  ImageCognitiveAnalyzer,
  createImageCognitiveAnalyzer,
  type ImageAnalysisResult,
  type ImageAnalyzerConfig,
  type VisionProvider,
  type ImageMetadata,
} from '../analyzers/image-cognitive-analyzer';

// ============================================================================
// TYPES
// ============================================================================

export type MultimediaType = 'video' | 'image' | 'mixed';

export interface MultimediaContent {
  /**
   * Type of multimedia content
   */
  type: MultimediaType;

  /**
   * Content identifier
   */
  id: string;

  /**
   * Title of the content
   */
  title?: string;

  /**
   * Video-specific data
   */
  video?: {
    source: VideoSource;
    videoId?: string;
    url?: string;
    transcript?: TranscriptSegment[];
    metadata?: VideoMetadata;
  };

  /**
   * Image-specific data
   */
  image?: {
    data: string | Buffer;
    metadata?: Partial<ImageMetadata>;
  };

  /**
   * Multiple images for mixed content
   */
  images?: Array<{
    data: string | Buffer;
    metadata?: Partial<ImageMetadata>;
  }>;

  /**
   * Additional text context
   */
  textContext?: string;
}

export interface MultimediaAnalysisResult {
  /**
   * Content identifier
   */
  contentId: string;

  /**
   * Content type analyzed
   */
  contentType: MultimediaType;

  /**
   * Overall Bloom's level
   */
  dominantLevel: BloomsLevel;

  /**
   * Overall distribution
   */
  distribution: BloomsDistribution;

  /**
   * Overall cognitive depth (0-100)
   */
  cognitiveDepth: number;

  /**
   * Overall confidence
   */
  confidence: number;

  /**
   * Balance assessment
   */
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';

  /**
   * Video analysis result (if applicable)
   */
  videoAnalysis?: VideoAnalysisResult;

  /**
   * Image analysis results (if applicable)
   */
  imageAnalyses?: ImageAnalysisResult[];

  /**
   * Combined recommendations
   */
  recommendations: string[];

  /**
   * Suggested learning activities
   */
  suggestedActivities: Array<{
    bloomsLevel: BloomsLevel;
    activity: string;
    description: string;
    mediaType: 'video' | 'image' | 'combined';
  }>;

  /**
   * Key cognitive insights
   */
  cognitiveInsights: CognitiveInsight[];

  /**
   * Processing metadata
   */
  metadata: AnalysisMetadata & {
    videoProcessingTimeMs?: number;
    imageProcessingTimeMs?: number;
    imagesAnalyzed?: number;
  };
}

export interface CognitiveInsight {
  /**
   * Type of insight
   */
  type:
    | 'complexity_warning'
    | 'balance_issue'
    | 'progression_opportunity'
    | 'accessibility_concern'
    | 'engagement_suggestion';

  /**
   * Insight description
   */
  description: string;

  /**
   * Severity/importance
   */
  severity: 'info' | 'warning' | 'critical';

  /**
   * Actionable recommendation
   */
  recommendation?: string;
}

export interface MultimediaEngineConfig {
  /**
   * Video analyzer configuration
   */
  videoConfig?: VideoAnalyzerConfig;

  /**
   * Image analyzer configuration
   */
  imageConfig?: ImageAnalyzerConfig;

  /**
   * Transcript fetcher for video analysis
   */
  transcriptFetcher?: TranscriptFetcher;

  /**
   * Vision provider for image analysis
   */
  visionProvider?: VisionProvider;

  /**
   * Enable parallel analysis for mixed content
   * @default true
   */
  enableParallelAnalysis?: boolean;

  /**
   * Maximum images to analyze in parallel
   * @default 5
   */
  maxParallelImages?: number;

  /**
   * Logger for debugging
   */
  logger?: {
    debug?: (message: string, ...args: unknown[]) => void;
    warn?: (message: string, ...args: unknown[]) => void;
    error?: (message: string, ...args: unknown[]) => void;
  };
}

export interface MultimediaAnalysisOptions {
  /**
   * Include detailed video chunk analysis
   * @default true
   */
  includeChunkAnalysis?: boolean;

  /**
   * Include accessibility assessment for images
   * @default true
   */
  includeAccessibility?: boolean;

  /**
   * Include sub-level granularity
   * @default true
   */
  includeSubLevel?: boolean;

  /**
   * Additional text context to consider
   */
  textContext?: string;
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

// ============================================================================
// CONTENT ANALYZER ADAPTER
// ============================================================================

/**
 * Adapter to use UnifiedBloomsEngine as content analyzer for video/image analyzers
 */
interface ContentAnalyzerAdapter {
  analyze(
    content: string,
    options?: { includeSubLevel?: boolean }
  ): Promise<{
    dominantLevel: BloomsLevel;
    distribution: BloomsDistribution;
    confidence: number;
    cognitiveDepth: number;
    subLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  }>;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class MultimediaBloomsEngine {
  private readonly videoAnalyzer: VideoCognitiveAnalyzer;
  private readonly imageAnalyzer: ImageCognitiveAnalyzer;
  private readonly config: Required<
    Omit<MultimediaEngineConfig, 'transcriptFetcher' | 'visionProvider' | 'logger' | 'videoConfig' | 'imageConfig'>
  > & MultimediaEngineConfig;

  constructor(
    contentAnalyzer: ContentAnalyzerAdapter,
    config: MultimediaEngineConfig = {}
  ) {
    // Create video analyzer
    const videoConfig: VideoAnalyzerConfig = {
      ...config.videoConfig,
      logger: config.logger,
    };
    this.videoAnalyzer = createVideoCognitiveAnalyzer(
      contentAnalyzer,
      videoConfig,
      config.transcriptFetcher
    );

    // Create image analyzer
    const imageConfig: ImageAnalyzerConfig = {
      ...config.imageConfig,
      visionProvider: config.visionProvider,
      logger: config.logger,
    };
    this.imageAnalyzer = createImageCognitiveAnalyzer(contentAnalyzer, imageConfig);

    this.config = {
      enableParallelAnalysis: config.enableParallelAnalysis ?? true,
      maxParallelImages: config.maxParallelImages ?? 5,
      ...config,
    };
  }

  /**
   * Analyze multimedia content
   */
  async analyze(
    content: MultimediaContent,
    options: MultimediaAnalysisOptions = {}
  ): Promise<MultimediaAnalysisResult> {
    const startTime = Date.now();

    switch (content.type) {
      case 'video':
        return this.analyzeVideoContent(content, options, startTime);
      case 'image':
        return this.analyzeImageContent(content, options, startTime);
      case 'mixed':
        return this.analyzeMixedContent(content, options, startTime);
      default:
        throw new Error(`Unsupported content type: ${content.type}`);
    }
  }

  /**
   * Analyze video content
   */
  async analyzeVideo(
    videoIdOrUrl: string,
    source: VideoSource = 'youtube',
    options: MultimediaAnalysisOptions = {}
  ): Promise<MultimediaAnalysisResult> {
    const content: MultimediaContent = {
      type: 'video',
      id: videoIdOrUrl,
      video: {
        source,
        videoId: videoIdOrUrl,
      },
    };

    return this.analyze(content, options);
  }

  /**
   * Analyze video with pre-fetched transcript
   */
  async analyzeVideoTranscript(
    transcript: TranscriptSegment[],
    metadata: VideoMetadata,
    options: MultimediaAnalysisOptions = {}
  ): Promise<MultimediaAnalysisResult> {
    const content: MultimediaContent = {
      type: 'video',
      id: metadata.id,
      title: metadata.title,
      video: {
        source: metadata.source,
        transcript,
        metadata,
      },
    };

    return this.analyze(content, options);
  }

  /**
   * Analyze image content
   */
  async analyzeImage(
    imageData: string | Buffer,
    metadata: Partial<ImageMetadata> = {},
    options: MultimediaAnalysisOptions = {}
  ): Promise<MultimediaAnalysisResult> {
    const content: MultimediaContent = {
      type: 'image',
      id: metadata.id || `img_${Date.now()}`,
      title: metadata.caption,
      image: {
        data: imageData,
        metadata,
      },
    };

    return this.analyze(content, options);
  }

  /**
   * Analyze multiple images
   */
  async analyzeImages(
    images: Array<{ data: string | Buffer; metadata?: Partial<ImageMetadata> }>,
    options: MultimediaAnalysisOptions = {}
  ): Promise<MultimediaAnalysisResult> {
    const content: MultimediaContent = {
      type: 'mixed',
      id: `batch_${Date.now()}`,
      images,
    };

    return this.analyze(content, options);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Analyze video content
   */
  private async analyzeVideoContent(
    content: MultimediaContent,
    options: MultimediaAnalysisOptions,
    startTime: number
  ): Promise<MultimediaAnalysisResult> {
    if (!content.video) {
      throw new Error('Video data is required for video content');
    }

    let videoResult: VideoAnalysisResult;

    if (content.video.transcript && content.video.metadata) {
      // Use pre-fetched transcript
      videoResult = await this.videoAnalyzer.analyzeTranscript(
        content.video.transcript,
        content.video.metadata
      );
    } else if (content.video.videoId || content.video.url) {
      // Fetch and analyze
      const videoId = content.video.videoId || content.video.url || '';
      videoResult = await this.videoAnalyzer.analyzeVideo(videoId, content.video.source);
    } else {
      throw new Error('Video ID, URL, or transcript is required');
    }

    // Generate insights from video analysis
    const insights = this.generateVideoInsights(videoResult);

    // Generate combined activities
    const activities = this.generateVideoActivities(videoResult);

    return {
      contentId: content.id,
      contentType: 'video',
      dominantLevel: videoResult.dominantLevel,
      distribution: videoResult.overallDistribution,
      cognitiveDepth: videoResult.cognitiveDepth,
      confidence:
        videoResult.chunkAnalyses.length > 0
          ? videoResult.chunkAnalyses.reduce((sum, c) => sum + c.confidence, 0) /
            videoResult.chunkAnalyses.length
          : 0.5,
      balance: videoResult.balance,
      videoAnalysis: videoResult,
      recommendations: videoResult.recommendations,
      suggestedActivities: activities,
      cognitiveInsights: insights,
      metadata: {
        method: videoResult.processingMetadata.analysisMethod,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        fromCache: false,
        videoProcessingTimeMs: videoResult.processingMetadata.processingTimeMs,
      },
    };
  }

  /**
   * Analyze image content
   */
  private async analyzeImageContent(
    content: MultimediaContent,
    options: MultimediaAnalysisOptions,
    startTime: number
  ): Promise<MultimediaAnalysisResult> {
    if (!content.image) {
      throw new Error('Image data is required for image content');
    }

    const imageResult = await this.imageAnalyzer.analyzeImage(
      content.image.data,
      content.image.metadata
    );

    // Generate insights from image analysis
    const insights = this.generateImageInsights([imageResult]);

    // Generate activities
    const activities = imageResult.suggestedActivities.map((a) => ({
      ...a,
      mediaType: 'image' as const,
    }));

    return {
      contentId: content.id,
      contentType: 'image',
      dominantLevel: imageResult.cognitiveAssessment.primaryLevel,
      distribution: imageResult.cognitiveAssessment.distribution,
      cognitiveDepth: imageResult.cognitiveAssessment.cognitiveLoad,
      confidence: imageResult.cognitiveAssessment.confidence,
      balance: this.assessBalance(imageResult.cognitiveAssessment.distribution),
      imageAnalyses: [imageResult],
      recommendations: imageResult.recommendations,
      suggestedActivities: activities,
      cognitiveInsights: insights,
      metadata: {
        // Map 'rule-based' to 'keyword' for compatibility with AnalysisMetadata
        method: imageResult.processingMetadata.analysisMethod === 'rule-based'
          ? 'keyword'
          : imageResult.processingMetadata.analysisMethod,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        fromCache: false,
        imageProcessingTimeMs: imageResult.processingMetadata.processingTimeMs,
        imagesAnalyzed: 1,
      },
    };
  }

  /**
   * Analyze mixed content (video + images or multiple images)
   */
  private async analyzeMixedContent(
    content: MultimediaContent,
    options: MultimediaAnalysisOptions,
    startTime: number
  ): Promise<MultimediaAnalysisResult> {
    const imageAnalyses: ImageAnalysisResult[] = [];
    let videoAnalysis: VideoAnalysisResult | undefined;

    // Analyze video if present
    if (content.video) {
      const videoContent: MultimediaContent = {
        type: 'video',
        id: content.id,
        video: content.video,
      };
      const result = await this.analyzeVideoContent(videoContent, options, startTime);
      videoAnalysis = result.videoAnalysis;
    }

    // Analyze images
    const imagesToAnalyze = content.images || (content.image ? [content.image] : []);

    if (imagesToAnalyze.length > 0) {
      if (this.config.enableParallelAnalysis) {
        // Analyze in batches
        const batches: typeof imagesToAnalyze[] = [];
        for (let i = 0; i < imagesToAnalyze.length; i += this.config.maxParallelImages) {
          batches.push(imagesToAnalyze.slice(i, i + this.config.maxParallelImages));
        }

        for (const batch of batches) {
          const results = await Promise.all(
            batch.map((img) => this.imageAnalyzer.analyzeImage(img.data, img.metadata))
          );
          imageAnalyses.push(...results);
        }
      } else {
        // Analyze sequentially
        for (const img of imagesToAnalyze) {
          const result = await this.imageAnalyzer.analyzeImage(img.data, img.metadata);
          imageAnalyses.push(result);
        }
      }
    }

    // Combine results
    const combined = this.combineResults(videoAnalysis, imageAnalyses);

    // Generate insights
    const insights = [
      ...this.generateVideoInsights(videoAnalysis),
      ...this.generateImageInsights(imageAnalyses),
    ];

    // Generate activities
    const activities = this.generateCombinedActivities(videoAnalysis, imageAnalyses);

    // Generate recommendations
    const recommendations = this.generateCombinedRecommendations(videoAnalysis, imageAnalyses);

    return {
      contentId: content.id,
      contentType: 'mixed',
      ...combined,
      videoAnalysis,
      imageAnalyses: imageAnalyses.length > 0 ? imageAnalyses : undefined,
      recommendations,
      suggestedActivities: activities,
      cognitiveInsights: insights,
      metadata: {
        method: 'hybrid',
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        fromCache: false,
        videoProcessingTimeMs: videoAnalysis?.processingMetadata.processingTimeMs,
        imageProcessingTimeMs: imageAnalyses.reduce(
          (sum, r) => sum + r.processingMetadata.processingTimeMs,
          0
        ),
        imagesAnalyzed: imageAnalyses.length,
      },
    };
  }

  /**
   * Combine video and image analysis results
   */
  private combineResults(
    videoAnalysis: VideoAnalysisResult | undefined,
    imageAnalyses: ImageAnalysisResult[]
  ): {
    dominantLevel: BloomsLevel;
    distribution: BloomsDistribution;
    cognitiveDepth: number;
    confidence: number;
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  } {
    const distributions: Array<{ distribution: BloomsDistribution; weight: number }> = [];
    const depths: number[] = [];
    const confidences: number[] = [];

    // Add video contribution (weighted higher for duration)
    if (videoAnalysis) {
      const videoDuration = videoAnalysis.metadata.durationSeconds || 300;
      distributions.push({
        distribution: videoAnalysis.overallDistribution,
        weight: Math.min(videoDuration / 60, 10), // Weight by minutes, max 10
      });
      depths.push(videoAnalysis.cognitiveDepth);
      confidences.push(
        videoAnalysis.chunkAnalyses.reduce((sum, c) => sum + c.confidence, 0) /
          Math.max(1, videoAnalysis.chunkAnalyses.length)
      );
    }

    // Add image contributions
    for (const img of imageAnalyses) {
      distributions.push({
        distribution: img.cognitiveAssessment.distribution,
        weight: 1, // Each image has weight 1
      });
      depths.push(img.cognitiveAssessment.cognitiveLoad);
      confidences.push(img.cognitiveAssessment.confidence);
    }

    // Calculate weighted distribution
    const combinedDistribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    let totalWeight = 0;
    for (const { distribution, weight } of distributions) {
      for (const level of BLOOMS_LEVEL_ORDER) {
        combinedDistribution[level] += distribution[level] * weight;
      }
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      for (const level of BLOOMS_LEVEL_ORDER) {
        combinedDistribution[level] /= totalWeight;
      }
    }

    // Find dominant level
    let dominantLevel: BloomsLevel = 'UNDERSTAND';
    let maxValue = 0;
    for (const level of BLOOMS_LEVEL_ORDER) {
      if (combinedDistribution[level] > maxValue) {
        maxValue = combinedDistribution[level];
        dominantLevel = level;
      }
    }

    // Calculate average cognitive depth and confidence
    const avgDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 50;
    const avgConfidence =
      confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0.5;

    return {
      dominantLevel,
      distribution: combinedDistribution,
      cognitiveDepth: avgDepth,
      confidence: avgConfidence,
      balance: this.assessBalance(combinedDistribution),
    };
  }

  /**
   * Assess balance of distribution
   */
  private assessBalance(
    distribution: BloomsDistribution
  ): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
    const lower = distribution.REMEMBER + distribution.UNDERSTAND + distribution.APPLY;
    const higher = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

    if (Math.abs(lower - higher) < 20) {
      return 'well-balanced';
    }
    return lower > higher ? 'bottom-heavy' : 'top-heavy';
  }

  /**
   * Generate insights from video analysis
   */
  private generateVideoInsights(
    videoAnalysis: VideoAnalysisResult | undefined
  ): CognitiveInsight[] {
    if (!videoAnalysis) return [];

    const insights: CognitiveInsight[] = [];

    // Complexity warning
    if (videoAnalysis.cognitiveDepth > 70) {
      insights.push({
        type: 'complexity_warning',
        description: 'Video contains highly complex cognitive content.',
        severity: 'warning',
        recommendation: 'Consider breaking into shorter segments or providing supplementary materials.',
      });
    }

    // Balance issue
    if (videoAnalysis.balance !== 'well-balanced') {
      insights.push({
        type: 'balance_issue',
        description: `Video is ${videoAnalysis.balance} in cognitive level distribution.`,
        severity: 'info',
        recommendation:
          videoAnalysis.balance === 'bottom-heavy'
            ? 'Add analysis or evaluation activities to deepen learning.'
            : 'Ensure foundational concepts are covered before advanced material.',
      });
    }

    // Transition opportunities
    if (videoAnalysis.pausePoints.length > 0) {
      insights.push({
        type: 'progression_opportunity',
        description: `${videoAnalysis.pausePoints.length} optimal pause points identified for reflection.`,
        severity: 'info',
        recommendation: 'Use suggested pause points to break learning into manageable chunks.',
      });
    }

    return insights;
  }

  /**
   * Generate insights from image analysis
   */
  private generateImageInsights(imageAnalyses: ImageAnalysisResult[]): CognitiveInsight[] {
    const insights: CognitiveInsight[] = [];

    // Check for accessibility issues
    const accessibilityIssues = imageAnalyses.flatMap(
      (img) => img.accessibilityAssessment.issues.filter((i) => i.severity === 'critical')
    );

    if (accessibilityIssues.length > 0) {
      insights.push({
        type: 'accessibility_concern',
        description: `${accessibilityIssues.length} critical accessibility issues found across images.`,
        severity: 'critical',
        recommendation: 'Address alt text and contrast issues for inclusive learning.',
      });
    }

    // Check for high cognitive load images
    const highLoadImages = imageAnalyses.filter(
      (img) => img.cognitiveAssessment.cognitiveLoad > 70
    );

    if (highLoadImages.length > 0) {
      insights.push({
        type: 'complexity_warning',
        description: `${highLoadImages.length} images have high cognitive load.`,
        severity: 'warning',
        recommendation: 'Provide scaffolding or guided viewing for complex visuals.',
      });
    }

    return insights;
  }

  /**
   * Generate activities from video analysis
   */
  private generateVideoActivities(
    videoAnalysis: VideoAnalysisResult
  ): MultimediaAnalysisResult['suggestedActivities'] {
    const activities: MultimediaAnalysisResult['suggestedActivities'] = [];

    // Activity for dominant level
    activities.push({
      bloomsLevel: videoAnalysis.dominantLevel,
      activity: 'Watch and Reflect',
      description: `Engage with video content at ${videoAnalysis.dominantLevel} level with guided pause points.`,
      mediaType: 'video',
    });

    // Activities based on transitions
    if (videoAnalysis.transitions.length > 0) {
      const upTransitions = videoAnalysis.transitions.filter((t) => t.direction === 'up');
      if (upTransitions.length > 0) {
        activities.push({
          bloomsLevel: upTransitions[0].toLevel,
          activity: 'Progressive Challenge',
          description:
            'Follow the video progression to build from foundational to advanced concepts.',
          mediaType: 'video',
        });
      }
    }

    return activities;
  }

  /**
   * Generate combined activities
   */
  private generateCombinedActivities(
    videoAnalysis: VideoAnalysisResult | undefined,
    imageAnalyses: ImageAnalysisResult[]
  ): MultimediaAnalysisResult['suggestedActivities'] {
    const activities: MultimediaAnalysisResult['suggestedActivities'] = [];

    // Video activities
    if (videoAnalysis) {
      activities.push(...this.generateVideoActivities(videoAnalysis));
    }

    // Image activities
    for (const img of imageAnalyses) {
      activities.push(
        ...img.suggestedActivities.map((a) => ({
          ...a,
          mediaType: 'image' as const,
        }))
      );
    }

    // Combined activity if both present
    if (videoAnalysis && imageAnalyses.length > 0) {
      activities.push({
        bloomsLevel: 'ANALYZE',
        activity: 'Cross-Media Analysis',
        description: 'Compare concepts presented in video with visual representations in images.',
        mediaType: 'combined',
      });
    }

    return activities;
  }

  /**
   * Generate combined recommendations
   */
  private generateCombinedRecommendations(
    videoAnalysis: VideoAnalysisResult | undefined,
    imageAnalyses: ImageAnalysisResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Add video recommendations
    if (videoAnalysis) {
      recommendations.push(...videoAnalysis.recommendations);
    }

    // Add image recommendations (deduplicated)
    const imageRecs = new Set<string>();
    for (const img of imageAnalyses) {
      for (const rec of img.recommendations) {
        imageRecs.add(rec);
      }
    }
    recommendations.push(...Array.from(imageRecs));

    // Add combined recommendations
    if (videoAnalysis && imageAnalyses.length > 0) {
      recommendations.push(
        'Use images as reference materials while watching the video for enhanced understanding.'
      );
    }

    return recommendations;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a multimedia Bloom's engine
 */
export function createMultimediaBloomsEngine(
  contentAnalyzer: ContentAnalyzerAdapter,
  config?: MultimediaEngineConfig
): MultimediaBloomsEngine {
  return new MultimediaBloomsEngine(contentAnalyzer, config);
}

// ============================================================================
// INTEGRATION WITH UNIFIED BLOOMS ENGINE
// ============================================================================

/**
 * Create a content analyzer adapter from UnifiedBloomsEngine
 * This allows the multimedia engine to use the unified engine for text analysis
 */
export function createContentAnalyzerFromEngine(
  unifiedEngine: {
    analyze(
      content: string,
      options?: { includeSubLevel?: boolean }
    ): Promise<UnifiedBloomsResult>;
  }
): ContentAnalyzerAdapter {
  return {
    async analyze(content: string, options?: { includeSubLevel?: boolean }) {
      const result = await unifiedEngine.analyze(content, options);
      return {
        dominantLevel: result.dominantLevel,
        distribution: result.distribution,
        confidence: result.confidence,
        cognitiveDepth: result.cognitiveDepth,
        subLevel: result.subLevel,
      };
    },
  };
}
