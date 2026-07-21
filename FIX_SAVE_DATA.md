# 🚀 Fix: Lỗi Lưu Dữ Liệu Lên Supabase

## ⚠️ Vấn Đề

Khi bạn cố gắng thêm vật tư hoặc lưu dữ liệu, bạn gặp lỗi hoặc data không được lưu.

## 🔍 Nguyên Nhân Chính

Có **3 nguyên nhân chính**:

1. **RLS Policies chưa được cấu hình đúng**
   - Supabase sử dụng Row-Level Security để kiểm soát quyền truy cập
   - Nếu policies không đúng, user sẽ không có quyền INSERT/UPDATE

2. **User Profile chưa được tạo**
   - Khi user mới đăng nhập, app cio tạo record trong table `users`
   - Nếu việc tạo này fail, user sẽ không thể làm bất kỳ thao tác nào

3. **Data Transform có vấn đề**
   - Frontend dùng camelCase, nhưng database dùng snake_case
   - Code đã fix, nhưng có thể còn edge cases

---

## ✅ Cách Fix: 3 Bước

### **BƯỚC 1: Chạy Quick RLS Fix Script**

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung từ file:
   ```
   supabase-migration/06-quick-rls-fix.sql
   ```
3. Paste vào SQL Editor
4. Click **"Run"**

**Kết quả mong đợi:**
- Tất cả queries chạy thành công
- Dòng cuối cùng hiển thị RLS policies đã được tạo

---

### **BƯỚC 2: Test Lại Trên Ứng Dụng**

1. Tải lại trang (Ctrl+F5)
2. Đăng nhập lại
3. Vào **Quản lý Vật tư** → **Thêm Vật tư mới**
4. Điền lại dữ liệu:
   - Mã Vật tư: `TEST-001`
   - Tên Vật tư: `Test Item`
   - Đơn vị tính: `cái`
   - Danh mục: `Test`
5. Click **Lưu**

**Kết quả mong đợi:**
- Alert hiển thị "✅ Lưu vật tư thành công!"
- Data xuất hiện trong bảng

---

### **BƯỚC 3: Debug Nếu Vẫn Lỗi**

Nếu vẫn không được, mở **DevTools** (F12):

1. Chọn **Console** tab
2. Chạy diagnostic:
   ```javascript
   await supabaseDebug.runFullDiagnostics()
   ```

3. Xem output và tìm thông báo lỗi:

| Lỗi | Giải Pháp |
|---|---|
| `Auth: FAILED` | Đăng nhập lại |
| `RLS: FAILED` | Xem phần "BƯỚC 1" lại |
| `Transform: FAILED` | Contact support |

---

## 🚨 Nếu Vẫn Không Được

HOẶC nếu bạn muốn test nhanh mà chưa muốn áp dụng RLS policies chính thức:

### Tạm Thời Disable RLS (Development Only)

⚠️ **CẢNH BÁO**: Chỉ dùng cho development, KHÔNG dùng cho production!

Chạy SQL này trong Supabase SQL Editor:

```sql
-- Disable RLS tạm thời
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions DISABLE ROW LEVEL SECURITY;

-- Test lưu dữ liệu
-- Sau khi test xong, RE-ENABLE RLS:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_requisitions ENABLE ROW LEVEL SECURITY;
```

Sau khi disable RLS:
- Bất kỳ ai cũng có thể read/write data
- ✅ Lưu dữ liệu sẽ hoạt động
- ❌ Bảo mật bị mất

Sau khi test xong, phải **RE-ENABLE RLS** và chạy BƯỚC 1.

---

## 📊 Kiểm Tra Status RLS

Để xem RLS hiện tại có được enable không, chạy:

```sql
SELECT tablename, rowsecurity
FROM pg_class
WHERE tablename IN ('users', 'inventory_items', 'inventory_slips', 'inventory_requisitions');
```

**Kết quả:**
- Nếu `rowsecurity = t` → RLS **enabled** ✅
- Nếu `rowsecurity = f` → RLS **disabled** ❌

---

## 💡 Tips Debugging

1. **Mở DevTools Console**: F12 → Console
   - Kiếm "❌" hoặc "Error" để xem chi tiết
   
2. **Xem Supabase Logs**: 
   - Supabase Dashboard → Logs tab
   - Xem API requests bị deny

3. **Copy đầy đủ error message** để chia sẻ với support

---

## ✨ Nếu Thành Công

Sau khi **BƯỚC 1** chạy thành công:
- ✅ RLS policies đã được cấu hình đúng
- ✅ All authenticated users có quyền read/write
- ✅ Data sẽ được lưu thành công

Bạn có thể bắt đầu sử dụng ứng dụng bình thường!

---

## 📞 Nếu Cần Trợ Giúp

Share với tôi:
1. **Console error message** (Ctrl+Shift+J, xem lỗi đỏ)
2. **Supabase project URL** (URL project dashboard)
3. **Account email** bạn đang dùng để đăng nhập
4. **Screenshot** của error messages

Sau đó tôi có thể help chi tiết hơn!
