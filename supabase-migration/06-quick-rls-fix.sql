-- =====================================================
-- QUICK FIX: Supabase RLS Configuration
-- Run this in Supabase SQL Editor if data saving fails
-- =====================================================

-- Step 1: ENABLE RLS on all necessary tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to start fresh
-- Drop policies from USERS table
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Authenticated can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Anyone can read user profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can create their profile" ON users;

-- Drop policies from INVENTORY_ITEMS table
DROP POLICY IF EXISTS "Authenticated can read items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated can insert items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated can update items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated can delete items" ON inventory_items;
DROP POLICY IF EXISTS "Manager+ can insert items" ON inventory_items;
DROP POLICY IF EXISTS "Manager+ can update items" ON inventory_items;
DROP POLICY IF EXISTS "Manager+ can delete items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can read inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated users can delete inventory items" ON inventory_items;

-- Drop policies from INVENTORY_SLIPS table
DROP POLICY IF EXISTS "Authenticated can read slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated can insert slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated can update slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated can delete slips" ON inventory_slips;
DROP POLICY IF EXISTS "Manager+ can insert slips" ON inventory_slips;
DROP POLICY IF EXISTS "Manager+ can update slips" ON inventory_slips;
DROP POLICY IF EXISTS "Admin can delete slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated users can read inventory slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated users can insert inventory slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated users can update inventory slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated users can delete inventory slips" ON inventory_slips;

-- Drop policies from INVENTORY_REQUISITIONS table
DROP POLICY IF EXISTS "Authenticated can read requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated can insert requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated can update requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated can delete requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Manager+ can insert requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Manager+ can update requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Admin can delete requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated users can read inventory requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated users can insert inventory requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated users can update inventory requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated users can delete inventory requisitions" ON inventory_requisitions;

-- Drop policies from DOCUMENTS table
DROP POLICY IF EXISTS "Authenticated can read documents" ON documents;
DROP POLICY IF EXISTS "Manager+ can insert documents" ON documents;
DROP POLICY IF EXISTS "Manager+ can update documents" ON documents;
DROP POLICY IF EXISTS "Admin can delete documents" ON documents;
DROP POLICY IF EXISTS "Authenticated can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated can delete documents" ON documents;

-- Drop policies from DEVICES table
DROP POLICY IF EXISTS "Authenticated can read devices" ON devices;
DROP POLICY IF EXISTS "Manager+ can insert devices" ON devices;
DROP POLICY IF EXISTS "Manager+ can update devices" ON devices;
DROP POLICY IF EXISTS "Admin can delete devices" ON devices;
DROP POLICY IF EXISTS "Authenticated can insert devices" ON devices;
DROP POLICY IF EXISTS "Authenticated can update devices" ON devices;
DROP POLICY IF EXISTS "Authenticated can delete devices" ON devices;

-- Step 3: Create policies for USERS table
-- Anyone can read all users (for displaying user lists)
CREATE POLICY "Anyone can read user profiles"
  ON users FOR SELECT
  USING (true);

-- Authenticated users can insert (for signup)
CREATE POLICY "Authenticated users can create their profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (auth.uid() = id);

-- Step 4: Create policies for INVENTORY_ITEMS table
-- Authenticated users can read all items
CREATE POLICY "Authenticated users can read inventory items"
  ON inventory_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert items
CREATE POLICY "Authenticated users can insert inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update items
CREATE POLICY "Authenticated users can update inventory items"
  ON inventory_items FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can delete items
CREATE POLICY "Authenticated users can delete inventory items"
  ON inventory_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 5: Create policies for INVENTORY_SLIPS table
CREATE POLICY "Authenticated users can read inventory slips"
  ON inventory_slips FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory slips"
  ON inventory_slips FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inventory slips"
  ON inventory_slips FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete inventory slips"
  ON inventory_slips FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 6: Create policies for INVENTORY_REQUISITIONS table
CREATE POLICY "Authenticated users can read inventory requisitions"
  ON inventory_requisitions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory requisitions"
  ON inventory_requisitions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inventory requisitions"
  ON inventory_requisitions FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete inventory requisitions"
  ON inventory_requisitions FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 7: Create policies for DOCUMENTS table
CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 8: Create policies for DEVICES table
CREATE POLICY "Authenticated users can read devices"
  ON devices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert devices"
  ON devices FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update devices"
  ON devices FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete devices"
  ON devices FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 9: VERIFY the setup
SELECT relname as tablename, relrowsecurity as rowsecurity 
FROM pg_class 
WHERE relname IN ('users', 'inventory_items', 'inventory_slips', 'inventory_requisitions', 'documents', 'devices')
AND relkind='r';

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'inventory_items', 'inventory_slips', 'inventory_requisitions', 'documents', 'devices')
ORDER BY tablename, policyname;

-- =====================================================
-- IF tests fail, try this TEMPORARY fix (development only)
-- DISABLE RLS completely and test
-- =====================================================
-- TEMPORARY: Disable RLS for testing
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_slips DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_requisitions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;

-- Then re-enable after testing
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_slips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
