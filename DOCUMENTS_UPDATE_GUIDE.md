# Hướng Dẫn: Cập Nhật Tính Năng Tài Liệu ISO

## Vấn Đề
Giao diện tài liệu ISO thiếu nhiều cột dữ liệu và có vấn đề với tên cột không nhất quán.

## Giải Pháp
Tôi đã cập nhật toàn bộ:
1. **Sửa naming convention** - Thay đổi từ camelCase sang snake_case cho tính nhất quán
2. **Thêm cột hiển thị** - Bảng giờ hiển thị đầy đủ thông tin về tài liệu
3. **Cập nhật form** - Form lưu dữ liệu chính xác

## Các Trường Dữ Liệu
Bảng tài liệu giờ hiển thị các trường sau:
| Cột | Mô Tả | Tên DB |
|-----|-------|--------|
| Mã TL | Mã tài liệu | code |
| Kí Hiệu Hệ | Kí hiệu hệ thống | system_code |
| Hệ | Tên hệ thống | system |
| Loại Tài Liệu | Loại tài liệu ISO | document_type |
| Tên Tài Liệu | Tên đầy đủ tài liệu | title |
| Lần BH | Lần ban hành | version |
| Ngày BH | Ngày ban hành | issue_date |
| Ngày Cập Nhật | Ngày cập nhật gần nhất | update_date |
| Người Biên Soạn | Người tạo tài liệu | author_name |
| Trạng Thái | Hiệu lực/Bản nháp/etc | status |

## Các Tệp Được Cập Nhật

### UI Components
- ✅ [src/pages/Documents.tsx](src/pages/Documents.tsx) - Thêm cột hiển thị, fix naming
- ✅ [src/components/DocumentForm.tsx](src/components/DocumentForm.tsx) - Fix naming convention
- ✅ [src/components/DocumentDetailsModal.tsx](src/components/DocumentDetailsModal.tsx) - Fix naming convention

### Database
- ✅ [supabase-migration/01-schema.sql](supabase-migration/01-schema.sql) - Định nghĩa schema với snake_case
- ✅ [supabase-migration/09-fix-documents-column-names.sql](supabase-migration/09-fix-documents-column-names.sql) - Migration để cập nhật cột cũ

## Hướng Dẫn Cài Đặt

### Bước 1: Chạy Migration SQL
Đi tới **Supabase Dashboard → SQL Editor** và chạy file:
```
supabase-migration/09-fix-documents-column-names.sql
```

Hoặc chạy trực tiếp:
```sql
-- Thêm các cột mới với tên đúng (snake_case)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS system_code TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS update_date DATE,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Copy dữ liệu từ cột cũ nếu có
UPDATE documents SET system_code = COALESCE(systemcode, system_code) WHERE systemcode IS NOT NULL;
UPDATE documents SET document_type = COALESCE(documenttype, document_type) WHERE documenttype IS NOT NULL;
UPDATE documents SET issue_date = COALESCE(issuedate, issue_date) WHERE issuedate IS NOT NULL;
UPDATE documents SET update_date = COALESCE(updatedate, update_date) WHERE updatedate IS NOT NULL;
UPDATE documents SET file_url = COALESCE(fileurl, file_url) WHERE fileurl IS NOT NULL;
UPDATE documents SET author_name = COALESCE(authorname, author_name) WHERE authorname IS NOT NULL;

-- Xóa cột cũ
ALTER TABLE documents
DROP COLUMN IF EXISTS systemcode,
DROP COLUMN IF EXISTS documenttype,
DROP COLUMN IF EXISTS issuedate,
DROP COLUMN IF EXISTS updatedate,
DROP COLUMN IF EXISTS fileurl,
DROP COLUMN IF EXISTS authorname;
```

### Bước 2: Làm Mới Giao Diện
1. Làm mới trang trình duyệt (F5)
2. Xóa cache nếu cần (Ctrl+Shift+Delete)
3. Load lại trang Tài liệu ISO

### Bước 3: Kiểm Tra Kết Quả
- Bảng hiện giờ hiển thị đầy đủ 10 cột
- Thử thêm tài liệu mới hoặc chỉnh sửa tài liệu hiện tại
- Xem chi tiết tài liệu để kiểm tra tất cả trường

## Tính Năng Mới

### Bảng Tài Liệu
- **Hiển thị đầy đủ thông tin** - Không còn phải click vào từng tài liệu để xem chi tiết
- **Tìm kiếm và lọc** - Lọc theo hệ, loại tài liệu, trạng thái
- **Import CSV** - Hỗ trợ import từ file Excel/CSV

### Form Thêm/Sửa
- **Tất cả trường bắt buộc** - Mã, Kí hiệu hệ, Hệ, Loại tài liệu, Tên tài liệu, Lần ban hành, Ngày ban hành, Ngày cập nhật, Người biên soạn
- **Tùy chọn tải file** - Có thể gắn file URL
- **Quản lý phiên bản** - Lưu phiên bản cũ trong lịch sử

### Chi Tiết Tài Liệu
- **Thông tin chung** - Mã, tên, hệ, loại, trạng thái
- **Phiên bản hiện tại** - Lần, ngày, người, file
- **Lịch sử phiên bản** - Xem tất cả các phiên bản cũ

## Nếu Vẫn Có Lỗi

**Kiểm tra cấu trúc bảng:**
Chạy query này trong Supabase SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY column_name;
```

Kết quả phải chứa các cột:
- author_id, author_name
- code
- created_at, document_type
- file_url
- history
- id
- issue_date
- status
- system, system_code
- title
- update_date, updated_at, updated_by
- version

## Lưu Ý
- Tất cả dữ liệu cũ sẽ được giữ nguyên
- Dữ liệu từ CSV import sẽ tự động được cập nhật đúng cột
- RLS policies vẫn hoạt động bình thường
