-- pgvector Memory System Migration
-- This migration adds vector-enabled memory tables for SAM
-- Compatible with standard PostgreSQL (stores embeddings as JSONB)
-- Can be upgraded to native pgvector when available

-- ==========================================
-- ENABLE PGVECTOR EXTENSION (if available)
-- ==========================================

-- Try to enable pgvector extension (will silently fail if not available)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension not available, using JSONB for embeddings';
END $$;

-- ==========================================
-- CREATE NEW ENUMS FOR MEMORY SYSTEM
-- ==========================================

-- CreateEnum: SAM Memory Type
DO $$ BEGIN
    CREATE TYPE "SAMMemoryType" AS ENUM ('INTERACTION', 'LEARNING_EVENT', 'STRUGGLE_POINT', 'PREFERENCE', 'FEEDBACK', 'CONTEXT', 'CONCEPT', 'SKILL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Memory Importance
DO $$ BEGIN
    CREATE TYPE "SAMMemoryImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Message Role
DO $$ BEGIN
    CREATE TYPE "SAMMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- CREATE SAM VECTOR EMBEDDINGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS "sam_vector_embeddings" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "contentHash" TEXT NOT NULL,
    "contentText" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" TEXT,
    "customMetadata" JSONB,
    "embedding" JSONB,
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_vector_embeddings_pkey" PRIMARY KEY ("id")
);

-- ==========================================
-- CREATE SAM LONG-TERM MEMORY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS "sam_long_term_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SAMMemoryType" NOT NULL DEFAULT 'INTERACTION',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "topicIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importance" "SAMMemoryImportance" NOT NULL DEFAULT 'MEDIUM',
    "emotionalValence" DOUBLE PRECISION,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "decayFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isConsolidated" BOOLEAN NOT NULL DEFAULT false,
    "consolidatedAt" TIMESTAMP(3),
    "embedding" JSONB,
    "embeddingModel" TEXT DEFAULT 'text-embedding-ada-002',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "sam_long_term_memories_pkey" PRIMARY KEY ("id")
);

-- ==========================================
-- CREATE SAM CONVERSATION MEMORY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS "sam_conversation_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "SAMMessageRole" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "embedding" JSONB,
    "entities" JSONB,
    "intent" TEXT,
    "sentiment" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_conversation_memories_pkey" PRIMARY KEY ("id")
);

-- ==========================================
-- CREATE STANDARD INDEXES
-- ==========================================

-- SAM Vector Embeddings indexes
CREATE INDEX IF NOT EXISTS "sam_vector_embeddings_userId_sourceType_idx" ON "sam_vector_embeddings"("userId", "sourceType");
CREATE INDEX IF NOT EXISTS "sam_vector_embeddings_courseId_idx" ON "sam_vector_embeddings"("courseId");
CREATE INDEX IF NOT EXISTS "sam_vector_embeddings_contentHash_idx" ON "sam_vector_embeddings"("contentHash");

-- SAM Long-Term Memory indexes
CREATE INDEX IF NOT EXISTS "sam_long_term_memories_userId_type_idx" ON "sam_long_term_memories"("userId", "type");
CREATE INDEX IF NOT EXISTS "sam_long_term_memories_userId_importance_idx" ON "sam_long_term_memories"("userId", "importance");
CREATE INDEX IF NOT EXISTS "sam_long_term_memories_courseId_idx" ON "sam_long_term_memories"("courseId");
CREATE INDEX IF NOT EXISTS "sam_long_term_memories_createdAt_idx" ON "sam_long_term_memories"("createdAt");

-- SAM Conversation Memory indexes
CREATE INDEX IF NOT EXISTS "sam_conversation_memories_userId_sessionId_idx" ON "sam_conversation_memories"("userId", "sessionId");
CREATE INDEX IF NOT EXISTS "sam_conversation_memories_sessionId_turnNumber_idx" ON "sam_conversation_memories"("sessionId", "turnNumber");
CREATE INDEX IF NOT EXISTS "sam_conversation_memories_createdAt_idx" ON "sam_conversation_memories"("createdAt");

-- ==========================================
-- ADD FOREIGN KEYS
-- ==========================================

-- SAM Vector Embeddings foreign keys
DO $$ BEGIN
    ALTER TABLE "sam_vector_embeddings" ADD CONSTRAINT "sam_vector_embeddings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_vector_embeddings" ADD CONSTRAINT "sam_vector_embeddings_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_vector_embeddings" ADD CONSTRAINT "sam_vector_embeddings_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_vector_embeddings" ADD CONSTRAINT "sam_vector_embeddings_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SAM Long-Term Memory foreign keys
DO $$ BEGIN
    ALTER TABLE "sam_long_term_memories" ADD CONSTRAINT "sam_long_term_memories_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_long_term_memories" ADD CONSTRAINT "sam_long_term_memories_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SAM Conversation Memory foreign keys
DO $$ BEGIN
    ALTER TABLE "sam_conversation_memories" ADD CONSTRAINT "sam_conversation_memories_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- VECTOR INDEX CREATION (pgvector only)
-- ==========================================

-- These indexes will only be created if pgvector extension is available
-- They enable fast approximate nearest neighbor search

DO $$
BEGIN
    -- Check if pgvector is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        -- Add vector columns (requires altering tables)
        EXECUTE 'ALTER TABLE "sam_vector_embeddings" ADD COLUMN IF NOT EXISTS "embedding_vector" vector(1536)';
        EXECUTE 'ALTER TABLE "sam_long_term_memories" ADD COLUMN IF NOT EXISTS "embedding_vector" vector(1536)';
        EXECUTE 'ALTER TABLE "sam_conversation_memories" ADD COLUMN IF NOT EXISTS "embedding_vector" vector(1536)';

        -- Create HNSW indexes for fast similarity search
        EXECUTE 'CREATE INDEX IF NOT EXISTS "sam_vector_embeddings_embedding_vector_idx" ON "sam_vector_embeddings" USING hnsw (embedding_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS "sam_long_term_memories_embedding_vector_idx" ON "sam_long_term_memories" USING hnsw (embedding_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS "sam_conversation_memories_embedding_vector_idx" ON "sam_conversation_memories" USING hnsw (embedding_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64)';

        RAISE NOTICE 'pgvector indexes created successfully';
    ELSE
        RAISE NOTICE 'pgvector not available - using JSONB for embeddings (in-memory similarity search)';
    END IF;
END $$;
