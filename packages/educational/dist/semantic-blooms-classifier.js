/**
 * Semantic Bloom's Classifier (Phase 2)
 *
 * Uses embeddings to disambiguate verbs that can indicate multiple Bloom's levels.
 *
 * Problem this solves:
 * - "Explain the steps" → Level 2 (Understand)
 * - "Explain your reasoning" → Level 5 (Evaluate)
 * - "Explain how to solve novel problems" → Level 6 (Create)
 *
 * Approach:
 * - Pre-compute 30 reference embeddings per Bloom's level (180 total)
 * - For ambiguous verbs, compute content embedding and find closest level
 * - Cache embeddings with 24h TTL
 *
 * @packageDocumentation
 */
import { BLOOMS_LEVELS } from '@sam-ai/core';
// ============================================================================
// AMBIGUOUS VERBS
// ============================================================================
/**
 * Verbs that can indicate multiple Bloom's levels depending on context
 */
export const AMBIGUOUS_VERBS = {
    // "explain" can be UNDERSTAND, EVALUATE, or CREATE depending on context
    explain: ['UNDERSTAND', 'EVALUATE', 'CREATE'],
    describe: ['REMEMBER', 'UNDERSTAND', 'ANALYZE'],
    demonstrate: ['UNDERSTAND', 'APPLY'],
    show: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
    discuss: ['UNDERSTAND', 'ANALYZE', 'EVALUATE'],
    interpret: ['UNDERSTAND', 'ANALYZE'],
    compare: ['UNDERSTAND', 'ANALYZE'],
    contrast: ['UNDERSTAND', 'ANALYZE'],
    examine: ['ANALYZE', 'EVALUATE'],
    investigate: ['ANALYZE', 'EVALUATE'],
    develop: ['APPLY', 'CREATE'],
    construct: ['APPLY', 'CREATE'],
    produce: ['APPLY', 'CREATE'],
    modify: ['APPLY', 'CREATE'],
    design: ['APPLY', 'CREATE'],
    plan: ['APPLY', 'ANALYZE', 'CREATE'],
    organize: ['UNDERSTAND', 'ANALYZE'],
    categorize: ['UNDERSTAND', 'ANALYZE'],
    classify: ['UNDERSTAND', 'ANALYZE'],
    distinguish: ['UNDERSTAND', 'ANALYZE'],
    illustrate: ['UNDERSTAND', 'APPLY'],
    calculate: ['APPLY', 'ANALYZE'],
    experiment: ['APPLY', 'ANALYZE'],
    test: ['APPLY', 'ANALYZE', 'EVALUATE'],
    assess: ['ANALYZE', 'EVALUATE'],
    critique: ['ANALYZE', 'EVALUATE'],
    judge: ['ANALYZE', 'EVALUATE'],
    recommend: ['EVALUATE', 'CREATE'],
    formulate: ['APPLY', 'CREATE'],
    hypothesize: ['ANALYZE', 'CREATE'],
    predict: ['UNDERSTAND', 'ANALYZE'],
    infer: ['UNDERSTAND', 'ANALYZE'],
    conclude: ['ANALYZE', 'EVALUATE'],
    justify: ['ANALYZE', 'EVALUATE'],
    support: ['ANALYZE', 'EVALUATE'],
    argue: ['ANALYZE', 'EVALUATE'],
};
// ============================================================================
// REFERENCE PHRASES
// ============================================================================
/**
 * Reference phrases for each Bloom's level (30 per level)
 * These capture the semantic essence of each level
 */
