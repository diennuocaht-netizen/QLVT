# 🔍 Cách Debug Lỗi Lưu Dữ Liệu Supabase

## Bước 1: Chạy Diagnostic

Mở **DevTools** (F12) → **Console** tab, và chạy:

```javascript
// Run full diagnostics
await supabaseDebug.runFullDiagnostics()
```

Hoặc kiểm tra từng bước:

```javascript
// 1. Check authentication
await supabaseDebug.checkAuthStatus()

// 2. Check RLS policies
await supabaseDebug.checkRLSPolicies()

// 3. Test data transform
supabaseDebug.testDataTransform()
```

## Bước 2: Xem Lỗi Chi Tiết

Khi lưu vật tư, mở Console và tìm các lỗi như:

### Lỗi 1: "User is not authenticated"
**Nguyên nhân**: Chưa đăng nhập hoặc session bị mất
**Giải pháp**: Đăng nhập lại

### Lỗi 2: "User profile not found" / "PGRST116"
**Nguyên nhân**: User không tồn tại trong table `users`
**Giải pháp**: Xem [FIX_USER_PROFILE.md](./FIX_USER_PROFILE.md)

### Lỗi 3: "permission denied for schema public" / "PGRST301"
**Nguyên nhân**: RLS policies không cho phép thao tác
**Giải pháp**: Xem [RLS_FIX_GUIDE.md](./RLS_FIX_GUIDE.md)

### Lỗi 4: "invalid input syntax for uuid"
**Nguyên nhân**: Dữ liệu ID không đúng format UUID
**Giải pháp**: Kiểm tra lại data transform

## Bước 3: Kiểm tra Supabase Console

1. Vào https://supabase.com → Project
2. Chọn **SQL Editor**
3. Chạy query để kiểm tra RLS:

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_class
WHERE tablename IN ('users', 'inventory_items');

-- Check policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('users', 'inventory_items')
ORDER BY tablename, policyname;

-- Check if test user can insert
INSERT INTO inventory_items (code, name, unit, category, classification, quantity, initial_stock, unit_price)
VALUES ('TEST-DEBUG', 'Test Item', 'cái', 'Test', 'Test', 0, 0, 0);
```

## Bước 4: Các Câu Hỏi Để Tự Kiểm Tra

- [ ] Đã đăng nhập thành công?
- [ ] Email người dùng có trong `users` table không?
- [ ] RLS policies đã được áp dụng chưa?
- [ ] `auth.role()` là `authenticated` không?
- [ ] Response từ API có chứa `error` không?

## Bước 5: Copy Error Message

Nếu vẫn lỗi, copy đầy đủ error message từ console và share với tôi:

```
Error: [copy full text từ console]
  at ItemModal.tsx:...
```

---

**Mách nhỏ**: Bất cứ lúc nào cần debug, chỉ cần mở Console và chạy `supabaseDebug.runFullDiagnostics()`
