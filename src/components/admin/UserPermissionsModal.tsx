import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  Copy,
  Check,
  RotateCcw,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  MODULES,
  MODULE_GROUPS,
  PERMISSION_PRESETS,
  PRESET_DEFAULT_ROLES,
  isOwner,
  type ModuleKey,
  type PermissionAction,
  type UserPermissions,
} from '../../utils/permissions';
import type { UserProfile } from '../../contexts/AuthContext';
import { supabase } from '../../supabase-client';

interface UserPermissionsModalProps {
  user?: UserProfile | null;
  users?: UserProfile[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Xem',
  create: 'Tạo',
  edit: 'Sửa',
  delete: 'Xóa',
  approve: 'Duyệt',
  unlock: 'Mở khóa',
  export: 'Xuất DL',
};

const ACTION_COLORS: Record<PermissionAction, string> = {
  view: 'text-blue-700 bg-blue-50 border-blue-200',
  create: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  edit: 'text-amber-700 bg-amber-50 border-amber-200',
  delete: 'text-red-700 bg-red-50 border-red-200',
  approve: 'text-purple-700 bg-purple-50 border-purple-200',
  unlock: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  export: 'text-cyan-700 bg-cyan-50 border-cyan-200',
};

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  user,
  users,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Resolve target users (filter out any Owner from bulk selection for safety)
  const targetUsers: UserProfile[] =
    users && users.length > 0
      ? users.filter((u) => !isOwner(u))
      : user
      ? [user]
      : [];

  const isBulk = targetUsers.length > 1;
  const singleUser = targetUsers.length === 1 ? targetUsers[0] : null;
  const isTargetOwner = !isBulk && singleUser ? isOwner(singleUser) : false;

