-- Add scheduling support for orders

ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS max_scheduled_per_slot integer NOT NULL DEFAULT 10;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS scheduled_for timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON public.orders (scheduled_for);
