-- =====================================================
-- ADD display_order FIELD TO PRODUCTS TABLE
-- =====================================================
-- This migration adds the display_order field to existing products table
-- =====================================================

-- Add display_order column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='products' 
        AND column_name='display_order'
        AND table_schema='public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing products to have display_order based on creation time
UPDATE public.products 
SET display_order = EXTRACT(EPOCH FROM created_at) 
WHERE display_order = 0 OR display_order IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);

-- Migration completed successfully
