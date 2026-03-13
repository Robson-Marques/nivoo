-- ============================================================================
-- SCRIPT: ATIVAR REALTIME (VERSION 2 - SEM PUBLICAÇÃO)
-- Para projetos onde supabase_realtime not foi criado automaticamente
-- ============================================================================

-- 1. ATIVAR REPLICA IDENTITY (obrigatório para realtime)
ALTER TABLE "orders" REPLICA IDENTITY FULL;

-- 2. TENTAR CRIAR PUBLICAÇÃO SE NÃO EXISTIR (tolerante a erros)
-- Se já existe, ignora o erro
DO $$
BEGIN
  CREATE PUBLICATION supabase_realtime FOR TABLE "orders";
  RAISE NOTICE '✅ Publication supabase_realtime criada';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE '✅ Publication supabase_realtime já existe';
END $$;

-- 3. ADICIONAR TABELAS À PUBLICAÇÃO
ALTER PUBLICATION supabase_realtime ADD TABLE "orders";
ALTER PUBLICATION supabase_realtime ADD TABLE "order_items";
ALTER PUBLICATION supabase_realtime ADD TABLE "order_item_addons";

-- 4. GARANTIR PERMISSÕES
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
SELECT 
  'orders' as table_name,
  rowsecurity,
  'ATIVA' as status
FROM pg_tables 
WHERE tablename = 'orders' AND schemaname = 'public'

UNION ALL

SELECT 
  pubname as table_name,
  't'::boolean as rowsecurity,
  'PUB_EXISTS' as status
FROM pg_publication
WHERE pubname = 'supabase_realtime';
