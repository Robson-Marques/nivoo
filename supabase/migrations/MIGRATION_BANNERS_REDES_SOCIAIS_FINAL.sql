-- ============================================================
-- MIGRATION: BANNERS E REDES SOCIAIS - PRONTO PARA PRODUÇÃO
-- ============================================================
-- ⚠️ IMPORTANTE: Execute este SQL NO Supabase SQL Editor
-- Link: https://app.supabase.com/project/[seu-projeto]/sql/new
-- 
-- Este script cria:
-- ✅ Tabela de BANNERS (até 5 por restaurante)
-- ✅ Tabela de REDES SOCIAIS (Instagram, Facebook, YouTube)
-- ✅ Funções RPC para consultas
-- ✅ Índices para performance
-- ✅ Triggers de atualização automática
-- ============================================================

-- =====================================================
-- 1. CRIAÇÃO DA TABELA: BANNERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    link TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_banners_restaurant ON public.banners(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners("order");

-- RLS para banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on banners" ON public.banners;
CREATE POLICY "Allow all operations on banners" ON public.banners 
    FOR ALL USING (true);

-- =====================================================
-- 2. CRIAÇÃO DA TABELA: REDES SOCIAIS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.social_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube', 'whatsapp')),
    url TEXT,
    active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(restaurant_id, platform)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_social_media_restaurant ON public.social_media(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON public.social_media(platform);

-- RLS para redes sociais
ALTER TABLE public.social_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on social_media" ON public.social_media;
CREATE POLICY "Allow all operations on social_media" ON public.social_media 
    FOR ALL USING (true);

-- =====================================================
-- 3. FUNCTIONS: RPC PARA BANNERS
-- =====================================================

-- Função para obter banners ATIVOS (frontend)
DROP FUNCTION IF EXISTS get_active_banners(UUID);
CREATE OR REPLACE FUNCTION get_active_banners(p_restaurant_id UUID)
RETURNS TABLE (
    id UUID,
    image_url TEXT,
    link TEXT,
    "order" INTEGER
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.image_url,
        b.link,
        b."order"
    FROM public.banners b
    WHERE b.restaurant_id = p_restaurant_id
    AND b.active = true
    ORDER BY b."order" ASC;
END;
$$ LANGUAGE plpgsql;

-- Função para obter TODOS os banners (admin)
DROP FUNCTION IF EXISTS get_all_banners(UUID);
CREATE OR REPLACE FUNCTION get_all_banners(p_restaurant_id UUID)
RETURNS TABLE (
    id UUID,
    image_url TEXT,
    link TEXT,
    "order" INTEGER,
    active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.image_url,
        b.link,
        b."order",
        b.active,
        b.created_at
    FROM public.banners b
    WHERE b.restaurant_id = p_restaurant_id
    ORDER BY b."order" ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTIONS: RPC PARA REDES SOCIAIS
-- =====================================================

-- Função para obter redes sociais ATIVAS (frontend)
DROP FUNCTION IF EXISTS get_active_social_media(UUID);
CREATE OR REPLACE FUNCTION get_active_social_media(p_restaurant_id UUID)
RETURNS TABLE (
    platform TEXT,
    url TEXT
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.platform,
        sm.url
    FROM public.social_media sm
    WHERE sm.restaurant_id = p_restaurant_id
    AND sm.active = true
    AND sm.url IS NOT NULL
    AND sm.url != '';
END;
$$ LANGUAGE plpgsql;

-- Função para obter TODAS as redes sociais (admin)
DROP FUNCTION IF EXISTS get_all_social_media(UUID);
CREATE OR REPLACE FUNCTION get_all_social_media(p_restaurant_id UUID)
RETURNS TABLE (
    id UUID,
    platform TEXT,
    url TEXT,
    active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.platform,
        sm.url,
        sm.active,
        sm.created_at
    FROM public.social_media sm
    WHERE sm.restaurant_id = p_restaurant_id
    ORDER BY sm.platform ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. GATILHOS: ATUALIZAR updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_social_media_updated_at ON public.social_media;
CREATE TRIGGER update_social_media_updated_at
    BEFORE UPDATE ON public.social_media
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 6. INICIALIZAR REDES SOCIAIS (OPCIONAL)
-- =====================================================
-- Esta seção cria registros vazios para as redes sociais
-- Descomente se quiser que apareçam no admin mesmo sem URLs

-- INSERT INTO public.social_media (restaurant_id, platform, url, active)
-- SELECT id, 'instagram', NULL, false FROM public.restaurants LIMIT 1
-- ON CONFLICT DO NOTHING;
-- 
-- INSERT INTO public.social_media (restaurant_id, platform, url, active)
-- SELECT id, 'facebook', NULL, false FROM public.restaurants LIMIT 1
-- ON CONFLICT DO NOTHING;
-- 
-- INSERT INTO public.social_media (restaurant_id, platform, url, active)
-- SELECT id, 'youtube', NULL, false FROM public.restaurants LIMIT 1
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- ✅ MIGRATION CONCLUÍDA COM SUCESSO!
-- =====================================================
-- 
-- O que foi criado:
-- 1. Tabela banners (até 5 banners com rotação automática)
-- 2. Tabela social_media (Instagram, Facebook, YouTube)
-- 3. Funções RPC para consultas rápidas
-- 4. Índices para melhor performance
-- 5. Triggers para atualização automática de timestamps
--
-- Próximo passo: Accesse /customization no painel admin
-- =====================================================
