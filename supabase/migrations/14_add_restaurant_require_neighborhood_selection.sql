-- Add setting to force delivery neighborhood selection from system autocomplete
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS require_neighborhood_selection boolean NOT NULL DEFAULT false;
