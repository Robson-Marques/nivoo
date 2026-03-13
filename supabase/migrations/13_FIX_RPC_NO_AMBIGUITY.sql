-- ============================================================================
-- CORRIGIR RPC FUNCTIONS - SEM AMBIGUIDADE
-- ============================================================================

-- DROP das funções antigas (para limpar)
DROP FUNCTION IF EXISTS public.toggle_sound_notifications(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_notification_preferences(UUID) CASCADE;

-- ============================================================================
-- FUNCTION 1: Get or Create Notification Preferences (FUNCIONA 100%)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(p_user_id UUID)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    sound_enabled boolean,
    sound_volume numeric,
    notification_type text
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
    v_id uuid;
    v_user_id uuid;
    v_sound_enabled boolean;
    v_sound_volume numeric;
    v_notification_type text;
BEGIN
    -- Verificar entrada
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    -- Tentar buscar
    SELECT 
        unp.id,
        unp.user_id,
        unp.sound_enabled,
        unp.sound_volume,
        unp.notification_type
    INTO 
        v_id,
        v_user_id,
        v_sound_enabled,
        v_sound_volume,
        v_notification_type
    FROM public.user_notification_preferences unp
    WHERE unp.user_id = p_user_id;
    
    -- Se não existe, criar
    IF v_id IS NULL THEN
        INSERT INTO public.user_notification_preferences 
            (user_id, sound_enabled, sound_volume, notification_type)
        VALUES 
            (p_user_id, true, 1.0, 'mp3')
        RETURNING 
            user_notification_preferences.id,
            user_notification_preferences.user_id,
            user_notification_preferences.sound_enabled,
            user_notification_preferences.sound_volume,
            user_notification_preferences.notification_type
        INTO 
            v_id,
            v_user_id,
            v_sound_enabled,
            v_sound_volume,
            v_notification_type;
    END IF;
    
    -- Retornar valores das variáveis (NUNCA da tabela)
    RETURN QUERY SELECT v_id, v_user_id, v_sound_enabled, v_sound_volume, v_notification_type;
END;
$$;

-- ============================================================================
-- FUNCTION 2: Toggle Sound Notifications (VERSÃO SEM AMBIGUIDADE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.toggle_sound_notifications(p_user_id UUID)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    sound_enabled boolean,
    sound_volume numeric,
    notification_type text
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
    v_id uuid;
    v_user_id uuid;
    v_sound_enabled boolean;
    v_sound_volume numeric;
    v_notification_type text;
BEGIN
    -- Verificar entrada
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    -- PASSO 1: Buscar ou criar preferências
    SELECT * INTO v_id, v_user_id, v_sound_enabled, v_sound_volume, v_notification_type
    FROM public.get_or_create_notification_preferences(p_user_id);
    
    -- PASSO 2: Alternar o som
    UPDATE public.user_notification_preferences unp
    SET sound_enabled = NOT unp.sound_enabled
    WHERE unp.id = v_id
    RETURNING
        unp.id,
        unp.user_id,
        unp.sound_enabled,
        unp.sound_volume,
        unp.notification_type
    INTO
        v_id,
        v_user_id,
        v_sound_enabled,
        v_sound_volume,
        v_notification_type;
    
    -- PASSO 3: Retornar das variáveis (NUNCA da tabela)
    RETURN QUERY SELECT v_id, v_user_id, v_sound_enabled, v_sound_volume, v_notification_type;
END;
$$;

-- ============================================================================
-- PERMISSÕES (garantir que podem ser executadas)
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_or_create_notification_preferences(UUID) 
  TO "authenticated", "anon";

GRANT EXECUTE ON FUNCTION public.toggle_sound_notifications(UUID) 
  TO "authenticated", "anon";

-- ============================================================================
-- LOG
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ RPC FUNCTIONS CORRIGIDAS COM SUCESSO!';
    RAISE NOTICE '✅ toggle_sound_notifications - PRONTO ✓';
    RAISE NOTICE '✅ get_or_create_notification_preferences - PRONTO ✓';
    RAISE NOTICE '✅ Sem ambiguidades = sem erro 42702 ✓';
    RAISE NOTICE '✅ ========================================';
END $$;
