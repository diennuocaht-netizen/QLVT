# Mục tiêu

Nâng cấp tính năng "Nội dung kiểm tra chung" (Bảng 1) trong Biểu mẫu đo đạc để:
1. Cho phép tùy chỉnh linh hoạt các cột thông tin (thay đổi tiêu đề, thêm bớt cột tùy ý thay vì cố định Miêu tả/Tiêu chuẩn).
2. Trình bày kết quả đánh giá (Đạt/Không đạt/Ghi chú) **tách riêng cho từng thiết bị/máy móc** được chọn (mỗi máy 1 cột), tương tự như Bảng thông số đo đạc.

## Các thay đổi chính

### 1. Cấu trúc dữ liệu (src/types/measurement.ts)
- Bổ sung checklist_metadata vào MeasurementForm để lưu trữ tên hiển thị của cột chính và danh sách các cột tùy chỉnh.
- Bổ sung customValues vào ChecklistItem để lưu giá trị của các cột tùy chỉnh.
- Thay đổi cấu trúc lưu trữ ecord_data từ { checklist: { [itemId]: data } } sang { checklist_by_equipment: { [equipmentId]: { [itemId]: data } } }.

### 2. Giao diện Tạo/Sửa Biểu mẫu (src/pages/MeasurementForms.tsx)
- Thêm phần cấu hình cột cho "Kiểm tra chung" (Cho phép đổi tên cột chính, thêm/xóa cột phụ).
- Sửa đổi bảng nhập nội dung kiểm tra để hiển thị các cột động thay vì cố định "Miêu tả" và "Tiêu chuẩn".

### 3. Giao diện Điền Biên bản (src/components/devices/MeasurementSessionModal.tsx)
- Sửa lại bảng "Nội dung kiểm tra chung":
  - Dòng (Rows): Là các mục kiểm tra.
  - Cột (Columns): Thông tin mục kiểm tra + Mỗi máy móc là 1 cột.
  - Trong ô của mỗi máy móc: Có ô chọn Đạt/Không đạt/Không áp dụng (dạng Dropdown cho gọn) và ô nhập Ghi chú.
- Cập nhật hàm lưu dữ liệu để tương thích với cấu trúc checklist_by_equipment.
- Thêm logic hỗ trợ tương thích ngược (hiển thị 1 cột "Tất cả thiết bị") nếu đang xem các biên bản cũ.

### 4. Giao diện Xem Biên bản (src/components/devices/MeasurementRecordModal.tsx)
- Cập nhật bảng kiểm tra chung để đọc dữ liệu từ checklist_by_equipment với cột cho từng thiết bị.

### 5. Xuất File Word (src/utils/exportWord.ts)
- Sửa đổi logic vẽ Bảng 1 trong file Word: 
  - Tạo cột động theo checklist_metadata.
  - Tạo cột cho mỗi máy móc (với kết quả Đạt/K.Đạt + Ghi chú ở mỗi ô).
  - Điều chỉnh độ rộng cột linh hoạt để vừa với khổ giấy A4 (nếu chọn nhiều máy, chữ có thể nhỏ lại).

## Câu hỏi cần làm rõ (User Review Required)
- Vì số lượng máy móc có thể được chọn là rất nhiều (ví dụ 5-10 máy cùng lúc), việc hiển thị mỗi máy 1 cột ở Bảng 1 có thể khiến bảng rất dài ngang, đặc biệt khi xuất ra file Word khổ dọc (Portrait). Trong thiết kế này, tôi sẽ định dạng các ô Đạt/Không đạt rút gọn lại và nếu quá nhiều máy, khi xuất Word có thể bảng sẽ tràn viền. Bạn có muốn đổi khổ giấy xuất Word sang ngang (Landscape) nếu có nhiều thiết bị không? (Hiện tại sẽ vẫn xuất dọc và tự động chia tỷ lệ).

Xin vui lòng xác nhận kế hoạch để tôi tiến hành thực hiện.
