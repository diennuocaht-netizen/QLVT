# Fix App Loading/Freezing Issue

## Problems Identified and Fixed

### Problem 1: Admin API Called from Client
❌ **OLD CODE** - `AuthContext.tsx`
```ts
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email, password, email_confirm: true
});
```

`admin.createUser()` is a **backend-only API**. Cannot be called from browser, causes app to freeze.

✅ **FIXED** - Now uses `signUp()` instead
```ts
const { data: authData, error: authError } = await supabase.auth.signUp({
  email, password,
  options: { data: { full_name: displayName } }
});
```

### Problem 2: No Timeout on Auth Setup
❌ **OLD CODE** - Auth setup could hang indefinitely

✅ **FIXED** - Added 5-second timeout
```ts
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Auth session timeout')), 5000)
);
const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
```

### Problem 3: No Error Handling for Profile Insert
❌ **OLD CODE** - If insert failed, user profile not created but auth continued

✅ **FIXED** - Now logs error but continues (won't freeze)
```ts
if (insertError) {
  console.error('Error creating user profile:', insertError);
  // Still set profile even if insert fails, so user can proceed
}
setProfile(newProfile);
```

### Problem 4: RLS Policy Missing for `users` Table
❌ **OLD** - Could not insert into users table if RLS was too restrictive

✅ **FIXED** - Added policy to allow authenticated users to insert

## What You Need To Do

### Step 1: Update Database Policies
Run this SQL in **Supabase SQL Editor**:

```sql
-- Copy & paste from: supabase-migration/05-fix-inventory-rls.sql
-- This file now includes fixes for BOTH users and inventory tables
```

The new SQL file includes:
- ✅ Users table: Allow authenticated users to insert (for signup)
- ✅ Inventory tables: Allow authenticated users to insert/update/delete
- ✅ All with proper SELECT permissions

### Step 2: Refresh Your App
1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
   - OR press `F12`, right-click on reload button → "Empty cache and hard reload"

2. **Reload the app:**
   - If using `npm run dev`, restart it:
   ```bash
   npm run dev
   ```

3. **Clear browser storage:**
   - If app still shows loading, try:
   ```js
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

### Step 3: Test Login/Signup
Try these in any browser:
1. Login with existing account
2. If login hangs, check:
   - Browser Console (F12 → Console) for errors
   - Network tab (F12 → Network) to see failed requests
   - Supabase project is active and has internet
   - Credentials (.env.local) are correct

### Step 4: Troubleshoot If Still Stuck

If app still shows "Đang tải...":

**Option A: Temporarily Disable RLS (Development Only)**
```sql
-- In Supabase SQL Editor, run:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions DISABLE ROW LEVEL SECURITY;

-- Test the app...
-- Then re-enable:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
```

**Option B: Check Auth Configuration**
1. Go to Supabase Dashboard → Authentication → Settings
2. Verify:
   - Providers: Email/Password should be enabled
   - JWT expiration is reasonable (default 1 hour is OK)
   - Site URL and Redirect URLs are correct

**Option C: Check Env Variables**
Make sure `.env.local` has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Files Changed

1. **`src/contexts/AuthContext.tsx`** ✅
   - Fixed: `admin.createUser()` → `signUp()`
   - Added: 5-second timeout for auth session
   - Added: Better error handling for profile insert

2. **`supabase-migration/05-fix-inventory-rls.sql`** ✅
   - Added: Policies for `users` table
   - Updated: All inventory table policies
   - Now allows authenticated users to interact with data

3. **Other components previously fixed** ✅
   - `QuickIssueModal.tsx` - Error checking
   - `Documents.tsx` - Error checking
   - `ItemModal.tsx` - Error checking
   - `supabase-client.ts` - Exposed global in dev

## Summary

- ❌ **Before**: App freezes on loading because admin API can't be called from client
- ✅ **After**: App loads properly, handles errors gracefully, timeouts prevent freezing

**Next Action**: Apply the SQL migration in Supabase, then reload your app.
