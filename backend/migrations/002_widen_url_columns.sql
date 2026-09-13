-- ─────────────────────────────────────────────────────────────
-- Widen columns that hold user-supplied URLs
--
-- Uploading a thumbnail image with a game failed with:
--     value too long for type character varying(10)
-- The games.icon column was sized for an emoji, but the form sends a
-- Cloudinary URL when a picture is uploaded instead. Every such URL is far
-- longer than 10 characters, so the insert was rejected and the submission
-- failed after the image had already been uploaded to Cloudinary.
--
-- Rather than patch just that one column and wait to be bitten again by the
-- next one, this widens every character column that is too short to hold a
-- URL. Anything already text is left alone, and nothing is narrowed, so the
-- change is purely permissive and safe to re-run.
--
-- Run as the table owner:
--     psql "$DATABASE_URL" -f backend/migrations/002_widen_url_columns.sql
-- ─────────────────────────────────────────────────────────────

BEGIN;

DO $$
DECLARE
  r record;
  changed integer := 0;
BEGIN
  FOR r IN
    SELECT table_name, column_name, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND data_type IN ('character varying', 'character')
      AND character_maximum_length IS NOT NULL
      -- Anything shorter than this cannot hold a realistic media URL. The
      -- emoji-sized columns are 10 characters.
      AND character_maximum_length < 200
    ORDER BY table_name, column_name
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE text',
                   r.table_name, r.column_name);
    RAISE NOTICE 'widened %.% from varchar(%) to text',
      r.table_name, r.column_name, r.character_maximum_length;
    changed := changed + 1;
  END LOOP;

  IF changed = 0 THEN
    RAISE NOTICE 'nothing to widen: no short character columns remain';
  END IF;
END $$;

COMMIT;
