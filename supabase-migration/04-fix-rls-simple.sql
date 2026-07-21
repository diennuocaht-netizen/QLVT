-- =====================================================
-- FIX RLS POLICIES FOR USERS TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, disable RLS temporarily to allow writes
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can update all profiles" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Admin can insert users via email" ON users;
DROP POLICY IF EXISTS "Admin role can insert users" ON users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- New simpler policies:

-- Everyone can read all users
CREATE POLICY "Users can read all profiles" ON users FOR SELECT
USING (TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users FOR UPDATE
USING (auth.uid() = id);

-- Authenticated users can insert (admin will manage from frontend + CLI)
CREATE POLICY "Authenticated users can insert users" ON users FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Everyone can delete their own profile (for cleanup)
CREATE POLICY "Users can delete own profile" ON users FOR DELETE
USING (auth.uid() = id);
