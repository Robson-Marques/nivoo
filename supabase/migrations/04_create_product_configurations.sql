-- Migration 002: Create Product Configurations System
-- Propósito: Sistema avançado de perguntas/campos personalizáveis por produto
-- Data: 2026-02-24

-- =====================================================
-- CRIAR ENUM: field_type
-- =====================================================

DO $$ BEGIN
    CREATE TYPE product_field_type AS ENUM ('radio', 'checkbox', 'select', 'text', 'number');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CRIAR TABELA: product_configurations
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_label TEXT NOT NULL,
    field_type product_field_type NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL,
    max_selections INTEGER,
    min_length INTEGER,
    max_length INTEGER,
    step DECIMAL(10, 2),
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    default_value TEXT,
    help_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_unique_config_key UNIQUE(product_id, config_key),
    CONSTRAINT chk_text_length_consistency CHECK (min_length IS NULL OR max_length IS NULL OR min_length <= max_length),
    CONSTRAINT chk_number_range_consistency CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
);

-- =====================================================
-- CRIAR TABELA: product_configuration_options
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_configuration_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    configuration_id UUID NOT NULL REFERENCES public.product_configurations(id) ON DELETE CASCADE,
    option_label TEXT NOT NULL,
    option_value TEXT NOT NULL,
    additional_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_additional_price_non_negative CHECK (additional_price >= 0)
    -- Note: MAX 100 options per config validated via trigger below
);

-- =====================================================
-- CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_configurations_product_id 
ON public.product_configurations(product_id);

CREATE INDEX IF NOT EXISTS idx_product_configurations_product_order 
ON public.product_configurations(product_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_product_configuration_options_config_id 
ON public.product_configuration_options(configuration_id);

CREATE INDEX IF NOT EXISTS idx_product_configuration_options_config_order 
ON public.product_configuration_options(configuration_id, display_order ASC);

-- =====================================================
-- CRIAR TRIGGERS: Atualizar updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_product_configurations_updated_at ON public.product_configurations;
CREATE TRIGGER update_product_configurations_updated_at
    BEFORE UPDATE ON public.product_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_product_configuration_options_updated_at ON public.product_configuration_options;
CREATE TRIGGER update_product_configuration_options_updated_at
    BEFORE UPDATE ON public.product_configuration_options
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- CRIAR TRIGGER: Validar máximo 20 configs por produto
-- =====================================================

DROP TRIGGER IF EXISTS check_max_configs_per_product ON public.product_configurations;
DROP FUNCTION IF EXISTS check_max_configs_per_product_fn();

CREATE FUNCTION check_max_configs_per_product_fn() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.product_configurations WHERE product_id = NEW.product_id) > 20 THEN
        RAISE EXCEPTION 'Máximo de 20 configurações por produto excedido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_configs_per_product
    BEFORE INSERT ON public.product_configurations
    FOR EACH ROW
    EXECUTE FUNCTION check_max_configs_per_product_fn();

-- =====================================================
-- CRIAR TRIGGER: Validar máximo 100 opções por config
-- =====================================================

DROP TRIGGER IF EXISTS check_max_options_per_config ON public.product_configuration_options;
DROP FUNCTION IF EXISTS check_max_options_per_config_fn();

CREATE FUNCTION check_max_options_per_config_fn() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.product_configuration_options WHERE configuration_id = NEW.configuration_id) > 100 THEN
        RAISE EXCEPTION 'Máximo de 100 opções por configuração excedido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_options_per_config
    BEFORE INSERT ON public.product_configuration_options
    FOR EACH ROW
    EXECUTE FUNCTION check_max_options_per_config_fn();

-- =====================================================
-- ATIVAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_configuration_options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations on product_configurations" ON public.product_configurations;
DROP POLICY IF EXISTS "Allow all operations on product_configuration_options" ON public.product_configuration_options;

-- =====================================================
-- CRIAR POLICIES RLS
-- =====================================================

-- Product Configurations - Public Read
CREATE POLICY "Enable read access for product configurations"
ON public.product_configurations
FOR SELECT
USING (true);

-- Product Configurations - Admin Write
CREATE POLICY "Enable write access for admin on configurations"
ON public.product_configurations
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin on configurations"
ON public.product_configurations
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admin on configurations"
ON public.product_configurations
FOR DELETE USING (auth.role() = 'service_role');

-- Product Configuration Options - Public Read
CREATE POLICY "Enable read access for configuration options"
ON public.product_configuration_options
FOR SELECT
USING (true);

-- Product Configuration Options - Admin Write
CREATE POLICY "Enable write access for admin on options"
ON public.product_configuration_options
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin on options"
ON public.product_configuration_options
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admin on options"
ON public.product_configuration_options
FOR DELETE USING (auth.role() = 'service_role');

-- =====================================================
-- ✅ Migration 002 Concluída
-- =====================================================
