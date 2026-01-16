// src/types/context.ts
function createDefaultUserContext(overrides) {
  return {
    id: "",
    role: "student",
    preferences: {},
    capabilities: [],
    ...overrides
  };
}
function createDefaultPageContext(overrides) {
  return {
    type: "other",
    path: "/",
    capabilities: [],
    breadcrumb: [],
    ...overrides
  };
}
function createDefaultConversationContext(overrides) {
  return {
    id: null,
    messages: [],
    isStreaming: false,
    lastMessageAt: null,
    totalMessages: 0,
    ...overrides
  };
}
function createDefaultGamificationContext(overrides) {
  return {
    points: 0,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    badges: [],
    streak: {
      current: 0,
      longest: 0,
      lastActivityDate: null
    },
    achievements: [],
    ...overrides
  };
}
function createDefaultUIContext(overrides) {
  return {
    isOpen: false,
    isMinimized: false,
    position: "floating",
    theme: "system",
    size: "normal",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    ...overrides
  };
}
function createDefaultContext(overrides) {
  const now = /* @__PURE__ */ new Date();
  return {
    user: createDefaultUserContext(overrides?.user),
    page: createDefaultPageContext(overrides?.page),
    form: overrides?.form ?? null,
    conversation: createDefaultConversationContext(overrides?.conversation),
    gamification: createDefaultGamificationContext(overrides?.gamification),
    ui: createDefaultUIContext(overrides?.ui),
    metadata: {
      sessionId: generateSessionId(),
      startedAt: now,
      lastActivityAt: now,
      version: "0.1.0",
      ...overrides?.metadata
    }
  };
}
function generateSessionId() {
  return `sam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// src/types/engine.ts
var BLOOMS_LEVELS = [
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE"
];
var BLOOMS_LEVEL_ORDER = {
  REMEMBER: 1,
  UNDERSTAND: 2,
  APPLY: 3,
  ANALYZE: 4,
  EVALUATE: 5,
  CREATE: 6
};

// src/types/config.ts
function createSAMConfig(input) {
  return {
    ai: input.ai,
    storage: input.storage,
    cache: input.cache,
    analytics: input.analytics,
    database: input.database,
    logger: input.logger ?? console,
    features: {
      gamification: true,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: true,
      analytics: true,
      ...input.features
    },
    routes: input.routes ?? {
      coursesList: "/teacher/courses",
      courseDetail: "/teacher/courses/:courseId",
      courseCreate: "/teacher/create",
      chapterDetail: "/teacher/courses/:courseId/chapters/:chapterId",
      sectionDetail: "/teacher/courses/:courseId/chapters/:chapterId/section/:sectionId",
      analytics: "/teacher/analytics",
      settings: "/settings",
      learning: "/learn/:courseId"
    },
    capabilities: input.capabilities ?? getDefaultCapabilities(),
    model: {
      name: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 4e3,
      ...input.model
    },
    rateLimit: input.rateLimit ? {
      maxRequests: 100,
      windowMs: 6e4,
      ...input.rateLimit
    } : void 0,
    engine: {
      timeout: 3e4,
      retries: 2,
      concurrency: 3,
      cacheEnabled: true,
      cacheTTL: 300,
      ...input.engine
    },
    maxConversationHistory: input.maxConversationHistory ?? 50,
    systemPrompt: input.systemPrompt,
    personality: input.personality
  };
}
function getDefaultCapabilities() {
  return {
    "courses-list": [
      "view-courses",
      "create-course",
      "analyze-courses",
      "bulk-operations"
    ],
    "course-detail": [
      "edit-course",
      "generate-chapters",
      "analyze-structure",
      "publish-course"
    ],
    "course-create": [
      "create-course",
      "generate-blueprint",
      "ai-assistance"
    ],
    "chapter-detail": [
      "edit-chapter",
      "generate-sections",
      "create-assessment",
      "analyze-content"
    ],
    "section-detail": [
      "edit-section",
      "add-content",
      "create-quiz",
      "analyze-blooms"
    ],
    analytics: [
      "view-analytics",
      "export-data",
      "compare-courses"
    ],
    learning: [
      "take-quiz",
      "ask-question",
      "get-help",
      "track-progress"
    ]
  };
}

// src/state-machine.ts
var SAMStateMachine = class {
  state = "idle";
  context;
  listeners = /* @__PURE__ */ new Set();
  _streamingMessageId = null;
  streamingContent = "";
  // Getter for streaming message ID (used for future streaming support)
  get streamingMessageId() {
    return this._streamingMessageId;
  }
  constructor(initialContext) {
    this.context = createDefaultContext(initialContext);
  }
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  /**
   * Get current context
   */
  getContext() {
    return this.context;
  }
  /**
   * Get a snapshot of state and context
   */
  getSnapshot() {
    return {
      state: this.state,
      context: this.context
    };
  }
  /**
   * Send an event to the state machine
   */
  send(event) {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp ?? /* @__PURE__ */ new Date()
    };
    const previousState = this.state;
    const previousContext = this.context;
    const [nextState, nextContext] = this.transition(
      this.state,
      eventWithTimestamp,
      this.context
    );
    if (nextState !== previousState || nextContext !== previousContext) {
      this.state = nextState;
      this.context = {
        ...nextContext,
        metadata: {
          ...nextContext.metadata,
          lastActivityAt: /* @__PURE__ */ new Date()
        }
      };
      this.notify(eventWithTimestamp);
    }
  }
  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  /**
   * Check if in a specific state
   */
  isInState(state) {
    return this.state === state;
  }
  /**
   * Check if SAM is busy (processing, streaming, analyzing, executing)
   */
  isBusy() {
    return ["processing", "streaming", "analyzing", "executing"].includes(this.state);
  }
  /**
   * Check if SAM can accept user input
   */
  canAcceptInput() {
    return ["ready", "listening"].includes(this.state);
  }
  // ============================================================================
  // STATE TRANSITIONS
  // ============================================================================
  transition(state, event, context) {
    switch (event.type) {
      case "UPDATE_CONTEXT":
        return [state, this.handleUpdateContext(context, event.payload)];
      case "UPDATE_PAGE":
        return [state, this.handleUpdatePage(context, event.payload)];
      case "UPDATE_FORM":
        return [state, this.handleUpdateForm(context, event.payload)];
      case "UPDATE_GAMIFICATION":
        return [state, this.handleUpdateGamification(context, event.payload)];
      case "RESET":
        return ["ready", this.handleReset(context)];
      case "CLEAR_CONVERSATION":
        return [state, this.handleClearConversation(context)];
    }
    switch (state) {
      case "idle":
        return this.transitionFromIdle(event, context);
      case "ready":
        return this.transitionFromReady(event, context);
      case "listening":
        return this.transitionFromListening(event, context);
      case "processing":
        return this.transitionFromProcessing(event, context);
      case "streaming":
        return this.transitionFromStreaming(event, context);
      case "analyzing":
        return this.transitionFromAnalyzing(event, context);
      case "executing":
        return this.transitionFromExecuting(event, context);
      case "error":
        return this.transitionFromError(event, context);
      default:
        return [state, context];
    }
  }
  transitionFromIdle(event, context) {
    switch (event.type) {
      case "INITIALIZE":
        return ["ready", context];
      case "OPEN":
        return ["listening", this.handleOpen(context)];
      default:
        return ["idle", context];
    }
  }
  transitionFromReady(event, context) {
    switch (event.type) {
      case "OPEN":
        return ["listening", this.handleOpen(context)];
      case "SEND_MESSAGE":
        return ["processing", this.handleSendMessage(context, event.payload)];
      case "ANALYZE":
        return ["analyzing", context];
      default:
        return ["ready", context];
    }
  }
  transitionFromListening(event, context) {
    switch (event.type) {
      case "CLOSE":
        return ["ready", this.handleClose(context)];
      case "MINIMIZE":
        return ["listening", this.handleMinimize(context)];
      case "SEND_MESSAGE":
        return ["processing", this.handleSendMessage(context, event.payload)];
      case "ANALYZE":
        return ["analyzing", context];
      case "EXECUTE_ACTION":
        return ["executing", context];
      default:
        return ["listening", context];
    }
  }
  transitionFromProcessing(event, context) {
    switch (event.type) {
      case "RECEIVE_RESPONSE":
        return ["listening", this.handleReceiveResponse(context, event.payload)];
      case "START_STREAMING":
        this._streamingMessageId = event.payload.messageId;
        this.streamingContent = "";
        return ["streaming", this.handleStartStreaming(context)];
      case "ERROR":
        return ["error", this.handleError(context, event.payload)];
      default:
        return ["processing", context];
    }
  }
  transitionFromStreaming(event, context) {
    switch (event.type) {
      case "STREAM_CHUNK":
        return ["streaming", this.handleStreamChunk(context, event.payload)];
      case "END_STREAMING":
        const finalContext = this.handleEndStreaming(context);
        this._streamingMessageId = null;
        this.streamingContent = "";
        return ["listening", finalContext];
      case "ERROR":
        this._streamingMessageId = null;
        this.streamingContent = "";
        return ["error", this.handleError(context, event.payload)];
      default:
        return ["streaming", context];
    }
  }
  transitionFromAnalyzing(event, context) {
    switch (event.type) {
      case "ANALYSIS_COMPLETE":
        return ["listening", this.handleAnalysisComplete(context, event.payload)];
      case "ERROR":
        return ["error", this.handleError(context, event.payload)];
      default:
        return ["analyzing", context];
    }
  }
  transitionFromExecuting(event, context) {
    switch (event.type) {
      case "ACTION_COMPLETE":
        return ["listening", context];
      case "ERROR":
        return ["error", this.handleError(context, event.payload)];
      default:
        return ["executing", context];
    }
  }
  transitionFromError(event, context) {
    switch (event.type) {
      case "RESET":
        return ["ready", this.handleReset(context)];
      case "OPEN":
        return ["listening", this.handleOpen(context)];
      case "SEND_MESSAGE":
        return ["processing", this.handleSendMessage(context, event.payload)];
      default:
        return ["error", context];
    }
  }
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  handleOpen(context) {
    return {
      ...context,
      ui: {
        ...context.ui,
        isOpen: true,
        isMinimized: false
      }
    };
  }
  handleClose(context) {
    return {
      ...context,
      ui: {
        ...context.ui,
        isOpen: false
      }
    };
  }
  handleMinimize(context) {
    return {
      ...context,
      ui: {
        ...context.ui,
        isMinimized: true
      }
    };
  }
  handleSendMessage(context, content) {
    const message = {
      id: this.generateId(),
      role: "user",
      content,
      timestamp: /* @__PURE__ */ new Date()
    };
    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: /* @__PURE__ */ new Date(),
        totalMessages: context.conversation.totalMessages + 1
      }
    };
  }
  handleReceiveResponse(context, message) {
    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: /* @__PURE__ */ new Date(),
        totalMessages: context.conversation.totalMessages + 1,
        isStreaming: false
      }
    };
  }
  handleStartStreaming(context) {
    return {
      ...context,
      conversation: {
        ...context.conversation,
        isStreaming: true
      }
    };
  }
  handleStreamChunk(context, payload) {
    this.streamingContent += payload.content;
    const messages = [...context.conversation.messages];
    const existingIndex = messages.findIndex((m) => m.id === payload.messageId);
    if (existingIndex >= 0) {
      messages[existingIndex] = {
        ...messages[existingIndex],
        content: this.streamingContent
      };
    } else {
      messages.push({
        id: payload.messageId,
        role: "assistant",
        content: this.streamingContent,
        timestamp: /* @__PURE__ */ new Date()
      });
    }
    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages
      }
    };
  }
  handleEndStreaming(context) {
    return {
      ...context,
      conversation: {
        ...context.conversation,
        isStreaming: false,
        lastMessageAt: /* @__PURE__ */ new Date(),
        totalMessages: context.conversation.totalMessages + 1
      }
    };
  }
  handleAnalysisComplete(context, payload) {
    const message = {
      id: this.generateId(),
      role: "assistant",
      content: "Analysis complete.",
      timestamp: /* @__PURE__ */ new Date(),
      metadata: {
        engineInsights: payload
      }
    };
    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: /* @__PURE__ */ new Date(),
        totalMessages: context.conversation.totalMessages + 1
      }
    };
  }
  handleError(context, payload) {
    const message = {
      id: this.generateId(),
      role: "system",
      content: `Error: ${payload.error.message}`,
      timestamp: /* @__PURE__ */ new Date(),
      metadata: {
        engineInsights: {
          error: true,
          recoverable: payload.recoverable
        }
      }
    };
    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        isStreaming: false
      }
    };
  }
  handleReset(context) {
    return createDefaultContext({
      user: context.user,
      page: context.page,
      ui: { ...context.ui, isOpen: false },
      metadata: {
        ...context.metadata,
        lastActivityAt: /* @__PURE__ */ new Date()
      }
    });
  }
  handleClearConversation(context) {
    return {
      ...context,
      conversation: {
        id: null,
        messages: [],
        isStreaming: false,
        lastMessageAt: null,
        totalMessages: 0
      }
    };
  }
  handleUpdateContext(context, partial) {
    return {
      ...context,
      ...partial,
      user: partial.user ? { ...context.user, ...partial.user } : context.user,
      page: partial.page ? { ...context.page, ...partial.page } : context.page,
      conversation: partial.conversation ? { ...context.conversation, ...partial.conversation } : context.conversation,
      gamification: partial.gamification ? { ...context.gamification, ...partial.gamification } : context.gamification,
      ui: partial.ui ? { ...context.ui, ...partial.ui } : context.ui
    };
  }
  handleUpdatePage(context, page) {
    return {
      ...context,
      page: {
        ...context.page,
        ...page
      }
    };
  }
  handleUpdateForm(context, form) {
    return {
      ...context,
      form
    };
  }
  handleUpdateGamification(context, gamification) {
    return {
      ...context,
      gamification: {
        ...context.gamification,
        ...gamification
      }
    };
  }
  // ============================================================================
  // UTILITIES
  // ============================================================================
  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(this.state, this.context, event);
      } catch (error) {
        console.error("SAMStateMachine: Listener error", error);
      }
    }
  }
  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};
function createStateMachine(initialContext) {
  return new SAMStateMachine(initialContext);
}

// src/errors.ts
var SAMError = class _SAMError extends Error {
  code;
  details;
  recoverable;
  engineName;
  timestamp;
  originalCause;
  constructor(message, options) {
    super(message, { cause: options?.cause });
    this.name = "SAMError";
    this.code = options?.code ?? "UNKNOWN_ERROR";
    this.details = options?.details;
    this.originalCause = options?.cause;
    this.recoverable = options?.recoverable ?? true;
    this.engineName = options?.engineName;
    this.timestamp = /* @__PURE__ */ new Date();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _SAMError);
    }
  }
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.originalCause,
      recoverable: this.recoverable,
      engineName: this.engineName,
      timestamp: this.timestamp
    };
  }
};
var ConfigurationError = class extends SAMError {
  constructor(message, details) {
    super(message, {
      code: "CONFIGURATION_ERROR",
      details,
      recoverable: false
    });
    this.name = "ConfigurationError";
  }
};
var InitializationError = class extends SAMError {
  constructor(message, options) {
    super(message, {
      code: "INITIALIZATION_ERROR",
      cause: options?.cause,
      engineName: options?.engineName,
      recoverable: false
    });
    this.name = "InitializationError";
  }
};
var EngineError = class extends SAMError {
  constructor(engineName, message, options) {
    super(message, {
      code: "ENGINE_ERROR",
      cause: options?.cause,
      details: options?.details,
      engineName,
      recoverable: options?.recoverable ?? true
    });
    this.name = "EngineError";
  }
};
var OrchestrationError = class extends SAMError {
  constructor(message, options) {
    super(message, {
      code: "ORCHESTRATION_ERROR",
      cause: options?.cause,
      details: options?.details,
      recoverable: true
    });
    this.name = "OrchestrationError";
  }
};
var AIError = class extends SAMError {
  constructor(message, options) {
    super(message, {
      code: "AI_ERROR",
      cause: options?.cause,
      details: options?.details,
      recoverable: options?.recoverable ?? true
    });
    this.name = "AIError";
  }
};
var StorageError = class extends SAMError {
  constructor(message, options) {
    super(message, {
      code: "STORAGE_ERROR",
      cause: options?.cause,
      details: options?.details,
      recoverable: true
    });
    this.name = "StorageError";
  }
};
var CacheError = class extends SAMError {
  constructor(message, options) {
    super(message, {
      code: "CACHE_ERROR",
      cause: options?.cause,
      recoverable: true
    });
    this.name = "CacheError";
  }
};
var ValidationError = class extends SAMError {
  fieldErrors;
  constructor(message, fieldErrors) {
    super(message, {
      code: "VALIDATION_ERROR",
      details: { fieldErrors },
      recoverable: true
    });
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors ?? {};
  }
};
var TimeoutError = class extends SAMError {
  timeoutMs;
  constructor(message, timeoutMs, engineName) {
    super(message, {
      code: "TIMEOUT_ERROR",
      details: { timeoutMs },
      engineName,
      recoverable: true
    });
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
};
var RateLimitError = class extends SAMError {
  retryAfterMs;
  constructor(message, retryAfterMs) {
    super(message, {
      code: "RATE_LIMIT_ERROR",
      details: { retryAfterMs },
      recoverable: true
    });
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
};
var DependencyError = class extends SAMError {
  missingDependency;
  constructor(engineName, missingDependency) {
    super(`Engine "${engineName}" missing required dependency: ${missingDependency}`, {
      code: "DEPENDENCY_ERROR",
      details: { missingDependency },
      engineName,
      recoverable: false
    });
    this.name = "DependencyError";
    this.missingDependency = missingDependency;
  }
};
function isSAMError(error) {
  return error instanceof SAMError;
}
function wrapError(error, fallbackMessage = "An unexpected error occurred") {
  if (error instanceof SAMError) {
    return error;
  }
  if (error instanceof Error) {
    return new SAMError(error.message || fallbackMessage, {
      cause: error,
      recoverable: true
    });
  }
  return new SAMError(String(error) || fallbackMessage, {
    recoverable: true
  });
}
function createTimeoutPromise(ms, engineName) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${ms}ms`, ms, engineName));
    }, ms);
  });
}
async function withTimeout(promise, ms, engineName) {
  return Promise.race([promise, createTimeoutPromise(ms, engineName)]);
}
async function withRetry(fn, options) {
  const { retries, baseDelayMs = 1e3, maxDelayMs = 1e4, onRetry } = options;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        onRetry?.(lastError, attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// src/orchestrator.ts
var SAMAgentOrchestrator = class {
  engines = /* @__PURE__ */ new Map();
  executionTiers = [];
  logger;
  constructor(config) {
    this.logger = config.logger ?? console;
  }
  // ============================================================================
  // ENGINE REGISTRATION
  // ============================================================================
  /**
   * Register an engine with the orchestrator
   */
  registerEngine(engine, enabled = true) {
    if (this.engines.has(engine.name)) {
      this.logger.warn(`[Orchestrator] Engine "${engine.name}" already registered, replacing`);
    }
    this.engines.set(engine.name, { engine, enabled });
    this.logger.debug(`[Orchestrator] Registered engine: ${engine.name} v${engine.version}`);
    this.recalculateExecutionTiers();
  }
  /**
   * Unregister an engine
   */
  unregisterEngine(name) {
    const removed = this.engines.delete(name);
    if (removed) {
      this.recalculateExecutionTiers();
      this.logger.debug(`[Orchestrator] Unregistered engine: ${name}`);
    }
    return removed;
  }
  /**
   * Enable/disable an engine
   */
  setEngineEnabled(name, enabled) {
    const registration = this.engines.get(name);
    if (registration) {
      registration.enabled = enabled;
      this.logger.debug(`[Orchestrator] Engine "${name}" ${enabled ? "enabled" : "disabled"}`);
    }
  }
  /**
   * Get registered engine names
   */
  getRegisteredEngines() {
    return Array.from(this.engines.keys());
  }
  /**
   * Get enabled engine names
   */
  getEnabledEngines() {
    return Array.from(this.engines.entries()).filter(([, reg]) => reg.enabled).map(([name]) => name);
  }
  // ============================================================================
  // ORCHESTRATION
  // ============================================================================
  /**
   * Run all enabled engines in dependency order
   */
  async orchestrate(context, query, options) {
    const startTime = Date.now();
    const results = {};
    const enginesFailed = [];
    const enginesCached = [];
    this.logger.debug(`[Orchestrator] Starting orchestration with query: "${query?.substring(0, 50)}..."`);
    const enginesToRun = this.getEnginesToRun(options?.engines);
    await this.initializeEngines(enginesToRun);
    for (const tier of this.executionTiers) {
      const tierEngines = tier.engines.filter((name) => enginesToRun.includes(name));
      if (tierEngines.length === 0) continue;
      if (tier.parallel) {
        const tierResults = await Promise.all(
          tierEngines.map((name) => this.executeEngine(name, context, query, results))
        );
        for (const result of tierResults) {
          if (result) {
            results[result.engineName] = result;
            if (!result.success) enginesFailed.push(result.engineName);
            if (result.metadata.cached) enginesCached.push(result.engineName);
          }
        }
      } else {
        for (const name of tierEngines) {
          const result = await this.executeEngine(name, context, query, results);
          if (result) {
            results[result.engineName] = result;
            if (!result.success) enginesFailed.push(result.engineName);
            if (result.metadata.cached) enginesCached.push(result.engineName);
          }
        }
      }
    }
    const response = this.aggregateResults(results, context, query);
    const metadata = {
      totalExecutionTime: Date.now() - startTime,
      enginesExecuted: Object.keys(results),
      enginesFailed,
      enginesCached,
      parallelTiers: this.executionTiers.map((t) => t.engines)
    };
    this.logger.debug(
      `[Orchestrator] Completed in ${metadata.totalExecutionTime}ms. Executed: ${metadata.enginesExecuted.length}, Failed: ${enginesFailed.length}, Cached: ${enginesCached.length}`
    );
    return {
      success: enginesFailed.length === 0,
      results,
      response,
      metadata
    };
  }
  /**
   * Run a single engine by name
   */
  async runEngine(name, context, query, previousResults) {
    return this.executeEngine(name, context, query, previousResults ?? {});
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  /**
   * Execute a single engine
   */
  async executeEngine(name, context, query, previousResults) {
    const registration = this.engines.get(name);
    if (!registration || !registration.enabled) {
      return null;
    }
    try {
      const result = await registration.engine.execute({
        context,
        query,
        previousResults
      });
      return result;
    } catch (error) {
      this.logger.error(`[Orchestrator] Engine "${name}" threw: ${error.message}`);
      return {
        engineName: name,
        success: false,
        data: null,
        metadata: {
          executionTime: 0,
          cached: false,
          version: registration.engine.version
        },
        error: {
          code: "ENGINE_ERROR",
          message: error.message,
          recoverable: true
        }
      };
    }
  }
  /**
   * Initialize engines
   */
  async initializeEngines(names) {
    const initPromises = names.map((name) => this.engines.get(name)?.engine).filter((engine) => engine !== void 0).filter((engine) => !engine.isInitialized()).map((engine) => engine.initialize());
    await Promise.all(initPromises);
  }
  /**
   * Get list of engines to run based on options
   */
  getEnginesToRun(requestedEngines) {
    const enabledEngines = this.getEnabledEngines();
    if (!requestedEngines || requestedEngines.length === 0) {
      return enabledEngines;
    }
    return requestedEngines.filter((name) => enabledEngines.includes(name));
  }
  /**
   * Calculate execution tiers based on dependencies (topological sort)
   */
  recalculateExecutionTiers() {
    const engines = Array.from(this.engines.entries()).filter(([, reg]) => reg.enabled).map(([name, reg]) => ({
      name,
      dependencies: reg.engine.dependencies
    }));
    const tiers = [];
    const scheduled = /* @__PURE__ */ new Set();
    const remaining = new Set(engines.map((e) => e.name));
    while (remaining.size > 0) {
      const tier = [];
      for (const engine of engines) {
        if (scheduled.has(engine.name)) continue;
        if (!remaining.has(engine.name)) continue;
        const depsScheduled = engine.dependencies.every(
          (dep) => scheduled.has(dep) || !remaining.has(dep)
        );
        if (depsScheduled) {
          tier.push(engine.name);
        }
      }
      if (tier.length === 0 && remaining.size > 0) {
        throw new OrchestrationError(
          `Circular dependency detected among engines: ${Array.from(remaining).join(", ")}`
        );
      }
      for (const name of tier) {
        scheduled.add(name);
        remaining.delete(name);
      }
      if (tier.length > 0) {
        tiers.push({
          engines: tier,
          parallel: tier.length > 1
          // Parallelize if multiple engines in tier
        });
      }
    }
    this.executionTiers = tiers;
    this.logger.debug(
      `[Orchestrator] Execution tiers: ${tiers.map((t) => `[${t.engines.join(", ")}]`).join(" -> ")}`
    );
  }
  /**
   * Aggregate results from all engines into a unified response
   */
  aggregateResults(results, context, query) {
    const responseEngine = results["response"];
    if (responseEngine?.success && responseEngine.data) {
      const data = responseEngine.data;
      return {
        message: data.message || this.generateDefaultMessage(context, query),
        suggestions: data.suggestions || [],
        actions: data.actions || this.getPageActions(context.page.type),
        insights: data.insights || this.extractInsights(results),
        blooms: data.blooms
      };
    }
    return {
      message: this.generateDefaultMessage(context, query),
      suggestions: this.extractSuggestions(results),
      actions: this.getPageActions(context.page.type),
      insights: this.extractInsights(results),
      blooms: this.extractBloomsAnalysis(results)
    };
  }
  /**
   * Generate a default message based on context
   */
  generateDefaultMessage(context, query) {
    if (query) {
      return `I've analyzed your request and prepared insights based on the current context.`;
    }
    const pageMessages = {
      // Dashboard routes
      dashboard: "Welcome! I'm here to help you manage your courses and track your progress.",
      "user-dashboard": "Welcome back! I can help you continue learning or explore new courses.",
      "admin-dashboard": "I can assist with platform management, user analytics, or system settings.",
      "teacher-dashboard": "I'm here to help you manage courses, view analytics, or create new content.",
      "user-analytics": "I can help you understand your learning progress and identify areas for improvement.",
      // Course management routes
      "courses-list": "I can help you analyze your courses, create new ones, or find insights.",
      "course-detail": "I can help you improve this course structure, generate content, or analyze its effectiveness.",
      "course-create": "Let's create an amazing course together. I'll guide you through the process.",
      "chapter-detail": "I can help you develop this chapter, create assessments, or improve the content.",
      "section-detail": "I can help you enhance this section with better content or assessments.",
      analytics: "I can help you understand your analytics and provide actionable insights.",
      // Learning routes
      learning: "I'm here to help you learn! Ask me anything about the course material.",
      "course-learning": "Ready to start learning? I can guide you through this course and answer questions.",
      "chapter-learning": "I'm here to help you understand this chapter. Ask me about any concepts!",
      "section-learning": "Let me help you complete this section. Feel free to ask for clarification.",
      // Exam routes
      exam: "I can help you prepare for this assessment or explain any concepts.",
      "exam-results": "Let's review your results together. I can help you understand your performance and improve.",
      // General routes
      settings: "I can help you configure your preferences and settings.",
      other: "How can I assist you today?"
    };
    return pageMessages[context.page.type] || pageMessages.other;
  }
  /**
   * Extract suggestions from engine results
   */
  extractSuggestions(results) {
    const suggestions = [];
    let id = 0;
    for (const result of Object.values(results)) {
      if (!result.success || !result.data) continue;
      const data = result.data;
      if (Array.isArray(data.suggestions)) {
        for (const suggestion of data.suggestions) {
          if (typeof suggestion === "string") {
            suggestions.push({
              id: `sug_${id++}`,
              label: suggestion.substring(0, 50),
              text: suggestion,
              type: "quick-reply"
            });
          } else if (typeof suggestion === "object" && suggestion !== null) {
            suggestions.push({
              ...suggestion,
              id: `sug_${id++}`
            });
          }
        }
      }
      if (Array.isArray(data.recommendations)) {
        for (const rec of data.recommendations) {
          if (typeof rec === "string") {
            suggestions.push({
              id: `sug_${id++}`,
              label: rec.substring(0, 50),
              text: rec,
              type: "action"
            });
          }
        }
      }
    }
    const unique = suggestions.filter(
      (s, i, arr) => arr.findIndex((x) => x.text === s.text) === i
    );
    return unique.slice(0, 5);
  }
  /**
   * Get page-specific actions
   */
  getPageActions(pageType) {
    const actionMap = {
      // Dashboard routes
      dashboard: [
        { id: "act_1", type: "navigate", label: "View Courses", payload: { path: "/teacher/courses" } },
        { id: "act_2", type: "analyze", label: "Get Insights", payload: { type: "overview" } }
      ],
      "user-dashboard": [
        { id: "act_1", type: "navigate", label: "Continue Learning", payload: { path: "/courses" } },
        { id: "act_2", type: "custom", label: "Get Recommendations", payload: { type: "recommendations" } }
      ],
      "admin-dashboard": [
        { id: "act_1", type: "analyze", label: "Platform Analytics", payload: { type: "platform" } },
        { id: "act_2", type: "navigate", label: "Manage Users", payload: { path: "/admin/users" } }
      ],
      "teacher-dashboard": [
        { id: "act_1", type: "navigate", label: "View Courses", payload: { path: "/teacher/courses" } },
        { id: "act_2", type: "navigate", label: "Create Course", payload: { path: "/teacher/create" } }
      ],
      "user-analytics": [
        { id: "act_1", type: "analyze", label: "Learning Insights", payload: { type: "learning" } },
        { id: "act_2", type: "custom", label: "Set Goals", payload: { type: "goals" } }
      ],
      // Course management routes
      "courses-list": [
        { id: "act_1", type: "navigate", label: "Create Course", payload: { path: "/teacher/create" } },
        { id: "act_2", type: "analyze", label: "Analyze Courses", payload: { type: "courses-overview" } }
      ],
      "course-detail": [
        { id: "act_1", type: "generate", label: "Generate Chapters", payload: { type: "chapters" } },
        { id: "act_2", type: "analyze", label: "Analyze Structure", payload: { type: "blooms" } }
      ],
      "course-create": [
        { id: "act_1", type: "generate", label: "Generate Blueprint", payload: { type: "blueprint" } },
        { id: "act_2", type: "analyze", label: "Validate Structure", payload: { type: "validation" } }
      ],
      "chapter-detail": [
        { id: "act_1", type: "generate", label: "Generate Sections", payload: { type: "sections" } },
        { id: "act_2", type: "generate", label: "Create Assessment", payload: { type: "assessment" } }
      ],
      "section-detail": [
        { id: "act_1", type: "generate", label: "Enhance Content", payload: { type: "content" } },
        { id: "act_2", type: "analyze", label: "Analyze Blooms", payload: { type: "blooms" } }
      ],
      analytics: [
        { id: "act_1", type: "analyze", label: "Deep Analysis", payload: { type: "comprehensive" } },
        { id: "act_2", type: "generate", label: "Generate Report", payload: { type: "report" } }
      ],
      // Learning routes
      learning: [
        { id: "act_1", type: "custom", label: "Explain This", payload: { type: "explain" } },
        { id: "act_2", type: "custom", label: "Quiz Me", payload: { type: "quiz" } }
      ],
      "course-learning": [
        { id: "act_1", type: "custom", label: "Start Learning", payload: { type: "start" } },
        { id: "act_2", type: "custom", label: "Ask About Course", payload: { type: "explain" } }
      ],
      "chapter-learning": [
        { id: "act_1", type: "custom", label: "Explain This", payload: { type: "explain" } },
        { id: "act_2", type: "custom", label: "Quiz Me", payload: { type: "quiz" } }
      ],
      "section-learning": [
        { id: "act_1", type: "custom", label: "Get Help", payload: { type: "help" } },
        { id: "act_2", type: "custom", label: "Check Understanding", payload: { type: "quiz" } }
      ],
      // Exam routes
      exam: [
        { id: "act_1", type: "custom", label: "Get Hint", payload: { type: "hint" } },
        { id: "act_2", type: "custom", label: "Explain Answer", payload: { type: "explain" } }
      ],
      "exam-results": [
        { id: "act_1", type: "custom", label: "Review Mistakes", payload: { type: "review" } },
        { id: "act_2", type: "custom", label: "Improvement Tips", payload: { type: "improve" } }
      ],
      // General routes
      settings: [],
      other: []
    };
    return actionMap[pageType] || [];
  }
  /**
   * Extract insights from engine results
   */
  extractInsights(results) {
    const insights = {};
    for (const [name, result] of Object.entries(results)) {
      if (result.success && result.data) {
        insights[name] = result.data;
      }
    }
    return insights;
  }
  /**
   * Extract Bloom's analysis from results
   */
  extractBloomsAnalysis(results) {
    const bloomsResult = results["blooms"];
    if (bloomsResult?.success && bloomsResult.data) {
      const data = bloomsResult.data;
      if (data.distribution && data.dominantLevel) {
        return data;
      }
    }
    return void 0;
  }
};
function createOrchestrator(config) {
  return new SAMAgentOrchestrator(config);
}

// src/engines/base.ts
var BaseEngine = class {
  name;
  version;
  dependencies;
  config;
  logger;
  ai;
  cache;
  timeout;
  retries;
  cacheEnabled;
  cacheTTL;
  initialized = false;
  initializing = false;
  constructor(options) {
    this.name = options.name;
    this.version = options.version;
    this.dependencies = options.dependencies ?? [];
    this.config = options.config;
    this.logger = options.config.logger ?? console;
    this.ai = options.config.ai;
    this.cache = options.config.cache;
    this.timeout = options.timeout ?? options.config.engine.timeout;
    this.retries = options.retries ?? options.config.engine.retries;
    this.cacheEnabled = options.cacheEnabled ?? options.config.engine.cacheEnabled;
    this.cacheTTL = options.cacheTTL ?? options.config.engine.cacheTTL;
  }
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  /**
   * Initialize the engine (called once before first execution)
   */
  async initialize() {
    if (this.initialized) return;
    if (this.initializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.initialize();
    }
    this.initializing = true;
    try {
      this.logger.debug(`[${this.name}] Initializing engine v${this.version}`);
      await this.onInitialize();
      this.initialized = true;
      this.logger.debug(`[${this.name}] Engine initialized successfully`);
    } catch (error) {
      this.initializing = false;
      throw new EngineError(this.name, `Failed to initialize: ${error.message}`, {
        cause: error,
        recoverable: false
      });
    } finally {
      this.initializing = false;
    }
  }
  /**
   * Execute the engine
   */
  async execute(input) {
    const startTime = Date.now();
    if (!this.initialized) {
      await this.initialize();
    }
    this.validateDependencies(input.previousResults ?? {});
    if (this.cacheEnabled && this.cache) {
      const cacheKey = this.getCacheKey(input);
      const cached = await this.tryGetFromCache(cacheKey);
      if (cached !== null) {
        return this.createResult(cached, startTime, true);
      }
    }
    try {
      const result = await withRetry(
        () => withTimeout(
          this.process(input),
          this.timeout,
          this.name
        ),
        {
          retries: this.retries,
          onRetry: (error, attempt) => {
            this.logger.warn(
              `[${this.name}] Retry attempt ${attempt}/${this.retries}: ${error.message}`
            );
          }
        }
      );
      if (this.cacheEnabled && this.cache && result !== null) {
        const cacheKey = this.getCacheKey(input);
        await this.trySetCache(cacheKey, result);
      }
      return this.createResult(result, startTime, false);
    } catch (error) {
      return this.createErrorResult(error, startTime);
    }
  }
  /**
   * Check if the engine is initialized
   */
  isInitialized() {
    return this.initialized;
  }
  // ============================================================================
  // ABSTRACT METHODS (implement in subclasses)
  // ============================================================================
  /**
   * Initialize the engine (override for custom initialization)
   */
  async onInitialize() {
  }
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  /**
   * Validate that all dependencies have been executed
   */
  validateDependencies(previousResults) {
    for (const dep of this.dependencies) {
      const result = previousResults[dep];
      if (!result) {
        throw new DependencyError(this.name, dep);
      }
      if (!result.success) {
        throw new EngineError(
          this.name,
          `Dependency "${dep}" failed: ${result.error?.message ?? "Unknown error"}`,
          { recoverable: false }
        );
      }
    }
  }
  /**
   * Get dependency result with type safety
   */
  getDependencyResult(previousResults, engineName) {
    const result = previousResults[engineName];
    if (!result) {
      throw new DependencyError(this.name, engineName);
    }
    if (!result.success) {
      throw new EngineError(
        this.name,
        `Dependency "${engineName}" failed`,
        { recoverable: false }
      );
    }
    return result.data;
  }
  /**
   * Try to get a value from cache
   */
  async tryGetFromCache(key) {
    if (!this.cache) return null;
    try {
      const cached = await this.cache.get(key);
      if (cached !== null) {
        this.logger.debug(`[${this.name}] Cache hit: ${key}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`[${this.name}] Cache get error: ${error.message}`);
    }
    return null;
  }
  /**
   * Try to set a value in cache
   */
  async trySetCache(key, value) {
    if (!this.cache) return;
    try {
      await this.cache.set(key, value, this.cacheTTL);
      this.logger.debug(`[${this.name}] Cache set: ${key}`);
    } catch (error) {
      this.logger.warn(`[${this.name}] Cache set error: ${error.message}`);
    }
  }
  /**
   * Create a successful result
   */
  createResult(data, startTime, cached) {
    const metadata = {
      executionTime: Date.now() - startTime,
      cached,
      version: this.version
    };
    return {
      engineName: this.name,
      success: true,
      data,
      metadata
    };
  }
  /**
   * Create an error result
   */
  createErrorResult(error, startTime) {
    const samError = error instanceof SAMError ? error : new EngineError(this.name, error.message, {
      cause: error
    });
    this.logger.error(`[${this.name}] Execution failed: ${samError.message}`);
    return {
      engineName: this.name,
      success: false,
      data: null,
      metadata: {
        executionTime: Date.now() - startTime,
        cached: false,
        version: this.version
      },
      error: {
        code: samError.code,
        message: samError.message,
        details: samError.details,
        recoverable: samError.recoverable
      }
    };
  }
  /**
   * Call the AI adapter for chat completion
   */
  async callAI(params) {
    const response = await this.ai.chat({
      messages: [{ role: "user", content: params.userMessage }],
      systemPrompt: params.systemPrompt,
      temperature: params.temperature ?? this.config.model.temperature,
      maxTokens: params.maxTokens ?? this.config.model.maxTokens
    });
    return {
      content: response.content,
      tokens: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens
      }
    };
  }
  /**
   * Parse JSON from AI response safely
   */
  parseJSON(content, fallback) {
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      return JSON.parse(jsonString);
    } catch {
      this.logger.warn(`[${this.name}] Failed to parse JSON response`);
      return fallback;
    }
  }
  /**
   * Generate a hash for cache keys
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
};

// src/engines/context.ts
var ContextEngine = class extends BaseEngine {
  constructor(config) {
    super({
      config,
      name: "context",
      version: "1.0.0",
      dependencies: [],
      // No dependencies - runs first
      cacheEnabled: false
      // Context should always be fresh
    });
  }
  async process(input) {
    const { context, query } = input;
    const enrichedContext = this.analyzePageContext(context.page.type, context.page.entityId);
    let queryAnalysis = null;
    if (query) {
      queryAnalysis = await this.analyzeQuery(query);
    }
    return {
      enrichedContext,
      queryAnalysis
    };
  }
  getCacheKey(input) {
    return `context:${input.context.page.path}:${input.query ?? "none"}`;
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  analyzePageContext(pageType, entityId) {
    const entityTypeMap = {
      // Dashboard routes
      dashboard: "user",
      "user-dashboard": "user",
      "admin-dashboard": "user",
      "teacher-dashboard": "user",
      "user-analytics": "user",
      // Course management routes
      "courses-list": "none",
      "course-detail": "course",
      "course-create": "course",
      "chapter-detail": "chapter",
      "section-detail": "section",
      analytics: "none",
      // Learning routes
      learning: "course",
      "course-learning": "course",
      "chapter-learning": "chapter",
      "section-learning": "section",
      // Exam routes
      exam: "section",
      "exam-results": "section",
      // General routes
      settings: "user",
      other: "none"
    };
    const capabilitiesMap = {
      // Dashboard routes
      dashboard: ["view-overview", "quick-actions", "recommendations"],
      "user-dashboard": ["view-progress", "continue-learning", "recommendations", "goal-tracking"],
      "admin-dashboard": ["platform-management", "user-analytics", "system-monitoring"],
      "teacher-dashboard": ["manage-courses", "view-analytics", "student-progress", "create-content"],
      "user-analytics": ["view-analytics", "learning-insights", "progress-tracking", "goal-progress"],
      // Course management routes
      "courses-list": ["list-courses", "filter-courses", "create-course", "bulk-actions"],
      "course-detail": ["edit-course", "add-chapters", "publish-course", "analyze-course"],
      "course-create": ["create-course", "generate-blueprint", "set-objectives"],
      "chapter-detail": ["edit-chapter", "add-sections", "reorder-sections", "analyze-chapter"],
      "section-detail": ["edit-section", "add-content", "create-quiz", "analyze-section"],
      analytics: ["view-analytics", "export-data", "compare-metrics"],
      // Learning routes
      learning: ["view-content", "take-quiz", "track-progress", "ask-questions"],
      "course-learning": ["course-overview", "view-progress", "start-learning", "ask-questions"],
      "chapter-learning": ["view-content", "take-quiz", "track-progress", "ask-questions", "concept-explanation"],
      "section-learning": ["view-section", "complete-activities", "ask-questions", "get-hints"],
      // Exam routes
      exam: ["take-exam", "get-hints", "review-answers"],
      "exam-results": ["view-results", "review-answers", "improvement-suggestions", "retry-exam"],
      // General routes
      settings: ["update-preferences", "manage-account"],
      other: ["general-help"]
    };
    const suggestedActionsMap = {
      // Dashboard routes
      dashboard: ["View your courses", "Check analytics", "Create a new course"],
      "user-dashboard": ["Continue learning", "View recommendations", "Check progress", "Set goals"],
      "admin-dashboard": ["Manage users", "View platform analytics", "System settings"],
      "teacher-dashboard": ["Create a course", "View student progress", "Check analytics"],
      "user-analytics": ["View learning insights", "Track goal progress", "Identify strengths"],
      // Course management routes
      "courses-list": ["Create a course", "Analyze course performance", "Filter by category"],
      "course-detail": ["Add chapters", "Generate course content", "Analyze structure"],
      "course-create": ["Generate blueprint", "Set learning objectives", "Define target audience"],
      "chapter-detail": ["Add sections", "Create assessment", "Reorder content"],
      "section-detail": ["Add video content", "Create quiz", "Analyze Bloom's level"],
      analytics: ["View detailed reports", "Compare courses", "Export data"],
      // Learning routes
      learning: ["Continue learning", "Take a quiz", "Ask a question"],
      "course-learning": ["Start first chapter", "View syllabus", "Ask about the course"],
      "chapter-learning": ["Continue to next section", "Ask about concepts", "Take practice quiz"],
      "section-learning": ["Complete activities", "Ask for clarification", "Get hints"],
      // Exam routes
      exam: ["Start exam", "Review material first"],
      "exam-results": ["Review answers", "Get improvement tips", "Retry exam", "Continue learning"],
      // General routes
      settings: ["Update preferences", "Change notification settings"],
      other: ["How can I help you?"]
    };
    return {
      pageType,
      entityType: entityTypeMap[pageType],
      entityId: entityId ?? null,
      capabilities: capabilitiesMap[pageType] ?? [],
      userIntent: null,
      suggestedActions: suggestedActionsMap[pageType] ?? []
    };
  }
  async analyzeQuery(query) {
    const lowerQuery = query.toLowerCase().trim();
    const intent = this.detectIntent(lowerQuery);
    const keywords = this.extractKeywords(lowerQuery);
    const entities = this.extractEntities(lowerQuery);
    const sentiment = this.analyzeSentiment(lowerQuery);
    const complexity = this.determineComplexity(query);
    return {
      intent,
      entities,
      keywords,
      sentiment,
      complexity
    };
  }
  detectIntent(query) {
    if (/^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does)\b/i.test(query)) {
      return "question";
    }
    if (/\b(generate|create|write|draft|compose|produce|make me|build|develop)\b/i.test(query)) {
      return "generation";
    }
    if (/\b(analyze|analysis|review|check|evaluate|assess|examine)\b/i.test(query)) {
      return "analysis";
    }
    if (/^(add|remove|delete|update|edit|change|set|move|copy|rename)\b/i.test(query)) {
      return "command";
    }
    if (/\b(help|assist|support|guide|explain|show me)\b/i.test(query)) {
      return "help";
    }
    if (/\b(go to|navigate|open|show|take me|find)\b/i.test(query)) {
      return "navigation";
    }
    if (/\b(good|bad|great|terrible|love|hate|like|dislike|thanks|thank you)\b/i.test(query)) {
      return "feedback";
    }
    return "unknown";
  }
  extractKeywords(query) {
    const stopWords = /* @__PURE__ */ new Set([
      "a",
      "an",
      "the",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "to",
      "of",
      "in",
      "for",
      "on",
      "with",
      "at",
      "by",
      "from",
      "as",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "just",
      "and",
      "but",
      "if",
      "or",
      "because",
      "until",
      "while",
      "this",
      "that",
      "these",
      "those",
      "what",
      "which",
      "who",
      "whom",
      "i",
      "me",
      "my",
      "myself",
      "we",
      "our",
      "you",
      "your",
      "he",
      "him",
      "his",
      "she",
      "her",
      "it",
      "its",
      "they",
      "them",
      "their",
      "please",
      "help",
      "want"
    ]);
    const words = query.replace(/[^\w\s]/g, "").split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word));
    return [...new Set(words)];
  }
  extractEntities(query) {
    const entities = [];
    const quotedMatches = query.match(/"([^"]+)"/g);
    if (quotedMatches) {
      entities.push(...quotedMatches.map((m) => m.replace(/"/g, "")));
    }
    const capitalizedMatches = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (capitalizedMatches) {
      entities.push(...capitalizedMatches);
    }
    return [...new Set(entities)];
  }
  analyzeSentiment(query) {
    const positiveWords = ["good", "great", "excellent", "amazing", "wonderful", "love", "like", "thanks", "helpful", "perfect"];
    const negativeWords = ["bad", "terrible", "awful", "hate", "dislike", "wrong", "error", "problem", "issue", "broken", "failed"];
    let score = 0;
    for (const word of positiveWords) {
      if (query.includes(word)) score++;
    }
    for (const word of negativeWords) {
      if (query.includes(word)) score--;
    }
    if (score > 0) return "positive";
    if (score < 0) return "negative";
    return "neutral";
  }
  determineComplexity(query) {
    const wordCount = query.split(/\s+/).length;
    const hasMultipleClauses = /\b(and|or|but|because|if|when|while)\b/i.test(query);
    const hasNestedStructure = query.includes("(") || query.includes("[");
    if (wordCount > 30 || hasMultipleClauses && wordCount > 15 || hasNestedStructure) {
      return "complex";
    }
    if (wordCount > 10 || hasMultipleClauses) {
      return "moderate";
    }
    return "simple";
  }
};
function createContextEngine(config) {
  return new ContextEngine(config);
}

// src/engines/blooms.ts
var BLOOMS_KEYWORDS = {
  REMEMBER: [
    "define",
    "list",
    "recall",
    "name",
    "identify",
    "describe",
    "label",
    "recognize",
    "match",
    "select",
    "state",
    "memorize",
    "repeat",
    "record",
    "outline",
    "duplicate",
    "reproduce",
    "recite",
    "locate",
    "tell"
  ],
  UNDERSTAND: [
    "explain",
    "summarize",
    "interpret",
    "classify",
    "compare",
    "contrast",
    "discuss",
    "distinguish",
    "paraphrase",
    "predict",
    "translate",
    "extend",
    "infer",
    "estimate",
    "generalize",
    "rewrite",
    "exemplify",
    "illustrate"
  ],
  APPLY: [
    "apply",
    "demonstrate",
    "solve",
    "use",
    "implement",
    "execute",
    "operate",
    "practice",
    "calculate",
    "compute",
    "construct",
    "modify",
    "produce",
    "show",
    "complete",
    "examine",
    "illustrate",
    "experiment",
    "schedule"
  ],
  ANALYZE: [
    "analyze",
    "differentiate",
    "organize",
    "attribute",
    "compare",
    "contrast",
    "distinguish",
    "examine",
    "experiment",
    "question",
    "test",
    "investigate",
    "categorize",
    "deconstruct",
    "diagram",
    "dissect",
    "survey",
    "correlate"
  ],
  EVALUATE: [
    "evaluate",
    "judge",
    "critique",
    "justify",
    "assess",
    "argue",
    "defend",
    "support",
    "value",
    "prioritize",
    "rank",
    "rate",
    "recommend",
    "conclude",
    "appraise",
    "criticize",
    "decide",
    "discriminate",
    "measure",
    "validate"
  ],
  CREATE: [
    "create",
    "design",
    "develop",
    "construct",
    "produce",
    "invent",
    "compose",
    "formulate",
    "generate",
    "plan",
    "assemble",
    "devise",
    "build",
    "author",
    "combine",
    "compile",
    "integrate",
    "modify",
    "reorganize",
    "synthesize"
  ]
};
var BloomsEngine = class extends BaseEngine {
  constructor(config) {
    super({
      config,
      name: "blooms",
      version: "1.0.0",
      dependencies: ["context"],
      // Depends on context engine
      cacheEnabled: true,
      cacheTTL: 600
      // 10 minutes
    });
  }
  async process(input) {
    const { content, title, objectives, sections } = input;
    const allText = this.combineText(content, title, objectives, sections);
    const distribution = this.analyzeDistribution(allText);
    const dominantLevel = this.findDominantLevel(distribution);
    const cognitiveDepth = this.calculateCognitiveDepth(distribution);
    const balance = this.determineBalance(distribution);
    const gaps = this.identifyGaps(distribution);
    let sectionAnalysis;
    if (sections && sections.length > 0) {
      sectionAnalysis = sections.map((section) => {
        const sectionText = `${section.title} ${section.content ?? ""}`;
        const level = this.detectPrimaryLevel(sectionText);
        return {
          title: section.title,
          level,
          confidence: this.calculateConfidence(sectionText, level)
        };
      });
    }
    const recommendations = this.generateRecommendations(distribution, gaps, balance);
    const actionItems = this.generateActionItems(distribution, gaps, dominantLevel);
    const analysis = {
      distribution,
      dominantLevel,
      cognitiveDepth,
      balance,
      gaps,
      recommendations
    };
    return {
      analysis,
      sectionAnalysis,
      recommendations,
      actionItems
    };
  }
  getCacheKey(input) {
    const contentHash = this.hashString(
      `${input.content ?? ""}:${input.title ?? ""}:${(input.objectives ?? []).join(":")}`
    );
    return `blooms:${contentHash}`;
  }
  // ============================================================================
  // ANALYSIS METHODS
  // ============================================================================
  combineText(content, title, objectives, sections) {
    const parts = [];
    if (title) parts.push(title);
    if (content) parts.push(content);
    if (objectives) parts.push(...objectives);
    if (sections) {
      for (const section of sections) {
        parts.push(section.title);
        if (section.content) parts.push(section.content);
      }
    }
    return parts.join(" ").toLowerCase();
  }
  analyzeDistribution(text) {
    const distribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    let totalMatches = 0;
    for (const level of BLOOMS_LEVELS) {
      const keywords = BLOOMS_KEYWORDS[level];
      let levelCount = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        const matches = text.match(regex);
        if (matches) {
          levelCount += matches.length;
        }
      }
      distribution[level] = levelCount;
      totalMatches += levelCount;
    }
    if (totalMatches > 0) {
      for (const level of BLOOMS_LEVELS) {
        distribution[level] = Math.round(distribution[level] / totalMatches * 100);
      }
    } else {
      distribution.UNDERSTAND = 40;
      distribution.APPLY = 30;
      distribution.ANALYZE = 20;
      distribution.REMEMBER = 10;
    }
    return distribution;
  }
  findDominantLevel(distribution) {
    let maxLevel = "UNDERSTAND";
    let maxValue = 0;
    for (const level of BLOOMS_LEVELS) {
      if (distribution[level] > maxValue) {
        maxValue = distribution[level];
        maxLevel = level;
      }
    }
    return maxLevel;
  }
  calculateCognitiveDepth(distribution) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const level of BLOOMS_LEVELS) {
      const weight = BLOOMS_LEVEL_ORDER[level];
      weightedSum += distribution[level] * weight;
      totalWeight += distribution[level];
    }
    if (totalWeight === 0) return 50;
    const avgLevel = weightedSum / totalWeight;
    return Math.round(avgLevel / 6 * 100);
  }
  determineBalance(distribution) {
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const middleLevels = distribution.APPLY + distribution.ANALYZE;
    const upperLevels = distribution.EVALUATE + distribution.CREATE;
    const total = lowerLevels + middleLevels + upperLevels;
    if (total === 0) return "well-balanced";
    const lowerPct = lowerLevels / total;
    const upperPct = upperLevels / total;
    if (lowerPct > 0.6) return "bottom-heavy";
    if (upperPct > 0.5) return "top-heavy";
    return "well-balanced";
  }
  identifyGaps(distribution) {
    const gaps = [];
    for (const level of BLOOMS_LEVELS) {
      if (distribution[level] < 5) {
        gaps.push(level);
      }
    }
    return gaps;
  }
  detectPrimaryLevel(text) {
    const lowerText = text.toLowerCase();
    let maxMatches = 0;
    let primaryLevel = "UNDERSTAND";
    for (const level of BLOOMS_LEVELS) {
      let matches = 0;
      for (const keyword of BLOOMS_KEYWORDS[level]) {
        if (lowerText.includes(keyword)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        primaryLevel = level;
      }
    }
    return primaryLevel;
  }
  calculateConfidence(text, level) {
    const lowerText = text.toLowerCase();
    let matches = 0;
    const keywords = BLOOMS_KEYWORDS[level];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        matches++;
      }
    }
    const baseConfidence = Math.min(matches / 3, 1) * 0.7;
    const textLengthBonus = Math.min(text.length / 500, 1) * 0.3;
    return Math.round((baseConfidence + textLengthBonus) * 100);
  }
  // ============================================================================
  // RECOMMENDATION METHODS
  // ============================================================================
  generateRecommendations(_distribution, gaps, balance) {
    const recommendations = [];
    if (balance === "bottom-heavy") {
      recommendations.push(
        "Add more activities that require analysis, evaluation, and creation",
        "Include case studies or problem-solving exercises",
        "Add project-based assessments that require synthesis"
      );
    } else if (balance === "top-heavy") {
      recommendations.push(
        "Ensure foundational concepts are well-covered",
        "Add knowledge checks to verify understanding",
        "Include more examples and explanations"
      );
    }
    for (const gap of gaps.slice(0, 2)) {
      const levelRecommendations = {
        REMEMBER: "Add definitions, lists, or fact-based content",
        UNDERSTAND: "Include explanations, summaries, and examples",
        APPLY: "Add practical exercises and real-world applications",
        ANALYZE: "Include comparison activities and case analyses",
        EVALUATE: "Add critical thinking questions and peer reviews",
        CREATE: "Include projects, designs, or original work assignments"
      };
      recommendations.push(levelRecommendations[gap]);
    }
    return recommendations.slice(0, 5);
  }
  generateActionItems(distribution, gaps, dominantLevel) {
    const actionItems = [];
    if (gaps.length > 0) {
      actionItems.push(
        `Add content targeting ${gaps[0]} level (currently underrepresented)`
      );
    }
    if (distribution[dominantLevel] > 60) {
      actionItems.push(
        `Diversify content beyond ${dominantLevel} level (currently ${distribution[dominantLevel]}%)`
      );
    }
    const dominantOrder = BLOOMS_LEVEL_ORDER[dominantLevel];
    if (dominantOrder < 4) {
      const nextLevel = BLOOMS_LEVELS[dominantOrder];
      actionItems.push(
        `Consider adding ${nextLevel} level activities to increase cognitive depth`
      );
    }
    return actionItems;
  }
};
var hasWarned = false;
function createBloomsEngine(config) {
  if (!hasWarned) {
    const warn = config.logger?.warn ?? console.warn;
    warn("[SAM] createBloomsEngine is deprecated. Use createUnifiedBloomsEngine from @sam-ai/educational.");
    hasWarned = true;
  }
  return new BloomsEngine(config);
}

// src/engines/content.ts
var ContentEngine = class extends BaseEngine {
  constructor(config) {
    super({
      config,
      name: "content",
      version: "1.0.0",
      dependencies: ["context"],
      timeout: 45e3,
      retries: 2,
      cacheEnabled: true,
      cacheTTL: 30 * 60 * 1e3
      // 30 minutes
    });
  }
  async performInitialization() {
    this.logger.debug("[ContentEngine] Initialized");
  }
  async process(input) {
    const { query, previousResults } = input;
    const bloomsResult = previousResults?.["blooms"];
    if (query?.toLowerCase().includes("generate")) {
      return this.generateContent(input, bloomsResult?.data);
    }
    return this.analyzeContent(input, bloomsResult?.data);
  }
  async analyzeContent(input, bloomsData) {
    const { context } = input;
    const systemPrompt = this.buildAnalysisSystemPrompt();
    const userPrompt = this.buildAnalysisUserPrompt(context, bloomsData);
    const response = await this.callAI({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 2e3
    });
    return this.parseAnalysisResponse(response.content, bloomsData);
  }
  async generateContent(input, bloomsData) {
    const { context, query } = input;
    const contentType = this.extractContentType(query || "");
    const systemPrompt = this.buildGenerationSystemPrompt();
    const userPrompt = this.buildGenerationUserPrompt(context, contentType, bloomsData);
    const response = await this.callAI({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 3e3
    });
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
Entity ID: ${context.page.entityId || "N/A"}
Path: ${context.page.path}

User Role: ${context.user.role}
`;
    if (bloomsData) {
      prompt += `
Bloom's Analysis Available:
- Dominant Level: ${bloomsData.analysis.dominantLevel}
- Cognitive Depth: ${bloomsData.analysis.cognitiveDepth}
- Balance: ${bloomsData.analysis.balance}
- Gaps: ${bloomsData.analysis.gaps.join(", ") || "None"}
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
Entity: ${context.page.entityId || "New content"}
User Role: ${context.user.role}
`;
    if (context.user.preferences.learningStyle) {
      prompt += `Preferred Learning Style: ${context.user.preferences.learningStyle}
`;
    }
    if (bloomsData) {
      const targetLevel = this.determineTargetBloomsLevel(bloomsData);
      prompt += `
Target Bloom's Level: ${targetLevel}
Current Gaps: ${bloomsData.analysis.gaps.join(", ") || "None"}
`;
    }
    prompt += `
Generate comprehensive, well-structured ${contentType} content.`;
    return prompt;
  }
  extractContentType(query) {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("chapter")) return "chapter";
    if (lowerQuery.includes("section")) return "section";
    if (lowerQuery.includes("lesson")) return "lesson";
    if (lowerQuery.includes("quiz")) return "quiz";
    if (lowerQuery.includes("exercise")) return "exercise";
    if (lowerQuery.includes("summary")) return "summary";
    if (lowerQuery.includes("explanation")) return "explanation";
    if (lowerQuery.includes("example")) return "example";
    return "lesson";
  }
  determineTargetBloomsLevel(bloomsData) {
    if (bloomsData.analysis.gaps.length > 0) {
      return bloomsData.analysis.gaps[0];
    }
    const levels = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    const currentIndex = levels.indexOf(bloomsData.analysis.dominantLevel);
    const targetIndex = Math.min(currentIndex + 1, levels.length - 1);
    return levels[targetIndex];
  }
  parseAnalysisResponse(response, bloomsData) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          metrics: parsed.metrics || this.getDefaultMetrics(),
          suggestions: parsed.suggestions || [],
          insights: parsed.insights || { strengths: [], weaknesses: [], opportunities: [] },
          overallScore: parsed.overallScore || 70
        };
      }
    } catch {
      this.logger.warn("[ContentEngine] Failed to parse AI response, using defaults");
    }
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
        bloomsLevel: bloomsData?.analysis.dominantLevel || "UNDERSTAND",
        targetAudience: "General"
      }
    };
    return {
      metrics: this.getDefaultMetrics(),
      suggestions: [],
      generatedContent: [generatedContent],
      insights: {
        strengths: ["Content generated successfully"],
        weaknesses: [],
        opportunities: ["Review and customize for specific audience"]
      },
      overallScore: 75
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
          learningPathClarity: Math.max(65, baseScore - 5)
        },
        engagement: {
          estimatedCompletionRate: Math.max(60, baseScore - 15),
          interactionDensity: 65,
          varietyScore: 60
        },
        quality: {
          structureScore: Math.max(70, baseScore),
          coherenceScore: Math.max(70, baseScore),
          accessibilityScore: 75
        }
      },
      suggestions: [
        {
          type: "improvement",
          priority: "medium",
          title: "Add interactive elements",
          description: "Include more interactive exercises to boost engagement",
          estimatedImpact: 25
        },
        {
          type: "addition",
          priority: "low",
          title: "Include practical examples",
          description: "Add real-world examples to improve understanding",
          estimatedImpact: 20
        }
      ],
      insights: {
        strengths: ["Clear structure", "Good foundational coverage"],
        weaknesses: bloomsData?.analysis.gaps.length ? [`Missing ${bloomsData.analysis.gaps.join(", ")} level content`] : [],
        opportunities: ["Expand higher-order thinking activities", "Add multimedia content"]
      },
      overallScore: baseScore
    };
  }
  getDefaultMetrics() {
    return {
      depth: {
        contentRichness: 70,
        topicCoverage: 65,
        assessmentQuality: 60,
        learningPathClarity: 70
      },
      engagement: {
        estimatedCompletionRate: 65,
        interactionDensity: 60,
        varietyScore: 55
      },
      quality: {
        structureScore: 70,
        coherenceScore: 70,
        accessibilityScore: 75
      }
    };
  }
  getCacheKey(input) {
    const { context, query } = input;
    return `content:${context.page.type}:${context.page.entityId || "none"}:${query?.substring(0, 50) || "analyze"}`;
  }
};
function createContentEngine(config) {
  return new ContentEngine(config);
}

