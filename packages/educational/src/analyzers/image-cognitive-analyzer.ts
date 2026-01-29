/**
 * Image Cognitive Analyzer
 *
 * Phase 4: Multimedia Content Analysis
 * - Analyzes educational images, diagrams, and infographics
 * - Extracts text and visual elements for Bloom's classification
 * - Identifies cognitive complexity of visual content
 * - Provides accessibility assessments
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { BloomsDistribution } from '../types/blooms.types';

// ============================================================================
// TYPES
// ============================================================================

export type ImageType =
  | 'diagram'
  | 'flowchart'
  | 'infographic'
  | 'chart'
  | 'table'
  | 'illustration'
  | 'screenshot'
  | 'photo'
  | 'mind_map'
  | 'concept_map'
  | 'timeline'
  | 'comparison'
  | 'process'
  | 'hierarchy'
  | 'unknown';

export type VisualComplexity = 'simple' | 'moderate' | 'complex' | 'highly_complex';

export interface ImageMetadata {
  /**
   * Image identifier
   */
  id: string;

  /**
   * Original filename
   */
  filename?: string;

  /**
   * MIME type
   */
  mimeType?: string;

  /**
   * Image dimensions
   */
  dimensions?: {
    width: number;
    height: number;
  };

  /**
   * File size in bytes
   */
  sizeBytes?: number;

  /**
   * Alt text if available
   */
  altText?: string;

  /**
   * Caption if available
   */
  caption?: string;

  /**
   * Source URL
   */
  url?: string;
}

export interface ExtractedTextRegion {
  /**
   * Extracted text
   */
  text: string;

  /**
   * Bounding box (normalized 0-1)
   */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Confidence in text extraction
   */
  confidence: number;

  /**
   * Type of text region
   */
  type: 'title' | 'label' | 'body' | 'annotation' | 'legend' | 'axis' | 'unknown';
}

export interface VisualElement {
  /**
   * Element type
   */
  type:
    | 'shape'
    | 'arrow'
    | 'line'
    | 'icon'
    | 'graph'
    | 'data_point'
    | 'connector'
    | 'box'
    | 'circle'
    | 'image_region';

  /**
   * Element description
   */
  description?: string;

  /**
   * Count of this element type
   */
  count: number;

  /**
   * Semantic meaning if identifiable
   */
  semanticMeaning?: string;
}

export interface ColorAnalysis {
  /**
   * Dominant colors (hex)
   */
  dominantColors: string[];

  /**
   * Whether colors are used meaningfully (not just decorative)
   */
  semanticColorUse: boolean;

  /**
   * Color contrast accessibility score (0-100)
   */
  contrastScore: number;

  /**
   * Color blind accessibility score (0-100)
   */
  colorBlindScore: number;
}

export interface StructuralAnalysis {
  /**
   * Detected image type
   */
  imageType: ImageType;

  /**
   * Visual complexity level
   */
  complexity: VisualComplexity;

  /**
   * Number of distinct sections/regions
   */
  sectionCount: number;

  /**
   * Hierarchy depth (for diagrams, flowcharts)
   */
  hierarchyDepth: number;

  /**
   * Number of connections/relationships shown
   */
  connectionCount: number;

  /**
   * Whether there's a clear visual flow
   */
  hasVisualFlow: boolean;

  /**
   * Direction of visual flow if present
   */
  flowDirection?: 'left-to-right' | 'top-to-bottom' | 'circular' | 'radial' | 'mixed';
}

export interface CognitiveAssessment {
  /**
   * Primary Bloom's level the image targets
   */
  primaryLevel: BloomsLevel;

  /**
   * Distribution across Bloom's levels
   */
  distribution: BloomsDistribution;

  /**
   * Cognitive load estimate (0-100)
   */
  cognitiveLoad: number;

  /**
   * Confidence in assessment
   */
  confidence: number;

  /**
   * Justification for the classification
   */
  justification: string;

  /**
   * Cognitive skills the image supports
   */
  supportedSkills: string[];
}

export interface AccessibilityAssessment {
  /**
   * Overall accessibility score (0-100)
   */
  overallScore: number;

  /**
   * Has adequate alt text
   */
  hasAltText: boolean;

