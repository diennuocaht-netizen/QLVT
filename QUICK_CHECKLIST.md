# ⚡ QUICK CHECKLIST - FIX NGAY CẢ LỖI

## 🚀 NGAY BÂY GIỜ LÀM THEO ĐÂY (2 PHÚT)

### Step 1: Mở DevTools Console
- [ ] Nhấn **F12**
- [ ] Click tab **Console**
- [ ] Bạn sẽ thấy message xanh: ✅ Debug utils ready!

### Step 2: Chạy Diagnostic
- [ ] Copy lệnh này:
```javascript
await supabaseDebug.runFullDiagnostics()
```
- [ ] Dán vào Console
- [ ] Nhấn **Enter**
- [ ] Chờ kết quả (3-5 giây)

### Step 3: Xem Kết Quả - Chọn Hành Động

**Nếu thấy:**
```
❌ Auth: FAILED
```
→ Đăng xuất → Đăng nhập lại → Test save lại

---

**Nếu thấy:**
```
❌ RLS Policies: FAILED
```
→ Làm bước dưới

---

**Nếu thấy:**
```
✅ Auth: OK
✅ Data Transform: OK
✅ RLS Policies: OK
```
→ Thử save 1 vật tư test

---

## 🛠️ FIX RLS POLICIES (5 PHÚT)

Nếu diagnostic báo RLS fail:

### Step 1: Mở Supabase SQL Editor
- [ ] Vào https://supabase.com/dashboard
- [ ] Chọn project của bạn
- [ ] Click **SQL Editor** (bên trái)
- [ ] Click **New Query**

### Step 2: Paste SQL Script
- [ ] Mở file: **supabase-migration/06-quick-rls-fix.sql**
- [ ] **Ctrl+A** chọn tất cả nội dung
- [ ] **Ctrl+C** copy
- [ ] Vào Supabase SQL Editor
- [ ] Click vào text area (xóa nội dung cũ nếu có)
- [ ] **Ctrl+V** paste
- [ ] Click **RUN** (nút màu xanh)

### Step 3: Verify
- [ ] Xem có error đỏ không?
- [ ] Nếu không error → Chạy xong ✅
- [ ] Nếu có error → Gửi screenshot cho tôi

### Step 4: Reload App
- [ ] Quay lại app: http://localhost:3005
- [ ] Nhấn **Ctrl+F5** (reload cộng clear cache)
- [ ] Chạy lại diagnostic

---

## 🧪 TEST SAVE OPERATION (2 PHÚT)

Sau khi tất cả diagnostic ok:

### Step 1: Thêm Vật tư Test
- [ ] Click nút **"Thêm Vật tư mới"** (xanh dương)
- [ ] Điền form:
  - Mã: TEST-001
  - Tên: Test Item
  - Đơn vị: cái
  - Danh mục: Khác
- [ ] Nhấn **"Lưu"** (nút tím)

### Step 2: Kiểm tra Kết quả
- [ ] ✅ Nếu alert xanh "Lưu vật tư thành công!" → **THÀNH CÔNG!** 🎉
- [ ] ❌ Nếu alert đỏ "Lỗi lưu vật tư:" → Copy error message gửi cho tôi

---

## 📝 NẾU VẪN LỖI - GỬI THÔNG TIN

### Cung cấp:
1. **Screenshot console diagnostic output**
   - Chạy: `await supabaseDebug.runFullDiagnostics()`
   - Chụp ảnh kết quả

2. **Screenshot lỗi save**
   - F12 → Console
   - Click "Lưu"
   - Chụp ảnh error đỏ

3. **File .env.local** (che đi key values)
   - Gửi để verify settings

---

## ⏱️ TIMELINE

| Bước | Thời gian | Việc làm |
|------|----------|---------|
| 1 | 2 min | Chạy diagnostic |
| 2 | 5 min | Fix RLS (nếu need) |
| 3 | 1 min | Reload app |
| 4 | 2 min | Test save |
| **Tổng** | **10 min** | Tất cả sẽ được fix |

---

## 💡 QUICK FIX TIPS

❌ **Auth Failed**
→ Đăng xuất, đăng nhập lại, xong!

❌ **RLS Failed**
→ Chạy SQL script 06-quick-rls-fix.sql, xong!

❌ **Transform Failed**
→ Reload page (Ctrl+F5), xong!

❌ **Still Error**
→ Gửi screenshot, tôi fix tiếp!

---

## 🎯 KHI NÀO BIẾT THÀNH CÔNG?

✅ Chỉ cần:
1. Click "Lưu"
2. Thấy alert xanh "✅ Lưu vật tư thành công!"
3. Reload page
4. Item vẫn có trong danh sách
5. Xong! 🚀

---

**Bắt đầu ngay từ STEP 1 phía trên!**
