-- ============================================================================
-- CRIAR ADMIN PADRÃO
-- ============================================================================
-- Este arquivo cria um usuário admin único com todas as permissões
-- Email: admin@burgerhouse.com
-- Perfil: Admin do Sistema
-- Permissões: TODAS as permissões necessárias
-- Compatível com a estrutura atual do banco de dados
-- ============================================================================

-- ============================================================================
-- 01. LIMPAR ADMIN ANTERIOR SE EXISTIR
-- ============================================================================

DELETE FROM public.user_permissions 
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'admin@burgerhouse.com');

DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM public.users WHERE email = 'admin@burgerhouse.com');

DELETE FROM public.users WHERE email = 'admin@burgerhouse.com';

-- ============================================================================
-- 02. CRIAR USUÁRIO ADMIN
-- ============================================================================

INSERT INTO public.users (id, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@burgerhouse.com',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 03. CRIAR PERFIL ADMIN COM ROLE
-- ============================================================================

WITH admin_user AS (
  SELECT id FROM public.users 
  WHERE email = 'admin@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT 
  admin_user.id,
  'admin'::public.user_role,
  now(),
  now()
FROM admin_user
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 04. CONCEDER TODAS AS PERMISSÕES AO ADMIN
-- ============================================================================

WITH admin_user AS (
  SELECT id FROM public.users 
  WHERE email = 'admin@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.user_permissions (user_id, permission, created_at, updated_at)
SELECT 
  admin_user.id,
  permission_enum,
  now(),
  now()
FROM admin_user
CROSS JOIN (
  VALUES 
    ('dashboard'::public.permission),
    ('agenda'::public.permission),
    ('services'::public.permission),
    ('professionals'::public.permission),
    ('clients'::public.permission),
    ('loyalty'::public.permission),
    ('reports'::public.permission),
    ('settings'::public.permission),
    ('evolution_api'::public.permission),
    ('ai'::public.permission)
) AS permissions(permission_enum)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 05. CRIAR OUTROS USUÁRIOS DE TESTE (OPCIONAL)
-- ============================================================================

-- Gerenciador
INSERT INTO public.users (id, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'gerenciador@burgerhouse.com',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

WITH manager_user AS (
  SELECT id FROM public.users 
  WHERE email = 'gerenciador@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT 
  manager_user.id,
  'manager'::public.user_role,
  now(),
  now()
FROM manager_user
ON CONFLICT DO NOTHING;

WITH manager_user AS (
  SELECT id FROM public.users 
  WHERE email = 'gerenciador@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.user_permissions (user_id, permission, created_at, updated_at)
SELECT 
  manager_user.id,
  permission_enum,
  now(),
  now()
FROM manager_user
CROSS JOIN (
  VALUES 
    ('dashboard'::public.permission),
    ('agenda'::public.permission),
    ('services'::public.permission),
    ('clients'::public.permission),
    ('reports'::public.permission)
) AS permissions(permission_enum)
ON CONFLICT DO NOTHING;

-- Staff
INSERT INTO public.users (id, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'staff@burgerhouse.com',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

WITH staff_user AS (
  SELECT id FROM public.users 
  WHERE email = 'staff@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT 
  staff_user.id,
  'staff'::public.user_role,
  now(),
  now()
FROM staff_user
ON CONFLICT DO NOTHING;

WITH staff_user AS (
  SELECT id FROM public.users 
  WHERE email = 'staff@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.user_permissions (user_id, permission, created_at, updated_at)
SELECT 
  staff_user.id,
  permission_enum,
  now(),
  now()
FROM staff_user
CROSS JOIN (
  VALUES 
    ('agenda'::public.permission),
    ('services'::public.permission),
    ('clients'::public.permission)
) AS permissions(permission_enum)
ON CONFLICT DO NOTHING;

-- Motorista
INSERT INTO public.users (id, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'motorista@burgerhouse.com',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

WITH driver_user AS (
  SELECT id FROM public.users 
  WHERE email = 'motorista@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT 
  driver_user.id,
  'driver'::public.user_role,
  now(),
  now()
FROM driver_user
ON CONFLICT DO NOTHING;

WITH driver_user AS (
  SELECT id FROM public.users 
  WHERE email = 'motorista@burgerhouse.com'
  LIMIT 1
)
INSERT INTO public.user_permissions (user_id, permission, created_at, updated_at)
SELECT 
  driver_user.id,
  permission_enum,
  now(),
  now()
FROM driver_user
CROSS JOIN (
  VALUES 
    ('agenda'::public.permission),
    ('services'::public.permission)
) AS permissions(permission_enum)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 06. CRIAR PREFERÊNCIAS DE NOTIFICAÇÃO PARA TODOS OS USUÁRIOS
-- ============================================================================

WITH all_users AS (
  SELECT id FROM public.users
)
INSERT INTO public.user_notification_preferences (user_id, sound_enabled, email_notifications, sms_notifications, created_at, updated_at)
SELECT 
  all_users.id,
  true,
  true,
  false,
  now(),
  now()
FROM all_users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 07. VERIFICAÇÃO - LISTAR USUÁRIOS CRIADOS
-- ============================================================================

SELECT 
  u.id,
  u.email,
  p.role,
  ARRAY_AGG(up.permission) as permissoes,
  u.created_at
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_permissions up ON u.id = up.user_id
WHERE u.email IN ('admin@burgerhouse.com', 'gerenciador@burgerhouse.com', 'staff@burgerhouse.com', 'motorista@burgerhouse.com')
GROUP BY u.id, u.email, p.role, u.created_at
ORDER BY u.created_at DESC;

-- ============================================================================
-- USUÁRIOS CRIADOS COM SUCESSO!
-- ============================================================================
-- ADMIN:
--   Email: admin@burgerhouse.com
--   Papel: admin
--   Permissões: TODAS
--
-- GERENCIADOR:
--   Email: gerenciador@burgerhouse.com
--   Papel: manager
--   Permissões: dashboard, agenda, services, clients, reports
--
-- STAFF:
--   Email: staff@burgerhouse.com
--   Papel: staff
--   Permissões: agenda, services, clients
--
-- MOTORISTA:
--   Email: motorista@burgerhouse.com
--   Papel: driver
--   Permissões: agenda, services
-- ============================================================================
-- PRÓXIMOS PASSOS:
-- 1. Integrate com authentication provider (Auth0, Supabase Auth, etc)
-- 2. Configurar OAuth/SAML se necessário
-- 3. Implementar rate limiting
-- 4. Ativar 2FA para admin
-- ============================================================================
