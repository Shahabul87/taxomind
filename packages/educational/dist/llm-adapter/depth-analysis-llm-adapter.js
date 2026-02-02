/**
 * Depth Analysis LLM Adapter
 * Enhanced Depth Analysis - January 2026
 *
 * A portable, provider-agnostic LLM adapter for depth analysis operations.
 * Supports OpenAI, Anthropic, DeepSeek, and custom providers.
 */
import { MODEL_TIER_MAPPING } from './types';
import { BLOOMS_CLASSIFICATION_PROMPT, DOK_CLASSIFICATION_PROMPT, MULTI_FRAMEWORK_PROMPT, KEYWORD_EXTRACTION_PROMPT, ALIGNMENT_ANALYSIS_PROMPT, RECOMMENDATION_PROMPT, } from './prompts';
import { parseBloomsResult, parseDOKResult, parseMultiFrameworkResult, parseKeywordResult, parseAlignmentResult, parseRecommendationResult, } from './parsers';
export const ADAPTER_VERSION = '1.0.0';
/**
 * Default adapter options
 */
const DEFAULT_OPTIONS = {
    cacheEnabled: true,
    cacheTTL: 3600, // 1 hour
    rateLimit: {
        maxRequests: 60,
        windowMs: 60000,
        delayMs: 100,
    },
    retry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 10000,
        retryOnCodes: [429, 500, 502, 503, 504],
    },
    systemPrompts: {},
};
/**
 * Console-based default logger
 */
const defaultLogger = {
    debug: (msg, ...args) => console.debug(`[DepthLLM] ${msg}`, ...args),
    info: (msg, ...args) => console.info(`[DepthLLM] ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[DepthLLM] ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[DepthLLM] ${msg}`, ...args),
};
/**
 * Main LLM Adapter for Depth Analysis
 */
