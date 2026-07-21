-- =====================================================
-- FIX DEVICES TABLE COLUMN NAMES
-- Rename camelCase columns to snake_case for consistency
-- =====================================================

-- First, check if the old columns exist
-- If the table was created with unquoted camelCase, PostgreSQL automatically lowercased them
-- So we need to rename: subcomponents -> sub_components, historylogs -> history_logs, changelogs -> change_logs

-- Add new columns with correct naming
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS sub_components JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS history_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS change_logs JSONB DEFAULT '[]'::jsonb;

-- Copy data from old columns if they exist (with lowercase due to PostgreSQL's auto-lowercasing)
-- Note: PostgreSQL converted 'subComponents' to 'subcomponents' automatically
UPDATE devices
SET sub_components = COALESCE(subcomponents, '[]'::jsonb)
WHERE subcomponents IS NOT NULL;

UPDATE devices
SET history_logs = COALESCE(historylogs, '[]'::jsonb)
WHERE historylogs IS NOT NULL;

UPDATE devices
SET change_logs = COALESCE(changelogs, '[]'::jsonb)
WHERE changelogs IS NOT NULL;

-- Drop old columns if they exist
ALTER TABLE devices
DROP COLUMN IF EXISTS subcomponents;

ALTER TABLE devices
DROP COLUMN IF EXISTS historylogs;

ALTER TABLE devices
DROP COLUMN IF EXISTS changelogs;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this query to verify the table structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'devices';
