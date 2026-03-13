-- Migration 005: Create RPC Functions for Advanced Features
-- Propósito: APIs banco de dados para galeria, configurações e enhancements
-- Data: 2026-02-24

-- =====================================================
-- RPC 001: get_product_with_gallery
-- Retorna produto com todas as imagens, configurações e badges ordenados
-- =====================================================

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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_product RECORD;
    v_images JSONB;
    v_configs JSONB;
    v_badges JSONB;
    v_enhancements JSONB;
BEGIN
    -- Fetch product
    SELECT * INTO v_product FROM public.products WHERE id = p_product_id;
    
    IF v_product IS NULL THEN
        RETURN;
    END IF;
    
    -- Fetch images
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
    
    -- Fetch configurations
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
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', pco.id,
                            'label', pco.option_label,
                            'value', pco.option_value,
                            'additionalPrice', pco.additional_price,
                            'displayOrder', pco.display_order,
                            'isActive', pco.is_active
                        ) ORDER BY pco.display_order ASC
                    )
                    FROM public.product_configuration_options pco
                    WHERE pco.configuration_id = pc.id AND pco.is_active = true
                )
            ) ORDER BY pc.display_order ASC
        ), '[]'::jsonb)
        INTO v_configs
        FROM public.product_configurations pc
        WHERE pc.product_id = p_product_id;
    END IF;
    
    -- Fetch badges
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
    
    -- Fetch enhancements
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
    
    -- Return combined result
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

-- =====================================================
-- RPC 002: save_product_configurations
-- Salva múltiplas configurações atomicamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.save_product_configurations(
    p_product_id UUID,
    p_configurations JSONB,
    p_options JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    configuration_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_config_count INTEGER;
    v_option_count INTEGER;
    v_config JSONB;
    v_config_id UUID;
    v_option JSONB;
BEGIN
    -- Validar contagens
    v_config_count := jsonb_array_length(p_configurations);
    IF v_config_count > 20 THEN
        RETURN QUERY SELECT false, 'Máximo 20 configurações por produto'::TEXT, 0;
        RETURN;
    END IF;
    
    -- Deletar configurações antigas
    DELETE FROM public.product_configurations WHERE product_id = p_product_id;
    
    -- Inserir novas configurações
    FOR v_config IN SELECT jsonb_array_elements(p_configurations)
    LOOP
        INSERT INTO public.product_configurations (
            product_id, config_key, config_label, field_type,
            is_required, display_order, max_selections, help_text
        ) VALUES (
            p_product_id,
            v_config->>'configKey',
            v_config->>'configLabel',
            v_config->>'fieldType',
            COALESCE((v_config->>'isRequired')::BOOLEAN, false),
            COALESCE((v_config->>'displayOrder')::INTEGER, 0),
            (v_config->>'maxSelections')::INTEGER,
            v_config->>'helpText'
        )
        RETURNING id INTO v_config_id;
        
        -- Inserir opções para esta configuração
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
    END LOOP;
    
    RETURN QUERY SELECT 
        true,
        'Configurações salvas com sucesso'::TEXT,
        v_config_count;
END;
$$;

-- =====================================================
-- RPC 003: reorder_product_images
-- Reordena imagens de um produto
-- =====================================================

CREATE OR REPLACE FUNCTION public.reorder_product_images(
    p_product_id UUID,
    p_image_orders JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order JSONB;
    v_image_id UUID;
    v_order_value INTEGER;
BEGIN
    -- Validar que todas as imagens pertencem ao produto
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
    
    -- Atualizar ordem
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

-- =====================================================
-- RPC 004: get_product_configuration_preview
-- Retorna preview renderizável de configuração
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_product_configuration_preview(
    p_product_id UUID
)
RETURNS TABLE (
    html_preview TEXT,
    additional_price_total DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
        
        -- Renderizar options baseado no field_type
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

-- =====================================================
-- RPC 005: upsert_product_badge
-- Cria ou atualiza um badge de produto
-- =====================================================

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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_badge_id UUID;
BEGIN
    INSERT INTO public.product_badges (
        product_id, badge_type, badge_label, badge_color, badge_position
    ) VALUES (
        p_product_id,
        p_badge_type::product_badge_type,
        p_badge_label,
        p_badge_color,
        p_badge_position::product_badge_position
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

-- =====================================================
-- RPC 006: upsert_product_enhancement
-- Cria ou atualiza enhancement de produto
-- =====================================================

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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
        expanded_description = COALESCE(EXCLUDED.expanded_description, product_enhancements.expanded_description),
        trust_triggers = COALESCE(EXCLUDED.trust_triggers, product_enhancements.trust_triggers),
        warranty_text = COALESCE(EXCLUDED.warranty_text, product_enhancements.warranty_text),
        stock_warning = COALESCE(EXCLUDED.stock_warning, product_enhancements.stock_warning),
        highlight_section = COALESCE(EXCLUDED.highlight_section, product_enhancements.highlight_section);
    
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

-- =====================================================
-- ✅ Migration 005 Concluída
-- =====================================================
