-- =====================================================
-- ADD ARRAY FIELDS TO DEVICES TABLE
-- Add subComponents, historyLogs, changeLogs as JSONB
-- =====================================================

-- Add missing columns to devices table if they don't exist
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS subComponents JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS historyLogs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS changeLogs JSONB DEFAULT '[]'::jsonb;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'devices' 
AND column_name IN ('subComponents', 'historyLogs', 'changeLogs');
