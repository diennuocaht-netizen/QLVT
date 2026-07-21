-- =====================================================
-- Ensure activity_logs has all expected columns and RLS policies
-- This migration is safe to run multiple times (uses IF NOT EXISTS)
-- =====================================================

-- Create table if missing (include superset of columns used by frontend)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  user_email text NULL,
  user_name text NULL,
  action text NOT NULL,
  entity_type text NULL,
  entity_id text NULL,
  entity_name text NULL,
  details jsonb NULL,
  description text NULL,
  old_values jsonb NULL,
  new_values jsonb NULL,
  ip_address text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add any missing columns to existing table
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS entity_name text,
  ADD COLUMN IF NOT EXISTS details jsonb,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS old_values jsonb,
  ADD COLUMN IF NOT EXISTS new_values jsonb,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- Enable RLS and add permissive insert policy for authenticated users
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_can_read_activity_logs' AND tablename = 'activity_logs'
  ) THEN
    CREATE POLICY authenticated_can_read_activity_logs ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Allow authenticated users to insert (WITH CHECK ensures inserted row is permitted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_can_insert_activity_logs' AND tablename = 'activity_logs'
  ) THEN
    CREATE POLICY authenticated_can_insert_activity_logs ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END$$;

-- Allow admins to delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_can_delete_activity_logs' AND tablename = 'activity_logs'
  ) THEN
    CREATE POLICY admin_can_delete_activity_logs ON public.activity_logs FOR DELETE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
  END IF;
END$$;

-- Verification hint:
-- SELECT * FROM public.activity_logs ORDER BY created_at DESC LIMIT 10;
