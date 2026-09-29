-- Under the Same Sky — wall query migration (run once in Supabase SQL editor).
-- 1. Sender signature column (lets the app retire its 42703 fallback path).
-- 2. Cursor pagination index: supports ORDER BY created_at + (created_at, id)
--    delta polls with an index-only scan via the INCLUDE covering columns.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_created_id
  ON messages (created_at ASC, id ASC)
  INCLUDE (type, position_x, position_y, position_z);

-- Verify with:
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT id, recipient, sender, content, type, position_x, position_y, position_z, created_at
--   FROM messages ORDER BY created_at ASC, id ASC LIMIT 200;
-- Expect: Index Scan using idx_messages_created_id + Limit.
