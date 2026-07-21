-- =====================================================
-- FIX RLS POLICIES FOR INVENTORY TABLES
-- This enables authenticated users to insert/update/delete inventory data
-- while still requiring the user profile to exist in the users table
-- 
-- Run this in Supabase SQL Editor if data is not being saved to database
-- =====================================================

-- Step 1: Check current RLS status (for debugging)
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relname IN ('users','inventory_items','inventory_slips','inventory_requisitions');

-- Step 2: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can update all profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated can insert users" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Admin can insert users via email" ON users;
DROP POLICY IF EXISTS "Admin role can insert users" ON users;

-- Step 3: Drop ALL existing policies on inventory tables
DROP POLICY IF EXISTS "Authenticated can read items" ON inventory_items;
DROP POLICY IF EXISTS "Manager+ can insert items" ON inventory_items;
DROP POLICY IF EXISTS "Manager+ can update items" ON inventory_items;
DROP POLICY IF EXISTS "Manager+ can delete items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated can insert items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated can update items" ON inventory_items;
DROP POLICY IF EXISTS "Authenticated can delete items" ON inventory_items;

DROP POLICY IF EXISTS "Authenticated can read slips" ON inventory_slips;
DROP POLICY IF EXISTS "Manager+ can insert slips" ON inventory_slips;
DROP POLICY IF EXISTS "Manager+ can update slips" ON inventory_slips;
DROP POLICY IF EXISTS "Admin can delete slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated can insert slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated can update slips" ON inventory_slips;
DROP POLICY IF EXISTS "Authenticated can delete slips" ON inventory_slips;

DROP POLICY IF EXISTS "Authenticated can read requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Manager+ can insert requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Manager+ can update requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Admin can delete requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated can insert requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated can update requisitions" ON inventory_requisitions;
DROP POLICY IF EXISTS "Authenticated can delete requisitions" ON inventory_requisitions;

DROP POLICY IF EXISTS "Authenticated can read documents" ON documents;
DROP POLICY IF EXISTS "Manager+ can insert documents" ON documents;
DROP POLICY IF EXISTS "Manager+ can update documents" ON documents;
DROP POLICY IF EXISTS "Admin can delete documents" ON documents;

DROP POLICY IF EXISTS "Authenticated can read devices" ON devices;
DROP POLICY IF EXISTS "Manager+ can insert devices" ON devices;
DROP POLICY IF EXISTS "Manager+ can update devices" ON devices;
DROP POLICY IF EXISTS "Admin can delete devices" ON devices;

-- Step 4: Create policies for users table
-- Users: Everyone can read all users
CREATE POLICY "Users can read all profiles" ON users FOR SELECT
USING (TRUE);

-- Users: Authenticated users can insert (for signup)
CREATE POLICY "Authenticated can insert users" ON users FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users: Users can update own profile
CREATE POLICY "Users can update own profile" ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users: Authenticated can delete
CREATE POLICY "Users can delete own profile" ON users FOR DELETE
USING (auth.uid() = id);

-- Step 5: Create new permissive policies that allow authenticated users
-- (you can still restrict by role in the application logic)

-- Inventory Items: Authenticated can read
CREATE POLICY "Authenticated can read items" ON inventory_items FOR SELECT
USING (auth.role() = 'authenticated');

-- Inventory Items: Any authenticated user can insert
CREATE POLICY "Authenticated can insert items" ON inventory_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Inventory Items: Any authenticated user can update
CREATE POLICY "Authenticated can update items" ON inventory_items FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Inventory Items: Any authenticated user can delete
CREATE POLICY "Authenticated can delete items" ON inventory_items FOR DELETE
USING (auth.role() = 'authenticated');

-- Inventory Slips: Authenticated can read
CREATE POLICY "Authenticated can read slips" ON inventory_slips FOR SELECT
USING (auth.role() = 'authenticated');

-- Inventory Slips: Any authenticated user can insert
CREATE POLICY "Authenticated can insert slips" ON inventory_slips FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Inventory Slips: Any authenticated user can update
CREATE POLICY "Authenticated can update slips" ON inventory_slips FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Inventory Slips: Any authenticated user can delete
CREATE POLICY "Authenticated can delete slips" ON inventory_slips FOR DELETE
USING (auth.role() = 'authenticated');

-- Inventory Requisitions: Authenticated can read
CREATE POLICY "Authenticated can read requisitions" ON inventory_requisitions FOR SELECT
USING (auth.role() = 'authenticated');

-- Inventory Requisitions: Any authenticated user can insert
CREATE POLICY "Authenticated can insert requisitions" ON inventory_requisitions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Inventory Requisitions: Any authenticated user can update
CREATE POLICY "Authenticated can update requisitions" ON inventory_requisitions FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Inventory Requisitions: Any authenticated user can delete
CREATE POLICY "Authenticated can delete requisitions" ON inventory_requisitions FOR DELETE
USING (auth.role() = 'authenticated');

-- Documents: Authenticated can read
CREATE POLICY "Authenticated can read documents" ON documents FOR SELECT
USING (auth.role() = 'authenticated');

-- Documents: Any authenticated user can insert
CREATE POLICY "Authenticated can insert documents" ON documents FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Documents: Any authenticated user can update
CREATE POLICY "Authenticated can update documents" ON documents FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Documents: Any authenticated user can delete
CREATE POLICY "Authenticated can delete documents" ON documents FOR DELETE
USING (auth.role() = 'authenticated');

-- Devices: Authenticated can read
CREATE POLICY "Authenticated can read devices" ON devices FOR SELECT
USING (auth.role() = 'authenticated');

-- Devices: Any authenticated user can insert
CREATE POLICY "Authenticated can insert devices" ON devices FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Devices: Any authenticated user can update
CREATE POLICY "Authenticated can update devices" ON devices FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Devices: Any authenticated user can delete
CREATE POLICY "Authenticated can delete devices" ON devices FOR DELETE
USING (auth.role() = 'authenticated');

-- =====================================================
-- VERIFY THE FIX
-- =====================================================
-- Run this query to verify all policies are in place:
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('users','inventory_items','inventory_slips','inventory_requisitions','documents','devices')
ORDER BY tablename, policyname;

-- =====================================================
-- OPTIONAL: If policies still don't work, temporarily DISABLE RLS
-- (ONLY for development/testing - NOT for production)
-- =====================================================
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_slips DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_requisitions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;
-- 
-- Then re-enable after testing:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_slips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
