-- =====================================================
-- DELIVERYMAX / MEUS PEDIDOS - SQL COMPLETO UNIFICADO
-- Arquivo único gerado a partir das migrations fornecidas
-- Execute inteiro no Supabase SQL Editor
-- =====================================================

/* =========================
   BEGIN: SQL_COMPLETO_ATUALIZADO.sql
   ========================= */

-- =====================================================
-- DELIVERYMAX / MEUS PEDIDOS - SQL COMPLETO (ATUALIZADO)
-- =====================================================
-- COMO USAR (ordem recomendada):
-- 1) Execute ESTE arquivo inteiro no Supabase (SQL Editor)
-- 2) Execute: supabase/migrations/01_create_admin.sql
-- 3) Execute: supabase/migrations/dados-mockados.sql
--
-- Observações:
-- - Este arquivo consolida a base completa (tabelas, types, funções, triggers, RLS, storage, realtime)
-- - Mantém 01_create_admin.sql e dados-mockados.sql separados, como solicitado
-- =====================================================

-- =====================================================
-- 0. EXTENSÕES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. TYPES / ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'staff', 'driver');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.permission AS ENUM (
      'dashboard',
      'agenda',
      'services',
      'professionals',
      'clients',
      'loyalty',
      'reports',
      'settings',
      'evolution_api',
      'ai'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.product_field_type AS ENUM ('radio', 'checkbox', 'select', 'text', 'number');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.product_badge_type AS ENUM ('new', 'promotion', 'low_stock', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.product_badge_position AS ENUM ('top_left', 'top_right', 'bottom_left', 'bottom_right');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.product_template_type AS ENUM ('food', 'clothing', 'electronics', 'default');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. FUNÇÕES UTILITÁRIAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    sequence_number INT;
BEGIN
    year_prefix := to_char(now(), 'YYYY');

    WITH sequence AS (
        SELECT COALESCE(
            MAX(NULLIF(regexp_replace(number, '^[0-9]{4}', ''), ''))::integer,
            0
        ) + 1 as next_number
        FROM public.orders
        WHERE number LIKE year_prefix || '%'
    )
    SELECT next_number INTO sequence_number FROM sequence;

    NEW.number := year_prefix || LPAD(sequence_number::text, 4, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TABELAS CORE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role public.user_role DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT email_not_empty CHECK (email <> '')
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allow_registration BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    avatar_url TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 4. RESTAURANTE / DELIVERY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    banner_url TEXT,
    open_time TIME,
    close_time TIME,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    theme_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week TEXT NOT NULL,
    open_time TEXT,
    close_time TEXT,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_times (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    min_time INTEGER NOT NULL,
    max_time INTEGER NOT NULL,
    day_of_week VARCHAR(20) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.delivery_regions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    fee NUMERIC NOT NULL DEFAULT 0,
    city TEXT,
    neighborhood TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_city_neighborhood UNIQUE(city, neighborhood)
);

CREATE TABLE IF NOT EXISTS public.neighborhood_imports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    city TEXT NOT NULL,
    neighborhoods TEXT[] NOT NULL,
    imported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. CATÁLOGO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id),
    available BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    configuration_template public.product_template_type DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_addons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    is_global BOOLEAN NOT NULL DEFAULT false,
    max_options INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_addon_relations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES public.product_addons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. GALERIA / CONFIGURAÇÕES / ENHANCEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chk_is_primary_boolean CHECK (is_primary IN (true, false))
);

CREATE TABLE IF NOT EXISTS public.product_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_label TEXT NOT NULL,
    field_type public.product_field_type NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL,
    max_selections INTEGER,
    min_length INTEGER,
    max_length INTEGER,
    step DECIMAL(10, 2),
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    default_value TEXT,
    help_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chk_unique_config_key UNIQUE(product_id, config_key),
    CONSTRAINT chk_text_length_consistency CHECK (min_length IS NULL OR max_length IS NULL OR min_length <= max_length),
    CONSTRAINT chk_number_range_consistency CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
);

CREATE TABLE IF NOT EXISTS public.product_configuration_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    configuration_id UUID NOT NULL REFERENCES public.product_configurations(id) ON DELETE CASCADE,
    option_label TEXT NOT NULL,
    option_value TEXT NOT NULL,
    additional_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chk_additional_price_non_negative CHECK (additional_price >= 0)
);

