-- Safe Admin Account Migration - NO DATA LOSS
-- Migrates admin users from User table to AdminAccount table

BEGIN;

-- Step 1: Create AdminRole enum
DO $$ BEGIN
    CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Create AdminAccount table
CREATE TABLE IF NOT EXISTS "AdminAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "bio" TEXT,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpEnabled" BOOLEAN DEFAULT false,
    "totpVerified" BOOLEAN DEFAULT false,
    "totpSecret" TEXT,
    "recoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "AdminAccount_email_key" ON "AdminAccount"("email");
CREATE INDEX IF NOT EXISTS "AdminAccount_email_idx" ON "AdminAccount"("email");
CREATE INDEX IF NOT EXISTS "AdminAccount_role_idx" ON "AdminAccount"("role");

-- Step 3: Migrate admin users from User to AdminAccount
INSERT INTO "AdminAccount" (
    "id", "email", "password", "name", "role", "emailVerified", "image",
    "phone", "bio", "isTwoFactorEnabled", "totpEnabled", "totpVerified",
    "totpSecret", "recoveryCodes", "createdAt", "updatedAt"
)
SELECT
    u."id",
    u."email",
    u."password",
    u."name",
    -- Set first admin as SUPERADMIN, rest as ADMIN
    CASE
        WHEN u."id" = 'admin002' THEN 'SUPERADMIN'::"AdminRole"
        ELSE 'ADMIN'::"AdminRole"
    END as role,
    u."emailVerified",
    u."image",
    u."phone",
    u."bio",
    COALESCE(u."isTwoFactorEnabled", false),
    COALESCE(u."totpEnabled", false),
    COALESCE(u."totpVerified", false),
    u."totpSecret",
    COALESCE(u."recoveryCodes", ARRAY[]::TEXT[]),
    u."createdAt",
    u."updatedAt"
FROM "User" u
WHERE u."role" = 'ADMIN'
ON CONFLICT ("id") DO NOTHING;

-- Step 4: Add adminId column to AdminAuditLog
ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS "adminId" TEXT;

-- Copy userId to adminId for existing records
UPDATE "AdminAuditLog"
SET "adminId" = "userId"
WHERE "adminId" IS NULL AND "userId" IS NOT NULL;

-- Step 5: Add adminId column to AdminSessionMetrics
ALTER TABLE "AdminSessionMetrics" ADD COLUMN IF NOT EXISTS "adminId" TEXT;

-- Copy userId to adminId for existing records
UPDATE "AdminSessionMetrics"
SET "adminId" = "userId"
WHERE "adminId" IS NULL AND "userId" IS NOT NULL;

-- Step 6: Add adminId column to AdminMetadata
ALTER TABLE "AdminMetadata" ADD COLUMN IF NOT EXISTS "adminId" TEXT;

-- Copy userId to adminId for existing records
UPDATE "AdminMetadata"
SET "adminId" = "userId"
WHERE "adminId" IS NULL AND "userId" IS NOT NULL;

-- Step 7: Create foreign key constraints (will be enforced after we drop userId)
-- We'll add these constraints in the next migration after verifying data

COMMIT;

-- Verification
SELECT 'AdminAccount created:' as status, COUNT(*) as count FROM "AdminAccount";
SELECT 'AdminAuditLog migrated:' as status, COUNT(*) as count FROM "AdminAuditLog" WHERE "adminId" IS NOT NULL;
SELECT 'AdminSessionMetrics migrated:' as status, COUNT(*) as count FROM "AdminSessionMetrics" WHERE "adminId" IS NOT NULL;
