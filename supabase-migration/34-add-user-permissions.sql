-- Migration 34: Add granular permissions and owner flag to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Add comment explaining permissions structure
COMMENT ON COLUMN public.users.permissions IS 'Granular module-level permissions JSON object: { [moduleKey]: { view: boolean, create: boolean, edit: boolean, delete: boolean, ... } }';
COMMENT ON COLUMN public.users.is_owner IS 'Super admin flag: only hoang.toan2409@gmail.com has absolute control';

-- Set initial owner status for hoang.toan2409@gmail.com
UPDATE public.users 
SET is_owner = true, role = 'admin' 
WHERE LOWER(email) = 'hoang.toan2409@gmail.com';
