
CREATE TABLE public.development_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id TEXT NOT NULL,
  focus_dimension TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  weeks_total INT NOT NULL DEFAULT 6,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.manager_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES public.development_tracks(id) ON DELETE CASCADE,
  manager_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in-app',
  template_key TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.development_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tracks" ON public.development_tracks FOR SELECT USING (true);
CREATE POLICY "Public insert tracks" ON public.development_tracks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tracks" ON public.development_tracks FOR UPDATE USING (true);
CREATE POLICY "Public delete tracks" ON public.development_tracks FOR DELETE USING (true);

CREATE POLICY "Public read nudges" ON public.manager_nudges FOR SELECT USING (true);
CREATE POLICY "Public insert nudges" ON public.manager_nudges FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update nudges" ON public.manager_nudges FOR UPDATE USING (true);
CREATE POLICY "Public delete nudges" ON public.manager_nudges FOR DELETE USING (true);

CREATE INDEX idx_tracks_manager ON public.development_tracks(manager_id);
CREATE INDEX idx_nudges_track ON public.manager_nudges(track_id);