CREATE TABLE IF NOT EXISTS public.product_badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    badge_type public.product_badge_type NOT NULL,
    badge_label TEXT NOT NULL,
    badge_color TEXT NOT NULL DEFAULT 'bg-blue-500',
    badge_position public.product_badge_position NOT NULL DEFAULT 'top_right',
    show_condition JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_enhancements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    expanded_description TEXT,
    trust_triggers JSONB DEFAULT '[]'::jsonb,
    warranty_text TEXT,
    stock_warning TEXT,
    highlight_section JSONB,
    visibility_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 7. PEDIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    restaurant_id UUID REFERENCES public.restaurants(id),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'canceled')),
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    subtotal DECIMAL NOT NULL,
    delivery_fee DECIMAL NOT NULL DEFAULT 0,
    discount DECIMAL NOT NULL DEFAULT 0,
    total DECIMAL NOT NULL,
    notes TEXT,
    order_type TEXT CHECK (order_type IN ('delivery', 'takeaway', 'instore')) DEFAULT 'delivery' NOT NULL,
    table_number TEXT DEFAULT NULL,
    delivery_driver_id UUID REFERENCES public.drivers(id),
    delivery_status TEXT,
    delivery_address TEXT,
    delivery_region_id UUID REFERENCES public.delivery_regions(id),
    delivery_started_at TIMESTAMP WITH TIME ZONE,
    delivery_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL,
    total_price DECIMAL NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_item_addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES public.product_addons(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL,
    total_price DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- 8. NOTIFICAÇÕES (SOM)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    sound_enabled BOOLEAN DEFAULT true NOT NULL,
    sound_volume NUMERIC DEFAULT 1.0 NOT NULL CHECK (sound_volume >= 0 AND sound_volume <= 1),
    notification_type TEXT DEFAULT 'mp3' CHECK (notification_type IN ('mp3', 'beep', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- 9. BANNERS / REDES SOCIAIS
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

-- =====================================================
-- 10. TRIGGERS (updated_at, number)
-- =====================================================

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER set_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER set_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.number IS NULL)
    EXECUTE FUNCTION public.generate_order_number();

DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_product_configurations_updated_at ON public.product_configurations;
CREATE TRIGGER update_product_configurations_updated_at
    BEFORE UPDATE ON public.product_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_product_configuration_options_updated_at ON public.product_configuration_options;
CREATE TRIGGER update_product_configuration_options_updated_at
    BEFORE UPDATE ON public.product_configuration_options
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_product_badges_updated_at ON public.product_badges;
CREATE TRIGGER update_product_badges_updated_at
    BEFORE UPDATE ON public.product_badges
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_product_enhancements_updated_at ON public.product_enhancements;
CREATE TRIGGER update_product_enhancements_updated_at
    BEFORE UPDATE ON public.product_enhancements
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

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

DROP TRIGGER IF EXISTS set_user_notification_preferences_updated_at ON public.user_notification_preferences;
CREATE TRIGGER set_user_notification_preferences_updated_at
    BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 11. TRIGGERS DE VALIDAÇÃO (produto)
-- =====================================================

DROP TRIGGER IF EXISTS check_max_images_per_product ON public.product_images;
DROP FUNCTION IF EXISTS public.check_max_images_per_product_fn();
CREATE FUNCTION public.check_max_images_per_product_fn() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.product_images WHERE product_id = NEW.product_id) > 7 THEN
        RAISE EXCEPTION 'Máximo de 7 imagens por produto excedido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_images_per_product
    BEFORE INSERT ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION public.check_max_images_per_product_fn();

DROP TRIGGER IF EXISTS check_primary_image_unique ON public.product_images;
DROP FUNCTION IF EXISTS public.check_primary_image_unique_fn();
CREATE FUNCTION public.check_primary_image_unique_fn() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE public.product_images
        SET is_primary = false
        WHERE product_id = NEW.product_id AND id != NEW.id AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_primary_image_unique
    BEFORE INSERT OR UPDATE ON public.product_images
    FOR EACH ROW
    EXECUTE FUNCTION public.check_primary_image_unique_fn();

DROP TRIGGER IF EXISTS check_max_configs_per_product ON public.product_configurations;
DROP FUNCTION IF EXISTS public.check_max_configs_per_product_fn();
CREATE FUNCTION public.check_max_configs_per_product_fn() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.product_configurations WHERE product_id = NEW.product_id) > 20 THEN
        RAISE EXCEPTION 'Máximo de 20 configurações por produto excedido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_configs_per_product
    BEFORE INSERT ON public.product_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.check_max_configs_per_product_fn();

DROP TRIGGER IF EXISTS check_max_options_per_config ON public.product_configuration_options;
DROP FUNCTION IF EXISTS public.check_max_options_per_config_fn();
CREATE FUNCTION public.check_max_options_per_config_fn() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.product_configuration_options WHERE configuration_id = NEW.configuration_id) > 100 THEN
        RAISE EXCEPTION 'Máximo de 100 opções por configuração excedido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_options_per_config
    BEFORE INSERT ON public.product_configuration_options
    FOR EACH ROW
    EXECUTE FUNCTION public.check_max_options_per_config_fn();

DROP TRIGGER IF EXISTS check_max_active_badges ON public.product_badges;
DROP FUNCTION IF EXISTS public.check_max_active_badges_fn();
CREATE FUNCTION public.check_max_active_badges_fn() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        IF (SELECT COUNT(*) FROM public.product_badges WHERE product_id = NEW.product_id AND is_active = true AND id != NEW.id) >= 3 THEN
            RAISE EXCEPTION 'Máximo de 3 badges ativos por produto excedido';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_active_badges
    BEFORE INSERT OR UPDATE ON public.product_badges
    FOR EACH ROW
    EXECUTE FUNCTION public.check_max_active_badges_fn();

