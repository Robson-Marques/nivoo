-- 1) Criar tabela (se não existir)
CREATE TABLE IF NOT EXISTS public.order_item_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  configurations JSONB NOT NULL DEFAULT '{}'::jsonb,
  additional_price DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2) Garantir RLS ligado
ALTER TABLE public.order_item_configurations ENABLE ROW LEVEL SECURITY;

-- 3) Policy (cria só se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'order_item_configurations'
      AND policyname = 'Allow all operations on order_item_configurations'
  ) THEN
    CREATE POLICY "Allow all operations on order_item_configurations"
      ON public.order_item_configurations
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;