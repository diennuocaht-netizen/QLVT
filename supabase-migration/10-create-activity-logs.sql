-- =====================================================
-- CREATE ACTIVITY LOGS TABLE
-- Ghi lại tất cả hoạt động trong hệ thống
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  entity_type TEXT NOT NULL, -- 'documents', 'devices', 'inventory_items', etc.
  entity_id TEXT,
  entity_name TEXT,
  description TEXT,
  old_values JSONB, -- Giá trị cũ (cho UPDATE)
  new_values JSONB, -- Giá trị mới
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- =====================================================
-- CREATE FUNCTION TO LOG ACTIVITIES
-- =====================================================

CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_entity_name TEXT,
  p_description TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id, user_email, action, entity_type, entity_id, 
    entity_name, description, old_values, new_values
  ) VALUES (
    p_user_id, p_user_email, p_action, p_entity_type, p_entity_id,
    p_entity_name, p_description, p_old_values, p_new_values
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ENABLE RLS FOR ACTIVITY LOGS
-- =====================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Everyone (authenticated) can read activity logs
CREATE POLICY "Authenticated can read activity logs" ON activity_logs FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admin can delete activity logs
CREATE POLICY "Admin can delete activity logs" ON activity_logs FOR DELETE
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this query to verify:
-- SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
