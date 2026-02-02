-- Phase 1: Add pgvector extension and native vector columns
-- This migration adds native vector search capability alongside existing JSON embedding columns.
-- It is safe to run even if pgvector is not available (extension creation will be skipped).

-- Enable pgvector extension (requires superuser or rds_superuser on Railway)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add native vector columns to SAMVectorEmbedding
ALTER TABLE sam_vector_embeddings ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Add native vector column to SAMLongTermMemory
ALTER TABLE sam_long_term_memories ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Add native vector column to SAMKnowledgeNode
ALTER TABLE sam_knowledge_nodes ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Create IVFFlat indexes for approximate nearest neighbor search
-- IVFFlat provides good recall with fast search on medium-sized datasets
-- lists=100 is appropriate for up to ~1M vectors
CREATE INDEX IF NOT EXISTS idx_vec_embed_vector
  ON sam_vector_embeddings
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_ltm_embed_vector
  ON sam_long_term_memories
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_kn_embed_vector
  ON sam_knowledge_nodes
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);
