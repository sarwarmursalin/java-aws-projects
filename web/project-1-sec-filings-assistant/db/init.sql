CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE filing_chunks (
  id SERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  company TEXT NOT NULL,
  form_type TEXT NOT NULL,
  filed_date DATE NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1024) NOT NULL
);

CREATE INDEX filing_chunks_embedding_idx
  ON filing_chunks
  USING hnsw (embedding vector_cosine_ops);
