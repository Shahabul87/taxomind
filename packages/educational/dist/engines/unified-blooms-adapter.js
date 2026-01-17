/**
 * @sam-ai/educational - Unified Blooms Adapter Engine
 * Bridges the UnifiedBloomsEngine into the @sam-ai/core BaseEngine system.
 */
import { BaseEngine } from '@sam-ai/core';
import { createUnifiedBloomsEngine } from './unified-blooms-engine';
export class UnifiedBloomsAdapterEngine extends BaseEngine {
    unified;
    constructor(config) {
        super({
            config: config.samConfig,
            name: 'blooms',
            version: '2.0.0',
            dependencies: ['context'],
            cacheEnabled: false, // Unified engine already has its own caching
        });
        this.unified = createUnifiedBloomsEngine({
            samConfig: config.samConfig,
            database: config.database ?? config.samConfig.database,
            defaultMode: config.defaultMode,
            confidenceThreshold: config.confidenceThreshold,
            enableCache: config.enableCache,
            cacheTTL: config.cacheTTL,
        });
    }
    async process(input) {
        const content = this.buildContent(input);
        const options = this.buildAnalysisOptions(input);
        if (!content.trim()) {
            return this.createFallbackOutput();
        }
        const result = await this.unified.analyze(content, options);
        return this.mapResult(result);
    }
    getCacheKey(input) {
        const content = this.buildContent(input);
        return `blooms-unified:${this.hashString(content)}`;
    }
    buildContent(input) {
        const parts = [];
        if (input.title)
            parts.push(input.title);
        if (input.content)
            parts.push(input.content);
        if (input.objectives?.length)
            parts.push(...input.objectives);
        if (input.sections?.length) {
            for (const section of input.sections) {
                parts.push(section.title);
                if (section.content)
                    parts.push(section.content);
            }
        }
        if (input.query)
            parts.push(input.query);
        const metadata = input.context.page.metadata ?? {};
        const entitySummary = metadata.entitySummary;
        const sectionContent = metadata.sectionContent;
        const formSummary = metadata.formSummary;
        const memorySummary = metadata.memorySummary;
        if (entitySummary)
            parts.push(entitySummary);
        if (sectionContent)
            parts.push(sectionContent);
        if (formSummary)
            parts.push(formSummary);
        if (memorySummary)
            parts.push(memorySummary);
        return parts.filter(Boolean).join('\n\n');
    }
    buildAnalysisOptions(input) {
        if (input.analysisOptions)
            return input.analysisOptions;
        const options = input.options ?? {};
        const mode = options.bloomsMode ?? options.mode;
        return {
            mode: typeof mode === 'string' ? mode : undefined,
            forceAI: options.forceAI === true,
            forceKeyword: options.forceKeyword === true,
            includeSections: options.includeSections === true,
            confidenceThreshold: typeof options.confidenceThreshold === 'number'
                ? options.confidenceThreshold
                : undefined,
        };
    }
    mapResult(result) {
        const recommendations = result.recommendations.map((rec) => rec.action);
        const actionItems = result.recommendations
            .filter((rec) => rec.priority !== 'low')
            .map((rec) => rec.action) ?? [];
        const analysis = {
            distribution: result.distribution,
            dominantLevel: result.dominantLevel,
            cognitiveDepth: result.cognitiveDepth,
            balance: result.balance,
            gaps: result.gaps,
            recommendations,
            confidence: result.confidence,
            method: result.metadata.method,
        };
        return {
            analysis,
            sectionAnalysis: result.sectionAnalysis?.map((section) => ({
                title: section.title,
                level: section.level,
                confidence: section.confidence,
            })),
            recommendations,
            actionItems: actionItems.length > 0 ? actionItems : this.buildGapActions(result.gaps),
        };
    }
    buildGapActions(gaps) {
        if (!gaps || gaps.length === 0) {
            return ['Add more higher-order thinking activities for deeper mastery.'];
        }
        return gaps.map((level) => `Add ${level.toLowerCase()}-level activities for better balance.`);
    }
    createFallbackOutput() {
        const analysis = {
            distribution: {
                REMEMBER: 10,
                UNDERSTAND: 40,
                APPLY: 30,
                ANALYZE: 15,
                EVALUATE: 3,
                CREATE: 2,
            },
            dominantLevel: 'UNDERSTAND',
            cognitiveDepth: 35,
            balance: 'bottom-heavy',
            gaps: ['EVALUATE', 'CREATE'],
            recommendations: [
                'Add application or analysis activities to deepen understanding.',
            ],
            confidence: 0.3,
            method: 'keyword',
        };
        return {
            analysis,
            sectionAnalysis: undefined,
            recommendations: analysis.recommendations,
            actionItems: ['Add higher-order questions (evaluate/create) to balance the content.'],
        };
    }
}
export function createUnifiedBloomsAdapterEngine(config) {
    return new UnifiedBloomsAdapterEngine(config);
}
