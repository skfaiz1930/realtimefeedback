ALTER TABLE public.manager_nudges ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE public.manager_nudges ADD COLUMN IF NOT EXISTS week_number integer;
CREATE INDEX IF NOT EXISTS idx_manager_nudges_scheduled ON public.manager_nudges(scheduled_for) WHERE status = 'scheduled';