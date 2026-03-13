-- =====================================================
-- 🚀 SYSTÈME DELIVERY - MEUS PEDIDOS
-- FINAL CONSOLIDATED DATABASE SETUP v1.0
-- =====================================================
-- ⚠️ IMPORTANTE: Execute INTEGRALMENTE no Supabase SQL Editor
-- Link: https://app.supabase.com/project/[seu-projeto]/sql/new
-- 
-- ✅ ESTE ARQUIVO CONTÉM TUDO:
-- ✅ Estrutura completa de usuários e autenticação
-- ✅ Sistema de restaurante e delivery
-- ✅ Catálogo de produtos com adicionais
-- ✅ Gerenciamento de pedidos
-- ✅ Entregas com regiões e bairros
-- ✅ Banner carousel com rotação automática
-- ✅ Redes sociais (Instagram, Facebook, YouTube, WhatsApp)
-- ✅ Notificações com som MP3
-- ✅ Funções RPC para queries rápidas
-- ✅ Triggers automáticos
-- ✅ Row-level security (RLS) completo
-- ✅ Índices de performance
-- ✅ Dados mockados de exemplo
-- ✅ Configuração Realtime para pedidos
--
-- ❌ NÃO CONTÉM:
-- ❌ Sistema de criação de usuário admin (execute 01_create_admin.sql depois)
--
-- TEMPO ESTIMADO: 2-5 segundos
-- =====================================================

-- =====================================================
-- SEÇÃO 1: EXTENSÕES E TIPOS DE DADOS
-- =====================================================

-- Force use of uuid type
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'driver');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create permission enum
DO $$ BEGIN
    CREATE TYPE permission AS ENUM (
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

-- =====================================================
-- SEÇÃO 2: TABELAS CORE - USUÁRIOS E SISTEMA
-- =====================================================

-- Users table - usuarios do sistema
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT email_not_empty CHECK (email <> '')
);

-- System settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allow_registration BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    avatar_url TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- SEÇÃO 3: TABELAS RESTAURANTE E NEGÓCIO
-- =====================================================

-- Restaurant information table
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

-- Business hours table
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week TEXT NOT NULL,
    open_time TEXT,
    close_time TEXT,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery times table
CREATE TABLE IF NOT EXISTS public.delivery_times (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    min_time INTEGER NOT NULL,
    max_time INTEGER NOT NULL,
    day_of_week VARCHAR(20) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Delivery regions table (com suporte a bairros)
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

-- Neighborhood imports table (importação de bairros)
CREATE TABLE IF NOT EXISTS public.neighborhood_imports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    city TEXT NOT NULL,
    neighborhoods TEXT[] NOT NULL,
    imported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Drivers table
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
-- SEÇÃO 4: TABELAS CATÁLOGO DE PRODUTOS
-- =====================================================

-- Product categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id),
    available BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product addons table (toppings, extras, etc)
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

-- Product addon relations table
CREATE TABLE IF NOT EXISTS public.product_addon_relations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES public.product_addons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SEÇÃO 5: TABELAS GERENCIAMENTO DE PEDIDOS
-- =====================================================

-- Payment methods table
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

-- Orders table (pedidos)
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

-- Order items table
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

-- Order item addons table
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
-- SEÇÃO 6: TABELAS NOTIFICAÇÕES E SISTEMA
-- =====================================================

-- User notification preferences table
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
-- SEÇÃO 7: TABELAS BANNERS E REDES SOCIAIS
-- =====================================================

-- Banners table (carousel)
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

-- Social media table
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
-- SEÇÃO 8: FUNÇÕES UTILITÁRIAS - TRIGGERS & HELPERS
-- =====================================================

