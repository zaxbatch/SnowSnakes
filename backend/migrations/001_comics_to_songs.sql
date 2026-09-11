-- ─────────────────────────────────────────────────────────────
-- Songs replace Comics
--
-- The site is swapping its "comics" gallery for a "songs" gallery:
-- a user uploads an mp3 plus a cover image.
--
-- The old comics table is empty in production (0 rows, and no comments or
-- likes referenced it), so it is renamed in place rather than dropped: the
-- id sequence and primary key survive, and any id that ever pointed at a
-- comic stays reserved.
--
-- Lyrics/comic specific columns are removed; audio_url and cover_url are
-- added. Comments and likes are untouched — they already address songs by
-- (content_type, content_id), so only the rows that named 'comic' are
-- re-labelled.
--
-- Safe to run more than once. Run with:
--     psql "$DATABASE_URL" -f backend/migrations/001_comics_to_songs.sql
-- ─────────────────────────────────────────────────────────────

BEGIN;

-- 1. Rename the table + its primary key and foreign key (no-op if already done).
--    Each rename is guarded on the OLD name still existing, so a second run
--    is a clean no-op rather than an error.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'comics')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_name = 'songs') THEN
    ALTER TABLE public.comics RENAME TO songs;
  END IF;

  -- Rename each object only while its OLD name is still present and the new
  -- name is not, so a repeated run is a clean no-op. The index and constraint
  -- guards are namespace-aware for the same reason.
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'comics_pkey' AND n.nspname = 'public')
     AND NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                     WHERE c.relname = 'songs_pkey' AND n.nspname = 'public') THEN
    ALTER INDEX public.comics_pkey RENAME TO songs_pkey;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
             WHERE c.conname = 'comics_author_id_fkey' AND n.nspname = 'public') THEN
    ALTER TABLE public.songs RENAME CONSTRAINT comics_author_id_fkey TO songs_author_id_fkey;
  END IF;
END $$;

-- 2. Columns for a song: an audio file and a cover image.
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS cover_url text;

-- 3. Drop the columns that only made sense for comics.
--    Idempotent: each DROP is skipped when the column is already gone.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'songs' AND column_name = 'scene') THEN
    ALTER TABLE public.songs DROP COLUMN scene;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'songs' AND column_name = 'dialogue') THEN
    ALTER TABLE public.songs DROP COLUMN dialogue;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'songs' AND column_name = 'caption') THEN
    ALTER TABLE public.songs DROP COLUMN caption;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'songs' AND column_name = 'characters') THEN
    ALTER TABLE public.songs DROP COLUMN characters;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'songs' AND column_name = 'image_url') THEN
    -- Carries over as cover_url for any surviving row, then goes away.
    UPDATE public.songs SET cover_url = image_url WHERE cover_url IS NULL AND image_url IS NOT NULL;
    ALTER TABLE public.songs DROP COLUMN image_url;
  END IF;
END $$;

-- 4. Keep the counters and timestamp well defined.
UPDATE public.songs SET likes  = 0 WHERE likes  IS NULL;
UPDATE public.songs SET shares = 0 WHERE shares IS NULL;
UPDATE public.songs SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.songs ALTER COLUMN likes  SET DEFAULT 0;
ALTER TABLE public.songs ALTER COLUMN shares SET DEFAULT 0;
ALTER TABLE public.songs ALTER COLUMN created_at SET DEFAULT now();

-- 5. Re-label any comments/likes that were addressed to a comic.
UPDATE public.comments SET content_type = 'song' WHERE content_type = 'comic';
UPDATE public.likes    SET content_type = 'song' WHERE content_type = 'comic';

-- 6. Speeds up the list query (newest/oldest sorting) and search.
CREATE INDEX IF NOT EXISTS songs_created_at_idx ON public.songs (created_at DESC);
CREATE INDEX IF NOT EXISTS comments_content_idx  ON public.comments (content_type, content_id);
CREATE INDEX IF NOT EXISTS likes_content_idx     ON public.likes    (content_type, content_id);

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- To undo (only meaningful while songs is empty):
--   ALTER TABLE public.songs RENAME TO comics;
--   ALTER INDEX public.songs_pkey RENAME TO comics_pkey;
--   ALTER TABLE public.comics RENAME CONSTRAINT songs_author_id_fkey TO comics_author_id_fkey;
--   ALTER TABLE public.comics ADD COLUMN scene text, ADD COLUMN dialogue text,
--     ADD COLUMN caption text, ADD COLUMN characters text[], ADD COLUMN image_url text;
--   UPDATE public.comics SET image_url = cover_url;
--   ALTER TABLE public.comics DROP COLUMN audio_url, DROP COLUMN cover_url;
-- ─────────────────────────────────────────────────────────────
