# Google Drive Folder Management Feature

## Tổng quan
Tính năng này cho phép quản lý folder IDs cho các loại tài liệu khác nhau trong Google Drive. Thay vì hardcode folder ID, app sẽ tự động lấy từ cài đặt dựa trên loại tài liệu.

## Cấu trúc Database

### Bảng: `inventory_drive_settings`
Lưu trữ folder IDs cho các loại tài liệu:

```sql
- id: UUID (Primary Key)
- document_type: TEXT (Loại tài liệu - Unique)
  Các giá trị hợp lệ:
  - "Nhận vật tư" (Receipt)
  - "BB hoàn thành vật tư" (Completion Report)
  - "Phiếu xuất vật tư" (Issue slip)
  - "Tờ trình mua sắm" (Purchase Requisition)
- folder_id: TEXT (Google Drive Folder ID)
- folder_name: TEXT (Tên folder - tùy chọn)
- description: TEXT (Mô tả - tùy chọn)
- updated_by: TEXT (Ai cập nhật lần cuối)
- updated_at: TIMESTAMP (Thời gian cập nhật)
```

## Instructions - Setup

### 1. Thực hiện Migration
Chạy SQL migration file `11-create-drive-settings.sql` trong Supabase:
- Tạo bảng `inventory_drive_settings`
- Thêm 4 dòng mặc định cho các loại tài liệu
- Cấu hình RLS policies

### 2. Cấu hình Folder IDs
Vào **Cài đặt Vật tư** → Tab **"Quản lý Folder Google Drive"**
- Nhập Folder ID cho từng loại tài liệu
- Nhập tên folder (tùy chọn, để dễ quản lý)
- Nhấn "Sửa" để update

**Cách lấy Folder ID từ Google Drive:**
1. Vào folder trong Google Drive
2. URL sẽ có dạng: `https://drive.google.com/drive/folders/[FOLDER_ID]`
3. Copy phần `[FOLDER_ID]` và paste vào ô Folder ID

## Cách hoạt động

### Upload Flow
```
Người dùng upload biên bản
    ↓
HandoverRecordUploadModal
    ↓
Fetch folder ID từ inventory_drive_settings (document_type = "Nhận vật tư")
    ↓
Gọi uploadToGoogleDrive(file, folderId)
    ↓
Upload file vào folder được cấu hình
    ↓
Lưu webViewLink vào Supabase
    ↓
Update slip status = "Đã đóng"
```

## Code Changes

### 1. `googleDriveClient.ts`
- Modified `uploadToGoogleDrive()` để accept optional `folderId` parameter
- Nếu không pass folderId, sẽ dùng default từ CONFIG
- **Backward compatible** - các call cũ vẫn hoạt động

```typescript
// Cũ (vẫn hoạt động)
await uploadToGoogleDrive(file);

// Mới (với folder ID động)
await uploadToGoogleDrive(file, folderId);
```

### 2. `HandoverRecordUploadModal.tsx`
- Fetch folder ID từ Supabase dựa trên document_type
- Pass folder ID tới `uploadToGoogleDrive()`
- Fallback to default nếu không tìm thấy cài đặt

### 3. `InventorySettings.tsx`
- Add new tab: **"Quản lý Folder Google Drive"**
- UI để edit folder IDs
- Real-time subscription để sync changes

### 4. `types/inventory.ts`
- Add `DriveSettings` interface

## Mở rộng tương lai

Để thêm loại tài liệu mới (ví dụ: "Biên bản xuất vật tư"):

1. **Database**: Insert vào `inventory_drive_settings`
   ```sql
   INSERT INTO inventory_drive_settings (document_type, folder_id, folder_name)
   VALUES ('Biên bản xuất vật tư', '', 'Tên folder');
   ```

2. **Frontend**: Update modal component tương ứng
   ```typescript
   // In InventoryIssuesModal.tsx (như HandoverRecordUploadModal)
   const { data: settings } = await supabase
     .from('inventory_drive_settings')
     .select('folder_id')
     .eq('document_type', 'Biên bản xuất vật tư')  // ← Thay đổi
     .single();
   ```

## Error Handling
- Nếu Folder ID không cấu hình: App sẽ log warning nhưng vẫn upload bằng default folder
- Nếu Folder ID invalid: Google Drive API sẽ trả về lỗi

## RLS Policies
- **View**: Tất cả authenticated users có thể xem settings
- **Update/Insert**: Tất cả authenticated users có thể update (có thể modify để chỉ admin)

Nếu muốn chặn quyền update, modify SQL:
```sql
-- Chỉ cho admin update
CREATE POLICY "Allow admins to update drive settings"
ON inventory_drive_settings
FOR UPDATE
USING (
  SELECT role = 'admin' 
  FROM users 
  WHERE id = auth.uid()
)
WITH CHECK (
  SELECT role = 'admin' 
  FROM users 
  WHERE id = auth.uid()
);
```

## Testing Checklist
- [ ] SQL migration chạy thành công
- [ ] Tab "Quản lý Folder Google Drive" xuất hiện trong Settings
- [ ] Có thể edit và save folder IDs
- [ ] Changes real-time sync khi có người khác update
- [ ] Upload biên bản lưu vào folder được cấu hình
- [ ] File xuất hiện trong đúng folder Google Drive
- [ ] Status cập nhật thành "Đã đóng" sau upload
