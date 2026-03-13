-- =====================================================
-- REVERT SECURITY HARDENING (VOLTAR AO ESTADO ANTERIOR)
-- Data: 2026-03-02
-- =====================================================

-- 1) Remover policies criadas pelo hardening (IMPORTANTE: antes de dropar is_admin())
DO $$
BEGIN
  -- restaurants
  DROP POLICY IF EXISTS restaurants_public_select ON public.restaurants;
  DROP POLICY IF EXISTS restaurants_admin_all ON public.restaurants;

  -- categories
  DROP POLICY IF EXISTS categories_public_select ON public.categories;
  DROP POLICY IF EXISTS categories_admin_all ON public.categories;

  -- products
  DROP POLICY IF EXISTS products_public_select ON public.products;
  DROP POLICY IF EXISTS products_admin_all ON public.products;

  -- product_addons
  DROP POLICY IF EXISTS product_addons_public_select ON public.product_addons;
  DROP POLICY IF EXISTS product_addons_admin_all ON public.product_addons;

  -- product_addon_relations
  DROP POLICY IF EXISTS product_addon_relations_public_select ON public.product_addon_relations;
  DROP POLICY IF EXISTS product_addon_relations_admin_all ON public.product_addon_relations;

  -- payment_methods
  DROP POLICY IF EXISTS payment_methods_public_select ON public.payment_methods;
  DROP POLICY IF EXISTS payment_methods_admin_all ON public.payment_methods;

  -- orders
  DROP POLICY IF EXISTS orders_public_insert ON public.orders;
  DROP POLICY IF EXISTS orders_public_select ON public.orders;
  DROP POLICY IF EXISTS orders_admin_all ON public.orders;

  -- order_items
  DROP POLICY IF EXISTS order_items_public_insert ON public.order_items;
  DROP POLICY IF EXISTS order_items_public_select ON public.order_items;
  DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;

  -- order_item_addons
  DROP POLICY IF EXISTS order_item_addons_public_insert ON public.order_item_addons;
  DROP POLICY IF EXISTS order_item_addons_public_select ON public.order_item_addons;
  DROP POLICY IF EXISTS order_item_addons_admin_all ON public.order_item_addons;

  -- product_images
  DROP POLICY IF EXISTS product_images_public_select ON public.product_images;
  DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;

  -- product_configurations
  DROP POLICY IF EXISTS product_configurations_public_select ON public.product_configurations;
  DROP POLICY IF EXISTS product_configurations_admin_all ON public.product_configurations;

  -- product_configuration_options
  DROP POLICY IF EXISTS product_configuration_options_public_select ON public.product_configuration_options;
  DROP POLICY IF EXISTS product_configuration_options_admin_all ON public.product_configuration_options;

  -- admin_users
  DROP POLICY IF EXISTS admin_users_admin_only ON public.admin_users;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- 2) Remover tabela admin_users e funções
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.allow_public_read();
DROP TABLE IF EXISTS public.admin_users;

-- 3) Recriar policies permissivas simples (como estavam antes)
-- restaurants
CREATE POLICY "Allow all operations on restaurants" ON public.restaurants FOR ALL USING (true);

-- categories
CREATE POLICY "Allow all operations on categories" ON public.categories FOR ALL USING (true);

-- products
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);

-- product_addons
CREATE POLICY "Allow all operations on product_addons" ON public.product_addons FOR ALL USING (true);

-- product_addon_relations
CREATE POLICY "Allow all operations on product_addon_relations" ON public.product_addon_relations FOR ALL USING (true);

-- payment_methods
CREATE POLICY "Allow all operations on payment_methods" ON public.payment_methods FOR ALL USING (true);

-- orders
CREATE POLICY "Allow all operations on orders" ON public.orders FOR ALL USING (true);

-- order_items
CREATE POLICY "Allow all operations on order_items" ON public.order_items FOR ALL USING (true);

-- order_item_addons
CREATE POLICY "Allow all operations on order_item_addons" ON public.order_item_addons FOR ALL USING (true);

-- product_images (se existir)
DO $$
BEGIN
  CREATE POLICY "Allow all operations on product_images" ON public.product_images FOR ALL USING (true);
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- product_configurations (se existir)
DO $$
BEGIN
  CREATE POLICY "Allow all operations on product_configurations" ON public.product_configurations FOR ALL USING (true);
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- product_configuration_options (se existir)
DO $$
BEGIN
  CREATE POLICY "Allow all operations on product_configuration_options" ON public.product_configuration_options FOR ALL USING (true);
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;
