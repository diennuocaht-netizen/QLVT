# 📋 SUPABASE MIGRATION GUIDE

## Phase 1: Setup Supabase & Database Schema

### Step 1.1: Lấy Supabase Credentials

1. **Đăng nhập Supabase** → Dashboard
2. **Chọn Project** → Settings → API
3. **Copy các thông tin sau:**
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role secret` → `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Step 1.2: Tạo Database Schema

1. **Vào Supabase Console** → SQL Editor
2. **Mở file:** `supabase-migration/01-schema.sql`
3. **Copy toàn bộ SQL** vào SQL Editor
4. **Click "Run"** để chạy
5. **Chờ thành công** ✅

### Step 1.3: Tạo Storage Buckets

1. **Vào Supabase** → Storage
2. **Click "New Bucket"** → Tạo 2 bucket:
   - Tên: `handover-records` (Private)
   - Tên: `document-files` (Private)

### Step 1.4: Setup Google OAuth (Authentication)

1. **Supabase Console** → Authentication → Providers
2. **Enable "Google"**
3. **Add OAuth credentials:**
   - Client ID: (từ Google Cloud Console)
   - Client Secret: (từ Google Cloud Console)

---

## Phase 2: Data Migration (Firebase → Supabase)

### Step 2.1: Export Data từ Firebase

**Sử dụng Firebase Admin SDK hoặc công cụ Firestore export:**

```bash
# Nếu dùng Firebase CLI:
firebase firestore:export ./firebase-backup

# Hoặc download từ Firebase Console → Firestore → ⋮ → Export collections
```

### Step 2.2: Transform & Import vào Supabase

**Chúng ta sẽ tạo script Python/Node để:**
1. Read Firebase JSON
2. Transform dữ liệu (convert IDs, arrays, etc.)
3. Insert vào Supabase PostgreSQL

**Chờ tôi tạo migration script cho bạn...**

---

## Phase 3: Refactor React Code

### Step 3.1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 3.2: Tạo Supabase Client

```typescript
// src/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 3.3: Update .env.local

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Nước đi tiếp theo:

✅ **Đã tạo:** 
- Schema SQL complete (01-schema.sql)
- Config template (.env.supabase.example)
- Guide này

🚀 **Cần bạn làm:**
1. Chạy SQL schema trong Supabase
2. Tạo 2 storage buckets
3. Cơu hình Google OAuth
4. Cung cấp cho tôi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

🔄 **Sau đó tôi sẽ tạo:**
1. Migration script (Firebase data → Supabase)
2. Refactor AuthContext.tsx (Firebase Auth → Supabase Auth)
3. Refactor tất cả CRUD operations
4. Refactor real-time listeners
5. Refactor file uploads

---

## Timeline dự kiến:

- **Phase 1 (Setup):** 1-2 ngày
- **Phase 2 (Data Migration):** 1 ngày
- **Phase 3 (Code Refactor):** 3-4 ngày
- **Phase 4 (Testing):** 2-3 ngày

**Total: ~1-2 tuần** để hoàn thành migration

---

## Troubleshooting:

❓ **SQL Error khi run schema?**
- Check xem table đã tồn tại hay chưa
- Xóa bảng cũ nếu cần: `DROP TABLE table_name CASCADE;`

❓ **RLS Policy issues?**
- Đảm bảo `auth.uid()` và role được set đúng
- Test policies từ SQL Editor

❓ **Storage bucket permissions?**
- Mặc định Private là đúng
- Policies được set trong SQL

---

**Bạn đã sẵn sàng bắt đầu Phase 1 chưa?** 
Hãy cho tôi biết khi bạn đã chạy xong schema SQL + create storage buckets!
