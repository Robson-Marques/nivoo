-- =====================================================
-- DELIVERYMAX / MEUS PEDIDOS - DROP ALL DATABASE
-- Use com EXTREMO CUIDADO: este script remove TODO o conteúdo do schema `public`.
-- Copie e cole no SQL Editor do Supabase quando quiser apagar tudo.
-- =====================================================

-- AVISO: Este script é destrutivo. Faça backup antes de executar.

BEGIN;

-- 1) Remover publicação realtime se existir
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 2) Tentar remover bucket de storage (opcional)
-- (pode falhar se você não tem permissão; é seguro ignorar erros)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'storage' AND tablename = 'buckets') THEN
    DELETE FROM storage.buckets WHERE id = 'product-images';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Não foi possível remover registro do bucket product-images (ignorado).';
END $$;

-- 3) Drop completo do schema public (remove tabelas, tipos, funções, políticas, triggers, índices)
DROP SCHEMA public CASCADE;

-- 4) Recriar schema public vazio (opcional, para manter o DB utilizável)
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;

-- 5) Remover extensões usadas (opcional)
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS pgcrypto CASCADE;

COMMIT;

-- =====================================================
-- Observações / instruções pós-execução:
-- - Este script remove tudo do schema `public`. Após executá-lo, o banco ficará vazio.
-- - Se quiser preservar extensões, remova as linhas de DROP EXTENSION.
-- - Para restaurar o esquema inicial, execute seu arquivo de criação (ex.: `COMPLETO_BANCO_UNIFICADO.sql`).
-- =====================================================
