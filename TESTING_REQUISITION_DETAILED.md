# 🔧 Gỡ Lỗi Lưu Tờ Trình - Hướng Dẫn

## ✅ Các Fix Mới Được Áp Dụng

### 1. Auto-Generated Code
- Mã tờ trình tự động sinh ra (TT-001, TT-002, ...)
- Click "Tạo Tờ Trình mới" → Code tự điền

### 2. Xác Thực Dữ Liệu Chi Tiết
- Kiểm tra từng item:
  - Phải chọn vật tư
  - Số lượng phải > 0
- Kiểm tra các trường bắt buộc:
  - Mã tờ trình
  - Ngày lập
  - Mục đích
  - **Người lập (QUAN TRỌNG!)**

### 3. Xác Định Người Lập (createdBy)
- Nếu bạn chọn từ dropdown "Người lập" → dùng giá trị đó
- Nếu không chọn → dùng tên người dùng hiện tại
- Nếu vẫn không có → tìm người dùng phù hợp từ danh sách

### 4. Thông Báo Lỗi Chi Tiết
- Hiển thị lỗi từ Supabase (details, hint, code)
- Console sẽ show data được gửi đi

---

## 🧪 CÁCH TEST

### Bước 1: Mở Requisition Modal
```
- Đi tới "Tờ Trình" menu
- Click nút "Tạo Tờ Trình mới"
- Modal mở ra
```

### Bước 2: Kiểm Tra Form
```
- Mã tờ trình: TT-001 (auto-generated, không thể sửa)
- Ngày lập: Auto-fill hôm nay (có thể sửa)
- Loại: Thường (mặc định)
- Trạng thái: Mới (mặc định)
- Người lập: (BỎ TRỐNG) ← User phải chọn!
- Mục đích: (BỎ TRỐNG) ← User phải nhập
```

### Bước 3: Chọn "Người Lập" (CRUCIAL!)
```
1. Click dropdown "Người lập"
2. Chọn một tên từ danh sách (vd: Hoàng Toàn)
3. Nhập Mục đích (vd: "Mua các thiết bị cần thiết")
```

### Bước 4: Thêm Item
```
1. Click "+ Thêm dòng"
2. Chọn vật tư từ dropdown (vd: "VT-001")
3. Nhập Số lượng: 5 (phải > 0)
4. Chọn Hệ thống, Mục đích, Phương thức
5. Mã chi phí auto-fill
```

### Bước 5: Mở DevTools Console
```
1. Ấn F12 (hoặc Ctrl+Shift+I)
2. Chọn tab "Console"
3. Sẵn sàng để xem logs
```

### Bước 6: Click "Lưu"
```
1. Cuộn xuống dưới modal
2. Click nút "Lưu thử..."
3. Kiểm tra:
   - Alert message (nếu lỗi)
   - Console logs (sẽ thấy dữ liệu được gửi)
```

### Bước 7: Xem Logs
Trong Console sẽ thấy:
```
📝 Form data (camelCase): {...}
📝 Database data (snake_case): {...}
📝 Data to insert: {...}
➕ Creating new requisition
📊 Insert response: {...}
```

Hoặc nếu lỗi:
```
❌ Save requisition error: {...}
```

---

## 🚨 Nếu Vẫn Gặp Lỗi

### Lỗi: "Không xác định được người tạo"
**Giải pháp**: Chọn tên từ dropdown "Người lập" trước khi lưu

### Lỗi: "Item X: Không chọn vật tư"
**Giải pháp**: Bạn phải chọn vật tư từ dropdown ở cột "Vật tư"

### Lỗi: "Item X: Số lượng phải > 0"
**Giải pháp**: Nhập số lượng > 0 ở cột "SL Yêu cầu"

### Lỗi: "Mã tờ trình không được để trống"
**Giải pháp**: Không nên xóa mã (TT-001). Nếu bị xóa, reload page

### Lỗi từ Supabase (ví dụ "duplicate key")
**Giải pháp**:
1. Copy lỗi từ alert
2. Kiểm tra đã tồn tại mã này chưa (reload page)
3. Nếu vẫn lỗi, screenshot lỗi + console logs

---

## 📋 Checklist Trước Khi Lưu

Trước khi click "Lưu", đảm bảo:
- [ ] Mã tờ trình không trống (TT-xxx)
- [ ] Ngày lập không trống
- [ ] **Người lập đã chọn từ dropdown**
- [ ] Mục đích không trống
- [ ] Có ít nhất 1 item trong bảng
- [ ] Mỗi item:
  - [ ] Vật tư đã chọn
  - [ ] Số lượng > 0
  - [ ] Hệ thống đã chọn
  - [ ] Mục đích đã chọn
  - [ ] Phương thức đã chọn

---

## 💾 Nếu Lưu Thành Công

Alert sẽ hiển thị:
```
✅ Lưu tờ trình thành công!
```

Modal sẽ tự đóng, và tờ trình sẽ xuất hiện trong danh sách

---

## 🔍 DEBUG INFO - Chia Sẻ Khi Báo Lỗi

Nếu vẫn gặp lỗi, hãy screenshot:
1. **Alert message** (error text)
2. **Console logs** (F12 → Console tab)
3. **Network tab** (F12 → Network) - POST request đến `/rest/v1/inventory_requisitions`
   - Click request
   - Xem Response tab (Supabase error)

---

**Updated**: 2025-01-09  
**Status**: Ready for Testing with Enhanced Logging
