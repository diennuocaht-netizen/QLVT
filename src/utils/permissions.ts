import type { UserProfile, Role } from '../contexts/AuthContext';

export const OWNER_EMAIL = 'hoang.toan2409@gmail.com';

export type ModuleKey =
  // 1. Kho & Vật tư
  | 'inventory_items'
  | 'inventory_receipts'
  | 'inventory_issues'
  | 'inventory_requisitions'
  | 'inventory_audits'
  | 'inventory_reconciliations'
  | 'inventory_settings'
  // 2. Nhân sự & Ca trực
  | 'hr_tasks'
  | 'hr_task_log'
  | 'shift_schedule'
  | 'events'
  // 3. Thiết bị & Đo đạc
  | 'devices'
  | 'measured_equipments'
  | 'measurement_records'
  | 'measurement_forms'
  // 4. Dự án & Tài liệu
  | 'projects'
  | 'documents'
  // 5. Hệ thống
  | 'admin_users';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'unlock' | 'export';

export type ModulePermissions = Partial<Record<PermissionAction, boolean>>;

export type UserPermissions = Partial<Record<ModuleKey, ModulePermissions>>;

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  group: 'inventory' | 'hr' | 'equipment' | 'project_docs' | 'system';
  path?: string;
  actions: PermissionAction[];
}

export const MODULE_GROUPS: { key: string; label: string; icon: string }[] = [
  { key: 'inventory', label: 'Kho & Vật tư', icon: 'Box' },
  { key: 'hr', label: 'Nhân sự & Ca trực', icon: 'Users' },
  { key: 'equipment', label: 'Thiết bị & Đo đạc', icon: 'Activity' },
  { key: 'project_docs', label: 'Dự án & Tài liệu', icon: 'Folder' },
  { key: 'system', label: 'Quản trị hệ thống', icon: 'ShieldAlert' },
];

