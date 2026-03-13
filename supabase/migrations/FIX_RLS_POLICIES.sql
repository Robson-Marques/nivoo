-- ==========================================
-- SCRIPT SQL - FIX RLS POLICIES
-- Projeto: szzzqpkqlmslsuhjafkd
-- ==========================================

-- 1. Verificar se tabela existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'product_images'
) as table_exists;

-- 2. Verificar RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'product_images';

-- 3. Listar policies existentes
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'product_images'
ORDER BY policyname;

-- 4. DELETAR POLICIES ANTIGAS (se houver)
DROP POLICY IF EXISTS "public_select" ON product_images;
DROP POLICY IF EXISTS "public_insert" ON product_images;
DROP POLICY IF EXISTS "public_update" ON product_images;
DROP POLICY IF EXISTS "public_delete" ON product_images;
DROP POLICY IF EXISTS "select_all" ON product_images;
DROP POLICY IF EXISTS "insert_own" ON product_images;
DROP POLICY IF EXISTS "insert_all" ON product_images;
DROP POLICY IF EXISTS "update_own" ON product_images;
DROP POLICY IF EXISTS "update_all" ON product_images;
DROP POLICY IF EXISTS "delete_own" ON product_images;
DROP POLICY IF EXISTS "delete_all" ON product_images;
DROP POLICY IF EXISTS "authenticated_select" ON product_images;
DROP POLICY IF EXISTS "authenticated_insert" ON product_images;
DROP POLICY IF EXISTS "authenticated_update" ON product_images;
DROP POLICY IF EXISTS "authenticated_delete" ON product_images;

-- 5. CRIAR POLICIES NOVAS
CREATE POLICY "product_images_select" ON product_images
  FOR SELECT 
  USING (true);

CREATE POLICY "product_images_insert" ON product_images
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "product_images_update" ON product_images
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_images_delete" ON product_images
  FOR DELETE 
  USING (true);

-- 6. Verificar policies criadas
SELECT 
  policyname,
  cmd as operation,
  qual as condition,
  with_check as check_condition
FROM pg_policies
WHERE tablename = 'product_images'
ORDER BY policyname;

-- 7. TESTAR INSERT (usar UUID válido)
-- NOTA: Se houver erro UUID não existe, é normal. O importante é testar as POLICIES.
-- Se der erro "permission denied" = RLS está bloqueando
-- Se der erro "violates constraint" = OK, só significa que o produto não existe
INSERT INTO product_images (
  product_id, 
  image_url, 
  alt_text, 
  display_order, 
  is_primary
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'Test Image',
  0,
  true
)
RETURNING id, product_id, display_order, is_primary;

-- 8. Listar todas as imagens
SELECT 
  id,
  product_id,
  image_url,
  alt_text,
  display_order,
  is_primary,
  created_at
FROM product_images
ORDER BY product_id, display_order
LIMIT 20;

-- 9. Contar imagens por produto
SELECT 
  product_id,
  COUNT(*) as total_images
FROM product_images
GROUP BY product_id
ORDER BY total_images DESC;