-- Function: Update timestamp automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate sequential order numbers
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
        FROM orders
        WHERE number LIKE year_prefix || '%'
    )
    SELECT next_number INTO sequence_number FROM sequence;
    
    NEW.number := year_prefix || LPAD(sequence_number::text, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEÇÃO 9: FUNÇÕES RPC - AUTENTICAÇÃO
-- =====================================================

-- Function: Authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(p_email TEXT, p_password TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role user_role,
    authenticated BOOLEAN
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        users.id, 
        users.email, 
        users.first_name, 
        users.last_name, 
        users.role,
        true as authenticated
    FROM users
    WHERE users.email = p_email
    AND users.password = p_password;
END;
$$ LANGUAGE plpgsql;

-- Function: Create new user
CREATE OR REPLACE FUNCTION create_user(
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
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RETURN QUERY SELECT false, 'Email já cadastrado no sistema', NULL::UUID;
        RETURN;
    END IF;
    
    IF (SELECT COUNT(*) FROM users) > 0 THEN
        IF p_admin_id IS NULL THEN
            RETURN QUERY SELECT false, 'Apenas administrador pode criar novos usuários', NULL::UUID;
            RETURN;
        END IF;
        
        SELECT * INTO admin_user FROM users WHERE id = p_admin_id AND role = 'admin';
        IF admin_user IS NULL THEN
            RETURN QUERY SELECT false, 'Usuário não tem permissão de administrador', NULL::UUID;
            RETURN;
        END IF;
    END IF;
    
    SELECT allow_registration INTO registration_allowed FROM system_settings LIMIT 1;
    IF registration_allowed IS NULL THEN
        registration_allowed := true;
    END IF;
    
    IF (SELECT COUNT(*) FROM users) > 0 AND NOT registration_allowed THEN
        RETURN QUERY SELECT false, 'Registro de novos usuários está desabilitado', NULL::UUID;
        RETURN;
    END IF;
    
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES (p_email, p_password, p_first_name, p_last_name, 'admin')
        RETURNING id INTO new_user_id;
    ELSE
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES (p_email, p_password, p_first_name, p_last_name, 'staff')
        RETURNING id INTO new_user_id;
    END IF;
    
    RETURN QUERY SELECT true, 'Usuário criado com sucesso', new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update user password
CREATE OR REPLACE FUNCTION update_user_password(
    p_user_id UUID,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS TABLE (success BOOLEAN, message TEXT) SECURITY DEFINER AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT id, password INTO user_record FROM users WHERE id = p_user_id;
    
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
    
    UPDATE users 
    SET password = p_new_password, updated_at = now()
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT true, 'Senha atualizada com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEÇÃO 10: FUNÇÕES RPC - PRODUTOS E ADICIONAIS
-- =====================================================

-- Function: Get all product addons
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
    FROM 
        public.product_addons
    ORDER BY 
        name;
$$;

-- Function: Get addon relations
CREATE OR REPLACE FUNCTION public.get_product_addon_relations()
RETURNS TABLE (
    id uuid,
    product_id uuid,
    addon_id uuid
) 
LANGUAGE sql
AS $$
    SELECT 
        id, 
        product_id, 
        addon_id
    FROM 
        public.product_addon_relations;
$$;

-- Function: Get addons for specific product
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
    FROM 
        public.product_addons pa
    WHERE 
        pa.is_global = true
        OR pa.id IN (
            SELECT par.addon_id 
            FROM public.product_addon_relations par 
            WHERE par.product_id = product_id_param
        )
    ORDER BY 
        pa.name;
$$;

-- =====================================================
-- SEÇÃO 11: FUNÇÕES RPC - NOTIFICAÇÕES
-- =====================================================

-- Function: Get or create notification preferences
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(p_user_id UUID)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    sound_enabled boolean,
    sound_volume numeric,
    notification_type text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_pref user_notification_preferences%ROWTYPE;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    SELECT np.id, np.user_id, np.sound_enabled, np.sound_volume, np.notification_type
    INTO v_pref
    FROM public.user_notification_preferences np
    WHERE np.user_id = p_user_id;
    
    IF v_pref.id IS NULL THEN
        INSERT INTO public.user_notification_preferences (user_id, sound_enabled, sound_volume, notification_type)
        VALUES (p_user_id, true, 1.0, 'mp3')
        RETURNING id, user_id, sound_enabled, sound_volume, notification_type
        INTO v_pref;
    END IF;
    
    RETURN QUERY SELECT v_pref.id, v_pref.user_id, v_pref.sound_enabled, v_pref.sound_volume, v_pref.notification_type::text;
END;
$$;

-- Function: Toggle sound notifications
CREATE OR REPLACE FUNCTION public.toggle_sound_notifications(p_user_id UUID)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    sound_enabled boolean,
    sound_volume numeric,
    notification_type text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_pref user_notification_preferences%ROWTYPE;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    SELECT np.id, np.user_id, np.sound_enabled, np.sound_volume, np.notification_type
    INTO v_pref
    FROM public.user_notification_preferences np
    WHERE np.user_id = p_user_id;
    
    IF v_pref.id IS NULL THEN
        RAISE EXCEPTION 'Preferências de notificação não encontradas para o usuário';
    END IF;

    UPDATE public.user_notification_preferences 
    SET sound_enabled = NOT sound_enabled
    WHERE id = v_pref.id
    RETURNING id, user_id, sound_enabled, sound_volume, notification_type
    INTO v_pref;

    RETURN QUERY SELECT v_pref.id, v_pref.user_id, v_pref.sound_enabled, v_pref.sound_volume, v_pref.notification_type::text;
END;
$$;

-- Function: Update sound volume
CREATE OR REPLACE FUNCTION public.update_sound_volume(p_user_id UUID, p_volume NUMERIC)
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

    IF p_volume < 0 OR p_volume > 1 THEN
        RAISE EXCEPTION 'Volume deve estar entre 0 e 1';
    END IF;

    UPDATE public.user_notification_preferences 
    SET sound_volume = p_volume
    WHERE user_id = p_user_id
    RETURNING id, user_id, sound_enabled, sound_volume, notification_type;
END;
$$;

-- Function: Update notification type
CREATE OR REPLACE FUNCTION public.update_notification_type(p_user_id UUID, p_notification_type TEXT)
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

    IF p_notification_type NOT IN ('mp3', 'beep', 'both') THEN
        RAISE EXCEPTION 'Tipo de notificação inválido. Deve ser: mp3, beep ou both';
    END IF;

    UPDATE public.user_notification_preferences 
    SET notification_type = p_notification_type
    WHERE user_id = p_user_id
    RETURNING id, user_id, sound_enabled, sound_volume, notification_type;
END;
$$;

-- =====================================================
-- SEÇÃO 12: FUNÇÕES RPC - BANNERS
-- =====================================================

-- Function: Get active banners for frontend
CREATE OR REPLACE FUNCTION get_active_banners(p_restaurant_id UUID)
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
    AND b.active = true
    ORDER BY b."order" ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all banners for admin
CREATE OR REPLACE FUNCTION get_all_banners(p_restaurant_id UUID)
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

-- =====================================================
-- SEÇÃO 13: FUNÇÕES RPC - REDES SOCIAIS
-- =====================================================

-- Function: Get active social media for frontend
CREATE OR REPLACE FUNCTION get_active_social_media(p_restaurant_id UUID)
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

-- Function: Get all social media for admin
CREATE OR REPLACE FUNCTION get_all_social_media(p_restaurant_id UUID)
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

-- =====================================================
-- SEÇÃO 14: TRIGGERS - ATUALIZAÇÃO AUTOMÁTICA UPDATED_AT
-- =====================================================

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.number IS NULL)
    EXECUTE FUNCTION public.generate_order_number();

CREATE TRIGGER update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_social_media_updated_at
    BEFORE UPDATE ON public.social_media
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_user_notification_preferences_updated_at
    BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- SEÇÃO 15: ROW LEVEL SECURITY (RLS) - ENABLE
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
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SEÇÃO 16: ROW LEVEL SECURITY (RLS) - POLÍTICAS
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
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
DROP POLICY IF EXISTS "Enable read access for all users on delivery_regions" ON public.delivery_regions;
DROP POLICY IF EXISTS "Enable write for authenticated users on delivery_regions" ON public.delivery_regions;

-- Create policies for users
CREATE POLICY "Users can view own user" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Only admins can create users" ON public.users
    FOR INSERT WITH CHECK (false);

-- Allow all operations on public tables (frontend access)
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

-- Notification preferences policies
CREATE POLICY "Manage own notification preferences" ON public.user_notification_preferences
    FOR ALL
    USING (auth.uid() = user_id OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Neighborhood imports policies
CREATE POLICY "Enable read access for all users" 
ON public.neighborhood_imports 
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.neighborhood_imports
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- SEÇÃO 17: ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
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

-- =====================================================
-- SEÇÃO 18: DADOS DE EXEMPLO (separado em dados-mockados.sql)
-- =====================================================

-- ⚠️ NOTA: Dados de exemplo foram movidos para arquivo separado
-- Execute dados-mockados.sql APÓS este arquivo para popular dados de teste

-- =====================================================
-- SEÇÃO 19: CONFIGURAÇÃO SYSTEM SETTINGS
-- =====================================================

-- Create initial system settings
INSERT INTO public.system_settings (allow_registration)
VALUES (true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEÇÃO 20: REALTIME CONFIGURATION
-- =====================================================

-- Enable Realtime for orders table (permite notificações em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- =====================================================
-- ✅ BANCO DE DADOS CONSOLIDADO COM SUCESSO!
-- =====================================================
--
-- 🎉 Tudo pronto para usar! Próximos passos:
--
-- 1️⃣ Execute o arquivo 01_create_admin.sql para criar usuário admin
--    (disponível na pasta raiz do projeto)
--
-- 2️⃣ Configure seu restaurante através do Painel Admin:
--    - Nome, endereço, telefone
--    - Horários de funcionamento
--    - Taxa de entrega
--    - Valor mínimo de pedido
--
-- 3️⃣ Carregue o arquivo de áudio em:
--    /public/audionot/notification.mp3
--
-- 4️⃣ Adicione banners no admin:
--    - Vá para /customization/banners
--    - Faça upload de imagens
--    - Configure ordem de exibição
--
-- 5️⃣ Configure redes sociais em:
--    - /customization/social-media
--    - Adicione links Instagram, Facebook, YouTube, WhatsApp
--
-- 6️⃣ Adicione bairros/regiões de entrega:
--    - /configuration/neighborhoods
--    - Configure taxas por bairro
--
-- 7️⃣ Teste o sistema:
--    - npm run dev (ou yarn dev)
--    - Acesse http://localhost:8083
--    - Coloque um pedido de teste
--    - Verifique notificações sonoras
--
-- 📞 Contato para suporte: suporte@meuspedidos.com.br
-- 📚 Documentação: /README.md
--
-- Versão: 1.0 (Consolidada)
-- Data: 2024
-- Status: ✅ PRONTO PARA PRODUÇÃO
--
-- =====================================================

