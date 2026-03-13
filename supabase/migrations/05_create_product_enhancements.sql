-- Migration 003: Create Product Enhancements System
-- Propósito: Badges, selos visuais, gatilhos de confiança e recursos avançados
-- Data: 2026-02-24

-- =====================================================
-- CRIAR ENUM: badge_type
-- =====================================================

DO $$ BEGIN
    CREATE TYPE product_badge_type AS ENUM ('new', 'promotion', 'low_stock', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CRIAR ENUM: badge_position
-- =====================================================

DO $$ BEGIN
    CREATE TYPE product_badge_position AS ENUM ('top_left', 'top_right', 'bottom_left', 'bottom_right');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CRIAR TABELA: product_badges
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    badge_type product_badge_type NOT NULL,
    badge_label TEXT NOT NULL,
    badge_color TEXT NOT NULL DEFAULT 'bg-blue-500',
    badge_position product_badge_position NOT NULL DEFAULT 'top_right',
    show_condition JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    -- Note: MAX 3 active badges per product validated via trigger below
);

-- =====================================================
-- CRIAR TABELA: product_enhancements
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_enhancements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    expanded_description TEXT,
    trust_triggers JSONB DEFAULT '[]'::jsonb,
    warranty_text TEXT,
    stock_warning TEXT,
    highlight_section JSONB,
    visibility_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_badges_product_id 
ON public.product_badges(product_id);

CREATE INDEX IF NOT EXISTS idx_product_badges_type 
ON public.product_badges(badge_type);

CREATE INDEX IF NOT EXISTS idx_product_badges_active 
ON public.product_badges(is_active);

CREATE INDEX IF NOT EXISTS idx_product_enhancements_product_id 
ON public.product_enhancements(product_id);

-- =====================================================
-- CRIAR TRIGGERS: Atualizar updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_product_badges_updated_at ON public.product_badges;
CREATE TRIGGER update_product_badges_updated_at
    BEFORE UPDATE ON public.product_badges
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_product_enhancements_updated_at ON public.product_enhancements;
CREATE TRIGGER update_product_enhancements_updated_at
    BEFORE UPDATE ON public.product_enhancements
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- CRIAR TRIGGER: Validar máximo 3 badges ativos por produto
-- =====================================================

DROP TRIGGER IF EXISTS check_max_active_badges ON public.product_badges;
DROP FUNCTION IF EXISTS check_max_active_badges_fn();

CREATE FUNCTION check_max_active_badges_fn() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        IF (SELECT COUNT(*) FROM public.product_badges 
            WHERE product_id = NEW.product_id AND is_active = true AND id != NEW.id) >= 3 THEN
            RAISE EXCEPTION 'Máximo de 3 badges ativos por produto excedido';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_active_badges
    BEFORE INSERT OR UPDATE ON public.product_badges
    FOR EACH ROW
    EXECUTE FUNCTION check_max_active_badges_fn();

-- =====================================================
-- ATIVAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.product_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_enhancements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations on product_badges" ON public.product_badges;
DROP POLICY IF EXISTS "Allow all operations on product_enhancements" ON public.product_enhancements;

-- =====================================================
-- CRIAR POLICIES RLS
-- =====================================================

-- Product Badges - Public Read
CREATE POLICY "Enable read access for product badges"
ON public.product_badges
FOR SELECT
USING (is_active = true);

-- Product Badges - Admin Write
CREATE POLICY "Enable write access for admin on badges"
ON public.product_badges
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin on badges"
ON public.product_badges
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admin on badges"
ON public.product_badges
FOR DELETE USING (auth.role() = 'service_role');

-- Product Enhancements - Public Read
CREATE POLICY "Enable read access for product enhancements"
ON public.product_enhancements
FOR SELECT
USING (true);

-- Product Enhancements - Admin Write
CREATE POLICY "Enable write access for admin on enhancements"
ON public.product_enhancements
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin on enhancements"
ON public.product_enhancements
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admin on enhancements"
ON public.product_enhancements
FOR DELETE USING (auth.role() = 'service_role');

-- =====================================================
-- ✅ Migration 003 Concluída
-- =====================================================
