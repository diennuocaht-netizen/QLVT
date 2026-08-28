export enum Page {
  Dashboard = 'Dashboard',
  Items = 'Vật tư',
  Receipts = 'Phiếu Nhập',
  Issues = 'Phiếu Xuất',
  Requisitions = 'Tờ trình',
  Audits = 'Kiểm kê',
  Users = 'Người dùng',
  Settings = 'Cài đặt',
  Log = 'Nhật ký',
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string; // Loại vật tư (Điện, Cơ, ...)
  classification: string; // Phân loại (CCDC, Vật tư)
  quantity: number; // Tồn kho hiện tại
  initialStock: number; // Tồn đầu kỳ
  unitPrice: number; // Đơn giá
  warningThresholdLower: number; // Giới hạn cảnh báo dưới
  warningThresholdUpper: number; // Giới hạn cảnh báo trên
  priceUpdateDate?: string; // Ngày update giá
  notes?: string; // Ghi chú
  locationId?: string; // UUID của vị trí
}

export interface InventoryLocation {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface InventoryAudit {
  id: string;
  code: string;
  date: string;
  createdBy: string;
  status: 'Đang kiểm' | 'Hoàn thành';
  notes?: string;
  items?: InventoryAuditItem[];
}

export interface InventoryAuditItem {
  id?: string;
  auditId?: string;
  itemId: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  notes?: string;
}

export interface CalculatedInventoryItem {
  item: Item;
  stock: number;
  totalReceipts: number;
  totalIssues: number;
}

export interface InventoryItem {
  item: Item;
  stock: number;
}

export type Category = string;
export type Subsystem = string;

export interface InventorySlipItem {
  itemId: string;
  quantity: number;
  
  // For Receipts from Requisitions
  requisitionItemId?: string; 
  requisitionId?: string;

  // For Issues
  subsystem?: string;
  purpose?: string;
  method?: string;
  costCode?: string;
  handler?: string; // Người xuất/giao
  notes?: string;   // Ghi chú
  isCompleted?: boolean; // Vật tư đã hoàn thành (cũ)
  completedQuantity?: number; // Số lượng đã hoàn thành (mới)
}

export enum SlipType {
  Receipt = 'Receipt', // Phiếu Nhập
  Issue = 'Issue', // Phiếu Xuất
}

export type SlipStatus = 'Đang mở' | 'Đã đóng' | 'Đã hoàn thành' | 'Đã khóa';
export type ReceiptType = 'Theo tờ trình' | 'Nhận ngoài';

export interface InventorySlip {
  id: string;
  code: string;
  type: SlipType;
  date: string;
  createdBy: string;
  reason?: string; // Lý do nhập hoặc nơi nhận
  items: InventorySlipItem[];
  status?: SlipStatus;
  
  // Receipt specific
  receiptType?: ReceiptType;
  requisitionIds?: string[]; // ID of the linked requisitions
  handoverRecordUrl?: string;

  // Issue specific
  weekOfYear?: string; // e.g., "2024-W42"
  completionReportUrl?: string;
}

export enum RequisitionStatus {
  New = 'Mới tạo',
  Approved = 'Đã duyệt',
  Rejected = 'Từ chối',
  PartiallyFulfilled = 'Đã nhập 1 phần',
  Fulfilled = 'Đã nhập đủ',
  Closed = 'Đã đóng',
}

export enum RequisitionType {
  Normal = 'Thường',
  Urgent = 'Khẩn cấp',
  Project = 'Dự án',
}

export interface CostCode {
  id: string;
  classification: string; // Phân loại (e.g., item category)
  subsystem: string;      // Phân hệ
  purpose: string;        // Mục đích
  method: string;         // Cách thực hiện
  code: string;           // Mã chi phí
}

export enum RequisitionItemStatus {
  Pending = 'Chưa nhận đủ',
  Completed = 'Đã nhận đủ',
}

export interface RequisitionItem {
  id: string;
  itemId: string;
  requestedQuantity: number;
  receivedQuantity: number;
  itemStatus: RequisitionItemStatus;
  subsystem: string;
  method: string;
  purpose: string;
  costCode: string; // This will be auto-filled
  notes: string;
}

export interface Requisition {
  id: string;
  code: string;
  createdBy: string;
  date: string;
  type: RequisitionType;
  purpose: string;
  status: RequisitionStatus;
  notes: string;
  items: RequisitionItem[];
}

export interface DriveSettings {
  id: string;
  document_type: string; // 'Nhận vật tư', 'BB hoàn thành vật tư', 'Phiếu xuất vật tư', 'Tờ trình mua sắm'
  folder_id: string;
  folder_name?: string;
  description?: string;
  updated_by?: string;
  updated_at?: string;
}

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Quản lý Vật tư',
  Staff = 'Nhân viên',
}

export type UserStatus = 'Hoạt động' | 'Đóng băng';

// A list of all possible permissions in the system.
export type Permission =
  | 'manage_users'
  | 'manage_items'
  | 'manage_receipts'
  | 'manage_issues'
  | 'manage_requisitions'
  | 'approve_requisitions'
  | 'manage_settings'
  | 'view_dashboard'
  | 'view_logs';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  title: string; // Chức danh
  phone: string;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
}
