# Requisition Save Error - Testing Guide

## ✅ Fixes Applied

### 1. Auto-generated Requisition Code
- **Problem**: Form required manual code entry; duplicates caused unique constraint errors
- **Solution**: Auto-generates code as `TT-001`, `TT-002`, etc. based on latest requisition number
- **test**: 
  1. Open "Tạo Tờ Trình mới" (Create New Requisition)
  2. Code field should auto-populate with next available code (e.g., `TT-001`)
  3. Can manually edit code for new requisitions
  4. When editing existing, code becomes read-only (gray background)

### 2. Detailed Error Messages
- **Problem**: Generic "Unknown error" made debugging impossible
- **Solution**: Enhanced error display to show full Supabase error details
- **Test**:
  1. Open browser DevTools (F12)
  2. Try to save requisition with error condition
  3. Check console and alert message for specific error details

### 3. Database-managed Fields Fix
- **Problem**: UPDATE tried to send `created_at`, `updated_at`, `id` to PostgreSQL (auto-managed fields)
- **Solution**: `requisitionToDatabase()` now removes these fields before INSERT/UPDATE
- **Test**:
  1. Create a new requisition successfully
  2. Edit existing requisition
  3. Save changes → should succeed without "field not allowed" errors

### 4. Item Fields Normalization
- **Problem**: Items missing required fields when loading for edit
- **Solution**: Normalize items when loading to ensure all fields have defaults
- **Test**:
  1. Create requisition with multiple items
  2. Edit it → all items should load correctly
  3. Verify all columns show data without errors

---

## 🧪 Step-by-Step Testing

### Test Case 1: Create New Requisition
**Steps:**
1. Navigate to "Tờ trình" (Requisitions) page
2. Click "Tạo Tờ Trình mới" button
3. Verify:
   - ✅ Code auto-generates (e.g., TT-001)
   - ✅ Code is editable
   - ✅ Date defaults to today
   - ✅ Type defaults to "Thường"
   - ✅ Status defaults to "Mới tạo"
4. Fill in:
   - Purpose: "Testing requisition creation"
   - Add at least 1 item:
     - Select item from dropdown
     - Enter quantity ≥ 1
     - Select subsystem, method, purpose
5. Click "Lưu" (Save)
6. Verify: Dialog closes and requisition appears in list

**Expected Result:** ✅ Successfully creates requisition with auto-generated code

---

### Test Case 2: Edit Existing Requisition
**Steps:**
1. In Requisitions list, click Edit button on any requisition
2. Verify:
   - ✅ Code field is read-only (grayed out)
   - ✅ All items loaded with complete data
   - ✅ No missing fields in item rows
3. Modify a field (e.g., change purpose)
4. Click "Lưu" (Save)
5. Check console (F12) for detailed logs

**Expected Result:** ✅ Successfully updates without database errors

---

### Test Case 3: Error Handling
**Steps:**
1. Open new requisition
2. Manually change code to exactly match existing code
3. Try to save
4. Check error message

**Expected Result:** ✅ Shows detailed error like "duplicate key value violates unique constraint"

---

### Test Case 4: Validation
**Steps:**
1. Try to save requisition without:
   - Any items → Should see alert "Vui lòng thêm ít nhất một vật tư"
   - Items without selected inventory → Alert "Vui lòng chọn vật tư"
   - Purpose with empty value → Form validation prevents submit

**Expected Result:** ✅ Proper validation prevents invalid submits

---

## 🔧 Technical Details

### Modified Files
```
src/components/inventory/RequisitionModal.tsx
  ├─ Added generateNextCode() function
  ├─ Enhanced useEffect initialization
  ├─ Improved error handling in handleSubmit
  └─ Made code field read-only when editing

src/utils/dataTransform.ts
  └─ Fixed requisitionToDatabase() to:
     ├─ Remove database-managed fields (id, created_at, updated_at)
     ├─ Properly handle items array transformation
     └─ Normalize empty date values
```

### Schema Verification
✅ Verified `inventory_requisitions` table constraints:
```sql
- code TEXT UNIQUE NOT NULL
- created_by TEXT NOT NULL  
- date DATE NOT NULL
- type TEXT NOT NULL CHECK (...)
- status TEXT DEFAULT 'Mới tạo' CHECK (...)
- items JSONB NOT NULL DEFAULT '[]'
- id, created_at, updated_at (auto-managed by PostgreSQL)
```

---

## 📋 Pre-deployment Checklist

- [ ] Test Case 1: Create new requisition ✅
- [ ] Test Case 2: Edit existing requisition ✅
- [ ] Test Case 3: Verify error messages show details
- [ ] Test Case 4: Validation works correctly
- [ ] Browser console shows clear logs
- [ ] Code field is read-only when editing
- [ ] Code field is editable when creating

---

## 🚀 If Issues Persist

1. **Check Console (F12)**
   - Look for detailed error message
   - Note the exact PostgreSQL error

2. **Check Database**
   - Verify `inventory_requisitions` table exists
   - Check RLS policies allow INSERT/UPDATE operations
   - Verify sample requisition codes exist (TT-001, TT-002, etc.)

3. **Check Authentication**
   - Ensure you're logged in with admin/manager role
   - RLS policies require authenticated user

4. **Debug Data Flow**
   - Open RequisitionModal → check browser DevTools
   - In Console tab: Navigate to save form data
   - Compare with schema requirements

---

## 📱 Related Issues Fixed
- ✅ Device saving errors (camelCase → snake_case conversion)
- ✅ Document import date format (DD/MM/YYYY → YYYY-MM-DD)
- ✅ Table alignment issues
- ✅ Activity logging infrastructure
- ✅ UUID field type mismatches

---

**Last Updated:** 2025-01-09
**Status:** Ready for testing