-- =====================================================
-- 12. FUNÇÕES RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.authenticate_user(p_email TEXT, p_password TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role public.user_role,
    authenticated BOOLEAN
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        true as authenticated
    FROM public.users u
    WHERE u.email = p_email
      AND u.password = p_password;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_user(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_admin_id UUID DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT, user_id UUID) SECURITY DEFINER AS $$
DECLARE
    new_user_id UUID;
    registration_allowed BOOLEAN;
    admin_user RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
        RETURN QUERY SELECT false, 'Email já cadastrado no sistema', NULL::UUID;
        RETURN;
    END IF;

    IF (SELECT COUNT(*) FROM public.users) > 0 THEN
        IF p_admin_id IS NULL THEN
            RETURN QUERY SELECT false, 'Apenas administrador pode criar novos usuários', NULL::UUID;
            RETURN;
        END IF;

        SELECT * INTO admin_user FROM public.users WHERE id = p_admin_id AND role = 'admin';
        IF admin_user IS NULL THEN
            RETURN QUERY SELECT false, 'Usuário não tem permissão de administrador', NULL::UUID;
            RETURN;
        END IF;
    END IF;

    SELECT allow_registration INTO registration_allowed FROM public.system_settings LIMIT 1;
    IF registration_allowed IS NULL THEN
        registration_allowed := true;
    END IF;

    IF (SELECT COUNT(*) FROM public.users) > 0 AND NOT registration_allowed THEN
        RETURN QUERY SELECT false, 'Registro de novos usuários está desabilitado', NULL::UUID;
        RETURN;
    END IF;

    IF (SELECT COUNT(*) FROM public.users) = 0 THEN
        INSERT INTO public.users (email, password, first_name, last_name, role)
        VALUES (p_email, p_password, p_first_name, p_last_name, 'admin')
        RETURNING id INTO new_user_id;
    ELSE
        INSERT INTO public.users (email, password, first_name, last_name, role)
        VALUES (p_email, p_password, p_first_name, p_last_name, 'staff')
        RETURNING id INTO new_user_id;
    END IF;

    RETURN QUERY SELECT true, 'Usuário criado com sucesso', new_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_user_password(
    p_user_id UUID,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS TABLE (success BOOLEAN, message TEXT) SECURITY DEFINER AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT id, password INTO user_record FROM public.users WHERE id = p_user_id;

    IF user_record IS NULL THEN
        RETURN QUERY SELECT false, 'Usuário não encontrado'::TEXT;
        RETURN;
    END IF;

    IF user_record.password != p_current_password THEN
        RETURN QUERY SELECT false, 'Senha atual incorreta'::TEXT;
        RETURN;
    END IF;

    IF p_new_password = p_current_password THEN
        RETURN QUERY SELECT false, 'A nova senha deve ser diferente da atual'::TEXT;
        RETURN;
    END IF;

    UPDATE public.users
    SET password = p_new_password, updated_at = now()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, 'Senha atualizada com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_product_addons()
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    price numeric,
    available boolean,
    is_global boolean,
    max_options integer
)
LANGUAGE sql
AS $$
    SELECT
        id,
        name,
        description,
        price,
        available,
        is_global,
        max_options
    FROM public.product_addons
    ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.get_product_addon_relations()
RETURNS TABLE (
    id uuid,
    product_id uuid,
    addon_id uuid
)
LANGUAGE sql
AS $$
    SELECT id, product_id, addon_id
    FROM public.product_addon_relations;
$$;

CREATE OR REPLACE FUNCTION public.get_product_addons_by_product(product_id_param uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    price numeric,
    available boolean,
    is_global boolean,
    max_options integer
)
LANGUAGE sql
AS $$
    SELECT
        pa.id,
        pa.name,
        pa.description,
        pa.price,
        pa.available,
        pa.is_global,
        pa.max_options
    FROM public.product_addons pa
    WHERE pa.is_global = true
       OR pa.id IN (
            SELECT par.addon_id
            FROM public.product_addon_relations par
            WHERE par.product_id = product_id_param
        )
    ORDER BY pa.name;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(p_user_id UUID)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    sound_enabled boolean,
    sound_volume numeric,
    notification_type text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    IF EXISTS (SELECT 1 FROM public.user_notification_preferences np WHERE np.user_id = p_user_id) THEN
        RETURN QUERY
        SELECT np.id, np.user_id, np.sound_enabled, np.sound_volume, np.notification_type::text
        FROM public.user_notification_preferences np
        WHERE np.user_id = p_user_id;
    ELSE
        RETURN QUERY
        WITH insert_result AS (
            INSERT INTO public.user_notification_preferences (user_id, sound_enabled, sound_volume, notification_type)
            VALUES (p_user_id, true, 1.0, 'mp3')
            RETURNING id, user_id, sound_enabled, sound_volume, notification_type
        )
        SELECT
            insert_result.id,
            insert_result.user_id,
            insert_result.sound_enabled,
            insert_result.sound_volume,
            insert_result.notification_type::text
        FROM insert_result;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_sound_notifications(p_user_id UUID)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    sound_enabled boolean,
    sound_volume numeric,
    notification_type text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_current_state boolean;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.user_notification_preferences np WHERE np.user_id = p_user_id) THEN
        INSERT INTO public.user_notification_preferences (user_id, sound_enabled, sound_volume, notification_type)
        VALUES (p_user_id, true, 1.0, 'mp3');
    END IF;

    SELECT np.sound_enabled INTO v_current_state
    FROM public.user_notification_preferences np
    WHERE np.user_id = p_user_id;

    UPDATE public.user_notification_preferences np
    SET sound_enabled = NOT v_current_state,
        updated_at = now()
    WHERE np.user_id = p_user_id;

    RETURN QUERY
    SELECT np.id, np.user_id, np.sound_enabled, np.sound_volume, np.notification_type::text
    FROM public.user_notification_preferences np
    WHERE np.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_banners(p_restaurant_id UUID)
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

CREATE OR REPLACE FUNCTION public.get_all_banners(p_restaurant_id UUID)
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

CREATE OR REPLACE FUNCTION public.get_active_social_media(p_restaurant_id UUID)
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

CREATE OR REPLACE FUNCTION public.get_all_social_media(p_restaurant_id UUID)
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

