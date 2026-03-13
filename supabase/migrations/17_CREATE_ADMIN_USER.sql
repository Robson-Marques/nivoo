-- =====================================================
-- CRIAR ADMIN USER NA TABELA admin_users
-- Email: italomaicon441@gmail.com
-- Data: 2026-03-02
-- =====================================================

-- 1) Obter o user_id do Supabase Auth para o email informado
-- Execute este SELECT primeiro para pegar o UUID correto:
SELECT id, email FROM auth.users WHERE email = 'italomaicon441@gmail.com';

-- 2) Insira o UUID retornado no INSERT abaixo (substitua SEU_UUID_AQUI pelo valor acima)
INSERT INTO public.admin_users (user_id)
VALUES ('SEU_UUID_AQUI')
ON CONFLICT (user_id) DO NOTHING;

-- 3) Verifique se foi inserido
SELECT * FROM public.admin_users WHERE user_id = 'SEU_UUID_AQUI';

-- =====================================================
-- INSTRUÇÕES:
-- 1) Execute o SELECT do passo 1 e copie o UUID
-- 2) Substitua SEU_UUID_AQUI nos comandos 2 e 3
-- 3) Execute os INSERT e SELECT
-- =====================================================
