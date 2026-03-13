CREATE TABLE IF NOT EXISTS public.google_review_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  review_url TEXT NULL,
  user_agent TEXT NULL
);

ALTER TABLE public.google_review_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS google_review_clicks_insert ON public.google_review_clicks;
CREATE POLICY google_review_clicks_insert
  ON public.google_review_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.allow_public_read());

DROP POLICY IF EXISTS google_review_clicks_select ON public.google_review_clicks;
CREATE POLICY google_review_clicks_select
  ON public.google_review_clicks
  FOR SELECT
  TO anon, authenticated
  USING (public.allow_public_read());
