-- Migration 004: Alter Products Table - Add Configuration Template
-- Propósito: Permitir templates pré-configurados para tipos de produtos diferentes
-- Data: 2026-02-24

-- =====================================================
-- CRIAR ENUM: product_template_type
-- =====================================================

DO $$ BEGIN
    CREATE TYPE product_template_type AS ENUM ('food', 'clothing', 'electronics', 'default');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ADICIONAR COLUNA: configuration_template
-- =====================================================

ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS configuration_template product_template_type DEFAULT 'default';

-- =====================================================
-- ÍNDICES: Otimizar queries por template
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_configuration_template 
ON public.products(configuration_template);

-- =====================================================
-- ✅ Migration 004 Concluída
-- =====================================================
