# Hướng dẫn Quản lý Người dùng - Email/Password Authentication

## Tổng quan
Hệ thống đã được chuyển từ Google OAuth sang Email/Password authentication. **Admin** sẽ tạo user và phân quyền thông qua:
1. Trang **Quản trị** → **Thêm người dùng**
2. Terminal script để đặt mật khẩu

---

## 📋 Quy trình tạo người dùng mới

### Bước 1: Vào trang Quản trị
1. Đăng nhập với tài khoản **Admin**
2. Vào menu **Quản trị** (Admin panel)
3. Nhấp nút **Thêm người dùng** (ở góc phải trên)

### Bước 2: Điền thông tin
Trong modal "Thêm Người dùng mới":
- **Email**: Email mà user sẽ dùng để đăng nhập
- **Họ và tên**: Tên người dùng (tuỳ chọn)
- **Phân quyền**: Chọn loại quyền
  - `Viewer (Chỉ xem)`
  - `Manager (Thêm/Sửa)`
  - `Admin (Toàn quyền)`

### Bước 3: Chạy script tạo mật khẩu
Sau khi bấm **Tạo người dùng**, trang sẽ hiển thị message với lệnh cần chạy. Ví dụ:

```bash
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" node scripts/create-user.js
```

Hoặc nếu bạn đã setting environment variable:
```bash
node scripts/create-user.js
```

Script sẽ hỏi bạn nhập:
- Email (copy từ message trước)
- Mật khẩu (tùy chọn của admin)
- Họ tên (tuỳ chọn)
- Phân quyền (tuỳ chọn)

---

## 🔑 Cấu hình SERVICE_ROLE_KEY

### Lấy Service Role Key từ Supabase
1. Vào https://app.supabase.com
2. Chọn project của bạn
3. **Settings** → **API** → Scroll xuống
4. Tìm **Service Role** (khác với **Anon Public**)
5. Copy key (dài, bắt đầu với `eyJ...`)

### Cách 1: Set Environment Variable (Windows PowerShell)
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "your_service_role_key_here"
node scripts/create-user.js
```

### Cách 2: Set Environment Variable (Windows CMD)
```cmd
set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
node scripts/create-user.js
```

### Cách 3: Set trong .env.local (bất cứ OS nào)
Thêm vào file `.env.local`:
```env
VITE_SUPABASE_URL=https://setljfuhprinmsqztqyd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```
Sau đó chạy:
```bash
node scripts/create-user.js
```

---

## 📱 Quy trình đăng nhập của User

1. User vào ứng dụng (Login page)
2. Nhập **Email** (do admin cung cấp)
3. Nhập **Mật khẩu** (do admin cung cấp)
4. Bấm **Đăng nhập**
5. Redirect đến Dashboard

---

## 🔑 Quản lý Mật khẩu

### User quên mật khẩu
1. Admin vào trang **Quản trị**
2. Tìm user trong danh sách
3. Nhấp icon **✉️** (Mail icon) ở cột **Hành động**
4. Link reset password được gửi đến email của user
5. User click link và tạo mật khẩu mới

### Admin đổi/thiết lập lại mật khẩu cho user
Hiện tại, admin chưa thể đổi mật khẩu trực tiếp. Cách khác:
1. **Xóa user**: Nhấp icon **🗑️** ở cột **Hành động**
2. **Tạo user mới** với email và mật khẩu mới

---

## ✏️ Quản lý Quyền (Role)

### Thay đổi quyền user
1. Vào trang **Quản trị**
2. Tìm user trong danh sách
3. Click vào dropdown **Phân quyền** (cột **Phân quyền**)
4. Chọn role mới: `Viewer`, `Manager`, hoặc `Admin`
5. Thay đổi được lưu **tự động**

### Sửa tên hiển thị
1. Nhấp icon **✏️** (Edit) cạnh tên user
2. Nhập tên mới
3. (Tuỳ chọn) Cập nhật role
4. Nhấp ✅ để lưu hoặc ❌ để hủy

---

## 🗑️ Xóa User

1. Vào trang **Quản trị**
2. Tìm user trong danh sách
3. Nhấp icon **🗑️** ở cột **Hành động**
4. Xác nhận xóa
5. User sẽ bị xóa khỏi hệ thống và không thể đăng nhập nữa

---

## 🔒 Các Role và Quyền

| Role | Quyền |
|------|-------|
| **Viewer** | - Xem tất cả dữ liệu<br>- Không thể thêm/sửa/xóa |
| **Manager** | - Xem all dữ liệu<br>- Thêm/Sửa items<br>- Không thể xóa<br>- Không thể quản lý users |
| **Admin** | - Toà quyền (xem/thêm/sửa/xóa)<br>- Quản lý users<br>- Cấu hình hệ thống |

---

## 🆘 Troubleshooting

### Lỗi: "SERVICE_ROLE_KEY không được cấu hình"
**Giải pháp**: 
1. Lấy key từ Supabase Settings → API
2. Set environment variable trước khi chạy script
3. Hoặc thêm vào `.env.local`

### Lỗi: "Email này đã tồn tại"
**Giải pháp**: Email đã được tạo trong hệ thống. Dùng email khác.

### User không thể đăng nhập sau khi được tạo
**Giải pháp**:
1. Kiểm tra: Email và mật khẩu có đúng không
2. Chờ vài giây (có thể chưa sync)
3. Refresh trang (Ctrl+F5)
4. Nếu vẫn không được, xóa user và tạo lại

### Script crash hoặc lỗi khi chạy
**Giải pháp**:
1. Kiểm tra SERVICE_ROLE_KEY có đúng không
2. Kiểm tra cấu trúc database (chạy migration lại nếu cần)
3. Xem console error chi tiết

---

## 📞 Hỗ trợ
Nếu gặp vấn đề khác, kiểm tra:
- Console (F12 → Console tab) cho error messages
- .env.local có các biến environment đúng không
- Service Role Key có hợp lệ không
