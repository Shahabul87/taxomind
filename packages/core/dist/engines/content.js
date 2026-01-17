/**
 * @sam-ai/core - Content Engine
 * Generates and analyzes course content, guides, and educational materials
 */
import { BaseEngine } from './base';
// ============================================================================
// CONTENT ENGINE
// ============================================================================
export class ContentEngine extends BaseEngine {
    constructor(config) {
        super({
            config,
            name: 'content',
            version: '1.0.0',
            dependencies: ['context'],
            timeout: 45000,
            retries: 2,
            cacheEnabled: true,
            cacheTTL: 30 * 60 * 1000, // 30 minutes
        });
    }
    async performInitialization() {
        this.logger.debug('[ContentEngine] Initialized');
    }
    async process(input) {
        const { query, previousResults } = input;
        // Get Blooms analysis if available
        const bloomsResult = previousResults?.['blooms'];
        // Analyze or generate based on query intent
        if (query?.toLowerCase().includes('generate')) {
            return this.generateContent(input, bloomsResult?.data);
        }
        // Default to analysis mode
        return this.analyzeContent(input, bloomsResult?.data);
    }
    async analyzeContent(input, bloomsData) {
        const { context } = input;
        // Build analysis prompt
        const systemPrompt = this.buildAnalysisSystemPrompt();
        const userPrompt = this.buildAnalysisUserPrompt(context, bloomsData);
        // Call AI
        const response = await this.callAI({
            systemPrompt,
            userMessage: userPrompt,
            maxTokens: 2000,
        });
        // Parse response
        return this.parseAnalysisResponse(response.content, bloomsData);
    }
    async generateContent(input, bloomsData) {
        const { context, query } = input;
        // Determine content type from query
        const contentType = this.extractContentType(query || '');
        // Build generation prompt
        const systemPrompt = this.buildGenerationSystemPrompt();
        const userPrompt = this.buildGenerationUserPrompt(context, contentType, bloomsData);
        // Call AI
        const response = await this.callAI({
            systemPrompt,
            userMessage: userPrompt,
            maxTokens: 3000,
        });
        // Parse and return
        return this.parseGenerationResponse(response.content, contentType, bloomsData);
    }
    buildAnalysisSystemPrompt() {
        return `You are an expert educational content analyst. Analyze course content for quality, depth, and engagement potential.

Provide analysis in the following JSON format:
{
  "metrics": {
    "depth": {
      "contentRichness": <0-100>,
      "topicCoverage": <0-100>,
      "assessmentQuality": <0-100>,
      "learningPathClarity": <0-100>
    },
    "engagement": {
      "estimatedCompletionRate": <0-100>,
      "interactionDensity": <0-100>,
      "varietyScore": <0-100>
    },
    "quality": {
      "structureScore": <0-100>,
      "coherenceScore": <0-100>,
      "accessibilityScore": <0-100>
    }
  },
  "suggestions": [
    {
      "type": "improvement|addition|restructure|enhancement",
      "priority": "high|medium|low",
      "title": "string",
      "description": "string",
      "estimatedImpact": <0-100>
    }
  ],
  "insights": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"]
  },
  "overallScore": <0-100>
}`;
    }
    buildAnalysisUserPrompt(context, bloomsData) {
        let prompt = `Analyze the following educational content context:

Page Type: ${context.page.type}
Entity ID: ${context.page.entityId || 'N/A'}
Path: ${context.page.path}

User Role: ${context.user.role}
`;
        if (bloomsData) {
            prompt += `
Bloom's Analysis Available:
- Dominant Level: ${bloomsData.analysis.dominantLevel}
- Cognitive Depth: ${bloomsData.analysis.cognitiveDepth}
- Balance: ${bloomsData.analysis.balance}
- Gaps: ${bloomsData.analysis.gaps.join(', ') || 'None'}
`;
        }
        prompt += `
Provide a comprehensive content quality analysis with actionable suggestions.`;
        return prompt;
    }
    buildGenerationSystemPrompt() {
        return `You are an expert educational content creator. Generate high-quality educational content that:

1. Aligns with Bloom's Taxonomy cognitive levels
2. Is engaging and accessible
3. Follows best practices in instructional design
4. Includes clear learning objectives
5. Provides practical examples

Return content in structured format with metadata.`;
    }
    buildGenerationUserPrompt(context, contentType, bloomsData) {
        let prompt = `Generate educational content:

Content Type: ${contentType}
Page Context: ${context.page.type}
Entity: ${context.page.entityId || 'New content'}
User Role: ${context.user.role}
`;
        if (context.user.preferences.learningStyle) {
            prompt += `Preferred Learning Style: ${context.user.preferences.learningStyle}\n`;
        }
        if (bloomsData) {
            const targetLevel = this.determineTargetBloomsLevel(bloomsData);
            prompt += `
Target Bloom's Level: ${targetLevel}
Current Gaps: ${bloomsData.analysis.gaps.join(', ') || 'None'}
`;
        }
        prompt += `
Generate comprehensive, well-structured ${contentType} content.`;
        return prompt;
    }
    extractContentType(query) {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('chapter'))
            return 'chapter';
        if (lowerQuery.includes('section'))
            return 'section';
        if (lowerQuery.includes('lesson'))
            return 'lesson';
        if (lowerQuery.includes('quiz'))
            return 'quiz';
        if (lowerQuery.includes('exercise'))
            return 'exercise';
        if (lowerQuery.includes('summary'))
            return 'summary';
        if (lowerQuery.includes('explanation'))
            return 'explanation';
        if (lowerQuery.includes('example'))
            return 'example';
        return 'lesson'; // Default
    }
    determineTargetBloomsLevel(bloomsData) {
        // If there are gaps, target the lowest gap
        if (bloomsData.analysis.gaps.length > 0) {
            return bloomsData.analysis.gaps[0];
        }
        // Otherwise, try to push cognitive depth higher
        const levels = [
            'REMEMBER',
            'UNDERSTAND',
            'APPLY',
            'ANALYZE',
            'EVALUATE',
            'CREATE',
        ];
        const currentIndex = levels.indexOf(bloomsData.analysis.dominantLevel);
        const targetIndex = Math.min(currentIndex + 1, levels.length - 1);
        return levels[targetIndex];
    }
    parseAnalysisResponse(response, bloomsData) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    metrics: parsed.metrics || this.getDefaultMetrics(),
                    suggestions: parsed.suggestions || [],
                    insights: parsed.insights || { strengths: [], weaknesses: [], opportunities: [] },
                    overallScore: parsed.overallScore || 70,
                };
            }
        }
        catch {
            this.logger.warn('[ContentEngine] Failed to parse AI response, using defaults');
        }
        // Return default analysis based on Blooms data if available
        return this.generateDefaultAnalysis(bloomsData);
    }
    parseGenerationResponse(response, contentType, bloomsData) {
        const generatedContent = {
            type: contentType,
            title: `Generated ${contentType}`,
            content: response,
            metadata: {
                wordCount: response.split(/\s+/).length,
                readingTime: Math.ceil(response.split(/\s+/).length / 200),
                bloomsLevel: bloomsData?.analysis.dominantLevel || 'UNDERSTAND',
                targetAudience: 'General',
            },
        };
        return {
            metrics: this.getDefaultMetrics(),
            suggestions: [],
            generatedContent: [generatedContent],
            insights: {
                strengths: ['Content generated successfully'],
                weaknesses: [],
                opportunities: ['Review and customize for specific audience'],
            },
            overallScore: 75,
        };
    }
    generateDefaultAnalysis(bloomsData) {
        const baseScore = bloomsData ? bloomsData.analysis.cognitiveDepth : 70;
        return {
            metrics: {
                depth: {
                    contentRichness: baseScore,
                    topicCoverage: Math.max(60, baseScore - 10),
                    assessmentQuality: Math.max(50, baseScore - 20),
                    learningPathClarity: Math.max(65, baseScore - 5),
                },
                engagement: {
                    estimatedCompletionRate: Math.max(60, baseScore - 15),
                    interactionDensity: 65,
                    varietyScore: 60,
                },
                quality: {
                    structureScore: Math.max(70, baseScore),
                    coherenceScore: Math.max(70, baseScore),
                    accessibilityScore: 75,
                },
            },
            suggestions: [
                {
                    type: 'improvement',
                    priority: 'medium',
                    title: 'Add interactive elements',
                    description: 'Include more interactive exercises to boost engagement',
                    estimatedImpact: 25,
                },
                {
                    type: 'addition',
                    priority: 'low',
                    title: 'Include practical examples',
                    description: 'Add real-world examples to improve understanding',
                    estimatedImpact: 20,
                },
            ],
            insights: {
                strengths: ['Clear structure', 'Good foundational coverage'],
                weaknesses: bloomsData?.analysis.gaps.length
                    ? [`Missing ${bloomsData.analysis.gaps.join(', ')} level content`]
                    : [],
                opportunities: ['Expand higher-order thinking activities', 'Add multimedia content'],
            },
            overallScore: baseScore,
        };
    }
    getDefaultMetrics() {
        return {
            depth: {
                contentRichness: 70,
                topicCoverage: 65,
                assessmentQuality: 60,
                learningPathClarity: 70,
            },
            engagement: {
                estimatedCompletionRate: 65,
                interactionDensity: 60,
                varietyScore: 55,
            },
            quality: {
                structureScore: 70,
                coherenceScore: 70,
                accessibilityScore: 75,
            },
        };
    }
    getCacheKey(input) {
        const { context, query } = input;
        return `content:${context.page.type}:${context.page.entityId || 'none'}:${query?.substring(0, 50) || 'analyze'}`;
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createContentEngine(config) {
    return new ContentEngine(config);
}
//# sourceMappingURL=content.js.map