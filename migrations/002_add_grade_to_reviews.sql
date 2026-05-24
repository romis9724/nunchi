-- Migration 002: Add grade column to reviews table
-- Adds F/D/C/B/A risk grade to the reviews table.
-- F = 절대회피, D = 강력재검토, C = 톤조정권장, B = 표준진행, A = 권장톤매칭

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS grade TEXT
    CHECK (grade IN ('F', 'D', 'C', 'B', 'A'));
