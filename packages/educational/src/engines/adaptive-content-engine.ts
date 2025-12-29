/**
 * @sam-ai/educational - Adaptive Content Engine
 * Personalizes content based on learning styles and user progress
 */

import type {
  AdaptiveContentConfig,
  AdaptiveLearnerProfile,
  ContentToAdapt,
  AdaptedContent,
  AdaptedChunk,
  AdaptationOptions,
  StyleDetectionResult,
  ContentInteractionData,
  SupplementaryResource,
  AdaptiveContentDatabaseAdapter,
  AdaptiveLearningStyle,
  ContentFormat,
  ContentComplexity,
  EmbeddedKnowledgeCheck,
} from '../types/adaptive-content.types';

/**
 * AdaptiveContentEngine - Personalizes content based on learning styles
 *
 * Features:
 * - Learning style detection from user interactions
 * - Content adaptation for different learning styles
 * - Complexity adjustment based on user level
 * - Scaffolding for prerequisite concepts
 * - Embedded knowledge checks
 * - Supplementary resource recommendations
 */
export class AdaptiveContentEngine {
  private database?: AdaptiveContentDatabaseAdapter;
  private aiAdapter?: AdaptiveContentConfig['aiAdapter'];
  private cache: Map<string, AdaptedContent> = new Map();

  constructor(private config: AdaptiveContentConfig = {}) {
    this.database = config.database;
    this.aiAdapter = config.aiAdapter;
  }

