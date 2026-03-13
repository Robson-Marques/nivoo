-- ============================================================================
-- DADOS MOCKADOS COMPLETOS - DELIVERY SYSTEM
-- Arquivo com dados de exemplo para testes e demonstração
-- ============================================================================

-- ============================================================================
-- 01. INSERIR RESTAURANTE
-- ============================================================================

INSERT INTO public.restaurants (name, description, logo_url, created_at, updated_at)
VALUES (
  'Burger House Premium',
  'O melhor hambúrguer artesanal da cidade. Ingredientes frescos, selecionados e preparados com carinho. Somos especializados em hambúrgueres premium, batatas crocantes e bebidas geladas. Surpreenda seu paladar com nossas criações exclusivas!',
  'https://images.unsplash.com/photo-1586816001966-79b736744398?q=80&w=768',
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 02. INSERIR CATEGORIAS
-- ============================================================================

INSERT INTO public.categories (name, description, image_url, display_order, created_at, updated_at)
VALUES
  ('Hambúrgueres', 'Hambúrgueres artesanais feitos com carne premium, queijo derretido e molhos especiais', 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=768', 1, now(), now()),
  ('Sanduíches', 'Sanduíches variados com frango, peixe e vegetais frescos', 'https://images.unsplash.com/photo-1567521464027-f127ff144326?q=80&w=768', 2, now(), now()),
  ('Acompanhamentos', 'Batatas fritas, onion rings, nuggets e muito mais', 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=768', 3, now(), now()),
  ('Bebidas', 'Refrigerantes, sucos naturais, cervejas e outras bebidas geradas', 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=768', 4, now(), now()),
  ('Sobremesas', 'Doces irresistíveis para finalizar sua experiência', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=768', 5, now(), now()),
  ('Saladas', 'Saladas frescas e nutritivas', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=768', 6, now(), now())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 03. INSERIR PRODUTOS - HAMBÚRGUERES
-- ============================================================================

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Classic Burger', 'Hambúrguer clássico com duas carnes, queijo, alface, tomate, cebola e molho especial', 28.90, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Cheese Burger', 'Hambúrguer suculento com queijo cheddar duplo, bacon, alface e tomate', 32.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Crispy Bacon Burger', 'Duas carnes, bacon bem crocante, queijo derretido e molho caseiro', 35.90, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Veggie Burger Premium', 'Hambúrguer 100% vegetariano com grão de bico, cenoura e especiarias', 31.90, 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Triplo Burger', 'Três carnes suculentas, queijo triplo, bacon e molho BBQ especial', 42.90, 'https://images.unsplash.com/photo-1609301291631-92bbb0ffc53a?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Monstro do Burger', 'O hambúrguer mais colossal: 4 carnes, 4 queijos, bacon, ovo e molhos especiais', 52.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Burger Picante', 'Carne suculenta, pimenta, jalapeños, queijo e molho picante explosivo', 33.90, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Burger Gourmet', 'Carne wagyu, queijo brie, rúcula, tomate seco e molho trufa', 48.90, 'https://images.unsplash.com/photo-1572802419224-296b814abb9f?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 04. INSERIR PRODUTOS - SANDUÍCHES
-- ============================================================================

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Sanduíche de Frango', 'Frango grelhado, maionese, alface, tomate e cebola roxa', 22.90, 'https://images.unsplash.com/photo-1567521464027-f127ff144326?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Sanduíches'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Sanduíche de Frango Crocante', 'Frango empanado e crocante com molho tártaro e salada fresca', 24.90, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Sanduíches'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Sandu de Peixe', 'Peixe fresco grelhado com lemon pepper, alface e molho especial', 26.90, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Sanduíches'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 05. INSERIR PRODUTOS - ACOMPANHAMENTOS
-- ============================================================================

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Batata Frita Premium', 'Batatas crocantes por fora e macias por dentro com sal de ervas', 18.90, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Acompanhamentos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Batata com Cheddar e Bacon', 'Batatas fritas cobertas com molho cheddar derretido e bacon crocante', 24.90, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Acompanhamentos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Onion Rings Crocantes', 'Anéis de cebola empanados e fritos até ficarem dourados e crocantes', 19.90, 'https://images.unsplash.com/photo-1639024471283-03518883512d?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Acompanhamentos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Nuggets de Frango', 'Porção com 12 unidades de nuggets crocantes e suculentos', 21.90, 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Acompanhamentos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Asas de Frango BBQ', 'Asas temperadas e cobertas com molho BBQ escuro', 23.90, 'https://images.unsplash.com/photo-1626082927389-6cd097cfd330?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Acompanhamentos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Bolinhas de Queijo', 'Bolinhas de queijo empanadas e fritas, servidas com molho marinara', 20.90, 'https://images.unsplash.com/photo-1586896797917-e1f81d2dfc0e?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Acompanhamentos'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 06. INSERIR PRODUTOS - BEBIDAS
-- ============================================================================

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Refrigerante Cola 350ml', 'Lata gelada de refrigerante cola clássico', 6.50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Refrigerante Guaran 350ml', 'Lata de Guaraná com aquele gosto único', 6.50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Suco de Laranja Natural 500ml', 'Suco natural de laranja, refrigerante e gelado', 10.90, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Suco de Melancia 500ml', 'Suco refrescante de melancia natural', 10.90, 'https://images.unsplash.com/photo-1585518419759-83b4e61b518a?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Água Mineral 500ml', 'Garrafa de água mineral gelada', 4.50, 'https://images.unsplash.com/photo-1638688569176-5b6db19f9d2a?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Cerveja Artesanal 355ml', 'Long neck de cerveja artesanal premium', 14.90, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Chopp Gelado 350ml', 'Chopp fresco e gelado direto do barril', 9.90, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Chá Gelado 500ml', 'Chá gelado refrescante em diversas frutas', 7.90, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Bebidas'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 07. INSERIR PRODUTOS - SOBREMESAS
-- ============================================================================

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Milkshake de Chocolate', 'Milkshake cremoso de chocolate com sorvete', 15.90, 'https://images.unsplash.com/photo-1619158401201-8fa932695178?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Sobremesas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Milkshake de Morango', 'Milkshake fresco de morango com sorvete', 15.90, 'https://images.unsplash.com/photo-1619158401201-8fa932695178?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Sobremesas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Brownie Quente', 'Brownie quente com sorvete de creme derretendo por cima', 14.90, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?q=80&w=768', true, true, 'default', now(), now()
FROM categories WHERE name = 'Sobremesas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Cheesecake', 'Cheesecake com calda de frutas vermelhas frescas', 16.90, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Sobremesas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Sorvete Premium 500ml', 'Pote de sorvete premium em diversos sabores', 13.90, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Sobremesas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Pudim de Leite Condensado', 'Pudim caseiro de leite condensado com calda de caramelo', 8.90, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Sobremesas'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 08. INSERIR PRODUTOS - SALADAS
-- ============================================================================

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Salada Verde Fresh', 'Alface, rúcula, tomate, cebola roxa e molho da casa', 19.90, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Saladas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Salada Caesar com Frango', 'Alface romana, frango grelhado, croutons e molho Caesar', 24.90, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Saladas'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, image_url, available, featured, configuration_template, created_at, updated_at)
SELECT id, 'Salada Grega', 'Tomate, pepino, cebola, azeitona preta e queijo feta', 21.90, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=768', true, false, 'default', now(), now()
FROM categories WHERE name = 'Saladas'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 09. INSERIR ADICIONAIS / COMPLEMENTOS
-- ============================================================================

INSERT INTO public.product_addons (name, description, price, available)
VALUES
  ('Bacon Extra', 'Fatias crocantes de bacon', 3.50, true),
  ('Queijo Cheddar Extra', 'Mais uma fatia de queijo cheddar derretido', 2.50, true),
  ('Queijo Mozzarella', 'Mozzarella fresca derretida', 3.00, true),
  ('Ovo Frito', 'Um ovo frito bem quentinho', 3.00, true),
  ('Molho Picante Extra', 'Molho ghost pepper extra picante', 1.50, true),
  ('Molho BBQ Premium', 'Molho barbecue defumado', 1.50, true),
  ('Molho Especial da Casa', 'Nossa receita secreta de molho', 1.50, true),
  ('Guacamole Fresco', 'Pasta de abacate feita na hora', 5.00, true),
  ('Cebola Roxa', 'Cebola roxa em fatias', 1.00, true),
  ('Tomate Fresco', 'Tomate em fatias frescas', 1.00, true),
  ('Alface Extra', 'Folhas de alface fresca', 1.00, true),
  ('Cogumelos Grelhados', 'Cogumelos frescos grelhados', 4.00, true),
  ('Abacaxi Grelhado', 'Fatias de abacaxi grelhadas', 3.50, true),
  ('Maionese Caseira', 'Maionese fresca caseira', 1.00, true),
  ('Maionese Alho', 'Maionese com alho defumado', 1.50, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. INSERIR RELAÇÕES PRODUTO-ADICIONAIS
-- ============================================================================

-- Classic Burger
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE p.name = 'Classic Burger' 
  AND a.name IN ('Bacon Extra', 'Queijo Cheddar Extra', 'Ovo Frito', 'Molho BBQ Premium', 'Molho Especial da Casa', 'Cebola Roxa', 'Tomate Fresco')
ON CONFLICT DO NOTHING;

-- Cheese Burger
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE p.name = 'Cheese Burger' 
  AND a.name IN ('Bacon Extra', 'Ovo Frito', 'Molho Picante Extra', 'Molho BBQ Premium', 'Cogumelos Grelhados', 'Cebola Roxa')
ON CONFLICT DO NOTHING;

-- Crispy Bacon Burger
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE p.name = 'Crispy Bacon Burger' 
  AND a.name IN ('Bacon Extra', 'Queijo Cheddar Extra', 'Molho Especial da Casa', 'Abacaxi Grelhado', 'Tomate Fresco')
ON CONFLICT DO NOTHING;

-- Veggie Burger
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE p.name = 'Veggie Burger' 
  AND a.name IN ('Queijo Mozzarella', 'Guacamole Fresco', 'Cogumelos Grelhados', 'Alface Extra', 'Tomate Fresco')
ON CONFLICT DO NOTHING;

-- Burger Gourmet
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE p.name = 'Burger Gourmet' 
  AND a.name IN ('Bacon Extra', 'Queijo Mozzarella', 'Guacamole Fresco', 'Cogumelos Grelhados', 'Abacaxi Grelhado')
ON CONFLICT DO NOTHING;

-- Batata Frita Premium
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE p.name = 'Batata Frita Premium' 
  AND a.name IN ('Molho Picante Extra', 'Molho BBQ Premium', 'Molho Especial da Casa', 'Maionese Caseira', 'Maionese Alho')
ON CONFLICT DO NOTHING;

-- Frango Grelhado
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE p.name = 'Sanduíche de Frango' 
  AND a.name IN ('Bacon Extra', 'Queijo Cheddar Extra', 'Molho Especial da Casa', 'Maionese Alho', 'Cebola Roxa')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. INSERIR HORÁRIOS DE FUNCIONAMENTO
-- ============================================================================

INSERT INTO public.business_hours (restaurant_id, day_of_week, open_time, close_time, is_closed, created_at, updated_at)
SELECT r.id, day, '11:00'::text, '23:00'::text, false, now(), now()
FROM public.restaurants r
CROSS JOIN (VALUES ('Monday'), ('Tuesday'), ('Wednesday'), ('Thursday'), ('Friday'), ('Saturday')) AS days(day)
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.business_hours (restaurant_id, day_of_week, open_time, close_time, is_closed, created_at, updated_at)
SELECT r.id, 'Sunday'::text, '12:00'::text, '22:00'::text, false, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. INSERIR REGIÕES DE ENTREGA
-- ============================================================================

INSERT INTO public.delivery_regions (name, city, neighborhood, fee, created_at, updated_at)
VALUES
  ('Centro', 'São Paulo', 'Centro', 5.00, now(), now()),
  ('Zona Sul', 'São Paulo', 'Pinheiros', 8.50, now(), now()),
  ('Zona Sul', 'São Paulo', 'Vila Mariana', 8.50, now(), now()),
  ('Zona Sul', 'São Paulo', 'Itaim Bibi', 9.00, now(), now()),
  ('Zona Norte', 'São Paulo', 'Santana', 10.00, now(), now()),
  ('Zona Norte', 'São Paulo', 'Vila Guilherme', 10.50, now(), now()),
  ('Zona Leste', 'São Paulo', 'Tatuapé', 11.00, now(), now()),
  ('Zona Oeste', 'São Paulo', 'Lapa', 7.50, now(), now()),
  ('Consolação', 'São Paulo', 'Consolação', 6.00, now(), now()),
  ('Higienópolis', 'São Paulo', 'Higienópolis', 7.00, now(), now())
ON CONFLICT (city, neighborhood) DO NOTHING;

-- ============================================================================
-- 13. INSERIR TEMPOS DE ENTREGA
-- ============================================================================

INSERT INTO public.delivery_times (restaurant_id, day_of_week, min_time, max_time, created_at, updated_at)
SELECT r.id, 'Monday'::character varying, 30, 45, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.delivery_times (restaurant_id, day_of_week, min_time, max_time, created_at, updated_at)
SELECT r.id, 'Tuesday'::character varying, 30, 45, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.delivery_times (restaurant_id, day_of_week, min_time, max_time, created_at, updated_at)
SELECT r.id, 'Wednesday'::character varying, 30, 45, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.delivery_times (restaurant_id, day_of_week, min_time, max_time, created_at, updated_at)
SELECT r.id, 'Thursday'::character varying, 30, 45, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.delivery_times (restaurant_id, day_of_week, min_time, max_time, created_at, updated_at)
SELECT r.id, 'Friday'::character varying, 30, 60, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.delivery_times (restaurant_id, day_of_week, min_time, max_time, created_at, updated_at)
SELECT r.id, 'Saturday'::character varying, 40, 70, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.delivery_times (restaurant_id, day_of_week, min_time, max_time, created_at, updated_at)
SELECT r.id, 'Sunday'::character varying, 40, 70, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. INSERIR MOTORISTAS
-- ============================================================================

INSERT INTO public.drivers (name, phone, vehicle, status, created_at, updated_at)
VALUES
  ('João Silva', '+55 11 98765-4321', 'Moto Vermelha - Placa XYZ1234', 'active', now(), now()),
  ('Carlos Santos', '+55 11 98765-4322', 'Carro Branco - Placa ABC5678', 'active', now(), now()),
  ('Maria Oliveira', '+55 11 98765-4323', 'Moto Preta - Placa DEF9012', 'active', now(), now()),
  ('Pedro Costa', '+55 11 98765-4324', 'Bicicleta - Cesta Amarela', 'inactive', now(), now()),
  ('Ana Paula', '+55 11 98765-4325', 'Moto Azul - Placa GHI3456', 'active', now(), now())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. INSERIR MÉTODOS DE PAGAMENTO
-- ============================================================================

INSERT INTO public.payment_methods (restaurant_id, name, description, icon, display_order, enabled, created_at, updated_at)
SELECT r.id, 'Dinheiro', 'Pagamento em dinheiro na entrega', 'cash', 1, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.payment_methods (restaurant_id, name, description, icon, display_order, enabled, created_at, updated_at)
SELECT r.id, 'Cartão de Crédito', 'Pagamento via cartão de crédito', 'credit-card', 2, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.payment_methods (restaurant_id, name, description, icon, display_order, enabled, created_at, updated_at)
SELECT r.id, 'Cartão de Débito', 'Pagamento via cartão de débito', 'debit-card', 3, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.payment_methods (restaurant_id, name, description, icon, display_order, enabled, created_at, updated_at)
SELECT r.id, 'Pix', 'Transferência instantânea via Pix', 'pix', 4, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.payment_methods (restaurant_id, name, description, icon, display_order, enabled, created_at, updated_at)
SELECT r.id, 'Boleto', 'Pagamento via boleto bancário', 'boleto', 5, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. INSERIR BANNERS / PROMOÇÕES
-- ============================================================================

INSERT INTO public.banners (restaurant_id, image_url, link, "order", active, created_at, updated_at)
SELECT r.id, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=768', '/promo/triplice', 1, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.banners (restaurant_id, image_url, link, "order", active, created_at, updated_at)
SELECT r.id, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=768', '/promo/batatas', 2, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.banners (restaurant_id, image_url, link, "order", active, created_at, updated_at)
SELECT r.id, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=768', '/promo/sobremesas', 3, true, now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. INSERIR REDES SOCIAIS
-- ============================================================================

INSERT INTO public.social_media (restaurant_id, platform, url, created_at, updated_at)
SELECT r.id, 'Instagram', 'https://instagram.com/burgherhousepremium', now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT (restaurant_id, platform) DO NOTHING;

INSERT INTO public.social_media (restaurant_id, platform, url, created_at, updated_at)
SELECT r.id, 'Facebook', 'https://facebook.com/burgherhousepremium', now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT (restaurant_id, platform) DO NOTHING;

INSERT INTO public.social_media (restaurant_id, platform, url, created_at, updated_at)
SELECT r.id, 'WhatsApp', 'https://wa.me/5511987654321', now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT (restaurant_id, platform) DO NOTHING;

INSERT INTO public.social_media (restaurant_id, platform, url, created_at, updated_at)
SELECT r.id, 'TikTok', 'https://tiktok.com/@burgherhousepremium', now(), now()
FROM public.restaurants r
WHERE r.name = 'Burger House Premium'
ON CONFLICT (restaurant_id, platform) DO NOTHING;

-- ============================================================================
-- 18. INSERIR ALGUMAS IMAGENS DE PRODUTOS
-- ============================================================================

INSERT INTO public.product_images (product_id, image_url, display_order, created_at, updated_at)
SELECT p.id, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=768', 1, now(), now()
FROM public.products p
WHERE p.name = 'Classic Burger'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, display_order, created_at, updated_at)
SELECT p.id, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=400', 2, now(), now()
FROM public.products p
WHERE p.name = 'Classic Burger'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, display_order, created_at, updated_at)
SELECT p.id, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=768', 1, now(), now()
FROM public.products p
WHERE p.name = 'Cheese Burger'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, display_order, created_at, updated_at)
SELECT p.id, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=768', 1, now(), now()
FROM public.products p
WHERE p.name = 'Crispy Bacon Burger'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, display_order, created_at, updated_at)
SELECT p.id, 'https://images.unsplash.com/photo-1572802419224-296b814abb9f?q=80&w=768', 1, now(), now()
FROM public.products p
WHERE p.name = 'Burger Gourmet'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 19. INSERIR ALGUNS PEDIDOS DE TESTE
-- ============================================================================

INSERT INTO public.orders (
    number,
    customer_name,
    customer_phone,
    status,
    payment_method,
    payment_status,
    order_type,
    subtotal,
    delivery_fee,
    discount,
    total,
    notes,
    delivery_status,
    delivery_address,
    created_at,
    updated_at
) VALUES (
    'ORD-20260225-0001',
    'João da Silva',
    '+55 11 98765-1234',
    'completed',
    'credit_card',
    'paid',
    'delivery',
    79.80,
    5.00,
    0.00,
    84.80,
    'Sem tomate no hambúrguer',
    'delivered',
    'Rua das Flores, 123 - Apto 42 - Centro',
    now() - INTERVAL '2 hours',
    now() - INTERVAL '1 hour'
);

INSERT INTO public.orders (
    number,
    customer_name,
    customer_phone,
    status,
    payment_method,
    payment_status,
    order_type,
    subtotal,
    delivery_fee,
    discount,
    total,
    notes,
    delivery_status,
    delivery_address,
    created_at,
    updated_at
) VALUES (
    'ORD-20260225-0002',
    'Maria Santos',
    '+55 11 98765-5678',
    'in_preparation',
    'pix',
    'pending',
    'delivery',
    125.70,
    8.50,
    15.00,
    119.20,
    'Muito molho BBQ',
    'preparing',
    'Avenida Paulista, 456 - Apto 101 - Bela Vista',
    now() - INTERVAL '30 minutes',
    now() - INTERVAL '15 minutes'
);

INSERT INTO public.orders (
    number,
    customer_name,
    customer_phone,
    status,
    payment_method,
    payment_status,
    order_type,
    subtotal,
    delivery_fee,
    discount,
    total,
    notes,
    delivery_status,
    delivery_address,
    created_at,
    updated_at
) VALUES (
    'ORD-20260225-0003',
    'Pedro Costa',
    '+55 11 98765-9999',
    'pending',
    'cash',
    'pending',
    'delivery',
    95.60,
    10.00,
    0.00,
    105.60,
    'Entrega rápida, por favor!',
    'pending',
    'Rua Conceição, 789 - Santana',
    now() - INTERVAL '5 minutes',
    now() - INTERVAL '5 minutes'
);

-- ============================================================================
-- 20. INSERIR ITENS DOS PEDIDOS
-- ============================================================================

INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, notes, created_at)
SELECT o.id, p.id, 2, 28.90, 57.80, 'Sem cebola em um deles', now()
FROM public.orders o
CROSS JOIN public.products p
WHERE o.number = 'ORD-20260225-0001'
  AND p.name = 'Classic Burger'
ON CONFLICT DO NOTHING;

INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, notes, created_at)
SELECT o.id, p.id, 1, 18.90, 18.90, '', now()
FROM public.orders o
CROSS JOIN public.products p
WHERE o.number = 'ORD-20260225-0001'
  AND p.name = 'Batata Frita Premium'
ON CONFLICT DO NOTHING;

INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, notes, created_at)
SELECT o.id, p.id, 2, 15.90, 31.80, '', now()
FROM public.orders o
CROSS JOIN public.products p
WHERE o.number = 'ORD-20260225-0001'
  AND p.name = 'Milkshake de Chocolate'
