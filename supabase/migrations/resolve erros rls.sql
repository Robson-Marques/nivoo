-- =====================================================
-- FIX: RLS para INSERT/UPDATE/DELETE em public.product_images
-- Resolve: 42501 new row violates row-level security policy
-- =====================================================

ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;

-- Drop policies antigas (idempotente)
DROP POLICY IF EXISTS "public_select" ON public.product_images;
DROP POLICY IF EXISTS "public_insert" ON public.product_images;
DROP POLICY IF EXISTS "public_update" ON public.product_images;
DROP POLICY IF EXISTS "public_delete" ON public.product_images;

DROP POLICY IF EXISTS "select_all" ON public.product_images;
DROP POLICY IF EXISTS "insert_own" ON public.product_images;
DROP POLICY IF EXISTS "insert_all" ON public.product_images;
DROP POLICY IF EXISTS "update_own" ON public.product_images;
DROP POLICY IF EXISTS "update_all" ON public.product_images;
DROP POLICY IF EXISTS "delete_own" ON public.product_images;
DROP POLICY IF EXISTS "delete_all" ON public.product_images;

DROP POLICY IF EXISTS "authenticated_select" ON public.product_images;
DROP POLICY IF EXISTS "authenticated_insert" ON public.product_images;
DROP POLICY IF EXISTS "authenticated_update" ON public.product_images;
DROP POLICY IF EXISTS "authenticated_delete" ON public.product_images;

DROP POLICY IF EXISTS "Enable read access for product images" ON public.product_images;
DROP POLICY IF EXISTS "Enable write access for admin on product images" ON public.product_images;
DROP POLICY IF EXISTS "Enable update for admin on product images" ON public.product_images;
DROP POLICY IF EXISTS "Enable delete for admin on product images" ON public.product_images;

DROP POLICY IF EXISTS "Allow all operations on product_images" ON public.product_images;

DROP POLICY IF EXISTS "product_images_select" ON public.product_images;
DROP POLICY IF EXISTS "product_images_insert" ON public.product_images;
DROP POLICY IF EXISTS "product_images_update" ON public.product_images;
DROP POLICY IF EXISTS "product_images_delete" ON public.product_images;

-- Policies novas
CREATE POLICY "product_images_select"
ON public.product_images
FOR SELECT
USING (true);

CREATE POLICY "product_images_insert"
ON public.product_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "product_images_update"
ON public.product_images
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "product_images_delete"
ON public.product_images
FOR DELETE
TO authenticated
USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT SELECT ON public.product_images TO anon;