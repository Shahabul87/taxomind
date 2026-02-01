-- AlterTable: Add mode effectiveness feedback fields to SAMFeedback
-- All fields are optional (nullable) — safe for existing data per Golden Rules.

ALTER TABLE "sam_feedback" ADD COLUMN "modeId" TEXT;
ALTER TABLE "sam_feedback" ADD COLUMN "modeFeedback" TEXT;
ALTER TABLE "sam_feedback" ADD COLUMN "modeSuggestion" TEXT;

-- CreateIndex: Composite index for mode feedback analytics queries
CREATE INDEX "sam_feedback_modeId_modeFeedback_idx" ON "sam_feedback"("modeId", "modeFeedback");
