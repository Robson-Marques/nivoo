-- =====================================================
-- COPIE E EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- Link: https://app.supabase.co/project/_/sql/new
-- =====================================================

-- 1. PRIMEIRO, VEJA QUANTOS TEMPLATES JÁ TEM
SELECT COUNT(*) as total_templates FROM public.business_type_templates;

-- Se retornar 0, execute os próximos STEPs:

-- =====================================================
-- STEP 1: LIMPAR (opcional - apenas se tiver dados ruins)
-- =====================================================
-- DELETE FROM public.template_configurations;
-- DELETE FROM public.template_addons;
-- DELETE FROM public.business_type_templates;

-- =====================================================
-- STEP 2: INSERIR OS 10 TEMPLATES PADRÃO
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
  ('other', '🏪 Outro', 'Template genérico para outros tipos de negócio', '🏪', true, now(), now())
ON CONFLICT (business_type) DO NOTHING;

-- =====================================================
-- STEP 3: VERIFICAR QUE FORAM INSERIDOS
-- =====================================================

SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as ativos,
  COUNT(CASE WHEN NOT is_active THEN 1 END) as inativos
FROM public.business_type_templates;

-- =====================================================
-- STEP 4: LISTAR TODOS PARA CONFIRMAR
-- =====================================================

SELECT 
  id,
  business_type,
  display_name,
  icon_emoji,
  is_active
FROM public.business_type_templates
ORDER BY display_name;

-- =====================================================
-- SE TODOS OS INSERTS FUNCIONAREM:
-- 1. Volte ao navegador (http://localhost:8097)
-- 2. Abra DevTools (F12)
-- 3. Vá à aba Console
-- 4. Acesse: Configurações → Customização
-- 5. Veja os logs:
--    📋 [templateService.getAllTemplates] Buscando templates...
--    ✅ [templateService.getAllTemplates] 10 templates encontrados
-- =====================================================
