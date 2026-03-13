-- =====================================================
-- Migration 29: Force Clean and Insert Templates
-- Propósito: Limpar e reinserir templates para garantir que existem
-- Data: 2026-03-11
-- =====================================================

-- =====================================================
-- 1. LIMPAR DADOS EXISTENTES (Cuidado: Isso vai deletar relatives)
-- =====================================================
DELETE FROM public.template_configurations;
DELETE FROM public.template_addons;
DELETE FROM public.business_type_templates;

-- =====================================================
-- 2. INSERIR TEMPLATES PADRÃO GARANTIDO
-- =====================================================

INSERT INTO public.business_type_templates (
  business_type,
  display_name,
  description,
  icon_emoji,
  is_active,
  created_at,
  updated_at
) VALUES
  ('pizzeria', '🍕 Pizzeria', 'Template para pizzarias com opções de massa, recheios e tamanhos', '🍕', true, now(), now()),
  ('hamburger_shop', '🍔 Hamburgueria', 'Template para hamburguarias com opções de carne, acompanhamentos e molhos', '🍔', true, now(), now()),
  ('restaurant', '🍽️ Restaurante', 'Template para restaurantes com pratos executivos, carnes e acompanhamentos', '🍽️', true, now(), now()),
  ('pastry_shop', '🥐 Pastelaria', 'Template para pastelarias com tamanhos, massas e recheios', '🥐', true, now(), now()),
  ('snack_bar', '🌮 Lanchonete', 'Template para lanchonetes com lanches, bebidas e acompanhamentos', '🌮', true, now(), now()),
  ('acai_shop', '🥣 Açaí', 'Template para lojas de açaí com frutas, acompanhamentos e tamanhos', '🥣', true, now(), now()),
  ('bar', '🍺 Bar', 'Template para bares com bebidas, petiscos e drinques', '🍺', true, now(), now()),
  ('cafe', '☕ Café', 'Template para cafeterias com bebidas quentes, frias e docinhos', '☕', true, now(), now()),
  ('bakery', '🥖 Padaria', 'Template para padarias com pães, bolos e doces', '🥖', true, now(), now()),
  ('other', '🏪 Outro', 'Template genérico para outros tipos de negócio', '🏪', true, now(), now());

-- =====================================================
-- 3. VERIFICAR QUE FOI INSERIDO
-- =====================================================

SELECT 
  COUNT(*) as total_templates,
  COUNT(CASE WHEN is_active THEN 1 END) as templates_ativos
FROM public.business_type_templates;

-- =====================================================
-- 4. LISTAR TODOS PARA VERIFICAÇÃO
-- =====================================================

SELECT 
  id,
  business_type,
  display_name,
  is_active,
  created_at
FROM public.business_type_templates
ORDER BY display_name;

-- =====================================================
-- Migration 29 Complete
-- =====================================================