export const REFERENCE_PHRASES = {
    REMEMBER: [
        'Define the key terms and vocabulary',
        'List the main facts and figures',
        'Recall the basic information',
        'Identify the correct answer from options',
        'Name the components of the system',
        'State the definition of the concept',
        'Recognize the pattern in the data',
        'Match the terms with their definitions',
        'Label the parts of the diagram',
        'Select the correct formula',
        'Memorize the sequence of steps',
        'Recite the important dates',
        'Outline the main points',
        'Duplicate the process exactly',
        'Reproduce the chart or graph',
        'Record the observations',
        'Tell what happened in order',
        'Locate the information in the text',
        'Quote the exact passage',
        'Repeat the procedure as shown',
        'Write the basic formula',
        'Copy the model provided',
        'Fill in the blanks with facts',
        'List all items in the category',
        'Point to the correct answer',
        'Who, what, when, where questions',
        'True or false statements',
        'Multiple choice recognition',
        'Flashcard-style recall',
        'Simple factual questions',
    ],
    UNDERSTAND: [
        'Explain the main idea in your own words',
        'Summarize the key points of the passage',
        'Interpret the meaning of the data',
        'Describe how the process works',
        'Compare and contrast two concepts',
        'Paraphrase the complex explanation',
        'Classify items into categories',
        'Distinguish between similar concepts',
        'Predict what might happen next',
        'Give an example of the concept',
        'Illustrate the idea with a diagram',
        'Translate the technical terms',
        'Rewrite in simpler language',
        'Generalize the pattern you observe',
        'Infer the meaning from context',
        'Extend the concept to new situations',
        'Convert the information to another form',
        'Discuss why this is important',
        'Relate this to what you already know',
        'Express the concept differently',
        'What is the main idea?',
        'How would you explain this to someone?',
        'Why does this happen?',
        'What is the significance of this?',
        'How are these similar or different?',
        'What does this represent?',
        'Clarify the misunderstanding',
        'Elaborate on the explanation',
        'Recognize the underlying meaning',
        'Associate concepts together',
    ],
    APPLY: [
        'Apply the formula to solve the problem',
        'Use the method in a new situation',
        'Demonstrate how to perform the task',
        'Solve the practical problem using concepts',
        'Implement the algorithm in code',
        'Execute the procedure correctly',
        'Calculate the result using the equation',
        'Complete the exercise using learned skills',
        'Practice the technique in a simulation',
        'Show how the theory works in practice',
        'Operate the equipment or software',
        'Produce a working solution',
        'Construct a model using the principles',
        'Modify the approach for different context',
        'Schedule tasks using the framework',
        'Illustrate with a working example',
        'Experiment with different variables',
        'Handle a real-world scenario',
        'Carry out the steps correctly',
        'Apply knowledge to everyday situations',
        'How would you use this in real life?',
        'What approach would you take?',
        'Can you solve this problem?',
        'Show me how it works',
        'Practice applying the concept',
        'Use the skill in context',
        'Execute the plan you developed',
        'Perform the task independently',
        'Work through the example',
        'Try this yourself now',
    ],
    ANALYZE: [
        'Analyze the structure of the argument',
        'Break down the problem into components',
        'Identify the underlying assumptions',
        'Examine the relationship between variables',
        'Differentiate between fact and opinion',
        'Organize information into a framework',
        'Compare different approaches systematically',
        'Investigate the root cause of the issue',
        'Question the validity of the claim',
        'Categorize based on specific criteria',
        'Deconstruct the complex system',
        'Find patterns in the data',
        'Determine the key factors',
        'Distinguish cause from effect',
        'Survey the available evidence',
        'Attribute outcomes to specific causes',
        'Correlate variables in the dataset',
        'Diagram the relationships',
        'Dissect the argument into parts',
        'Test the hypothesis with evidence',
        'What are the underlying patterns?',
        'How do these parts relate?',
        'What evidence supports this?',
        'Why did this happen?',
        'What factors contributed?',
        'How can we explain this relationship?',
        'What is the structure here?',
        'Identify the components and connections',
        'Trace the cause and effect chain',
        'Map out the dependencies',
    ],
    EVALUATE: [
        'Evaluate the effectiveness of the solution',
        'Judge the quality of the argument',
        'Critique the methodology used',
        'Assess the strengths and weaknesses',
        'Justify your position with evidence',
        'Argue for or against the proposal',
        'Defend your conclusion',
        'Rate the options based on criteria',
        'Prioritize the recommendations',
        'Validate the results are accurate',
        'Recommend the best approach',
        'Decide which option is optimal',
        'Value the importance of each factor',
        'Determine if the conclusion is sound',
        'Appraise the quality of work',
        'Criticize the flaws in reasoning',
        'Support your evaluation with reasons',
        'Measure against the standards',
        'Discriminate between quality levels',
        'Conclude based on your assessment',
        'What is your opinion and why?',
        'Which approach is better?',
        'How would you improve this?',
        'Is this valid or reliable?',
        'What are the pros and cons?',
        'Would you agree or disagree?',
        'How effective was this?',
        'Make a judgment call',
        'Weigh the evidence',
        'Provide a critical review',
    ],
    CREATE: [
        'Create an original solution to the problem',
        'Design a new system or process',
        'Develop an innovative approach',
        'Invent a novel method',
        'Compose a unique piece',
        'Generate new ideas or hypotheses',
        'Plan a comprehensive project',
        'Construct something entirely new',
        'Formulate a new theory',
        'Build a prototype from scratch',
        'Synthesize ideas into something new',
        'Author an original work',
        'Devise a creative strategy',
        'Combine elements in new ways',
        'Produce original content',
        'Assemble components innovatively',
        'Integrate different concepts creatively',
        'Reorganize into a new structure',
        'Modify extensively to create something new',
        'Compile a new comprehensive resource',
        'What new thing can you create?',
        'How would you design this?',
        'Propose a novel solution',
        'Imagine a better approach',
        'What if you started from scratch?',
        'Create your own version',
        'Invent a new way to do this',
        'Develop an original framework',
        'Compose a new strategy',
        'Generate innovative possibilities',
    ],
};
// ============================================================================
// CLASSIFIER IMPLEMENTATION
// ============================================================================
/**
 * Semantic Bloom's Classifier
 * Uses embeddings to disambiguate verbs that can indicate multiple levels
 */