export class PortableDepthAnalysisLLMAdapter {
    name = 'PortableDepthAnalysisLLMAdapter';
    version = ADAPTER_VERSION;
    provider;
    apiKey;
    baseUrl;
    model;
    modelTier;
    cacheEnabled;
    cacheTTL;
    rateLimit;
    retry;
    systemPrompts;
    logger;
    headers;
    // Rate limiting state
    requestTimestamps = [];
    // Simple in-memory cache
    cache = new Map();
    constructor(options) {
        this.provider = options.provider.provider;
        this.apiKey = this.resolveApiKey(options);
        this.baseUrl = this.resolveBaseUrl(options);
        this.modelTier = options.provider.modelTier ?? 'balanced';
        this.model = options.provider.model ?? MODEL_TIER_MAPPING[this.provider][this.modelTier];
        this.headers = options.provider.headers ?? {};
        this.cacheEnabled = options.cacheEnabled ?? DEFAULT_OPTIONS.cacheEnabled;
        this.cacheTTL = options.cacheTTL ?? DEFAULT_OPTIONS.cacheTTL;
        this.rateLimit = { ...DEFAULT_OPTIONS.rateLimit, ...options.rateLimit };
        this.retry = { ...DEFAULT_OPTIONS.retry, ...options.retry };
        this.systemPrompts = { ...DEFAULT_OPTIONS.systemPrompts, ...options.systemPrompts };
        this.logger = options.logger ?? defaultLogger;
        this.logger.info(`Initialized with provider: ${this.provider}, model: ${this.model}`);
    }
    /**
     * Resolve API key from options or environment
     */
    resolveApiKey(options) {
        if (options.provider.apiKey) {
            return options.provider.apiKey;
        }
        const envVar = options.provider.apiKeyEnvVar ?? this.getDefaultEnvVar(options.provider.provider);
        const key = process.env[envVar];
        if (!key) {
            this.logger.warn(`No API key found for ${options.provider.provider}. Checked: ${envVar}`);
        }
        return key ?? '';
    }
    /**
     * Get default environment variable name for provider
     */
    getDefaultEnvVar(provider) {
        switch (provider) {
            case 'openai':
                return 'OPENAI_API_KEY';
            case 'anthropic':
                return 'ANTHROPIC_API_KEY';
            case 'deepseek':
                return 'DEEPSEEK_API_KEY';
            default:
                return 'LLM_API_KEY';
        }
    }
    /**
     * Resolve base URL for provider
     */
    resolveBaseUrl(options) {
        if (options.provider.baseUrl) {
            return options.provider.baseUrl;
        }
        switch (options.provider.provider) {
            case 'openai':
                return 'https://api.openai.com/v1';
            case 'anthropic':
                return 'https://api.anthropic.com/v1';
            case 'deepseek':
                return 'https://api.deepseek.com/v1';
            default:
                return '';
        }
    }
    /**
     * Check if adapter is configured
     */
    isConfigured() {
        return Boolean(this.apiKey && this.baseUrl);
    }
    /**
     * Get model information
     */
    getModelInfo() {
        return {
            provider: this.provider,
            model: this.model,
            tier: this.modelTier,
            maxTokens: this.getMaxTokens(),
            contextWindow: this.getContextWindow(),
        };
    }
    getMaxTokens() {
        switch (this.provider) {
            case 'anthropic':
                return 8192;
            case 'openai':
                return 4096;
            case 'deepseek':
                return 4096;
            default:
                return 4096;
        }
    }
    getContextWindow() {
        switch (this.provider) {
            case 'anthropic':
                return 200000;
            case 'openai':
                return 128000;
            case 'deepseek':
                return 64000;
            default:
                return 32000;
        }
    }
    // ═══════════════════════════════════════════════════════════════
    // CLASSIFICATION METHODS
    // ═══════════════════════════════════════════════════════════════
    /**
     * Classify text according to Bloom's Taxonomy
     */
    async classifyBlooms(input) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey('blooms', input);
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.debug('Cache hit for Bloom\'s classification');
            return cached;
        }
        const systemPrompt = this.systemPrompts.bloomsClassification ?? BLOOMS_CLASSIFICATION_PROMPT;
        const userPrompt = this.formatBloomsPrompt(input);
        const response = await this.callLLM(systemPrompt, userPrompt);
        const result = parseBloomsResult(response, this.model, Date.now() - startTime);
        // Cache result
        this.setCache(cacheKey, result);
        return result;
    }
    /**
     * Classify text according to Webb's DOK
     */
    async classifyDOK(input) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey('dok', input);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.debug('Cache hit for DOK classification');
            return cached;
        }
        const systemPrompt = this.systemPrompts.dokClassification ?? DOK_CLASSIFICATION_PROMPT;
        const userPrompt = this.formatDOKPrompt(input);
        const response = await this.callLLM(systemPrompt, userPrompt);
        const result = parseDOKResult(response, this.model, Date.now() - startTime);
        this.setCache(cacheKey, result);
        return result;
    }
    /**
     * Classify using multiple frameworks
     */
    async classifyMultiFramework(input) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey('multiframework', input);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.debug('Cache hit for multi-framework classification');
            return cached;
        }
        const systemPrompt = this.systemPrompts.multiFramework ?? MULTI_FRAMEWORK_PROMPT;
        const userPrompt = this.formatMultiFrameworkPrompt(input);
        const response = await this.callLLM(systemPrompt, userPrompt);
        const result = parseMultiFrameworkResult(response, this.model, Date.now() - startTime);
        this.setCache(cacheKey, result);
        return result;
    }
    /**
     * Extract educational keywords
     */
    async extractKeywords(input) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey('keywords', input);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.debug('Cache hit for keyword extraction');
            return cached;
        }
        const systemPrompt = this.systemPrompts.keywordExtraction ?? KEYWORD_EXTRACTION_PROMPT;
        const userPrompt = this.formatKeywordPrompt(input);
        const response = await this.callLLM(systemPrompt, userPrompt);
        const result = parseKeywordResult(response, this.model, Date.now() - startTime);
        this.setCache(cacheKey, result);
        return result;
    }
    /**
     * Analyze alignment between objectives, content, and assessments
     */
    async analyzeAlignment(input) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey('alignment', input);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.debug('Cache hit for alignment analysis');
            return cached;
        }
        const systemPrompt = this.systemPrompts.alignmentAnalysis ?? ALIGNMENT_ANALYSIS_PROMPT;
        const userPrompt = this.formatAlignmentPrompt(input);
        const response = await this.callLLM(systemPrompt, userPrompt);
        const result = parseAlignmentResult(response, this.model, Date.now() - startTime);
        this.setCache(cacheKey, result);
        return result;
    }
    /**
     * Generate recommendations
     */
    async generateRecommendations(input) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey('recommendations', input);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.logger.debug('Cache hit for recommendations');
            return cached;
        }
        const systemPrompt = this.systemPrompts.recommendations ?? RECOMMENDATION_PROMPT;
        const userPrompt = this.formatRecommendationPrompt(input);
        const response = await this.callLLM(systemPrompt, userPrompt);
        const result = parseRecommendationResult(response, this.model, Date.now() - startTime);
        this.setCache(cacheKey, result);
        return result;
    }
    // ═══════════════════════════════════════════════════════════════
    // CORE LLM CALL
    // ═══════════════════════════════════════════════════════════════
    /**
     * Make a call to the LLM with retry and rate limiting
     */
    async callLLM(systemPrompt, userPrompt) {
        await this.applyRateLimit();
        let lastError = null;
        let delay = this.retry.initialDelayMs;
        for (let attempt = 0; attempt <= this.retry.maxRetries; attempt++) {
            try {
                const response = await this.makeRequest(systemPrompt, userPrompt);
                return response;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Check if we should retry
                const shouldRetry = this.shouldRetry(error, attempt);
                if (!shouldRetry) {
                    break;
                }
                this.logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);
                await this.sleep(delay);
                delay = Math.min(delay * this.retry.backoffMultiplier, this.retry.maxDelayMs);
            }
        }
        throw lastError ?? new Error('LLM call failed');
    }
    /**
     * Make the actual HTTP request to the LLM provider
     */
    async makeRequest(systemPrompt, userPrompt) {
        switch (this.provider) {
            case 'anthropic':
                return this.callAnthropic(systemPrompt, userPrompt);
            case 'openai':
            case 'deepseek':
                return this.callOpenAICompatible(systemPrompt, userPrompt);
            default:
                throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }
    /**
     * Call Anthropic API
     */
    async callAnthropic(systemPrompt, userPrompt) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                ...this.headers,
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.getMaxTokens(),
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${errorBody}`);
        }
        const data = (await response.json());
        return data.content?.[0]?.text ?? '';
    }
    /**
     * Call OpenAI-compatible API (OpenAI, DeepSeek)
     */
    async callOpenAICompatible(systemPrompt, userPrompt) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                ...this.headers,
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.getMaxTokens(),
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
        }
        const data = (await response.json());
        return data.choices?.[0]?.message?.content ?? '';
    }
    // ═══════════════════════════════════════════════════════════════
    // PROMPT FORMATTING
    // ═══════════════════════════════════════════════════════════════
    formatBloomsPrompt(input) {
        return JSON.stringify({
            text: input.text,
            contentType: input.contentType,
            context: input.context,
            courseType: input.courseType,
            includeConfidence: input.includeConfidence ?? true,
            includeEvidence: input.includeEvidence ?? true,
        });
    }
    formatDOKPrompt(input) {
        return JSON.stringify({
            text: input.text,
            contentType: input.contentType,
            context: input.context,
            courseType: input.courseType,
            includeConfidence: input.includeConfidence ?? true,
            includeEvidence: input.includeEvidence ?? true,
        });
    }
    formatMultiFrameworkPrompt(input) {
        return JSON.stringify({
            text: input.text,
            contentType: input.contentType,
            frameworks: input.frameworks,
            courseType: input.courseType,
            context: input.context,
            includeCrossFrameworkAlignment: input.includeCrossFrameworkAlignment ?? true,
        });
    }
    formatKeywordPrompt(input) {
        return JSON.stringify({
            text: input.text,
            keywordTypes: input.keywordTypes,
            maxPerType: input.maxPerType ?? 10,
            context: input.context,
            includeRelevance: input.includeRelevance ?? true,
        });
    }
    formatAlignmentPrompt(input) {
        return JSON.stringify({
            objectives: input.objectives,
            sections: input.sections,
            assessments: input.assessments,
            courseType: input.courseType,
            depth: input.depth ?? 'standard',
        });
    }
    formatRecommendationPrompt(input) {
        return JSON.stringify({
            bloomsDistribution: input.bloomsDistribution,
            dokDistribution: input.dokDistribution,
            alignmentGaps: input.alignmentGaps,
            courseType: input.courseType,
            focusAreas: input.focusAreas,
            maxRecommendations: input.maxRecommendations ?? 5,
        });
    }
    // ═══════════════════════════════════════════════════════════════
    // RATE LIMITING & CACHING
    // ═══════════════════════════════════════════════════════════════
    /**
     * Apply rate limiting
     */
    async applyRateLimit() {
        const now = Date.now();
        const windowStart = now - this.rateLimit.windowMs;
        // Remove old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts > windowStart);
        // Check if we're at the limit
        if (this.requestTimestamps.length >= this.rateLimit.maxRequests) {
            const oldestInWindow = Math.min(...this.requestTimestamps);
            const waitTime = oldestInWindow + this.rateLimit.windowMs - now;
            this.logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
            await this.sleep(waitTime);
        }
        // Add delay between requests
        if (this.rateLimit.delayMs && this.requestTimestamps.length > 0) {
            const lastRequest = Math.max(...this.requestTimestamps);
            const timeSinceLastRequest = now - lastRequest;
            if (timeSinceLastRequest < this.rateLimit.delayMs) {
                await this.sleep(this.rateLimit.delayMs - timeSinceLastRequest);
            }
        }
        this.requestTimestamps.push(Date.now());
    }
    /**
     * Generate cache key
     */
    getCacheKey(operation, input) {
        const hash = this.simpleHash(JSON.stringify(input));
        return `${operation}:${this.model}:${hash}`;
    }
    /**
     * Simple hash function for cache keys
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Get from cache
     */
    getFromCache(key) {
        if (!this.cacheEnabled)
            return null;
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    /**
     * Set cache entry
     */
    setCache(key, value) {
        if (!this.cacheEnabled)
            return;
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (this.cacheTTL * 1000),
        });
        // Clean up old entries periodically
        if (this.cache.size > 1000) {
            this.cleanupCache();
        }
    }
    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════
    /**
     * Check if error is retryable
     */
    shouldRetry(error, attempt) {
        if (attempt >= this.retry.maxRetries)
            return false;
        if (error instanceof Error) {
            // Check for rate limit or server errors
            const message = error.message.toLowerCase();
            if (message.includes('429') || message.includes('rate limit'))
                return true;
            if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504'))
                return true;
            if (message.includes('timeout'))
                return true;
        }
        return false;
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════
/**
 * Create a depth analysis LLM adapter
 */
export function createDepthAnalysisLLMAdapter(options) {
    return new PortableDepthAnalysisLLMAdapter(options);
}
/**
 * Create adapter with minimal configuration
 */
export function createQuickAdapter(provider, apiKey) {
    return new PortableDepthAnalysisLLMAdapter({
        provider: {
            provider,
            apiKey,
            modelTier: 'balanced',
        },
    });
}
