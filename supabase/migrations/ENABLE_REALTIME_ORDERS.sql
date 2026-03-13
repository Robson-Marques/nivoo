-- ============================================================
-- ATIVAR REALTIME PARA TABELA ORDERS
-- ============================================================
-- Execute este comando no SQL Editor do Supabase
-- (https://supabase.com/dashboard/project/)
-- 
-- Isso vai permitir que o hook useNotifications receba eventos
-- INSERT quando novos pedidos forem criados

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Verificar se foi ativado com sucesso
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders';
