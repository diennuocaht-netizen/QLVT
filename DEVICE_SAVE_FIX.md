# Hướng Dẫn Sửa Lỗi Lưu Thiết Bị

## Vấn Đề
Lỗi: `Could not find the 'historyLogs' column of 'devices' in the schema cache`

**Nguyên Nhân:** PostgreSQL/Supabase tự động chuyển các tên cột không được quoted thành chữ thường. Nên `subComponents` thành `subcomponents`, `historyLogs` thành `historylogs`, nhưng code lại tìm các tên với xác điểm khác.

## Giải Pháp

### Bước 1: Chạy Migration SQL
Đi tới **Supabase Dashboard → SQL Editor** và chạy file:
```
supabase-migration/08-fix-devices-column-names.sql
```

Hoặc chạy các câu lệnh SQL này trực tiếp:

```sql
-- Thêm các cột mới với tên đúng (snake_case)
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS sub_components JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS history_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS change_logs JSONB DEFAULT '[]'::jsonb;

-- Copy dữ liệu từ cột cũ (nếu có)
UPDATE devices SET sub_components = COALESCE(subcomponents, '[]'::jsonb) WHERE subcomponents IS NOT NULL;
UPDATE devices SET history_logs = COALESCE(historylogs, '[]'::jsonb) WHERE historylogs IS NOT NULL;
UPDATE devices SET change_logs = COALESCE(changelogs, '[]'::jsonb) WHERE changelogs IS NOT NULL;

-- Xóa cột cũ
ALTER TABLE devices
DROP COLUMN IF EXISTS subcomponents,
DROP COLUMN IF EXISTS historylogs,
DROP COLUMN IF EXISTS changelogs;
```

### Bước 2: Xác Nhận Code Đã Được Cập Nhật
Các file sau đã được cập nhật để sử dụng tên cột snake_case:
- ✅ `src/components/DeviceForm.tsx` - sử dụng `author_id`, `created_at`, `updated_at`
- ✅ `src/components/DeviceProfileModal.tsx` - sử dụng `sub_components`, `history_logs`
- ✅ `src/components/DeviceDetailsModal.tsx` - sử dụng `sub_components`, `history_logs`
- ✅ `src/pages/Devices.tsx` - sử dụng `sub_components`
- ✅ `src/pages/Documents.tsx` - sử dụng `created_at`, `updated_at` v.v.
- ✅ `supabase-migration/01-schema.sql` - cập nhật định nghĩa bảng để sử dụng snake_case

### Bước 3: Kiểm Tra Kết Quả
Sau khi chạy migration:
1. Làm mới trang (F5)
2. Thử lưu các thông tin thiết bị mới hoặc chỉnh sửa thiết bị hiện tại
3. Nếu vẫn có lỗi, mở **DevTools → Network** và kiểm tra phản hồi từ Supabase

## Nếu Vẫn Có Lỗi

**Kiểm tra cấu trúc bảng:**
Chạy query này trong Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY column_name;
```

Kết quả phải chứa các cột:
- `author_id`
- `change_logs`
- `code`
- `created_at`
- `history_logs`
- `id`
- `location`
- `name`
- `specs`
- `status`
- `sub_components`
- `updated_at`

## Lưu Ý Quan Trọng

1. **Thường xuyên kiểm tra console** (F12 → Console) để xem lỗi chi tiết
2. **Xóa cache trình duyệt** nếu dữ liệu cũ bị nhớ lại
3. **Kiểm tra RLS Policies** nếu lỗi tiếp tục xảy ra:
   - Đi tới Supabase Dashboard → Authentication → Policies
   - Đảm bảo bạn có quyền INSERT/UPDATE trên bảng devices
