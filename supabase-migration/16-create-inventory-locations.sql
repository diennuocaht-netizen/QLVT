-- =====================================================
-- CREATE INVENTORY LOCATIONS TABLE
-- =====================================================

-- Step 1: Create inventory_locations table
CREATE TABLE IF NOT EXISTS inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
DROP POLICY IF EXISTS "Authenticated can read locations" ON inventory_locations;
DROP POLICY IF EXISTS "Authenticated can insert locations" ON inventory_locations;
DROP POLICY IF EXISTS "Authenticated can update locations" ON inventory_locations;
DROP POLICY IF EXISTS "Authenticated can delete locations" ON inventory_locations;

CREATE POLICY "Authenticated can read locations" ON inventory_locations FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert locations" ON inventory_locations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update locations" ON inventory_locations FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete locations" ON inventory_locations FOR DELETE
USING (auth.role() = 'authenticated');

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_code ON inventory_locations(code);

-- Step 5: Verify table was created successfully
SELECT 'inventory_locations' as table_name FROM information_schema.tables WHERE table_name='inventory_locations';
