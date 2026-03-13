-- Permitir leitura e escrita do avatar no profiles sem quebrar o fluxo atual do sistema.
-- Observação: o sistema atual usa autenticação via RPC (não Supabase Auth), então a role costuma ser anon.

CREATE OR REPLACE FUNCTION public.allow_public_read()
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT true;
$$;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_public_select ON public.profiles;
CREATE POLICY profiles_public_select
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());

DROP POLICY IF EXISTS profiles_public_insert ON public.profiles;
CREATE POLICY profiles_public_insert
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.allow_public_read());

DROP POLICY IF EXISTS profiles_public_update ON public.profiles;
CREATE POLICY profiles_public_update
  ON public.profiles
  FOR UPDATE
  TO anon, authenticated
  USING (public.allow_public_read())
  WITH CHECK (public.allow_public_read());