// src/engines/assessment.ts
var AssessmentEngine = class extends BaseEngine {
  defaultConfig = {
    questionCount: 10,
    duration: 30,
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 25,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5
    },
    difficultyDistribution: {
      easy: 30,
      medium: 50,
      hard: 20
    },
    questionTypes: ["multiple-choice", "true-false", "short-answer"],
    adaptiveMode: false
  };
  constructor(config) {
    super({
      config,
      name: "assessment",
      version: "1.0.0",
      dependencies: ["context", "blooms"],
      timeout: 6e4,
      // 60 seconds for complex generation
      retries: 2,
      cacheEnabled: true,
      cacheTTL: 60 * 60 * 1e3
      // 1 hour
    });
  }
  async performInitialization() {
    this.logger.debug("[AssessmentEngine] Initialized");
  }
  async process(input) {
    const { context, query, previousResults, options } = input;
    const bloomsResult = previousResults?.["blooms"];
    const assessmentConfig = this.buildAssessmentConfig(options, bloomsResult?.data);
    const questions = await this.generateQuestions(context, assessmentConfig, bloomsResult?.data);
    const analysis = this.analyzeAssessment(questions, assessmentConfig);
    const includeStudyGuide = query?.toLowerCase().includes("study") || options?.includeStudyGuide;
    const studyGuide = includeStudyGuide ? await this.generateStudyGuide(context, questions, bloomsResult?.data) : void 0;
    const metadata = this.calculateMetadata(questions, analysis);
    return {
      questions,
      analysis,
      studyGuide,
      metadata
    };
  }
  buildAssessmentConfig(options, bloomsData) {
    const config = { ...this.defaultConfig };
    if (options?.questionCount) {
      config.questionCount = options.questionCount;
    }
    if (options?.duration) {
      config.duration = options.duration;
    }
    if (options?.bloomsDistribution) {
      config.bloomsDistribution = options.bloomsDistribution;
    }
    if (options?.questionTypes) {
      config.questionTypes = options.questionTypes;
    }
    if (bloomsData?.analysis.gaps.length) {
      for (const gap of bloomsData.analysis.gaps) {
        config.bloomsDistribution[gap] = (config.bloomsDistribution[gap] || 0) + 10;
      }
      this.normalizeDistribution(config.bloomsDistribution);
    }
    return config;
  }
  normalizeDistribution(distribution) {
    const levels = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    const total = levels.reduce((sum, level) => sum + (distribution[level] || 0), 0);
    if (total > 0 && total !== 100) {
      const factor = 100 / total;
      for (const level of levels) {
        if (distribution[level]) {
          distribution[level] = Math.round(distribution[level] * factor);
        }
      }
    }
  }
  async generateQuestions(context, config, bloomsData) {
    const systemPrompt = this.buildQuestionGenerationPrompt();
    const userPrompt = this.buildQuestionRequestPrompt(context, config, bloomsData);
    const response = await this.callAI({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 4e3
    });
    return this.parseQuestionsResponse(response.content, config);
  }
  buildQuestionGenerationPrompt() {
    return `You are an expert assessment designer specializing in Bloom's Taxonomy-aligned question generation.

Generate questions that:
1. Precisely target specific cognitive levels
2. Are clear and unambiguous
3. Have appropriate difficulty
4. Include plausible distractors for multiple choice
5. Cover key learning objectives

Return questions in JSON array format:
[
  {
    "id": "q1",
    "type": "multiple-choice|true-false|short-answer|essay|matching|fill-blank",
    "text": "Question text",
    "options": [{"id": "a", "text": "Option text", "isCorrect": boolean}],
    "correctAnswer": "string or array",
    "points": number,
    "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
    "difficulty": "easy|medium|hard",
    "explanation": "Why this is correct",
    "hints": ["hint1", "hint2"],
    "targetBloomsLevel": "same as bloomsLevel",
    "cognitiveSkills": ["skill1", "skill2"],
    "commonMisconceptions": ["misconception1"]
  }
]`;
  }
  buildQuestionRequestPrompt(context, config, bloomsData) {
    let prompt = `Generate ${config.questionCount} assessment questions for:

Context: ${context.page.type}
Entity: ${context.page.entityId || "General assessment"}
User Role: ${context.user.role}

Requirements:
- Duration: ${config.duration} minutes
- Question Types: ${config.questionTypes.join(", ")}

Bloom's Distribution (percentage):
`;
    const levels = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    for (const level of levels) {
      const pct = config.bloomsDistribution[level] || 0;
      if (pct > 0) {
        prompt += `- ${level}: ${pct}%
`;
      }
    }
    prompt += `
Difficulty Distribution:
- Easy: ${config.difficultyDistribution.easy}%
- Medium: ${config.difficultyDistribution.medium}%
- Hard: ${config.difficultyDistribution.hard}%
`;
    if (bloomsData) {
      prompt += `
Current Content Gaps: ${bloomsData.analysis.gaps.join(", ") || "None"}
Focus on addressing these cognitive level gaps in your questions.
`;
    }
    return prompt;
  }
  parseQuestionsResponse(response, config) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map(
          (q, index) => this.normalizeQuestion(q, index)
        );
      }
    } catch (error) {
      this.logger.warn("[AssessmentEngine] Failed to parse questions, generating defaults");
    }
    return this.generateDefaultQuestions(config);
  }
  normalizeQuestion(q, index) {
    return {
      id: q.id || `q${index + 1}`,
      type: q.type || "multiple-choice",
      text: q.text || "Question text not available",
      options: q.options || this.generateDefaultOptions(),
      correctAnswer: q.correctAnswer,
      points: q.points || 1,
      bloomsLevel: q.bloomsLevel || "UNDERSTAND",
      difficulty: q.difficulty || "medium",
      explanation: q.explanation,
      hints: q.hints || [],
      targetBloomsLevel: q.targetBloomsLevel || q.bloomsLevel || "UNDERSTAND",
      cognitiveSkills: q.cognitiveSkills || [],
      commonMisconceptions: q.commonMisconceptions
    };
  }
  generateDefaultOptions() {
    return [
      { id: "a", text: "Option A", isCorrect: true },
      { id: "b", text: "Option B", isCorrect: false },
      { id: "c", text: "Option C", isCorrect: false },
      { id: "d", text: "Option D", isCorrect: false }
    ];
  }
  generateDefaultQuestions(config) {
    const questions = [];
    const levels = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    for (let i = 0; i < config.questionCount; i++) {
      const level = levels[i % levels.length];
      questions.push({
        id: `q${i + 1}`,
        type: config.questionTypes[i % config.questionTypes.length],
        text: `Sample question ${i + 1} targeting ${level} level`,
        options: this.generateDefaultOptions(),
        correctAnswer: "a",
        points: 1,
        bloomsLevel: level,
        difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard",
        explanation: `This question tests ${level} cognitive skills`,
        hints: [],
        targetBloomsLevel: level,
        cognitiveSkills: [level.toLowerCase()]
      });
    }
    return questions;
  }
  analyzeAssessment(questions, config) {
    const actualDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    const skills = [];
    for (const q of questions) {
      actualDistribution[q.bloomsLevel]++;
      difficultyCount[q.difficulty]++;
      skills.push(...q.cognitiveSkills);
    }
    const total = questions.length || 1;
    for (const level of Object.keys(actualDistribution)) {
      actualDistribution[level] = Math.round(actualDistribution[level] / total * 100);
    }
    const targetDist = config.bloomsDistribution;
    let alignmentSum = 0;
    let alignmentCount = 0;
    for (const level of Object.keys(actualDistribution)) {
      const target = targetDist[level] || 0;
      const actual = actualDistribution[level];
      const diff = Math.abs(target - actual);
      alignmentSum += 100 - diff;
      alignmentCount++;
    }
    const alignment = alignmentCount > 0 ? Math.round(alignmentSum / alignmentCount) : 0;
    const levels = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    const startLevel = questions[0]?.bloomsLevel || "REMEMBER";
    const endLevel = questions[questions.length - 1]?.bloomsLevel || "CREATE";
    const startIdx = levels.indexOf(startLevel);
    const endIdx = levels.indexOf(endLevel);
    const progressionScore = Math.max(0, (endIdx - startIdx) / 5 * 100);
    const uniqueSkills = [...new Set(skills)];
    const expectedSkills = ["recall", "comprehension", "application", "analysis", "evaluation", "creation"];
    const covered = uniqueSkills.filter((s) => expectedSkills.some((e) => s.includes(e)));
    const missing = expectedSkills.filter((e) => !uniqueSkills.some((s) => s.includes(e)));
    const avgDifficulty = (difficultyCount.easy * 1 + difficultyCount.medium * 2 + difficultyCount.hard * 3) / (total || 1);
    const targetEasy = config.difficultyDistribution.easy / 100;
    const targetMedium = config.difficultyDistribution.medium / 100;
    const targetHard = config.difficultyDistribution.hard / 100;
    const actualEasy = difficultyCount.easy / total;
    const actualMedium = difficultyCount.medium / total;
    const actualHard = difficultyCount.hard / total;
    const isBalanced = Math.abs(targetEasy - actualEasy) < 0.15 && Math.abs(targetMedium - actualMedium) < 0.15 && Math.abs(targetHard - actualHard) < 0.15;
    return {
      bloomsComparison: {
        target: { ...targetDist },
        actual: actualDistribution,
        alignment
      },
      cognitiveProgression: {
        startLevel,
        endLevel,
        progressionScore: Math.round(progressionScore)
      },
      skillsCoverage: {
        covered,
        missing,
        overRepresented: []
      },
      difficultyAnalysis: {
        averageDifficulty: Math.round(avgDifficulty * 100) / 100,
        distribution: {
          easy: Math.round(actualEasy * 100),
          medium: Math.round(actualMedium * 100),
          hard: Math.round(actualHard * 100)
        },
        isBalanced
      }
    };
  }
  async generateStudyGuide(_context, questions, bloomsData) {
    const topics = this.extractTopicsFromQuestions(questions);
    const gaps = bloomsData?.analysis.gaps || [];
    const focusAreas = topics.map((topic, i) => ({
      topic,
      importance: i < 2 ? "critical" : i < 4 ? "important" : "helpful",
      description: `Focus on ${topic} concepts`,
      resources: []
    }));
    for (const gap of gaps) {
      focusAreas.push({
        topic: `${gap} Level Skills`,
        importance: "critical",
        description: `Practice ${gap.toLowerCase()} level cognitive activities`,
        resources: []
      });
    }
    const practiceQuestions = questions.slice(0, 3).map((q) => ({
      ...q,
      hints: (q.hints ?? []).concat(["Practice similar problems", "Review the explanation carefully"])
    }));
    return {
      focusAreas,
      practiceQuestions,
      keyConceptsSummary: topics.map((t) => `Understanding ${t} is essential`),
      studyTips: [
        "Review incorrect answers and their explanations",
        "Practice questions at each Bloom's level",
        "Focus on understanding rather than memorization",
        "Take breaks and review material regularly"
      ]
    };
  }
  extractTopicsFromQuestions(questions) {
    const topics = [];
    for (const q of questions) {
      const words = q.text.split(/\s+/).filter((w) => w.length > 4);
      for (const word of words.slice(0, 2)) {
        if (!topics.includes(word) && topics.length < 5) {
          topics.push(word);
        }
      }
    }
    return topics.length > 0 ? topics : ["Core Concepts", "Key Principles", "Fundamentals"];
  }
  calculateMetadata(questions, analysis) {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedDuration = Math.ceil(questions.length * 2.5);
    let averageDifficulty = "medium";
    if (analysis.difficultyAnalysis.averageDifficulty < 1.5) {
      averageDifficulty = "easy";
    } else if (analysis.difficultyAnalysis.averageDifficulty > 2.5) {
      averageDifficulty = "hard";
    }
    return {
      totalPoints,
      estimatedDuration,
      averageDifficulty,
      bloomsAlignment: analysis.bloomsComparison.alignment
    };
  }
  getCacheKey(input) {
    const { context, options } = input;
    const configHash = JSON.stringify(options || {}).substring(0, 30);
    return `assessment:${context.page.entityId || "general"}:${configHash}`;
  }
};
function createAssessmentEngine(config) {
  return new AssessmentEngine(config);
}