  /**
   * Alt text quality score (0-100)
   */
  altTextQuality: number;

  /**
   * Text is readable
   */
  textReadability: number;

  /**
   * Color contrast is adequate
   */
  colorContrast: number;

  /**
   * Issues found
   */
  issues: Array<{
    severity: 'critical' | 'major' | 'minor';
    description: string;
    recommendation: string;
  }>;
}

export interface ImageAnalysisResult {
  /**
   * Image metadata
   */
  metadata: ImageMetadata;

  /**
   * Extracted text regions
   */
  textRegions: ExtractedTextRegion[];

  /**
   * Combined extracted text
   */
  extractedText: string;

  /**
   * Visual elements detected
   */
  visualElements: VisualElement[];

  /**
   * Color analysis
   */
  colorAnalysis: ColorAnalysis;

  /**
   * Structural analysis
   */
  structuralAnalysis: StructuralAnalysis;

  /**
   * Cognitive assessment
   */
  cognitiveAssessment: CognitiveAssessment;

  /**
   * Accessibility assessment
   */
  accessibilityAssessment: AccessibilityAssessment;

  /**
   * Educational recommendations
   */
  recommendations: string[];

  /**
   * Suggested learning activities
   */
  suggestedActivities: Array<{
    bloomsLevel: BloomsLevel;
    activity: string;
    description: string;
  }>;

  /**
   * Processing metadata
   */
  processingMetadata: {
    processingTimeMs: number;
    analysisMethod: 'ai' | 'rule-based' | 'hybrid';
    modelUsed?: string;
  };
}

export interface ImageAnalyzerConfig {
  /**
   * Enable OCR for text extraction
   * @default true
   */
  enableOCR?: boolean;

  /**
   * Minimum confidence for text extraction
   * @default 0.7
   */
  ocrConfidenceThreshold?: number;

  /**
   * Enable visual element detection
   * @default true
   */
  enableVisualAnalysis?: boolean;

  /**
   * Enable accessibility assessment
   * @default true
   */
  enableAccessibilityCheck?: boolean;

  /**
   * Vision model provider for AI analysis
   */
  visionProvider?: VisionProvider;

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
 * Vision provider interface for AI-powered image analysis
 */
export interface VisionProvider {
  /**
   * Analyze an image and return structured data
   */
  analyzeImage(
    imageData: string | Buffer,
    prompt: string
  ): Promise<{
    description: string;
    elements: string[];
    text: string[];
    metadata: Record<string, unknown>;
  }>;

  /**
   * Extract text from an image (OCR)
   */
  extractText(imageData: string | Buffer): Promise<ExtractedTextRegion[]>;

