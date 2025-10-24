-- ============================================================================
-- Fix Failed Migration in Railway Production Database
-- ============================================================================
-- Purpose: Resolve P3009 error blocking deployments
-- Error: "The `enhance_code_explanation` migration started at 2025-10-21 05:27:34.649298 UTC failed"
--
-- SAFE TO RUN: This script only marks failed migrations as rolled back
-- NO DATA LOSS: Does not modify any user data
-- ============================================================================

-- Step 1: Check current migration status
SELECT
  migration_name,
  started_at,
  finished_at,
  rolled_back_at,
  applied_steps_count,
  logs
FROM "_prisma_migrations"
WHERE migration_name LIKE '%enhance%'
   OR migration_name LIKE '%simplify%'
ORDER BY started_at DESC;

-- Step 2: Mark failed migrations as rolled back
-- This is safe because the migration files have been removed from the codebase
UPDATE "_prisma_migrations"
SET
  rolled_back_at = NOW(),
  finished_at = NOW(),
  logs = COALESCE(logs, '') || E'\n\n[MANUAL ROLLBACK - Oct 23, 2025]
Reason: Migration failed in production and files removed from codebase
Action: Marked as rolled back to unblock deployments
Impact: None - migration was incomplete and never fully applied
Status: Safe to proceed with new deployments'
WHERE migration_name IN (
  'enhance_code_explanation',
  'simplify_math_explanation'
)
AND finished_at IS NULL;  -- Only update incomplete migrations

-- Step 3: Verify the fix
SELECT
  migration_name,
  started_at,
  finished_at,
  rolled_back_at,
  CASE
    WHEN rolled_back_at IS NOT NULL THEN 'ROLLED BACK ✓'
    WHEN finished_at IS NOT NULL THEN 'COMPLETED ✓'
    ELSE 'FAILED ✗'
  END as status
FROM "_prisma_migrations"
WHERE migration_name LIKE '%enhance%'
   OR migration_name LIKE '%simplify%'
ORDER BY started_at DESC;

-- Step 4: Check all migrations are healthy
SELECT
  COUNT(*) as total_migrations,
  COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) as completed,
  COUNT(*) FILTER (WHERE rolled_back_at IS NOT NULL) as rolled_back,
  COUNT(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL) as failed
FROM "_prisma_migrations";

-- ============================================================================
-- Expected Output After Running This Script:
-- ============================================================================
-- Step 3 should show:
--   migration_name              | status
--   ----------------------------+---------------
--   enhance_code_explanation    | ROLLED BACK ✓
--   simplify_math_explanation   | ROLLED BACK ✓
--
-- Step 4 should show:
--   total_migrations | completed | rolled_back | failed
--   -----------------+-----------+-------------+-------
--   X                | Y         | 2           | 0
--
-- If failed = 0, Railway deployments will work!
-- ============================================================================

-- ============================================================================
-- HOW TO RUN THIS SCRIPT ON RAILWAY:
-- ============================================================================
--
-- Method 1: Railway Dashboard (Easiest)
-- 1. Go to Railway dashboard
-- 2. Select your PostgreSQL service
-- 3. Click "Data" or "Query" tab
-- 4. Copy and paste this entire file
-- 5. Click "Run" or "Execute"
--
-- Method 2: Railway CLI
-- railway connect postgres
-- Then copy/paste this script
--
-- Method 3: Direct Connection
-- psql $DATABASE_URL < scripts/fix-failed-migration-production.sql
--
-- ============================================================================