export class SemanticBloomsClassifier {
    config;
    embeddingCache = new Map();
    referenceEmbeddings = new Map();
    referenceEmbeddingsLoaded = false;
    loadingPromise = null;
    constructor(config = {}) {
        this.config = {
            minSimilarityThreshold: config.minSimilarityThreshold ?? 0.75,
            embeddingProvider: config.embeddingProvider ?? null,
            cacheTTL: config.cacheTTL ?? 24 * 60 * 60 * 1000, // 24 hours
            maxCacheEntries: config.maxCacheEntries ?? 5000,
            debug: config.debug ?? false,
        };
    }
    /**
     * Check if an embedding provider is configured
     */
    hasEmbeddingProvider() {
        return this.config.embeddingProvider !== null;
    }
    /**
     * Set the embedding provider
     */
    setEmbeddingProvider(provider) {
        this.config.embeddingProvider = provider;
    }
    /**
     * Check if a verb is ambiguous (can indicate multiple levels)
     */
    isAmbiguousVerb(verb) {
        const normalizedVerb = verb.toLowerCase().trim();
        return normalizedVerb in AMBIGUOUS_VERBS;
    }
    /**
     * Get possible levels for an ambiguous verb
     */
    getPossibleLevels(verb) {
        const normalizedVerb = verb.toLowerCase().trim();
        return AMBIGUOUS_VERBS[normalizedVerb] ?? [];
    }
    /**
     * Extract verbs from content for analysis
     */
    extractVerbs(content) {
        const words = content.toLowerCase().split(/\s+/);
        const verbs = [];
        for (const word of words) {
            // Clean punctuation
            const cleaned = word.replace(/[^a-z]/g, '');
            if (cleaned in AMBIGUOUS_VERBS) {
                verbs.push(cleaned);
            }
        }
        return [...new Set(verbs)]; // Unique verbs
    }
    /**
     * Load reference embeddings for all Bloom's levels
     * This should be called once during initialization
     */
    async loadReferenceEmbeddings() {
        // Return if already loading or loaded
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        if (this.referenceEmbeddingsLoaded) {
            return;
        }
        if (!this.hasEmbeddingProvider()) {
            throw new Error('No embedding provider configured');
        }
        this.loadingPromise = this.doLoadReferenceEmbeddings();
        await this.loadingPromise;
    }
    async doLoadReferenceEmbeddings() {
        const provider = this.config.embeddingProvider;
        const allPhrases = [];
        const levelIndices = new Map();
        let currentIndex = 0;
        for (const level of BLOOMS_LEVELS) {
            const phrases = REFERENCE_PHRASES[level];
            const start = currentIndex;
            allPhrases.push(...phrases);
            currentIndex += phrases.length;
            levelIndices.set(level, { start, end: currentIndex });
        }
        if (this.config.debug) {
            console.log(`[SemanticBloomsClassifier] Loading ${allPhrases.length} reference embeddings...`);
        }
        try {
            // Batch embed all reference phrases
            const allEmbeddings = await provider.embedBatch(allPhrases);
            // Organize by level
            for (const level of BLOOMS_LEVELS) {
                const indices = levelIndices.get(level);
                if (indices) {
                    const levelEmbeddings = allEmbeddings.slice(indices.start, indices.end);
                    this.referenceEmbeddings.set(level, levelEmbeddings);
                }
            }
            this.referenceEmbeddingsLoaded = true;
            if (this.config.debug) {
                console.log('[SemanticBloomsClassifier] Reference embeddings loaded successfully');
            }
        }
        catch (error) {
            this.loadingPromise = null;
            throw error;
        }
    }
    /**
     * Classify content using semantic similarity
     */
    async classify(content) {
        const startTime = Date.now();
        // Ensure reference embeddings are loaded
        if (!this.referenceEmbeddingsLoaded) {
            await this.loadReferenceEmbeddings();
        }
        // Get content embedding (with caching)
        const contentEmbedding = await this.getEmbedding(content);
        // Calculate similarity to each level
        const similarityScores = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        let maxSimilarity = 0;
        let bestLevel = 'UNDERSTAND';
        let bestReferenceIndex = 0;
        for (const level of BLOOMS_LEVELS) {
            const levelEmbeddings = this.referenceEmbeddings.get(level);
            if (!levelEmbeddings)
                continue;
            // Find max similarity to any reference in this level
            let levelMaxSimilarity = 0;
            let levelBestIndex = 0;
            for (let i = 0; i < levelEmbeddings.length; i++) {
                const similarity = this.cosineSimilarity(contentEmbedding, levelEmbeddings[i]);
                if (similarity > levelMaxSimilarity) {
                    levelMaxSimilarity = similarity;
                    levelBestIndex = i;
                }
            }
            similarityScores[level] = levelMaxSimilarity;
            if (levelMaxSimilarity > maxSimilarity) {
                maxSimilarity = levelMaxSimilarity;
                bestLevel = level;
                bestReferenceIndex = levelBestIndex;
            }
        }
        // Calculate confidence based on margin between best and second-best
        const sortedScores = Object.values(similarityScores).sort((a, b) => b - a);
        const margin = sortedScores[0] - sortedScores[1];
        const confidence = Math.min(1, 0.5 + margin * 2 + maxSimilarity * 0.3);
        return {
            level: bestLevel,
            confidence: Math.round(confidence * 100) / 100,
            similarityScores,
            disambiguated: maxSimilarity >= this.config.minSimilarityThreshold,
            matchedReferenceIndex: bestReferenceIndex,
            processingTimeMs: Date.now() - startTime,
        };
    }
    /**
     * Disambiguate an ambiguous verb based on its context
     */
    async disambiguateVerb(verb, context) {
        if (!this.isAmbiguousVerb(verb)) {
            // Not ambiguous, return a neutral result
            return {
                level: 'UNDERSTAND',
                confidence: 0.5,
                similarityScores: {
                    REMEMBER: 0,
                    UNDERSTAND: 0.5,
                    APPLY: 0,
                    ANALYZE: 0,
                    EVALUATE: 0,
                    CREATE: 0,
                },
                disambiguated: false,
                processingTimeMs: 0,
            };
        }
        // Classify the full context
        return this.classify(context);
    }
    /**
     * Batch classify multiple pieces of content
     */
    async classifyBatch(contents) {
        const results = [];
        for (const content of contents) {
            const result = await this.classify(content);
            results.push(result);
        }
        return results;
    }
    /**
     * Get embedding for text (with caching)
     */
    async getEmbedding(text) {
        const cacheKey = this.hashString(text);
        // Check cache
        const cached = this.embeddingCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.embedding;
        }
        // Generate new embedding
        const embedding = await this.config.embeddingProvider.embed(text);
        // Cache it
        this.setEmbeddingCache(cacheKey, embedding);
        return embedding;
    }
    /**
     * Set embedding in cache
     */
    setEmbeddingCache(key, embedding) {
        // Evict old entries if cache is full
        if (this.embeddingCache.size >= this.config.maxCacheEntries) {
            this.evictOldestEntries(100);
        }
        this.embeddingCache.set(key, {
            embedding,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.config.cacheTTL,
        });
    }
    /**
     * Evict oldest cache entries
     */
    evictOldestEntries(count) {
        const entries = Array.from(this.embeddingCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < count && i < entries.length; i++) {
            this.embeddingCache.delete(entries[i][0]);
        }
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have same length');
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        if (normA === 0 || normB === 0) {
            return 0;
        }
        return dotProduct / (normA * normB);
    }
    /**
     * Simple string hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Clear the embedding cache
     */
    clearCache() {
        this.embeddingCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.embeddingCache.size,
            maxSize: this.config.maxCacheEntries,
        };
    }
    /**
     * Check if reference embeddings are loaded
     */
    isReady() {
        return this.referenceEmbeddingsLoaded;
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a semantic Bloom's classifier
 */
export function createSemanticBloomsClassifier(config) {
    return new SemanticBloomsClassifier(config);
}
/**
 * Create a semantic classifier with an OpenAI embedding provider
 * This is a convenience function for common use case
 */
export function createSemanticBloomsClassifierWithProvider(embeddingProvider, config) {
    return new SemanticBloomsClassifier({
        ...config,
        embeddingProvider,
    });
}
