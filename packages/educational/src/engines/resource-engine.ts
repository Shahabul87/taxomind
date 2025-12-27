/**
 * @sam-ai/educational - Resource Engine
 * Portable resource discovery and recommendation engine
 */

import type {
  ResourceEngineConfig,
  TopicForResource,
  ExternalResource,
  ResourceType,
  QualityScore,
  QualityFactor,
  LicenseStatus,
  ROIAnalysis,
  AlternativeResource,
  ResourceRecommendation,
  StudentResourceProfile,
  ResourceDiscoveryConfig,
  ResourceEngine as IResourceEngine,
} from '../types';

export class ResourceEngine implements IResourceEngine {
  private resourceCache = new Map<string, ExternalResource[]>();
  private qualityCache = new Map<string, QualityScore>();

  constructor(private config: ResourceEngineConfig) {}

  /**
   * Discover external resources for a topic
   */
  async discoverResources(
    topic: TopicForResource,
    discoveryConfig?: ResourceDiscoveryConfig
  ): Promise<ExternalResource[]> {
    const cacheKey = this.generateCacheKey(topic, discoveryConfig);

    // Check cache first
    if (this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey)!;
    }

    // Discover from multiple sources
    const resources = await this.searchMultipleSources(topic, discoveryConfig);

    // Filter by quality threshold
    const qualityThreshold = discoveryConfig?.qualityThreshold || 0.7;
    const qualityResources: ExternalResource[] = [];

    for (const resource of resources) {
      const quality = await this.scoreResourceQuality(resource);
      if (quality.overall >= qualityThreshold) {
        resource.qualityScore = quality.overall;
        qualityResources.push(resource);
      }
    }

    // Sort by quality and relevance
    qualityResources.sort((a, b) => {
      const scoreA = (a.qualityScore || 0) * 0.5 + (a.relevanceScore || 0) * 0.5;
      const scoreB = (b.qualityScore || 0) * 0.5 + (b.relevanceScore || 0) * 0.5;
      return scoreB - scoreA;
    });

    // Limit results
    const limitedResources = qualityResources.slice(0, discoveryConfig?.maxResults || 20);

    // Cache results
    this.resourceCache.set(cacheKey, limitedResources);

