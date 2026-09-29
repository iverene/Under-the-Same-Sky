-- Under the Same Sky — wall migration (run once in Supabase SQL editor).
-- Sender signature column (lets the app retire its 42703 fallback path).
-- No pagination index: the wall holds hundreds of rows, which Postgres sorts
-- in under a millisecond without one. Revisit only if it ever grows past ~10k.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender TEXT;
