-- =====================================================
-- ADD LOCATION ID TO INVENTORY ITEMS
-- =====================================================

-- Step 1: Add location_id column to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES inventory_locations(id) ON DELETE SET NULL;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_location_id ON inventory_items(location_id);