  // Initialize permissions state
  const [permissions, setPermissions] = useState<UserPermissions>(() => {
    if (singleUser?.permissions && Object.keys(singleUser.permissions).length > 0) {
      return JSON.parse(JSON.stringify(singleUser.permissions));
    }
    const preset = singleUser
      ? PERMISSION_PRESETS[singleUser.role] || PERMISSION_PRESETS.viewer
      : PERMISSION_PRESETS.viewer;
    return JSON.parse(JSON.stringify(preset.permissions));
  });

  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sqlFixNeeded, setSqlFixNeeded] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [syncRole, setSyncRole] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);

  // Sync state when target changes
  useEffect(() => {
    if (singleUser?.permissions && Object.keys(singleUser.permissions).length > 0) {
      setPermissions(JSON.parse(JSON.stringify(singleUser.permissions)));
    } else {
      const preset = singleUser
        ? PERMISSION_PRESETS[singleUser.role] || PERMISSION_PRESETS.viewer
        : PERMISSION_PRESETS.viewer;
      setPermissions(JSON.parse(JSON.stringify(preset.permissions)));
    }
    setSelectedPresetKey(null);
    setSyncRole(false);
  }, [user, users]);

  if (!isOpen || targetUsers.length === 0) return null;

  const handleToggle = (moduleKey: ModuleKey, action: PermissionAction) => {
    if (isTargetOwner) return;
    setPermissions((prev) => {
      const modulePerms = { ...(prev[moduleKey] || {}) };
      modulePerms[action] = !modulePerms[action];
      return {
        ...prev,
        [moduleKey]: modulePerms,
      };
    });
  };

  const handleSelectAllModule = (moduleKey: ModuleKey, value: boolean) => {
    if (isTargetOwner) return;
    const mod = MODULES.find((m) => m.key === moduleKey);
    if (!mod) return;

    setPermissions((prev) => {
      const updated = { ...(prev[moduleKey] || {}) };
      mod.actions.forEach((a) => {
        updated[a] = value;
      });
      return {
        ...prev,
        [moduleKey]: updated,
      };
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    if (isTargetOwner) return;
    const preset = PERMISSION_PRESETS[presetKey];
    if (preset) {
      setPermissions(JSON.parse(JSON.stringify(preset.permissions)));
      setSelectedPresetKey(presetKey);
    }
  };

  const handleResetToRoleDefault = () => {
    if (isTargetOwner) return;
    const preset = singleUser
      ? PERMISSION_PRESETS[singleUser.role] || PERMISSION_PRESETS.viewer
      : PERMISSION_PRESETS.viewer;
    setPermissions(JSON.parse(JSON.stringify(preset.permissions)));
    setSelectedPresetKey(null);
    setSyncRole(false);
  };

  const handleSave = async () => {
    if (targetUsers.length === 0) return;
    if (isTargetOwner) {
      alert('Tài khoản Chủ sở hữu luôn luôn có toàn quyền và không thể bị giới hạn.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSqlFixNeeded(false);

    try {
      const targetIds = targetUsers.map((u) => u.id);
      const updatePayload: any = { permissions };

      if (syncRole && selectedPresetKey && PRESET_DEFAULT_ROLES[selectedPresetKey]) {
        updatePayload.role = PRESET_DEFAULT_ROLES[selectedPresetKey];
      }

      const query = isBulk
        ? supabase.from('users').update(updatePayload).in('id', targetIds)
        : supabase.from('users').update(updatePayload).eq('id', singleUser!.id);

      const { error } = await query;

      if (error) {
        if (error.code === 'PGRST204' || error.message.includes('permissions')) {
          setSqlFixNeeded(true);
          throw new Error('Cơ sở dữ liệu Supabase chưa có cột permissions. Vui lòng chạy lệnh SQL để kích hoạt.');
        }
        throw error;
      }

      // Log activity
      try {
        const { logActivity } = await import('../../utils/activityLogger');
        logActivity({
          action: isBulk ? 'bulk_update_permissions' : 'update_user_permissions',
          entityType: 'users',
          details: {
            count: targetIds.length,
            target_ids: targetIds,
            preset: selectedPresetKey || 'custom',
            synced_role: syncRole && selectedPresetKey ? PRESET_DEFAULT_ROLES[selectedPresetKey] : undefined,
          },
        });
      } catch {
        // ignore activity logger error
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving user permissions:', err);
      setErrorMessage(err.message || 'Không thể lưu phân quyền.');
    } finally {
      setSaving(false);
    }
  };

  const sqlMigrationCode = `-- Chạy lệnh này trong Supabase SQL Editor:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;
UPDATE public.users SET is_owner = true, role = 'admin' WHERE LOWER(email) = 'hoang.toan2409@gmail.com';`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const filteredModules =
    activeGroup === 'all'
      ? MODULES
      : MODULES.filter((m) => m.group === activeGroup);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isBulk ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {isBulk ? <Users className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {isBulk
                    ? `Phân quyền hàng loạt (${targetUsers.length} người dùng)`
                    : `Phân quyền chi tiết: ${singleUser?.display_name || singleUser?.email}`}
                </h2>
                {isTargetOwner && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    👑 Chủ sở hữu (Owner)
                  </span>
                )}
                {isBulk && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Tùy chọn đa người dùng
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {isBulk
                  ? `Áp dụng đồng loạt ma trận quyền hạn cho ${targetUsers.length} tài khoản đã chọn`
                  : `${singleUser?.email} • ${singleUser?.job_title || 'Chưa có chức danh'} • Vai trò cơ sở: `}
                {!isBulk && (
                  <span className="font-semibold uppercase text-indigo-600">{singleUser?.role}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Selected Users Chips Banner for Bulk Mode */}
        {isBulk && (
          <div className="mx-6 mt-4 p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                Đang áp dụng cho {targetUsers.length} người dùng được chọn:
              </span>
              <button
                type="button"
                onClick={() => setShowUsersList(!showUsersList)}
                className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center hover:underline"
              >
                {showUsersList ? (
                  <>
                    <ChevronUp size={12} className="mr-0.5" /> Thu gọn danh sách
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} className="mr-0.5" /> Xem danh sách ({targetUsers.length})
                  </>
                )}
              </button>
            </div>
            <div
              className={`mt-2 flex flex-wrap gap-1.5 transition-all ${
                showUsersList ? 'max-h-40 overflow-y-auto' : 'max-h-12 overflow-hidden'
              }`}
            >
              {targetUsers.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-purple-900 border border-purple-200 shadow-2xs"
                >
                  {u.display_name || u.email}
                  <span className="ml-1 text-[10px] text-gray-400">({u.role})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {isTargetOwner && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Tài khoản Chủ sở hữu (Owner) được bảo vệ tuyệt đối</p>
              <p className="mt-0.5 text-amber-700">
                Tài khoản này luôn luôn có toàn quyền trên toàn bộ các phân hệ và tính năng, không thể bị giới hạn quyền hay thu hồi quyền.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Lỗi lưu phân quyền</p>
              <p className="mt-0.5">{errorMessage}</p>
              {sqlFixNeeded && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                  <p className="font-mono text-xs text-red-900 mb-2 whitespace-pre-line">
                    {sqlMigrationCode}
                  </p>
                  <button
                    onClick={copySqlToClipboard}
                    className="inline-flex items-center px-3 py-1.5 bg-red-700 text-white text-xs font-medium rounded-md hover:bg-red-800"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedSql ? 'Đã sao chép SQL!' : 'Sao chép lệnh SQL'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium">
              {isBulk
                ? `Đã cập nhật phân quyền thành công cho ${targetUsers.length} người dùng!`
                : 'Đã cập nhật phân quyền thành công!'}
            </p>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Quick Preset Selector */}
          {!isTargetOwner && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Áp dụng nhanh mẫu quyền (Presets)
                  </span>
                </div>
                <button
                  onClick={handleResetToRoleDefault}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isBulk ? 'Khôi phục Viewer mặc định' : 'Khôi phục theo Role gốc'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplyPreset(key)}
                    className={`px-3 py-2 text-left border rounded-lg transition-all shadow-2xs group ${
                      selectedPresetKey === key
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                        : 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-300'
                    }`}
                    title={preset.description}
                  >
                    <div
                      className={`font-semibold text-xs truncate ${
                        selectedPresetKey === key ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-700'
                      }`}
                    >
                      {preset.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Sync Role Option for Bulk Mode */}
              {isBulk && selectedPresetKey && (
                <label className="mt-3 flex items-center space-x-2 text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-indigo-200 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={syncRole}
                    onChange={(e) => setSyncRole(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    Đồng thời cập nhật Vai trò chính (Role) sang{' '}
                    <strong className="uppercase text-indigo-700">
                      {PRESET_DEFAULT_ROLES[selectedPresetKey] || 'viewer'}
                    </strong>{' '}
                    cho tất cả <strong>{targetUsers.length}</strong> người dùng được chọn
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Group Filter Tabs */}
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveGroup('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeGroup === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tất cả phân hệ ({MODULES.length})
            </button>
            {MODULE_GROUPS.map((group) => {
              const count = MODULES.filter((m) => m.group === group.key).length;
              return (
                <button
                  key={group.key}
                  onClick={() => setActiveGroup(group.key)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                    activeGroup === group.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{group.label}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Module Permissions Matrix */}
          <div className="space-y-4">
            {filteredModules.map((module) => {
              const modulePerms = permissions[module.key] || {};
              const allChecked = module.actions.every((a) => modulePerms[a] === true);
              const someChecked = module.actions.some((a) => modulePerms[a] === true);

              return (
                <div
                  key={module.key}
                  className={`p-4 rounded-xl border transition-all ${
                    someChecked
                      ? 'bg-white border-gray-200 shadow-2xs'
                      : 'bg-gray-50/70 border-gray-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {module.label}
                        </span>
                        {module.path && (
                          <span className="font-mono text-[11px] text-gray-400">
                            {module.path}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {module.description}
                      </p>
                    </div>

                    {!isTargetOwner && (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectAllModule(module.key, !allChecked)}
                          className="text-xs px-2.5 py-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-md transition-colors"
                        >
                          {allChecked ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Checkboxes */}
                  <div className="flex flex-wrap gap-2">
                    {module.actions.map((action) => {
                      const isChecked = isTargetOwner || modulePerms[action] === true;
                      const colorClass =
                        ACTION_COLORS[action] || 'text-gray-700 bg-gray-50 border-gray-200';

                      return (
                        <label
                          key={action}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all select-none ${
                            isChecked
                              ? colorClass
                              : 'text-gray-400 bg-white border-gray-200 hover:border-gray-300'
                          } ${isTargetOwner ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isTargetOwner}
                            onChange={() => handleToggle(module.key, action)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span>{ACTION_LABELS[action]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {isTargetOwner
              ? 'Tài khoản Chủ sở hữu không cần cấu hình'
              : isBulk
              ? `Đang thiết lập quyền cho ${targetUsers.length} người dùng`
              : 'Quyền hạn sẽ được áp dụng ngay sau khi người dùng làm mới trang'}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Đóng
            </button>
            {!isTargetOwner && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${
                  isBulk
                    ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isBulk
                      ? `Lưu phân quyền (${targetUsers.length} người dùng)`
                      : 'Lưu phân quyền'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
