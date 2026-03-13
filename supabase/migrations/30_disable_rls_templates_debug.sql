-- =====================================================
-- Migration 30: Fix RLS Issue - Disable and Test
-- Propósito: Desativar RLS na business_type_templates para garantir leitura
-- Status: CRÍTICO - Implementar AGORA
-- Data: 2026-03-11
-- =====================================================

-- =====================================================
-- 1. DROP ALL POLICIES FIRST
-- =====================================================

DROP POLICY IF EXISTS "business_type_templates_read_all" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_write_admin" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_update_admin" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_delete_admin" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_public_select" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_write" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_update" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_delete" ON public.business_type_templates;

-- =====================================================
-- 2. DISABLE RLS COMPLETELY (Temporary for debugging)
-- =====================================================

ALTER TABLE public.business_type_templates DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. VERIFY DATA EXISTS
-- =====================================================

SELECT 
  COUNT(*) as total_templates,
  COUNT(CASE WHEN is_active THEN 1 END) as active
FROM public.business_type_templates;

-- =====================================================
-- 4. SHOW ALL TEMPLATES
-- =====================================================

SELECT 
  id,
  business_type,
  display_name,
  icon_emoji,
  is_active,
  created_at
FROM public.business_type_templates
ORDER BY display_name;

-- =====================================================
-- 5. SHOW CONFIGURATIONS
-- =====================================================

SELECT 
  COUNT(*) as total_configurations
FROM public.template_configurations;

-- =====================================================
-- 6. SHOW ADDONS
-- =====================================================

SELECT 
  COUNT(*) as total_addons
FROM public.template_addons;

-- =====================================================
-- NOTES:
-- =====================================================
-- 
-- Se você quer reativar RLS depois, execute:
-- 
-- ALTER TABLE public.business_type_templates ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "templates_read_all"
--     ON public.business_type_templates
--     FOR SELECT
--     USING (true);
-- 
-- CREATE POLICY "templates_insert_admin"
--     ON public.business_type_templates
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));
-- 
-- CREATE POLICY "templates_update_admin"
--     ON public.business_type_templates
--     FOR UPDATE
--     TO authenticated
--     USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
--     WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));
-- 
-- CREATE POLICY "templates_delete_admin"
--     ON public.business_type_templates
--     FOR DELETE
--     TO authenticated
--     USING (auth.uid() IN (SELECT user_id FROM public.admin_users));
--
-- =====================================================
-- Migration 30 Complete
-- =====================================================
