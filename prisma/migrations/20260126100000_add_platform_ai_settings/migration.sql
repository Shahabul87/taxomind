-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_ai_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultProvider" TEXT NOT NULL DEFAULT 'deepseek',
    "fallbackProvider" TEXT DEFAULT 'anthropic',
    "anthropicEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deepseekEnabled" BOOLEAN NOT NULL DEFAULT true,
    "openaiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "geminiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mistralEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeMonthlyLimit" INTEGER NOT NULL DEFAULT 50,
    "starterMonthlyLimit" INTEGER NOT NULL DEFAULT 500,
    "proMonthlyLimit" INTEGER NOT NULL DEFAULT 2000,
    "enterpriseMonthlyLimit" INTEGER NOT NULL DEFAULT 10000,
    "freeDailyChatLimit" INTEGER NOT NULL DEFAULT 10,
    "starterDailyChatLimit" INTEGER NOT NULL DEFAULT 100,
    "proDailyChatLimit" INTEGER NOT NULL DEFAULT 1000,
    "enterpriseDailyChatLimit" INTEGER NOT NULL DEFAULT 10000,
    "monthlyBudget" DOUBLE PRECISION,
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "costAlertEmail" TEXT,
    "allowUserProviderSelection" BOOLEAN NOT NULL DEFAULT true,
    "allowUserModelSelection" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalForCourses" BOOLEAN NOT NULL DEFAULT false,
    "defaultAnthropicModel" TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
    "defaultDeepseekModel" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "defaultOpenaiModel" TEXT NOT NULL DEFAULT 'gpt-4o',
    "defaultGeminiModel" TEXT NOT NULL DEFAULT 'gemini-pro',
    "defaultMistralModel" TEXT NOT NULL DEFAULT 'mistral-large',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "lastUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_ai_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default row if not exists
INSERT INTO "platform_ai_settings" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
