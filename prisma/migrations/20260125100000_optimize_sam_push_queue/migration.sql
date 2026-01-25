-- Optimize SAMPushQueue for faster queries
-- Fix: Set expiresAt for any existing NULL values to far future
-- This allows simpler queries without OR NULL checks

-- Step 1: Update any NULL expiresAt to a far future date (1 year from now)
UPDATE "sam_push_queue"
SET "expiresAt" = NOW() + INTERVAL '1 year'
WHERE "expiresAt" IS NULL;

-- Step 2: Clean up old completed/failed/expired records (older than 7 days)
DELETE FROM "sam_push_queue"
WHERE "status" IN ('DELIVERED', 'FAILED', 'EXPIRED')
  AND "queuedAt" < NOW() - INTERVAL '7 days';

-- Step 3: Add optimized composite index for the main query pattern
-- Query: WHERE status = 'PENDING' AND expiresAt > now ORDER BY priority, queuedAt
CREATE INDEX IF NOT EXISTS "sam_push_queue_pending_lookup_idx"
ON "sam_push_queue" ("status", "expiresAt", "priority", "queuedAt")
WHERE "status" = 'PENDING';
