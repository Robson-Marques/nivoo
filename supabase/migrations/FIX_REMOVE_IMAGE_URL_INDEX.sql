-- =====================================================
-- FIX: Remove problematic image_url index
-- Error: index row requires 77776 bytes, maximum size is 8191
-- =====================================================

-- Check existing indices on product_images
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename = 'product_images'
ORDER BY indexname;

-- Drop the image_url index if it exists
DROP INDEX IF EXISTS idx_product_images_image_url CASCADE;

-- Alternative: if there's a multi-column index, drop it
DROP INDEX IF EXISTS product_images_image_url_idx CASCADE;

-- Verify indices were removed
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename = 'product_images'
ORDER BY indexname;
