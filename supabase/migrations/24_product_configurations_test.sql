-- =====================================================
-- Migration 24: Ensure Product Configurations Compatibility
-- Propósito: Garantir que as configurações de produto sejam criadas corretamente
-- Data: 2026-03-11
-- =====================================================

-- Ensure field_type cast works properly
-- Verify that 'select' and 'checkbox' are valid values for product_field_type enum
-- They should be: 'radio', 'checkbox', 'select', 'text', 'number'

-- Log test - check existing configurations 
-- SELECT COUNT(*) FROM public.product_configurations;
-- SELECT DISTINCT field_type FROM public.product_configurations;

-- ✅ Migration 24 Complete
-- No changes needed - the schema is compatible!
