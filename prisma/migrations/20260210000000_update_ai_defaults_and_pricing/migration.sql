-- Update AIGeneratedContent.model default to Claude Sonnet 4.5
ALTER TABLE "AIGeneratedContent"
  ALTER COLUMN "model" SET DEFAULT 'claude-sonnet-4-5-20250929';

-- Update UserAIPreferences.defaultModel default to Claude Sonnet 4.5
ALTER TABLE "UserAIPreferences"
  ALTER COLUMN "defaultModel" SET DEFAULT 'claude-sonnet-4-5-20250929';

-- Remove hardcoded @default("anthropic") from provider preference columns
-- (null now means "use platform default" instead of always defaulting to anthropic)
ALTER TABLE "UserAIPreferences"
  ALTER COLUMN "preferredChatProvider" DROP DEFAULT;
ALTER TABLE "UserAIPreferences"
  ALTER COLUMN "preferredCourseProvider" DROP DEFAULT;
ALTER TABLE "UserAIPreferences"
  ALTER COLUMN "preferredAnalysisProvider" DROP DEFAULT;
ALTER TABLE "UserAIPreferences"
  ALTER COLUMN "preferredCodeProvider" DROP DEFAULT;

-- Add missing nullable columns to UserAIPreferences
ALTER TABLE "UserAIPreferences"
  ADD COLUMN IF NOT EXISTS "preferredGlobalProvider" TEXT;
ALTER TABLE "UserAIPreferences"
  ADD COLUMN IF NOT EXISTS "preferredSkillRoadmapProvider" TEXT;

-- Add provider pricing columns to platform_ai_settings (per 1M tokens, USD)
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "anthropicInputPrice" DOUBLE PRECISION NOT NULL DEFAULT 3.0;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "anthropicOutputPrice" DOUBLE PRECISION NOT NULL DEFAULT 15.0;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "deepseekInputPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.14;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "deepseekOutputPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.28;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "openaiInputPrice" DOUBLE PRECISION NOT NULL DEFAULT 2.5;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "openaiOutputPrice" DOUBLE PRECISION NOT NULL DEFAULT 10.0;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "geminiInputPrice" DOUBLE PRECISION NOT NULL DEFAULT 1.25;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "geminiOutputPrice" DOUBLE PRECISION NOT NULL DEFAULT 5.0;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "mistralInputPrice" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
ALTER TABLE "platform_ai_settings"
  ADD COLUMN IF NOT EXISTS "mistralOutputPrice" DOUBLE PRECISION NOT NULL DEFAULT 6.0;
