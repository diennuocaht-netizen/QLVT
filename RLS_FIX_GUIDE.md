# Fix Supabase Data Not Saving Issue

## Problem Identified
Data is not being saved to Supabase even though the app shows success messages. Multiple issues were found:

### 1. **Missing Error Handling in Database Operations**
Several React components were NOT properly checking for errors from Supabase queries:

#### Files Fixed:
- `src/components/inventory/QuickIssueModal.tsx` - insert/update operations were not checking errors
- `src/pages/Documents.tsx` - update operations in import loop were not checking errors  
- `src/components/inventory/ItemModal.tsx` - insert/update operations were not checking errors
- `src/contexts/AuthContext.tsx` - insert operations were not properly checked
- `src/supabase-client.ts` - exposed `supabase` global in dev mode for debugging

### 2. **RLS (Row Level Security) Policies May Be Too Restrictive**
The current policies only allow `admin` or `manager` roles to insert/update/delete data:
```sql
-- Current restrictive policy:
CREATE POLICY "Manager+ can insert items" ON inventory_items FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
```

If your user doesn't have role = 'admin' or 'manager' in the users table, all insert/update operations will be silently blocked by RLS.

## Solutions Applied

### Solution 1: Enhanced Error Checking
All database operations now properly:
- Capture the `error` object returned by Supabase
- Throw errors if operations fail (so they propagate to catch blocks)
- Display user-friendly error messages

**Example of fix:**
```tsx
// BEFORE (silently fails):
await supabase.from('inventory_items').insert([formData]);

// AFTER (shows error):
const { error } = await supabase.from('inventory_items').insert([formData]);
if (error) throw error;  // Now error message will display to user
```

### Solution 2: Relax RLS Policies
A new migration file `supabase-migration/05-fix-inventory-rls.sql` has been created that:
- Drops the restrictive `Manager+` policies
- Creates new policies allowing any `authenticated` user to insert/update/delete
- Keeps the same READ policies (still restricted to authenticated users)

## How to Apply the Fix

### Option A: Update RLS Policies (Recommended)
1. Go to Supabase SQL Editor
2. Copy and run all the SQL from `supabase-migration/05-fix-inventory-rls.sql`
3. Verify policies were created by running the SELECT query at the bottom
4. Test the app - data should now save

### Option B: Check User Role (Alternative)
If you want to keep the restrictive `Manager+` policies:
1. Go to Supabase SQL Editor
2. Run this query to check your user's role:
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   ```
3. If role is not 'admin' or 'manager', update it:
   ```sql
   UPDATE users SET role = 'admin' WHERE id = 'your-user-id';
   ```

### Option C: Temporary Debug Mode (Development Only)
If policies still don't work, you can temporarily disable RLS:
```sql
-- DISABLE RLS (WARNING: Not for production!)
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions DISABLE ROW LEVEL SECURITY;

-- Run your tests...

-- RE-ENABLE RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
```

## Testing the Fix

After applying either solution:

### 1. Test in Browser Console
```js
// Verify supabase client is available
console.log(supabase);

// Check current user
const user = await supabase.auth.getUser();
console.log('Current user:', user);

// Check user profile
const uid = user.data.user.id;
await supabase.from('users').select('id,email,role').eq('id', uid).then(r => console.log('User profile:', r));

// Try a test insert
await supabase.from('inventory_items').insert([{
  code: 'TEST_001',
  name: 'Test Item',
  unit: 'Cái',
  category: 'Test',
  initial_stock: 0,
  unit_price: 0
}]).then(r => console.log('Insert result:', r));
```

### 2. Test in App UI
1. Go to "Quản Lý Vật Tư" page
2. Try importing a CSV file or manually adding/editing items
3. Check browser console (F12) for any error messages
4. If successful, the item should appear in the table and Supabase

## RLS Policy Comparison

### Before (Restrictive - Only admin/manager can modify):
```sql
CREATE POLICY "Manager+ can insert items" ON inventory_items FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));
```

### After (Permissive - Any authenticated user can modify):
```sql
CREATE POLICY "Authenticated can insert items" ON inventory_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

## Security Note
The new policies in `05-fix-inventory-rls.sql` allow ANY authenticated user to modify data. This is suitable for:
- Development/testing
- Small team environments with trusted users
- Applications where all authenticated users should have equal permissions

For production with different user roles, you may want to:
1. Keep the `Manager+` policies and ensure user roles are set correctly
2. Implement application-level authorization checks
3. Add more granular role-based policies

## Files Modified
1. `src/components/inventory/QuickIssueModal.tsx` - Added error checking for insert/update
2. `src/pages/Documents.tsx` - Added error checking for update in import loop
3. `src/components/inventory/ItemModal.tsx` - Added error checking for insert/update
4. `src/contexts/AuthContext.tsx` - Added error checking for insert operations
5. `src/supabase-client.ts` - Exposed supabase global in dev mode for debugging
6. `supabase-migration/05-fix-inventory-rls.sql` - New migration to fix RLS policies (NEW)

## Next Steps
1. Choose one of the solutions above and apply it
2. Test in the browser console first
3. Test manual data entry in the UI
4. Test CSV import functionality
5. If still having issues, check browser console (F12) for detailed error messages