  /**
   * Adapt content for a specific learner profile
   */
  async adaptContent(
    content: ContentToAdapt,
    profile: AdaptiveLearnerProfile,
    options: AdaptationOptions = {}
  ): Promise<AdaptedContent> {
    const {
      targetStyle = profile.primaryStyle,
      targetComplexity = profile.preferredComplexity,
      targetFormat,
      includeSupplementary = true,
      includeKnowledgeChecks = true,
      personalizeExamples = true,
      addScaffolding = true,
    } = options;

    // Check cache first
    const cacheKey = `${content.id}-${targetStyle}-${targetComplexity}`;
    if (this.cache.has(cacheKey) && this.config.enableCaching) {
      return this.cache.get(cacheKey)!;
    }

    // If AI adapter is available, use AI for adaptation
    if (this.aiAdapter) {
      return this.adaptWithAI(content, profile, options);
    }

    // Fallback to rule-based adaptation
    const chunks = this.createAdaptedChunks(content, targetStyle, targetComplexity, targetFormat);

    // Add scaffolding for prerequisites if needed
    let scaffolding;
    if (addScaffolding && content.prerequisites.length > 0) {
      scaffolding = this.createScaffolding(content.prerequisites, profile.knownConcepts);
    }

    // Generate knowledge checks
    let knowledgeChecks: EmbeddedKnowledgeCheck[] = [];
    if (includeKnowledgeChecks) {
      knowledgeChecks = this.generateKnowledgeChecks(content, chunks);
    }

    // Get supplementary resources
    let supplementaryResources: SupplementaryResource[] = [];
    if (includeSupplementary) {
      supplementaryResources = this.getSupplementaryForStyle(content.topic, targetStyle);
    }

    const adaptedContent: AdaptedContent = {
      originalId: content.id,
      chunks,
      summary: this.generateSummary(content, targetStyle),
      keyTakeaways: this.extractKeyTakeaways(content),
      knowledgeChecks,
      supplementaryResources,
      scaffolding,
      estimatedTotalTime: chunks.reduce((sum, c) => sum + c.estimatedTime, 0),
      adaptationInfo: {
        targetStyle,
        targetComplexity,
        adaptedAt: new Date(),
        confidence: profile.confidence,
      },
    };

    // Cache the result
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, adaptedContent);
    }

    return adaptedContent;
  }

  /**
   * Adapt content using AI
   */
  private async adaptWithAI(
    content: ContentToAdapt,
    profile: AdaptiveLearnerProfile,
    options: AdaptationOptions
  ): Promise<AdaptedContent> {
    const prompt = this.buildAdaptationPrompt(content, profile, options);

    try {
      const response = await this.aiAdapter!.chat({
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content adapter. Transform content to match the learner's style while maintaining accuracy and educational value. Always respond with valid JSON.`,
          },
          { role: 'user', content: prompt },
        ],
      });

      return this.parseAdaptedContent(response.content, content, profile, options);
    } catch (error) {
      console.error('AI adaptation failed, using rule-based:', error);
      return this.adaptContent(content, profile, { ...options });
    }
  }

  /**
   * Detect learning style from user interactions
   */
  async detectLearningStyle(userId: string): Promise<StyleDetectionResult> {
    if (!this.database) {
      return this.getDefaultStyleResult();
    }

    const interactions = await this.database.getInteractions(userId, { limit: 100 });

    if (interactions.length < (this.config.minInteractionsForAdaptation || 5)) {
      return this.getDefaultStyleResult();
    }

    // Analyze interactions by format
    const formatStats = this.analyzeFormatPreferences(interactions);
    const behaviorIndicators = this.analyzeBehaviorIndicators(interactions);

    // Calculate style scores
    const scores = this.calculateStyleScores(formatStats, behaviorIndicators);

    // Determine primary and secondary styles
    const sortedStyles = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([style]) => style as keyof typeof scores);

    const primaryStyle = sortedStyles[0] as AdaptiveLearningStyle;
    const secondaryStyleKey = sortedStyles[1];
    const secondaryStyle = secondaryStyleKey && scores[secondaryStyleKey] > 20
      ? (secondaryStyleKey as AdaptiveLearningStyle)
      : undefined;

    // Calculate confidence based on data quality
    const confidence = Math.min(0.95, 0.3 + interactions.length * 0.01);

    // Generate evidence
    const evidence = this.generateStyleEvidence(formatStats, behaviorIndicators);

    return {
      primaryStyle,
      secondaryStyle,
      scores,
      confidence,
      evidence,
      recommendations: this.getStyleRecommendations(primaryStyle),
    };
  }

  /**
   * Get or create learner profile
   */
  async getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile> {
    if (this.database) {
      const existing = await this.database.getLearnerProfile(userId);
      if (existing) return existing;
    }

    // Create default profile
    const styleResult = await this.detectLearningStyle(userId);

    const profile: AdaptiveLearnerProfile = {
      userId,
      primaryStyle: styleResult.primaryStyle,
      secondaryStyle: styleResult.secondaryStyle,
      styleScores: styleResult.scores,
      preferredFormats: this.getFormatsForStyle(styleResult.primaryStyle),
      preferredComplexity: 'standard',
      readingPace: 'moderate',
      preferredSessionDuration: 25,
      knownConcepts: [],
      conceptsInProgress: [],
      strugglingAreas: [],
      confidence: styleResult.confidence,
      lastUpdated: new Date(),
    };

    if (this.database) {
      await this.database.saveLearnerProfile(profile);
    }

    return profile;
  }

  /**
   * Update learner profile from recent interactions
   */
  async updateProfileFromInteractions(userId: string): Promise<AdaptiveLearnerProfile> {
    const currentProfile = await this.getLearnerProfile(userId);
    const newStyleResult = await this.detectLearningStyle(userId);

    // Blend old and new scores (70% new, 30% old for stability)
    const blendedScores = {
      visual: currentProfile.styleScores.visual * 0.3 + newStyleResult.scores.visual * 0.7,
      auditory: currentProfile.styleScores.auditory * 0.3 + newStyleResult.scores.auditory * 0.7,
      reading: currentProfile.styleScores.reading * 0.3 + newStyleResult.scores.reading * 0.7,
      kinesthetic: currentProfile.styleScores.kinesthetic * 0.3 + newStyleResult.scores.kinesthetic * 0.7,
    };

    const updatedProfile: AdaptiveLearnerProfile = {
      ...currentProfile,
      primaryStyle: newStyleResult.primaryStyle,
      secondaryStyle: newStyleResult.secondaryStyle,
      styleScores: blendedScores,
      preferredFormats: this.getFormatsForStyle(newStyleResult.primaryStyle),
      confidence: newStyleResult.confidence,
      lastUpdated: new Date(),
    };

    if (this.database) {
      await this.database.saveLearnerProfile(updatedProfile);
    }

    return updatedProfile;
  }

  /**
   * Record a content interaction
   */
  async recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<void> {
    if (this.database) {
      await this.database.recordInteraction(interaction);
    }
  }

  /**
   * Get content recommendations based on profile
   */
  async getContentRecommendations(
    profile: AdaptiveLearnerProfile,
    currentTopic: string,
    count: number = 5
  ): Promise<SupplementaryResource[]> {
    const resources = this.getSupplementaryForStyle(currentTopic, profile.primaryStyle);

    // Add resources for secondary style if available
    if (profile.secondaryStyle) {
      resources.push(...this.getSupplementaryForStyle(currentTopic, profile.secondaryStyle));
    }

    // Sort by relevance and return top N
    return resources
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, count);
  }

  /**
   * Get style-specific tips
   */
  getStyleTips(style: AdaptiveLearningStyle): string[] {
    switch (style) {
      case 'visual':
        return [
          'Focus on diagrams, charts, and visual representations',
          'Use color coding in your notes',
          'Create mind maps to connect concepts',
          'Watch video demonstrations before reading text',
          'Draw flowcharts for processes',
        ];
      case 'auditory':
        return [
          'Listen to explanations and discussions',
          'Read content aloud to yourself',
          'Join study groups for verbal exchange',
          'Use text-to-speech for reading materials',
          'Record yourself explaining concepts',
        ];
      case 'reading':
        return [
          'Read detailed documentation and articles',
          'Take comprehensive written notes',
          'Create written summaries in your own words',
          'Use highlighted text and annotations',
          'Write practice questions for yourself',
        ];
      case 'kinesthetic':
        return [
          'Practice with hands-on exercises immediately',
          'Build projects to apply concepts',
          'Take breaks and move while studying',
          'Use interactive simulations',
          'Teach concepts to others through demonstration',
        ];
      case 'multimodal':
      default:
        return [
          'Combine multiple learning methods',
          'Switch between videos, text, and practice',
          'Find what works best for each topic',
          'Use variety to maintain engagement',
          'Adapt your approach based on content type',
        ];
    }
  }

  // Private helper methods

  private createAdaptedChunks(
    content: ContentToAdapt,
    style: AdaptiveLearningStyle,
    complexity: ContentComplexity,
    targetFormat?: ContentFormat
  ): AdaptedChunk[] {
    const chunks: AdaptedChunk[] = [];
    const format = targetFormat || this.getFormatsForStyle(style)[0];

    // Main content chunk
    chunks.push({
      id: `chunk_main_${Date.now()}`,
      type: 'main',
      content: this.transformForStyle(content.content, style, complexity),
      format,
      order: 1,
      estimatedTime: this.estimateReadingTime(content.content, style),
      isEssential: true,
    });

    // Summary chunk for visual/reading learners
    if (style === 'visual' || style === 'reading') {
      chunks.push({
        id: `chunk_summary_${Date.now()}`,
        type: 'summary',
        content: this.generateSummary(content, style),
        format: style === 'visual' ? 'infographic' : 'text',
        order: 2,
        estimatedTime: 2,
        isEssential: true,
      });
    }

    // Example chunk for kinesthetic learners
    if (style === 'kinesthetic') {
      chunks.push({
        id: `chunk_example_${Date.now()}`,
        type: 'example',
        content: this.generatePracticalExample(content),
        format: 'interactive',
        order: 2,
        estimatedTime: 5,
        isEssential: true,
      });
    }

    // Practice chunk
    chunks.push({
      id: `chunk_practice_${Date.now()}`,
      type: 'practice',
      content: this.generatePracticeActivity(content, style),
      format: 'interactive',
      order: chunks.length + 1,
      estimatedTime: 5,
      isEssential: false,
    });

    return chunks;
  }

  private transformForStyle(
    content: string,
    style: AdaptiveLearningStyle,
    complexity: ContentComplexity
  ): string {
    let transformed = content;

    // Adjust complexity
    switch (complexity) {
      case 'simplified':
        transformed = this.simplifyContent(transformed);
        break;
      case 'detailed':
        transformed = this.expandContent(transformed);
        break;
      case 'expert':
        transformed = this.addTechnicalDetails(transformed);
        break;
    }

    // Add style-specific elements
    switch (style) {
      case 'visual':
        transformed = this.addVisualCues(transformed);
        break;
      case 'auditory':
        transformed = this.addAuditoryGuidance(transformed);
        break;
      case 'kinesthetic':
        transformed = this.addActionPoints(transformed);
        break;
    }

    return transformed;
  }

  private simplifyContent(content: string): string {
    // Simplify by breaking into shorter sentences and using simpler vocabulary
    return content
      .replace(/furthermore/gi, 'also')
      .replace(/however/gi, 'but')
      .replace(/consequently/gi, 'so')
      .replace(/utilize/gi, 'use')
      .replace(/implement/gi, 'do')
      .replace(/demonstrate/gi, 'show');
  }

  private expandContent(content: string): string {
    return `${content}\n\n**Additional Details:**\nThis concept builds on fundamental principles and has several practical applications. Understanding the nuances helps in applying it effectively in real-world scenarios.`;
  }

  private addTechnicalDetails(content: string): string {
    return `${content}\n\n**Technical Depth:**\nFor advanced practitioners, consider the underlying mechanisms, edge cases, and optimization strategies related to this topic.`;
  }

  private addVisualCues(content: string): string {
    return `📊 **Visual Guide:**\n\n${content}\n\n💡 **Key Visual:** Imagine this concept as a flowchart or diagram connecting the main ideas.`;
  }

  private addAuditoryGuidance(content: string): string {
    return `🎧 **Listen & Learn:**\n\n${content}\n\n🗣️ **Try This:** Read the key points aloud to reinforce understanding.`;
  }

  private addActionPoints(content: string): string {
    return `🔧 **Hands-On Learning:**\n\n${content}\n\n✋ **Take Action:** Try applying this concept immediately with a small exercise or example.`;
  }

  private generateSummary(content: ContentToAdapt, style: AdaptiveLearningStyle): string {
    const baseContent = content.content.substring(0, 500);

    switch (style) {
      case 'visual':
        return `📌 **Quick Overview:**\n\n• Topic: ${content.topic}\n• Key Focus: ${content.title || 'Understanding core concepts'}\n• Visual Tip: Create a mind map of the main ideas`;
      case 'auditory':
        return `🎯 **Summary to Read Aloud:**\n\nThis section covers ${content.topic}. The main takeaway is understanding how the concepts connect and apply to real situations.`;
      case 'kinesthetic':
        return `🎯 **Action Summary:**\n\nAfter learning about ${content.topic}, try:\n1. Apply one concept immediately\n2. Create a small project\n3. Teach it to someone else`;
      default:
        return `📝 **Summary:**\n\n${baseContent}...`;
    }
  }

  private extractKeyTakeaways(content: ContentToAdapt): string[] {
    return [
      `Understanding ${content.topic} is foundational for advanced concepts`,
      `Key concepts: ${content.concepts.slice(0, 3).join(', ')}`,
      `Prerequisites include: ${content.prerequisites.slice(0, 2).join(', ') || 'None'}`,
    ];
  }

  private generateKnowledgeChecks(
    content: ContentToAdapt,
    chunks: AdaptedChunk[]
  ): EmbeddedKnowledgeCheck[] {
    const mainChunk = chunks.find((c) => c.type === 'main');
    if (!mainChunk) return [];

    return content.concepts.slice(0, 2).map((concept, idx) => ({
      id: `check_${Date.now()}_${idx}`,
      question: `Can you explain the key aspect of ${concept} in your own words?`,
      correctAnswer: `A correct answer would demonstrate understanding of ${concept} and its role in ${content.topic}.`,
      concept,
      afterChunkId: mainChunk.id,
    }));
  }

  private generatePracticalExample(content: ContentToAdapt): string {
    return `**Practical Exercise for ${content.topic}:**\n\n1. Start with a simple task\n2. Apply the concept step by step\n3. Verify your understanding\n4. Try a more complex variation`;
  }

  private generatePracticeActivity(content: ContentToAdapt, style: AdaptiveLearningStyle): string {
    switch (style) {
      case 'visual':
        return `Create a diagram or visual representation of ${content.topic}. Include the main concepts and their relationships.`;
      case 'auditory':
        return `Explain ${content.topic} out loud as if you were teaching it to someone. Record yourself and listen back.`;
      case 'reading':
        return `Write a short summary (100-150 words) of ${content.topic} in your own words. Include examples.`;
      case 'kinesthetic':
        return `Build a small project or exercise that demonstrates ${content.topic}. Focus on hands-on application.`;
      default:
        return `Review ${content.topic} using your preferred method. Quiz yourself on the key concepts.`;
    }
  }

  private getSupplementaryForStyle(
    topic: string,
    style: AdaptiveLearningStyle
  ): SupplementaryResource[] {
    const resources: SupplementaryResource[] = [];

    switch (style) {
      case 'visual':
        resources.push({
          id: `supp_visual_${Date.now()}`,
          type: 'video',
          title: `Video Explanation: ${topic}`,
          description: 'Visual walkthrough of key concepts',
          resource: `https://example.com/video/${topic}`,
          relevance: 0.9,
          targetStyle: 'visual',
        });
        break;
      case 'auditory':
        resources.push({
          id: `supp_audio_${Date.now()}`,
          type: 'article',
          title: `Podcast Discussion: ${topic}`,
          description: 'Audio discussion of the topic',
          resource: `https://example.com/podcast/${topic}`,
          relevance: 0.9,
          targetStyle: 'auditory',
        });
        break;
      case 'kinesthetic':
        resources.push({
          id: `supp_interactive_${Date.now()}`,
          type: 'interactive',
          title: `Interactive Lab: ${topic}`,
          description: 'Hands-on practice exercises',
          resource: `https://example.com/lab/${topic}`,
          relevance: 0.9,
          targetStyle: 'kinesthetic',
        });
        break;
      default:
        resources.push({
          id: `supp_article_${Date.now()}`,
          type: 'article',
          title: `Deep Dive: ${topic}`,
          description: 'Comprehensive article on the topic',
          resource: `https://example.com/article/${topic}`,
          relevance: 0.8,
          targetStyle: 'reading',
        });
    }

    return resources;
  }

  private createScaffolding(
    prerequisites: string[],
    knownConcepts: string[]
  ): { concept: string; explanation: string; examples: string[] }[] {
    const unknownPrereqs = prerequisites.filter((p) => !knownConcepts.includes(p));

    return unknownPrereqs.map((concept) => ({
      concept,
      explanation: `Before continuing, it's helpful to understand ${concept}. This forms the foundation for what you're about to learn.`,
      examples: [
        `Think of ${concept} as a building block for more complex ideas`,
        `In practice, ${concept} is used when...`,
      ],
    }));
  }

  private analyzeFormatPreferences(
    interactions: ContentInteractionData[]
  ): Map<ContentFormat, { count: number; avgTime: number; completion: number }> {
    const stats = new Map<ContentFormat, { count: number; totalTime: number; completed: number }>();

    interactions.forEach((i) => {
      const current = stats.get(i.format) || { count: 0, totalTime: 0, completed: 0 };
      stats.set(i.format, {
        count: current.count + 1,
        totalTime: current.totalTime + i.timeSpent,
        completed: current.completed + (i.completed ? 1 : 0),
      });
    });

    const result = new Map<ContentFormat, { count: number; avgTime: number; completion: number }>();
    stats.forEach((value, key) => {
      result.set(key, {
        count: value.count,
        avgTime: value.totalTime / value.count,
        completion: value.completed / value.count,
      });
    });

    return result;
  }

  private analyzeBehaviorIndicators(
    interactions: ContentInteractionData[]
  ): { notesTaken: number; replays: number; pauses: number; highScroll: number } {
    let notesTaken = 0;
    let replays = 0;
    let pauses = 0;
    let highScroll = 0;

    interactions.forEach((i) => {
      if (i.notesTaken) notesTaken++;
      if (i.replayCount && i.replayCount > 0) replays++;
      if (i.pauseCount && i.pauseCount > 2) pauses++;
      if (i.scrollDepth > 80) highScroll++;
    });

    return { notesTaken, replays, pauses, highScroll };
  }

  private calculateStyleScores(
    formatStats: Map<ContentFormat, { count: number; avgTime: number; completion: number }>,
    behaviors: { notesTaken: number; replays: number; pauses: number; highScroll: number }
  ): { visual: number; auditory: number; reading: number; kinesthetic: number } {
    let visual = 25;
    let auditory = 25;
    let reading = 25;
    let kinesthetic = 25;

    // Adjust based on format preferences
    const videoStats = formatStats.get('video');
    const textStats = formatStats.get('text');
    const interactiveStats = formatStats.get('interactive');
    const audioStats = formatStats.get('audio');

    if (videoStats && videoStats.completion > 0.7) visual += 20;
    if (textStats && textStats.completion > 0.7) reading += 20;
    if (interactiveStats && interactiveStats.completion > 0.7) kinesthetic += 20;
    if (audioStats && audioStats.completion > 0.7) auditory += 20;

    // Adjust based on behaviors
    if (behaviors.notesTaken > 5) reading += 10;
    if (behaviors.replays > 3) auditory += 10;
    if (behaviors.highScroll > 5) reading += 5;

    // Normalize to 100
    const total = visual + auditory + reading + kinesthetic;
    return {
      visual: Math.round((visual / total) * 100),
      auditory: Math.round((auditory / total) * 100),
      reading: Math.round((reading / total) * 100),
      kinesthetic: Math.round((kinesthetic / total) * 100),
    };
  }

  private generateStyleEvidence(
    formatStats: Map<ContentFormat, { count: number; avgTime: number; completion: number }>,
    behaviors: { notesTaken: number; replays: number; pauses: number; highScroll: number }
  ): { factor: string; weight: number; contribution: AdaptiveLearningStyle }[] {
    const evidence: { factor: string; weight: number; contribution: AdaptiveLearningStyle }[] = [];

    const videoStats = formatStats.get('video');
    if (videoStats && videoStats.completion > 0.6) {
      evidence.push({ factor: 'High video completion rate', weight: 0.8, contribution: 'visual' });
    }

    if (behaviors.notesTaken > 3) {
      evidence.push({ factor: 'Frequent note-taking', weight: 0.7, contribution: 'reading' });
    }

    if (behaviors.replays > 2) {
      evidence.push({ factor: 'Content replay behavior', weight: 0.6, contribution: 'auditory' });
    }

    return evidence;
  }

  private getFormatsForStyle(style: AdaptiveLearningStyle): ContentFormat[] {
    switch (style) {
      case 'visual':
        return ['video', 'diagram', 'infographic'];
      case 'auditory':
        return ['audio', 'video', 'text'];
      case 'reading':
        return ['text', 'code_example', 'case_study'];
      case 'kinesthetic':
        return ['interactive', 'simulation', 'quiz'];
      default:
        return ['text', 'video', 'interactive'];
    }
  }

  private getStyleRecommendations(style: AdaptiveLearningStyle): string[] {
    return this.getStyleTips(style);
  }

  private estimateReadingTime(content: string, style: AdaptiveLearningStyle): number {
    const wordCount = content.split(/\s+/).length;
    const baseTime = wordCount / 200; // 200 words per minute average

    // Adjust for style
    switch (style) {
      case 'visual':
        return Math.ceil(baseTime * 1.2); // Visual learners may take longer with text
      case 'reading':
        return Math.ceil(baseTime * 0.8); // Reading learners are faster
      default:
        return Math.ceil(baseTime);
    }
  }

  private getDefaultStyleResult(): StyleDetectionResult {
    return {
      primaryStyle: 'multimodal',
      scores: { visual: 25, auditory: 25, reading: 25, kinesthetic: 25 },
      confidence: 0.3,
      evidence: [],
      recommendations: this.getStyleTips('multimodal'),
    };
  }

  private buildAdaptationPrompt(
    content: ContentToAdapt,
    profile: AdaptiveLearnerProfile,
    options: AdaptationOptions
  ): string {
    return `
Adapt the following educational content for a ${profile.primaryStyle} learner at ${profile.preferredComplexity} complexity level.

**Original Content:**
${content.content}

**Topic:** ${content.topic}
**Learner Profile:**
- Primary Style: ${profile.primaryStyle}
- Secondary Style: ${profile.secondaryStyle || 'None'}
- Preferred Complexity: ${profile.preferredComplexity}
- Known Concepts: ${profile.knownConcepts.join(', ') || 'None specified'}

**Adaptation Requirements:**
- Include supplementary resources: ${options.includeSupplementary}
- Include knowledge checks: ${options.includeKnowledgeChecks}
- Add scaffolding for prerequisites: ${options.addScaffolding}

Respond with JSON:
{
  "chunks": [
    {"type": "main", "content": "adapted content", "format": "text", "estimatedTime": 5}
  ],
  "summary": "brief summary",
  "keyTakeaways": ["takeaway1", "takeaway2"],
  "knowledgeChecks": [{"question": "...", "correctAnswer": "...", "concept": "..."}]
}
`;
  }

  private parseAdaptedContent(
    response: string,
    content: ContentToAdapt,
    profile: AdaptiveLearnerProfile,
    options: AdaptationOptions
  ): AdaptedContent {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);

      return {
        originalId: content.id,
        chunks: (parsed.chunks || []).map((c: Record<string, unknown>, i: number) => ({
          id: `chunk_${Date.now()}_${i}`,
          type: c.type || 'main',
          content: c.content || '',
          format: c.format || 'text',
          order: i + 1,
          estimatedTime: c.estimatedTime || 5,
          isEssential: c.type === 'main',
        })),
        summary: parsed.summary || '',
        keyTakeaways: parsed.keyTakeaways || [],
        knowledgeChecks: (parsed.knowledgeChecks || []).map((k: Record<string, unknown>, i: number) => ({
          id: `check_${Date.now()}_${i}`,
          question: k.question || '',
          correctAnswer: k.correctAnswer || '',
          concept: k.concept || '',
          afterChunkId: `chunk_${Date.now()}_0`,
        })),
        supplementaryResources: this.getSupplementaryForStyle(content.topic, profile.primaryStyle),
        estimatedTotalTime: parsed.chunks?.reduce((sum: number, c: Record<string, unknown>) => sum + ((c.estimatedTime as number) || 5), 0) || 10,
        adaptationInfo: {
          targetStyle: options.targetStyle || profile.primaryStyle,
          targetComplexity: options.targetComplexity || profile.preferredComplexity,
          adaptedAt: new Date(),
          confidence: profile.confidence,
        },
      };
    } catch {
      // Fallback to default adapted content
      return {
        originalId: content.id,
        chunks: this.createAdaptedChunks(
          content,
          options.targetStyle || profile.primaryStyle,
          options.targetComplexity || profile.preferredComplexity,
          options.targetFormat
        ),
        summary: this.generateSummary(content, options.targetStyle || profile.primaryStyle),
        keyTakeaways: this.extractKeyTakeaways(content),
        knowledgeChecks: [],
        supplementaryResources: this.getSupplementaryForStyle(content.topic, profile.primaryStyle),
        estimatedTotalTime: 10,
        adaptationInfo: {
          targetStyle: options.targetStyle || profile.primaryStyle,
          targetComplexity: options.targetComplexity || profile.preferredComplexity,
          adaptedAt: new Date(),
          confidence: profile.confidence,
        },
      };
    }
  }
}

/**
 * Factory function to create an AdaptiveContentEngine instance
 */
export function createAdaptiveContentEngine(config?: AdaptiveContentConfig): AdaptiveContentEngine {
  return new AdaptiveContentEngine(config);
}
