-- =====================================================
-- Create activity_logs table to record user actions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  user_name text NULL,
  action text NOT NULL,
  entity_type text NULL,
  entity_id text NULL,
  details jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Simple index for queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
