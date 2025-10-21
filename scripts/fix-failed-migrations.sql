-- Railway Migration Fix Script
-- Run this ONCE in Railway PostgreSQL to mark failed migrations as rolled back
-- This allows the next deployment to succeed

-- Mark the failed migrations as rolled back
UPDATE "_prisma_migrations"
SET rolled_back_at = NOW(),
    finished_at = NOW()
WHERE migration_name IN ('enhance_code_explanation', 'simplify_math_explanation')
  AND finished_at IS NULL;

-- Verify the update
SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count
FROM "_prisma_migrations"
WHERE migration_name IN ('enhance_code_explanation', 'simplify_math_explanation');