export const MODULES: ModuleDefinition[] = [
  // Kho & Vật tư
  {
    key: 'inventory_items',
    label: 'Danh mục Vật tư',
    description: 'Xem, tạo, chỉnh sửa, xóa mã vật tư, định mức tồn kho',
    group: 'inventory',
    path: '/inventory/items',
    actions: ['view', 'create', 'edit', 'delete', 'export'],
  },
  {
    key: 'inventory_receipts',
    label: 'Phiếu Nhập kho',
    description: 'Lập phiếu nhập, duyệt, sửa, xóa, mở khóa phiếu đã hoàn thành',
    group: 'inventory',
    path: '/inventory/receipts',
    actions: ['view', 'create', 'edit', 'delete', 'unlock'],
  },
  {
    key: 'inventory_issues',
    label: 'Phiếu Xuất kho',
    description: 'Lập phiếu xuất, sửa, xóa, mở khóa phiếu đã hoàn thành',
    group: 'inventory',
    path: '/inventory/issues',
    actions: ['view', 'create', 'edit', 'delete', 'unlock'],
  },
  {
    key: 'inventory_requisitions',
    label: 'Tờ trình mua sắm',
    description: 'Lập tờ trình, điều chỉnh, xóa, phê duyệt tờ trình',
    group: 'inventory',
    path: '/inventory/requisitions',
    actions: ['view', 'create', 'edit', 'delete', 'approve'],
  },
  {
    key: 'inventory_audits',
    label: 'Kiểm kê kho',
    description: 'Tạo đợt kiểm kê, cập nhật số liệu thực tế, chốt đợt kiểm kê',
    group: 'inventory',
    path: '/inventory/audits',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'inventory_reconciliations',
    label: 'Đối soát Bravo',
    description: 'Import file kiểm kê từ Bravo, đối chiếu tồn kho và xử lý chênh lệch',
    group: 'inventory',
    path: '/inventory/reconciliations',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'inventory_settings',
    label: 'Cài đặt Vật tư',
    description: 'Cấu hình nhóm vật tư, kho lưu trữ, phân hệ, mã chi phí',
    group: 'inventory',
    path: '/inventory/settings',
    actions: ['view', 'create', 'edit', 'delete'],
  },

  // Nhân sự & Ca trực
  {
    key: 'hr_tasks',
    label: 'Công việc & Giao ca',
    description: 'Giao việc, nhận việc, chuyển ca, sửa tiến độ, xóa công việc',
    group: 'hr',
    path: '/hr-tasks',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'hr_task_log',
    label: 'Nhật ký công việc',
    description: 'Xem lịch sử công việc qua các ca, sửa ghi chú, xóa bản ghi, xuất Excel',
    group: 'hr',
    path: '/hr-task-log',
    actions: ['view', 'edit', 'delete', 'export'],
  },
  {
    key: 'shift_schedule',
    label: 'Phân ca làm việc',
    description: 'Xếp lịch ca, đổi ca, sửa phân công nhân sự',
    group: 'hr',
    path: '/shift-schedule',
    actions: ['view', 'create', 'edit', 'delete', 'export'],
  },
  {
    key: 'events',
    label: 'Quản lý Sự kiện',
    description: 'Tạo sự kiện, sửa, xóa sự kiện nội bộ',
    group: 'hr',
    path: '/events',
    actions: ['view', 'create', 'edit', 'delete'],
  },

  // Thiết bị & Đo đạc
  {
    key: 'devices',
    label: 'Quản lý Tủ điện',
    description: 'Quản lý danh sách tủ điện, thông số kỹ thuật, lịch sử bảo trì',
    group: 'equipment',
    path: '/devices',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'measured_equipments',
    label: 'Quản lý Máy móc',
    description: 'Quản lý danh mục máy móc, thiết bị đo đạc',
    group: 'equipment',
    path: '/measured-equipments',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'measurement_records',
    label: 'Phiếu đo đạc',
    description: 'Nhập kết quả đo đạc thông số, duyệt, sửa, xóa phiếu đo',
    group: 'equipment',
    path: '/measurements/records',
    actions: ['view', 'create', 'edit', 'delete', 'approve'],
  },
  {
    key: 'measurement_forms',
    label: 'Biểu mẫu đo đạc',
    description: 'Thiết kế biểu mẫu đo, thêm bớt trường thông số kỹ thuật',
    group: 'equipment',
    path: '/measurements/forms',
    actions: ['view', 'create', 'edit', 'delete'],
  },

  // Dự án & Tài liệu
  {
    key: 'projects',
    label: 'Quản lý Dự án',
    description: 'Tạo dự án mới, cập nhật tiến độ, sửa, xóa dự án',
    group: 'project_docs',
    path: '/projects',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'documents',
    label: 'Tài liệu ISO',
    description: 'Tải lên tài liệu, duyệt, chỉnh sửa metadata, xóa tài liệu',
    group: 'project_docs',
    path: '/documents',
    actions: ['view', 'create', 'edit', 'delete', 'approve'],
  },

  // Hệ thống
  {
    key: 'admin_users',
    label: 'Quản trị Người dùng & Phân quyền',
    description: 'Thêm tài khoản, đổi vai trò, phân quyền chi tiết, đặt lại mật khẩu, xóa tài khoản',
    group: 'system',
    path: '/admin',
    actions: ['view', 'create', 'edit', 'delete'],
  },
];

/**
 * Kiểm tra xem người dùng có phải là Chủ sở hữu (Owner/Super Admin) hay không
 */
export function isOwner(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.is_owner === true) return true;
  if (profile.email && profile.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return true;
  return false;
}

/**
 * Kiểm tra xem người dùng có thể chỉnh sửa/xóa tài khoản targetUser hay không
 * Quy tắc an toàn tối cao:
 * 1. Không ai có thể xóa hoặc hạ quyền Owner
 * 2. Chỉ có Owner mới có quyền sửa/xóa các Admin khác
 * 3. Admin thông thường không thể xóa Admin khác
 */
