-- =====================================================
-- CREATE STORAGE BUCKET for product images
-- =====================================================

-- Create the bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set public access (RLS policy)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated Can Upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Can Delete Own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

-- Verify bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
