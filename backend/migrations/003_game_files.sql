-- ─────────────────────────────────────────────────────────────
-- Store uploaded game files in Cloudinary instead of on disk
--
-- Netlify Function instances have no durable local disk: files written under
-- backend/uploads/games would disappear whenever the instance stopped. The
-- API now uploads them to Cloudinary and keeps a manifest here so the launch
-- page knows the public ids and relative paths.
--
--   files       JSON array of { name, path, url, public_id, bytes, type, entry? }
--   entry_html  the uploaded index.html (if any), served with a <base> tag
--
-- Safe to run more than once.
-- ─────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS entry_html text;

COMMIT;
