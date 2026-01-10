"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ContentQualitySchema: () => ContentQualitySchema,
  DocumentationSchema: () => DocumentationSchema,
  EXTERNAL_KNOWLEDGE_CAPABILITIES: () => EXTERNAL_KNOWLEDGE_CAPABILITIES,
  ExternalContentSchema: () => ExternalContentSchema,
  ExternalSourceTypeSchema: () => ExternalSourceTypeSchema,
  InMemoryContentCache: () => InMemoryContentCache,
  KnowledgeAggregator: () => KnowledgeAggregator,
  NewsArticleSchema: () => NewsArticleSchema,
  PACKAGE_NAME: () => PACKAGE_NAME,
  PACKAGE_VERSION: () => PACKAGE_VERSION,
  ResearchPaperSchema: () => ResearchPaperSchema,
  createInMemoryCache: () => createInMemoryCache,
  createKnowledgeAggregator: () => createKnowledgeAggregator,
  hasCapability: () => hasCapability
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var import_zod = require("zod");
var ExternalSourceTypeSchema = import_zod.z.enum([
  "news",
  "research",
  "documentation",
  "tutorial",
  "video",
  "course",
  "book",
  "article",
  "podcast",
  "community"
]);
var ContentQualitySchema = import_zod.z.enum(["high", "medium", "low", "unknown"]);
var ExternalContentSchema = import_zod.z.object({
  id: import_zod.z.string(),
  sourceType: ExternalSourceTypeSchema,
  title: import_zod.z.string(),
  description: import_zod.z.string().optional(),
  url: import_zod.z.string().url(),
  author: import_zod.z.string().optional(),
  publishedAt: import_zod.z.date().optional(),
  updatedAt: import_zod.z.date().optional(),
  quality: ContentQualitySchema.default("unknown"),
  relevanceScore: import_zod.z.number().min(0).max(1).optional(),
  topics: import_zod.z.array(import_zod.z.string()).default([]),
  tags: import_zod.z.array(import_zod.z.string()).default([]),
  language: import_zod.z.string().default("en"),
  readTimeMinutes: import_zod.z.number().optional(),
  metadata: import_zod.z.record(import_zod.z.unknown()).optional()
});
var NewsArticleSchema = ExternalContentSchema.extend({
  sourceType: import_zod.z.literal("news"),
  source: import_zod.z.string(),
  // News source name
  category: import_zod.z.string().optional(),
  sentiment: import_zod.z.enum(["positive", "negative", "neutral"]).optional(),
  imageUrl: import_zod.z.string().url().optional(),
  summary: import_zod.z.string().optional()
});
var ResearchPaperSchema = ExternalContentSchema.extend({
  sourceType: import_zod.z.literal("research"),
  authors: import_zod.z.array(import_zod.z.string()).default([]),
  abstract: import_zod.z.string().optional(),
  doi: import_zod.z.string().optional(),
  arxivId: import_zod.z.string().optional(),
  journal: import_zod.z.string().optional(),
  citations: import_zod.z.number().optional(),
  keywords: import_zod.z.array(import_zod.z.string()).default([]),
  pdfUrl: import_zod.z.string().url().optional()
});
var DocumentationSchema = ExternalContentSchema.extend({
  sourceType: import_zod.z.literal("documentation"),
  framework: import_zod.z.string().optional(),
  version: import_zod.z.string().optional(),
  section: import_zod.z.string().optional(),
  codeExamples: import_zod.z.array(import_zod.z.string()).default([])
});

// src/cache.ts
var InMemoryContentCache = class {
  cache = /* @__PURE__ */ new Map();
  defaultTTL;
  cleanupInterval;
  constructor(defaultTTL = 3600) {
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }
  async get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.content;
  }
  async set(key, content, ttl) {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL) * 1e3;
    this.cache.set(key, { content, expiresAt });
  }
  async delete(key) {
    return this.cache.delete(key);
  }
  async clear() {
    this.cache.clear();
  }
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 6e4);
  }
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = void 0;
    }
  }
};
function createInMemoryCache(defaultTTL) {
  return new InMemoryContentCache(defaultTTL);
}

