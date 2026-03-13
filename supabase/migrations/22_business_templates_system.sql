-- =====================================================
-- Migration 22: Business Templates System
-- Propósito: Criar sistema de templates para diferentes tipos de negócio
-- Suporta: Pizzaria, Hamburgueria, Restaurante, Pastelaria, Lanchonete, Açaí, etc.
-- Data: 2026-03-11
-- =====================================================

-- =====================================================
-- 0. ENSURE REQUIRED TABLES AND FUNCTIONS EXIST
-- =====================================================

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to see admin_users
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage admin_users (admin only)
DROP POLICY IF EXISTS "admin_users_write" ON public.admin_users;
CREATE POLICY "admin_users_write"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_users_update" ON public.admin_users;
CREATE POLICY "admin_users_update"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_users_delete" ON public.admin_users;
CREATE POLICY "admin_users_delete"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Create or replace is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Create or replace set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE public.business_type AS ENUM (
        'pizzeria',
        'hamburger_shop',
        'restaurant',
        'pastry_shop',
        'snack_bar',
        'acai_shop',
        'bar',
        'cafe',
        'bakery',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Tabela de Tipos de Negócio com Templates
CREATE TABLE IF NOT EXISTS public.business_type_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_type public.business_type NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    icon_emoji TEXT DEFAULT '🏪',
    is_active BOOLEAN DEFAULT true,
    template_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Configurações de Template
CREATE TABLE IF NOT EXISTS public.template_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.business_type_templates(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER NOT NULL,
    options JSONB,
    default_value TEXT,
    help_text TEXT,
    max_selections INTEGER,
    min_length INTEGER,
    max_length INTEGER,
    step DECIMAL,
    min_value DECIMAL,
    max_value DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_template_config_key UNIQUE(template_id, config_key)
);

-- Tabela de Adicionais de Template
CREATE TABLE IF NOT EXISTS public.template_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.business_type_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_business_type_templates_active
ON public.business_type_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_template_configurations_template_id
ON public.template_configurations(template_id);

CREATE INDEX IF NOT EXISTS idx_template_configurations_display_order
ON public.template_configurations(template_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_template_addons_template_id
ON public.template_addons(template_id);

CREATE INDEX IF NOT EXISTS idx_template_addons_display_order
ON public.template_addons(template_id, display_order ASC);

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_business_type_templates_updated_at
ON public.business_type_templates;

CREATE TRIGGER update_business_type_templates_updated_at
    BEFORE UPDATE ON public.business_type_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_template_configurations_updated_at
ON public.template_configurations;

CREATE TRIGGER update_template_configurations_updated_at
    BEFORE UPDATE ON public.template_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_template_addons_updated_at
ON public.template_addons;

CREATE TRIGGER update_template_addons_updated_at
    BEFORE UPDATE ON public.template_addons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.business_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_addons ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE POLICIES
-- =====================================================

-- business_type_templates: Public read for ALL users (authenticated and anon)
DROP POLICY IF EXISTS "business_type_templates_public_select" ON public.business_type_templates;
CREATE POLICY "business_type_templates_public_select"
    ON public.business_type_templates
    FOR SELECT
    USING (true);

-- business_type_templates: Admin write
DROP POLICY IF EXISTS "business_type_templates_admin_write" ON public.business_type_templates;
CREATE POLICY "business_type_templates_admin_write"
    ON public.business_type_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "business_type_templates_admin_update" ON public.business_type_templates;
CREATE POLICY "business_type_templates_admin_update"
    ON public.business_type_templates
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "business_type_templates_admin_delete" ON public.business_type_templates;
CREATE POLICY "business_type_templates_admin_delete"
    ON public.business_type_templates
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- template_configurations: Public read for ALL users
DROP POLICY IF EXISTS "template_configurations_public_select" ON public.template_configurations;
CREATE POLICY "template_configurations_public_select"
    ON public.template_configurations
    FOR SELECT
    USING (true);

-- template_configurations: Admin write
DROP POLICY IF EXISTS "template_configurations_admin_write" ON public.template_configurations;
CREATE POLICY "template_configurations_admin_write"
    ON public.template_configurations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "template_configurations_admin_update" ON public.template_configurations;
CREATE POLICY "template_configurations_admin_update"
    ON public.template_configurations
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "template_configurations_admin_delete" ON public.template_configurations;
CREATE POLICY "template_configurations_admin_delete"
    ON public.template_configurations
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- template_addons: Public read for ALL users
DROP POLICY IF EXISTS "template_addons_public_select" ON public.template_addons;
CREATE POLICY "template_addons_public_select"
    ON public.template_addons
    FOR SELECT
    USING (true);

-- template_addons: Admin write
DROP POLICY IF EXISTS "template_addons_admin_write" ON public.template_addons;
CREATE POLICY "template_addons_admin_write"
    ON public.template_addons
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "template_addons_admin_update" ON public.template_addons;
CREATE POLICY "template_addons_admin_update"
    ON public.template_addons
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "template_addons_admin_delete" ON public.template_addons;
CREATE POLICY "template_addons_admin_delete"
    ON public.template_addons
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- =====================================================
-- 7. INSERT DEFAULT TEMPLATES
-- =====================================================

-- Pizzeria Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('pizzeria', 'Pizzaria', 'Configurações completas para pizzaria com tamanhos, sabores, bordas e adicionais', '🍕', true)
ON CONFLICT DO NOTHING;

-- Hamburger Shop Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('hamburger_shop', 'Hamburgueria', 'Configurações para hamburgueria com tamanhos, tipos de carne, adicionais e acompanhamentos', '🍔', true)
ON CONFLICT DO NOTHING;

-- Restaurant Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('restaurant', 'Restaurante', 'Configurações para restaurante com pratos, acompanhamentos, bebidas e personalizações', '🍽️', true)
ON CONFLICT DO NOTHING;

-- Pastry Shop Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('pastry_shop', 'Pastelaria', 'Configurações para pastelaria com tamanhos, recheios, bebidas quentes e geladas', '🥐', true)
ON CONFLICT DO NOTHING;

-- Snack Bar Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('snack_bar', 'Lanchonete', 'Configurações para lanchonete com combos, bebidas, petiscos e acompanhamentos', '🌭', true)
ON CONFLICT DO NOTHING;

-- Acai Shop Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('acai_shop', 'Açai Shop', 'Configurações para açaí com tamanhos, coberturas, adicionais e complementos', '🍓', true)
ON CONFLICT DO NOTHING;

-- Bar Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('bar', 'Bar', 'Configurações para bar com drinks, cervejas, bebidas e petiscos', '🍺', true)
ON CONFLICT DO NOTHING;

-- Cafe Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('cafe', 'Café', 'Configurações para café com tipos de café, bebidas, bolos e acompanhamentos', '☕', true)
ON CONFLICT DO NOTHING;

-- Bakery Template
INSERT INTO public.business_type_templates
(business_type, display_name, description, icon_emoji, is_active)
VALUES
('bakery', 'Padaria', 'Configurações para padaria com pães, bolos, salgados e doces', '🥖', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. INSERT DEFAULT CONFIGURATIONS FOR PIZZERIA
-- =====================================================

-- Get the pizzeria template ID
WITH pizzeria_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'pizzeria'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM pizzeria_template t
CROSS JOIN (
    VALUES
        ('size', 'Tamanho', 'select', true, 1, '["Pequena (25cm)", "Média (30cm)", "Grande (35cm)", "Extra Grande (40cm)"]'::text, 'Escolha o tamanho da pizza'),
        ('crust', 'Borda', 'select', true, 2, '["Tradicional", "Crocante", "Recheada", "Sem Borda"]'::text, 'Escolha o tipo de borda'),
        ('flavor', 'Sabor', 'select', true, 3, '["Calabresa", "Muçarela", "Portuguesa", "Quatro Queijos", "Frango com Catupiry", "Moda da Casa"]'::text, 'Escolha o sabor da pizza'),
        ('extra_cheese', 'Queijo Extra', 'checkbox', false, 4, '["Sem Queijo Extra", "Com Queijo Extra"]'::text, 'Adicione queijo extra'),
        ('beverage', 'Bebida', 'select', false, 5, '["Sem Bebida", "Refrigerante 2L", "Cerveja", "Suco"]'::text, 'Escolha uma bebida')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. INSERT DEFAULT ADDONS FOR PIZZERIA
-- =====================================================

WITH pizzeria_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'pizzeria'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM pizzeria_template t
CROSS JOIN (
    VALUES
        ('Adicional Calabresa', 'Adicione calabresa à pizza', 5.00, 1, 'Adicionais', true),
        ('Adicional Frango', 'Adicione frango à pizza', 6.00, 2, 'Adicionais', true),
        ('Adicional Bacon', 'Adicione bacon à pizza', 7.00, 3, 'Adicionais', true),
        ('Refrigerante 2L', 'Refrigerante de 2 litros', 9.00, 4, 'Bebidas', true),
        ('Cerveja Premium', 'Cerveja Premium 600ml', 12.00, 5, 'Bebidas', true),
        ('Molho Especial', 'Molho especial da casa', 2.00, 6, 'Complementos', true),
        ('Garlic Bread', 'Pão de alho com queijo', 8.00, 7, 'Acompanhamentos', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. INSERT DEFAULT CONFIGURATIONS FOR HAMBURGER
-- =====================================================

WITH hamburger_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'hamburger_shop'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM hamburger_template t
CROSS JOIN (
    VALUES
        ('size', 'Tamanho', 'select', true, 1, '["Simples", "Duplo", "Triplo"]'::text, 'Escolha o tamanho do burger'),
        ('meat_type', 'Tipo de Carne', 'select', true, 2, '["Carne Bovina", "Carne de Frango", "Carne Suína", "Mix (Bovino + Frango)"]'::text, 'Escolha o tipo de carne'),
        ('doneness', 'Ponto', 'select', true, 3, '["Mal Passado", "Ao Ponto", "Bem Passado"]'::text, 'Escolha o ponto da carne'),
        ('extras', 'Adicionais', 'checkbox', false, 4, '["Bacon", "Ovo", "Queijo Extra", "Cebola Caramelizada"]'::text, 'Escolha adicionais'),
        ('drink', 'Bebida', 'select', false, 5, '["Sem", "Refrigerante", "Suco", "Cerveja"]'::text, 'Escolha uma bebida')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. INSERT DEFAULT ADDONS FOR HAMBURGER
-- =====================================================

WITH hamburger_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'hamburger_shop'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM hamburger_template t
CROSS JOIN (
    VALUES
        ('Queijo Extra', 'Queijo derretido adicional', 2.00, 1, 'Extras', true),
        ('Bacon', 'Bacon crocante', 3.00, 2, 'Extras', true),
        ('Ovo', 'Ovo frito', 2.50, 3, 'Extras', true),
        ('Molho Barbecue', 'Molho BBQ especial', 1.50, 4, 'Molhos', true),
        ('Batata Frita Pequena', 'Acompanhamento', 5.00, 5, 'Acompanhamentos', true),
        ('Batata Frita Grande', 'Acompanhamento', 8.00, 6, 'Acompanhamentos', true),
        ('Refrigerante 2L', 'Bebida', 9.00, 7, 'Bebidas', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. INSERT DEFAULT CONFIGURATIONS FOR ACAI
-- =====================================================

WITH acai_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'acai_shop'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM acai_template t
CROSS JOIN (
    VALUES
        ('size', 'Tamanho', 'select', true, 1, '["Pequeno (300ml)", "Médio (500ml)", "Grande (800ml)"]'::text, 'Escolha o tamanho'),
        ('base', 'Base', 'select', true, 2, '["Açaí Tradicional", "Açaí com Iogurte", "Açaí Cremoso"]'::text, 'Escolha a base'),
        ('toppings', 'Coberturas', 'checkbox', true, 3, '["Granola", "Banana", "Morango", "Chocolate", "Mel"]'::text, 'Escolha as coberturas')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. INSERT DEFAULT ADDONS FOR ACAI
-- =====================================================

WITH acai_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'acai_shop'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM acai_template t
CROSS JOIN (
    VALUES
        ('Granola Extra', 'Granola crocante adicional', 3.00, 1, 'Coberturas', true),
        ('Banana', 'Banana fatiada', 1.50, 2, 'Frutas', true),
        ('Morango', 'Morango fresco', 2.00, 3, 'Frutas', true),
        ('Chocolate', 'Calda de chocolate', 2.50, 4, 'Caldas', true),
        ('Mel', 'Mel puro', 2.00, 5, 'Caldas', true),
        ('Leite Condensado', 'Leite condensado', 2.50, 6, 'Caldas', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ✅ Migration 22 Complete
-- =====================================================
