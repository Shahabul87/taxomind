-- Add UserCapability model for clean capability management
-- This migration adds support for Google-style capability management

-- Create UserCapability table
CREATE TABLE IF NOT EXISTS "UserCapability" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activatedAt" TIMESTAMP(3),
  "deactivatedAt" TIMESTAMP(3),
  "grantedBy" TEXT,
  "revokedBy" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserCapability_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for user-capability combination
CREATE UNIQUE INDEX "UserCapability_userId_capability_key" ON "UserCapability"("userId", "capability");

-- Create indexes for performance
CREATE INDEX "UserCapability_userId_idx" ON "UserCapability"("userId");
CREATE INDEX "UserCapability_capability_idx" ON "UserCapability"("capability");
CREATE INDEX "UserCapability_isActive_idx" ON "UserCapability"("isActive");

-- Add foreign key constraint
ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create UserContext table for storing user's active context
CREATE TABLE IF NOT EXISTS "UserContext" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "activeCapability" TEXT NOT NULL DEFAULT 'STUDENT',
  "lastSwitchedAt" TIMESTAMP(3),
  "contextHistory" JSONB,
  "preferences" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserContext_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "UserContext" ADD CONSTRAINT "UserContext_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX "UserContext_userId_idx" ON "UserContext"("userId");

-- Migrate existing data to UserCapability table
-- This preserves existing isTeacher and isAffiliate flags
INSERT INTO "UserCapability" ("id", "userId", "capability", "isActive", "activatedAt", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'STUDENT',
  true,
  "emailVerified",
  NOW(),
  NOW()
FROM "User"
WHERE NOT EXISTS (
  SELECT 1 FROM "UserCapability" 
  WHERE "UserCapability"."userId" = "User"."id" 
  AND "UserCapability"."capability" = 'STUDENT'
);

-- Add TEACHER capability for users with isTeacher = true
INSERT INTO "UserCapability" ("id", "userId", "capability", "isActive", "activatedAt", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'TEACHER',
  true,
  "teacherActivatedAt",
  NOW(),
  NOW()
FROM "User"
WHERE "isTeacher" = true
AND NOT EXISTS (
  SELECT 1 FROM "UserCapability" 
  WHERE "UserCapability"."userId" = "User"."id" 
  AND "UserCapability"."capability" = 'TEACHER'
);

-- Add AFFILIATE capability for users with isAffiliate = true
INSERT INTO "UserCapability" ("id", "userId", "capability", "isActive", "activatedAt", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'AFFILIATE',
  true,
  "affiliateActivatedAt",
  NOW(),
  NOW()
FROM "User"
WHERE "isAffiliate" = true
AND NOT EXISTS (
  SELECT 1 FROM "UserCapability" 
  WHERE "UserCapability"."userId" = "User"."id" 
  AND "UserCapability"."capability" = 'AFFILIATE'
);

-- Add comment for documentation
COMMENT ON TABLE "UserCapability" IS 'Stores user capabilities for Google-style context switching';
COMMENT ON COLUMN "UserCapability"."capability" IS 'User capability type: STUDENT, TEACHER, AFFILIATE, etc.';
COMMENT ON TABLE "UserContext" IS 'Stores user active context and preferences for dashboard switching';