// src/engines/personalization.ts
var PersonalizationEngine = class extends BaseEngine {
  constructor(config) {
    super({
      config,
      name: "personalization",
      version: "1.0.0",
      dependencies: ["context"],
      timeout: 3e4,
      retries: 2,
      cacheEnabled: true,
      cacheTTL: 15 * 60 * 1e3
      // 15 minutes (shorter due to dynamic nature)
    });
  }
  async performInitialization() {
    this.logger.debug("[PersonalizationEngine] Initialized");
  }
  async process(input) {
    const { context, previousResults, options } = input;
    const contextResult = previousResults?.["context"];
    const learningStyle = await this.analyzeLearningStyle(context, contextResult?.data);
    const emotional = this.analyzeEmotionalState(context, contextResult?.data);
    const cognitiveLoad = this.analyzeCognitiveLoad(context);
    const motivation = this.analyzeMotivation(context, emotional);
    const generatePath = options?.generateLearningPath === true;
    const learningPath = generatePath ? await this.generateLearningPath(context, learningStyle, cognitiveLoad) : void 0;
    const overallProfile = this.buildOverallProfile(
      learningStyle,
      emotional,
      cognitiveLoad,
      motivation
    );
    return {
      learningStyle,
      emotional,
      cognitiveLoad,
      motivation,
      learningPath,
      overallProfile
    };
  }
  async analyzeLearningStyle(context, _contextData) {
    const userPreference = context.user.preferences.learningStyle;
    const interactions = context.conversation.messages;
    const indicators = this.detectLearningStyleIndicators(interactions);
    indicators.sort((a, b) => b.score - a.score);
    const primary = indicators[0]?.style || userPreference || "mixed";
    const secondary = indicators[1]?.score > 20 ? indicators[1].style : null;
    const confidence = Math.min(100, indicators[0]?.score * 2 || 50);
    const recommendations = this.generateStyleRecommendations(primary, secondary);
    return {
      primary,
      secondary,
      confidence,
      indicators,
      recommendations
    };
  }
  detectLearningStyleIndicators(messages) {
    const styles = [
      "visual",
      "auditory",
      "kinesthetic",
      "reading-writing",
      "mixed"
    ];
    const indicators = [];
    for (const style of styles) {
      const { score, evidence } = this.calculateStyleScore(style, messages);
      indicators.push({ style, score, evidence });
    }
    return indicators;
  }
  calculateStyleScore(style, messages) {
    const evidence = [];
    let score = 20;
    const messageText = messages.map((m) => m.content.toLowerCase()).join(" ");
    if (style === "visual") {
      if (messageText.includes("show") || messageText.includes("diagram")) {
        score += 15;
        evidence.push("Requests visual representations");
      }
      if (messageText.includes("picture") || messageText.includes("image")) {
        score += 10;
        evidence.push("Mentions visual content");
      }
      if (messageText.includes("chart") || messageText.includes("graph")) {
        score += 10;
        evidence.push("Interested in data visualization");
      }
    }
    if (style === "auditory") {
      if (messageText.includes("explain") || messageText.includes("tell")) {
        score += 15;
        evidence.push("Prefers verbal explanations");
      }
      if (messageText.includes("discuss") || messageText.includes("talk")) {
        score += 10;
        evidence.push("Values discussion");
      }
    }
    if (style === "kinesthetic") {
      if (messageText.includes("practice") || messageText.includes("try")) {
        score += 15;
        evidence.push("Prefers hands-on learning");
      }
      if (messageText.includes("exercise") || messageText.includes("example")) {
        score += 10;
        evidence.push("Requests practical examples");
      }
    }
    if (style === "reading-writing") {
      if (messageText.includes("read") || messageText.includes("write")) {
        score += 15;
        evidence.push("Prefers text-based learning");
      }
      if (messageText.includes("notes") || messageText.includes("summary")) {
        score += 10;
        evidence.push("Values written summaries");
      }
    }
    if (style === "mixed") {
      score += 10;
      evidence.push("Adaptable learning approach");
    }
    return { score: Math.min(100, score), evidence };
  }
  generateStyleRecommendations(primary, secondary) {
    const recommendations = [];
    const styleRecs = {
      visual: [
        "Use diagrams and flowcharts",
        "Incorporate color-coded notes",
        "Watch video demonstrations",
        "Create mind maps"
      ],
      auditory: [
        "Listen to explanations and lectures",
        "Discuss concepts with peers",
        "Use mnemonic devices",
        "Record and replay key points"
      ],
      kinesthetic: [
        "Practice with hands-on exercises",
        "Take frequent breaks for movement",
        "Use physical manipulatives when possible",
        "Apply concepts to real scenarios"
      ],
      "reading-writing": [
        "Take detailed notes",
        "Read and summarize content",
        "Write out explanations",
        "Create lists and outlines"
      ],
      mixed: [
        "Vary learning approaches",
        "Combine visual and practical elements",
        "Use multiple resource types",
        "Adapt based on content complexity"
      ]
    };
    recommendations.push(...styleRecs[primary] || []);
    if (secondary && styleRecs[secondary]) {
      recommendations.push(`Supplement with ${secondary} approaches`);
    }
    return recommendations.slice(0, 5);
  }
  analyzeEmotionalState(context, _contextData) {
    const messages = context.conversation.messages;
    const recentMessages = messages.slice(-5);
    const stateAnalysis = this.detectEmotionalState(recentMessages);
    const trajectory = this.calculateEmotionalTrajectory(messages);
    const recommendedTone = this.getRecommendedTone(stateAnalysis.state);
    const interventions = this.generateInterventions(stateAnalysis.state, trajectory);
    return {
      currentState: stateAnalysis.state,
      confidence: stateAnalysis.confidence,
      trajectory,
      triggers: stateAnalysis.triggers,
      recommendedTone,
      interventions
    };
  }
  detectEmotionalState(messages) {
    const triggers = [];
    let state = "neutral";
    let confidence = 50;
    const text = messages.map((m) => m.content.toLowerCase()).join(" ");
    if (text.includes("don't understand") || text.includes("confused") || text.includes("stuck")) {
      state = "frustrated";
      confidence = 75;
      triggers.push("Difficulty understanding content");
    }
    if (text.includes("what does") || text.includes("why") || text.includes("how does")) {
      if (state === "neutral") {
        state = "confused";
        confidence = 60;
      }
      triggers.push("Seeking clarification");
    }
    if (text.includes("great") || text.includes("got it") || text.includes("understand now")) {
      state = "motivated";
      confidence = 70;
      triggers.push("Positive progress");
    }
    if (text.includes("interesting") || text.includes("tell me more") || text.includes("what about")) {
      state = "curious";
      confidence = 65;
      triggers.push("Active exploration");
    }
    if (text.includes("worried") || text.includes("scared") || text.includes("test")) {
      state = "anxious";
      confidence = 70;
      triggers.push("Performance concerns");
    }
    for (const msg of messages) {
      if (msg.metadata?.emotion) {
        state = msg.metadata.emotion;
        confidence = 85;
        triggers.push("Explicitly expressed emotion");
        break;
      }
    }
    return { state, confidence, triggers };
  }
  calculateEmotionalTrajectory(messages) {
    if (messages.length < 3) return "stable";
    const recent = messages.slice(-3);
    let positiveCount = 0;
    let negativeCount = 0;
    for (const msg of recent) {
      const text = msg.content.toLowerCase();
      if (text.includes("thanks") || text.includes("great") || text.includes("helpful")) {
        positiveCount++;
      }
      if (text.includes("still") || text.includes("don't") || text.includes("confused")) {
        negativeCount++;
      }
    }
    if (positiveCount > negativeCount) return "improving";
    if (negativeCount > positiveCount) return "declining";
    return "stable";
  }
  getRecommendedTone(state) {
    const toneMap = {
      frustrated: "encouraging",
      confused: "casual",
      anxious: "encouraging",
      motivated: "casual",
      confident: "direct",
      curious: "casual",
      bored: "encouraging",
      neutral: "casual"
    };
    return toneMap[state] || "casual";
  }
  generateInterventions(state, trajectory) {
    const interventions = [];
    if (state === "frustrated" || trajectory === "declining") {
      interventions.push("Offer encouragement and acknowledge difficulty");
      interventions.push("Break down complex concepts into smaller steps");
      interventions.push("Provide additional examples");
    }
    if (state === "confused") {
      interventions.push("Ask clarifying questions");
      interventions.push("Use alternative explanations");
      interventions.push("Connect to prior knowledge");
    }
    if (state === "anxious") {
      interventions.push("Reassure about progress");
      interventions.push("Highlight past successes");
      interventions.push("Reduce time pressure");
    }
    if (state === "bored") {
      interventions.push("Increase challenge level");
      interventions.push("Introduce novel elements");
      interventions.push("Connect to personal interests");
    }
    if (state === "curious" || state === "motivated") {
      interventions.push("Provide enrichment opportunities");
      interventions.push("Suggest advanced topics");
    }
    return interventions;
  }
  analyzeCognitiveLoad(context) {
    const messages = context.conversation.messages;
    const sessionMessages = messages.length;
    const contentComplexity = this.estimateContentComplexity(messages);
    const sessionDuration = sessionMessages * 2;
    const recentErrors = this.countRecentErrors(messages);
    const helpSeekingFrequency = this.calculateHelpSeekingFrequency(messages);
    const loadScore = contentComplexity * 0.3 + Math.min(100, sessionDuration) * 0.2 + recentErrors * 10 * 0.25 + helpSeekingFrequency * 0.25;
    let currentLoad = "optimal";
    let capacity = 60;
    if (loadScore < 30) {
      currentLoad = "low";
      capacity = 90;
    } else if (loadScore > 70) {
      currentLoad = "high";
      capacity = 30;
    } else if (loadScore > 85) {
      currentLoad = "overloaded";
      capacity = 10;
    }
    const adaptations = this.generateCognitiveAdaptations(currentLoad, {
      contentComplexity,
      sessionDuration,
      recentErrors,
      helpSeekingFrequency
    });
    return {
      currentLoad,
      capacity,
      factors: {
        contentComplexity,
        sessionDuration,
        recentErrors,
        helpSeekingFrequency
      },
      adaptations
    };
  }
  estimateContentComplexity(messages) {
    const text = messages.map((m) => m.content).join(" ");
    const avgWordLength = text.length / (text.split(/\s+/).length || 1);
    const technicalTerms = (text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) || []).length;
    return Math.min(100, avgWordLength * 8 + technicalTerms * 5);
  }
  countRecentErrors(messages) {
    const recent = messages.slice(-5);
    let errors = 0;
    for (const msg of recent) {
      const text = msg.content.toLowerCase();
      if (text.includes("wrong") || text.includes("incorrect") || text.includes("mistake") || text.includes("error")) {
        errors++;
      }
    }
    return errors;
  }
  calculateHelpSeekingFrequency(messages) {
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length === 0) return 0;
    let helpRequests = 0;
    for (const msg of userMessages) {
      const text = msg.content.toLowerCase();
      if (text.includes("help") || text.includes("explain") || text.includes("?") || text.includes("how")) {
        helpRequests++;
      }
    }
    return Math.min(100, helpRequests / userMessages.length * 100);
  }
  generateCognitiveAdaptations(load, factors) {
    const adaptations = [];
    if (load === "high" || load === "overloaded") {
      adaptations.push({
        type: "simplify",
        priority: "high",
        description: "Reduce content complexity",
        implementation: "Use simpler language and shorter explanations"
      });
      adaptations.push({
        type: "chunk",
        priority: "high",
        description: "Break content into smaller pieces",
        implementation: "Present one concept at a time"
      });
      if (factors.sessionDuration > 30) {
        adaptations.push({
          type: "slow-down",
          priority: "medium",
          description: "Suggest taking a break",
          implementation: "Recommend a short break before continuing"
        });
      }
    }
    if (load === "low") {
      adaptations.push({
        type: "enrich",
        priority: "medium",
        description: "Add more challenging content",
        implementation: "Include advanced topics and deeper explanations"
      });
      adaptations.push({
        type: "speed-up",
        priority: "low",
        description: "Increase pacing",
        implementation: "Cover more material per interaction"
      });
    }
    if (factors.helpSeekingFrequency > 60) {
      adaptations.push({
        type: "visualize",
        priority: "medium",
        description: "Add visual explanations",
        implementation: "Include diagrams or step-by-step visuals"
      });
    }
    return adaptations;
  }
  analyzeMotivation(context, emotional) {
    const messages = context.conversation.messages;
    const gamification = context.gamification;
    let level = 50;
    const drivers = [];
    const barriers = [];
    if (emotional.currentState === "motivated" || emotional.currentState === "curious") {
      level += 20;
      drivers.push("Positive emotional state");
    } else if (emotional.currentState === "frustrated" || emotional.currentState === "anxious") {
      level -= 15;
      barriers.push("Negative emotional state");
    }
    if (gamification.streak.current > 0) {
      level += 10;
      drivers.push(`Active streak: ${gamification.streak.current} days`);
    }
    if (gamification.badges.length > 0) {
      level += 5;
      drivers.push("Badge achievements");
    }
    const hasExternalMotivators = gamification.points > 0 || gamification.badges.length > 0;
    const hasInternalIndicators = emotional.currentState === "curious" || messages.some((m) => m.content.includes("want to learn"));
    let type = "mixed";
    if (hasInternalIndicators && !hasExternalMotivators) {
      type = "intrinsic";
    } else if (hasExternalMotivators && !hasInternalIndicators) {
      type = "extrinsic";
    }
    let sustainability = "medium";
    if (type === "intrinsic" && level > 60) {
      sustainability = "high";
    } else if (level < 40) {
      sustainability = "low";
    }
    const boostStrategies = this.generateMotivationStrategies(level, type, barriers);
    return {
      level: Math.max(0, Math.min(100, level)),
      type,
      drivers,
      barriers,
      sustainability,
      boostStrategies
    };
  }
  generateMotivationStrategies(level, type, barriers) {
    const strategies = [];
    if (level < 50) {
      strategies.push("Set small, achievable goals");
      strategies.push("Celebrate small wins");
    }
    if (type === "extrinsic") {
      strategies.push("Focus on personal growth benefits");
      strategies.push("Connect learning to real-world applications");
    }
    if (barriers.includes("Negative emotional state")) {
      strategies.push("Address emotional barriers first");
      strategies.push("Provide additional support and encouragement");
    }
    strategies.push("Track and visualize progress");
    strategies.push("Provide variety in learning activities");
    return strategies.slice(0, 4);
  }
  async generateLearningPath(_context, learningStyle, cognitiveLoad) {
    const baseNodes = [
      {
        id: "review-1",
        title: "Quick Review",
        type: "review",
        estimatedDuration: 5,
        difficulty: "easy",
        prerequisites: [],
        isOptional: false,
        adaptedFor: learningStyle.primary
      },
      {
        id: "lesson-1",
        title: "Core Concept",
        type: "lesson",
        estimatedDuration: 15,
        difficulty: cognitiveLoad.currentLoad === "high" ? "easy" : "medium",
        prerequisites: ["review-1"],
        isOptional: false,
        adaptedFor: learningStyle.primary
      },
      {
        id: "exercise-1",
        title: "Practice Exercise",
        type: "exercise",
        estimatedDuration: 10,
        difficulty: "medium",
        prerequisites: ["lesson-1"],
        isOptional: false,
        adaptedFor: learningStyle.primary
      }
    ];
    if (cognitiveLoad.currentLoad === "high" || cognitiveLoad.currentLoad === "overloaded") {
      baseNodes.push({
        id: "break-1",
        title: "Rest Break",
        type: "break",
        estimatedDuration: 5,
        difficulty: "easy",
        prerequisites: ["exercise-1"],
        isOptional: true,
        adaptedFor: learningStyle.primary
      });
    }
    baseNodes.push({
      id: "assessment-1",
      title: "Quick Assessment",
      type: "assessment",
      estimatedDuration: 10,
      difficulty: "medium",
      prerequisites: ["exercise-1"],
      isOptional: false,
      adaptedFor: learningStyle.primary
    });
    const totalDuration = baseNodes.reduce((sum, n) => sum + n.estimatedDuration, 0);
    return {
      nodes: baseNodes,
      totalDuration,
      alternativeRoutes: [["review-1", "exercise-1", "assessment-1"]],
      // Skip lesson route
      adaptationLevel: cognitiveLoad.currentLoad === "high" ? "significant" : cognitiveLoad.currentLoad === "low" ? "minimal" : "moderate",
      confidenceScore: learningStyle.confidence
    };
  }
  buildOverallProfile(learningStyle, emotional, cognitiveLoad, motivation) {
    const strengths = [];
    const challenges = [];
    const recommendations = [];
    if (learningStyle.confidence > 70) {
      strengths.push(`Clear ${learningStyle.primary} learning preference`);
    }
    if (emotional.currentState === "motivated" || emotional.currentState === "curious") {
      strengths.push("Positive engagement level");
    }
    if (motivation.level > 60) {
      strengths.push("Good motivation");
    }
    if (cognitiveLoad.currentLoad === "optimal") {
      strengths.push("Well-balanced cognitive load");
    }
    if (emotional.currentState === "frustrated" || emotional.currentState === "confused") {
      challenges.push("Currently experiencing difficulty");
    }
    if (cognitiveLoad.currentLoad === "high" || cognitiveLoad.currentLoad === "overloaded") {
      challenges.push("High cognitive load");
    }
    if (motivation.level < 40) {
      challenges.push("Low motivation");
    }
    recommendations.push(...learningStyle.recommendations.slice(0, 2));
    recommendations.push(...emotional.interventions.slice(0, 2));
    recommendations.push(...motivation.boostStrategies.slice(0, 2));
    let nextBestAction = "Continue with current learning path";
    if (cognitiveLoad.currentLoad === "overloaded") {
      nextBestAction = "Take a short break before continuing";
    } else if (emotional.currentState === "confused") {
      nextBestAction = "Review previous concepts for better understanding";
    } else if (motivation.level < 30) {
      nextBestAction = "Try a quick win exercise to boost confidence";
    } else if (cognitiveLoad.currentLoad === "low") {
      nextBestAction = "Move on to more challenging content";
    }
    return {
      strengths,
      challenges,
      recommendations: [...new Set(recommendations)].slice(0, 5),
      nextBestAction
    };
  }
  getCacheKey(input) {
    const { context } = input;
    return `personalization:${context.user.id}:${context.page.entityId || "general"}`;
  }
};
function createPersonalizationEngine(config) {
  return new PersonalizationEngine(config);
}

