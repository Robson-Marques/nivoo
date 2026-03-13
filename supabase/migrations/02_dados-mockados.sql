-- =====================================================
-- 🎯 DADOS DE EXEMPLO - POPULATION INICIAL
-- =====================================================
-- Execute APÓS: FINAL_CONSOLIDATED_DATABASE.sql
-- Arquivo: 02_dados-mockados.sql
-- Propósito: Inserir dados de exemplo (categor, produtos, etc)
-- ⚠️ NOTA: Remova estes dados antes de vender para cliente final
-- =====================================================

-- =====================================================
-- LIMPAR DADOS ANTERIORES (se existirem)
-- =====================================================

DELETE FROM public.order_item_addons;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.product_addon_relations;
DELETE FROM public.product_addons;
DELETE FROM public.products;
DELETE FROM public.categories;
DELETE FROM public.banners;
DELETE FROM public.social_media;
DELETE FROM public.restaurants;
DELETE FROM public.payment_methods;
DELETE FROM public.business_hours;
DELETE FROM public.delivery_regions;

-- =====================================================
-- SEÇÃO 1: CONFIGURAÇÃO BASE
-- =====================================================

-- Insert default payment methods (OBRIGATÓRIO)
INSERT INTO public.payment_methods (name, description, icon, enabled)
VALUES 
    ('Dinheiro', 'Pagamento em espécie', 'banknote', true),
    ('Cartão de Crédito', 'Visa, Mastercard, etc', 'credit-card', true),
    ('Cartão de Débito', 'Visa, Mastercard, etc', 'credit-card', true),
    ('PIX', 'Transferência instantânea', 'qr-code', true),
    ('Vale Refeição', 'Alelo, Sodexo, VR, etc', 'credit-card', true);

-- Insert sample delivery regions
INSERT INTO public.delivery_regions (name, fee, city, neighborhood) VALUES
    ('Centro - Região 1', 5.00, 'São Paulo', 'Centro'),
    ('Zona Norte - Região 2', 8.00, 'São Paulo', 'Zona Norte'),
    ('Zona Sul - Região 3', 10.00, 'São Paulo', 'Zona Sul'),
    ('Zona Leste - Região 4', 12.00, 'São Paulo', 'Zona Leste'),
    ('Zona Oeste - Região 5', 15.00, 'São Paulo', 'Zona Oeste');

-- Insert sample business hours
INSERT INTO public.business_hours (day_of_week, open_time, close_time, is_closed) VALUES
    ('Segunda-feira', '11:00:00', '23:00:00', false),
    ('Terça-feira', '11:00:00', '23:00:00', false),
    ('Quarta-feira', '11:00:00', '23:00:00', false),
    ('Quinta-feira', '11:00:00', '23:00:00', false),
    ('Sexta-feira', '11:00:00', '23:00:00', false),
    ('Sábado', '11:00:00', '23:00:00', false),
    ('Domingo', '11:00:00', '23:00:00', false);

-- =====================================================
-- SEÇÃO 2: RESTAURANTE PADRÃO
-- =====================================================

INSERT INTO public.restaurants (name, description, address, phone, logo_url, banner_url, open_time, close_time, delivery_fee, min_order_value)
VALUES (
  'Burger House',
  'O melhor hambúrguer artesanal da cidade. Ingredientes frescos e selecionados para uma experiência gastronômica única.',
  'Rua dos Hamburgueres, 123 - Centro',
  '+55 11 99999-9999',
  'https://images.unsplash.com/photo-1586816001966-79b736744398?q=80&w=768',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=768',
  '11:00',
  '23:00',
  5.00,
  20.00
);

-- =====================================================
-- SEÇÃO 3: CATEGORIAS DE PRODUTOS
-- =====================================================

