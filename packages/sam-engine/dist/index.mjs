// src/base-engine.ts
var BaseEngine = class {
  config;
  logger;
  storage;
  initialized = false;
  cache = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.config = config;
    this.logger = config.logger || this.createDefaultLogger();
    this.storage = config.storage || null;
  }
  /**
   * Initialize the engine
   */
  async initialize(config) {
    if (this.initialized) {
      this.logger.warn(`${this.name} is already initialized`);
      return;
    }
    if (config) {
      this.config = { ...this.config, ...config };
    }
    try {
      await this.performInitialization();
      this.initialized = true;
      this.logger.info(`${this.name} initialized successfully`);
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.name}`, error);
      throw new Error(`Engine initialization failed: ${this.name}`);
    }
  }
  /**
   * Optional analysis method
   */
  async analyze(data) {
    return {
      engineName: this.name,
      timestamp: /* @__PURE__ */ new Date(),
      data,
      confidence: 1,
      recommendations: []
    };
  }
  /**
   * Cleanup and destroy engine
   */
  async destroy() {
    this.cache.clear();
    this.initialized = false;
    this.logger.info(`${this.name} destroyed`);
  }
  /**
   * Validate input data
   */
  validate(data, validator) {
    const result = validator(data);
    if (!result.valid) {
      const errors = result.errors?.join(", ") || "Validation failed";
      throw new Error(`Validation error in ${this.name}: ${errors}`);
    }
    return data;
  }
  /**
   * Cache management with TTL
   */
  async withCache(key, factory, ttlSeconds = 300) {
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiry > now) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return cached.data;
    }
    if (this.storage) {
      try {
        const stored = await this.storage.get(key);
        if (stored) {
          this.logger.debug(`Storage hit for key: ${key}`);
          this.cache.set(key, {
            data: stored,
            expiry: now + ttlSeconds * 1e3
          });
          return stored;
        }
      } catch (error) {
        this.logger.warn(`Storage read failed for key: ${key}`, error);
      }
    }
    this.logger.debug(`Cache miss for key: ${key}, generating new data`);
    const data = await factory();
    this.cache.set(key, {
      data,
      expiry: now + ttlSeconds * 1e3
    });
    if (this.storage) {
      try {
        await this.storage.set(key, data, ttlSeconds);
      } catch (error) {
        this.logger.warn(`Storage write failed for key: ${key}`, error);
      }
    }
    if (Math.random() < 0.1) {
      this.cleanupCache();
    }
    return data;
  }
  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }
  /**
   * Performance monitoring wrapper
   */
  async measurePerformance(operation, fn) {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      if (duration > 1e3) {
        this.logger.warn(`Slow operation in ${this.name}: ${operation} took ${duration}ms`);
      } else {
        this.logger.debug(`${operation} completed in ${duration}ms`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(`Operation failed in ${this.name}: ${operation} after ${duration}ms`, error);
      throw error;
    }
  }
  /**
   * Rate limiting helper
   */
  rateLimitMap = /* @__PURE__ */ new Map();
  async checkRateLimit(key, maxRequests = 60, windowMs = 6e4) {
    const now = Date.now();
    const limit = this.rateLimitMap.get(key);
    if (!limit || limit.resetTime < now) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    if (limit.count >= maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${key}`);
      return false;
    }
    limit.count++;
    return true;
  }
  /**
   * Sanitization helpers
   */
  sanitizeString(input, maxLength = 1e3) {
    if (typeof input !== "string") {
      return "";
    }
    return input.slice(0, maxLength).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<[^>]+>/g, "").trim();
  }
  sanitizeNumber(input, min, max, defaultValue) {
    const num = Number(input);
    if (isNaN(num)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, num));
  }
  /**
   * Pagination helper
   */
  paginate(items, page = 1, limit = 20) {
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    return {
      items: items.slice(start, end),
      total,
      page: currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }
  /**
   * Batch processing helper
   */
  async processBatch(items, processor, batchSize = 10) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item) => processor(item).catch((error) => {
          this.logger.error(`Batch processing error`, error);
          return null;
        }))
      );
      results.push(...batchResults.filter((r) => r !== null));
    }
    return results;
  }
  /**
   * Retry mechanism for operations
   */
  async retry(operation, maxAttempts = 3, delayMs = 1e3) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
        if (attempt < maxAttempts) {
          await this.delay(delayMs * attempt);
        }
      }
    }
    throw lastError || new Error("Retry failed");
  }
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Create default logger
   */
  createDefaultLogger() {
    return {
      debug: (message, ...args) => {
        if (process.env.NODE_ENV === "development") {
          console.debug(`[${this.name}] ${message}`, ...args);
        }
      },
      info: (message, ...args) => {
        console.info(`[${this.name}] ${message}`, ...args);
      },
      warn: (message, ...args) => {
        console.warn(`[${this.name}] ${message}`, ...args);
      },
      error: (message, error, ...args) => {
        console.error(`[${this.name}] ${message}`, error, ...args);
      }
    };
  }
};

