/**
 * Shared test helpers for Phase 1 and Phase 2 AI test files.
 *
 * Provides mock factories for sessions, platform settings, usage metrics,
 * and user AI preferences used across multiple test suites.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MOCK_USER_ID = 'user-test-001';
export const MOCK_ADMIN_ID = 'admin-test-001';

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export function createMockAdminSession() {
  return {
    user: {
      id: MOCK_ADMIN_ID,
      role: 'ADMIN' as const,
      email: 'admin@taxomind.com',
      name: 'Test Admin',
    },
  };
}

export function createMockUserSession(tier = 'FREE') {
  return {
    user: {
      id: MOCK_USER_ID,
      name: 'Test User',
      email: 'user@taxomind.com',
      role: 'USER' as const,
      subscriptionTier: tier,
    },
  };
}

// ---------------------------------------------------------------------------
// Platform settings helpers
// ---------------------------------------------------------------------------

export function createMockPlatformSettings(
  overrides: Record<string, unknown> = {},
) {
  return {
    defaultProvider: null,
    fallbackProvider: null,
    anthropicEnabled: true,
    deepseekEnabled: true,
    openaiEnabled: true,
    geminiEnabled: false,
    mistralEnabled: false,
    defaultAnthropicModel: 'claude-sonnet-4-5-20250929',
    defaultDeepseekModel: 'deepseek-chat',
    defaultOpenaiModel: 'gpt-4o',
    defaultGeminiModel: 'gemini-pro',
    defaultMistralModel: 'mistral-large',
    allowUserProviderSelection: true,
    allowUserModelSelection: true,
    freeMonthlyLimit: 50,
    starterMonthlyLimit: 500,
    proMonthlyLimit: 2000,
    enterpriseMonthlyLimit: 10000,
    freeDailyChatLimit: 10,
    starterDailyChatLimit: 100,
    proDailyChatLimit: 1000,
    enterpriseDailyChatLimit: 10000,
    monthlyBudget: null,
    alertThreshold: 0.8,
    costAlertEmail: null,
    requireApprovalForCourses: false,
    anthropicInputPrice: 3.0,
    anthropicOutputPrice: 15.0,
    deepseekInputPrice: 0.14,
    deepseekOutputPrice: 0.28,
    openaiInputPrice: 2.5,
    openaiOutputPrice: 10.0,
    geminiInputPrice: 1.25,
    geminiOutputPrice: 5.0,
    mistralInputPrice: 2.0,
    mistralOutputPrice: 6.0,
    maintenanceMode: false,
    maintenanceMessage: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Usage metrics helper
// ---------------------------------------------------------------------------

export function createMockUsageMetrics(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'metric-001',
    userId: MOCK_USER_ID,
    date: new Date(),
    period: 'DAILY',
    totalGenerations: 5,
    totalTokens: 1200,
    totalCost: 0.05,
    courseGenerations: 1,
    chapterGenerations: 1,
    lessonGenerations: 1,
    examGenerations: 1,
    exerciseGenerations: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// User AI preferences helper
// ---------------------------------------------------------------------------

export function createMockAIPreferences(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'pref-001',
    userId: MOCK_USER_ID,
    preferredProvider: 'deepseek',
    preferredModel: 'deepseek-chat',
    chatProvider: null,
    chatModel: null,
    courseProvider: null,
    courseModel: null,
    analysisProvider: null,
    analysisModel: null,
    codeProvider: null,
    codeModel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock user record helpers (matching Prisma select shapes)
// ---------------------------------------------------------------------------

export function createMockUserRecord(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: MOCK_USER_ID,
    hasAIAccess: false,
    subscriptionTier: 'FREE' as const,
    dailyAiUsageCount: 0,
    dailyAiUsageResetAt: new Date(),
    monthlyAiUsageCount: 0,
    monthlyAiUsageResetAt: new Date(),
    isPremium: false,
    premiumExpiresAt: null,
    ...overrides,
  };
}
