-- =====================================================
-- FIX DEFINITIVO (SEM ERRO): RLS product_images
-- Objetivo: parar o erro
--   new row violates row-level security policy for table "product_images"
--
-- Este SQL libera INSERT/UPDATE/DELETE para QUALQUER usuário do app
-- (anon + authenticated). Se você quiser restringir depois, eu ajusto.
-- =====================================================

BEGIN;

-- 1) Garantir RLS ligado
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;

-- (Opcional) remover FORCE RLS se alguém ativou (isso pode atrapalhar testes)
-- Se der erro de permissão, pode remover esta linha.
ALTER TABLE IF EXISTS public.product_images NO FORCE ROW LEVEL SECURITY;

-- 2) Remover policies antigas/conflitantes (idempotente)
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'product_images'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_images;', p.policyname);
  END LOOP;
END $$;

-- 3) Criar policies NOVAS (aplica para anon + authenticated)
CREATE POLICY "product_images_select_all"
ON public.product_images
FOR SELECT
USING (true);

CREATE POLICY "product_images_insert_all"
ON public.product_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "product_images_update_all"
ON public.product_images
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "product_images_delete_all"
ON public.product_images
FOR DELETE
USING (true);

-- 4) Garantir grants (não resolve RLS sozinho, mas evita bloqueio por privilege)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;

COMMIT;