-- ============================================================================
-- RAILWAY QUICK FIX - Copy and run this in Railway PostgreSQL Query tab
-- ============================================================================
-- This fixes the failed migration blocking your deployments
-- SAFE: Only updates migration tracking, NO data loss
-- Time: < 1 second
-- ============================================================================

-- Fix the failed migration
UPDATE "_prisma_migrations"
SET rolled_back_at = NOW(),
    finished_at = NOW(),
    logs = 'Manually rolled back - migration files removed. Safe to proceed.'
WHERE migration_name IN ('enhance_code_explanation', 'simplify_math_explanation')
  AND finished_at IS NULL;

-- Verify it worked (should show "ROLLED BACK ✓")
SELECT
  migration_name,
  CASE
    WHEN rolled_back_at IS NOT NULL THEN 'ROLLED BACK ✓'
    WHEN finished_at IS NOT NULL THEN 'COMPLETED ✓'
    ELSE 'FAILED ✗'
  END as status,
  rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name LIKE '%enhance%' OR migration_name LIKE '%simplify%'
ORDER BY started_at DESC;

-- ============================================================================
-- NEXT STEP: Click "Redeploy" in Railway dashboard
-- ============================================================================
