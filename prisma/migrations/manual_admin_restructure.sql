-- Manual Migration: Admin Account Restructure
-- This script migrates data from User-based admin to AdminAccount-based admin

BEGIN;

-- Step 1: Create AdminRole enum if not exists
DO $$ BEGIN
    CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create new AdminAccount table structure
CREATE TABLE IF NOT EXISTS "AdminAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
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
    "recoveryCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "AdminAccount_email_key" ON "AdminAccount"("email");
CREATE INDEX IF NOT EXISTS "AdminAccount_email_idx" ON "AdminAccount"("email");
CREATE INDEX IF NOT EXISTS "AdminAccount_role_idx" ON "AdminAccount"("role");

-- Step 4: Migrate existing admin users to AdminAccount
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
    CASE
        WHEN u."role" = 'ADMIN' THEN 'SUPERADMIN'::\"AdminRole\"
        ELSE 'ADMIN'::\"AdminRole\"
    END,
    u."emailVerified",
    u."image",
    u."phone",
    u."bio",
    u."isTwoFactorEnabled",
    u."totpEnabled",
    u."totpVerified",
    u."totpSecret",
    u."recoveryCodes",
    u."createdAt",
    u."updatedAt"
FROM "User" u
WHERE u."role" = 'ADMIN'
ON CONFLICT ("id") DO NOTHING;

-- Step 5: Update AdminAuditLog to use adminId
-- First, add the new column
ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS "adminId" TEXT;

-- Copy data from userId to adminId
UPDATE "AdminAuditLog" SET "adminId" = "userId" WHERE "adminId" IS NULL;

-- Make adminId required
ALTER TABLE "AdminAuditLog" ALTER COLUMN "adminId" SET NOT NULL;

-- Drop old constraint and create new one
ALTER TABLE "AdminAuditLog" DROP CONSTRAINT IF EXISTS "AdminAuditLog_userId_fkey";
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS "AdminAuditLog_userId_timestamp_idx";
CREATE INDEX IF NOT EXISTS "AdminAuditLog_adminId_timestamp_idx" ON "AdminAuditLog"("adminId", "timestamp");

-- Step 6: Update AdminSessionMetrics to use adminId
-- First, add the new column
ALTER TABLE "AdminSessionMetrics" ADD COLUMN IF NOT EXISTS "adminId" TEXT;

-- Copy data from userId to adminId
UPDATE "AdminSessionMetrics" SET "adminId" = "userId" WHERE "adminId" IS NULL;

-- Make adminId required
ALTER TABLE "AdminSessionMetrics" ALTER COLUMN "adminId" SET NOT NULL;

-- Drop old constraint and create new one
ALTER TABLE "AdminSessionMetrics" DROP CONSTRAINT IF EXISTS "AdminSessionMetrics_userId_fkey";
ALTER TABLE "AdminSessionMetrics" ADD CONSTRAINT "AdminSessionMetrics_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS "AdminSessionMetrics_userId_loginTime_idx";
CREATE INDEX IF NOT EXISTS "AdminSessionMetrics_adminId_loginTime_idx" ON "AdminSessionMetrics"("adminId", "loginTime");

-- Step 7: Update AdminMetadata to use adminId
-- First, add the new column
ALTER TABLE "AdminMetadata" ADD COLUMN IF NOT EXISTS "adminId" TEXT;

-- Copy data from userId to adminId
UPDATE "AdminMetadata" SET "adminId" = "userId" WHERE "adminId" IS NULL AND "userId" IS NOT NULL;

-- Drop old constraint and create new one
ALTER TABLE "AdminMetadata" DROP CONSTRAINT IF EXISTS "AdminMetadata_userId_fkey";
ALTER TABLE "AdminMetadata" DROP CONSTRAINT IF EXISTS "AdminMetadata_userId_key";

-- Make adminId unique and required if there's data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "AdminMetadata" LIMIT 1) THEN
        ALTER TABLE "AdminMetadata" ALTER COLUMN "adminId" SET NOT NULL;
        ALTER TABLE "AdminMetadata" ADD CONSTRAINT "AdminMetadata_adminId_key" UNIQUE ("adminId");
    END IF;
END $$;

ALTER TABLE "AdminMetadata" ADD CONSTRAINT "AdminMetadata_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS "AdminMetadata_userId_idx";
CREATE INDEX IF NOT EXISTS "AdminMetadata_adminId_idx" ON "AdminMetadata"("adminId");

-- Step 8: Update AdminActiveSession to use adminId
ALTER TABLE "AdminActiveSession" DROP CONSTRAINT IF EXISTS "AdminActiveSession_adminId_fkey";
ALTER TABLE "AdminActiveSession" ADD CONSTRAINT "AdminActiveSession_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Update AdminTwoFactorConfirmation to use adminId
ALTER TABLE "AdminTwoFactorConfirmation" DROP CONSTRAINT IF EXISTS "AdminTwoFactorConfirmation_adminId_fkey";
ALTER TABLE "AdminTwoFactorConfirmation" ADD CONSTRAINT "AdminTwoFactorConfirmation_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- Verification queries (run these separately to check)
-- SELECT COUNT(*) as admin_accounts FROM "AdminAccount";
-- SELECT COUNT(*) as audit_logs FROM "AdminAuditLog" WHERE "adminId" IS NOT NULL;
-- SELECT COUNT(*) as session_metrics FROM "AdminSessionMetrics" WHERE "adminId" IS NOT NULL;
