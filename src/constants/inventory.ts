import { Item, Category, InventorySlip, SlipType, Requisition, RequisitionStatus, RequisitionType, CostCode, Subsystem, RequisitionItemStatus, User, UserRole, UserStatus, Permission } from '../types/inventory';

export const INITIAL_CATEGORIES: Category[] = [
  'Vật liệu thô',
  'Sắt thép',
  'Vật liệu xây',
  'Sơn',
  'Điện nước',
];

export const INITIAL_SUBSYSTEMS: Subsystem[] = [
    'Xây dựng cơ bản',
    'Hoàn thiện',
    'Kết cấu',
    'Cơ điện (M&E)',
];

export const INITIAL_ITEMS: Item[] = [
  { id: 'item-1', code: 'VT-001', name: 'Xi măng Hà Tiên', unit: 'bao', category: 'Vật liệu thô', initialStock: 50, unitPrice: 85000, warningThresholdLower: 20, warningThresholdUpper: 150 },
  { id: 'item-2', code: 'VT-002', name: 'Cát xây tô', unit: 'm³', category: 'Vật liệu thô', initialStock: 20, unitPrice: 250000, warningThresholdLower: 10, warningThresholdUpper: 50 },
  { id: 'item-3', code: 'VT-003', name: 'Thép cây D10 Hòa Phát', unit: 'cây', category: 'Sắt thép', initialStock: 150, unitPrice: 150000, warningThresholdLower: 50, warningThresholdUpper: 300 },
  { id: 'item-4', code: 'VT-004', name: 'Gạch ống 4 lỗ', unit: 'viên', category: 'Vật liệu xây', initialStock: 10000, unitPrice: 1200, warningThresholdLower: 2000, warningThresholdUpper: 20000 },
  { id: 'item-5', code: 'VT-005', name: 'Sơn nước trắng Dulux', unit: 'thùng', category: 'Sơn', initialStock: 10, unitPrice: 1800000, warningThresholdLower: 5, warningThresholdUpper: 30 },
  { id: 'item-6', code: 'VT-006', name: 'Ống nước PVC D21 Bình Minh', unit: 'm', category: 'Điện nước', initialStock: 100, unitPrice: 8000, warningThresholdLower: 50, warningThresholdUpper: 500 },
  { id: 'item-7', code: 'VT-007', name: 'Dây điện Cadivi 2.5', unit: 'cuộn', category: 'Điện nước', initialStock: 20, unitPrice: 450000, warningThresholdLower: 10, warningThresholdUpper: 50 },
];

