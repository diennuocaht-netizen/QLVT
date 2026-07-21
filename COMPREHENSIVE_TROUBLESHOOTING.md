# 🔧 HƯỚNG DẪN FIX LỖI LƯU DỮ LIỆU - TOÀN DIỆN

## 📋 KIỂM TRA NHANH (Quick Checklist)

Chạy lệnh này trong **DevTools Console** để chẩn đoán vấn đề:

```javascript
// 1. Chạy diagnostic toàn bộ
await supabaseDebug.runFullDiagnostics()

// 2. Hoặc check từng phần:
await supabaseDebug.checkUser()              // Kiểm tra user hiện tại
await supabaseDebug.checkAuthStatus()        // Kiểm tra auth status
await supabaseDebug.checkRLSPolicies()       // Kiểm tra RLS policies
await supabaseDebug.testDataTransform()      // Kiểm tra data transform
```

---

## 🔍 PHÂN TÍCH LỖI CHI TIẾT

### Lỗi 1: "Error: property violates row security policy"

**Nguyên nhân**: RLS policies không được cấu hình đúng

**Cách fix**:
1. Mở **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ code từ **`supabase-migration/06-quick-rls-fix.sql`**
3. Dán vào SQL Editor rồi click **RUN**
4. Xác nhận không có lỗi
5. Tải lại ứng dụng (Ctrl+F5) và thử lại

---

### Lỗi 2: "Error PGRST116: The result set too large to represent as JSON"

**Nguyên nhân**: User profile không tồn tại trong table `users`

**Cách fix**:

**Cách 1**: Tạo user profile tự động

```javascript
// Chạy trong console
await supabaseDebug.checkUser()   // Xem user hiện tại
```

Nếu `hasProfile: false`, chạy SQL này:

```sql
-- Vào Supabase SQL Editor chạy:
INSERT INTO users (id, email, display_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
  AND id NOT IN (SELECT id FROM users);
```

**Cách 2**: Đăng xuất → Đăng nhập lại

Điều này sẽ trigger `AuthContext` để tự động tạo user profile.

---

### Lỗi 3: "Error PGRST301: permission denied for schema public"

**Nguyên nhân**: RLS policies chưa allow authenticated users

**Cách fix**:

```sql
-- Vào Supabase SQL Editor chạy lệnh này để verify:
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Phải thấy các policy như:
-- - "Authenticated can insert items"
-- - "Authenticated can read own items"
-- - v.v.
```

Nếu không thấy policies, chạy **`06-quick-rls-fix.sql`** (xem bước trên).

---

### Lỗi 4: "Invalid syntax" hoặc "Unknown field"

**Nguyên nhân**: Data format không đúng (camelCase thay vì snake_case)

**Cách fix**:

Kiểm tra console log khi save:

```javascript
// Mở DevTools Console
// Khi thấy "📤 [ItemModal] Saving item data: ..."
// Xem có cái "transformed" không
// original: { initialStock: 10, ... }   ← camelCase
// transformed: { initial_stock: 10, ... } ← snake_case
```

Nếu không thấy `transformed`, có nghĩa là `itemToDatabase()` không hoạt động.

Kiểm tra import trong `ItemModal.tsx`:
```typescript
import { itemToDatabase, itemFromDatabase } from '../../utils/dataTransform'
```

---

## ⚙️ KIỂM TRA TOÀN BỘ HỆ THỐNG

### 1️⃣ Kiểm tra Authentication

```javascript
// Trong console:
await supabaseDebug.checkUser()

// Kết quả đúng phải có:
// {
//   authId: "uuid-...",
//   email: "your@email.com",
//   profile: { id: "...", email: "...", display_name: "...", role: "admin" },
//   hasProfile: true
// }
```

### 2️⃣ Kiểm tra RLS Policies

```javascript
// Trong console:
await supabaseDebug.checkRLSPolicies()

// Kết quả đúng phải hiện:
// ✅ INSERT permission granted
```

### 3️⃣ Kiểm tra Data Transform

