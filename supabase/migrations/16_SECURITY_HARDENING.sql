-- =====================================================
-- SECURITY HARDENING (PRODUCTION)
-- Objetivo: proteger painel admin com Supabase Auth + RLS
-- Data: 2026-03-02
--
-- IMPORTANTE:
-- - Este script assume uso de Supabase Auth (auth.users)
-- - Define tabela public.admin_users para permitir acesso administrativo
-- - Cria função public.is_admin() para usar nas policies
-- - Mantém acesso público (anon) apenas para leitura do cardápio e criação/consulta de pedidos
-- =====================================================

-- 1) TABELA DE ADMINS (vincula auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2) FUNÇÃO IS_ADMIN (segura para usar em policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Somente admins podem ver/alterar lista de admins (em geral, gerenciado no SQL Editor)
DROP POLICY IF EXISTS admin_users_admin_only ON public.admin_users;
CREATE POLICY admin_users_admin_only
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3) FUNÇÕES AUXILIARES DE POLICY
CREATE OR REPLACE FUNCTION public.allow_public_read()
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT true;
$$;

-- 4) HABILITAR RLS EM TABELAS-CHAVE (se ainda não estiver)
ALTER TABLE IF EXISTS public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_addon_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_configuration_options ENABLE ROW LEVEL SECURITY;

-- 5) DROPAR POLICIES PERMISSIVAS (as que geralmente abrem tudo)
-- Observação: não dá pra cobrir todos os nomes possíveis, mas removemos os principais já vistos.
DO $$
BEGIN
  -- restaurants
  DROP POLICY IF EXISTS "Allow all operations on restaurants" ON public.restaurants;
  DROP POLICY IF EXISTS "restaurants_select" ON public.restaurants;

  -- categories
  DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;
  DROP POLICY IF EXISTS "categories_select" ON public.categories;

  -- products
  DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
  DROP POLICY IF EXISTS "products_select" ON public.products;

  -- product_addons
  DROP POLICY IF EXISTS "Allow all operations on product_addons" ON public.product_addons;
  DROP POLICY IF EXISTS "product_addons_select" ON public.product_addons;

  -- product_addon_relations
  DROP POLICY IF EXISTS "Allow all operations on product_addon_relations" ON public.product_addon_relations;
  DROP POLICY IF EXISTS "product_addon_relations_select" ON public.product_addon_relations;

  -- payment_methods
  DROP POLICY IF EXISTS "Allow all operations on payment_methods" ON public.payment_methods;
  DROP POLICY IF EXISTS "payment_methods_select" ON public.payment_methods;

  -- orders + items
  DROP POLICY IF EXISTS "Allow all operations on orders" ON public.orders;
  DROP POLICY IF EXISTS "Allow all operations on order_items" ON public.order_items;
  DROP POLICY IF EXISTS "Allow all operations on order_item_addons" ON public.order_item_addons;

  -- images/configurations
  DROP POLICY IF EXISTS "product_images_select" ON public.product_images;
  DROP POLICY IF EXISTS "product_images_insert" ON public.product_images;
  DROP POLICY IF EXISTS "product_images_update" ON public.product_images;
  DROP POLICY IF EXISTS "product_images_delete" ON public.product_images;

  DROP POLICY IF EXISTS "product_configurations_public_select" ON public.product_configurations;
  DROP POLICY IF EXISTS "product_configurations_public_insert" ON public.product_configurations;
  DROP POLICY IF EXISTS "product_configurations_public_update" ON public.product_configurations;
  DROP POLICY IF EXISTS "product_configurations_public_delete" ON public.product_configurations;

  DROP POLICY IF EXISTS "product_configuration_options_public_select" ON public.product_configuration_options;
  DROP POLICY IF EXISTS "product_configuration_options_public_insert" ON public.product_configuration_options;
  DROP POLICY IF EXISTS "product_configuration_options_public_update" ON public.product_configuration_options;
  DROP POLICY IF EXISTS "product_configuration_options_public_delete" ON public.product_configuration_options;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- 6) POLICIES PÚBLICAS (ANON) - LEITURA DO CARDÁPIO
-- restaurants: leitura pública (single-tenant, assume 1 restaurante)
DROP POLICY IF EXISTS restaurants_public_select ON public.restaurants;
CREATE POLICY restaurants_public_select
  ON public.restaurants
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