  /**
   * Get image description
   */
  describeImage(imageData: string | Buffer): Promise<string>;
}

/**
 * Content analyzer interface (dependency injection for Bloom's analysis)
 */
export interface ContentAnalyzer {
  /**
   * Analyze content and return Bloom's classification
   */
  analyze(content: string): Promise<{
    dominantLevel: BloomsLevel;
    distribution: BloomsDistribution;
    confidence: number;
    cognitiveDepth: number;
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

// Image type to typical Bloom's level mapping
const IMAGE_TYPE_BLOOM_MAPPING: Record<ImageType, BloomsLevel> = {
  diagram: 'UNDERSTAND',
  flowchart: 'ANALYZE',
  infographic: 'UNDERSTAND',
  chart: 'ANALYZE',
  table: 'REMEMBER',
  illustration: 'UNDERSTAND',
  screenshot: 'REMEMBER',
  photo: 'REMEMBER',
  mind_map: 'ANALYZE',
  concept_map: 'ANALYZE',
  timeline: 'UNDERSTAND',
  comparison: 'EVALUATE',
  process: 'APPLY',
  hierarchy: 'ANALYZE',
  unknown: 'UNDERSTAND',
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class ImageCognitiveAnalyzer {
  private readonly config: Required<Omit<ImageAnalyzerConfig, 'visionProvider' | 'logger'>> & {
    visionProvider?: VisionProvider;
    logger?: ImageAnalyzerConfig['logger'];
  };
  private readonly contentAnalyzer: ContentAnalyzer;

  constructor(contentAnalyzer: ContentAnalyzer, config: ImageAnalyzerConfig = {}) {
    this.contentAnalyzer = contentAnalyzer;
    this.config = {
      enableOCR: config.enableOCR ?? true,
      ocrConfidenceThreshold: config.ocrConfidenceThreshold ?? 0.7,
      enableVisualAnalysis: config.enableVisualAnalysis ?? true,
      enableAccessibilityCheck: config.enableAccessibilityCheck ?? true,
      visionProvider: config.visionProvider,
      logger: config.logger,
    };
  }

  /**
   * Analyze an image for educational cognitive content
   */
  async analyzeImage(
    imageData: string | Buffer,
    metadata: Partial<ImageMetadata> = {}
  ): Promise<ImageAnalysisResult> {
    const startTime = Date.now();

    // Build complete metadata
    const fullMetadata: ImageMetadata = {
      id: metadata.id || `img_${Date.now()}`,
      ...metadata,
    };

    // Extract text if enabled
    const textRegions = this.config.enableOCR
      ? await this.extractText(imageData)
      : [];

    const extractedText = textRegions
      .filter((r) => r.confidence >= this.config.ocrConfidenceThreshold)
      .map((r) => r.text)
      .join(' ');

    // Analyze visual elements
    const visualElements = this.config.enableVisualAnalysis
      ? await this.detectVisualElements(imageData)
      : [];

    // Analyze structure
    const structuralAnalysis = this.analyzeStructure(visualElements, textRegions);

    // Analyze colors (simplified without vision provider)
    const colorAnalysis = this.analyzeColors();

    // Perform cognitive assessment
    const cognitiveAssessment = await this.assessCognitive(
      extractedText,
      structuralAnalysis,
      fullMetadata
    );

    // Accessibility assessment
    const accessibilityAssessment = this.config.enableAccessibilityCheck
      ? this.assessAccessibility(fullMetadata, textRegions, colorAnalysis)
      : this.getDefaultAccessibilityAssessment();

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      cognitiveAssessment,
      structuralAnalysis,
      accessibilityAssessment
    );

    // Generate suggested activities
    const suggestedActivities = this.generateActivities(
      cognitiveAssessment,
      structuralAnalysis
    );

    return {
      metadata: fullMetadata,
      textRegions,
      extractedText,
      visualElements,
      colorAnalysis,
      structuralAnalysis,
      cognitiveAssessment,
      accessibilityAssessment,
      recommendations,
      suggestedActivities,
      processingMetadata: {
        processingTimeMs: Date.now() - startTime,
        analysisMethod: this.config.visionProvider ? 'ai' : 'rule-based',
        modelUsed: this.config.visionProvider ? 'vision-model' : undefined,
      },
    };
  }

  /**
   * Extract text from image
   */
  private async extractText(imageData: string | Buffer): Promise<ExtractedTextRegion[]> {
    if (this.config.visionProvider) {
      try {
        return await this.config.visionProvider.extractText(imageData);
      } catch (error) {
        this.config.logger?.warn?.('[ImageCognitiveAnalyzer] OCR failed', error);
      }
    }

    // Return empty if no vision provider or OCR failed
    return [];
  }

  /**
   * Detect visual elements in the image
   */
  private async detectVisualElements(
    imageData: string | Buffer
  ): Promise<VisualElement[]> {
    if (this.config.visionProvider) {
      try {
        const result = await this.config.visionProvider.analyzeImage(
          imageData,
          'Identify and count visual elements such as shapes, arrows, lines, icons, graphs, and connectors.'
        );

        // Parse the response into VisualElement array
        return result.elements.map((el) => ({
          type: 'shape' as const,
          description: el,
          count: 1,
        }));
      } catch (error) {
        this.config.logger?.warn?.(
          '[ImageCognitiveAnalyzer] Visual analysis failed',
          error
        );
      }
    }

    // Return default/empty if no vision provider
    return [];
  }

  /**
   * Analyze image structure
   */
  private analyzeStructure(
    visualElements: VisualElement[],
    textRegions: ExtractedTextRegion[]
  ): StructuralAnalysis {
    // Determine image type based on elements and text
    const imageType = this.detectImageType(visualElements, textRegions);

    // Calculate complexity
    const complexity = this.calculateComplexity(visualElements, textRegions);

    // Count sections and connections
    const sectionCount = textRegions.filter((r) => r.type === 'title' || r.type === 'label').length;
    const connectionCount = visualElements.filter(
      (e) => e.type === 'arrow' || e.type === 'line' || e.type === 'connector'
    ).reduce((sum, e) => sum + e.count, 0);

    // Estimate hierarchy depth
    const hierarchyDepth = this.estimateHierarchyDepth(visualElements);

    // Detect visual flow
    const hasVisualFlow = connectionCount > 2;
    const flowDirection = hasVisualFlow
      ? this.detectFlowDirection(visualElements)
      : undefined;

    return {
      imageType,
      complexity,
      sectionCount,
      hierarchyDepth,
      connectionCount,
      hasVisualFlow,
      flowDirection,
    };
  }

  /**
   * Detect image type from elements
   */
  private detectImageType(
    visualElements: VisualElement[],
    textRegions: ExtractedTextRegion[]
  ): ImageType {
    const hasArrows = visualElements.some((e) => e.type === 'arrow');
    const hasConnectors = visualElements.some((e) => e.type === 'connector');
    const hasGraphs = visualElements.some((e) => e.type === 'graph');
    const hasDataPoints = visualElements.some((e) => e.type === 'data_point');
    const hasBoxes = visualElements.some((e) => e.type === 'box');

    const hasAxisLabels = textRegions.some((r) => r.type === 'axis');
    const hasLegend = textRegions.some((r) => r.type === 'legend');

    // Decision tree for image type
    if (hasGraphs || hasDataPoints || hasAxisLabels) {
      return 'chart';
    }

    if (hasArrows && hasBoxes) {
      return 'flowchart';
    }

    if (hasConnectors && !hasArrows) {
      if (textRegions.length > 10) {
        return 'concept_map';
      }
      return 'mind_map';
    }

    if (hasLegend && textRegions.length > 5) {
      return 'infographic';
    }

    if (visualElements.length === 0 && textRegions.length > 0) {
      return 'table';
    }

    return 'diagram';
  }

  /**
   * Calculate visual complexity
   */
  private calculateComplexity(
    visualElements: VisualElement[],
    textRegions: ExtractedTextRegion[]
  ): VisualComplexity {
    const elementCount = visualElements.reduce((sum, e) => sum + e.count, 0);
    const textCount = textRegions.length;
    const totalCount = elementCount + textCount;

    if (totalCount < 5) return 'simple';
    if (totalCount < 15) return 'moderate';
    if (totalCount < 30) return 'complex';
    return 'highly_complex';
  }

  /**
   * Estimate hierarchy depth
   */
  private estimateHierarchyDepth(visualElements: VisualElement[]): number {
    // Simple heuristic based on element counts
    const boxes = visualElements.filter((e) => e.type === 'box').reduce((s, e) => s + e.count, 0);
    const connectors = visualElements.filter(
      (e) => e.type === 'connector' || e.type === 'line'
    ).reduce((s, e) => s + e.count, 0);

    if (boxes === 0) return 0;
    if (connectors === 0) return 1;

    // Rough estimate: sqrt of connections gives approximate depth
    return Math.min(Math.ceil(Math.sqrt(connectors)), 5);
  }

  /**
   * Detect visual flow direction
   */
  private detectFlowDirection(
    visualElements: VisualElement[]
  ): 'left-to-right' | 'top-to-bottom' | 'circular' | 'radial' | 'mixed' {
    // Without vision analysis, default to most common
    return 'top-to-bottom';
  }

  /**
   * Analyze colors (simplified)
   */
  private analyzeColors(): ColorAnalysis {
    // Without vision provider, return defaults
    return {
      dominantColors: [],
      semanticColorUse: false,
      contrastScore: 70,
      colorBlindScore: 70,
    };
  }

  /**
   * Assess cognitive level of the image
   */
  private async assessCognitive(
    extractedText: string,
    structuralAnalysis: StructuralAnalysis,
    metadata: ImageMetadata
  ): Promise<CognitiveAssessment> {
    // Get base level from image type
    const baseLevel = IMAGE_TYPE_BLOOM_MAPPING[structuralAnalysis.imageType];

    // Analyze extracted text if available
    let textAnalysis: {
      dominantLevel: BloomsLevel;
      distribution: BloomsDistribution;
      confidence: number;
      cognitiveDepth: number;
    } | null = null;

    if (extractedText.length > 20) {
      try {
        textAnalysis = await this.contentAnalyzer.analyze(extractedText);
      } catch (error) {
        this.config.logger?.warn?.(
          '[ImageCognitiveAnalyzer] Text analysis failed',
          error
        );
      }
    }

    // Also analyze alt text and caption
    const additionalText = [metadata.altText, metadata.caption]
      .filter(Boolean)
      .join(' ');

    let additionalAnalysis: typeof textAnalysis = null;
    if (additionalText.length > 10) {
      try {
        additionalAnalysis = await this.contentAnalyzer.analyze(additionalText);
      } catch {
        // Ignore errors
      }
    }

    // Combine analyses
    const primaryLevel = textAnalysis?.dominantLevel || baseLevel;

    // Calculate distribution
    const distribution = this.calculateDistribution(
      baseLevel,
      textAnalysis?.distribution,
      additionalAnalysis?.distribution,
      structuralAnalysis
    );

    // Calculate cognitive load based on complexity
    const cognitiveLoad = this.calculateCognitiveLoad(structuralAnalysis);

    // Calculate confidence
    const confidence = this.calculateConfidence(
      textAnalysis?.confidence,
      structuralAnalysis
    );

    // Generate justification
    const justification = this.generateJustification(
      primaryLevel,
      structuralAnalysis,
      textAnalysis
    );

    // Identify supported skills
    const supportedSkills = this.identifySupportedSkills(
      primaryLevel,
      structuralAnalysis
    );

    return {
      primaryLevel,
      distribution,
      cognitiveLoad,
      confidence,
      justification,
      supportedSkills,
    };
  }

  /**
   * Calculate Bloom's distribution
   */
  private calculateDistribution(
    baseLevel: BloomsLevel,
    textDistribution?: BloomsDistribution,
    additionalDistribution?: BloomsDistribution,
    structuralAnalysis?: StructuralAnalysis
  ): BloomsDistribution {
    // Start with base distribution from image type
    const baseLevelIndex = BLOOMS_LEVEL_ORDER.indexOf(baseLevel);
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    // Weight around base level
    for (let i = 0; i < BLOOMS_LEVEL_ORDER.length; i++) {
      const distance = Math.abs(i - baseLevelIndex);
      distribution[BLOOMS_LEVEL_ORDER[i]] = Math.max(0, 40 - distance * 15);
    }

    // Blend with text analysis if available
    if (textDistribution) {
      for (const level of BLOOMS_LEVEL_ORDER) {
        distribution[level] = distribution[level] * 0.6 + textDistribution[level] * 0.4;
      }
    }

    // Adjust based on complexity
    if (structuralAnalysis) {
      if (structuralAnalysis.complexity === 'complex' || structuralAnalysis.complexity === 'highly_complex') {
        // Shift towards higher levels for complex images
        distribution.ANALYZE += 10;
        distribution.EVALUATE += 5;
        distribution.REMEMBER -= 10;
        distribution.UNDERSTAND -= 5;
      }
    }

    // Normalize to 100%
    const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
    if (total > 0) {
      for (const level of BLOOMS_LEVEL_ORDER) {
        distribution[level] = (distribution[level] / total) * 100;
      }
    }

    return distribution;
  }

  /**
   * Calculate cognitive load
   */
  private calculateCognitiveLoad(structuralAnalysis: StructuralAnalysis): number {
    const complexityMap: Record<VisualComplexity, number> = {
      simple: 20,
      moderate: 40,
      complex: 65,
      highly_complex: 85,
    };

    let load = complexityMap[structuralAnalysis.complexity];

    // Adjust based on other factors
    if (structuralAnalysis.hierarchyDepth > 3) {
      load += 10;
    }

    if (structuralAnalysis.connectionCount > 10) {
      load += 10;
    }

    if (structuralAnalysis.hasVisualFlow) {
      load -= 5; // Visual flow reduces cognitive load
    }

    return Math.max(0, Math.min(100, load));
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(
    textConfidence: number | undefined,
    structuralAnalysis: StructuralAnalysis
  ): number {
    let confidence = 0.5; // Base confidence

    if (textConfidence !== undefined) {
      confidence = textConfidence * 0.6 + 0.4; // Weight text confidence highly
    }

    // Adjust based on how clearly we could identify the image type
    if (structuralAnalysis.imageType !== 'unknown') {
      confidence += 0.1;
    }

    if (structuralAnalysis.sectionCount > 0) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * Generate justification for classification
   */
  private generateJustification(
    primaryLevel: BloomsLevel,
    structuralAnalysis: StructuralAnalysis,
    textAnalysis: { dominantLevel: BloomsLevel } | null
  ): string {
    const parts: string[] = [];

    parts.push(
      `Image classified as ${structuralAnalysis.imageType} with ${structuralAnalysis.complexity} complexity.`
    );

    if (textAnalysis) {
      parts.push(
        `Text analysis suggests ${textAnalysis.dominantLevel} level cognitive engagement.`
      );
    }

    parts.push(
      `Primary cognitive level: ${primaryLevel} based on structural and content analysis.`
    );

    return parts.join(' ');
  }

  /**
   * Identify supported cognitive skills
   */
  private identifySupportedSkills(
    primaryLevel: BloomsLevel,
    structuralAnalysis: StructuralAnalysis
  ): string[] {
    const skills: string[] = [];

    // Base skills from primary level
    const levelSkills: Record<BloomsLevel, string[]> = {
      REMEMBER: ['Recall', 'Recognition', 'Identification'],
      UNDERSTAND: ['Comprehension', 'Interpretation', 'Classification'],
      APPLY: ['Implementation', 'Execution', 'Problem-solving'],
      ANALYZE: ['Differentiation', 'Organization', 'Attribution'],
      EVALUATE: ['Judgment', 'Critique', 'Assessment'],
      CREATE: ['Design', 'Construction', 'Planning'],
    };

    skills.push(...levelSkills[primaryLevel]);

    // Additional skills based on image type
    if (structuralAnalysis.imageType === 'flowchart') {
      skills.push('Sequential thinking', 'Process understanding');
    }

    if (structuralAnalysis.imageType === 'concept_map' || structuralAnalysis.imageType === 'mind_map') {
      skills.push('Relationship identification', 'Conceptual linking');
    }

    if (structuralAnalysis.imageType === 'comparison') {
      skills.push('Comparative analysis', 'Pattern recognition');
    }

    return Array.from(new Set(skills));
  }

  /**
   * Assess accessibility
   */
  private assessAccessibility(
    metadata: ImageMetadata,
    textRegions: ExtractedTextRegion[],
    colorAnalysis: ColorAnalysis
  ): AccessibilityAssessment {
    const issues: AccessibilityAssessment['issues'] = [];

    // Check alt text
    const hasAltText = !!metadata.altText && metadata.altText.length > 5;
    const altTextQuality = hasAltText
      ? Math.min(100, metadata.altText!.length * 2)
      : 0;

    if (!hasAltText) {
      issues.push({
        severity: 'critical',
        description: 'Missing or inadequate alt text',
        recommendation: 'Add descriptive alt text that conveys the educational content of the image.',
      });
    }

    // Check text readability (based on region count as proxy)
    const textReadability = textRegions.length > 20 ? 60 : 80;

    if (textRegions.length > 30) {
      issues.push({
        severity: 'minor',
        description: 'High text density may affect readability',
        recommendation: 'Consider breaking into multiple images or simplifying.',
      });
    }

    // Color contrast
    const colorContrast = colorAnalysis.contrastScore;

    if (colorContrast < 50) {
      issues.push({
        severity: 'major',
        description: 'Low color contrast detected',
        recommendation: 'Increase contrast between text and background colors.',
      });
    }

    // Overall score
    const overallScore = Math.round(
      (altTextQuality * 0.4 + textReadability * 0.3 + colorContrast * 0.3)
    );

    return {
      overallScore,
      hasAltText,
      altTextQuality,
      textReadability,
      colorContrast,
      issues,
    };
  }

  /**
   * Get default accessibility assessment
   */
  private getDefaultAccessibilityAssessment(): AccessibilityAssessment {
    return {
      overallScore: 50,
      hasAltText: false,
      altTextQuality: 0,
      textReadability: 70,
      colorContrast: 70,
      issues: [],
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    cognitive: CognitiveAssessment,
    structural: StructuralAnalysis,
    accessibility: AccessibilityAssessment
  ): string[] {
    const recommendations: string[] = [];

    // Cognitive recommendations
    if (cognitive.cognitiveLoad > 70) {
      recommendations.push(
        'High cognitive load detected. Consider scaffolding with simpler visuals first.'
      );
    }

    if (cognitive.primaryLevel === 'REMEMBER') {
      recommendations.push(
        'Consider adding analysis questions or activities to promote deeper engagement.'
      );
    }

    // Structural recommendations
    if (structural.complexity === 'highly_complex') {
      recommendations.push(
        'Complex visual. Provide guided viewing instructions or chunked presentation.'
      );
    }

    if (!structural.hasVisualFlow && structural.connectionCount > 5) {
      recommendations.push(
        'Consider adding visual cues (arrows, numbers) to guide viewing order.'
      );
    }

    // Accessibility recommendations
    for (const issue of accessibility.issues.filter((i) => i.severity === 'critical')) {
      recommendations.push(issue.recommendation);
    }

    return recommendations;
  }

  /**
   * Generate learning activities
   */
  private generateActivities(
    cognitive: CognitiveAssessment,
    structural: StructuralAnalysis
  ): Array<{ bloomsLevel: BloomsLevel; activity: string; description: string }> {
    const activities: Array<{ bloomsLevel: BloomsLevel; activity: string; description: string }> = [];

    // Add activity for primary level
    activities.push({
      bloomsLevel: cognitive.primaryLevel,
      activity: this.getActivityForLevel(cognitive.primaryLevel, structural),
      description: `Engage with the ${structural.imageType} at its primary cognitive level.`,
    });

    // Add activities for adjacent levels
    const levelIndex = BLOOMS_LEVEL_ORDER.indexOf(cognitive.primaryLevel);

    if (levelIndex > 0) {
      const lowerLevel = BLOOMS_LEVEL_ORDER[levelIndex - 1];
      activities.push({
        bloomsLevel: lowerLevel,
        activity: this.getActivityForLevel(lowerLevel, structural),
        description: 'Foundational activity to ensure prerequisite understanding.',
      });
    }

    if (levelIndex < BLOOMS_LEVEL_ORDER.length - 1) {
      const higherLevel = BLOOMS_LEVEL_ORDER[levelIndex + 1];
      activities.push({
        bloomsLevel: higherLevel,
        activity: this.getActivityForLevel(higherLevel, structural),
        description: 'Extension activity to promote deeper cognitive engagement.',
      });
    }

    return activities;
  }

  /**
   * Get activity suggestion for a Bloom's level
   */
  private getActivityForLevel(level: BloomsLevel, structural: StructuralAnalysis): string {
    const activities: Record<BloomsLevel, string[]> = {
      REMEMBER: [
        'Identify and label key components',
        'List the elements shown',
        'Match terms to visual representations',
      ],
      UNDERSTAND: [
        'Explain the relationships shown',
        'Summarize the main concept',
        'Describe the process in your own words',
      ],
      APPLY: [
        'Use this model to solve a similar problem',
        'Apply the process to a new scenario',
        'Demonstrate understanding with an example',
      ],
      ANALYZE: [
        'Compare and contrast elements shown',
        'Identify patterns and relationships',
        'Break down the structure into components',
      ],
      EVALUATE: [
        'Assess the effectiveness of this representation',
        'Critique the design choices',
        'Judge the completeness of information',
      ],
      CREATE: [
        'Create your own version of this diagram',
        'Design an alternative representation',
        'Extend the model with new elements',
      ],
    };

    const options = activities[level];
    // Select based on image type
    const index = Math.abs(structural.imageType.charCodeAt(0)) % options.length;
    return options[index];
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create an image cognitive analyzer
 */
export function createImageCognitiveAnalyzer(
  contentAnalyzer: ContentAnalyzer,
  config?: ImageAnalyzerConfig
): ImageCognitiveAnalyzer {
  return new ImageCognitiveAnalyzer(contentAnalyzer, config);
}