```javascript
// Trong console:
await supabaseDebug.testDataTransform()

// Kết quả đúng phải hiện:
// ✅ Transform test passed
```

### 4️⃣ Chạy toàn bộ diagnostic

```javascript
// Trong console:
await supabaseDebug.runFullDiagnostics()

// Phải thấy tất cả ✅ hoặc biết chính xác lỗi ở đâu
```

---

## 🚨 NẾU TOÀN BỘ VẪN KHÔNG HOẠT ĐỘNG

### Cách 1: Disable RLS tạm thời để test

```sql
-- Vào Supabase SQL Editor chạy:
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
```

Sau đó thử save lại. Nếu được → vấn đề là RLS policies.

Để bật lại:
```sql
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
```

### Cách 2: Check Supabase Project Settings

1. Vào **Supabase Dashboard**
2. Chọn project → **Settings** → **API**
3. Verify 3 thứ này:
   - ✅ `anon key` được copy vào `.env.local` `VITE_SUPABASE_ANON_KEY`
   - ✅ `URL` được copy vào `.env.local` `VITE_SUPABASE_URL`
   - ✅ Đó là key của environment đúng (dev/prod)

### Cách 3: Check Browser Authentication State

```javascript
// Trong console:
const { data: { user } } = await Supabase.auth.getUser()
console.log('Auth user:', user)

// Phải có user object, nếu null → chưa login
```

---

## 📊 ERROR CODE REFERENCE

| Error Code | Ý nghĩa | Fix |
|-----------|---------|-----|
| `PGRST116` | Row not found / Profile not created | Tạo user profile hoặc đăng nhập lại |
| `PGRST301` | Permission denied (RLS blocked) | Chạy 06-quick-rls-fix.sql |
| `PGRST106` | Invalid relationship | Check foreign keys |
| Null error | Unknown/network error | Xem console log chi tiết |

---

## 📝 STEP-BY-STEP FIX PROCESS

### Lần 1: Fresh Setup

```
1. ✅ Tắt app (npm run dev)
2. ✅ Copy supabase-migration/06-quick-rls-fix.sql
3. ✅ Paste vào Supabase SQL Editor → RUN
4. ✅ Chạy: DELETE FROM users WHERE id != auth.uid() (backup first!)
5. ✅ Khởi động lại app: npm run dev
6. ✅ Đăng xuất → Đăng nhập lại
7. ✅ Thử save item mới
```

### Lần 2: Diagnostic

```
1. ✅ Mở DevTools (F12)
2. ✅ Click Console tab
3. ✅ Paste: await supabaseDebug.runFullDiagnostics()
4. ✅ Chụp ảnh kết quả
5. ✅ Gửi kết quả để phân tích
```

### Lần 3: Disable RLS Test

```
1. ✅ Vào Supabase SQL Editor
2. ✅ Chạy 4 lệnh DISABLE RLS ở trên
3. ✅ F5 reload app
4. ✅ Thử save item
   - Nếu được → vấn đề là RLS → quay lại fix RLS
   - Nếu vẫn không → vấn đề khác
5. ✅ Bật lại RLS bằng lệnh ENABLE
```

---

## 🎯 KHI NÀO BIẾT ĐƯỢC FIX THÀNH CÔNG?

✅ Khi:
- Mở modal "Thêm Vật tư mới"
- Fill form: Mã=TEST-001, Tên=Test Item, Đơn vị=cái, Danh mục=Khác
- Click "Lưu"
- Alert hiện: "✅ Lưu vật tư thành công!"
- Reload page → item vẫn có trong danh sách

---

## 📞 NẾU KHÔNG ĐƯỢC, GIẢI PHÁP CUỐI

Cung cấp thông tin:
1. Console log từ `await supabaseDebug.runFullDiagnostics()`
2. Error message chính xác từ DevTools
3. Ảnh screenshot modal error
4. `.env.local` settings (che đi key values)

Sau đó tôi sẽ fix triệt để cho bạn!