-- categories: leitura pública
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

-- products: leitura pública apenas de disponíveis
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (available = true);

-- addons: leitura pública apenas de disponíveis
DROP POLICY IF EXISTS product_addons_public_select ON public.product_addons;
CREATE POLICY product_addons_public_select
  ON public.product_addons
  FOR SELECT
  TO anon, authenticated
  USING (available = true);

-- relations: leitura pública (necessário para montar addons por produto)
DROP POLICY IF EXISTS product_addon_relations_public_select ON public.product_addon_relations;
CREATE POLICY product_addon_relations_public_select
  ON public.product_addon_relations
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

-- payment_methods: leitura pública de métodos habilitados
DROP POLICY IF EXISTS payment_methods_public_select ON public.payment_methods;
CREATE POLICY payment_methods_public_select
  ON public.payment_methods
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

-- product_images/configurations/options: leitura pública para renderizar produto (se usado na home)
DROP POLICY IF EXISTS product_images_public_select ON public.product_images;
CREATE POLICY product_images_public_select
  ON public.product_images
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

DROP POLICY IF EXISTS product_configurations_public_select ON public.product_configurations;
CREATE POLICY product_configurations_public_select
  ON public.product_configurations
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

DROP POLICY IF EXISTS product_configuration_options_public_select ON public.product_configuration_options;
CREATE POLICY product_configuration_options_public_select
  ON public.product_configuration_options
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

-- 7) POLICIES PÚBLICAS (ANON) - CRIAÇÃO E CONSULTA DE PEDIDOS
-- Nota: para simplificar e não quebrar o sistema atual, permitimos SELECT/INSERT.
-- Para maior privacidade, o ideal é trocar tracking por RPC + validação de telefone.

DROP POLICY IF EXISTS orders_public_insert ON public.orders;
CREATE POLICY orders_public_insert
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.allow_public_read());

DROP POLICY IF EXISTS orders_public_select ON public.orders;
CREATE POLICY orders_public_select
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

DROP POLICY IF EXISTS order_items_public_insert ON public.order_items;
CREATE POLICY order_items_public_insert
  ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.allow_public_read());

DROP POLICY IF EXISTS order_items_public_select ON public.order_items;
CREATE POLICY order_items_public_select
  ON public.order_items
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

DROP POLICY IF EXISTS order_item_addons_public_insert ON public.order_item_addons;
CREATE POLICY order_item_addons_public_insert
  ON public.order_item_addons
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.allow_public_read());

DROP POLICY IF EXISTS order_item_addons_public_select ON public.order_item_addons;
CREATE POLICY order_item_addons_public_select
  ON public.order_item_addons
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

-- 8) POLICIES ADMIN (authenticated) - ESCRITA COMPLETA
-- restaurants
DROP POLICY IF EXISTS restaurants_admin_all ON public.restaurants;
CREATE POLICY restaurants_admin_all
  ON public.restaurants
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- categories
DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_admin_all
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- products
DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_admin_all
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- addons
DROP POLICY IF EXISTS product_addons_admin_all ON public.product_addons;
CREATE POLICY product_addons_admin_all
  ON public.product_addons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- relations
DROP POLICY IF EXISTS product_addon_relations_admin_all ON public.product_addon_relations;
CREATE POLICY product_addon_relations_admin_all
  ON public.product_addon_relations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- payment_methods
DROP POLICY IF EXISTS payment_methods_admin_all ON public.payment_methods;
CREATE POLICY payment_methods_admin_all
  ON public.payment_methods
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- orders
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all
  ON public.orders
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- order_items
DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;
CREATE POLICY order_items_admin_all
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- order_item_addons
DROP POLICY IF EXISTS order_item_addons_admin_all ON public.order_item_addons;
CREATE POLICY order_item_addons_admin_all
  ON public.order_item_addons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- product_images
DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;
CREATE POLICY product_images_admin_all
  ON public.product_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- product_configurations
DROP POLICY IF EXISTS product_configurations_admin_all ON public.product_configurations;
CREATE POLICY product_configurations_admin_all
  ON public.product_configurations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- product_configuration_options
DROP POLICY IF EXISTS product_configuration_options_admin_all ON public.product_configuration_options;
CREATE POLICY product_configuration_options_admin_all
  ON public.product_configuration_options
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