export const INITIAL_INVENTORY_SLIPS: InventorySlip[] = [
  // Phiếu Nhập
  {
    id: 'slip-1',
    code: 'PNK-001',
    type: SlipType.Receipt,
    date: '2023-10-01',
    createdBy: 'Nguyễn Văn A',
    reason: 'Nhập hàng từ NCC A',
    items: [
      { itemId: 'item-1', quantity: 100 },
      { itemId: 'item-3', quantity: 200 },
    ],
    status: 'Đã đóng',
    receiptType: 'Nhận ngoài',
  },
   {
    id: 'slip-2',
    code: 'PNK-002',
    type: SlipType.Receipt,
    date: '2023-10-05',
    createdBy: 'Nguyễn Văn A',
    reason: 'Nhập hàng từ NCC B',
    items: [
      { itemId: 'item-2', quantity: 50 },
      { itemId: 'item-4', quantity: 5000 },
      { itemId: 'item-7', quantity: 30 },
    ],
    status: 'Đã đóng',
    receiptType: 'Nhận ngoài',
  },
  {
    id: 'slip-5',
    code: 'PNK-003',
    type: SlipType.Receipt,
    date: '2023-10-25',
    createdBy: 'Nguyễn Văn A',
    reason: 'Nhận hàng theo tờ trình TT-001',
    items: [
      { itemId: 'item-1', quantity: 20, requisitionItemId: 'req-item-1' },
    ],
    status: 'Đang mở',
    receiptType: 'Theo tờ trình',
    requisitionIds: ['req-1'],
  },
  // Phiếu Xuất
  {
    id: 'slip-3',
    code: 'PXK-001',
    type: SlipType.Issue,
    date: '2023-10-10',
    createdBy: 'Trần Thị B',
    reason: 'Xuất cho công trình X, Tuần 41',
    weekOfYear: '2023-W41',
    status: 'Đã hoàn thành',
    completionReportUrl: 'bien_ban_hoan_thanh_t41.pdf',
    items: [
      { itemId: 'item-1', quantity: 20, subsystem: 'Xây dựng cơ bản', purpose: 'Dự án A', method: 'Mua mới', costCode: 'A-XDCB-VT-01', handler: 'Tổ đội 1', notes: 'Dùng cho móng M1' },
      { itemId: 'item-3', quantity: 50, subsystem: 'Kết cấu', purpose: 'Dự án B', method: 'Mua mới', costCode: 'B-KC-ST-01', handler: 'Tổ đội 2', notes: 'Thép cột C2, C3' },
      { itemId: 'item-4', quantity: 1000, subsystem: 'Xây dựng cơ bản', purpose: 'Dự án A', method: 'Mua mới', costCode: 'A-XDCB-VT-01', handler: 'Tổ đội 1', notes: '' },
    ],
  },
  {
    id: 'slip-4',
    code: 'PXK-002',
    type: SlipType.Issue,
    date: '2023-10-17',
    createdBy: 'Trần Thị B',
    reason: 'Xuất cho công trình Y, Tuần 42',
    status: 'Đã đóng',
    items: [
      { itemId: 'item-7', quantity: 10, subsystem: 'Cơ điện (M&E)', purpose: 'Bảo trì', method: 'Sửa chữa', costCode: 'BT-ME-DN-02', handler: 'Đội M&E', notes: 'Thay thế dây cũ' },
      { itemId: 'item-1', quantity: 30, subsystem: 'Xây dựng cơ bản', purpose: 'Dự án A', method: 'Mua mới', costCode: 'A-XDCB-VT-01', handler: 'Tổ đội 3', notes: '' },
    ],
  },
];

export const INITIAL_REQUISITION_TYPES: RequisitionType[] = [
  RequisitionType.Normal,
  RequisitionType.Urgent,
  RequisitionType.Project,
];

export const INITIAL_COST_CODES: CostCode[] = [
    { id: 'cc-1', classification: 'Vật liệu thô', subsystem: 'Xây dựng cơ bản', purpose: 'Dự án A', method: 'Mua mới', code: 'A-XDCB-VT-01' },
    { id: 'cc-2', classification: 'Điện nước', subsystem: 'Cơ điện (M&E)', purpose: 'Bảo trì', method: 'Sửa chữa', code: 'BT-ME-DN-02' },
    { id: 'cc-3', classification: 'Sắt thép', subsystem: 'Kết cấu', purpose: 'Dự án B', method: 'Mua mới', code: 'B-KC-ST-01' },
    { id: 'cc-4', classification: 'Sơn', subsystem: 'Hoàn thiện', purpose: 'Dự án A', method: 'Mua mới', code: 'A-HT-S-03' },
];


