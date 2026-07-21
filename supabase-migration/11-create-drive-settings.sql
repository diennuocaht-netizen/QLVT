-- =====================================================
-- GOOGLE DRIVE FOLDER SETTINGS TABLE
-- Stores folder IDs for different document types
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_drive_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL UNIQUE,
  folder_id TEXT NOT NULL,
  folder_name TEXT,
  description TEXT,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to document_type column
COMMENT ON COLUMN inventory_drive_settings.document_type IS 'Document type: Nhận vật tư, BB hoàn thành vật tư, Phiếu xuất vật tư, Tờ trình mua sắm';

-- Insert default folder settings (will be updated by users)
INSERT INTO inventory_drive_settings (document_type, folder_id, folder_name, description)
VALUES 
  ('Nhận vật tư', '1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0', '12.6 Giao nhận VT 2026', 'Folder lưu biên bản nhận vật tư'),
  ('BB hoàn thành vật tư', '', '', 'Folder lưu biên bản hoàn thành vật tư'),
  ('Phiếu xuất vật tư', '', '', 'Folder lưu biên bản phiếu xuất vật tư'),
  ('Tờ trình mua sắm', '', '', 'Folder lưu tờ trình mua sắm vật tư')
ON CONFLICT (document_type) DO NOTHING;

-- Enable RLS
ALTER TABLE inventory_drive_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all settings
DROP POLICY IF EXISTS "Allow authenticated users to view drive settings" ON inventory_drive_settings;
CREATE POLICY "Allow authenticated users to view drive settings"
ON inventory_drive_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Allow authenticated users to update settings
DROP POLICY IF EXISTS "Allow admins to update drive settings" ON inventory_drive_settings;
CREATE POLICY "Allow authenticated users to update drive settings"
ON inventory_drive_settings
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Allow authenticated users to insert settings
DROP POLICY IF EXISTS "Allow admins to insert drive settings" ON inventory_drive_settings;
CREATE POLICY "Allow authenticated users to insert drive settings"
ON inventory_drive_settings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