INSERT INTO public.categories (name, description, display_order, image_url)
VALUES
  ('Hambúrgueres', 'Deliciosos hambúrgueres artesanais', 1, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=768'),
  ('Bebidas', 'Refrigerantes, sucos e bebidas alcoólicas', 2, 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=768'),
  ('Porções', 'Porções para compartilhar', 3, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=768'),
  ('Sobremesas', 'Doces para finalizar sua refeição', 4, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=768');

-- =====================================================
-- SEÇÃO 4: ADICIONAIS (TOPPINGS, EXTRAS)
-- =====================================================

INSERT INTO public.product_addons (name, description, price, available, is_global, max_options)
VALUES 
    ('Bacon', 'Adicional de bacon', 3.00, true, true, 2),
    ('Cheddar', 'Extra de cheddar', 2.50, true, true, 2),
    ('Ovo', 'Ovo frito', 2.00, true, true, 1),
    ('Queijo Extra', 'Fatia adicional de queijo', 2.50, true, true, 2),
    ('Molho da Casa', 'Molho especial da casa', 1.50, true, true, 1),
    ('Molho BBQ', 'Molho barbecue', 1.50, true, true, 1),
    ('Molho Picante', 'Molho com pimenta', 1.50, true, true, 1),
    ('Guacamole', 'Pasta de abacate', 4.00, true, false, 1);

-- =====================================================
-- SEÇÃO 5: PRODUTOS
-- =====================================================

INSERT INTO public.products (name, description, price, image_url, category_id, available, featured)
VALUES
  ('Classic Burger', 'Hambúrguer clássico com queijo, alface, tomate e molho especial', 25.90, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres' LIMIT 1), true, true),
  ('Cheese Burger', 'Hambúrguer com queijo cheddar duplo', 28.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres' LIMIT 1), true, false),
  ('Bacon Burger', 'Hambúrguer com muito bacon crocante', 32.90, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres' LIMIT 1), true, true),
  ('Veggie Burger', 'Hambúrguer vegetariano de grão de bico', 30.90, 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres' LIMIT 1), true, false),
  
  ('Refrigerante Cola', 'Lata 350ml', 6.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1), true, false),
  ('Suco de Laranja', 'Natural 500ml', 9.90, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1), true, false),
  ('Água Mineral', 'Garrafa 500ml', 4.50, 'https://images.unsplash.com/photo-1638688569176-5b6db19f9d2a?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1), true, false),
  ('Cerveja Artesanal', 'Long neck 355ml', 12.90, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1), true, false),
  
  ('Batata Frita', 'Porção grande com cheddar e bacon', 22.90, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=768', (SELECT id FROM categories WHERE name = 'Porções' LIMIT 1), true, true),
  ('Onion Rings', 'Anéis de cebola empanados', 18.90, 'https://images.unsplash.com/photo-1639024471283-03518883512d?q=80&w=768', (SELECT id FROM categories WHERE name = 'Porções' LIMIT 1), true, false),
  ('Nuggets', 'Porção com 10 unidades', 19.90, 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=768', (SELECT id FROM categories WHERE name = 'Porções' LIMIT 1), true, false),
  
  ('Milkshake', 'Chocolate ou baunilha 400ml', 14.90, 'https://images.unsplash.com/photo-1619158401201-8fa932695178?q=80&w=768', (SELECT id FROM categories WHERE name = 'Sobremesas' LIMIT 1), true, false),
  ('Brownie', 'Com sorvete de creme', 12.90, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?q=80&w=768', (SELECT id FROM categories WHERE name = 'Sobremesas' LIMIT 1), true, true),
  ('Cheesecake', 'Com calda de frutas vermelhas', 15.90, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=768', (SELECT id FROM categories WHERE name = 'Sobremesas' LIMIT 1), true, false);

-- =====================================================
-- SEÇÃO 6: RELAÇÕES PRODUTO + ADICIONAIS
-- =====================================================

INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT 
  p.id,
  a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE (p.name IN ('Classic Burger', 'Cheese Burger', 'Bacon Burger', 'Veggie Burger') 
       AND a.name IN ('Bacon', 'Cheddar', 'Ovo', 'Queijo Extra', 'Molho da Casa', 'Molho BBQ', 'Molho Picante', 'Guacamole'))
   OR (p.name = 'Batata Frita' 
       AND a.name IN ('Bacon', 'Cheddar', 'Queijo Extra', 'Molho da Casa', 'Molho BBQ'));

-- =====================================================
-- ✅ DADOS DE EXEMPLO POPULADOS COM SUCESSO!
-- =====================================================
--
-- 🎉 Agora você tem:
--
-- ✓ 5 Métodos de pagamento
-- ✓ 5 Regiões de entrega
-- ✓ 1 Restaurante completo (Burger House)
-- ✓ 4 Categorias de produtos
-- ✓ 14 Produtos
-- ✓ 8 Adicionais (toppings)
-- ✓ 7 Dias de funcionamento
--
-- 📝 PRÓXIMOS PASSOS:
--
-- 1. Test o sistema acessando http://localhost:8083
-- 2. Reclame um pedido de teste com som
-- 3. Configure seu próprio restaurante via admin
-- 4. Customize categorias, produtos, adicionais
-- 5. Upload seu logo e banner
-- 6. Configure notificações sonoras
--
-- ⚠️ ANTES DE VENDER PARA CLIENTE:
-- Execute em produção apenas: FINAL_CONSOLIDATED_DATABASE.sql
-- NÃO execute este arquivo (dados-mockados.sql) em cliente final!
-- =====================================================
