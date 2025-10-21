-- CreateIndex for optimized queries
CREATE INDEX IF NOT EXISTS "CodeExplanation_sectionId_position_idx" ON "CodeExplanation"("sectionId", "position");
CREATE INDEX IF NOT EXISTS "CodeExplanation_groupId_idx" ON "CodeExplanation"("groupId");

-- Add new columns with nullable initially
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "title" VARCHAR(200);
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "lineStart" INTEGER;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "lineEnd" INTEGER;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT true;

-- Migrate data: heading → title, order → position
UPDATE "CodeExplanation"
SET "title" = COALESCE("heading", 'Code Block')
WHERE "title" IS NULL;

UPDATE "CodeExplanation"
SET "position" = COALESCE("order", 0)
WHERE "position" IS NULL OR "position" = 0;

-- Make title and code required (NOT NULL)
ALTER TABLE "CodeExplanation" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "CodeExplanation" ALTER COLUMN "code" SET NOT NULL;

-- Make sectionId required (NOT NULL)
ALTER TABLE "CodeExplanation" ALTER COLUMN "sectionId" SET NOT NULL;

-- Update column types for better performance
ALTER TABLE "CodeExplanation" ALTER COLUMN "code" TYPE TEXT;
ALTER TABLE "CodeExplanation" ALTER COLUMN "explanation" TYPE TEXT;
ALTER TABLE "CodeExplanation" ALTER COLUMN "language" TYPE VARCHAR(50);

-- Drop old columns (heading and order)
ALTER TABLE "CodeExplanation" DROP COLUMN IF EXISTS "heading";
ALTER TABLE "CodeExplanation" DROP COLUMN IF EXISTS "order";
