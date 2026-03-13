-- =====================================================
-- Migration 23: Fix Templates RLS Policies
-- Propósito: Corrigir políticas RLS para permitir leitura de templates
-- Data: 2026-03-11
-- =====================================================

-- =====================================================
-- Fix business_type_templates RLS Policies
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "business_type_templates_public_select" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_write" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_update" ON public.business_type_templates;
DROP POLICY IF EXISTS "business_type_templates_admin_delete" ON public.business_type_templates;

-- Create read policy for everyone (no auth required)
CREATE POLICY "business_type_templates_read_all"
    ON public.business_type_templates
    FOR SELECT
    USING (true);

-- Create write policies for admins only
CREATE POLICY "business_type_templates_write_admin"
    ON public.business_type_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "business_type_templates_update_admin"
    ON public.business_type_templates
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "business_type_templates_delete_admin"
    ON public.business_type_templates
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- =====================================================
-- Fix template_configurations RLS Policies
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "template_configurations_public_select" ON public.template_configurations;
DROP POLICY IF EXISTS "template_configurations_admin_write" ON public.template_configurations;
DROP POLICY IF EXISTS "template_configurations_admin_update" ON public.template_configurations;
DROP POLICY IF EXISTS "template_configurations_admin_delete" ON public.template_configurations;

-- Create read policy for everyone
CREATE POLICY "template_configurations_read_all"
    ON public.template_configurations
    FOR SELECT
    USING (true);

-- Create write policies for admins only
CREATE POLICY "template_configurations_write_admin"
    ON public.template_configurations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "template_configurations_update_admin"
    ON public.template_configurations
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "template_configurations_delete_admin"
    ON public.template_configurations
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- =====================================================
-- Fix template_addons RLS Policies
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "template_addons_public_select" ON public.template_addons;
DROP POLICY IF EXISTS "template_addons_admin_write" ON public.template_addons;
DROP POLICY IF EXISTS "template_addons_admin_update" ON public.template_addons;
DROP POLICY IF EXISTS "template_addons_admin_delete" ON public.template_addons;

-- Create read policy for everyone
CREATE POLICY "template_addons_read_all"
    ON public.template_addons
    FOR SELECT
    USING (true);

-- Create write policies for admins only
CREATE POLICY "template_addons_write_admin"
    ON public.template_addons
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "template_addons_update_admin"
    ON public.template_addons
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "template_addons_delete_admin"
    ON public.template_addons
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- =====================================================
-- Verify Data Exists
-- =====================================================

-- This query will show you if templates were inserted:
-- SELECT COUNT(*) as template_count FROM public.business_type_templates;
-- SELECT COUNT(*) as configuration_count FROM public.template_configurations;
-- SELECT COUNT(*) as addon_count FROM public.template_addons;

-- ✅ Migration 23 Complete
