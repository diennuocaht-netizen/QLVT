-- =====================================================
-- 33-CREATE-PUSH-SUBSCRIPTIONS.SQL
-- Quản lý thiết bị đăng ký nhận Web Push Notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index tra cứu theo user_id và endpoint
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.user_push_subscriptions(endpoint);

-- Bật RLS
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies:
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.user_push_subscriptions
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.user_push_subscriptions
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.user_push_subscriptions
FOR UPDATE USING (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON public.user_push_subscriptions
FOR DELETE USING (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);
