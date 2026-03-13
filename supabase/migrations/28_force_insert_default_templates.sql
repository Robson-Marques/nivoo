-- =====================================================
-- Migration 28: Force Insert Default Business Templates
-- Propósito: Forçar inserção de templates padrão
-- Data: 2026-03-11
-- =====================================================

-- Limpar templates existentes (opcionalmente, descomente se necessário)
-- DELETE FROM public.business_type_templates;

-- Insert templates padrão - usando UPSERT para garantir
INSERT INTO public.business_type_templates (
  id,
  business_type, 
  display_name, 
  description, 
  icon_emoji, 
  is_active,
  created_at,
  updated_at
)
VALUES
  (gen_random_uuid(), 'pizzeria', '🍕 Pizzeria', 'Template para pizzarias com opções de massa, recheios e tamanhos', '🍕', true, now(), now()),
  (gen_random_uuid(), 'hamburger_shop', '🍔 Hamburgueria', 'Template para hamburguarias com opções de carne, acompanhamentos e molhos', '🍔', true, now(), now()),
  (gen_random_uuid(), 'restaurant', '🍽️ Restaurante', 'Template para restaurantes com pratos executivos, carnes e acompanhamentos', '🍽️', true, now(), now()),
  (gen_random_uuid(), 'pastry_shop', '🥐 Pastelaria', 'Template para pastelarias com tamanhos, massas e recheios', '🥐', true, now(), now()),
  (gen_random_uuid(), 'snack_bar', '🌮 Lanchonete', 'Template para lanchonetes com lanches, bebidas e acompanhamentos', '🌮', true, now(), now()),
  (gen_random_uuid(), 'acai_shop', '🥣 Açaí', 'Template para lojas de açaí com frutas, acompanhamentos e tamanhos', '🥣', true, now(), now()),
  (gen_random_uuid(), 'bar', '🍺 Bar', 'Template para bares com bebidas, petiscos e drinques', '🍺', true, now(), now()),
  (gen_random_uuid(), 'cafe', '☕ Café', 'Template para cafeterias com bebidas quentes, frias e docinhos', '☕', true, now(), now()),
  (gen_random_uuid(), 'bakery', '🥖 Padaria', 'Template para padarias com pães, bolos e doces', '🥖', true, now(), now()),
  (gen_random_uuid(), 'other', '🏪 Outro', 'Template genérico para outros tipos de negócio', '🏪', true, now(), now())
ON CONFLICT (business_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon_emoji = EXCLUDED.icon_emoji,
  is_active = true,
  updated_at = now();

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Templates padrão inseridos/atualizados com sucesso. Total: %', 
    (SELECT COUNT(*) FROM public.business_type_templates);
END $$;
