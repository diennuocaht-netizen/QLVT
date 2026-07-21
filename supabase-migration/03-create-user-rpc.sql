-- =====================================================
-- CREATE RPC FUNCTION TO INSERT USERS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop function if exists
DROP FUNCTION IF EXISTS public.create_user_profile(TEXT, TEXT, TEXT, TEXT);

-- Create function to insert user (callable from frontend)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_id UUID,
  p_email TEXT,
  p_display_name TEXT,
  p_role TEXT
)
RETURNS json AS $$
DECLARE
  v_current_role TEXT;
  v_current_id UUID;
BEGIN
  -- Get current user and their role
  v_current_id := auth.uid();
  
  -- Only admin can create users (check via email or role)
  SELECT role INTO v_current_role FROM public.users WHERE id = v_current_id;
  
  -- Allow if:
  -- 1. Current user is admin
  -- 2. OR current user email is the default admin
  IF v_current_role != 'admin' AND auth.email() != 'hoang.toan2409@gmail.com' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only admin users can create new users'
    );
  END IF;
  
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already exists'
    );
  END IF;
  
  -- Insert new user
  INSERT INTO public.users (id, email, display_name, role, created_at, updated_at)
  VALUES (p_id, p_email, p_display_name, p_role, NOW(), NOW());
  
  RETURN json_build_object(
    'success', true,
    'message', 'User created successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- Also simplify the direct INSERT policy
DROP POLICY IF EXISTS "Admin can insert users" ON users;

CREATE POLICY "Admin can insert users via email" ON users FOR INSERT
WITH CHECK (auth.email() = 'hoang.toan2409@gmail.com');

CREATE POLICY "Admin role can insert users" ON users FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'admin');
