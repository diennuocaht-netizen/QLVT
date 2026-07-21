# 🎯 FIX LỖI LƯU DỮ LIỆU - HƯỚNG DẪN TỪNG BƯỚC

## ⚡ BƯỚC 1: Kiểm tra User Profile (2 phút)

### 1️⃣.1 Mở DevTools Console

- Nhấn **F12** trong trình duyệt
- Click tab **Console**
- Bạn sẽ thấy message xanh: "✅ Debug utils ready! Run: await supabaseDebug.runFullDiagnostics()"

### 1️⃣.2 Chạy Diagnostic

Copy và dán lệnh này vào Console rồi nhấn **Enter**:

```javascript
await supabaseDebug.runFullDiagnostics()
```

### 1️⃣.3 Xem Kết Quả

Bạn sẽ thấy báo cáo như thế này:

```
✅ Auth: OK
✅ Data Transform: OK
✅ RLS Policies: FAILED
```

**CÓ 3 KẾT QUẢ CÓ THỂ XẢY RA:**

---

## 🔴 TRƯỜNG HỢP 1: "❌ Auth: FAILED"

**Ý nghĩa**: Chưa đăng nhập hoặc user profile không tạo được

### Cách Fix:

**Cách 1**: Đăng xuất → Đăng nhập lại
1. Click **"Đăng xuất"** ở menu
2. Chờ 2 giây
3. Đăng nhập lại bằng email/password
4. Chạy lại diagnostic: `await supabaseDebug.runFullDiagnostics()`

**Cách 2**: Tạo user profile thủ công
1. Vào **Supabase Dashboard** → **SQL Editor**
2. Chạy query này (thay email của bạn):

```sql
INSERT INTO users (id, email, display_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'diennuoc.aht@gmail.com'
  AND id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;
```

3. Click **RUN**
4. Reload app (Ctrl+F5)
5. Chạy lại diagnostic

---

## 🔴 TRƯỜNG HỢP 2: "❌ RLS Policies: FAILED"

**Ý nghĩa**: RLS không cấu hình đúng, cần chạy SQL script

### Cách Fix - LỰA CHỌN A (Recommended):

1. Mở **Supabase Dashboard** → **SQL Editor**
2. Xóa hết code cũ (Ctrl+A)
3. Copy toàn bộ code từ file **`supabase-migration/06-quick-rls-fix.sql`**
   - Nhấn **Cmd+A** để chọn tất cả rồi **Cmd+C** để copy
4. Dán vào SQL Editor: **Ctrl+V**
5. Click **RUN** 
6. Chờ chạy xong, xem console có error không:
   - Nếu thành công: Sẽ thấy tên các table như "users", "inventory_items", etc.
   - Nếu lỗi: Ghi lại error message

7.  Reload app (Ctrl+F5)
8. Chạy lại diagnostic: `await supabaseDebug.runFullDiagnostics()`
9. **PHẢI thấy "✅ RLS Policies: OK"**

### Cách Fix - LỰA CHỌN B (Quick Test):

Nếu vẫn fail sau A, thử disable RLS để verify vấn đề:

```sql
-- Chạy trong Supabase SQL Editor
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
```

Sau đó reload app và thử lưu 1 vật tư. Nếu được lưu → vấn đề là RLS.

Bật lại RLS:
```sql
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
```

Rồi chạy SQL script lại từ LỰA CHỌN A.

---

## 🟢 TRƯỜNG HỢP 3: "✅ Tất cả OK"

**Ý nghĩa**: Tất cả config đúng, bạn có thể lưu dữ liệu

### Kiểm Tra Thêm:

Thử lưu 1 vật tư mới:

1. Click **"Thêm Vật tư mới"**
2. Fill form:
   - **Mã Vật tư**: TEST-001
   - **Tên Vật tư**: Test Item
   - **Đơn vị tính**: cái
   - **Danh mục**: Khác
3. Click **"Lưu"**

**Mong đợi**: Alert hiện "✅ Lưu vật tư thành công!"

Nếu vẫn báo lỗi, xem console có message gì:
- Mở DevTools Console
- Tìm dòng "📤 [ItemModal] Saving item data:"
- Gửi screenshot error message cho tôi

---

## 🚨 NẾU VẪN KHÔNG ĐƯỢC

### Cung cấp thông tin này:

1. **Screenshot console diagnostic:**
```javascript
await supabaseDebug.runFullDiagnostics()
```

2. **Screenshot lỗi save:**
   - F12 → Console tab
   - Click "Lưu" button
   - Screenshot dòng lỗi đỏ

3. **Kiểm tra Supabase settings:**
   - Vào Supabase Dashboard
   - Xem URL và anon key có đúng trong `.env.local` không?
   - Xem có table `users` không?

---

## 💡 QUICK REFERENCE

| Error | Cách Fix |
|-------|---------|
| "permission denied" (RLS 301) | Chạy 06-quick-rls-fix.sql |
| "row not found" (PGRST116) | Đăng xuất → Đăng nhập lại |
| "unknown column" | Reload page (Ctrl+F5) |
| "Invalid syntax" | Kiểm tra .env.local settings |

---

## 📱 Liên hệ

Nếu không được, gửi:
1. Console log từ `runFullDiagnostics()`
2. Error screenshot
3. File `.env.local` (che đi key values)

Tôi sẽ fix triệt để cho bạn! 🚀
