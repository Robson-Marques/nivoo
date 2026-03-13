-- ============================================================================
-- SCRIPT: ATIVAR REALTIME E CORRIGIR PERMISSÕES FINAIS
-- OBJETIVO: Garantir que Realtime funciona para notificações de pedidos
--           e que todas as permissões estão corretas
-- ============================================================================

-- 1. ATIVAR REALTIME NA TABELA ORDERS (crítico para notificações)
ALTER TABLE "orders" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "orders";

-- 2. GARANTIR PERMISSÕES NA TABELA ORDERS
GRANT ALL ON TABLE "orders" TO "authenticated", "anon";
GRANT ALL ON TABLE "order_items" TO "authenticated", "anon";
GRANT ALL ON TABLE "order_item_addons" TO "authenticated", "anon";
GRANT ALL ON TABLE "user_notification_preferences" TO "authenticated", "anon";

-- 3. PERMITIR EXECUÇÃO DAS FUNCTIONS
GRANT EXECUTE ON FUNCTION "public"."toggle_sound_notifications"(UUID) TO "authenticated", "anon";
GRANT EXECUTE ON FUNCTION "public"."get_or_create_notification_preferences"(UUID) TO "authenticated", "anon";

-- 4. RELAX RLS POLICIES SE NECESSÁRIO (permissivo para admin/PDV)
-- Desativar RLS para testes ou aplicar policies permissivas:
ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "order_item_addons" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_notification_preferences" DISABLE ROW LEVEL SECURITY;

-- 5. VERIFICAÇÃO
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'order_item_addons', 'user_notification_preferences')
ORDER BY tablename;

-- 6. LOG
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime e permissões configuradas com sucesso';
  RAISE NOTICE '📡 Tabela orders com REPLICA IDENTITY FULL para realtime';
  RAISE NOTICE '🔓 RLS desabilitada para admin/PDV funcionar normalmente';
  RAISE NOTICE '🔊 Sistema pronto para notificações sonoras';
END $$;