// src/aggregator.ts
var defaultLogger = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var KnowledgeAggregator = class {
  newsProviders;
  researchProviders;
  documentationProviders;
  webContentProvider;
  cache;
  logger;
  defaultLimit;
  cacheTTL;
  rateLimitPerMinute;
  requestCounts = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.newsProviders = config.newsProviders ?? [];
    this.researchProviders = config.researchProviders ?? [];
    this.documentationProviders = config.documentationProviders ?? [];
    this.webContentProvider = config.webContentProvider;
    this.cache = config.cache ?? new InMemoryContentCache();
    this.logger = config.logger ?? defaultLogger;
    this.defaultLimit = config.defaultLimit ?? 10;
    this.cacheTTL = config.cacheTTL ?? 3600;
    this.rateLimitPerMinute = config.rateLimitPerMinute ?? 60;
  }
  // ============================================================================
  // NEWS SEARCH
  // ============================================================================
  /**
   * Search news across all providers
   */
  async searchNews(options) {
    const cacheKey = `news:${JSON.stringify(options)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return [cached];
    }
    const results = [];
    const limit = options.limit ?? this.defaultLimit;
    for (const provider of this.newsProviders) {
      if (!this.checkRateLimit(provider.name)) {
        this.logger.warn("[KnowledgeAggregator] Rate limit exceeded", {
          provider: provider.name
        });
        continue;
      }
      try {
        const articles = await provider.search(options);
        results.push(...articles);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error("[KnowledgeAggregator] News search failed", {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    const sorted = results.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)).slice(0, limit);
    return sorted;
  }
  /**
   * Get trending news
   */
  async getTrendingNews(topics, limit) {
    const results = [];
    for (const provider of this.newsProviders) {
      if (!this.checkRateLimit(provider.name)) continue;
      try {
        const articles = await provider.getTrending(topics, limit);
        results.push(...articles);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error("[KnowledgeAggregator] Trending news failed", {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return results.slice(0, limit ?? this.defaultLimit);
  }
  // ============================================================================
  // RESEARCH SEARCH
  // ============================================================================
  /**
   * Search research papers across all providers
   */
  async searchResearch(options) {
    const cacheKey = `research:${JSON.stringify(options)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return [cached];
    }
    const results = [];
    const limit = options.limit ?? this.defaultLimit;
    for (const provider of this.researchProviders) {
      if (!this.checkRateLimit(provider.name)) {
        this.logger.warn("[KnowledgeAggregator] Rate limit exceeded", {
          provider: provider.name
        });
        continue;
      }
      try {
        const papers = await provider.search(options);
        results.push(...papers);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error("[KnowledgeAggregator] Research search failed", {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    const sorted = results.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)).slice(0, limit);
    return sorted;
  }
  /**
   * Get paper by DOI
   */
  async getResearchByDoi(doi) {
    const cacheKey = `doi:${doi}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    for (const provider of this.researchProviders) {
      if (!this.checkRateLimit(provider.name)) continue;
      try {
        const paper = await provider.getByDoi(doi);
        if (paper) {
          await this.cache.set(cacheKey, paper, this.cacheTTL);
          this.recordRequest(provider.name);
          return paper;
        }
      } catch (error) {
        this.logger.error("[KnowledgeAggregator] Get by DOI failed", {
          provider: provider.name,
          doi,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return null;
  }
  // ============================================================================
  // DOCUMENTATION SEARCH
  // ============================================================================
  /**
   * Search documentation across all providers
   */
  async searchDocumentation(options) {
    const cacheKey = `docs:${JSON.stringify(options)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return [cached];
    }
    const results = [];
    const limit = options.limit ?? this.defaultLimit;
    for (const provider of this.documentationProviders) {
      if (!this.checkRateLimit(provider.name)) {
        this.logger.warn("[KnowledgeAggregator] Rate limit exceeded", {
          provider: provider.name
        });
        continue;
      }
      try {
        const docs = await provider.search(options);
        results.push(...docs);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error("[KnowledgeAggregator] Documentation search failed", {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return results.slice(0, limit);
  }
  // ============================================================================
  // UNIFIED SEARCH
  // ============================================================================
  /**
   * Search across all content types
   */
  async search(query, options) {
    const startTime = Date.now();
    const types = options?.types ?? ["news", "research", "documentation"];
    const limit = options?.limit ?? this.defaultLimit;
    const results = [];
    const sources = [];
    const searches = [];
    if (types.includes("news")) {
      searches.push(
        this.searchNews({ query, topics: options?.topics, limit }).then((articles) => {
          results.push(...articles);
          sources.push(...this.newsProviders.map((p) => p.name));
        })
      );
    }
    if (types.includes("research")) {
      searches.push(
        this.searchResearch({ query, limit }).then((papers) => {
          results.push(...papers);
          sources.push(...this.researchProviders.map((p) => p.name));
        })
      );
    }
    if (types.includes("documentation")) {
      searches.push(
        this.searchDocumentation({ query, limit }).then((docs) => {
          results.push(...docs);
          sources.push(...this.documentationProviders.map((p) => p.name));
        })
      );
    }
    await Promise.allSettled(searches);
    results.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    return {
      content: results.slice(0, limit),
      totalResults: results.length,
      sources: [...new Set(sources)],
      searchTime: Date.now() - startTime,
      query
    };
  }
  // ============================================================================
  // WEB CONTENT
  // ============================================================================
  /**
   * Fetch content from a URL
   */
  async fetchUrl(url) {
    if (!this.webContentProvider) {
      this.logger.warn("[KnowledgeAggregator] No web content provider configured");
      return null;
    }
    const cacheKey = `url:${url}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    try {
      const content = await this.webContentProvider.fetch(url);
      if (content) {
        await this.cache.set(cacheKey, content, this.cacheTTL);
      }
      return content;
    } catch (error) {
      this.logger.error("[KnowledgeAggregator] Fetch URL failed", {
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================
  /**
   * Get content recommendations based on topics
   */
  async getRecommendations(topics, options) {
    const searchResults = await this.search(topics.join(" "), {
      types: options?.types,
      limit: (options?.limit ?? this.defaultLimit) * 2,
      topics
    });
    const excludeSet = new Set(options?.excludeIds ?? []);
    const recommendations = [];
    for (const content of searchResults.content) {
      if (excludeSet.has(content.id)) continue;
      const contentTopics = /* @__PURE__ */ new Set([...content.topics, ...content.tags]);
      const matchingTopics = topics.filter(
        (t) => contentTopics.has(t.toLowerCase()) || content.title.toLowerCase().includes(t.toLowerCase())
      );
      if (matchingTopics.length > 0 || (content.relevanceScore ?? 0) > 0.5) {
        recommendations.push({
          content,
          reason: matchingTopics.length > 0 ? `Matches topics: ${matchingTopics.join(", ")}` : "High relevance score",
          confidence: content.relevanceScore ?? 0.5,
          relatedTopics: matchingTopics
        });
      }
    }
    recommendations.sort((a, b) => b.confidence - a.confidence);
    return recommendations.slice(0, options?.limit ?? this.defaultLimit);
  }
  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  checkRateLimit(provider) {
    const now = Date.now();
    const windowStart = now - 6e4;
    const requests = this.requestCounts.get(provider) ?? [];
    const recentRequests = requests.filter((t) => t > windowStart);
    return recentRequests.length < this.rateLimitPerMinute;
  }
  recordRequest(provider) {
    const now = Date.now();
    const requests = this.requestCounts.get(provider) ?? [];
    requests.push(now);
    const windowStart = now - 6e4;
    const filtered = requests.filter((t) => t > windowStart);
    this.requestCounts.set(provider, filtered);
  }
  // ============================================================================
  // PROVIDER MANAGEMENT
  // ============================================================================
  /**
   * Add a news provider
   */
  addNewsProvider(provider) {
    this.newsProviders.push(provider);
  }
  /**
   * Add a research provider
   */
  addResearchProvider(provider) {
    this.researchProviders.push(provider);
  }
  /**
   * Add a documentation provider
   */
  addDocumentationProvider(provider) {
    this.documentationProviders.push(provider);
  }
  /**
   * Set web content provider
   */
  setWebContentProvider(provider) {
    this.webContentProvider = provider;
  }
  /**
   * Get provider stats
   */
  getStats() {
    return {
      newsProviders: this.newsProviders.length,
      researchProviders: this.researchProviders.length,
      documentationProviders: this.documentationProviders.length,
      hasWebContentProvider: !!this.webContentProvider
    };
  }
};
function createKnowledgeAggregator(config) {
  return new KnowledgeAggregator(config);
}

// src/index.ts
var PACKAGE_NAME = "@sam-ai/external-knowledge";
var PACKAGE_VERSION = "0.1.0";
var EXTERNAL_KNOWLEDGE_CAPABILITIES = {
  NEWS: "external:news",
  RESEARCH: "external:research",
  DOCUMENTATION: "external:documentation",
  WEB_CONTENT: "external:web_content",
  CACHING: "external:caching",
  RECOMMENDATIONS: "external:recommendations"
};
function hasCapability(capability) {
  switch (capability) {
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.NEWS:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.RESEARCH:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.DOCUMENTATION:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.WEB_CONTENT:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.CACHING:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.RECOMMENDATIONS:
      return true;
    default:
      return false;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ContentQualitySchema,
  DocumentationSchema,
  EXTERNAL_KNOWLEDGE_CAPABILITIES,
  ExternalContentSchema,
  ExternalSourceTypeSchema,
  InMemoryContentCache,
  KnowledgeAggregator,
  NewsArticleSchema,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  ResearchPaperSchema,
  createInMemoryCache,
  createKnowledgeAggregator,
  hasCapability
});