CREATE OR REPLACE FUNCTION public.get_product_with_gallery(
    p_product_id UUID,
    p_include_configs BOOLEAN DEFAULT false,
    p_include_badges BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    image_url TEXT,
    category_id UUID,
    available BOOLEAN,
    featured BOOLEAN,
    configuration_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    images JSONB,
    configurations JSONB,
    badges JSONB,
    enhancements JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_product RECORD;
    v_images JSONB;
    v_configs JSONB;
    v_badges JSONB;
    v_enhancements JSONB;
BEGIN
    SELECT * INTO v_product FROM public.products WHERE id = p_product_id;
    IF v_product IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', pi.id,
            'imageUrl', pi.image_url,
            'altText', pi.alt_text,
            'displayOrder', pi.display_order,
            'isPrimary', pi.is_primary,
            'createdAt', pi.created_at
        ) ORDER BY pi.display_order ASC
    ), '[]'::jsonb)
    INTO v_images
    FROM public.product_images pi
    WHERE pi.product_id = p_product_id;

    v_configs := '[]'::jsonb;
    IF p_include_configs THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', pc.id,
                'configKey', pc.config_key,
                'configLabel', pc.config_label,
                'fieldType', pc.field_type,
                'isRequired', pc.is_required,
                'displayOrder', pc.display_order,
                'maxSelections', pc.max_selections,
                'helpText', pc.help_text,
                'options', (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'id', pco.id,
                            'label', pco.option_label,
                            'value', pco.option_value,
                            'additionalPrice', pco.additional_price,
                            'displayOrder', pco.display_order,
                            'isActive', pco.is_active
                        ) ORDER BY pco.display_order ASC
                    ), '[]'::jsonb)
                    FROM public.product_configuration_options pco
                    WHERE pco.configuration_id = pc.id AND pco.is_active = true
                )
            ) ORDER BY pc.display_order ASC
        ), '[]'::jsonb)
        INTO v_configs
        FROM public.product_configurations pc
        WHERE pc.product_id = p_product_id;
    END IF;

    v_badges := '[]'::jsonb;
    IF p_include_badges THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', pb.id,
                'type', pb.badge_type,
                'label', pb.badge_label,
                'color', pb.badge_color,
                'position', pb.badge_position
            )
        ), '[]'::jsonb)
        INTO v_badges
        FROM public.product_badges pb
        WHERE pb.product_id = p_product_id AND pb.is_active = true;
    END IF;

    SELECT COALESCE(
        jsonb_build_object(
            'id', pe.id,
            'expandedDescription', pe.expanded_description,
            'trustTriggers', pe.trust_triggers,
            'warrantyText', pe.warranty_text,
            'stockWarning', pe.stock_warning,
            'highlightSection', pe.highlight_section
        ), '{}'::jsonb
    )
    INTO v_enhancements
    FROM public.product_enhancements pe
    WHERE pe.product_id = p_product_id;

    RETURN QUERY SELECT
        v_product.id,
        v_product.name,
        v_product.description,
        v_product.price,
        v_product.image_url,
        v_product.category_id,
        v_product.available,
        v_product.featured,
        v_product.configuration_template::text,
        v_product.created_at,
        v_product.updated_at,
        v_images,
        v_configs,
        v_badges,
        v_enhancements;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_product_configurations(
    p_product_id UUID,
    p_configurations JSONB,
    p_options JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    configuration_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_config_count INTEGER;
    v_config JSONB;
    v_config_id UUID;
    v_option JSONB;
BEGIN
    v_config_count := COALESCE(jsonb_array_length(p_configurations), 0);
    IF v_config_count > 20 THEN
        RETURN QUERY SELECT false, 'Máximo 20 configurações por produto'::TEXT, 0;
        RETURN;
    END IF;

    DELETE FROM public.product_configurations WHERE product_id = p_product_id;

    FOR v_config IN SELECT jsonb_array_elements(p_configurations)
    LOOP
        INSERT INTO public.product_configurations (
            product_id, config_key, config_label, field_type,
            is_required, display_order, max_selections, help_text
        ) VALUES (
            p_product_id,
            v_config->>'configKey',
            v_config->>'configLabel',
            (v_config->>'fieldType')::public.product_field_type,
            COALESCE((v_config->>'isRequired')::BOOLEAN, false),
            COALESCE((v_config->>'displayOrder')::INTEGER, 0),
            (v_config->>'maxSelections')::INTEGER,
            v_config->>'helpText'
        )
        RETURNING id INTO v_config_id;

        IF (v_config ? 'options') THEN
            FOR v_option IN SELECT jsonb_array_elements(v_config->'options')
            LOOP
                INSERT INTO public.product_configuration_options (
                    configuration_id, option_label, option_value,
                    additional_price, display_order
                ) VALUES (
                    v_config_id,
                    v_option->>'label',
                    v_option->>'value',
                    COALESCE((v_option->>'additionalPrice')::DECIMAL, 0),
                    COALESCE((v_option->>'displayOrder')::INTEGER, 0)
                );
            END LOOP;
        END IF;
    END LOOP;

    RETURN QUERY SELECT true, 'Configurações salvas com sucesso'::TEXT, v_config_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_product_images(
    p_product_id UUID,
    p_image_orders JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_order JSONB;
    v_image_id UUID;
    v_order_value INTEGER;
BEGIN
    FOR v_order IN SELECT jsonb_array_elements(p_image_orders)
    LOOP
        v_image_id := (v_order->>'id')::UUID;

        IF NOT EXISTS (
            SELECT 1 FROM public.product_images
            WHERE id = v_image_id AND product_id = p_product_id
        ) THEN
            RETURN QUERY SELECT false, 'Uma ou mais imagens não pertencem ao produto'::TEXT;
            RETURN;
        END IF;
    END LOOP;

    FOR v_order IN SELECT jsonb_array_elements(p_image_orders)
    LOOP
        v_image_id := (v_order->>'id')::UUID;
        v_order_value := (v_order->>'order')::INTEGER;

        UPDATE public.product_images
        SET display_order = v_order_value
        WHERE id = v_image_id;
    END LOOP;

    RETURN QUERY SELECT true, 'Imagens reordenadas com sucesso'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_configuration_preview(p_product_id UUID)
RETURNS TABLE (
    html_preview TEXT,
    additional_price_total DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_html TEXT := '<div class="product-configurations">';
    v_total_price DECIMAL := 0;
    v_config RECORD;
    v_option RECORD;
BEGIN
    FOR v_config IN
        SELECT * FROM public.product_configurations
        WHERE product_id = p_product_id
        ORDER BY display_order ASC
    LOOP
        v_html := v_html || '<div class="config-group" data-config-id="' || v_config.id || '">';
        v_html := v_html || '<label class="config-label">' || v_config.config_label;

        IF v_config.is_required THEN
            v_html := v_html || ' <span class="required">*</span>';
        END IF;

        v_html := v_html || '</label>';

        IF v_config.help_text IS NOT NULL THEN
            v_html := v_html || '<p class="help-text">' || v_config.help_text || '</p>';
        END IF;

        FOR v_option IN
            SELECT * FROM public.product_configuration_options
            WHERE configuration_id = v_config.id AND is_active = true
            ORDER BY display_order ASC
        LOOP
            v_total_price := v_total_price + v_option.additional_price;
        END LOOP;

        v_html := v_html || '</div>';
    END LOOP;

    v_html := v_html || '</div>';

    RETURN QUERY SELECT v_html, v_total_price;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_product_badge(
    p_product_id UUID,
    p_badge_type TEXT,
    p_badge_label TEXT,
    p_badge_color TEXT DEFAULT 'bg-blue-500',
    p_badge_position TEXT DEFAULT 'top_right'
)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    badge_type TEXT,
    badge_label TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_badge_id UUID;
BEGIN
    INSERT INTO public.product_badges (
        product_id, badge_type, badge_label, badge_color, badge_position
    ) VALUES (
        p_product_id,
        p_badge_type::public.product_badge_type,
        p_badge_label,
        p_badge_color,
        p_badge_position::public.product_badge_position
    )
    ON CONFLICT DO NOTHING
    RETURNING product_badges.id INTO v_badge_id;

    RETURN QUERY SELECT
        pb.id,
        pb.product_id,
        pb.badge_type::TEXT,
        pb.badge_label,
        pb.created_at
    FROM public.product_badges pb
    WHERE pb.id = v_badge_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_product_enhancement(
    p_product_id UUID,
    p_expanded_description TEXT DEFAULT NULL,
    p_trust_triggers JSONB DEFAULT NULL,
    p_warranty_text TEXT DEFAULT NULL,
    p_stock_warning TEXT DEFAULT NULL,
    p_highlight_section JSONB DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    expanded_description TEXT,
    warranty_text TEXT,
    stock_warning TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.product_enhancements (
        product_id, expanded_description, trust_triggers,
        warranty_text, stock_warning, highlight_section
    ) VALUES (
        p_product_id,
        p_expanded_description,
        COALESCE(p_trust_triggers, '[]'::jsonb),
        p_warranty_text,
        p_stock_warning,
        p_highlight_section
    )
    ON CONFLICT (product_id) DO UPDATE
    SET
        expanded_description = COALESCE(EXCLUDED.expanded_description, public.product_enhancements.expanded_description),
        trust_triggers = COALESCE(EXCLUDED.trust_triggers, public.product_enhancements.trust_triggers),
        warranty_text = COALESCE(EXCLUDED.warranty_text, public.product_enhancements.warranty_text),
        stock_warning = COALESCE(EXCLUDED.stock_warning, public.product_enhancements.stock_warning),
        highlight_section = COALESCE(EXCLUDED.highlight_section, public.product_enhancements.highlight_section);

    RETURN QUERY SELECT
        pe.id,
        pe.product_id,
        pe.expanded_description,
        pe.warranty_text,
        pe.stock_warning
    FROM public.product_enhancements pe
    WHERE pe.product_id = p_product_id;
END;
$$;

-- Grants para RPCs
GRANT EXECUTE ON FUNCTION public.authenticate_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user(TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_addons() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_addon_relations() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_addons_by_product(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_notification_preferences(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_sound_notifications(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_banners(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_banners(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_social_media(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_social_media(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_with_gallery(UUID, BOOLEAN, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_product_configurations(UUID, JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_product_images(UUID, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_configuration_preview(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_product_badge(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_product_enhancement(UUID, TEXT, JSONB, TEXT, TEXT, JSONB) TO anon, authenticated;

-- =====================================================
-- 13. RLS (ENABLE) + POLICIES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhood_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addon_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_configuration_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_enhancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media ENABLE ROW LEVEL SECURITY;

-- Drop policies (idempotente)
DROP POLICY IF EXISTS "Users can view own user" ON public.users;
DROP POLICY IF EXISTS "Only admins can create users" ON public.users;

DROP POLICY IF EXISTS "Allow all operations on restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on product_addons" ON public.product_addons;
DROP POLICY IF EXISTS "Allow all operations on product_addon_relations" ON public.product_addon_relations;
DROP POLICY IF EXISTS "Allow all operations on payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow all operations on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow all operations on order_item_addons" ON public.order_item_addons;
DROP POLICY IF EXISTS "Allow all operations on delivery_regions" ON public.delivery_regions;
DROP POLICY IF EXISTS "Allow all operations on drivers" ON public.drivers;
DROP POLICY IF EXISTS "Allow all operations on business_hours" ON public.business_hours;
DROP POLICY IF EXISTS "Allow all operations on delivery_times" ON public.delivery_times;
DROP POLICY IF EXISTS "Allow all operations on banners" ON public.banners;
DROP POLICY IF EXISTS "Allow all operations on social_media" ON public.social_media;

DROP POLICY IF EXISTS "Manage own notification preferences" ON public.user_notification_preferences;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.neighborhood_imports;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.neighborhood_imports;

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

DROP POLICY IF EXISTS "product_badges_public_select" ON public.product_badges;
DROP POLICY IF EXISTS "product_badges_public_write" ON public.product_badges;
DROP POLICY IF EXISTS "product_enhancements_public_select" ON public.product_enhancements;
DROP POLICY IF EXISTS "product_enhancements_public_write" ON public.product_enhancements;

-- Policies
CREATE POLICY "Users can view own user" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Only admins can create users" ON public.users
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Allow all operations on restaurants" ON public.restaurants FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations on product_addons" ON public.product_addons FOR ALL USING (true);
CREATE POLICY "Allow all operations on product_addon_relations" ON public.product_addon_relations FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_methods" ON public.payment_methods FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on order_items" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on order_item_addons" ON public.order_item_addons FOR ALL USING (true);
CREATE POLICY "Allow all operations on delivery_regions" ON public.delivery_regions FOR ALL USING (true);
CREATE POLICY "Allow all operations on drivers" ON public.drivers FOR ALL USING (true);
CREATE POLICY "Allow all operations on business_hours" ON public.business_hours FOR ALL USING (true);
CREATE POLICY "Allow all operations on delivery_times" ON public.delivery_times FOR ALL USING (true);
CREATE POLICY "Allow all operations on banners" ON public.banners FOR ALL USING (true);
CREATE POLICY "Allow all operations on social_media" ON public.social_media FOR ALL USING (true);

CREATE POLICY "Manage own notification preferences" ON public.user_notification_preferences
    FOR ALL
    USING (auth.uid() = user_id OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users"
ON public.neighborhood_imports
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.neighborhood_imports
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Product images: leitura pública; escrita autenticada
CREATE POLICY "product_images_select" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "product_images_insert" ON public.product_images
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "product_images_update" ON public.product_images
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_images_delete" ON public.product_images
  FOR DELETE TO authenticated
  USING (true);

-- Configurações: autenticado gerencia
CREATE POLICY "product_configurations_public_select"
  ON public.product_configurations
  FOR SELECT
  USING (true);

CREATE POLICY "product_configurations_public_insert"
  ON public.product_configurations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "product_configurations_public_update"
  ON public.product_configurations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_configurations_public_delete"
  ON public.product_configurations
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "product_configuration_options_public_select"
  ON public.product_configuration_options
  FOR SELECT
  USING (true);

CREATE POLICY "product_configuration_options_public_insert"
  ON public.product_configuration_options
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "product_configuration_options_public_update"
  ON public.product_configuration_options
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_configuration_options_public_delete"
  ON public.product_configuration_options
  FOR DELETE TO authenticated
  USING (true);

-- Enhancements e badges: leitura pública; escrita autenticada
CREATE POLICY "product_badges_public_select"
  ON public.product_badges
  FOR SELECT
  USING (true);

CREATE POLICY "product_badges_public_write"
  ON public.product_badges
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_enhancements_public_select"
  ON public.product_enhancements
  FOR SELECT
  USING (true);

CREATE POLICY "product_enhancements_public_write"
  ON public.product_enhancements
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 14. ÍNDICES (SEM indexar image_url para evitar erro 54000)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_configuration_template ON public.products(configuration_template);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_delivery_times_restaurant ON public.delivery_times(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_times_day ON public.delivery_times(day_of_week);

CREATE INDEX IF NOT EXISTS idx_delivery_regions_city_neighborhood ON public.delivery_regions(city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_neighborhood_imports_city ON public.neighborhood_imports(city);

CREATE INDEX IF NOT EXISTS idx_banners_restaurant ON public.banners(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners("order");

CREATE INDEX IF NOT EXISTS idx_social_media_restaurant ON public.social_media(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON public.social_media(platform);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON public.product_images(product_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(product_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_product_configurations_product_id ON public.product_configurations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_configurations_product_order ON public.product_configurations(product_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_product_configuration_options_config_id ON public.product_configuration_options(configuration_id);
CREATE INDEX IF NOT EXISTS idx_product_configuration_options_config_order ON public.product_configuration_options(configuration_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_product_badges_product_id ON public.product_badges(product_id);
CREATE INDEX IF NOT EXISTS idx_product_badges_type ON public.product_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_product_badges_active ON public.product_badges(is_active);

CREATE INDEX IF NOT EXISTS idx_product_enhancements_product_id ON public.product_enhancements(product_id);

-- =====================================================
-- 15. STORAGE BUCKET (product-images)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies do storage (idempotente)
DROP POLICY IF EXISTS "product-images-public-read" ON storage.objects;
DROP POLICY IF EXISTS "product-images-authenticated-upload" ON storage.objects;
DROP POLICY IF EXISTS "product-images-authenticated-delete" ON storage.objects;
DROP POLICY IF EXISTS "product-images-authenticated-update" ON storage.objects;

CREATE POLICY "product-images-public-read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product-images-authenticated-upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product-images-authenticated-delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images');

CREATE POLICY "product-images-authenticated-update" ON storage.objects
  FOR UPDATE
  WITH CHECK (bucket_id = 'product-images');

-- =====================================================
-- 16. REALTIME (movido para final do arquivo com proteção de erro)
-- =====================================================

-- =====================================================
-- 17. CONFIGURAÇÃO INICIAL
-- =====================================================

INSERT INTO public.system_settings (allow_registration)
VALUES (true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 18. DADOS MÍNIMOS (necessários para o sistema funcionar bem)
-- =====================================================

-- Métodos de pagamento padrão (Checkout/Admin)
INSERT INTO public.payment_methods (name, description, icon, enabled, display_order)
VALUES
  ('Dinheiro', 'Pagamento em espécie', 'banknote', true, 1),
  ('Cartão de Crédito', 'Visa, Mastercard, etc', 'credit-card', true, 2),
  ('Cartão de Débito', 'Visa, Mastercard, etc', 'credit-card', true, 3),
  ('PIX', 'Transferência instantânea', 'qr-code', true, 4),
  ('Vale Refeição', 'Alelo, Sodexo, VR, etc', 'credit-card', true, 5)
ON CONFLICT DO NOTHING;

-- Horários padrão (caso a tabela esteja vazia)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.business_hours) THEN
    INSERT INTO public.business_hours (day_of_week, open_time, close_time, is_closed)
    VALUES
      ('Segunda-feira', '09:00', '18:00', false),
      ('Terça-feira', '09:00', '18:00', false),
      ('Quarta-feira', '09:00', '18:00', false),
      ('Quinta-feira', '09:00', '18:00', false),
      ('Sexta-feira', '09:00', '18:00', false),
      ('Sábado', '09:00', '18:00', false),
      ('Domingo', '09:00', '18:00', true);
  END IF;
END $$;

-- =====================================================
-- ✅ FIM (do bloco SQL_COMPLETO_ATUALIZADO)
-- =====================================================


/* =========================
   APPEND: SQL.sql (order_item_configurations)
   ========================= */

-- 1) Criar tabela (se não existir)
CREATE TABLE IF NOT EXISTS public.order_item_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  configurations JSONB NOT NULL DEFAULT '{}'::jsonb,
  additional_price DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2) Garantir RLS ligado
ALTER TABLE public.order_item_configurations ENABLE ROW LEVEL SECURITY;

-- 3) Policy (cria só se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'order_item_configurations'
      AND policyname = 'Allow all operations on order_item_configurations'
  ) THEN
    CREATE POLICY "Allow all operations on order_item_configurations"
      ON public.order_item_configurations
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- =====================================================
-- APPEND: FIX_RLS_CONFIGURATIONS.sql
-- (políticas permissivas para product_configurations/options)
-- =====================================================

-- =====================================================
-- FIX: RLS Policies para product_configurations
-- Erro: 42501 - new row violates row-level security policy
-- =====================================================

-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to select" ON public.product_configurations;
DROP POLICY IF EXISTS "product_configurations_insert" ON public.product_configurations;
DROP POLICY IF EXISTS "product_configurations_select" ON public.product_configurations;
DROP POLICY IF EXISTS "product_configurations_update" ON public.product_configurations;
DROP POLICY IF EXISTS "product_configurations_delete" ON public.product_configurations;

-- 2. HABILITAR RLS (se não estiver)
ALTER TABLE public.product_configurations ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS PERMISSIVAS PARA product_configurations

-- SELECT (qualquer um autenticado)
DROP POLICY IF EXISTS "product_configurations_public_select" ON public.product_configurations;
CREATE POLICY "product_configurations_public_select"
  ON public.product_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT (qualquer um autenticado)
DROP POLICY IF EXISTS "product_configurations_public_insert" ON public.product_configurations;
CREATE POLICY "product_configurations_public_insert"
  ON public.product_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE (qualquer um autenticado)
DROP POLICY IF EXISTS "product_configurations_public_update" ON public.product_configurations;
CREATE POLICY "product_configurations_public_update"
  ON public.product_configurations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE (qualquer um autenticado)
DROP POLICY IF EXISTS "product_configurations_public_delete" ON public.product_configurations;
CREATE POLICY "product_configurations_public_delete"
  ON public.product_configurations
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FAZER O MESMO PARA product_configuration_options
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.product_configuration_options;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.product_configuration_options;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.product_configuration_options;
DROP POLICY IF EXISTS "Allow authenticated users to select" ON public.product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_insert" ON public.product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_select" ON public.product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_update" ON public.product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_delete" ON public.product_configuration_options;

ALTER TABLE public.product_configuration_options ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS "product_configuration_options_public_select" ON public.product_configuration_options;
CREATE POLICY "product_configuration_options_public_select"
  ON public.product_configuration_options
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT
DROP POLICY IF EXISTS "product_configuration_options_public_insert" ON public.product_configuration_options;
CREATE POLICY "product_configuration_options_public_insert"
  ON public.product_configuration_options
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE
DROP POLICY IF EXISTS "product_configuration_options_public_update" ON public.product_configuration_options;
CREATE POLICY "product_configuration_options_public_update"
  ON public.product_configuration_options
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE
DROP POLICY IF EXISTS "product_configuration_options_public_delete" ON public.product_configuration_options;
CREATE POLICY "product_configuration_options_public_delete"
  ON public.product_configuration_options
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- APPEND: FIX_STORAGE_RLS_PERMISSIVE.sql
-- (garantir bucket product-images e políticas de storage)
-- =====================================================

-- =====================================================
-- FIX: Configurar bucket product-images corretamente
-- Erro: new row violates row-level security policy
-- =====================================================

-- 1. Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover todas as políticas antigas problemáticas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Can Upload" ON storage.objects;
DROP POLICY IF EXISTS "Can Delete Own" ON storage.objects;
DROP POLICY IF EXISTS "product-images select" ON storage.objects;
DROP POLICY IF EXISTS "product-images insert" ON storage.objects;
DROP POLICY IF EXISTS "product-images delete" ON storage.objects;

-- 3. Criar políticas PERMISSIVAS
-- Permitir qualquer um ler (GET)
DROP POLICY IF EXISTS "product-images-public-read" ON storage.objects;
CREATE POLICY "product-images-public-read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Permitir upload autenticado
DROP POLICY IF EXISTS "product-images-authenticated-upload" ON storage.objects;
CREATE POLICY "product-images-authenticated-upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

-- Permitir delete autenticado
DROP POLICY IF EXISTS "product-images-authenticated-delete" ON storage.objects;
CREATE POLICY "product-images-authenticated-delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images');

-- Permitir UPDATE autenticado
DROP POLICY IF EXISTS "product-images-authenticated-update" ON storage.objects;
CREATE POLICY "product-images-authenticated-update" ON storage.objects
  FOR UPDATE
  WITH CHECK (bucket_id = 'product-images');

-- =====================================================
-- APPEND: ENABLE_REALTIME_ORDERS.sql
-- =====================================================

-- ============================================================
-- ATIVAR REALTIME PARA TABELA ORDERS
-- ============================================================
-- Este comando permite que o hook useNotifications receba eventos
-- INSERT quando novos pedidos forem criados

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publicação supabase_realtime não pode ser configurada neste momento (pode não existir ou tabela já presente). Será configurada manualmente pelo Supabase.';
  END;
END $$;


-- =====================================================
-- APPEND: dados-mockados.sql (mínimos para inicialização)
-- =====================================================

-- Adicionar categorias
INSERT INTO public.categories (name, description, display_order, image_url)
VALUES
  ('Hambúrgueres', 'Deliciosos hambúrgueres artesanais', 1, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=768'),
  ('Bebidas', 'Refrigerantes, sucos e bebidas alcoólicas', 2, 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=768'),
  ('Porções', 'Porções para compartilhar', 3, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=768'),
  ('Sobremesas', 'Doces para finalizar sua refeição', 4, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=768');

-- Adicionar produtos
INSERT INTO public.products (name, description, price, image_url, category_id, available, featured)
VALUES
  ('Classic Burger', 'Hambúrguer clássico com queijo, alface, tomate e molho especial', 25.90, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres'), true, true),
  ('Cheese Burger', 'Hambúrguer com queijo cheddar duplo', 28.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres'), true, false),
  ('Bacon Burger', 'Hambúrguer com muito bacon crocante', 32.90, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres'), true, true),
  ('Veggie Burger', 'Hambúrguer vegetariano de grão de bico', 30.90, 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=768', (SELECT id FROM categories WHERE name = 'Hambúrgueres'), true, false),
  
  ('Refrigerante Cola', 'Lata 350ml', 6.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas'), true, false),
  ('Suco de Laranja', 'Natural 500ml', 9.90, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas'), true, false),
  ('Água Mineral', 'Garrafa 500ml', 4.50, 'https://images.unsplash.com/photo-1638688569176-5b6db19f9d2a?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas'), true, false),
  ('Cerveja Artesanal', 'Long neck 355ml', 12.90, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?q=80&w=768', (SELECT id FROM categories WHERE name = 'Bebidas'), true, false),
  
  ('Batata Frita', 'Porção grande com cheddar e bacon', 22.90, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=768', (SELECT id FROM categories WHERE name = 'Porções'), true, true),
  ('Onion Rings', 'Anéis de cebola empanados', 18.90, 'https://images.unsplash.com/photo-1639024471283-03518883512d?q=80&w=768', (SELECT id FROM categories WHERE name = 'Porções'), true, false),
  ('Nuggets', 'Porção com 10 unidades', 19.90, 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=768', (SELECT id FROM categories WHERE name = 'Porções'), true, false),
  
  ('Milkshake', 'Chocolate ou baunilha 400ml', 14.90, 'https://images.unsplash.com/photo-1619158401201-8fa932695178?q=80&w=768', (SELECT id FROM categories WHERE name = 'Sobremesas'), true, false),
  ('Brownie', 'Com sorvete de creme', 12.90, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?q=80&w=768', (SELECT id FROM categories WHERE name = 'Sobremesas'), true, true),
  ('Cheesecake', 'Com calda de frutas vermelhas', 15.90, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=768', (SELECT id FROM categories WHERE name = 'Sobremesas'), true, false);

-- Adicionar mais adicionais
INSERT INTO public.product_addons (name, description, price, available, is_global, max_options)
VALUES
  ('Ovo', 'Ovo frito', 2.50, true, true, 1),
  ('Queijo Extra', 'Fatia adicional de queijo', 3.00, true, true, 2),
  ('Molho BBQ', 'Molho barbecue', 1.50, true, true, 1),
  ('Molho Picante', 'Molho com pimenta', 1.50, true, true, 1),
  ('Guacamole', 'Pasta de abacate', 4.00, true, false, 1);

-- Criar relações entre produtos e adicionais
INSERT INTO public.product_addon_relations (product_id, addon_id)
SELECT p.id, a.id
FROM public.products p
CROSS JOIN public.product_addons a
WHERE 
  (p.name = 'Classic Burger' AND a.name IN ('Bacon', 'Cheddar', 'Ovo', 'Queijo Extra', 'Molho da casa')) OR
  (p.name = 'Cheese Burger' AND a.name IN ('Bacon', 'Hamburguer', 'Molho BBQ', 'Queijo Extra')) OR
  (p.name = 'Bacon Burger' AND a.name IN ('Cheddar', 'Hamburguer', 'Ovo', 'Molho Picante')) OR
  (p.name = 'Veggie Burger' AND a.name IN ('Queijo Extra', 'Guacamole', 'Molho da casa')) OR
  (p.name = 'Batata Frita' AND a.name IN ('Bacon', 'Cheddar', 'Molho da casa', 'Molho BBQ', 'Molho Picante'));

-- Criar informações do restaurante
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
-- FIM DO ARQUIVO UNIFICADO
-- =====================================================