    return limitedResources;
  }

  /**
   * Score resource quality
   */
  async scoreResourceQuality(resource: ExternalResource): Promise<QualityScore> {
    // Check quality cache
    const cacheKey = resource.url;
    if (this.qualityCache.has(cacheKey)) {
      return this.qualityCache.get(cacheKey)!;
    }

    const factors: QualityFactor[] = [];

    // Relevance scoring
    const relevance = await this.calculateRelevance(resource);
    factors.push({
      name: 'Relevance',
      score: relevance,
      weight: 0.25,
      description: 'How well the resource matches the topic',
    });

    // Authority scoring
    const authority = this.calculateAuthority(resource);
    factors.push({
      name: 'Authority',
      score: authority,
      weight: 0.2,
      description: 'Credibility of the source and author',
    });

    // Recency scoring
    const recency = this.calculateRecency(resource);
    factors.push({
      name: 'Recency',
      score: recency,
      weight: 0.15,
      description: 'How up-to-date the resource is',
    });

    // Completeness scoring
    const completeness = this.calculateCompleteness(resource);
    factors.push({
      name: 'Completeness',
      score: completeness,
      weight: 0.15,
      description: 'Coverage of the topic',
    });

    // Clarity scoring
    const clarity = await this.calculateClarity(resource);
    factors.push({
      name: 'Clarity',
      score: clarity,
      weight: 0.15,
      description: 'Ease of understanding',
    });

    // Engagement scoring
    const engagement = this.calculateEngagement(resource);
    factors.push({
      name: 'Engagement',
      score: engagement,
      weight: 0.1,
      description: 'Interactive and engaging elements',
    });

    // Calculate overall score
    const overall = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0);

    const qualityScore: QualityScore = {
      overall,
      relevance,
      accuracy: authority,
      completeness,
      clarity,
      engagement,
      authority,
      recency,
      factors,
    };

    // Cache quality score
    this.qualityCache.set(cacheKey, qualityScore);

    return qualityScore;
  }

  /**
   * Check license compatibility
   */
  async checkLicenseCompatibility(
    resource: ExternalResource,
    intendedUse?: string
  ): Promise<LicenseStatus> {
    const license = resource.license;

    if (!license) {
      return {
        compatible: false,
        restrictions: ['No license information available'],
        recommendations: ['Contact the author for licensing information'],
      };
    }

    const restrictions: string[] = [];
    const recommendations: string[] = [];

    if (license.attribution && !intendedUse?.includes('personal')) {
      restrictions.push('Attribution required');
      recommendations.push('Include proper attribution when using this resource');
    }

    if (!license.commercialUse && intendedUse?.includes('commercial')) {
      restrictions.push('No commercial use allowed');
      recommendations.push('Find alternative resources for commercial purposes');
    }

    if (!license.modifications && intendedUse?.includes('modify')) {
      restrictions.push('No modifications allowed');
      recommendations.push('Use the resource as-is or find alternatives');
    }

    if (license.shareAlike) {
      restrictions.push('Share-alike requirement');
      recommendations.push('Any derivative work must use the same license');
    }

    const compatible =
      restrictions.length === 0 ||
      (restrictions.length === 1 && restrictions[0].includes('Attribution'));

    const alternativeLicenses = !compatible
      ? this.suggestAlternativeLicenses(intendedUse)
      : undefined;

    return {
      compatible,
      restrictions,
      recommendations,
      alternativeLicenses,
    };
  }

  /**
   * Analyze resource ROI
   */
  async analyzeResourceROI(
    resource: ExternalResource,
    learnerProfile?: StudentResourceProfile
  ): Promise<ROIAnalysis> {
    // Calculate cost-benefit ratio
    const costBenefitRatio = await this.calculateCostBenefitRatio(resource, learnerProfile);

    // Estimate time to value
    const timeToValue = this.estimateTimeToValue(resource);

    // Calculate learning efficiency
    const learningEfficiency = await this.calculateLearningEfficiency(resource, learnerProfile);

    // Find and compare alternatives
    const alternatives = await this.findAlternatives(resource);
    const alternativeComparison = await this.compareAlternatives(resource, alternatives);

    // Determine recommendation
    const recommendation = this.determineRecommendation(
      costBenefitRatio,
      learningEfficiency,
      alternativeComparison
    );

    // Generate justification
    const justification = await this.generateROIJustification(
      resource,
      costBenefitRatio,
      learningEfficiency,
      recommendation
    );

    return {
      costBenefitRatio,
      timeToValue,
      learningEfficiency,
      alternativeComparison,
      recommendation,
      justification,
    };
  }

  /**
   * Personalize recommendations for a student
   */
  async personalizeRecommendations(
    student: StudentResourceProfile,
    resources: ExternalResource[]
  ): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    for (const resource of resources) {
      // Calculate match score
      const matchScore = await this.calculateMatchScore(resource, student);

      // Generate personalized reasons
      const reasons = this.generateMatchReasons(resource, student);

      // Create personalized notes
      const personalizedNotes = await this.generatePersonalizedNotes(resource, student);

      // Suggest usage pattern
      const suggestedUsage = this.suggestUsagePattern(resource, student);

      // Identify prerequisites
      const prerequisites = this.identifyPrerequisites(resource, student);

      // Suggest next steps
      const nextSteps = this.suggestNextSteps(resource);

      recommendations.push({
        resource,
        matchScore,
        reasons,
        personalizedNotes,
        suggestedUsage,
        prerequisites,
        nextSteps,
      });
    }

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return recommendations;
  }

  /**
   * Get resource recommendations for a user
   */
  async getResourceRecommendations(
    userId: string,
    topic: string
  ): Promise<ResourceRecommendation[]> {
    // Build user profile (simplified)
    const profile = this.buildDefaultProfile(userId);

    // Create topic object
    const topicObj: TopicForResource = {
      id: `topic-${Date.now()}`,
      name: topic,
      category: 'general',
      keywords: topic.split(' '),
      difficulty: 'medium',
    };

    // Discover resources
    const resources = await this.discoverResources(topicObj);

    // Personalize recommendations
    return await this.personalizeRecommendations(profile, resources);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async searchMultipleSources(
    topic: TopicForResource,
    config?: ResourceDiscoveryConfig
  ): Promise<ExternalResource[]> {
    const sources = config?.sources || ['youtube', 'coursera', 'medium', 'github'];
    const allResources: ExternalResource[] = [];

    const searchPromises = sources.map((source) => this.searchSource(source, topic, config));
    const results = await Promise.allSettled(searchPromises);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allResources.push(...result.value);
      }
    });

    return allResources;
  }

  private async searchSource(
    source: string,
    topic: TopicForResource,
    config?: ResourceDiscoveryConfig
  ): Promise<ExternalResource[]> {
    // Mock resources - in production, integrate with actual APIs
    const mockResources: ExternalResource[] = [
      {
        id: `${source}-${Date.now()}-1`,
        title: `${topic.name} - Comprehensive Guide`,
        description: `Learn ${topic.name} from scratch with this comprehensive guide`,
        url: `https://${source}.com/resource-1`,
        type: 'article',
        source,
        language: 'en',
        tags: topic.keywords,
        relevanceScore: 0.9,
        license: {
          type: 'CC-BY-4.0',
          commercialUse: true,
          attribution: true,
          shareAlike: false,
          modifications: true,
        },
        cost: {
          type: 'free',
        },
      },
      {
        id: `${source}-${Date.now()}-2`,
        title: `Advanced ${topic.name} Techniques`,
        description: `Master advanced concepts in ${topic.name}`,
        url: `https://${source}.com/resource-2`,
        type: 'video',
        source,
        language: 'en',
        duration: 45,
        tags: [...topic.keywords, 'advanced'],
        relevanceScore: 0.85,
        cost: {
          type: 'freemium',
          amount: 9.99,
          currency: 'USD',
        },
      },
    ];

    return mockResources;
  }

  private async calculateRelevance(resource: ExternalResource): Promise<number> {
    const prompt = `
      Rate the relevance of this resource on a scale of 0-1:
      Title: ${resource.title}
      Description: ${resource.description}
      Tags: ${resource.tags.join(', ')}

      Consider title match, description relevance, and tag alignment.
      Return only a decimal number between 0 and 1.
    `;

    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 50,
      });

      const relevance = parseFloat(response.content);
      return isNaN(relevance) ? resource.relevanceScore || 0.7 : Math.max(0, Math.min(1, relevance));
    } catch {
      return resource.relevanceScore || 0.7;
    }
  }

  private calculateAuthority(resource: ExternalResource): number {
    const sourceScores: Record<string, number> = {
      coursera: 0.95,
      edx: 0.95,
      udacity: 0.9,
      'khan-academy': 0.95,
      'mit-ocw': 1.0,
      youtube: 0.7,
      medium: 0.75,
      github: 0.85,
      arxiv: 0.9,
      ieee: 0.95,
    };

    const baseScore = sourceScores[resource.source.toLowerCase()] || 0.6;
    const authorBonus = resource.author ? 0.05 : 0;

    return Math.min(1, baseScore + authorBonus);
  }

  private calculateRecency(resource: ExternalResource): number {
    if (!resource.lastUpdated && !resource.publishedDate) {
      return 0.5;
    }

    const date = resource.lastUpdated || resource.publishedDate!;
    const ageInDays = Math.floor(
      (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ageInDays < 30) return 1.0;
    if (ageInDays < 90) return 0.9;
    if (ageInDays < 180) return 0.8;
    if (ageInDays < 365) return 0.7;
    if (ageInDays < 730) return 0.5;
    return 0.3;
  }

  private calculateCompleteness(resource: ExternalResource): number {
    const typeCompleteness: Record<ResourceType, number> = {
      course: 0.9,
      book: 0.95,
      tutorial: 0.8,
      article: 0.7,
      video: 0.75,
      podcast: 0.65,
      documentation: 0.85,
      tool: 0.6,
      dataset: 0.7,
      'research-paper': 0.9,
    };

    let score = typeCompleteness[resource.type] || 0.7;

    if (resource.duration) {
      if (resource.duration > 60) score += 0.1;
      if (resource.duration > 120) score += 0.05;
    }

    return Math.min(1, score);
  }

  private async calculateClarity(resource: ExternalResource): Promise<number> {
    const prompt = `
      Rate the clarity of this educational resource based on its description:
      "${resource.description}"

      Consider: clear language, structured approach, target audience appropriateness.
      Return only a decimal number between 0 and 1.
    `;

    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 50,
      });

      const clarity = parseFloat(response.content);
      return isNaN(clarity) ? 0.8 : Math.max(0, Math.min(1, clarity));
    } catch {
      return 0.8;
    }
  }

  private calculateEngagement(resource: ExternalResource): number {
    const typeEngagement: Record<ResourceType, number> = {
      video: 0.9,
      course: 0.85,
      tutorial: 0.8,
      tool: 0.95,
      podcast: 0.7,
      article: 0.6,
      book: 0.5,
      documentation: 0.4,
      dataset: 0.6,
      'research-paper': 0.3,
    };

    return typeEngagement[resource.type] || 0.5;
  }

  private suggestAlternativeLicenses(intendedUse?: string): string[] {
    const alternatives: string[] = [];

    if (intendedUse?.includes('commercial')) {
      alternatives.push('MIT', 'Apache-2.0', 'BSD-3-Clause');
    }

    if (intendedUse?.includes('modify')) {
      alternatives.push('MIT', 'Apache-2.0', 'GPL-3.0');
    }

    if (intendedUse?.includes('educational')) {
      alternatives.push('CC-BY-4.0', 'CC-BY-SA-4.0', 'OER Commons');
    }

    return alternatives.length > 0 ? alternatives : ['CC0-1.0', 'MIT', 'CC-BY-4.0'];
  }

  private async calculateCostBenefitRatio(
    resource: ExternalResource,
    profile?: StudentResourceProfile
  ): Promise<number> {
    let cost = 0;
    if (resource.cost) {
      if (resource.cost.type === 'paid') {
        cost = resource.cost.amount || 0;
      } else if (resource.cost.type === 'subscription') {
        cost = (resource.cost.amount || 0) / 30;
      }
    }

    const qualityScore = await this.scoreResourceQuality(resource);
    const benefit = qualityScore.overall * 100;

    if (profile?.budgetConstraints && cost > profile.budgetConstraints.max) {
      return 0;
    }

    return cost === 0 ? benefit : benefit / cost;
  }

  private estimateTimeToValue(resource: ExternalResource): number {
    const baseTime: Record<ResourceType, number> = {
      tool: 0.5,
      article: 1,
      video: 2,
      tutorial: 3,
      podcast: 2,
      course: 20,
      book: 40,
      documentation: 5,
      dataset: 2,
      'research-paper': 4,
    };

    let timeToValue = baseTime[resource.type] || 5;

    if (resource.duration) {
      timeToValue = Math.min(timeToValue, resource.duration / 60);
    }

    return timeToValue;
  }

  private async calculateLearningEfficiency(
    resource: ExternalResource,
    profile?: StudentResourceProfile
  ): Promise<number> {
    const quality = await this.scoreResourceQuality(resource);
    const timeToValue = this.estimateTimeToValue(resource);

    let efficiency = quality.overall / Math.max(1, timeToValue);

    if (profile) {
      if (profile.preferredTypes.includes(resource.type)) {
        efficiency *= 1.2;
      }

      if (
        resource.duration &&
        resource.duration >= profile.preferredDuration.min &&
        resource.duration <= profile.preferredDuration.max
      ) {
        efficiency *= 1.1;
      }
    }

    return Math.min(1, efficiency);
  }

  private async findAlternatives(resource: ExternalResource): Promise<ExternalResource[]> {
    const topic: TopicForResource = {
      id: 'alt-search',
      name: resource.title.split('-')[0].trim(),
      category: 'general',
      keywords: resource.tags,
      difficulty: 'medium',
    };

    const alternatives = await this.discoverResources(topic, {
      sources: [resource.source],
      maxResults: 5,
      qualityThreshold: 0.7,
      includeTypes: [resource.type],
      languages: [resource.language],
      costFilter: resource.cost?.type === 'free' ? 'free' : 'any',
    });

    return alternatives.filter((alt) => alt.id !== resource.id);
  }

  private async compareAlternatives(
    resource: ExternalResource,
    alternatives: ExternalResource[]
  ): Promise<AlternativeResource[]> {
    const comparisons: AlternativeResource[] = [];

    for (const alternative of alternatives) {
      const altQuality = await this.scoreResourceQuality(alternative);
      const resQuality = await this.scoreResourceQuality(resource);

      const comparisonScore = altQuality.overall / resQuality.overall;

      const advantages: string[] = [];
      const disadvantages: string[] = [];

      if (altQuality.overall > resQuality.overall) {
        advantages.push('Higher overall quality');
      } else {
        disadvantages.push('Lower overall quality');
      }

      if (!alternative.cost || alternative.cost.type === 'free') {
        if (resource.cost && resource.cost.type !== 'free') {
          advantages.push('Free alternative');
        }
      }

      if (alternative.duration && resource.duration) {
        if (alternative.duration < resource.duration) {
          advantages.push('Shorter time commitment');
        } else {
          disadvantages.push('Longer time commitment');
        }
      }

      comparisons.push({
        resource: alternative,
        comparisonScore,
        advantages,
        disadvantages,
      });
    }

    return comparisons.sort((a, b) => b.comparisonScore - a.comparisonScore);
  }

  private determineRecommendation(
    costBenefitRatio: number,
    learningEfficiency: number,
    alternatives: AlternativeResource[]
  ): 'highly-recommended' | 'recommended' | 'consider-alternatives' | 'not-recommended' {
    const hasBetterAlternatives = alternatives.some((alt) => alt.comparisonScore > 1.2);

    if (costBenefitRatio > 80 && learningEfficiency > 0.8 && !hasBetterAlternatives) {
      return 'highly-recommended';
    }

    if (costBenefitRatio > 50 && learningEfficiency > 0.6) {
      return 'recommended';
    }

    if (hasBetterAlternatives || costBenefitRatio < 30) {
      return 'consider-alternatives';
    }

    return 'not-recommended';
  }

  private async generateROIJustification(
    resource: ExternalResource,
    costBenefitRatio: number,
    learningEfficiency: number,
    recommendation: string
  ): Promise<string> {
    const prompt = `
      Generate a concise justification for this resource recommendation:
      - Resource: ${resource.title}
      - Cost-Benefit Ratio: ${costBenefitRatio.toFixed(2)}
      - Learning Efficiency: ${(learningEfficiency * 100).toFixed(0)}%
      - Recommendation: ${recommendation}

      Explain in 2-3 sentences why this recommendation makes sense.
    `;

    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 150,
      });

      return response.content;
    } catch {
      return `This resource is ${recommendation} based on its cost-benefit ratio of ${costBenefitRatio.toFixed(0)} and learning efficiency of ${(learningEfficiency * 100).toFixed(0)}%.`;
    }
  }

  private async calculateMatchScore(
    resource: ExternalResource,
    student: StudentResourceProfile
  ): Promise<number> {
    let score = 0;
    let factors = 0;

    // Type preference match
    if (student.preferredTypes.includes(resource.type)) {
      score += 0.9;
    } else {
      score += 0.5;
    }
    factors++;

    // Language match
    if (student.languagePreferences.includes(resource.language)) {
      score += 1.0;
    } else {
      score += 0.3;
    }
    factors++;

    // Duration preference match
    if (resource.duration) {
      if (
        resource.duration >= student.preferredDuration.min &&
        resource.duration <= student.preferredDuration.max
      ) {
        score += 0.8;
      } else {
        score += 0.4;
      }
      factors++;
    }

    // Budget match
    if (student.budgetConstraints) {
      if (!resource.cost || resource.cost.type === 'free') {
        score += 1.0;
      } else if (
        resource.cost.amount &&
        resource.cost.amount <= student.budgetConstraints.max
      ) {
        score += 0.7;
      } else {
        score += 0.2;
      }
      factors++;
    }

    // Goal alignment
    const goalAlignment = await this.calculateGoalAlignment(resource, student.learningGoals);
    score += goalAlignment;
    factors++;

    return score / factors;
  }

  private async calculateGoalAlignment(
    resource: ExternalResource,
    goals: string[]
  ): Promise<number> {
    if (goals.length === 0) return 0.5;

    const prompt = `
      Rate how well this resource aligns with these learning goals (0-1):
      Resource: ${resource.title} - ${resource.description}
      Goals: ${goals.join(', ')}

      Return only a decimal number.
    `;

    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 50,
      });

      const alignment = parseFloat(response.content);
      return isNaN(alignment) ? 0.7 : Math.max(0, Math.min(1, alignment));
    } catch {
      return 0.7;
    }
  }

  private generateMatchReasons(
    resource: ExternalResource,
    student: StudentResourceProfile
  ): string[] {
    const reasons: string[] = [];

    if (student.preferredTypes.includes(resource.type)) {
      reasons.push(`Matches your preferred learning format (${resource.type})`);
    }

    if (!resource.cost || resource.cost.type === 'free') {
      reasons.push('Free resource within your budget');
    }

    if (
      resource.duration &&
      resource.duration >= student.preferredDuration.min &&
      resource.duration <= student.preferredDuration.max
    ) {
      reasons.push(`Fits your time preference (${resource.duration} minutes)`);
    }

    if (resource.language === student.languagePreferences[0]) {
      reasons.push(`Available in your preferred language (${resource.language})`);
    }

    return reasons;
  }

  private async generatePersonalizedNotes(
    resource: ExternalResource,
    student: StudentResourceProfile
  ): Promise<string> {
    const prompt = `
      Create a personalized note for this learner about the resource:
      Resource: ${resource.title}
      Learner's skill level: ${student.skillLevel}
      Learner's goals: ${student.learningGoals.join(', ')}

      Write a 1-2 sentence personalized recommendation.
    `;

    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 100,
      });

      return response.content;
    } catch {
      return `This ${resource.type} is suitable for your ${student.skillLevel} level and supports your learning goals.`;
    }
  }

  private suggestUsagePattern(
    resource: ExternalResource,
    _student: StudentResourceProfile
  ): string {
    const patterns: Record<ResourceType, string> = {
      video: 'Watch once for overview, then review key sections',
      article: 'Read thoroughly and take notes on key concepts',
      course: 'Follow the structured path and complete all exercises',
      book: 'Read relevant chapters based on your current needs',
      tutorial: 'Follow along hands-on and practice each step',
      podcast: 'Listen during commute or downtime for reinforcement',
      documentation: 'Use as reference while practicing',
      tool: 'Integrate into your daily learning workflow',
      dataset: 'Use for practical projects and experimentation',
      'research-paper': 'Study methodology and key findings sections',
    };

    return patterns[resource.type] || 'Use as supplementary learning material';
  }

  private identifyPrerequisites(
    resource: ExternalResource,
    student: StudentResourceProfile
  ): string[] {
    const prerequisites: string[] = [];

    const description = resource.description.toLowerCase();

    if (description.includes('advanced') && student.skillLevel === 'beginner') {
      prerequisites.push('Complete intermediate level materials first');
    }

    if (description.includes('prerequisite') || description.includes('requires')) {
      prerequisites.push('Check resource description for specific prerequisites');
    }

    return prerequisites;
  }

  private suggestNextSteps(resource: ExternalResource): string[] {
    const nextSteps: string[] = [];

    switch (resource.type) {
      case 'course':
        nextSteps.push('Complete all modules and assessments');
        nextSteps.push('Apply learned concepts in a project');
        break;

      case 'tutorial':
        nextSteps.push('Practice the demonstrated techniques');
        nextSteps.push('Create your own variation');
        break;

      case 'video':
        nextSteps.push('Take notes on key concepts');
        nextSteps.push('Find practice exercises');
        break;

      case 'article':
        nextSteps.push('Summarize main points');
        nextSteps.push('Research mentioned topics further');
        break;

      default:
        nextSteps.push('Apply what you learned');
        nextSteps.push('Share knowledge with peers');
    }

    return nextSteps;
  }

  private generateCacheKey(topic: TopicForResource, config?: ResourceDiscoveryConfig): string {
    const configStr = config ? JSON.stringify(config) : 'default';
    return `${topic.name}-${topic.category}-${configStr}`;
  }

  private buildDefaultProfile(userId: string): StudentResourceProfile {
    return {
      userId,
      preferredTypes: ['video', 'article', 'tutorial'],
      preferredFormats: ['interactive', 'visual'],
      preferredDuration: { min: 10, max: 60 },
      languagePreferences: ['en'],
      learningGoals: ['skill improvement', 'career advancement'],
      skillLevel: 'intermediate',
    };
  }
}

/**
 * Factory function to create a ResourceEngine instance
 */
export function createResourceEngine(config: ResourceEngineConfig): ResourceEngine {
  return new ResourceEngine(config);
}
