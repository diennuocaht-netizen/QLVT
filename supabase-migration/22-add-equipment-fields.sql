-- Add new columns to measured_equipments
ALTER TABLE measured_equipments
ADD COLUMN IF NOT EXISTS subsystem TEXT,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS specifications TEXT;

-- Notify pgrst to reload schema
NOTIFY pgrst, 'reload schema';
