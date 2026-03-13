-- =====================================================
-- Migration 27: Insert Default Business Templates
-- Propósito: Inserir templates padrão para cada tipo de negócio
-- Data: 2026-03-11
-- =====================================================

-- =====================================================
-- 1. INSERT DEFAULT TEMPLATES IF THEY DON'T EXIST
-- =====================================================

INSERT INTO public.business_type_templates (business_type, display_name, description, icon_emoji, is_active)
VALUES
    ('pizzeria', '🍕 Pizzeria', 'Template para pizzarias com opções de massa, recheios e tamanhos', '🍕', true),
    ('hamburger_shop', '🍔 Hamburgueria', 'Template para hamburguarias com opções de carne, acompanhamentos e molhos', '🍔', true),
    ('restaurant', '🍽️ Restaurante', 'Template para restaurantes com pratos executivos, carnes e acompanhamentos', '🍽️', true),
    ('pastry_shop', '🥐 Pastelaria', 'Template para pastelarias com tamanhos, massas e recheios', '🥐', true),
    ('snack_bar', '🌮 Lanchonete', 'Template para lanchonetes com lanches, bebidas e acompanhamentos', '🌮', true),
    ('acai_shop', '🥣 Açaí', 'Template para lojas de açaí com frutas, acompanhamentos e tamanhos', '🥣', true),
    ('bar', '🍺 Bar', 'Template para bares com bebidas, petiscos e drinques', '🍺', true),
    ('cafe', '☕ Café', 'Template para cafeterias com bebidas quentes, frias e docinhos', '☕', true),
    ('bakery', '🥖 Padaria', 'Template para padarias com pães, bolos e doces', '🥖', true),
    ('other', '🏪 Outro', 'Template genérico para outros tipos de negócio', '🏪', true)
ON CONFLICT (business_type) DO UPDATE SET is_active = true;

-- =====================================================
-- 2. VERIFY TEMPLATES WERE INSERTED
-- =====================================================

-- Check if templates exist now
SELECT COUNT(*) as template_count FROM public.business_type_templates;
