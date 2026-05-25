-- Migration 003: Add ivfflat index on events.embedding for pgvector cosine similarity search
-- Creates an IVF Flat index for efficient approximate nearest-neighbor search.
-- operator: vector_cosine_ops, lists: 10 (suitable for ~50-500 rows; scale lists = sqrt(n) as data grows)
-- Idempotent: safe to run multiple times via IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS events_embedding_idx
  ON events
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
