// src/handlers/chat.ts
import {
  createOrchestrator,
  createContextEngine,
  createResponseEngine,
  createDefaultContext
} from "@sam-ai/core";
import {
  createUnifiedBloomsAdapterEngine
} from "@sam-ai/educational";
function createSuccessResponse(data, status = 200) {
  return {
    status,
    body: {
      success: true,
      data
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createErrorResponse(status, code, message, details) {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function toResponse(result, bloomsAnalysis) {
  return {
    message: result.response.message,
    conversationId: `conv_${Date.now()}`,
    suggestions: result.response.suggestions ?? [],
    actions: result.response.actions ?? [],
    bloomsAnalysis: bloomsAnalysis ?? result.response.blooms,
    usage: void 0
  };
}
function buildUserContext(handlerContext) {
  if (!handlerContext.user) return void 0;
  return {
    id: handlerContext.user.id,
    role: handlerContext.user.role === "teacher" ? "teacher" : "student",
    name: handlerContext.user.name,
    preferences: {
      learningStyle: "visual",
      preferredTone: "encouraging",
      teachingMethod: "mixed"
    },
    capabilities: []
  };
}
function createChatHandler(config) {
  const orchestrator = createOrchestrator(config);
  orchestrator.registerEngine(createContextEngine(config));
  orchestrator.registerEngine(createUnifiedBloomsAdapterEngine({
    samConfig: config,
    defaultMode: "standard",
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600
  }));
  orchestrator.registerEngine(createResponseEngine(config));
  return async (request, handlerContext) => {
    const body = request.body;
    if (!body.message || typeof body.message !== "string") {
      return createErrorResponse(
        400,
        "INVALID_REQUEST",
        "Message is required and must be a string"
      );
    }
    if (body.message.length > 1e4) {
      return createErrorResponse(
        400,
        "MESSAGE_TOO_LONG",
        "Message exceeds maximum length of 10000 characters"
      );
    }
    try {
      const userContext = buildUserContext(handlerContext);
      const normalizedHistory = (body.history ?? []).map((message) => ({
        ...message,
        timestamp: message.timestamp ? new Date(message.timestamp) : /* @__PURE__ */ new Date()
      }));
      const baseContext = createDefaultContext(body.context);
      const samContext = {
        ...baseContext,
        user: userContext ? { ...baseContext.user, ...userContext } : baseContext.user,
        conversation: {
          ...baseContext.conversation,
          messages: normalizedHistory.length > 0 ? normalizedHistory : baseContext.conversation.messages,
          totalMessages: normalizedHistory.length > 0 ? normalizedHistory.length : baseContext.conversation.totalMessages,
          lastMessageAt: normalizedHistory.length > 0 ? normalizedHistory[normalizedHistory.length - 1]?.timestamp ?? null : baseContext.conversation.lastMessageAt
        }
      };
      const result = await orchestrator.orchestrate(samContext, body.message, {
        includeInsights: true
      });
      const bloomsOutput = result.results.blooms?.data;
      const bloomsAnalysis = bloomsOutput?.analysis ?? result.response.blooms;
      if (!result.success && result.metadata.enginesFailed.length > 0) {
        return createErrorResponse(
          500,
          "PROCESSING_ERROR",
          "Some engines failed during processing",
          {
            enginesFailed: result.metadata.enginesFailed
          }
        );
      }
      const chatResponse = toResponse(result, bloomsAnalysis);
      return createSuccessResponse(chatResponse);
    } catch (error) {
      console.error("[SAM Chat Handler] Error:", error);
      if (error instanceof Error) {
        return createErrorResponse(
          500,
          "INTERNAL_ERROR",
          process.env.NODE_ENV === "development" ? error.message : "An error occurred while processing your message"
        );
      }
      return createErrorResponse(
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred"
      );
    }
  };
}
function createStreamingChatHandler(config) {
  const orchestrator = createOrchestrator(config);
  orchestrator.registerEngine(createContextEngine(config));
  orchestrator.registerEngine(createUnifiedBloomsAdapterEngine({
    samConfig: config,
    defaultMode: "standard",
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600
  }));
  orchestrator.registerEngine(createResponseEngine(config));
  return async (request, handlerContext, onChunk) => {
    const body = request.body;
    const userContext = buildUserContext(handlerContext);
    const normalizedHistory = (body.history ?? []).map((message) => ({
      ...message,
      timestamp: message.timestamp ? new Date(message.timestamp) : /* @__PURE__ */ new Date()
    }));
    const baseContext = createDefaultContext(body.context);
    const samContext = {
      ...baseContext,
      user: userContext ? { ...baseContext.user, ...userContext } : baseContext.user,
      conversation: {
        ...baseContext.conversation,
        messages: normalizedHistory.length > 0 ? normalizedHistory : baseContext.conversation.messages,
        totalMessages: normalizedHistory.length > 0 ? normalizedHistory.length : baseContext.conversation.totalMessages,
        lastMessageAt: normalizedHistory.length > 0 ? normalizedHistory[normalizedHistory.length - 1]?.timestamp ?? null : baseContext.conversation.lastMessageAt
      }
    };
    const result = await orchestrator.orchestrate(samContext, body.message);
    const bloomsOutput = result.results.blooms?.data;
    const bloomsAnalysis = bloomsOutput?.analysis ?? result.response.blooms;
    onChunk(
      JSON.stringify({
        type: "text",
        content: result.response.message
      })
    );
    onChunk(
      JSON.stringify({
        type: "done",
        data: toResponse(result, bloomsAnalysis)
      })
    );
  };
}

// src/handlers/analyze.ts
import {
  createOrchestrator as createOrchestrator2,
  createContextEngine as createContextEngine2,
  createContentEngine,
  createDefaultContext as createDefaultContext2
} from "@sam-ai/core";
import {
  createUnifiedBloomsAdapterEngine as createUnifiedBloomsAdapterEngine2,
  createUnifiedBloomsEngine
} from "@sam-ai/educational";
function createSuccessResponse2(data, status = 200) {
  return {
    status,
    body: {
      success: true,
      data
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createErrorResponse2(status, code, message, details) {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function buildUserContext2(handlerContext) {
  if (!handlerContext.user) return void 0;
  return {
    id: handlerContext.user.id,
    role: handlerContext.user.role === "teacher" ? "teacher" : "student",
    name: handlerContext.user.name,
    preferences: {
      learningStyle: "visual",
      preferredTone: "encouraging",
      teachingMethod: "mixed"
    },
    capabilities: []
  };
}
function createAnalyzeHandler(config) {
  const orchestrator = createOrchestrator2(config);
  orchestrator.registerEngine(createContextEngine2(config));
  orchestrator.registerEngine(createUnifiedBloomsAdapterEngine2({
    samConfig: config,
    defaultMode: "standard",
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600
  }));
  orchestrator.registerEngine(createContentEngine(config));
  return async (request, handlerContext) => {
    const body = request.body;
    const startTime = Date.now();
    if (!body.content && !body.context) {
      return createErrorResponse2(
        400,
        "INVALID_REQUEST",
        "Either content or context is required"
      );
    }
    try {
      const analysisType = body.type ?? "full";
      const enginesUsed = [];
      const recommendations = [];
      const analysis = {};
      const userContext = buildUserContext2(handlerContext);
      const samContext = createDefaultContext2({
        user: userContext,
        page: {
          type: "other",
          path: "/",
          capabilities: [],
          breadcrumb: []
        }
      });
      const enginesToRun = [];
      if (analysisType === "blooms" || analysisType === "full") {
        enginesToRun.push("blooms");
      }
      if (analysisType === "content" || analysisType === "full") {
        enginesToRun.push("content");
      }
      if (!enginesToRun.includes("context")) {
        enginesToRun.unshift("context");
      }
      const result = await orchestrator.orchestrate(
        samContext,
        body.content ?? "Analyze the current context",
        { engines: enginesToRun }
      );
      if (result.results["blooms"]?.success && result.results["blooms"]?.data) {
        const bloomsOutput = result.results["blooms"].data;
        const blooms = bloomsOutput.analysis;
        if (blooms?.distribution && blooms.dominantLevel) {
          analysis.blooms = blooms;
          enginesUsed.push("blooms");
          if (body.options?.includeRecommendations) {
            if (blooms.cognitiveDepth < 50) {
              recommendations.push(
                "Consider adding higher-order thinking questions (analyze, evaluate, create)"
              );
            }
            if (blooms.dominantLevel === "REMEMBER") {
              recommendations.push(
                "The content is focused on basic recall. Consider adding application exercises."
              );
            }
            if (blooms.recommendations) {
              recommendations.push(...blooms.recommendations.slice(0, 3));
            }
          }
        }
      }
      if (result.results["content"]?.success && result.results["content"]?.data) {
        const contentData = result.results["content"].data;
        analysis.content = {
          score: contentData.score ?? 0,
          metrics: contentData.metrics ?? {},
          suggestions: (contentData.suggestions ?? []).map(
            (s) => typeof s === "string" ? s : s.text
          )
        };
        enginesUsed.push("content");
        if (body.options?.includeRecommendations && analysis.content.suggestions) {
          recommendations.push(...analysis.content.suggestions.slice(0, 3));
        }
      }
      if (analysisType === "assessment" || analysisType === "full") {
        if (body.context?.page?.type === "section-detail") {
          analysis.assessment = {
            questionCount: 0,
            distribution: {
              multipleChoice: 0,
              trueFalse: 0,
              shortAnswer: 0,
              essay: 0
            }
          };
          enginesUsed.push("assessment");
          if (body.options?.includeRecommendations) {
            recommendations.push(
              "Consider adding a variety of question types for comprehensive assessment"
            );
          }
        }
      }
      const processingTime = Date.now() - startTime;
      const response = {
        analysis,
        recommendations: [...new Set(recommendations)],
        // Deduplicate
        metadata: {
          processingTime,
          enginesUsed
        }
      };
      return createSuccessResponse2(response);
    } catch (error) {
      console.error("[SAM Analyze Handler] Error:", error);
      if (error instanceof Error) {
        return createErrorResponse2(
          500,
          "ANALYSIS_ERROR",
          process.env.NODE_ENV === "development" ? error.message : "An error occurred during analysis"
        );
      }
      return createErrorResponse2(
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred"
      );
    }
  };
}
async function analyzeBloomsLevel(config, content) {
  const unifiedBlooms = createUnifiedBloomsEngine({
    samConfig: config,
    defaultMode: "standard",
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600
  });
  try {
    const result = await unifiedBlooms.analyze(content, {
      mode: "standard"
    });
    return {
      dominantLevel: result.dominantLevel,
      distribution: result.distribution,
      cognitiveDepth: result.cognitiveDepth,
      balance: result.balance,
      gaps: result.gaps,
      recommendations: result.recommendations.map((r) => r.action),
      confidence: result.confidence,
      method: result.metadata.method
    };
  } catch {
    return null;
  }
}

// src/handlers/gamification.ts
function createSuccessResponse3(data, status = 200) {
  return {
    status,
    body: {
      success: true,
      data
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createErrorResponse3(status, code, message, details) {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function getDefaultGamificationData() {
  return {
    points: 0,
    level: 1,
    badges: [],
    streak: {
      current: 0,
      longest: 0,
      lastActivity: /* @__PURE__ */ new Date()
    },
    achievements: []
  };
}
function storageToResponseFormat(stored) {
  return {
    points: stored.points,
    level: stored.level,
    badges: stored.badges.map((b) => ({
      id: b.id,
      name: b.name,
      earnedAt: b.earnedAt
    })),
    streak: {
      current: stored.currentStreak,
      longest: stored.longestStreak,
      lastActivity: stored.lastActivityDate ?? /* @__PURE__ */ new Date()
    },
    achievements: []
    // Storage doesn't have achievements in this structure
  };
}
function calculateLevel(points) {
  return Math.floor(Math.sqrt(points / 100)) + 1;
}
function createGamificationHandler(config) {
  const storage = config.storage;
  return async (request, _handlerContext) => {
    const body = request.body;
    if (!body.userId) {
      return createErrorResponse3(400, "INVALID_REQUEST", "User ID is required");
    }
    try {
      switch (body.action) {
        case "get":
          return await handleGet(body.userId, storage);
        case "update":
          return await handleUpdate(body.userId, body.payload, storage);
        case "award-badge":
          return await handleAwardBadge(body.userId, body.payload, storage);
        case "update-streak":
          return await handleUpdateStreak(body.userId, storage);
        default:
          return createErrorResponse3(
            400,
            "INVALID_ACTION",
            `Unknown action: ${body.action}`
          );
      }
    } catch (error) {
      console.error("[SAM Gamification Handler] Error:", error);
      if (error instanceof Error) {
        return createErrorResponse3(
          500,
          "GAMIFICATION_ERROR",
          process.env.NODE_ENV === "development" ? error.message : "An error occurred processing gamification request"
        );
      }
      return createErrorResponse3(
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred"
      );
    }
  };
}
async function handleGet(userId, storage) {
  let data = getDefaultGamificationData();
  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      data = storageToResponseFormat(stored);
    }
  }
  const response = {
    data
  };
  return createSuccessResponse3(response);
}
async function handleUpdate(userId, payload, storage) {
  const pointsToAdd = payload?.points ?? 0;
  const activity = payload?.activity ?? "unknown";
  let currentData = getDefaultGamificationData();
  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      currentData = storageToResponseFormat(stored);
    }
  }
  const newPoints = currentData.points + pointsToAdd;
  const newLevel = calculateLevel(newPoints);
  const updatedData = {
    ...currentData,
    points: newPoints,
    level: newLevel
  };
  if (storage?.updateGamificationData) {
    await storage.updateGamificationData(userId, {
      points: newPoints,
      level: newLevel
    });
  }
  const response = {
    data: updatedData,
    recentActivity: [
      {
        type: activity,
        points: pointsToAdd,
        timestamp: /* @__PURE__ */ new Date()
      }
    ]
  };
  return createSuccessResponse3(response);
}
async function handleAwardBadge(userId, payload, storage) {
  if (!payload?.badgeId) {
    return createErrorResponse3(400, "INVALID_REQUEST", "Badge ID is required");
  }
  let currentData = getDefaultGamificationData();
  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      currentData = storageToResponseFormat(stored);
    }
  }
  if (currentData.badges.some((b) => b.id === payload.badgeId)) {
    return createErrorResponse3(400, "BADGE_EXISTS", "Badge already awarded");
  }
  const newBadge = {
    id: payload.badgeId,
    name: payload.badgeId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    earnedAt: /* @__PURE__ */ new Date()
  };
  const updatedData = {
    ...currentData,
    badges: [...currentData.badges, newBadge]
  };
  if (storage?.awardBadge) {
    const badgeData = {
      id: payload.badgeId,
      type: "achievement",
      name: newBadge.name,
      level: "bronze",
      earnedAt: /* @__PURE__ */ new Date()
    };
    await storage.awardBadge(userId, badgeData);
  }
  const response = {
    data: updatedData,
    recentActivity: [
      {
        type: "badge-earned",
        points: 50,
        // Bonus points for badge
        timestamp: /* @__PURE__ */ new Date()
      }
    ]
  };
  return createSuccessResponse3(response);
}
async function handleUpdateStreak(userId, storage) {
  let currentData = getDefaultGamificationData();
  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      currentData = storageToResponseFormat(stored);
    }
  }
  const now = /* @__PURE__ */ new Date();
  const lastActivity = currentData.streak.lastActivity;
  const daysSinceLastActivity = Math.floor(
    (now.getTime() - new Date(lastActivity).getTime()) / (1e3 * 60 * 60 * 24)
  );
  let newStreak;
  if (daysSinceLastActivity <= 1) {
    const newCurrent = daysSinceLastActivity === 1 ? currentData.streak.current + 1 : currentData.streak.current;
    newStreak = {
      current: newCurrent,
      longest: Math.max(currentData.streak.longest, newCurrent),
      lastActivity: now
    };
  } else {
    newStreak = {
      current: 1,
      longest: currentData.streak.longest,
      lastActivity: now
    };
  }
  const updatedData = {
    ...currentData,
    streak: newStreak
  };
  if (storage?.updateGamificationData) {
    await storage.updateGamificationData(userId, {
      currentStreak: newStreak.current,
      longestStreak: newStreak.longest,
      lastActivityDate: now
    });
  }
  const response = {
    data: updatedData,
    recentActivity: [
      {
        type: "streak-update",
        points: newStreak.current * 5,
        // Bonus points per streak day
        timestamp: now
      }
    ]
  };
  return createSuccessResponse3(response);
}

// src/handlers/profile.ts
function createSuccessResponse4(data, status = 200) {
  return {
    status,
    body: {
      success: true,
      data
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createErrorResponse4(status, code, message, details) {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function getDefaultProfile(userId, handlerContext) {
  return {
    id: userId,
    name: handlerContext?.user?.name ?? "User",
    role: handlerContext?.user?.role ?? "student",
    preferences: {
      learningStyle: "visual",
      tone: "friendly",
      difficulty: "medium"
    },
    progress: {
      coursesCompleted: 0,
      totalTimeSpent: 0,
      averageScore: 0
    }
  };
}
function storageToProfileFormat(userId, stored, handlerContext) {
  return {
    id: userId,
    name: handlerContext?.user?.name ?? "User",
    role: handlerContext?.user?.role ?? "student",
    preferences: {
      learningStyle: stored.learningStyle ?? "visual",
      tone: stored.preferredTone ?? "friendly",
      difficulty: "medium"
      // Not in LearningProfileData
    },
    progress: {
      coursesCompleted: 0,
      // Not in LearningProfileData
      totalTimeSpent: 0,
      // Not in LearningProfileData
      averageScore: 0
      // Not in LearningProfileData
    }
  };
}
function createProfileHandler(config) {
  const storage = config.storage;
  return async (request, handlerContext) => {
    const body = request.body;
    if (!body.userId) {
      return createErrorResponse4(400, "INVALID_REQUEST", "User ID is required");
    }
    try {
      switch (body.action) {
        case "get":
          return await handleGet2(body.userId, handlerContext, storage);
        case "update":
          return await handleUpdate2(
            body.userId,
            body.payload,
            handlerContext,
            storage
          );
        case "get-learning-style":
          return await handleGetLearningStyle(body.userId, storage);
        case "get-progress":
          return await handleGetProgress(body.userId, storage);
        default:
          return createErrorResponse4(
            400,
            "INVALID_ACTION",
            `Unknown action: ${body.action}`
          );
      }
    } catch (error) {
      console.error("[SAM Profile Handler] Error:", error);
      if (error instanceof Error) {
        return createErrorResponse4(
          500,
          "PROFILE_ERROR",
          process.env.NODE_ENV === "development" ? error.message : "An error occurred processing profile request"
        );
      }
      return createErrorResponse4(
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred"
      );
    }
  };
}
async function handleGet2(userId, handlerContext, storage) {
  let profile = getDefaultProfile(userId, handlerContext);
  let analytics;
  if (storage?.getLearningProfile) {
    const stored = await storage.getLearningProfile(userId);
    if (stored) {
      profile = storageToProfileFormat(userId, stored, handlerContext);
      analytics = {
        strongAreas: stored.strengths ?? [],
        weakAreas: stored.weaknesses ?? [],
        recommendations: generateLearningStyleRecommendations(
          stored.learningStyle ?? "visual"
        )
      };
    }
  }
  const response = {
    profile,
    analytics
  };
  return createSuccessResponse4(response);
}
async function handleUpdate2(userId, payload, handlerContext, storage) {
  let profile = getDefaultProfile(userId, handlerContext);
  if (storage?.getLearningProfile) {
    const stored = await storage.getLearningProfile(userId);
    if (stored) {
      profile = storageToProfileFormat(userId, stored, handlerContext);
    }
  }
  if (payload?.preferences) {
    profile.preferences = {
      ...profile.preferences,
      ...payload.preferences
    };
  }
  if (payload?.learningStyle) {
    profile.preferences.learningStyle = payload.learningStyle;
  }
  if (storage?.updateLearningProfile) {
    await storage.updateLearningProfile(userId, {
      learningStyle: profile.preferences.learningStyle,
      preferredTone: profile.preferences.tone
    });
  }
  const response = {
    profile
  };
  return createSuccessResponse4(response);
}
async function handleGetLearningStyle(userId, storage) {
  let learningStyle = "visual";
  let details = {};
  if (storage?.getLearningProfile) {
    const stored = await storage.getLearningProfile(userId);
    if (stored) {
      learningStyle = stored.learningStyle ?? "visual";
      details = {
        dominantStyle: stored.learningStyle ?? "visual",
        strongAreas: stored.strengths ?? [],
        weakAreas: stored.weaknesses ?? [],
        recommendations: generateLearningStyleRecommendations(learningStyle)
      };
    }
  }
  return createSuccessResponse4({
    learningStyle,
    details
  });
}
async function handleGetProgress(userId, storage) {
  const progress = {
    coursesCompleted: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    currentStreak: 0,
    totalPoints: 0
  };
  if (storage?.getGamificationData) {
    const gamification = await storage.getGamificationData(userId);
    if (gamification) {
      progress.currentStreak = gamification.currentStreak;
      progress.totalPoints = gamification.points;
    }
  }
  return createSuccessResponse4({
    progress,
    insights: generateProgressInsights(progress)
  });
}
function generateLearningStyleRecommendations(style) {
  const recommendations = {
    visual: [
      "Use diagrams and flowcharts to understand concepts",
      "Color-code your notes for better retention",
      "Watch video tutorials alongside reading materials"
    ],
    auditory: [
      "Listen to podcasts and audio explanations",
      "Read content aloud to improve retention",
      "Participate in group discussions"
    ],
    kinesthetic: [
      "Practice with hands-on exercises",
      "Take breaks to move around while studying",
      "Use interactive simulations when available"
    ],
    reading: [
      "Take detailed written notes",
      "Create summaries of key concepts",
      "Read multiple sources on the same topic"
    ]
  };
  return recommendations[style] ?? recommendations.visual ?? [];
}
function generateProgressInsights(progress) {
  const insights = [];
  if (progress.coursesCompleted > 0) {
    insights.push(
      `You have completed ${progress.coursesCompleted} course${progress.coursesCompleted > 1 ? "s" : ""}`
    );
  }
  if (progress.averageScore >= 80) {
    insights.push("Great job! Your average score is above 80%");
  } else if (progress.averageScore >= 60) {
    insights.push("Good progress! Consider reviewing challenging topics");
  }
  if (progress.currentStreak >= 7) {
    insights.push(`Amazing ${progress.currentStreak}-day learning streak!`);
  } else if (progress.currentStreak >= 3) {
    insights.push(`Nice ${progress.currentStreak}-day streak! Keep it going!`);
  }
  if (progress.totalTimeSpent > 3600) {
    const hours = Math.floor(progress.totalTimeSpent / 3600);
    insights.push(`You have invested ${hours} hour${hours > 1 ? "s" : ""} in learning`);
  }
  return insights;
}

// src/middleware/rateLimit.ts
function createMemoryStore() {
  const store = /* @__PURE__ */ new Map();
  return {
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.resetTime) {
        store.delete(key);
        return null;
      }
      return entry;
    },
    async set(key, entry, _ttlMs) {
      store.set(key, entry);
    },
    async increment(key) {
      const entry = store.get(key);
      if (!entry) return 1;
      entry.count += 1;
      store.set(key, entry);
      return entry.count;
    }
  };
}
function defaultKeyGenerator(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor ?? request.headers["x-real-ip"] ?? "unknown";
  return `rate_limit:${ip}`;
}
function createRateLimiter(config, store) {
  const rateStore = store ?? createMemoryStore();
  const keyGenerator = config.keyGenerator ?? defaultKeyGenerator;
  return {
    async check(request) {
      if (config.skip?.(request)) {
        return {
          remaining: config.maxRequests,
          limit: config.maxRequests,
          resetTime: new Date(Date.now() + config.windowMs),
          blocked: false
        };
      }
      const key = keyGenerator(request);
      const now = Date.now();
      const windowEnd = now + config.windowMs;
      let entry = await rateStore.get(key);
      if (!entry) {
        entry = {
          count: 1,
          resetTime: windowEnd
        };
        await rateStore.set(key, entry, config.windowMs);
        return {
          remaining: config.maxRequests - 1,
          limit: config.maxRequests,
          resetTime: new Date(windowEnd),
          blocked: false
        };
      }
      const newCount = await rateStore.increment(key);
      const blocked = newCount > config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - newCount);
      return {
        remaining,
        limit: config.maxRequests,
        resetTime: new Date(entry.resetTime),
        blocked
      };
    },
    async reset(key) {
      await rateStore.set(key, { count: 0, resetTime: 0 }, 0);
    }
  };
}
var rateLimitPresets = {
  /** Standard API rate limit: 100 requests per minute */
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1e3,
    message: "Too many requests. Please try again in a minute."
  },
  /** Strict rate limit: 10 requests per minute */
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1e3,
    message: "Rate limit exceeded. Please wait before trying again."
  },
  /** AI endpoints: 20 requests per minute */
  ai: {
    maxRequests: 20,
    windowMs: 60 * 1e3,
    message: "AI request limit reached. Please wait before sending more messages."
  },
  /** Lenient: 1000 requests per minute */
  lenient: {
    maxRequests: 1e3,
    windowMs: 60 * 1e3,
    message: "Request limit reached."
  }
};

// src/middleware/auth.ts
function createAuthErrorResponse(status, code, message) {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createAuthMiddleware(authenticate, options) {
  return (handler) => {
    return async (request, context) => {
      if (!authenticate) {
        return handler(request, context);
      }
      try {
        const user = await authenticate(request);
        if (!user) {
          if (options?.onUnauthorized) {
            return options.onUnauthorized();
          }
          return createAuthErrorResponse(
            401,
            "UNAUTHORIZED",
            "Authentication required"
          );
        }
        if (options?.requiredRoles && options.requiredRoles.length > 0) {
          const hasRole = options.requiredRoles.includes(user.role);
          if (!hasRole) {
            if (options?.onForbidden) {
              return options.onForbidden();
            }
            return createAuthErrorResponse(
              403,
              "FORBIDDEN",
              "Insufficient permissions"
            );
          }
        }
        const authenticatedContext = {
          ...context,
          user
        };
        return handler(request, authenticatedContext);
      } catch (error) {
        console.error("[SAM Auth] Authentication error:", error);
        return createAuthErrorResponse(
          401,
          "AUTH_ERROR",
          "Authentication failed"
        );
      }
    };
  };
}
function createTokenAuthenticator(validateToken) {
  return async (request) => {
    const authHeader = request.headers["authorization"];
    if (!authHeader) {
      return null;
    }
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!headerValue?.startsWith("Bearer ")) {
      return null;
    }
    const token = headerValue.slice(7);
    if (!token) {
      return null;
    }
    return validateToken(token);
  };
}
function composeAuthMiddleware(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}
function requireRoles(...roles) {
  return (handler) => {
    return async (request, context) => {
      if (!context.user) {
        return createAuthErrorResponse(
          401,
          "UNAUTHORIZED",
          "Authentication required"
        );
      }
      if (!roles.includes(context.user.role)) {
        return createAuthErrorResponse(
          403,
          "FORBIDDEN",
          `Required role: ${roles.join(" or ")}`
        );
      }
      return handler(request, context);
    };
  };
}

// src/middleware/validation.ts
import { z } from "zod";
function createValidationErrorResponse(message, details) {
  return {
    status: 400,
    body: {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message,
        details
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createValidationMiddleware(schema) {
  return (handler) => {
    return async (request, context) => {
      try {
        const result = schema.safeParse(request.body);
        if (!result.success) {
          const errors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message
          }));
          return createValidationErrorResponse("Validation failed", {
            errors
          });
        }
        const validatedRequest = {
          ...request,
          body: result.data
        };
        return handler(validatedRequest, context);
      } catch (error) {
        console.error("[SAM Validation] Error:", error);
        return createValidationErrorResponse("Invalid request format");
      }
    };
  };
}
function validateQuery(schema) {
  return (handler) => {
    return async (request, context) => {
      try {
        const result = schema.safeParse(request.query ?? {});
        if (!result.success) {
          const errors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message
          }));
          return createValidationErrorResponse("Invalid query parameters", {
            errors
          });
        }
        const validatedRequest = {
          ...request,
          query: result.data
        };
        return handler(validatedRequest, context);
      } catch (error) {
        console.error("[SAM Query Validation] Error:", error);
        return createValidationErrorResponse("Invalid query format");
      }
    };
  };
}
function composeValidation(...validators) {
  return (handler) => {
    return validators.reduceRight(
      (acc, validator) => validator(acc),
      handler
    );
  };
}
var chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(1e4, "Message too long"),
  context: z.record(z.unknown()).optional(),
  history: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.string().or(z.date()).optional()
    })
  ).optional(),
  stream: z.boolean().optional()
});
var analyzeRequestSchema = z.object({
  content: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  type: z.enum(["blooms", "content", "assessment", "full"]).optional(),
  options: z.object({
    includeRecommendations: z.boolean().optional(),
    targetBloomsLevel: z.string().optional()
  }).optional()
});
var gamificationRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.enum(["get", "update", "award-badge", "update-streak"]),
  payload: z.object({
    badgeId: z.string().optional(),
    points: z.number().optional(),
    activity: z.string().optional()
  }).optional()
});
var profileRequestSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.enum(["get", "update", "get-learning-style", "get-progress"]),
  payload: z.object({
    preferences: z.record(z.unknown()).optional(),
    learningStyle: z.string().optional()
  }).optional()
});

