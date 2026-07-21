-- =====================================================
-- FIX: inventory_items UPDATE RLS Policy
-- Add WITH CHECK clause to allow updates to persist
-- =====================================================

-- Drop old policy (it's missing WITH CHECK)
DROP POLICY IF EXISTS "Manager+ can update items" ON inventory_items;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Manager+ can update items" ON inventory_items FOR UPDATE
USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'))
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

-- Verify policy is in place
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'inventory_items' AND policyname LIKE 'Manager%update%';
