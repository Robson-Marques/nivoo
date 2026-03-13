-- =====================================================
-- EXECUTE ESTE SQL AGORA NO SUPABASE
-- Link: https://app.supabase.co/project/_/sql/new
-- =====================================================

-- =====================================================
-- PASSO 1: Verificar dados na tabela
-- =====================================================
SELECT 
  COUNT(*) as "Quantidade de Templates",
  string_agg(display_name, ', ' ORDER BY display_name) as "Templates"
FROM public.business_type_templates;

-- Resultado esperado:
-- Se retornar 10 templates → ✅ Dados existem
-- Se retornar 0 → ❌ Nenhum dado (execute INSIRA_TEMPLATES_MANUALMENTE.sql)

-- =====================================================
-- PASSO 2: Verificar RLS Status
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'business_type_templates') as num_policies
FROM pg_tables 
WHERE tablename = 'business_type_templates';

-- Resultado esperado:
-- rowsecurity: true ou false
-- num_policies: quantas policies existem

-- =====================================================
-- PASSO 3: Listar todas as policies
-- =====================================================
SELECT 
  policyname,
  qual,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'business_type_templates';

-- =====================================================
-- PASSO 4: SE TIVER PROBLEMA - REMOVER RLS
-- =====================================================

-- Remover TODAS as policies primeiro
DROP POLICY IF EXISTS "business_type_templates_read_all" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_write_admin" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_update_admin" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_delete_admin" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_public_select" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_write" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_update" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_delete" ON public.business_type_templates;

-- Desativar RLS temporariamente
ALTER TABLE public.business_type_templates DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 5: Testar query 
-- =====================================================
SELECT 
  id,
  business_type,
  display_name,
  icon_emoji,
  is_active
FROM public.business_type_templates
ORDER BY display_name;

-- Resultado esperado:
-- 10 linhas com todos os templates

-- =====================================================
-- PASSO 6: SE QUISER REATIVAR RLS (Depois)
-- =====================================================

-- ALTER TABLE public.business_type_templates ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "templates_read_all"
--     ON public.business_type_templates
--     FOR SELECT
--     USING (true);

-- =====================================================
-- SE TUDO FUNCIONOU:
-- 1. Volte ao navegador (http://localhost:8097)
-- 2. Aperte F5 para recarregar
-- 3. Vá para Configurações → Customização
-- 4. Deve aparecer 10 templates agora!
-- =====================================================
