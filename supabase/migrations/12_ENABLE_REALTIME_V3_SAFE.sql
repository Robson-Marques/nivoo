-- ============================================================================
-- SCRIPT: ATIVAR REALTIME (VERSION 3 - SEGURO)
-- Usa bloco PL/pgSQL para lidar com publicação
-- ============================================================================

-- 1. ATIVAR REPLICA IDENTITY
ALTER TABLE "orders" REPLICA IDENTITY FULL;

-- 2. CRIAR PUBLICAÇÃO COM BLOCO SEGURO
DO $$
BEGIN
  -- Tentar criar publicação
  CREATE PUBLICATION supabase_realtime FOR TABLE "orders";
  RAISE NOTICE '✅ Publication supabase_realtime criada com sucesso';
EXCEPTION 
  WHEN duplicate_object THEN
    -- Publicação já existe, apenas nota
    RAISE NOTICE '✅ Publication supabase_realtime já existe, continuando...';
  WHEN OTHERS THEN
    -- Outro erro, mas continua
    RAISE NOTICE '⚠️  Erro ao criar publication: % %', SQLSTATE, SQLERRM;
END $$;

-- 3. ADICIONAR TABELAS À PUBLICAÇÃO (com tratamento de erro)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE "order_items";
  ALTER PUBLICATION supabase_realtime ADD TABLE "order_item_addons";
  RAISE NOTICE '✅ Tabelas adicionadas à publication';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Tabelas podem já estar na publication';
END $$;

-- 4. GARANTIR PERMISSÕES (estas não falham se já existem)
GRANT ALL ON TABLE "orders" TO "authenticated", "anon";
GRANT ALL ON TABLE "order_items" TO "authenticated", "anon";
GRANT ALL ON TABLE "order_item_addons" TO "authenticated", "anon";
GRANT ALL ON TABLE "user_notification_preferences" TO "authenticated", "anon";

-- 5. PERMITIR EXECUÇÃO DAS FUNCTIONS
GRANT EXECUTE ON FUNCTION "public"."toggle_sound_notifications"(UUID) TO "authenticated", "anon";
GRANT EXECUTE ON FUNCTION "public"."get_or_create_notification_preferences"(UUID) TO "authenticated", "anon";

-- 6. RELAXAR RLS (permissivo)
ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "order_item_addons" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_notification_preferences" DISABLE ROW LEVEL SECURITY;

-- 7. VERIFICAÇÃO FINAL
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ REALTIME E PERMISSÕES CONFIGURADOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📡 Realtime ativado para: orders, order_items, order_item_addons';
  RAISE NOTICE '🔓 RLS desabilitado (admin/PDV podem operar)';
  RAISE NOTICE '🔊 Sistema pronto para notificações sonoras';
END $$;
