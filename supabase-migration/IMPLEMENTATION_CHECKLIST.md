# 🎯 SUPABASE MIGRATION IMPLEMENTATION CHECKLIST

## ✅ PHASE 1: SETUP & DATABASE (TODAY)

### Step 1: Supabase Configuration
- [ ] Đăng nhập Supabase Dashboard
- [ ] Lấy Project URL from Settings → API
- [ ] Lấy anon key (public)
- [ ] Lấy service_role key (secret - giữ kín!)
- [ ] Tạo file `.env.local`:
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
  ```

### Step 2: Database Schema Setup
- [ ] Vào Supabase Console → SQL Editor
- [ ] Copy toàn bộ nội dung từ `supabase-migration/01-schema.sql`
- [ ] Paste vào SQL Editor
- [ ] Click "Run"
- [ ] Kiểm tra xem có error không

### Step 3: Storage Buckets
- [ ] Vào Supabase → Storage tab
- [ ] Click "New Bucket"
- [ ] Tạo bucket 1: `handover-records` (Private)
- [ ] Tạo bucket 2: `document-files` (Private)
- [ ] Verify cả 2 buckets đã tạo xong

### Step 4: Google OAuth Setup (Authentication)
- [ ] Supabase → Authentication → Providers
- [ ] Click "Google" → Enable
- [ ] (Optional) Tạo OAuth credentials từ Google Cloud Console
- [ ] Verify authentication settings

**After Step 4:** 👉 Cung cấp cho tôi:
```
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
```

---

## 🚚 PHASE 2: DATA MIGRATION (WHEN READY)

### Step 5: Export Firebase Data
- [ ] Vào Firebase Console → Firestore
- [ ] Click ⋮ → Export collections
- [ ] Chọn tất cả collections
- [ ] Lưu thành file JSON
- [ ] Hoặc backup toàn bộ: `firebase firestore:export ./firebase-backup`

### Step 6: Transform & Import Data
- [ ] Chạy script migration: `node supabase-migration/migrate.js`
  ```bash
  node supabase-migration/migrate.js
  ```
- [ ] Check console output xem có lỗi không
- [ ] Verify data trong Supabase SQL Editor:
  ```sql
  SELECT COUNT(*) FROM inventory_items;
  SELECT COUNT(*) FROM inventory_slips;
  -- etc.
  ```

---

## 💻 PHASE 3: CODE REFACTOR (NEXT WEEK)

### Step 7: Install Dependencies
- [ ] `npm install @supabase/supabase-js`
- [ ] Verify install success: `npm list @supabase/supabase-js`

### Step 8: Replace Firebase with Supabase
Files to modify (tôi sẽ provide code):
- [ ] `src/contexts/AuthContext.tsx` → Supabase Auth
- [ ] `src/firebase.ts` → `src/supabase-client.ts` (already created)
- [ ] Update all imports: `firebase` → `supabase-client`

### Step 9: Refactor Components
- [ ] `src/components/inventory/SlipModal.tsx` → New queries
- [ ] `src/components/inventory/RequisitionModal.tsx` → New queries
- [ ] `src/components/inventory/HandoverRecordUploadModal.tsx` → New storage
- [ ] `src/pages/InventoryDashboard.tsx` → Real-time listeners
- [ ] `src/pages/InventoryReceipts.tsx` → Real-time + CRUD
- [ ] `src/pages/InventoryIssues.tsx` → Real-time + CRUD
- [ ] `src/pages/InventoryRequisitions.tsx` → Real-time + CRUD
- [ ] All other pages using Firestore

### Step 10: Update Firebase Utils
- [ ] Replace `src/utils/firestoreErrorHandler.ts` with Supabase error handling
- [ ] Update error messages

### Step 11: Real-Time Listeners Refactor
Replace all `onSnapshot()` with Supabase subscriptions:
- [ ] Change format from:
  ```typescript
  // OLD
  onSnapshot(collection(db, 'inventory_items'), (snap) => {
    setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  })
  
  // NEW
  supabase
    .from('inventory_items')
    .on('*', payload => {
      setItems(...);
    })
    .subscribe()
  ```

### Step 12: Queries Refactor
Replace all Firebase queries with PostgreSQL:
- [ ] `addDoc()` → `supabase.from().insert()`
- [ ] `updateDoc()` → `supabase.from().update().eq()`
- [ ] `deleteDoc()` → `supabase.from().delete().eq()`
- [ ] `query(where())` → `supabase.from().select().eq().match()`

### Step 13: File Upload Refactor
- [ ] Update `HandoverRecordUploadModal.tsx`
  ```typescript
  // OLD: uploadBytesResumable(storageRef, file)
  // NEW: supabase.storage.from('handover-records').upload(path, file)
  ```

### Step 14: Auth Flow Refactor
- [ ] Update `AuthContext.tsx`:
  ```typescript
  // OLD: signInWithPopup(auth, GoogleAuthProvider)
  // NEW: supabase.auth.signInWithOAuth({ provider: 'google' })
  ```
- [ ] Update user profile creation logic
- [ ] Update role checking: `SELECT role FROM users WHERE id = auth.uid()`

---

## 🧪 PHASE 4: TESTING

### Step 15: Manual Testing
- [ ] Test Google login
- [ ] Test create new thiếu item (phiếu)
- [ ] Test update item
- [ ] Test delete with proper permissions
- [ ] Test file upload
- [ ] Test real-time updates (open 2 tabs)
- [ ] Test requisition approval flow
- [ ] Test inventory tracking (quantity updates)

### Step 16: Role Testing
- [ ] Test as Admin (all features)
- [ ] Test as Manager (no delete)
- [ ] Test as Viewer (read-only)

### Step 17: Edge Cases
- [ ] Export item with quantity 0
- [ ] Delete requisition with linked slips
- [ ] Delete slip and verify quantity reverted
- [ ] Large file upload (>5MB)
- [ ] Network failures during upload

---

## 📊 PROGRESS TRACKING

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | Supabase config | ⏳ Pending | Waiting for your credentials |
| 1 | Database schema | ⏳ Pending | Ready to run |
| 1 | Storage buckets | ⏳ Pending | 3 buckets to create |
| 1 | OAuth setup | ⏳ Pending | Optional but recommended |
| 2 | Data export | ⏳ Pending | Firebase → JSON |
| 2 | Data import | ⏳ Pending | JSON → Supabase |
| 3 | Dependencies | ⏳ Pending | `npm install` |
| 3 | Auth refactor | ⏳ Pending | 1-2 days |
| 3 | Components refactor | ⏳ Pending | 2-3 days |
| 3 | Queries refactor | ⏳ Pending | 1-2 days |
| 4 | Testing | ⏳ Pending | 2-3 days |

---

## 🚦 NEXT ACTION

**Bây giờ bạn cần:**

1. ✅ Thực hiện **PHASE 1** (Steps 1-4)
2. ✅ Gửi cho tôi:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
3. ✅ Đảm bảo SQL schema successfully ran
4. ✅ Đảm bảo storage buckets created

**Khi hoàn thành**, tôi sẽ:
1. Tạo data migration script (PHASE 2)
2. Refactor auth context (PHASE 3, Step 8)
3. Refactor từng component (PHASE 3, Steps 9-14)
4. Cung cấp test cases (PHASE 4)

---

## 📞 TROUBLESHOOTING

### SQL Schema Error?
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables WHERE table_schema='public';

-- Drop problematic table if needed
DROP TABLE IF EXISTS table_name CASCADE;

-- Re-run schema
-- (copy-paste from 01-schema.sql again)
```

### Connection Error?
- Check `VITE_SUPABASE_URL` format: `https://xxxxx.supabase.co`
- Check `VITE_SUPABASE_ANON_KEY` is not empty
- Verify `.env.local` file exists in project root

### Storage Bucket Issues?
- Create buckets manually in Supabase UI if script fails
- Bucket names: `handover-records`, `document-files`
- Set to Private

### Google OAuth Error?
- Optional for now, we can debug later
- Focus on other steps first

---

**Ready? Let's GO! 🚀**

Thực hiện Phase 1, sau đó gửi cho tôi credentials!
