-- =====================================================
-- FIX COMPLETO: Remove TODOS os índices problemáticos
-- Error: index row requires 76176 bytes, maximum size is 8191
-- =====================================================

-- 1. LISTAR todos os índices atuais
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'product_images'
ORDER BY indexname;

-- 2. DROP de TODOS os índices da tabela (menos PK)
DROP INDEX IF EXISTS idx_product_images_image_url CASCADE;
DROP INDEX IF EXISTS product_images_image_url_idx CASCADE;
DROP INDEX IF EXISTS idx_product_images_url CASCADE;
DROP INDEX IF EXISTS product_images_url_idx CASCADE;
DROP INDEX IF EXISTS idx_product_images_product_id CASCADE;
DROP INDEX IF EXISTS idx_product_images_is_primary CASCADE;
DROP INDEX IF EXISTS idx_product_images_display_order CASCADE;
DROP INDEX IF EXISTS product_images_product_id_idx CASCADE;
DROP INDEX IF EXISTS product_images_is_primary_idx CASCADE;
DROP INDEX IF EXISTS product_images_created_by_idx CASCADE;

-- 3. Remove indices composite
DROP INDEX IF EXISTS product_images_product_id_is_primary_idx CASCADE;
DROP INDEX IF EXISTS idx_product_images_product_id_is_primary CASCADE;

-- 4. Verifica se tem UNIQUE constraint na image_url
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_image_url_key CASCADE;

-- 5. CONFIRMAR: Listar índices restantes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'product_images'
ORDER BY indexname;

-- 6. Listar constraints
SELECT
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'product_images'
ORDER BY constraint_name;
