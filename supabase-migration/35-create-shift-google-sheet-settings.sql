-- =====================================================
-- 35: GOOGLE SHEET SYNC SETTINGS FOR SHIFT SCHEDULING
-- Lưu cấu hình đường link Google Sheet và trạng thái tự động đồng bộ phân ca
-- =====================================================

CREATE TABLE IF NOT EXISTS shift_google_sheet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_url TEXT NOT NULL,
  sheet_id TEXT NOT NULL,
  sheet_name_pattern TEXT DEFAULT 'auto',
  auto_sync BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT DEFAULT 'pending', -- 'success', 'error', 'pending'
  last_sync_message TEXT,
  last_sync_count INTEGER DEFAULT 0,
  webhook_secret TEXT DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shift_google_sheet_settings ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
DROP POLICY IF EXISTS "Allow authenticated read shift_google_sheet_settings" ON shift_google_sheet_settings;
CREATE POLICY "Allow authenticated read shift_google_sheet_settings"
ON shift_google_sheet_settings FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert/update shift_google_sheet_settings" ON shift_google_sheet_settings;
CREATE POLICY "Allow authenticated insert/update shift_google_sheet_settings"
ON shift_google_sheet_settings FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- Allow public read of webhook_secret for webhook verification
DROP POLICY IF EXISTS "Allow anon read for webhook" ON shift_google_sheet_settings;
CREATE POLICY "Allow anon read for webhook"
ON shift_google_sheet_settings FOR SELECT
TO anon USING (true);
