-- =====================================================
-- MIGRATE REQUISITION TYPES FROM HARDCODED TO DATABASE
-- Drop type constraint and populate default types
-- =====================================================

-- Drop the CHECK constraint on type column if it exists
-- This allows type values to be managed in inventory_requisition_types table
ALTER TABLE inventory_requisitions 
DROP CONSTRAINT IF EXISTS inventory_requisitions_type_check;

-- Insert default requisition types if they don't exist
INSERT INTO inventory_requisition_types (name)
VALUES 
  ('Thường'),
  ('Khẩn cấp'),
  ('Dự án')
ON CONFLICT (name) DO NOTHING;

-- Verify the default types were inserted
SELECT * FROM inventory_requisition_types;
