-- Manual migration to add User Capability System for Google-style context management
-- Run this manually in your database if Prisma migration fails

-- Create UserCapability table
CREATE TABLE IF NOT EXISTS "UserCapability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "requirements" JSONB,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,

    CONSTRAINT "UserCapability_pkey" PRIMARY KEY ("id")
);

-- Create UserContext table
CREATE TABLE IF NOT EXISTS "UserContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeCapability" TEXT NOT NULL DEFAULT 'STUDENT',
    "lastSwitchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferences" JSONB,
    "sessionData" JSONB,

    CONSTRAINT "UserContext_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "UserCapability_userId_capability_key" ON "UserCapability"("userId", "capability");
CREATE INDEX IF NOT EXISTS "UserCapability_userId_idx" ON "UserCapability"("userId");
CREATE INDEX IF NOT EXISTS "UserCapability_capability_idx" ON "UserCapability"("capability");
CREATE INDEX IF NOT EXISTS "UserCapability_isActive_idx" ON "UserCapability"("isActive");
CREATE INDEX IF NOT EXISTS "UserCapability_expiresAt_idx" ON "UserCapability"("expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "UserContext_userId_key" ON "UserContext"("userId");
CREATE INDEX IF NOT EXISTS "UserContext_userId_idx" ON "UserContext"("userId");
CREATE INDEX IF NOT EXISTS "UserContext_activeCapability_idx" ON "UserContext"("activeCapability");

-- Add foreign key constraints
ALTER TABLE "UserCapability" ADD CONSTRAINT "UserCapability_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserContext" ADD CONSTRAINT "UserContext_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: Give all users with isTeacher=true the TEACHER capability
INSERT INTO "UserCapability" ("id", "userId", "capability", "grantedAt", "isActive")
SELECT 
    gen_random_uuid()::text,
    "id",
    'TEACHER',
    COALESCE("teacherActivatedAt", NOW()),
    true
FROM "User"
WHERE "isTeacher" = true
ON CONFLICT ("userId", "capability") DO NOTHING;

-- Migrate existing data: Give all users with isAffiliate=true the AFFILIATE capability
INSERT INTO "UserCapability" ("id", "userId", "capability", "grantedAt", "isActive")
SELECT 
    gen_random_uuid()::text,
    "id",
    'AFFILIATE',
    COALESCE("affiliateActivatedAt", NOW()),
    true
FROM "User"
WHERE "isAffiliate" = true
ON CONFLICT ("userId", "capability") DO NOTHING;

-- Give all users the STUDENT capability by default
INSERT INTO "UserCapability" ("id", "userId", "capability", "grantedAt", "isActive")
SELECT 
    gen_random_uuid()::text,
    "id",
    'STUDENT',
    NOW(),
    true
FROM "User"
ON CONFLICT ("userId", "capability") DO NOTHING;

-- Create default contexts for all users
INSERT INTO "UserContext" ("id", "userId", "activeCapability", "lastSwitchedAt")
SELECT 
    gen_random_uuid()::text,
    u."id",
    CASE 
        WHEN u."isTeacher" = true THEN 'TEACHER'
        WHEN u."isAffiliate" = true THEN 'AFFILIATE'
        ELSE 'STUDENT'
    END,
    NOW()
FROM "User" u
ON CONFLICT ("userId") DO NOTHING;

-- Verification query to check migration success
SELECT 
    'Migration completed successfully!' AS status,
    COUNT(DISTINCT uc."userId") AS users_with_capabilities,
    COUNT(CASE WHEN uc."capability" = 'STUDENT' THEN 1 END) AS student_capabilities,
    COUNT(CASE WHEN uc."capability" = 'TEACHER' THEN 1 END) AS teacher_capabilities,
    COUNT(CASE WHEN uc."capability" = 'AFFILIATE' THEN 1 END) AS affiliate_capabilities,
    COUNT(DISTINCT ctx."userId") AS users_with_context
FROM "UserCapability" uc
FULL OUTER JOIN "UserContext" ctx ON uc."userId" = ctx."userId";