// src/sam-engine.ts
var SAMEngine = class extends BaseEngine {
  name = "SAMEngine";
  conversations = /* @__PURE__ */ new Map();
  plugins = /* @__PURE__ */ new Map();
  eventHandlers = /* @__PURE__ */ new Map();
  featureFlags = {};
  aiProvider = null;
  constructor(config = {}) {
    super(config);
    this.featureFlags = this.extractFeatureFlags(config);
  }
  /**
   * Initialize SAM Engine
   */
  async performInitialization() {
    this.aiProvider = await this.initializeAIProvider();
    if (this.storage) {
      await this.loadConversations();
    }
    await this.emit("engine.initialized", {
      name: this.name,
      features: this.featureFlags
    });
  }
  /**
   * Process a message with context
   */
  async process(context, message) {
    try {
      const rateLimitKey = `user:${context.user.id}`;
      const allowed = await this.checkRateLimit(
        rateLimitKey,
        this.config.rateLimitPerMinute || 60
      );
      if (!allowed) {
        return {
          message: "Rate limit exceeded. Please wait a moment before sending another message.",
          error: "RATE_LIMIT_EXCEEDED"
        };
      }
      const conversation = await this.getOrCreateConversation(context.user.id, context);
      const userMessage = {
        role: "user",
        content: this.sanitizeString(message, 2e3),
        timestamp: /* @__PURE__ */ new Date()
      };
      conversation.messages.push(userMessage);
      let pluginResponses = [];
      for (const [name, plugin] of this.plugins) {
        if (plugin.process) {
          try {
            const response2 = await plugin.process(context, message);
            if (response2) {
              pluginResponses.push({ plugin: name, response: response2 });
            }
          } catch (error) {
            this.logger.error(`Plugin ${name} failed`, error);
          }
        }
      }
      const response = await this.generateResponse(
        conversation,
        context,
        pluginResponses
      );
      const assistantMessage = {
        role: "assistant",
        content: response.message,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: {
          suggestions: response.suggestions,
          contextInsights: response.contextInsights
        }
      };
      conversation.messages.push(assistantMessage);
      await this.saveConversation(conversation);
      await this.emit("message.received", {
        userId: context.user.id,
        message: response.message,
        context
      });
      return response;
    } catch (error) {
      this.logger.error("Error processing message", error);
      await this.emit("error.occurred", {
        error: error.message,
        context
      });
      return {
        message: "I encountered an error while processing your request. Please try again.",
        error: error.message
      };
    }
  }
  /**
   * Generate AI response
   */
  async generateResponse(conversation, context, pluginResponses) {
    if (!this.aiProvider) {
      return this.generateFallbackResponse(context);
    }
    const prompt = this.buildPrompt(conversation, context, pluginResponses);
    try {
      const aiResponse = await this.aiProvider.complete(prompt);
      return this.parseAIResponse(aiResponse, context);
    } catch (error) {
      this.logger.error("AI provider error", error);
      return this.generateFallbackResponse(context);
    }
  }
  /**
   * Build AI prompt
   */
  buildPrompt(conversation, context, pluginResponses) {
    const personality = `You are SAM (Smart Adaptive Mentor), an advanced AI educational assistant.
Your expertise includes learning science, instructional design, curriculum development, and educational technology.
You are encouraging, practical, contextually aware, and solution-focused.`;
    const contextInfo = this.formatContext(context);
    const conversationHistory = this.formatConversationHistory(conversation);
    const pluginInfo = this.formatPluginResponses(pluginResponses);
    return `${personality}

${contextInfo}

${conversationHistory}

${pluginInfo}

User Message: "${conversation.messages[conversation.messages.length - 1].content}"

Provide a helpful response in JSON format:
{
  "message": "Your response",
  "suggestions": ["suggestion1", "suggestion2"],
  "contextInsights": {
    "observation": "What you observe",
    "recommendation": "Your recommendation"
  }
}`;
  }
  /**
   * Format context for prompt
   */
  formatContext(context) {
    const parts = ["CONTEXT:"];
    if (context.user) {
      parts.push(`- User Type: ${context.user.isTeacher ? "Teacher/Instructor" : "Student/Learner"}`);
      parts.push(`- User ID: ${context.user.id}`);
    }
    if (context.courseId) {
      parts.push(`- Course ID: ${context.courseId}`);
    }
    if (context.pageType) {
      parts.push(`- Page Type: ${context.pageType}`);
    }
    if (context.entityType) {
      parts.push(`- Entity Type: ${context.entityType}`);
    }
    return parts.join("\n");
  }
  /**
   * Format conversation history
   */
  formatConversationHistory(conversation) {
    const recentMessages = conversation.messages.slice(-5, -1);
    if (recentMessages.length === 0) {
      return "CONVERSATION: New conversation";
    }
    const history = recentMessages.map(
      (msg) => `${msg.role.toUpperCase()}: ${msg.content.slice(0, 200)}`
    ).join("\n");
    return `RECENT CONVERSATION:
${history}`;
  }
  /**
   * Format plugin responses
   */
  formatPluginResponses(responses) {
    if (responses.length === 0) {
      return "";
    }
    const formatted = responses.map(
      (r) => `${r.plugin}: ${JSON.stringify(r.response).slice(0, 200)}`
    ).join("\n");
    return `PLUGIN INSIGHTS:
${formatted}`;
  }
  /**
   * Parse AI response
   */
  parseAIResponse(response, context) {
    try {
      const parsed = JSON.parse(response);
      return {
        message: parsed.message || response,
        suggestions: parsed.suggestions || this.generateDefaultSuggestions(context),
        contextInsights: parsed.contextInsights
      };
    } catch {
      return {
        message: response,
        suggestions: this.generateDefaultSuggestions(context)
      };
    }
  }
  /**
   * Generate fallback response
   */
  generateFallbackResponse(context) {
    const isTeacher = context.user.isTeacher;
    let message = "I'm here to help! ";
    if (isTeacher) {
      message += "As an educator, I can assist with course creation, content development, student engagement strategies, and assessment design.";
    } else {
      message += "I can help you with learning strategies, understanding concepts, and making the most of your educational journey.";
    }
    return {
      message,
      suggestions: this.generateDefaultSuggestions(context)
    };
  }
  /**
   * Generate default suggestions
   */
  generateDefaultSuggestions(context) {
    const { pageType, user } = context;
    if (pageType === "course-edit" && user.isTeacher) {
      return [
        "Help me improve this course structure",
        "Suggest engagement strategies",
        "Review learning objectives",
        "Generate assessment ideas"
      ];
    }
    if (pageType === "learning" && !user.isTeacher) {
      return [
        "Explain this concept differently",
        "Give me practice problems",
        "Check my understanding",
        "Suggest study strategies"
      ];
    }
    return [
      "Help me get started",
      "Show me best practices",
      "Explain how this works",
      "What should I do next?"
    ];
  }
  /**
   * Get or create conversation
   */
  async getOrCreateConversation(userId, context) {
    const conversationId = `${userId}-${context.courseId || "global"}`;
    let conversation = this.conversations.get(conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        userId,
        messages: [],
        context,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.conversations.set(conversationId, conversation);
    }
    conversation.updatedAt = /* @__PURE__ */ new Date();
    return conversation;
  }
  /**
   * Save conversation to storage
   */
  async saveConversation(conversation) {
    if (!this.storage) return;
    try {
      await this.storage.set(
        `conversation:${conversation.id}`,
        conversation,
        86400
        // 24 hours
      );
    } catch (error) {
      this.logger.error("Failed to save conversation", error);
    }
  }
  /**
   * Load conversations from storage
   */
  async loadConversations() {
  }
  /**
   * Register a plugin
   */
  async registerPlugin(plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    if (plugin.initialize) {
      await plugin.initialize(this.config);
    }
    this.plugins.set(plugin.name, plugin);
    this.logger.info(`Plugin ${plugin.name} registered`);
  }
  /**
   * Unregister a plugin
   */
  async unregisterPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    if (plugin.destroy) {
      await plugin.destroy();
    }
    this.plugins.delete(name);
    this.logger.info(`Plugin ${name} unregistered`);
  }
  /**
   * Event emitter
   */
  async emit(type, data) {
    const event = {
      type,
      timestamp: /* @__PURE__ */ new Date(),
      data
    };
    const handlers = this.eventHandlers.get(type);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Event handler error for ${type}`, error);
      }
    }
  }
  /**
   * Event listener
   */
  on(type, handler) {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, /* @__PURE__ */ new Set());
    }
    this.eventHandlers.get(type).add(handler);
  }
  /**
   * Remove event listener
   */
  off(type, handler) {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  /**
   * Get conversation history
   */
  async getConversationHistory(userId, courseId) {
    const conversationId = `${userId}-${courseId || "global"}`;
    const conversation = this.conversations.get(conversationId);
    if (!conversation && this.storage) {
      const stored = await this.storage.get(`conversation:${conversationId}`);
      if (stored) {
        return stored.messages || [];
      }
    }
    return conversation?.messages || [];
  }
  /**
   * Clear conversation
   */
  async clearConversation(userId, courseId) {
    const conversationId = `${userId}-${courseId || "global"}`;
    this.conversations.delete(conversationId);
    if (this.storage) {
      await this.storage.delete(`conversation:${conversationId}`);
    }
  }
  /**
   * Extract feature flags from config
   */
  extractFeatureFlags(config) {
    const customFlags = config;
    return {
      enableMarketAnalysis: customFlags.enableMarketAnalysis !== false,
      enableBloomsTracking: customFlags.enableBloomsTracking !== false,
      enableAdaptiveLearning: customFlags.enableAdaptiveLearning !== false,
      enableCourseGuide: customFlags.enableCourseGuide !== false,
      enableTrendsAnalysis: customFlags.enableTrendsAnalysis === true,
      enableNewsIntegration: customFlags.enableNewsIntegration === true,
      enableResearchAccess: customFlags.enableResearchAccess === true,
      enableGamification: customFlags.enableGamification !== false,
      enableCollaboration: customFlags.enableCollaboration !== false,
      enablePredictiveAnalytics: customFlags.enablePredictiveAnalytics !== false
    };
  }
  /**
   * Initialize AI Provider
   */
  async initializeAIProvider() {
    const provider = this.config.provider || "anthropic";
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      this.logger.warn("No API key provided, AI features will be limited");
      return null;
    }
    switch (provider) {
      case "anthropic":
        return new AnthropicProvider(apiKey, this.config);
      case "openai":
        return new OpenAIProvider(apiKey, this.config);
      case "custom":
        return new CustomProvider(this.config);
      default:
        this.logger.warn(`Unknown provider: ${provider}`);
        return null;
    }
  }
  /**
   * Destroy engine and cleanup
   */
  async destroy() {
    for (const [pluginName, plugin] of this.plugins) {
      if (plugin.destroy) {
        this.logger.debug(`Destroying plugin: ${pluginName}`);
        await plugin.destroy();
      }
    }
    this.plugins.clear();
    this.conversations.clear();
    this.eventHandlers.clear();
    await this.emit("engine.destroyed", { name: this.name });
    await super.destroy();
  }
};
var AnthropicProvider = class {
  apiKeyValue;
  configValue;
  constructor(apiKey, config) {
    this.apiKeyValue = apiKey;
    this.configValue = config;
  }
  async complete(prompt) {
    console.debug(`[AnthropicProvider] Processing prompt (${prompt.length} chars) with model: ${this.configValue.model || "default"}`);
    return JSON.stringify({
      message: "This is a placeholder response. Implement Anthropic SDK integration.",
      suggestions: ["Install @anthropic-ai/sdk", "Configure API key"],
      contextInsights: null,
      apiKeyConfigured: !!this.apiKeyValue
    });
  }
};
var OpenAIProvider = class {
  apiKeyValue;
  configValue;
  constructor(apiKey, config) {
    this.apiKeyValue = apiKey;
    this.configValue = config;
  }
  async complete(prompt) {
    console.debug(`[OpenAIProvider] Processing prompt (${prompt.length} chars) with model: ${this.configValue.model || "default"}`);
    return JSON.stringify({
      message: "This is a placeholder response. Implement OpenAI SDK integration.",
      suggestions: ["Install openai package", "Configure API key"],
      contextInsights: null,
      apiKeyConfigured: !!this.apiKeyValue
    });
  }
};
var CustomProvider = class {
  configValue;
  constructor(config) {
    this.configValue = config;
  }
  async complete(prompt) {
    console.debug(`[CustomProvider] Processing prompt (${prompt.length} chars) to: ${this.configValue.baseUrl || "not configured"}`);
    return JSON.stringify({
      message: "This is a placeholder response. Implement custom provider.",
      suggestions: ["Configure base URL", "Set up authentication"],
      contextInsights: null,
      baseUrl: this.configValue.baseUrl
    });
  }
};

// src/react/index.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var SAMReactContext = createContext(null);
function SAMProvider({
  children,
  config,
  user = { id: "anonymous", isTeacher: false },
  initialContext = {},
  onError,
  onMessage
}) {
  const [engine, setEngine] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState({
    user,
    ...initialContext
  });
  const engineRef = useRef(null);
  useEffect(() => {
    const initEngine = async () => {
      try {
        const samEngine = new SAMEngine(config);
        await samEngine.initialize();
        samEngine.on("message.received", (event) => {
          if (onMessage && event.data) {
            onMessage({
              role: "assistant",
              content: event.data.message,
              timestamp: /* @__PURE__ */ new Date()
            });
          }
        });
        samEngine.on("error.occurred", (event) => {
          if (onError && event.error) {
            onError(event.error instanceof Error ? event.error : new Error(String(event.error)));
          }
        });
        engineRef.current = samEngine;
        setEngine(samEngine);
        setIsInitialized(true);
      } catch (err) {
        setError(err.message);
        if (onError) {
          onError(err);
        }
      }
    };
    initEngine();
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [config, onError, onMessage]);
  const sendMessage = useCallback(async (message, additionalContext) => {
    if (!engine || !isInitialized) {
      setError("SAM Engine is not initialized");
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fullContext = {
        ...context,
        ...additionalContext
      };
      const response = await engine.process(fullContext, message);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: message,
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          role: "assistant",
          content: response.message,
          timestamp: /* @__PURE__ */ new Date(),
          metadata: {
            suggestions: response.suggestions,
            contextInsights: response.contextInsights
          }
        }
      ]);
      return response;
    } catch (err) {
      setError(err.message);
      if (onError) {
        onError(err);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [engine, isInitialized, context, onError]);
  const clearConversation = useCallback(async () => {
    if (!engine) return;
    try {
      await engine.clearConversation(
        context.user.id,
        context.courseId
      );
      setMessages([]);
    } catch (err) {
      setError(err.message);
    }
  }, [engine, context]);
  const updateContext = useCallback((newContext) => {
    setContext((prev) => ({
      ...prev,
      ...newContext
    }));
  }, []);
  const value = {
    engine,
    isInitialized,
    isLoading,
    error,
    messages,
    sendMessage,
    clearConversation,
    updateContext
  };
  return /* @__PURE__ */ jsx(SAMReactContext.Provider, { value, children });
}
function useSAM() {
  const context = useContext(SAMReactContext);
  if (!context) {
    throw new Error("useSAM must be used within a SAMProvider");
  }
  return context;
}
function SAMChat({
  className = "",
  placeholder = "Ask SAM anything...",
  showSuggestions = true,
  autoFocus = false,
  maxHeight = "400px",
  onSendMessage
}) {
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    clearConversation
  } = useSAM();
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.metadata?.suggestions) {
      setSuggestions(lastMessage.metadata.suggestions);
    }
  }, [messages]);
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    setSuggestions([]);
    const response = await sendMessage(message);
    if (response && onSendMessage) {
      onSendMessage(message, response);
    }
  };
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: `sam-chat ${className}`, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "sam-chat-messages",
        style: { maxHeight, overflowY: "auto" },
        children: [
          messages.map((message, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `sam-message sam-message-${message.role}`,
              children: [
                /* @__PURE__ */ jsx("div", { className: "sam-message-content", children: message.content }),
                message.role === "assistant" && message.metadata?.contextInsights && /* @__PURE__ */ jsxs("div", { className: "sam-message-insights", children: [
                  message.metadata.contextInsights.observation && /* @__PURE__ */ jsxs("div", { className: "sam-insight", children: [
                    /* @__PURE__ */ jsx("strong", { children: "Observation:" }),
                    " ",
                    message.metadata.contextInsights.observation
                  ] }),
                  message.metadata.contextInsights.recommendation && /* @__PURE__ */ jsxs("div", { className: "sam-insight", children: [
                    /* @__PURE__ */ jsx("strong", { children: "Recommendation:" }),
                    " ",
                    message.metadata.contextInsights.recommendation
                  ] })
                ] })
              ]
            },
            index
          )),
          isLoading && /* @__PURE__ */ jsx("div", { className: "sam-message sam-message-loading", children: /* @__PURE__ */ jsx("div", { className: "sam-loading-indicator", children: "SAM is thinking..." }) }),
          error && /* @__PURE__ */ jsx("div", { className: "sam-message sam-message-error", children: /* @__PURE__ */ jsxs("div", { className: "sam-error-content", children: [
            "Error: ",
            error
          ] }) }),
          /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
        ]
      }
    ),
    showSuggestions && suggestions.length > 0 && /* @__PURE__ */ jsx("div", { className: "sam-suggestions", children: suggestions.map((suggestion, index) => /* @__PURE__ */ jsx(
      "button",
      {
        className: "sam-suggestion",
        onClick: () => handleSuggestionClick(suggestion),
        disabled: isLoading,
        children: suggestion
      },
      index
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "sam-chat-input", children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyPress: handleKeyPress,
          placeholder,
          autoFocus,
          disabled: isLoading,
          className: "sam-input",
          rows: 2
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "sam-chat-actions", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSend,
            disabled: !input.trim() || isLoading,
            className: "sam-send-button",
            children: "Send"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: clearConversation,
            disabled: isLoading || messages.length === 0,
            className: "sam-clear-button",
            children: "Clear"
          }
        )
      ] })
    ] })
  ] });
}
function SAMFloatingAssistant({
  position = "bottom-right",
  defaultOpen = false,
  buttonText = "Ask SAM",
  title = "SAM Assistant"
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4"
  };
  return /* @__PURE__ */ jsx("div", { className: `fixed ${positionClasses[position]} z-50`, children: isOpen ? /* @__PURE__ */ jsxs("div", { className: "sam-floating-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "sam-floating-header", children: [
      /* @__PURE__ */ jsx("h3", { children: title }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsOpen(false),
          className: "sam-close-button",
          children: "\xD7"
        }
      )
    ] }),
    /* @__PURE__ */ jsx(SAMChat, { maxHeight: "300px", autoFocus: true })
  ] }) : /* @__PURE__ */ jsx(
    "button",
    {
      onClick: () => setIsOpen(true),
      className: "sam-floating-button",
      children: buttonText
    }
  ) });
}

// src/index.ts
var VERSION = "1.0.0";
var defaultConfig = {
  provider: "anthropic",
  model: "claude-sonnet-4-5-20250929",
  temperature: 0.7,
  maxTokens: 1e3,
  cacheEnabled: true,
  cacheTTL: 300,
  rateLimitPerMinute: 60
};
function createSAMEngine(config) {
  return new SAMEngine({
    ...defaultConfig,
    ...config
  });
}
export {
  BaseEngine,
  SAMChat,
  SAMEngine,
  SAMFloatingAssistant,
  SAMProvider,
  SAMReactContext,
  VERSION,
  createSAMEngine,
  defaultConfig,
  useSAM,
  useSAM as useSAMEngine
};