ON CONFLICT DO NOTHING;

INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, notes, created_at)
SELECT o.id, p.id, 3, 35.90, 107.70, 'Tudo com bacon extra', now()
FROM public.orders o
CROSS JOIN public.products p
WHERE o.number = 'ORD-20260225-0002'
  AND p.name = 'Crispy Bacon Burger'
ON CONFLICT DO NOTHING;

INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, notes, created_at)
SELECT o.id, p.id, 1, 18.00, 18.00, '', now()
FROM public.orders o
CROSS JOIN public.products p
WHERE o.number = 'ORD-20260225-0002'
  AND p.name = 'Onion Rings Crocantes'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DA INSERÇÃO DE DADOS MOCKADOS
-- ============================================================================

-- Total de registros inseridos:
-- - 1 Restaurante
-- - 6 Categorias
-- - 26 Produtos
-- - 15 Adicionais
-- - 10 Regiões de Entrega
-- - 7 Horários de Funcionamento
-- - 7 Tempos de Entrega
-- - 5 Motoristas
-- - 5 Métodos de Pagamento
-- - 3 Banners
-- - 4 Redes Sociais
-- - 3 Pedidos de Exemplo
-- - Múltiplas imagens de produtos
-- - Relações de produtos com adicionais

-- Dados prontos para testes e demonstração do sistema de delivery