// src/engines/response.ts
var ResponseEngine = class extends BaseEngine {
  constructor(config) {
    super({
      config,
      name: "response",
      version: "1.0.0",
      dependencies: ["context"],
      // At minimum, depends on context
      cacheEnabled: false
      // Responses should be fresh
    });
  }
  async process(input) {
    const { context, query, previousResults } = input;
    const contextResult = this.getEngineResult(previousResults, "context");
    const bloomsResult = this.getEngineResult(previousResults, "blooms");
    const needsAI = this.shouldUseAI(query, contextResult);
    let message;
    let aiConfidence = 0;
    if (needsAI && query) {
      const aiResponse = await this.generateAIResponse(query, context, contextResult, bloomsResult);
      message = aiResponse.content;
      aiConfidence = 0.9;
    } else {
      message = this.generateLocalResponse(context, contextResult, bloomsResult);
      aiConfidence = 0.7;
    }
    const suggestions = this.buildSuggestions(contextResult, bloomsResult, query);
    const actions = this.buildActions(context.page.type, contextResult);
    const insights = this.buildInsights(previousResults ?? {});
    const blooms = bloomsResult?.analysis;
    const confidence = this.calculateConfidence(aiConfidence, previousResults ?? {});
    const processingNotes = this.generateProcessingNotes(previousResults ?? {});
    return {
      message,
      suggestions,
      actions,
      insights,
      blooms,
      confidence,
      processingNotes
    };
  }
  getCacheKey(input) {
    return `response:${input.context.page.path}:${input.query ?? "none"}`;
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  getEngineResult(previousResults, engineName) {
    const result = previousResults?.[engineName];
    if (result?.success && result.data) {
      return result.data;
    }
    return void 0;
  }
  shouldUseAI(query, contextResult) {
    if (!query) return false;
    const intent = contextResult?.queryAnalysis?.intent;
    const aiRequiredIntents = ["question", "generation", "analysis", "command", "help"];
    if (intent && aiRequiredIntents.includes(intent)) {
      return true;
    }
    if (contextResult?.queryAnalysis?.complexity === "complex") return true;
    if (contextResult?.queryAnalysis?.complexity === "moderate") return true;
    if (query.split(/\s+/).length > 5) return true;
    return query.trim().length > 10;
  }
  async generateAIResponse(query, context, contextResult, bloomsResult) {
    const systemPrompt = this.buildSystemPrompt(context, contextResult, bloomsResult);
    try {
      const response = await this.callAI({
        systemPrompt,
        userMessage: query,
        temperature: 0.7,
        maxTokens: 1e3
      });
      return { content: response.content };
    } catch (error) {
      this.logger.error(`[ResponseEngine] AI call failed: ${error.message}`);
      return { content: this.generateFallbackResponse(query, contextResult) };
    }
  }
  buildSystemPrompt(context, contextResult, bloomsResult) {
    const personality = this.config.personality;
    const name = personality?.name ?? "SAM";
    const tone = personality?.tone ?? "friendly and professional";
    const metadata = context.page.metadata || {};
    const entitySummary = metadata.entitySummary;
    const formSummary = metadata.formSummary;
    const courseTitle = metadata.courseTitle;
    const memorySummary = metadata.memorySummary;
    const reviewSummary = metadata.reviewSummary;
    let prompt = `You are ${name}, an intelligent AI tutor assistant for an educational platform. Be ${tone}.

## Current Context
- Page Type: ${context.page.type}
- User Role: ${context.user.role}
- Path: ${context.page.path}
`;
    if (entitySummary && entitySummary !== "No specific entity context available.") {
      prompt += `
## Entity Information (ACTUAL DATA FROM DATABASE)
${entitySummary}
`;
    } else if (courseTitle) {
      prompt += `- Course: ${courseTitle}
`;
    }
    if (contextResult?.enrichedContext) {
      prompt += `- Capabilities: ${contextResult.enrichedContext.capabilities.join(", ")}
`;
    }
    if (context.form && Object.keys(context.form.fields).length > 0) {
      prompt += `
## Form Fields (CURRENT PAGE)
`;
      for (const [fieldName, field] of Object.entries(context.form.fields)) {
        const currentValue = field.value ? `"${String(field.value).substring(0, 200)}${String(field.value).length > 200 ? "..." : ""}"` : "(empty)";
        const label = field.label || fieldName;
        prompt += `- ${label}: ${currentValue}
`;
      }
    } else if (formSummary && formSummary !== "No form data available on this page.") {
      prompt += `
## Form Fields
${formSummary}
`;
    }
    if (memorySummary) {
      prompt += `
## Student Memory Summary
${memorySummary}
`;
    }
    if (reviewSummary) {
      prompt += `
## Review Schedule
${reviewSummary}
`;
    }
    if (bloomsResult?.analysis) {
      prompt += `
## Bloom's Taxonomy Analysis
- Dominant Level: ${bloomsResult.analysis.dominantLevel}
- Cognitive Depth: ${bloomsResult.analysis.cognitiveDepth}%
- Balance: ${bloomsResult.analysis.balance}
`;
      if (bloomsResult.recommendations?.length > 0) {
        prompt += `- Recommendations: ${bloomsResult.recommendations.slice(0, 2).join("; ")}
`;
      }
    }
    if (contextResult?.queryAnalysis) {
      prompt += `
## Query Analysis
- Intent: ${contextResult.queryAnalysis.intent}
- Keywords: ${contextResult.queryAnalysis.keywords.join(", ")}
`;
    }
    prompt += `
## Response Guidelines
1. **USE THE ENTITY INFORMATION ABOVE** - You know the course title, description, chapters, etc.
2. For GENERATION requests: Create content SPECIFIC to this course/chapter/section
3. For learning objectives: Use Bloom's Taxonomy verbs (Remember, Understand, Apply, Analyze, Evaluate, Create)
4. Reference actual course details in your responses
5. Be specific and actionable
6. Use markdown formatting
7. If generating form content, provide the content directly without preamble
`;
    return prompt;
  }
  generateLocalResponse(context, contextResult, bloomsResult) {
    const pageType = context.page.type;
    const name = this.config.personality?.name ?? "SAM";
    const greeting = this.config.personality?.greeting ?? `Hi! I'm ${name}, your AI tutor.`;
    let message = greeting + " ";
    switch (pageType) {
      case "dashboard":
        message += "Welcome back! I can help you manage your courses, view analytics, or create new content. What would you like to do?";
        break;
      case "courses-list":
        message += "I can help you analyze your courses, create new ones, or find insights about your teaching. What interests you?";
        break;
      case "course-detail":
        if (bloomsResult?.analysis) {
          const { dominantLevel, cognitiveDepth, balance } = bloomsResult.analysis;
          message += `This course primarily targets the ${dominantLevel} level with ${cognitiveDepth}% cognitive depth. `;
          if (balance !== "well-balanced") {
            message += `The content is ${balance}. `;
          }
          if (bloomsResult.recommendations.length > 0) {
            message += `Suggestion: ${bloomsResult.recommendations[0]}`;
          }
        } else {
          message += "I can help you improve this course structure, generate content, or analyze its effectiveness.";
        }
        break;
      case "course-create":
        message += "Let's create an amazing course together! I can help you design the structure, set learning objectives, and generate content.";
        break;
      case "chapter-detail":
        message += "I can help you develop this chapter with sections, assessments, or improved content.";
        break;
      case "section-detail":
        message += "I can help enhance this section with better content, quizzes, or analyze its cognitive level.";
        break;
      case "analytics":
        message += "I can help you understand your analytics and provide actionable insights for improvement.";
        break;
      case "learning":
        message += "I'm here to help you learn! Ask me any questions about the material, or I can quiz you on the content.";
        break;
      case "exam":
        message += "I can help you prepare for this assessment. Would you like hints or explanations?";
        break;
      default:
        message += "How can I assist you today?";
    }
    if (contextResult?.enrichedContext.suggestedActions.length) {
      const topActions = contextResult.enrichedContext.suggestedActions.slice(0, 3);
      message += `

Quick actions: ${topActions.join(", ")}`;
    }
    return message;
  }
  generateFallbackResponse(_query, contextResult) {
    const intent = contextResult?.queryAnalysis?.intent ?? "unknown";
    switch (intent) {
      case "question":
        return "I understand you have a question. Let me help you with that. Could you provide more details about what you'd like to know?";
      case "command":
        return "I'll help you with that action. Let me process your request.";
      case "analysis":
        return "I can analyze that for you. Let me examine the content and provide insights.";
      case "generation":
        return "I'd be happy to help generate content for you. What specific type of content would you like me to create?";
      case "help":
        return "I'm here to help! You can ask me to analyze content, generate materials, or guide you through features.";
      default:
        return "I'm here to assist you. How can I help with your course or learning needs?";
    }
  }
  buildSuggestions(contextResult, bloomsResult, query) {
    const suggestions = [];
    let id = 0;
    if (contextResult?.enrichedContext.suggestedActions) {
      for (const action of contextResult.enrichedContext.suggestedActions.slice(0, 2)) {
        suggestions.push({
          id: `sug_${id++}`,
          label: action,
          text: action,
          type: "quick-reply"
        });
      }
    }
    if (bloomsResult?.recommendations) {
      for (const rec of bloomsResult.recommendations.slice(0, 2)) {
        suggestions.push({
          id: `sug_${id++}`,
          label: rec.substring(0, 40) + (rec.length > 40 ? "..." : ""),
          text: rec,
          type: "action",
          priority: 1
        });
      }
    }
    if (query) {
      suggestions.push({
        id: `sug_${id++}`,
        label: "Tell me more",
        text: "Can you elaborate on that?",
        type: "quick-reply"
      });
    }
    return suggestions.slice(0, 5);
  }
  buildActions(pageType, _contextResult) {
    const actions = [];
    let id = 0;
    const pageActions = {
      "course-detail": [
        { id: `act_${id++}`, type: "generate", label: "Generate Chapters", payload: { type: "chapters" } },
        { id: `act_${id++}`, type: "analyze", label: "Analyze Structure", payload: { type: "blooms" } }
      ],
      "course-create": [
        { id: `act_${id++}`, type: "generate", label: "Generate Blueprint", payload: { type: "blueprint" } }
      ],
      "chapter-detail": [
        { id: `act_${id++}`, type: "generate", label: "Generate Sections", payload: { type: "sections" } },
        { id: `act_${id++}`, type: "generate", label: "Create Assessment", payload: { type: "quiz" } }
      ],
      "section-detail": [
        { id: `act_${id++}`, type: "analyze", label: "Analyze Bloom's Level", payload: { type: "blooms" } },
        { id: `act_${id++}`, type: "generate", label: "Enhance Content", payload: { type: "content" } }
      ]
    };
    if (pageActions[pageType]) {
      actions.push(...pageActions[pageType]);
    }
    return actions;
  }
  buildInsights(previousResults) {
    const insights = {};
    for (const [name, result] of Object.entries(previousResults)) {
      if (result.success && result.data) {
        switch (name) {
          case "context":
            const contextData = result.data;
            insights.context = {
              pageType: contextData.enrichedContext.pageType,
              queryIntent: contextData.queryAnalysis?.intent
            };
            break;
          case "blooms":
            const bloomsData = result.data;
            insights.blooms = {
              dominantLevel: bloomsData.analysis.dominantLevel,
              cognitiveDepth: bloomsData.analysis.cognitiveDepth,
              balance: bloomsData.analysis.balance,
              gaps: bloomsData.analysis.gaps
            };
            break;
          default:
            insights[name] = result.data;
        }
      }
    }
    return insights;
  }
  calculateConfidence(aiConfidence, previousResults) {
    let totalConfidence = aiConfidence;
    let count = 1;
    for (const result of Object.values(previousResults)) {
      if (result.success) {
        totalConfidence += 1;
        count++;
      } else {
        totalConfidence += 0.5;
        count++;
      }
    }
    return Math.round(totalConfidence / count * 100) / 100;
  }
  generateProcessingNotes(previousResults) {
    const notes = [];
    for (const [name, result] of Object.entries(previousResults)) {
      if (result.success) {
        notes.push(`${name}: completed in ${result.metadata.executionTime}ms${result.metadata.cached ? " (cached)" : ""}`);
      } else {
        notes.push(`${name}: failed - ${result.error?.message ?? "unknown error"}`);
      }
    }
    return notes;
  }
};
function createResponseEngine(config) {
  return new ResponseEngine(config);
}

// src/adapters/anthropic.ts
var AnthropicAdapter = class {
  name = "anthropic";
  version = "1.0.0";
  apiKey;
  model;
  baseURL;
  maxRetries;
  timeout;
  constructor(options) {
    if (!options.apiKey) {
      throw new ConfigurationError("Anthropic API key is required");
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? "claude-sonnet-4-20250514";
    this.baseURL = options.baseURL ?? "https://api.anthropic.com";
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 6e4;
  }
  /**
   * Check if the adapter is properly configured
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }
  /**
   * Get the current model being used
   */
  getModel() {
    return this.model;
  }
  /**
   * Generate a chat completion
   */
  async chat(params) {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages);
    const systemMessage = params.systemPrompt ?? this.extractSystemMessage(params.messages);
    const requestBody = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop_sequences: params.stopSequences
    };
    if (systemMessage) {
      requestBody.system = systemMessage;
    }
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(
          "/v1/messages",
          requestBody
        );
        const content = response.content.filter((c) => c.type === "text").map((c) => c.text).join("");
        return {
          content,
          model: response.model,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens
          },
          finishReason: response.stop_reason === "max_tokens" ? "max_tokens" : "stop"
        };
      } catch (error) {
        lastError = error;
        if (error instanceof AIError && !error.recoverable) {
          throw error;
        }
        if (attempt < this.maxRetries) {
          const delay = Math.min(1e3 * Math.pow(2, attempt), 1e4);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError ?? new AIError("Unknown error occurred");
  }
  /**
   * Generate a streaming chat completion
   */
  async *chatStream(params) {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages);
    const systemMessage = params.systemPrompt ?? this.extractSystemMessage(params.messages);
    const requestBody = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop_sequences: params.stopSequences,
      stream: true
    };
    if (systemMessage) {
      requestBody.system = systemMessage;
    }
    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    if (!response.body) {
      throw new AIError("No response body for streaming");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          yield { content: "", done: true };
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              yield { content: "", done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                yield { content: parsed.delta.text, done: false };
              }
            } catch {
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  /**
   * Format messages for Anthropic API
   */
  formatMessages(messages) {
    return messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role,
      content: m.content
    }));
  }
  /**
   * Extract system message from messages array
   * Anthropic API requires system message as a separate field, not in messages array
   */
  extractSystemMessage(messages) {
    const systemMessage = messages.find((m) => m.role === "system");
    return systemMessage?.content;
  }
  /**
   * Make a request to the Anthropic API
   */
  async makeRequest(endpoint, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AIError("Request timed out", { recoverable: true });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Handle error responses from the API
   */
  async handleErrorResponse(response) {
    let errorMessage = `Anthropic API error: ${response.status}`;
    let recoverable = true;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorMessage;
    } catch {
    }
    switch (response.status) {
      case 400:
        recoverable = false;
        break;
      case 401:
        throw new AIError("Invalid API key", { recoverable: false });
      case 403:
        throw new AIError("Access forbidden", { recoverable: false });
      case 429:
        throw new AIError("Rate limit exceeded", {
          recoverable: true,
          details: { retryAfter: response.headers.get("retry-after") }
        });
      case 500:
      case 502:
      case 503:
        throw new AIError("Anthropic service error", { recoverable: true });
    }
    throw new AIError(errorMessage, { recoverable });
  }
};
function createAnthropicAdapter(options) {
  return new AnthropicAdapter(options);
}

