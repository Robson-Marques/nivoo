-- =====================================================
-- Migration 25: Complete Remaining Business Templates
-- Propósito: Adicionar configurações e adicionais para Bar, Café, Pastelaria, Lanchonete, Restaurante, Padaria
-- Data: 2026-03-11
-- =====================================================

-- =====================================================
-- 1. INSERT DEFAULT CONFIGURATIONS FOR RESTAURANTE
-- =====================================================

WITH restaurante_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'restaurant'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM restaurante_template t
CROSS JOIN (
    VALUES
        ('prato_tipo', 'Tipo de Prato', 'select', true, 1, '["Prato Executivo", "À La Carte", "Prato Especial"]'::text, 'Escolha o tipo de prato'),
        ('ponto_carne', 'Ponto da Carne', 'select', false, 2, '["Mal Passado", "Ao Ponto", "Bem Passado", "Bem Assado"]'::text, 'Escolha o ponto da carne'),
        ('acompanhamentos', 'Acompanhamentos', 'checkbox', false, 3, '["Arroz", "Feijão", "Salada", "Batata Frita", "Polenta Frita"]'::text, 'Escolha os acompanhamentos'),
        ('bebida', 'Bebida', 'select', false, 4, '["Sem Bebida", "Suco Natural", "Refrigerante", "Água", "Vinho"]'::text, 'Escolha uma bebida'),
        ('sobremesa', 'Sobremesa', 'select', false, 5, '["Sem Sobremesa", "Mousse", "Pudim", "Tiramisu", "Fruta"]'::text, 'Escolha uma sobremesa')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. INSERT DEFAULT ADDONS FOR RESTAURANTE
-- =====================================================

WITH restaurante_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'restaurant'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM restaurante_template t
CROSS JOIN (
    VALUES
        ('Carne Extra', 'Porção adicional de carne', 15.00, 1, 'Carnes', true),
        ('Camarão', 'Camarão fresco', 18.00, 2, 'Frutos do Mar', true),
        ('Queijo Derretido', 'Queijo meia cura', 5.00, 3, 'Complementos', true),
        ('Bacon Extra', 'Bacon crocante', 4.00, 4, 'Complementos', true),
        ('Molho Caseiro', 'Molho especial da casa', 3.00, 5, 'Molhos', true),
        ('Nata', 'Creme de leite', 2.50, 6, 'Complementos', true),
        ('Refrigerante 2L', 'Refrigerante familiar', 10.00, 7, 'Bebidas', true),
        ('Cerveja Artesanal', 'Cerveja artesanal 600ml', 15.00, 8, 'Bebidas', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. INSERT DEFAULT CONFIGURATIONS FOR PASTELARIA
-- =====================================================

WITH pastelaria_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'pastry_shop'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM pastelaria_template t
CROSS JOIN (
    VALUES
        ('tamanho', 'Tamanho', 'select', true, 1, '["Pequena", "Média", "Grande"]'::text, 'Escolha o tamanho'),
        ('massa', 'Tipo de Massa', 'select', true, 2, '["Massa Tradicional", "Massa Integral", "Sem Glúten"]'::text, 'Escolha o tipo de massa'),
        ('recheio', 'Recheio', 'select', true, 3, '["Frango", "Carne", "Queijo", "Palmito", "Camarão"]'::text, 'Escolha o recheio'),
        ('bebida', 'Bebida', 'select', false, 4, '["Café Simples", "Café com Leite", "Chá", "Suco", "Sem Bebida"]'::text, 'Escolha uma bebida quente ou fria'),
        ('acompanhamento', 'Acompanhamento', 'select', false, 5, '["Sem Acompanhamento", "Brigadeiro", "Doce de Leite", "Goiabada"]'::text, 'Escolha um acompanhamento doce')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. INSERT DEFAULT ADDONS FOR PASTELARIA
-- =====================================================

WITH pastelaria_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'pastry_shop'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM pastelaria_template t
CROSS JOIN (
    VALUES
        ('Queijo Extra', 'Queijo meia cura adicional', 3.00, 1, 'Extras', true),
        ('Carne Extra', 'Carne adicional', 4.00, 2, 'Extras', true),
        ('Camarão Extra', 'Camarão fresco adicional', 8.00, 3, 'Extras', true),
        ('Molho de Pimenta', 'Molho caseiro picante', 1.50, 4, 'Molhos', true),
        ('Maionese Especial', 'Maionese temperada', 1.50, 5, 'Molhos', true),
        ('Café Grande', 'Café coado extra', 3.00, 6, 'Bebidas', true),
        ('Leite Quente', 'Leite integral quente', 2.00, 7, 'Bebidas', true),
        ('Bolo de Chocolate', 'Fatia de bolo caseiro', 5.00, 8, 'Doces', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. INSERT DEFAULT CONFIGURATIONS FOR LANCHONETE
-- =====================================================

WITH lanchonete_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'snack_bar'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM lanchonete_template t
CROSS JOIN (
    VALUES
        ('tipo_sanduiche', 'Tipo de Sanduíche', 'select', true, 1, '["X-Burguer", "X-Salada", "X-Bacon", "Misto Quente", "Bauru"]'::text, 'Escolha o tipo de sanduíche'),
        ('tamanho', 'Tamanho', 'select', true, 2, '["Simples", "Duplo", "Triplo", "Gigante"]'::text, 'Escolha o tamanho'),
        ('acompanhamento', 'Acompanhamento', 'select', false, 3, '["Batata Frita", "Batata Palha", "Anéis de Cebola", "Sem Acompanhamento"]'::text, 'Escolha o acompanhamento'),
        ('bebida', 'Bebida', 'select', false, 4, '["Sem Bebida", "Refrigerante", "Suco", "Chá Gelado", "Achocolatado"]'::text, 'Escolha uma bebida'),
        ('combos', 'Incluir no Combo', 'checkbox', false, 5, '["Batata Frita", "Bebida", "Sobremesa"]'::text, 'Adicione itens ao combo')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. INSERT DEFAULT ADDONS FOR LANCHONETE
-- =====================================================

WITH lanchonete_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'snack_bar'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM lanchonete_template t
CROSS JOIN (
    VALUES
        ('Queijo Extra', 'Queijo derretido adicional', 2.50, 1, 'Extras', true),
        ('Bacon Crocante', 'Bacon frito crispy', 3.50, 2, 'Extras', true),
        ('Ovo Frito', 'Ovo gema mole', 2.00, 3, 'Extras', true),
        ('Tomate Fatiado', 'Tomate vermelho fresco', 1.50, 4, 'Vegetais', true),
        ('Maionese Especial', 'Maionese temperada', 1.00, 5, 'Molhos', true),
        ('Coca Cola 2L', 'Refrigerante Coca Cola', 9.50, 6, 'Bebidas', true),
        ('Suco Natural', 'Suco de fruta natural', 6.00, 7, 'Bebidas', true),
        ('Sorvete', 'Sorvete de baunilha', 5.00, 8, 'Sobremesas', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. INSERT DEFAULT CONFIGURATIONS FOR BAR
-- =====================================================

WITH bar_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'bar'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM bar_template t
CROSS JOIN (
    VALUES
        ('tipo_bebida', 'Tipo de Bebida', 'select', true, 1, '["Cerveja", "Drink", "Destilado", "Coquetel", "Chopp"]'::text, 'Escolha o tipo de bebida'),
        ('tamanho', 'Tamanho', 'select', true, 2, '["Pequeno (300ml)", "Médio (600ml)", "Grande (1L)"]'::text, 'Escolha o tamanho'),
        ('gelo', 'Gelo', 'select', false, 3, '["Com Gelo", "Sem Gelo", "Bastante Gelo"]'::text, 'Escolha a quantidade de gelo'),
        ('limao', 'Limão', 'checkbox', false, 4, '["Com Limão", "Sem Limão"]'::text, 'Adicione limão'),
        ('acompanhamento', 'Acompanhamento', 'select', false, 5, '["Sem Acompanhamento", "Aperitivo Misto", "Peixe Frito", "Asa de Frango"]'::text, 'Escolha um acompanhamento')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. INSERT DEFAULT ADDONS FOR BAR
-- =====================================================

WITH bar_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'bar'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM bar_template t
CROSS JOIN (
    VALUES
        ('Asa de Frango', 'Asa de frango temperada', 12.00, 1, 'Petiscos', true),
        ('Peixe Frito', 'Peixe fresco frito', 15.00, 2, 'Petiscos', true),
        ('Bolinhas de Queijo', 'Bolinhas de queijo derretido', 8.00, 3, 'Petiscos', true),
        ('Batata Frita Premium', 'Batata frita caseira', 7.00, 4, 'Acompanhamentos', true),
        ('Limão Extra', 'Limão adicional', 1.00, 5, 'Extras', true),
        ('Energético', 'Bebida energética 250ml', 8.00, 6, 'Bebidas', true),
        ('Água Tônica', 'Água tônica premium', 5.00, 7, 'Bebidas', true),
        ('Gelo Extra', 'Gelo complementar', 2.00, 8, 'Extras', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. INSERT DEFAULT CONFIGURATIONS FOR CAFE
-- =====================================================

WITH cafe_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'cafe'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM cafe_template t
CROSS JOIN (
    VALUES
        ('tipo_cafe', 'Tipo de Café', 'select', true, 1, '["Café Espresso", "Café com Leite", "Cappuccino", "Macchiato", "Cortado"]'::text, 'Escolha o tipo de café'),
        ('tamanho', 'Tamanho', 'select', true, 2, '["Pequeno (200ml)", "Médio (300ml)", "Grande (400ml)"]'::text, 'Escolha o tamanho'),
        ('leite', 'Tipo de Leite', 'select', false, 3, '["Leite Integral", "Leite Desnatado", "Leite de Amêndoa", "Leite de Coco"]'::text, 'Escolha o tipo de leite'),
        ('adocante', 'Adoçante', 'select', false, 4, '["Sem Adoçante", "Açúcar", "Mel", "Xarope de Baunilha", "Xarope de Avelã"]'::text, 'Escolha o adoçante'),
        ('acompanhamento', 'Acompanhamento Doce', 'select', false, 5, '["Sem Acompanhamento", "Bolo", "Croissant", "Biscoito", "Donut"]'::text, 'Escolha um doce para acompanhar')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. INSERT DEFAULT ADDONS FOR CAFE
-- =====================================================

WITH cafe_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'cafe'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM cafe_template t
CROSS JOIN (
    VALUES
        ('Extra Shot de Espresso', 'Shot adicional de espresso', 2.50, 1, 'Café', true),
        ('Canela em Pó', 'Canela fresca ralada', 1.00, 2, 'Complementos', true),
        ('Chocolate em Pó', 'Chocolate premium em pó', 2.00, 3, 'Complementos', true),
        ('Chantilly', 'Chantilly fresco', 2.50, 4, 'Complementos', true),
        ('Croissant de Chocolate', 'Croissant fresco com chocolate', 6.50, 5, 'Doces', true),
        ('Bolo de Cenoura', 'Bolo caseiro de cenoura', 5.00, 6, 'Doces', true),
        ('Bolo de Chocolate', 'Bolo caseiro de chocolate', 5.50, 7, 'Doces', true),
        ('Leite Extra', 'Leite adicional', 1.50, 8, 'Extras', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. INSERT DEFAULT CONFIGURATIONS FOR PADARIA
-- =====================================================

WITH padaria_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'bakery'
)
INSERT INTO public.template_configurations
(template_id, config_key, config_label, field_type, is_required, display_order, options, help_text)
SELECT
    t.id,
    config_key,
    config_label,
    field_type,
    is_required,
    display_order,
    options::jsonb,
    help_text
FROM padaria_template t
CROSS JOIN (
    VALUES
        ('tipo_pao', 'Tipo de Pão', 'select', true, 1, '["Pão Francês", "Pão Integral", "Pão de Queijo", "Broa", "Ciabatta"]'::text, 'Escolha o tipo de pão'),
        ('tamanho', 'Tamanho', 'select', true, 2, '["Simples", "Médio", "Grande"]'::text, 'Escolha o tamanho'),
        ('recheio', 'Recheio', 'select', false, 3, '["Sem Recheio", "Queijo", "Presunto", "Frango", "Requeijão"]'::text, 'Escolha um recheio'),
        ('polvilho', 'Polvilho', 'checkbox', false, 4, '["Sem Polvilho", "Com Polvilho Doce", "Com Polvilho Salgado"]'::text, 'Adicione polvilho'),
        ('bebida', 'Bebida', 'select', false, 5, '["Sem Bebida", "Café", "Leite Quente", "Suco", "Chocolate"]'::text, 'Escolha uma bebida quente')
) AS configs(config_key, config_label, field_type, is_required, display_order, options, help_text)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. INSERT DEFAULT ADDONS FOR PADARIA
-- =====================================================

WITH padaria_template AS (
    SELECT id FROM public.business_type_templates WHERE business_type = 'bakery'
)
INSERT INTO public.template_addons
(template_id, name, description, price, display_order, category, is_active)
SELECT
    t.id,
    name,
    description,
    price::numeric,
    display_order,
    category,
    is_active::boolean
FROM padaria_template t
CROSS JOIN (
    VALUES
        ('Queijo Extra', 'Queijo meia cura adicional', 3.50, 1, 'Extras', true),
        ('Presunto Extra', 'Presunto de qualidade premium', 4.00, 2, 'Extras', true),
        ('Manteiga', 'Manteiga fresca', 2.00, 3, 'Complementos', true),
        ('Geleia de Morango', 'Geleia caseira de morango', 2.50, 4, 'Complementos', true),
        ('Mel Puro', 'Mel de abelha natural', 3.00, 5, 'Complementos', true),
        ('Café Premium', 'Café coado fresco', 4.00, 6, 'Bebidas', true),
        ('Leite Quente', 'Leite integral quente', 2.50, 7, 'Bebidas', true),
        ('Bolo Doce', 'Fatia de bolo caseiro assortido', 6.00, 8, 'Doces', true)
) AS addons(name, description, price, display_order, category, is_active)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ✅ Migration 25 Complete
-- Templates agora completos para todos os 9 tipos de negócio
-- =====================================================
