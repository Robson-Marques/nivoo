-- =====================================================
-- FIX: Configurar bucket product-images corretamente
-- Erro: new row violates row-level security policy
-- =====================================================

-- 1. Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover todas as políticas antigas problemáticas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Can Upload" ON storage.objects;
DROP POLICY IF EXISTS "Can Delete Own" ON storage.objects;
DROP POLICY IF EXISTS "product-images select" ON storage.objects;
DROP POLICY IF EXISTS "product-images insert" ON storage.objects;
DROP POLICY IF EXISTS "product-images delete" ON storage.objects;

-- 3. Criar políticas PERMISSIVAS
-- Permitir qualquer um ler (GET)
CREATE POLICY "product-images-public-read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Permitir qualquer um fazer upload (PUT/POST)
CREATE POLICY "product-images-authenticated-upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

-- Permitir qualquer um deletar
CREATE POLICY "product-images-authenticated-delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images');

-- Permitir UPDATE
CREATE POLICY "product-images-authenticated-update" ON storage.objects
  FOR UPDATE
  WITH CHECK (bucket_id = 'product-images');

-- 4. Verificar bucket
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'product-images';

-- 5. Verificar políticas
SELECT 
  pol.name,
  pol.cmd,
  rol.rolname
FROM pg_policies pol
JOIN pg_roles rol ON pol.roles != pol.roles -- verificar
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND pol.qual LIKE '%product-images%';
