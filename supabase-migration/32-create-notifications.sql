-- =====================================================
-- 32-CREATE-NOTIFICATIONS.SQL
-- Bảng quản lý thông báo nội bộ người dùng (In-App Notifications)
-- Chạy script này trong Supabase SQL Editor
-- =====================================================

-- 1. Tạo bảng notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  target_role TEXT CHECK (target_role IS NULL OR target_role IN ('admin', 'manager', 'viewer')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Đánh index tối ưu tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON public.notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Bật Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Tạo các policies
DROP POLICY IF EXISTS "Users can read own or broadcast notifications" ON public.notifications;
CREATE POLICY "Users can read own or broadcast notifications" ON public.notifications
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR
    user_id IS NULL OR
    target_role IS NULL OR
    target_role = (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1)
  )
);

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR user_id IS NULL
  )
);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR user_id IS NULL
  )
);

-- 5. Bật Realtime cho bảng notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
