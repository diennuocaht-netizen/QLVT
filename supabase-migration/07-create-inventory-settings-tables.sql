-- =====================================================
-- CREATE INVENTORY SETTINGS TABLES
-- Tables for subsystems, requisition types, and cost codes
-- =====================================================

-- Step 1: Create inventory_subsystems table
CREATE TABLE IF NOT EXISTS inventory_subsystems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create inventory_requisition_types table
CREATE TABLE IF NOT EXISTS inventory_requisition_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create inventory_cost_codes table
CREATE TABLE IF NOT EXISTS inventory_cost_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  subsystem TEXT,
  classification TEXT,
  purpose TEXT,
  method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS on all tables
ALTER TABLE inventory_subsystems ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requisition_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cost_codes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for inventory_subsystems
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated can read subsystems" ON inventory_subsystems;
DROP POLICY IF EXISTS "Authenticated can insert subsystems" ON inventory_subsystems;
DROP POLICY IF EXISTS "Authenticated can update subsystems" ON inventory_subsystems;
DROP POLICY IF EXISTS "Authenticated can delete subsystems" ON inventory_subsystems;

-- Create new policies
CREATE POLICY "Authenticated can read subsystems" ON inventory_subsystems FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert subsystems" ON inventory_subsystems FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update subsystems" ON inventory_subsystems FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete subsystems" ON inventory_subsystems FOR DELETE
USING (auth.role() = 'authenticated');

-- Step 6: Create RLS Policies for inventory_requisition_types
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated can read requisition types" ON inventory_requisition_types;
DROP POLICY IF EXISTS "Authenticated can insert requisition types" ON inventory_requisition_types;
DROP POLICY IF EXISTS "Authenticated can update requisition types" ON inventory_requisition_types;
DROP POLICY IF EXISTS "Authenticated can delete requisition types" ON inventory_requisition_types;

-- Create new policies
CREATE POLICY "Authenticated can read requisition types" ON inventory_requisition_types FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert requisition types" ON inventory_requisition_types FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update requisition types" ON inventory_requisition_types FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete requisition types" ON inventory_requisition_types FOR DELETE
USING (auth.role() = 'authenticated');

-- Step 7: Create RLS Policies for inventory_cost_codes
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated can read cost codes" ON inventory_cost_codes;
DROP POLICY IF EXISTS "Authenticated can insert cost codes" ON inventory_cost_codes;
DROP POLICY IF EXISTS "Authenticated can update cost codes" ON inventory_cost_codes;
DROP POLICY IF EXISTS "Authenticated can delete cost codes" ON inventory_cost_codes;

-- Create new policies
CREATE POLICY "Authenticated can read cost codes" ON inventory_cost_codes FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert cost codes" ON inventory_cost_codes FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update cost codes" ON inventory_cost_codes FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete cost codes" ON inventory_cost_codes FOR DELETE
USING (auth.role() = 'authenticated');

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cost_codes_code ON inventory_cost_codes(code);
CREATE INDEX IF NOT EXISTS idx_cost_codes_subsystem ON inventory_cost_codes(subsystem);
CREATE INDEX IF NOT EXISTS idx_subsystems_name ON inventory_subsystems(name);
CREATE INDEX IF NOT EXISTS idx_requisition_types_name ON inventory_requisition_types(name);

-- Step 9: Verify tables were created successfully
SELECT 'inventory_subsystems' as table_name FROM information_schema.tables WHERE table_name='inventory_subsystems'
UNION ALL
SELECT 'inventory_requisition_types' FROM information_schema.tables WHERE table_name='inventory_requisition_types'
UNION ALL
SELECT 'inventory_cost_codes' FROM information_schema.tables WHERE table_name='inventory_cost_codes';
