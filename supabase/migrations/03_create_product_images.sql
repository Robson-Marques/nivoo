-- Migration 001: Create Product Images Table
-- Propósito: Armazenar múltiplas imagens por produto com ordenação
-- Data: 2026-02-24

-- =====================================================
-- CRIAR TABELA: product_images
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_unique_image_url_per_product UNIQUE(product_id, image_url),
    CONSTRAINT chk_is_primary_boolean CHECK (is_primary IN (true, false))
);
-- Note: MAX 7 images and unique primary image validated via triggers below

-- =====================================================
-- CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
ON public.product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_product_images_product_order 
ON public.product_images(product_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_product_images_is_primary 
ON public.product_images(product_id, is_primary);

-- =====================================================
-- CRIAR TRIGGER: Atualizar updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- CRIAR TRIGGER: Validar máximo 7 imagens por produto
-- =====================================================

DROP TRIGGER IF EXISTS check_max_images_per_product ON public.product_images;
DROP FUNCTION IF EXISTS check_max_images_per_product_fn();

CREATE FUNCTION check_max_images_per_product_fn() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.product_images WHERE product_id = NEW.product_id) > 7 THEN
        RAISE EXCEPTION 'Máximo de 7 imagens por produto excedido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_images_per_product
    BEFORE INSERT ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION check_max_images_per_product_fn();

-- =====================================================
-- CRIAR TRIGGER: Validar apenas 1 imagem primária
-- =====================================================

DROP TRIGGER IF EXISTS check_primary_image_unique ON public.product_images;
DROP FUNCTION IF EXISTS check_primary_image_unique_fn();

CREATE FUNCTION check_primary_image_unique_fn() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        IF (SELECT COUNT(*) FROM public.product_images 
            WHERE product_id = NEW.product_id AND is_primary = true AND id != NEW.id) > 0 THEN
            -- Remove o is_primary de outras imagens do mesmo produto
            UPDATE public.product_images 
            SET is_primary = false 
            WHERE product_id = NEW.product_id AND id != NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_primary_image_unique
    BEFORE INSERT OR UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION check_primary_image_unique_fn();

-- =====================================================
-- ATIVAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations on product_images" ON public.product_images;

-- =====================================================
-- CRIAR POLICIES RLS
-- =====================================================

-- Permitir SELECT público (Frontend view)
CREATE POLICY "Enable read access for product images"
ON public.product_images
FOR SELECT
USING (true);

-- Permitir INSERT/UPDATE/DELETE apenas para admin
CREATE POLICY "Enable write access for admin on product images"
ON public.product_images
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin on product images"
ON public.product_images
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admin on product images"
ON public.product_images
FOR DELETE USING (auth.role() = 'service_role');

-- =====================================================
-- MIGRAÇÃO DATA: Mover imagem existente de products
-- =====================================================

-- Se o campo image_url existe em products, migrar para product_images
DO $$
DECLARE
    prod RECORD;
BEGIN
    FOR prod IN SELECT id, image_url FROM public.products WHERE image_url IS NOT NULL LOOP
        INSERT INTO public.product_images (product_id, image_url, display_order, is_primary)
        VALUES (prod.id, prod.image_url, 0, true)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- ✅ Migration 001 Concluída
-- =====================================================
