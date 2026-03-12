-- Migration: Add avatar_url to candidate_profiles
-- Created: 2026-03-12
-- Description: Adds avatar_url column for candidate profile photo and creates storage bucket

-- Add avatar_url column
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for candidate avatars (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-avatars',
  'candidate-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: candidates can only manage their own avatar
CREATE POLICY "Candidates can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'candidate-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'candidate-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read candidate avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'candidate-avatars');