export function canManageTargetUser(
  currentUser: UserProfile | null,
  targetUser: UserProfile
): { canEdit: boolean; canDelete: boolean; reason?: string } {
  if (!currentUser) return { canEdit: false, canDelete: false, reason: 'Chưa đăng nhập' };

  const isCurrentOwner = isOwner(currentUser);
  const isTargetOwner = isOwner(targetUser);

  // Không ai có thể can thiệp Owner
  if (isTargetOwner) {
    if (isCurrentOwner && currentUser.id === targetUser.id) {
      // Owner tự sửa tên mình thì được, nhưng không được tự xóa/hạ quyền
      return { canEdit: true, canDelete: false, reason: 'Tài khoản Chủ sở hữu được bảo vệ tuyệt đối' };
    }
    return { canEdit: false, canDelete: false, reason: 'Không thể can thiệp vào tài khoản Chủ sở hữu' };
  }

  // Owner có toàn quyền quản lý bất kỳ ai khác
  if (isCurrentOwner) {
    return { canEdit: true, canDelete: true };
  }

  // Nếu là admin thường:
  if (currentUser.role === 'admin') {
    // Không được sửa/xóa admin khác
    if (targetUser.role === 'admin') {
      return { canEdit: false, canDelete: false, reason: 'Chỉ Chủ sở hữu mới có quyền quản lý tài khoản Admin' };
    }
    return { canEdit: true, canDelete: true };
  }

  return { canEdit: false, canDelete: false, reason: 'Không có quyền quản trị người dùng' };
}

/**
 * Trả về quyền mặc định theo Role (để fallback tương thích ngược)
 */
