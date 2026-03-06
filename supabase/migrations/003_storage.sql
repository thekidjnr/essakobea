-- Create public media bucket for uploaded images
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (serving images to all visitors)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');