// src/adapters/deepseek.ts
var DeepSeekAdapter = class {
  name = "deepseek";
  version = "1.0.0";
  apiKey;
  model;
  baseURL;
  maxRetries;
  timeout;
  constructor(options) {
    if (!options.apiKey) {
      throw new ConfigurationError("DeepSeek API key is required");
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? "deepseek-reasoner";
    this.baseURL = options.baseURL ?? "https://api.deepseek.com";
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 6e4;
  }
  /**
   * Check if the adapter is properly configured
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }
  /**
   * Get the current model being used
   */
  getModel() {
    return this.model;
  }
  /**
   * Generate a chat completion
   */
  async chat(params) {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages, params.systemPrompt);
    const requestBody = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop: params.stopSequences
    };
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(
          "/v1/chat/completions",
          requestBody
        );
        const choice = response.choices[0];
        if (!choice) {
          throw new AIError("No response choice returned from DeepSeek");
        }
        return {
          content: choice.message.content,
          model: response.model,
          usage: {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens
          },
          finishReason: choice.finish_reason === "length" ? "max_tokens" : "stop"
        };
      } catch (error) {
        lastError = error;
        if (error instanceof AIError && !error.recoverable) {
          throw error;
        }
        if (attempt < this.maxRetries) {
          const delay = Math.min(1e3 * Math.pow(2, attempt), 1e4);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError ?? new AIError("Unknown error occurred");
  }
  /**
   * Generate a streaming chat completion
   */
  async *chatStream(params) {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages, params.systemPrompt);
    const requestBody = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop: params.stopSequences,
      stream: true
    };
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    if (!response.body) {
      throw new AIError("No response body for streaming");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          yield { content: "", done: true };
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "") {
            continue;
          }
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              yield { content: "", done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;
              if (delta?.content) {
                yield { content: delta.content, done: false };
              }
            } catch {
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  /**
   * Format messages for DeepSeek API (OpenAI format)
   */
  formatMessages(messages, systemPrompt) {
    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({
        role: "system",
        content: systemPrompt
      });
    }
    for (const m of messages) {
      formattedMessages.push({
        role: m.role,
        content: m.content
      });
    }
    return formattedMessages;
  }
  /**
   * Make a request to the DeepSeek API
   */
  async makeRequest(endpoint, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AIError("Request timed out", { recoverable: true });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Handle error responses from the API
   */
  async handleErrorResponse(response) {
    let errorMessage = `DeepSeek API error: ${response.status}`;
    let recoverable = true;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorMessage;
    } catch {
    }
    switch (response.status) {
      case 400:
        recoverable = false;
        break;
      case 401:
        throw new AIError("Invalid API key", { recoverable: false });
      case 403:
        throw new AIError("Access forbidden", { recoverable: false });
      case 429:
        throw new AIError("Rate limit exceeded", {
          recoverable: true,
          details: { retryAfter: response.headers.get("retry-after") }
        });
      case 500:
      case 502:
      case 503:
        throw new AIError("DeepSeek service error", { recoverable: true });
    }
    throw new AIError(errorMessage, { recoverable });
  }
};
function createDeepSeekAdapter(options) {
  return new DeepSeekAdapter(options);
}

