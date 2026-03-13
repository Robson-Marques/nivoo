-- =====================================================
-- FIX: RLS Policies para product_configurations
-- Erro: 42501 - new row violates row-level security policy
-- =====================================================

-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON product_configurations;
DROP POLICY IF EXISTS "Allow authenticated users to select" ON product_configurations;
DROP POLICY IF EXISTS "product_configurations_insert" ON product_configurations;
DROP POLICY IF EXISTS "product_configurations_select" ON product_configurations;
DROP POLICY IF EXISTS "product_configurations_update" ON product_configurations;
DROP POLICY IF EXISTS "product_configurations_delete" ON product_configurations;

-- 2. HABILITAR RLS (se não estiver)
ALTER TABLE product_configurations ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS PERMISSIVAS PARA product_configurations

-- SELECT (qualquer um autenticado)
CREATE POLICY "product_configurations_public_select"
  ON product_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT (qualquer um autenticado)
CREATE POLICY "product_configurations_public_insert"
  ON product_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE (qualquer um autenticado)
CREATE POLICY "product_configurations_public_update"
  ON product_configurations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE (qualquer um autenticado)
CREATE POLICY "product_configurations_public_delete"
  ON product_configurations
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FAZER O MESMO PARA product_configuration_options
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated users to insert" ON product_configuration_options;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON product_configuration_options;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON product_configuration_options;
DROP POLICY IF EXISTS "Allow authenticated users to select" ON product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_insert" ON product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_select" ON product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_update" ON product_configuration_options;
DROP POLICY IF EXISTS "product_configuration_options_delete" ON product_configuration_options;

ALTER TABLE product_configuration_options ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "product_configuration_options_public_select"
  ON product_configuration_options
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT
CREATE POLICY "product_configuration_options_public_insert"
  ON product_configuration_options
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE
CREATE POLICY "product_configuration_options_public_update"
  ON product_configuration_options
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE
CREATE POLICY "product_configuration_options_public_delete"
  ON product_configuration_options
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('product_configurations', 'product_configuration_options')
ORDER BY tablename, policyname;
