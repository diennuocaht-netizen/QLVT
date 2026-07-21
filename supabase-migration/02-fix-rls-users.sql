-- =====================================================
-- ADD MISSING INSERT POLICY FOR USERS TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add INSERT policy for admin to create users
CREATE POLICY "Admin can insert users" ON users FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Show all policies on users table (for verification)
-- SELECT * FROM pg_policies WHERE tablename = 'users';
