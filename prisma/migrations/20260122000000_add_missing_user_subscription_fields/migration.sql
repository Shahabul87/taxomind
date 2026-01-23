-- Add missing fields to User table for subscription and premium features
-- These fields were added to the Prisma schema but never migrated

-- Create PremiumPlan enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."PremiumPlan" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to User table
-- All new fields are optional or have defaults to prevent data loss

-- Website field
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "website" TEXT;

-- Premium subscription fields
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumPlan" "public"."PremiumPlan";
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumStartedAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumExpiresAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumStripeSubscriptionId" TEXT;

-- Subscription tier field (uses existing SubscriptionTier enum)
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "subscriptionTier" "public"."SubscriptionTier" NOT NULL DEFAULT 'FREE';

-- SAM AI usage tracking fields
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "dailyAiUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "dailyAiUsageResetAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "monthlyAiUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "monthlyAiUsageResetAt" TIMESTAMP(3);

-- Add unique constraint for premiumStripeSubscriptionId (only if column was just added)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'User_premiumStripeSubscriptionId_key'
    ) THEN
        CREATE UNIQUE INDEX "User_premiumStripeSubscriptionId_key" ON "public"."User"("premiumStripeSubscriptionId");
    END IF;
END $$;