export const INITIAL_REQUISITIONS: Requisition[] = [
    {
        id: 'req-1',
        code: 'TT-001',
        createdBy: 'Lê Văn C',
        date: '2023-10-20',
        type: RequisitionType.Normal,
        purpose: 'Mua vật tư cho dự án Quý 4',
        status: RequisitionStatus.Approved,
        notes: 'Đã được trưởng phòng duyệt',
        items: [
            { id: 'req-item-1', itemId: 'item-1', requestedQuantity: 50, receivedQuantity: 20, itemStatus: RequisitionItemStatus.Pending, subsystem: 'Xây dựng cơ bản', purpose: 'Dự án A', method: 'Mua mới', costCode: 'A-XDCB-VT-01', notes: 'Xi măng cho móng' },
            { id: 'req-item-2', itemId: 'item-3', requestedQuantity: 100, receivedQuantity: 100, itemStatus: RequisitionItemStatus.Completed, subsystem: 'Kết cấu', purpose: 'Dự án B', method: 'Mua mới', costCode: 'B-KC-ST-01', notes: 'Thép cho cột' },
        ]
    },
    {
        id: 'req-2',
        code: 'TT-002',
        createdBy: 'Phạm Thị D',
        date: '2023-10-22',
        type: RequisitionType.Urgent,
        purpose: 'Bổ sung vật tư hao hụt cho công trình Z',
        status: RequisitionStatus.New,
        notes: 'Cần gấp trong tuần',
        items: [
            { id: 'req-item-3', itemId: 'item-7', requestedQuantity: 5, receivedQuantity: 0, itemStatus: RequisitionItemStatus.Pending, subsystem: 'Cơ điện (M&E)', purpose: 'Bảo trì', method: 'Sửa chữa', costCode: 'BT-ME-DN-02', notes: '' },
        ]
    },
     {
        id: 'req-3',
        code: 'TT-003',
        createdBy: 'Lê Văn C',
        date: '2023-10-28',
        type: RequisitionType.Normal,
        purpose: 'Mua vật tư cho dự án A',
        status: RequisitionStatus.Approved,
        notes: 'Duyệt mua thêm gạch và sơn',
        items: [
            { id: 'req-item-4', itemId: 'item-4', requestedQuantity: 2000, receivedQuantity: 0, itemStatus: RequisitionItemStatus.Pending, subsystem: 'Xây dựng cơ bản', purpose: 'Dự án A', method: 'Mua mới', costCode: 'A-XDCB-VT-01', notes: 'Gạch xây tường' },
            { id: 'req-item-5', itemId: 'item-5', requestedQuantity: 5, receivedQuantity: 0, itemStatus: RequisitionItemStatus.Pending, subsystem: 'Hoàn thiện', purpose: 'Dự án A', method: 'Mua mới', costCode: 'A-HT-S-03', notes: 'Sơn hoàn thiện' },
        ]
    },
];

export const AVAILABLE_PERMISSIONS: { id: Permission; description: string }[] = [
  { id: 'manage_users', description: 'Quản lý người dùng và phân quyền' },
  { id: 'manage_items', description: 'Quản lý (thêm/sửa/xóa) vật tư' },
  { id: 'manage_receipts', description: 'Quản lý phiếu nhập kho' },
  { id: 'manage_issues', description: 'Quản lý phiếu xuất kho' },
  { id: 'manage_requisitions', description: 'Quản lý tờ trình' },
  { id: 'approve_requisitions', description: 'Duyệt hoặc từ chối tờ trình' },
  { id: 'manage_settings', description: 'Chỉnh sửa cài đặt hệ thống' },
  { id: 'view_dashboard', description: 'Xem trang Dashboard' },
  { id: 'view_logs', description: 'Xem nhật ký hoạt động' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'password123',
    fullName: 'Trần Văn Quản Trị',
    title: 'Trưởng phòng',
    phone: '0901234567',
    role: UserRole.Admin,
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id), // Admin has all permissions
    status: 'Hoạt động',
  },
  {
    id: 'user-2',
    username: 'thukho',
    password: 'password123',
    fullName: 'Nguyễn Thị Thủ Kho',
    title: 'Thủ kho',
    phone: '0987654321',
    role: UserRole.Manager,
    permissions: ['manage_items', 'manage_receipts', 'manage_issues', 'view_dashboard'],
    status: 'Hoạt động',
  },
  {
    id: 'user-3',
    username: 'nhanvien',
    password: 'password123',
    fullName: 'Lê Văn Nhân Viên',
    title: 'Nhân viên',
    phone: '0912345678',
    role: UserRole.Staff,
    permissions: ['view_dashboard'],
    status: 'Đóng băng',
  }
];