// src/adapters/openai.ts
var OpenAIAdapter = class {
  name = "openai";
  version = "1.0.0";
  apiKey;
  model;
  baseURL;
  organization;
  maxRetries;
  timeout;
  constructor(options) {
    if (!options.apiKey) {
      throw new ConfigurationError("OpenAI API key is required");
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? "gpt-4o";
    this.baseURL = options.baseURL ?? "https://api.openai.com";
    this.organization = options.organization;
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 6e4;
  }
  /**
   * Check if the adapter is properly configured
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }
  /**
   * Get the current model being used
   */
  getModel() {
    return this.model;
  }
  /**
   * Generate a chat completion
   */
  async chat(params) {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages, params.systemPrompt);
    const requestBody = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop: params.stopSequences
    };
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(
          "/v1/chat/completions",
          requestBody
        );
        const choice = response.choices[0];
        if (!choice) {
          throw new AIError("No response choice returned from OpenAI");
        }
        return {
          content: choice.message.content,
          model: response.model,
          usage: {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens
          },
          finishReason: choice.finish_reason === "length" ? "max_tokens" : "stop"
        };
      } catch (error) {
        lastError = error;
        if (error instanceof AIError && !error.recoverable) {
          throw error;
        }
        if (attempt < this.maxRetries) {
          const delay = Math.min(1e3 * Math.pow(2, attempt), 1e4);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError ?? new AIError("Unknown error occurred");
  }
  /**
   * Generate a streaming chat completion
   */
  async *chatStream(params) {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages, params.systemPrompt);
    const requestBody = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop: params.stopSequences,
      stream: true
    };
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`
    };
    if (this.organization) {
      headers["OpenAI-Organization"] = this.organization;
    }
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    if (!response.body) {
      throw new AIError("No response body for streaming");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          yield { content: "", done: true };
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "") {
            continue;
          }
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              yield { content: "", done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;
              if (delta?.content) {
                yield { content: delta.content, done: false };
              }
            } catch {
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  /**
   * Format messages for OpenAI API
   */
  formatMessages(messages, systemPrompt) {
    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({
        role: "system",
        content: systemPrompt
      });
    }
    for (const m of messages) {
      formattedMessages.push({
        role: m.role,
        content: m.content
      });
    }
    return formattedMessages;
  }
  /**
   * Make a request to the OpenAI API
   */
  async makeRequest(endpoint, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`
    };
    if (this.organization) {
      headers["OpenAI-Organization"] = this.organization;
    }
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AIError("Request timed out", { recoverable: true });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Handle error responses from the API
   */
  async handleErrorResponse(response) {
    let errorMessage = `OpenAI API error: ${response.status}`;
    let recoverable = true;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorMessage;
    } catch {
    }
    switch (response.status) {
      case 400:
        recoverable = false;
        break;
      case 401:
        throw new AIError("Invalid API key", { recoverable: false });
      case 403:
        throw new AIError("Access forbidden", { recoverable: false });
      case 429:
        throw new AIError("Rate limit exceeded", {
          recoverable: true,
          details: { retryAfter: response.headers.get("retry-after") }
        });
      case 500:
      case 502:
      case 503:
        throw new AIError("OpenAI service error", { recoverable: true });
    }
    throw new AIError(errorMessage, { recoverable });
  }
};
function createOpenAIAdapter(options) {
  return new OpenAIAdapter(options);
}

