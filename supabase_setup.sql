-- ============================================================================
-- Today Rate — Majestic Jewellers (Since 1970)
-- Supabase Database & Storage Setup Script
-- Run this entire script in your Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table: ornament_gallery
-- Stores uploaded jewelry/ornament photos and their cached AI studio-staged URL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ornament_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  staged_url TEXT,
  staged_theme_id TEXT,
  category TEXT NOT NULL DEFAULT 'Necklace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe idempotent migration for existing databases
ALTER TABLE public.ornament_gallery
  ADD COLUMN IF NOT EXISTS staged_url TEXT;

ALTER TABLE public.ornament_gallery
  ADD COLUMN IF NOT EXISTS staged_theme_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ornament_gallery_created_at
  ON public.ornament_gallery (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ornament_gallery_category
  ON public.ornament_gallery (category);

-- ----------------------------------------------------------------------------
-- 2. Table: daily_rates
-- Stores daily extracted and published gold rate history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_date TEXT NOT NULL,
  rate_22k_1g NUMERIC NOT NULL,
  rate_22k_8g NUMERIC NOT NULL,
  rate_18k_1g NUMERIC NOT NULL,
  rate_9k_1g NUMERIC NOT NULL,
  change_1g NUMERIC NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'UNCHANGED' CHECK (trend IN ('UP', 'DOWN', 'UNCHANGED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_rates_created_at
  ON public.daily_rates (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_rates_rate_date
  ON public.daily_rates (rate_date);

-- ----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Policies for Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.ornament_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ornament_gallery" ON public.ornament_gallery;
CREATE POLICY "Allow public read ornament_gallery"
  ON public.ornament_gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert ornament_gallery" ON public.ornament_gallery;
CREATE POLICY "Allow public insert ornament_gallery"
  ON public.ornament_gallery FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update ornament_gallery" ON public.ornament_gallery;
CREATE POLICY "Allow public update ornament_gallery"
  ON public.ornament_gallery FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete ornament_gallery" ON public.ornament_gallery;
CREATE POLICY "Allow public delete ornament_gallery"
  ON public.ornament_gallery FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read daily_rates" ON public.daily_rates;
CREATE POLICY "Allow public read daily_rates"
  ON public.daily_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert daily_rates" ON public.daily_rates;
CREATE POLICY "Allow public insert daily_rates"
  ON public.daily_rates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update daily_rates" ON public.daily_rates;
CREATE POLICY "Allow public update daily_rates"
  ON public.daily_rates FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete daily_rates" ON public.daily_rates;
CREATE POLICY "Allow public delete daily_rates"
  ON public.daily_rates FOR DELETE USING (true);

-- ----------------------------------------------------------------------------
-- 4. Storage Bucket: ornaments (Public)
-- Folder layout:
--   - gallery/<file>         -> Original uploaded jewelry photographs
--   - staged/<file>          -> Cached Gemini AI Studio-staged product photos
--   - brand/majestic-logo.*  -> Permanent Majestic Jewellers PNG logo
--   - audio/jingle.*         -> Optional background MP3 audio jingle for videos
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ornaments',
  'ornaments',
  true,
  26214400,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read ornaments bucket" ON storage.objects;
CREATE POLICY "Public read ornaments bucket"
  ON storage.objects FOR SELECT USING (bucket_id = 'ornaments');

DROP POLICY IF EXISTS "Public upload ornaments bucket" ON storage.objects;
CREATE POLICY "Public upload ornaments bucket"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ornaments');

DROP POLICY IF EXISTS "Public update ornaments bucket" ON storage.objects;
CREATE POLICY "Public update ornaments bucket"
  ON storage.objects FOR UPDATE USING (bucket_id = 'ornaments');

DROP POLICY IF EXISTS "Public delete ornaments bucket" ON storage.objects;
CREATE POLICY "Public delete ornaments bucket"
  ON storage.objects FOR DELETE USING (bucket_id = 'ornaments');
