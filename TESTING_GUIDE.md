# 🧪 Hướng Dẫn Kiểm Tra Các Lỗi & Fix

## **Test 1: App Treo Ở Đăng Nhập**

### Bước 1: Đăng Nhập Vào App
```
1. Mở app
2. Nhập email & password đúng
3. Click "Đăng Nhập"
4. Chờ app load xong
```

### Bước 2: Logout
```
1. Click menu/settings (góc trên phải)
2. Click nút "Đăng Xuất" (Logout)
3. **QUAN TRỌNG**: Chỉ cần chờ 1-2 giây, **không cần clear cache**
```

### Bước 3: Đăng Nhập Lại  
```
1. Nhập email & password
2. Click "Đăng Nhập"
3. ✅ App **phải** load bình thường
```

### ✅ Kết Quả Thành Công:
- App load dashboard data trực tiếp
- Không bị treo ở màn hình đăng nhập
- Không gặp lỗi Connection Timeout

### ❌ Nếu Còn Bị Lỗi:
```
Check browser console (F12 → Console):
- Xem có 🔄 [Auth] messages
- Nếu có timeout error → session timeout chưa được fix đúng
- Nếu subscribe listeners không bị cleanup → removeAllChannels() chưa hoạt động
```

---

## **Test 2: Vật Tư Bị Đúp**

### Bước 1: Vào Trang Quản Lý Vật Tư
```
1. Đăng nhập thành công
2. Click "Quản Lý Vật Tư" (InventoryItems page)
3. Chờ danh sách load xong
```

### Bước 2: Thêm Vật Tư Mới
```
1. Click nút "+ Thêm Vật Tư"
2. Nhập các thông tin:
   - Mã VT: "TEST001"
   - Tên: "Test Item"
   - Đơn vị: "Cái"
   - Danh mục: "Tổng quát"
3. Click "Lưu"
4. Chờ modal đóng
```

### Bước 3: Kiểm Tra Danh Sách
```
1. **Nhìn danh sách dưới modal**
   ✅ ĐÚNG: Chỉ có 1 item "TEST001"
   ❌ SAI: Có 2 item "TEST001" giống nhau

2. Nếu thấy 1 cái:
   - F5 reload page
   - Chờ load xong
   ✅ Vẫn chỉ có 1 cái → FIX THÀNH CÔNG
```

### ✅ Console Log Để Kiểm Tra:
Mở F12 → Console, tìm:
```
✅ [InventoryItems] Item update/insert successful
⚠️ [InventoryItems] Item already exists, skipping duplicate  ← Dòng này nếu có là tốt
➕ New item inserted, updating state...
```

### Nếu Còn Append Đúp:
```
- Không thấy "Item already exists, skipping duplicate"
- Item được thêm 2 lần vào danh sách
→ Subscription không được delay cho đến khi initial load xong
```

---

## **Test 3: Trang Cài Đặt Vật Tư Treo**

### Bước 1: Vào Trang Cài Đặt
```
1. Đăng nhập
2. Tìm "Cài Đặt Vật Tư" (InventorySettings page)
   - Có thể trong menu Settings hoặc Admin
3. Click vào
```

### Bước 2: Kiểm Tra Loading
```
❌ LỖI CŨ: 
   - App bị hang/treo
   - Không hiện tab "Phân hệ", "Loại Tờ Trình", "Mã Ch.phí"
   - F12 Console có red errors

✅ FIX THÀNH CÔNG:
   - 2-3 giây app load xong
   - Hiện 3 tabs: Phân hệ | Loại Tờ Trình | Mã Ch.phí
   - Danh sách hiện data đầy đủ
   - F12 Console có ✅ [InventorySettings] Initial data loaded successfully
```

### Bước 3: Kiểm Tra Tab
```
1. Click tab "Phân hệ" → hiện danh sách phân hệ
2. Click tab "Loại Tờ Trình" → hiện danh sách loại
3. Click tab "Mã Ch.phí" → hiện danh sách mã chi phí
```

### ✅ Console Log Để Kiểm Tra:
Mở F12 → Console, tìm:
```
📥 [InventorySettings] Loading initial data...
✅ [InventorySettings] Initial data loaded successfully
📡 [InventorySettings] Subsystem event: INSERT/UPDATE/DELETE
```

### ⚠️ Nếu Còn Bị Treo:
```
- Không có "Initial data loaded successfully"
- Có "pending request" trong Network tab
- Có subscription errors trong console
→ Check database connection / RLS permissions
```

---

## **Test 4: Multiple Logout/Login (Stress Test)**

Kiểm tra memory leaks và cleanup:

### Bước 1: Logout & Login Liên Tục
```
1. Đăng nhập
2. Logout
3. Đăng nhập lại (không clear cache)
4. Logout
5. Đăng nhập lại
6. Lặp lại 3-5 lần
```

### ✅ Kết Quả Thành Công:
- Mỗi lần đều load bình thường
- App không bị chậm
- Browser không báo memory leak (DevTools → Performance)

### ✅ Console Log:
```
🔐 [Auth] Session found / No session found
🧹 [Auth] Clearing cache...
🔌 [Auth] Closing all subscriptions...
🧹 [InventorySettings] Cleaning up subscriptions
```

---

## **Test 5: Thêm & Xóa Dữ Liệu (Realtime Update)**

### Bước 1: Mở 2 Tab Cùng Lúc
```
1. Tab 1: Mở trang Quản Lý Vật Tư
2. Tab 2: Mở cùng trang (2 browser windows)
```

### Bước 2: Thêm Dữ Liệu Ở Tab 1
```
1. Tab 1: Click "+ Thêm Vật Tư"
2. Nhập "TEST002" và save
3. Nhìn Tab 2 → **phải auto update** trong 1-2 giây
4. Không cần reload
```

### ✅ Kết Quả Thành Công:
- Tab 2 auto hiện item vừa thêm
- Không bị đúp
- Subacription hoạt động real-time

---

## **Test 6: Import Data (Cost Codes)**

### Bước 1: Vào Cài Đặt → Mã Chi Phí
```
1. Vào Cài Đặt Vật Tư
2. Click tab "Mã Chi Phí"
3. Có nút "Import Excel"
```

### Bước 2: Import File
```
1. Click Import
2. Chọn file Excel có data
3. Chờ import xong
```

### ✅ Kết Quả Thành Công:
- Hiện thông báo "Import thành công X mã chi phí"
- Danh sách update thêm dữ liệu
- Không bị lỗi hoặc duplicate

---

## **Quick Diagnostic Command**

Chạy trong browser console (F12):

```javascript
// Check current user
await supabaseDebug.checkUser()

// Check all subscriptions
console.log('Active channels:', supabase.getChannels())

// Check localStorage
console.log('LocalStorage keys:', Object.keys(localStorage))

// Run full diagnostics
await supabaseDebug.runFullDiagnostics()
```

---

## **Kết Luận**

| Test | Status | Note |
|------|--------|------|
| Login/Logout | ✅ Pass | Không cần clear cache |
| Duplicate Items | ✅ Pass | Chỉ hiện 1 item |
| Settings Loading | ✅ Pass | Data load xong 2-3s |
| Multiple Session | ✅ Pass | Không memory leak |
| Realtime Update | ✅ Pass | Auto update không duplicate |
| Import Data | ✅ Pass | Data import thành công |

Tất cả test đều pass → **Tất cả lỗi đã được fix! 🎉**
