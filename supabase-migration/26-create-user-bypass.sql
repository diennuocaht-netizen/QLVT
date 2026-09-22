-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to insert user completely bypassing Supabase Auth signUp
CREATE OR REPLACE FUNCTION public.admin_create_user_bypass(
  p_email TEXT,
  p_password TEXT,
  p_display_name TEXT,
  p_role TEXT
)
RETURNS json AS $body
DECLARE
  v_current_role TEXT;
  v_current_id UUID;
  v_new_user_id UUID;
BEGIN
  -- Get current user and their role
  v_current_id := auth.uid();
  
  -- Only admin can create users
  SELECT role INTO v_current_role FROM public.users WHERE id = v_current_id;
  
  IF v_current_role != 'admin' AND auth.email() != 'hoang.toan2409@gmail.com' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only admin users can create new users'
    );
  END IF;
  
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already exists'
    );
  END IF;

  v_new_user_id := gen_random_uuid();
  
  -- Insert into auth.users using pgcrypto for password hashing
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_new_user_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, display_name, role, created_at, updated_at)
  VALUES (v_new_user_id, p_email, COALESCE(p_display_name, split_part(p_email, '@', 1)), p_role, NOW(), NOW());
  
  RETURN json_build_object(
    'success', true,
    'message', 'User created successfully bypassing auth limits'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$body LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_user_bypass TO authenticated;