// src/adapters/memory-cache.ts
var MemoryCacheAdapter = class {
  name = "memory";
  cache = /* @__PURE__ */ new Map();
  defaultTTL;
  maxSize;
  cleanupTimer;
  constructor(options) {
    this.defaultTTL = options?.defaultTTL ?? 300;
    this.maxSize = options?.maxSize ?? 1e3;
    const cleanupInterval = options?.cleanupInterval ?? 6e4;
    if (cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
    }
  }
  /**
   * Get a value from cache
   */
  async get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  /**
   * Set a value in cache
   */
  async set(key, value, ttlSeconds) {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    const ttl = ttlSeconds ?? this.defaultTTL;
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1e3 : null;
    this.cache.set(key, { value, expiresAt });
  }
  /**
   * Delete a key from cache
   */
  async delete(key) {
    return this.cache.delete(key);
  }
  /**
   * Check if a key exists in cache
   */
  async has(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
  /**
   * Clear cache entries matching a pattern
   */
  async clear(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const regex = this.patternToRegex(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Get multiple values from cache
   */
  async getMany(keys) {
    const result = /* @__PURE__ */ new Map();
    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    return result;
  }
  /**
   * Set multiple values in cache
   */
  async setMany(entries, ttlSeconds) {
    for (const [key, value] of entries) {
      await this.set(key, value, ttlSeconds);
    }
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
  /**
   * Dispose the cache adapter
   */
  dispose() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    this.cache.clear();
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Evict oldest entries when cache is full
   */
  evictOldest() {
    const toEvict = Math.max(1, Math.floor(this.maxSize * 0.1));
    const keys = Array.from(this.cache.keys()).slice(0, toEvict);
    for (const key of keys) {
      this.cache.delete(key);
    }
  }
  /**
   * Convert a glob pattern to a regex
   */
  patternToRegex(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`);
  }
};
function createMemoryCache(options) {
  return new MemoryCacheAdapter(options);
}

// src/adapters/database.ts
var NoopDatabaseAdapter = class {
  async findUser() {
    return null;
  }
  async findUsers() {
    return [];
  }
  async updateUser(_id, data) {
    return { id: _id, name: null, email: null, ...data };
  }
  async findCourse() {
    return null;
  }
  async findCourses() {
    return [];
  }
  async findChapter() {
    return null;
  }
  async findChaptersByCourse() {
    return [];
  }
  async findSection() {
    return null;
  }
  async findSectionsByChapter() {
    return [];
  }
  async findQuestions() {
    return [];
  }
  async createQuestion(data) {
    return {
      id: `temp-${Date.now()}`,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      ...data
    };
  }
  async updateQuestion(id, data) {
    return {
      id,
      question: "",
      questionType: "multiple_choice",
      bloomsLevel: "remember",
      difficulty: "medium",
      points: 1,
      courseId: "",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      ...data
    };
  }
  async deleteQuestion() {
  }
  async findBloomsProgress() {
    return null;
  }
  async upsertBloomsProgress(userId, courseId, data) {
    return {
      id: `temp-${Date.now()}`,
      userId,
      courseId,
      rememberScore: 0,
      understandScore: 0,
      applyScore: 0,
      analyzeScore: 0,
      evaluateScore: 0,
      createScore: 0,
      overallScore: 0,
      assessmentCount: 0,
      updatedAt: /* @__PURE__ */ new Date(),
      ...data
    };
  }
  async findCognitiveProgress() {
    return null;
  }
  async upsertCognitiveProgress(userId, skillType, data) {
    return {
      id: `temp-${Date.now()}`,
      userId,
      skillType,
      proficiencyLevel: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      averageTimeSeconds: 0,
      updatedAt: /* @__PURE__ */ new Date(),
      ...data
    };
  }
  async logInteraction(data) {
    return {
      id: `temp-${Date.now()}`,
      createdAt: /* @__PURE__ */ new Date(),
      ...data
    };
  }
  async findInteractions() {
    return [];
  }
  async countInteractions() {
    return 0;
  }
  async findCourseAnalysis() {
    return null;
  }
  async upsertCourseAnalysis(courseId, data) {
    return {
      id: `temp-${Date.now()}`,
      courseId,
      rememberPercentage: 0,
      understandPercentage: 0,
      applyPercentage: 0,
      analyzePercentage: 0,
      evaluatePercentage: 0,
      createPercentage: 0,
      totalObjectives: 0,
      overallScore: 0,
      analyzedAt: /* @__PURE__ */ new Date(),
      ...data
    };
  }
  async healthCheck() {
    return true;
  }
};
function createNoopDatabaseAdapter() {
  return new NoopDatabaseAdapter();
}

// src/adapters/memory-database.ts
var InMemoryDatabaseAdapter = class {
  // Data stores
  users = /* @__PURE__ */ new Map();
  courses = /* @__PURE__ */ new Map();
  chapters = /* @__PURE__ */ new Map();
  sections = /* @__PURE__ */ new Map();
  questions = /* @__PURE__ */ new Map();
  bloomsProgress = /* @__PURE__ */ new Map();
  cognitiveProgress = /* @__PURE__ */ new Map();
  interactions = [];
  courseAnalysis = /* @__PURE__ */ new Map();
  idCounter = 1;
  options;
  constructor(options = {}) {
    this.options = options;
    if (options.seed?.users) {
      options.seed.users.forEach((u) => this.users.set(u.id, u));
    }
    if (options.seed?.courses) {
      options.seed.courses.forEach((c) => {
        this.courses.set(c.id, c);
        c.chapters?.forEach((ch) => {
          this.chapters.set(ch.id, ch);
          ch.sections?.forEach((s) => this.sections.set(s.id, s));
        });
      });
    }
    if (options.seed?.questions) {
      options.seed.questions.forEach((q) => this.questions.set(q.id, q));
    }
    if (options.persistToLocalStorage && typeof localStorage !== "undefined") {
      this.loadFromStorage();
    }
  }
  generateId(prefix) {
    return `${prefix}-${Date.now()}-${this.idCounter++}`;
  }
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================
  async findUser(id) {
    return this.users.get(id) ?? null;
  }
  async findUsers(filter, options) {
    let results = Array.from(this.users.values());
    if (filter.email) {
      results = results.filter((u) => u.email === filter.email);
    }
    if (filter.name) {
      results = results.filter((u) => u.name?.includes(filter.name));
    }
    if (filter.role) {
      results = results.filter((u) => u.role === filter.role);
    }
    return this.applyQueryOptions(results, options);
  }
  async updateUser(id, data) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    const updated = {
      ...user,
      ...data,
      id,
      // Preserve ID
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, updated);
    this.persist();
    return updated;
  }
  // ============================================================================
  // COURSE OPERATIONS
  // ============================================================================
  async findCourse(id, options) {
    const course = this.courses.get(id);
    if (!course) return null;
    if (options?.include?.chapters) {
      const chapters = Array.from(this.chapters.values()).filter((ch) => ch.courseId === id).sort((a, b) => a.position - b.position);
      if (options.include.sections) {
        chapters.forEach((ch) => {
          ch.sections = Array.from(this.sections.values()).filter((s) => s.chapterId === ch.id).sort((a, b) => a.position - b.position);
        });
      }
      return { ...course, chapters };
    }
    return course;
  }
  async findCourses(filter, options) {
    let results = Array.from(this.courses.values());
    if (filter.userId) {
      results = results.filter((c) => c.userId === filter.userId);
    }
    if (filter.isPublished !== void 0) {
      results = results.filter((c) => c.isPublished === filter.isPublished);
    }
    if (filter.title) {
      results = results.filter(
        (c) => c.title.toLowerCase().includes(filter.title.toLowerCase())
      );
    }
    if (filter.categoryId) {
      results = results.filter((c) => c.categoryId === filter.categoryId);
    }
    return this.applyQueryOptions(results, options);
  }
  // ============================================================================
  // CHAPTER/SECTION OPERATIONS
  // ============================================================================
  async findChapter(id, options) {
    const chapter = this.chapters.get(id);
    if (!chapter) return null;
    if (options?.include?.sections) {
      const sections = Array.from(this.sections.values()).filter((s) => s.chapterId === id).sort((a, b) => a.position - b.position);
      return { ...chapter, sections };
    }
    return chapter;
  }
  async findChaptersByCourse(courseId, options) {
    let results = Array.from(this.chapters.values()).filter((ch) => ch.courseId === courseId).sort((a, b) => a.position - b.position);
    if (options?.include?.sections) {
      results = results.map((ch) => ({
        ...ch,
        sections: Array.from(this.sections.values()).filter((s) => s.chapterId === ch.id).sort((a, b) => a.position - b.position)
      }));
    }
    return this.applyQueryOptions(results, options);
  }
  async findSection(id) {
    return this.sections.get(id) ?? null;
  }
  async findSectionsByChapter(chapterId, options) {
    const results = Array.from(this.sections.values()).filter((s) => s.chapterId === chapterId).sort((a, b) => a.position - b.position);
    return this.applyQueryOptions(results, options);
  }
  // ============================================================================
  // QUESTION BANK OPERATIONS
  // ============================================================================
  async findQuestions(filter, options) {
    let results = Array.from(this.questions.values());
    if (filter.courseId) {
      results = results.filter((q) => q.courseId === filter.courseId);
    }
    if (filter.chapterId) {
      results = results.filter((q) => q.chapterId === filter.chapterId);
    }
    if (filter.sectionId) {
      results = results.filter((q) => q.sectionId === filter.sectionId);
    }
    if (filter.bloomsLevel) {
      results = results.filter((q) => q.bloomsLevel === filter.bloomsLevel);
    }
    if (filter.difficulty) {
      results = results.filter((q) => q.difficulty === filter.difficulty);
    }
    if (filter.questionType) {
      results = results.filter((q) => q.questionType === filter.questionType);
    }
    return this.applyQueryOptions(results, options);
  }
  async createQuestion(data) {
    const question = {
      id: this.generateId("question"),
      ...data,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.questions.set(question.id, question);
    this.persist();
    return question;
  }
  async updateQuestion(id, data) {
    const question = this.questions.get(id);
    if (!question) {
      throw new Error(`Question ${id} not found`);
    }
    const updated = {
      ...question,
      ...data,
      id,
      // Preserve ID
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.questions.set(id, updated);
    this.persist();
    return updated;
  }
  async deleteQuestion(id) {
    this.questions.delete(id);
    this.persist();
  }
  // ============================================================================
  // BLOOM'S PROGRESS OPERATIONS
  // ============================================================================
  async findBloomsProgress(userId, courseId) {
    const key = `${userId}:${courseId}`;
    return this.bloomsProgress.get(key) ?? null;
  }
  async upsertBloomsProgress(userId, courseId, data) {
    const key = `${userId}:${courseId}`;
    const existing = this.bloomsProgress.get(key);
    const progress = {
      id: existing?.id ?? this.generateId("blooms"),
      userId,
      courseId,
      rememberScore: data.rememberScore ?? existing?.rememberScore ?? 0,
      understandScore: data.understandScore ?? existing?.understandScore ?? 0,
      applyScore: data.applyScore ?? existing?.applyScore ?? 0,
      analyzeScore: data.analyzeScore ?? existing?.analyzeScore ?? 0,
      evaluateScore: data.evaluateScore ?? existing?.evaluateScore ?? 0,
      createScore: data.createScore ?? existing?.createScore ?? 0,
      overallScore: data.overallScore ?? existing?.overallScore ?? 0,
      assessmentCount: data.assessmentCount ?? existing?.assessmentCount ?? 0,
      lastAssessedAt: data.lastAssessedAt ?? /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.bloomsProgress.set(key, progress);
    this.persist();
    return progress;
  }
  // ============================================================================
  // COGNITIVE PROGRESS OPERATIONS
  // ============================================================================
  async findCognitiveProgress(userId, skillType) {
    const key = `${userId}:${skillType}`;
    return this.cognitiveProgress.get(key) ?? null;
  }
  async upsertCognitiveProgress(userId, skillType, data) {
    const key = `${userId}:${skillType}`;
    const existing = this.cognitiveProgress.get(key);
    const progress = {
      id: existing?.id ?? this.generateId("cognitive"),
      userId,
      skillType,
      proficiencyLevel: data.proficiencyLevel ?? existing?.proficiencyLevel ?? 0,
      totalAttempts: data.totalAttempts ?? existing?.totalAttempts ?? 0,
      successfulAttempts: data.successfulAttempts ?? existing?.successfulAttempts ?? 0,
      averageTimeSeconds: data.averageTimeSeconds ?? existing?.averageTimeSeconds ?? 0,
      lastPracticedAt: data.lastPracticedAt ?? /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.cognitiveProgress.set(key, progress);
    this.persist();
    return progress;
  }
  // ============================================================================
  // INTERACTION LOGGING
  // ============================================================================
  async logInteraction(data) {
    const interaction = {
      id: this.generateId("interaction"),
      ...data,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.interactions.push(interaction);
    this.persist();
    return interaction;
  }
  async findInteractions(userId, options) {
    let results = this.interactions.filter((i) => i.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return this.applyQueryOptions(results, options);
  }
  async countInteractions(filter) {
    let results = [...this.interactions];
    if (filter?.userId) {
      results = results.filter((i) => i.userId === filter.userId);
    }
    if (filter?.pageType) {
      results = results.filter((i) => i.pageType === filter.pageType);
    }
    if (filter?.startDate) {
      results = results.filter((i) => i.createdAt >= filter.startDate);
    }
    if (filter?.endDate) {
      results = results.filter((i) => i.createdAt <= filter.endDate);
    }
    return results.length;
  }
  // ============================================================================
  // COURSE ANALYSIS OPERATIONS
  // ============================================================================
  async findCourseAnalysis(courseId) {
    return this.courseAnalysis.get(courseId) ?? null;
  }
  async upsertCourseAnalysis(courseId, data) {
    const existing = this.courseAnalysis.get(courseId);
    const analysis = {
      id: existing?.id ?? this.generateId("analysis"),
      courseId,
      rememberPercentage: data.rememberPercentage ?? existing?.rememberPercentage ?? 0,
      understandPercentage: data.understandPercentage ?? existing?.understandPercentage ?? 0,
      applyPercentage: data.applyPercentage ?? existing?.applyPercentage ?? 0,
      analyzePercentage: data.analyzePercentage ?? existing?.analyzePercentage ?? 0,
      evaluatePercentage: data.evaluatePercentage ?? existing?.evaluatePercentage ?? 0,
      createPercentage: data.createPercentage ?? existing?.createPercentage ?? 0,
      totalObjectives: data.totalObjectives ?? existing?.totalObjectives ?? 0,
      overallScore: data.overallScore ?? existing?.overallScore ?? 0,
      recommendations: data.recommendations ?? existing?.recommendations,
      gaps: data.gaps ?? existing?.gaps,
      analyzedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.courseAnalysis.set(courseId, analysis);
    this.persist();
    return analysis;
  }
  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================
  async healthCheck() {
    return true;
  }
  async beginTransaction() {
    return {
      id: `tx-${Date.now()}`,
      startedAt: /* @__PURE__ */ new Date()
    };
  }
  async commitTransaction() {
  }
  async rollbackTransaction() {
  }
  // ============================================================================
  // DATA MANAGEMENT
  // ============================================================================
  /**
   * Clear all data from memory
   */
  clear() {
    this.users.clear();
    this.courses.clear();
    this.chapters.clear();
    this.sections.clear();
    this.questions.clear();
    this.bloomsProgress.clear();
    this.cognitiveProgress.clear();
    this.interactions = [];
    this.courseAnalysis.clear();
    this.persist();
  }
  /**
   * Add a user to the store
   */
  addUser(user) {
    this.users.set(user.id, user);
    this.persist();
  }
  /**
   * Add a course to the store
   */
  addCourse(course) {
    this.courses.set(course.id, course);
    course.chapters?.forEach((ch) => {
      this.chapters.set(ch.id, ch);
      ch.sections?.forEach((s) => this.sections.set(s.id, s));
    });
    this.persist();
  }
  /**
   * Get all stored data (for debugging/export)
   */
  getData() {
    return {
      users: Array.from(this.users.values()),
      courses: Array.from(this.courses.values()),
      questions: Array.from(this.questions.values()),
      interactions: [...this.interactions]
    };
  }
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  applyQueryOptions(results, options) {
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    return results;
  }
  persist() {
    if (this.options.persistToLocalStorage && typeof localStorage !== "undefined") {
      const prefix = this.options.storageKeyPrefix ?? "sam-db-";
      localStorage.setItem(`${prefix}users`, JSON.stringify(Array.from(this.users.entries())));
      localStorage.setItem(`${prefix}courses`, JSON.stringify(Array.from(this.courses.entries())));
      localStorage.setItem(`${prefix}chapters`, JSON.stringify(Array.from(this.chapters.entries())));
      localStorage.setItem(`${prefix}sections`, JSON.stringify(Array.from(this.sections.entries())));
      localStorage.setItem(`${prefix}questions`, JSON.stringify(Array.from(this.questions.entries())));
      localStorage.setItem(`${prefix}interactions`, JSON.stringify(this.interactions));
    }
  }
  loadFromStorage() {
    if (typeof localStorage === "undefined") return;
    const prefix = this.options.storageKeyPrefix ?? "sam-db-";
    try {
      const users = localStorage.getItem(`${prefix}users`);
      if (users) this.users = new Map(JSON.parse(users));
      const courses = localStorage.getItem(`${prefix}courses`);
      if (courses) this.courses = new Map(JSON.parse(courses));
      const chapters = localStorage.getItem(`${prefix}chapters`);
      if (chapters) this.chapters = new Map(JSON.parse(chapters));
      const sections = localStorage.getItem(`${prefix}sections`);
      if (sections) this.sections = new Map(JSON.parse(sections));
      const questions = localStorage.getItem(`${prefix}questions`);
      if (questions) this.questions = new Map(JSON.parse(questions));
      const interactions = localStorage.getItem(`${prefix}interactions`);
      if (interactions) this.interactions = JSON.parse(interactions);
    } catch {
    }
  }
};
function createInMemoryDatabase(options = {}) {
  return new InMemoryDatabaseAdapter(options);
}

// src/index.ts
var VERSION = "0.1.0";
export {
  AIError,
  AnthropicAdapter,
  AssessmentEngine,
  BLOOMS_LEVELS,
  BLOOMS_LEVEL_ORDER,
  BaseEngine,
  BloomsEngine,
  CacheError,
  ConfigurationError,
  ContentEngine,
  ContextEngine,
  DeepSeekAdapter,
  DependencyError,
  EngineError,
  InMemoryDatabaseAdapter,
  InitializationError,
  MemoryCacheAdapter,
  NoopDatabaseAdapter,
  OpenAIAdapter,
  OrchestrationError,
  PersonalizationEngine,
  RateLimitError,
  ResponseEngine,
  SAMAgentOrchestrator,
  SAMError,
  SAMStateMachine,
  StorageError,
  TimeoutError,
  VERSION,
  ValidationError,
  createAnthropicAdapter,
  createAssessmentEngine,
  createBloomsEngine,
  createContentEngine,
  createContextEngine,
  createDeepSeekAdapter,
  createDefaultContext,
  createDefaultConversationContext,
  createDefaultGamificationContext,
  createDefaultPageContext,
  createDefaultUIContext,
  createDefaultUserContext,
  createInMemoryDatabase,
  createMemoryCache,
  createNoopDatabaseAdapter,
  createOpenAIAdapter,
  createOrchestrator,
  createPersonalizationEngine,
  createResponseEngine,
  createSAMConfig,
  createStateMachine,
  createTimeoutPromise,
  isSAMError,
  withRetry,
  withTimeout,
  wrapError
};
