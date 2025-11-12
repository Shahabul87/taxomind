-- Add missing bio and location fields to User table
-- These are optional fields, safe to add without data loss

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "location" TEXT;