function getRoleFallback(role: Role, module: ModuleKey, action: PermissionAction): boolean {
  if (role === 'admin') {
    // Admin mặc định full quyền mọi thứ
    return true;
  }

  if (role === 'manager') {
    // Manager không được vào trang Quản trị người dùng
    if (module === 'admin_users') return false;

    // Manager có quyền xem, tạo, sửa, duyệt, mở khóa, xuất
    if (action === 'delete') {
      // Trong code cũ, delete hầu hết chỉ dành cho admin
      return false;
    }
    return true;
  }

  // Viewer:
  if (action === 'view') {
    // Viewer không được vào cài đặt, admin, kiểm kê, đối soát, tạo biểu mẫu
    if (
      module === 'admin_users' ||
      module === 'inventory_settings' ||
      module === 'inventory_audits' ||
      module === 'inventory_reconciliations' ||
      module === 'measurement_forms'
    ) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Hàm kiểm tra quyền trung tâm của toàn bộ ứng dụng
 * @param profile Thông tin người dùng hiện tại
 * @param module Mã phân hệ
 * @param action Hành động cần kiểm tra (view, create, edit, delete, ...)
 */
export function hasPermission(
  profile: UserProfile | null | undefined,
  module: ModuleKey,
  action: PermissionAction
): boolean {
  if (!profile) return false;

  // 1. Owner luôn luôn có 100% quyền
  if (isOwner(profile)) return true;

  // 2. Kiểm tra nếu user có ma trận quyền tùy chỉnh
  if (profile.permissions && profile.permissions[module]) {
    const modulePerms = profile.permissions[module];
    if (modulePerms && typeof modulePerms[action] === 'boolean') {
      return modulePerms[action] === true;
    }
  }

  // 3. Fallback về Role chuẩn nếu chưa cấu hình ma trận quyền riêng cho module này
  return getRoleFallback(profile.role, module, action);
}

/**
 * Kiểm tra quyền truy cập vào một đường dẫn URL (dùng cho Navigation & Route Guard)
 */
export function canAccessPath(profile: UserProfile | null | undefined, path: string): boolean {
  if (!profile) return false;
  if (isOwner(profile)) return true;

  // Tìm module tương ứng với path
  const matchedModule = MODULES.find((m) => m.path === path);
  if (matchedModule) {
    return hasPermission(profile, matchedModule.key, 'view');
  }

  // Các trang dashboard chung
  if (path === '/' || path === '/inventory') return true;

  return true;
}

/**
 * Mẫu quyền tạo sẵn (Preset Templates)
 */
export const PERMISSION_PRESETS: Record<string, { label: string; description: string; permissions: UserPermissions }> = {
  admin: {
    label: 'Quản trị viên (Admin)',
    description: 'Toàn quyền thao tác trên tất cả các phân hệ của hệ thống',
    permissions: MODULES.reduce((acc, m) => {
      acc[m.key] = m.actions.reduce((actAcc, a) => ({ ...actAcc, [a]: true }), {});
      return acc;
    }, {} as UserPermissions),
  },
  manager: {
    label: 'Quản lý (Manager)',
    description: 'Xem, tạo, sửa, phê duyệt và mở khóa trên các phân hệ nghiệp vụ; hạn chế xóa',
    permissions: MODULES.reduce((acc, m) => {
      if (m.key === 'admin_users') {
        acc[m.key] = { view: false, create: false, edit: false, delete: false };
      } else {
        acc[m.key] = m.actions.reduce((actAcc, a) => {
          actAcc[a] = a !== 'delete';
          return actAcc;
        }, {} as ModulePermissions);
      }
      return acc;
    }, {} as UserPermissions),
  },
  warehouse_keeper: {
    label: 'Thủ kho (Warehouse Keeper)',
    description: 'Toàn quyền Thêm/Sửa/Xóa phân hệ Kho & Vật tư; chỉ xem các phân hệ khác',
    permissions: MODULES.reduce((acc, m) => {
      if (m.group === 'inventory') {
        acc[m.key] = m.actions.reduce((actAcc, a) => ({ ...actAcc, [a]: true }), {});
      } else if (m.key === 'admin_users') {
        acc[m.key] = { view: false, create: false, edit: false, delete: false };
      } else {
        acc[m.key] = { view: true, create: false, edit: false, delete: false };
      }
      return acc;
    }, {} as UserPermissions),
  },
  technician: {
    label: 'Kỹ thuật viên (Technician)',
    description: 'Toàn quyền trên Tủ điện, Máy móc, Đo đạc; xem vật tư & công việc',
    permissions: MODULES.reduce((acc, m) => {
      if (m.group === 'equipment') {
        acc[m.key] = m.actions.reduce((actAcc, a) => ({ ...actAcc, [a]: true }), {});
      } else if (m.key === 'admin_users' || m.key === 'inventory_settings') {
        acc[m.key] = { view: false, create: false, edit: false, delete: false };
      } else {
        acc[m.key] = { view: true, create: false, edit: false, delete: false };
      }
      return acc;
    }, {} as UserPermissions),
  },
  shift_leader: {
    label: 'Trưởng ca (Shift Leader)',
    description: 'Toàn quyền Giao việc, Giao ca, Lịch ca, Nhật ký; xem thiết bị & kho',
    permissions: MODULES.reduce((acc, m) => {
      if (m.group === 'hr') {
        acc[m.key] = m.actions.reduce((actAcc, a) => ({ ...actAcc, [a]: true }), {});
      } else if (m.key === 'admin_users' || m.key === 'inventory_settings') {
        acc[m.key] = { view: false, create: false, edit: false, delete: false };
      } else {
        acc[m.key] = { view: true, create: false, edit: false, delete: false };
      }
      return acc;
    }, {} as UserPermissions),
  },
  viewer: {
    label: 'Nhân viên / Xem (Viewer)',
    description: 'Chỉ xem dữ liệu cơ bản, không được sửa hoặc xóa',
    permissions: MODULES.reduce((acc, m) => {
      if (
        m.key === 'admin_users' ||
        m.key === 'inventory_settings' ||
        m.key === 'inventory_audits' ||
        m.key === 'inventory_reconciliations' ||
        m.key === 'measurement_forms'
      ) {
        acc[m.key] = { view: false, create: false, edit: false, delete: false };
      } else {
        acc[m.key] = { view: true, create: false, edit: false, delete: false };
      }
      return acc;
    }, {} as UserPermissions),
  },
};

/**
 * Ánh xạ Role cơ bản tương ứng với từng Mẫu quyền (Preset)
 */
export const PRESET_DEFAULT_ROLES: Record<string, Role> = {
  admin: 'admin',
  manager: 'manager',
  warehouse_keeper: 'manager',
  technician: 'viewer',
  shift_leader: 'manager',
  viewer: 'viewer',
};
