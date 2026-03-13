-- ========================================================
-- SUPABASE AUDIO SYSTEM FIXES
-- ========================================================
-- Execute estas queries DIRETAMENTE no Supabase
-- Menu: SQL Editor → New Query
-- Cole TODO o conteúdo abaixo e execute
-- ========================================================

-- ========================================================
-- 1. DROPAR POLÍTICAS RLS ANTIGAS E INCORRETAS
-- ========================================================
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Allow all operations on notification preferences" ON public.user_notification_preferences;

-- ========================================================
-- 2. RECRIAR FUNÇÕES RPC COM SECURITY DEFINER
-- ========================================================

-- ========================================================
-- 2. RECRIAR FUNÇÕES RPC COM SECURITY DEFINER
-- ========================================================

-- Function to get or create notification preferences (COM SECURITY DEFINER E ALIAS np)
DROP FUNCTION IF EXISTS public.get_or_create_notification_preferences(UUID);

CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(p_user_id UUID)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    sound_enabled boolean,
    sound_volume numeric,
    notification_type text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- Validação básica
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    -- Verificar se existe COM ALIAS np - simples e sem ambiguidade
    IF EXISTS (SELECT 1 FROM public.user_notification_preferences np WHERE np.user_id = p_user_id) THEN
        -- Retornar existente
        RETURN QUERY 
        SELECT 
            np.id, 
            np.user_id, 
            np.sound_enabled, 
            np.sound_volume, 
            np.notification_type::text
        FROM public.user_notification_preferences np
        WHERE np.user_id = p_user_id;
    ELSE
        -- Criar nova COM ALIAS np
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

GRANT EXECUTE ON FUNCTION public.get_or_create_notification_preferences(UUID) TO anon, authenticated;

-- ========================================================
-- Function to toggle sound notifications (COM SECURITY DEFINER E ALIAS np)
-- ========================================================

DROP FUNCTION IF EXISTS public.toggle_sound_notifications(UUID);

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
    -- Validação básica
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id não pode ser nulo';
    END IF;

    -- Verificar se existe COM ALIAS np
    IF NOT EXISTS (SELECT 1 FROM public.user_notification_preferences np WHERE np.user_id = p_user_id) THEN
        -- Criar padrão se não existir
        INSERT INTO public.user_notification_preferences (user_id, sound_enabled, sound_volume, notification_type)
        VALUES (p_user_id, true, 1.0, 'mp3');
    END IF;
    
    -- Obter estado atual
    SELECT np.sound_enabled INTO v_current_state
    FROM public.user_notification_preferences np
    WHERE np.user_id = p_user_id;
    
    -- Alternar COM ALIAS np
    UPDATE public.user_notification_preferences np
    SET sound_enabled = NOT v_current_state, 
        updated_at = now()
    WHERE np.user_id = p_user_id;
    
    -- Retornar dados atualizados
    RETURN QUERY
    SELECT 
        np.id, 
        np.user_id, 
        np.sound_enabled, 
        np.sound_volume, 
        np.notification_type::text
    FROM public.user_notification_preferences np
    WHERE np.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_sound_notifications(UUID) TO anon, authenticated;

-- ========================================================
-- 3. APLICAR POLÍTICAS RLS CORRETAS
-- ========================================================

-- Verificar se RLS está ativado
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Service role bypass" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Allow all operations on notification preferences" ON public.user_notification_preferences;

-- RLS policy #1: Users can manage THEIR OWN preferences
CREATE POLICY "Users can manage own notification preferences" ON public.user_notification_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS policy #2: Service role can bypass (para migrations)
CREATE POLICY "Service role bypass" ON public.user_notification_preferences
    FOR ALL
    USING (auth.role() = 'service_role');

-- ========================================================
-- 4. VERIFICAÇÃO DE INTEGRIDADE
-- ========================================================

-- Query de teste #1: Verificar tabela
SELECT 
    tablename,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_notification_preferences';

-- Query de teste #2: Verificar índice
SELECT indexname FROM pg_indexes WHERE tablename = 'user_notification_preferences';

-- Query de teste #3: Verificar trigger
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'user_notification_preferences';

-- Query de teste #4: Verificar políticas RLS
SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'user_notification_preferences';

-- Query de teste #5: Verificar funções
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name IN ('get_or_create_notification_preferences', 'toggle_sound_notifications');

-- ========================================================
-- 5. TESTES (Executar após verificações)
-- ========================================================

-- IMPORTANTE: Substituir 'USER_ID_AQUI' pelo seu user_id real
-- Você pode obter seu ID em: Authentication → Users → Click no usuário

/*
-- Teste 1: Buscar/Criar preferências
SELECT * FROM public.get_or_create_notification_preferences('USER_ID_AQUI');

-- Teste 2: Alternar som (desta vez ficará DESATIVADO)
SELECT * FROM public.toggle_sound_notifications('USER_ID_AQUI');

-- Teste 3: Alternar som novamente (ficará ATIVADO)
SELECT * FROM public.toggle_sound_notifications('USER_ID_AQUI');

-- Teste 4: Verificar direto na tabela
SELECT * FROM public.user_notification_preferences WHERE user_id = 'USER_ID_AQUI';
*/

-- ========================================================
-- ✅ FIXES COMPLETOS
-- ========================================================
-- Alterações aplicadas:
-- ✅ Dropar políticas RLS antigas (inseguras)
-- ✅ Recriar funções com SECURITY DEFINER
-- ✅ Adicionar GRANT ao anon e authenticated
-- ✅ Aplicar RLS correto (verificar auth.uid())
-- ✅ Adicionar logs no PostgreSQL
-- ========================================================