// src/utils/factory.ts
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createErrorResponse5(status, code, message, details) {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createSuccessResponse5(data, status = 200) {
  return {
    status,
    body: {
      success: true,
      data
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function createRouteHandlerFactory(options) {
  const {
    config,
    defaultRateLimit,
    authenticate,
    onError,
    onRequest,
    onResponse
  } = options;
  const rateLimiter = defaultRateLimit ? createRateLimiter(defaultRateLimit) : null;
  function createHandler(handler, handlerOptions) {
    return async (request) => {
      const requestId = generateRequestId();
      const timestamp = /* @__PURE__ */ new Date();
      let context = {
        config,
        requestId,
        timestamp
      };
      try {
        if (handlerOptions?.requireAuth || authenticate) {
          const user = authenticate ? await authenticate(request) : null;
          if (handlerOptions?.requireAuth && !user) {
            return createErrorResponse5(401, "UNAUTHORIZED", "Authentication required");
          }
          if (user) {
            context = { ...context, user };
          }
          if (handlerOptions?.requiredRoles && user) {
            if (!handlerOptions.requiredRoles.includes(user.role)) {
              return createErrorResponse5(403, "FORBIDDEN", "Insufficient permissions");
            }
          }
        }
        const rateLimitConfig = handlerOptions?.rateLimit ?? defaultRateLimit;
        if (rateLimitConfig && rateLimiter) {
          const rateLimitResult = await rateLimiter.check(request);
          if (rateLimitResult.blocked) {
            return createErrorResponse5(
              429,
              "RATE_LIMITED",
              rateLimitConfig.message ?? "Too many requests",
              {
                retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1e3)
              }
            );
          }
        }
        if (handlerOptions?.validateRequest) {
          const isValid = handlerOptions.validateRequest(request.body);
          if (!isValid) {
            return createErrorResponse5(400, "VALIDATION_ERROR", "Invalid request body");
          }
        }
        onRequest?.(request, context);
        const response = await handler(request, context);
        onResponse?.(response, context);
        return response;
      } catch (error) {
        if (onError) {
          return onError(error, request);
        }
        console.error(`[SAM API] Error in request ${requestId}:`, error);
        return createErrorResponse5(
          500,
          "INTERNAL_ERROR",
          "An unexpected error occurred",
          process.env.NODE_ENV === "development" ? { message: error.message } : void 0
        );
      }
    };
  }
  const handlers = {
    chat: createChatHandler(config),
    analyze: createAnalyzeHandler(config),
    gamification: createGamificationHandler(config),
    profile: createProfileHandler(config)
  };
  const middleware = {
    rateLimit: (rateLimitConfig) => {
      const limiter = createRateLimiter(rateLimitConfig);
      return (handler) => {
        return async (request, context) => {
          const result = await limiter.check(request);
          if (result.blocked) {
            return createErrorResponse5(
              429,
              "RATE_LIMITED",
              rateLimitConfig.message ?? "Too many requests"
            );
          }
          return handler(request, context);
        };
      };
    },
    auth: (authOptions) => {
      return createAuthMiddleware(authenticate, authOptions);
    },
    validate: (schema) => {
      return createValidationMiddleware(schema);
    }
  };
  return {
    createHandler,
    handlers,
    middleware
  };
}

// src/index.ts
var VERSION = "0.1.0";
export {
  VERSION,
  analyzeBloomsLevel,
  analyzeRequestSchema,
  chatRequestSchema,
  composeAuthMiddleware,
  composeValidation,
  createAnalyzeHandler,
  createAuthMiddleware,
  createChatHandler,
  createErrorResponse5 as createErrorResponse,
  createGamificationHandler,
  createProfileHandler,
  createRateLimiter,
  createRouteHandlerFactory,
  createStreamingChatHandler,
  createSuccessResponse5 as createSuccessResponse,
  createTokenAuthenticator,
  createValidationMiddleware,
  gamificationRequestSchema,
  generateRequestId,
  profileRequestSchema,
  rateLimitPresets,
  requireRoles,
  validateQuery
};
