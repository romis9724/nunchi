CREATE TABLE IF NOT EXISTS public.feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  type       TEXT        NOT NULL DEFAULT 'suggestion'
               CHECK (type IN ('bug', 'suggestion', 'praise')),
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_auth" ON public.feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "feedback_select_admin" ON public.feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
