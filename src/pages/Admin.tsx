import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Users, ShieldAlert, Edit2, Check, X, Plus, Trash2, Mail, Shield, Crown, Search, Filter } from 'lucide-react';
import type { UserProfile, Role } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { isOwner } from '../utils/permissions';
import { UserPermissionsModal } from '../components/admin/UserPermissionsModal';

export const Admin: React.FC = () => {
  const { profile } = useAuth();
  const { can, canManage } = usePermission();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('viewer');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [permissionsModalUser, setPermissionsModalUser] = useState<UserProfile | null>(null);

  // Search, Filter & Bulk Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBulkPermissionsOpen, setIsBulkPermissionsOpen] = useState(false);
  
  // Create User State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', role: 'viewer' as Role, jobTitle: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Load users
  useEffect(() => {
    if (!can('admin_users', 'view')) return;
    loadUsers();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`users_changes_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadUsers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUser: UserProfile, newRole: Role) => {
    const manage = canManage(targetUser);
    if (!manage.canEdit) {
      alert(`⚠️ ${manage.reason || 'Bạn không có quyền sửa vai trò của tài khoản này!'}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUser.id);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Không thể cập nhật quyền. Vui lòng thử lại.");
    }
  };

  const startEditingName = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditName(user.display_name);
    setEditRole(user.role);
    setEditJobTitle(user.job_title || '');
  };

  const saveName = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: editName, role: editRole, job_title: editJobTitle })
        .eq('id', userId);

      if (error) throw error;
      setEditingUserId(null);
      await loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Không thể cập nhật thông tin. Vui lòng thử lại.");
    }
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditName('');
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    const manage = canManage(targetUser);
    if (!manage.canDelete) {
      alert(`⚠️ ${manage.reason || 'Bạn không có quyền xóa tài khoản này!'}`);
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa hoàn toàn người dùng ${targetUser.email}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      // Use bypass RPC to delete from auth.users directly
      const { data: rpcData, error: deleteError } = await supabase.rpc('admin_delete_user_bypass', {
        p_user_id: targetUser.id
      });

      if (deleteError) {
        throw new Error(deleteError.message);
      }
      
      if (rpcData && rpcData.success === false) {
        throw new Error(rpcData.error);
      }

      await loadUsers();
      alert(`✅ Người dùng ${targetUser.email} đã bị xóa hoàn toàn khỏi hệ thống`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error instanceof Error ? `Lỗi: ${error.message}` : "Không thể xóa người dùng. Vui lòng thử lại.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    
    if (!newUser.email || !newUser.password) {
      setCreateError('Email và mật khẩu là bắt buộc');
      return;
    }

    setCreating(true);
    try {
      // Check if email already exists in frontend
      const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
      if (existingUser) {
        setCreateError("Email này đã tồn tại trong hệ thống!");
        setCreating(false);
        return;
      }

      // Use our bypass RPC to create the user directly in auth.users and public.users
      const { data: rpcData, error: profileError } = await supabase.rpc('admin_create_user_bypass', {
        p_email: newUser.email,
        p_password: newUser.password,
        p_display_name: newUser.displayName || newUser.email.split('@')[0],
        p_role: newUser.role
      });
      
      // Attempt to set job_title if RPC doesn't support it yet
      if (!profileError && newUser.jobTitle) {
        try {
          // Find the new user's ID by email
          const { data: createdUser } = await supabase.from('users').select('id').eq('email', newUser.email.toLowerCase()).single();
          if (createdUser) {
            await supabase.from('users').update({ job_title: newUser.jobTitle }).eq('id', createdUser.id);
          }
        } catch (e) {}
      }

      if (profileError) {
        console.error("Lỗi tạo user (bỏ qua auth):", profileError);
        throw new Error(`Lỗi hệ thống: ${profileError.message}`);
      }
      
      if (rpcData && rpcData.success === false) {
        throw new Error(`Lỗi từ máy chủ: ${rpcData.error}`);
      }

      setCreateSuccess(
        `✅ Người dùng ${newUser.email} đã được tạo thành công!\n\n` +
        `📋 Thông tin:\n` +
        `• Email: ${newUser.email}\n` +
        `• Phân quyền: ${newUser.role}\n\n` +
        `👉 User có thể đăng nhập ngay (hoặc cần xác nhận email nếu Supabase yêu cầu).`
      );
      
      setIsCreateModalOpen(false);
      setNewUser({ email: '', password: '', displayName: '', role: 'viewer', jobTitle: '' });
      await loadUsers();

      setTimeout(() => setCreateSuccess(''), 10000);
    } catch (error) {
      console.error("Error creating user:", error);
      setCreateError(
        error instanceof Error ? error.message : "Không thể tạo người dùng. Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) throw error;
      alert(`✅ Link đặt lại mật khẩu đã được gửi tới ${userEmail}\n\n📧 Kiểm tra hộp thư email để nhận link.`);
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(`⚠️ Không thể gửi link đặt lại mật khẩu.\n\n💡 Nếu user chưa được tạo auth, chạy:\n\nnode scripts/create-user.js`);
    }
  };

  // Filtered users based on search & role filter
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.job_title?.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Eligible users for bulk operations (Owner excluded)
  const eligibleUsers = useMemo(() => {
    return filteredUsers.filter((u) => !isOwner(u));
  }, [filteredUsers]);

  const isAllSelected =
    eligibleUsers.length > 0 && eligibleUsers.every((u) => selectedUserIds.has(u.id));

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(eligibleUsers.map((u) => u.id)));
    }
  };

  if (!can('admin_users', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Truy cập bị từ chối</h2>
        <p className="text-gray-600 mt-2">Bạn không có quyền truy cập trang quản trị này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {createSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm font-medium text-green-800">{createSuccess}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản trị Người dùng & Phân quyền</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý tài khoản, chức danh và ma trận quyền hạn chi tiết cho từng phân hệ
          </p>
        </div>
        {can('admin_users', 'create') && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm người dùng
          </button>
        )}
      </div>

      {/* Search and Role Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email, chức danh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="manager">Quản lý (Manager)</option>
              <option value="viewer">Người xem (Viewer)</option>
            </select>
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} người dùng
          </span>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedUserIds.size > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-3 text-purple-950">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedUserIds.size}
            </div>
            <div>
              <p className="font-bold text-sm text-purple-950">
                Đã chọn {selectedUserIds.size} người dùng
              </p>
              <p className="text-xs text-purple-700">
                Sẵn sàng cấu hình ma trận phân quyền hoặc áp dụng mẫu quyền đồng loạt
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedUserIds(new Set())}
              className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bỏ chọn ({selectedUserIds.size})
            </button>
            <button
              onClick={() => setIsBulkPermissionsOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Phân quyền hàng loạt ({selectedUserIds.size})</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p>Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={eligibleUsers.length === 0}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                    title="Chọn tất cả người dùng (trừ Chủ sở hữu)"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức danh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò & Phân quyền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const isTargetOwner = isOwner(user);
                const manage = canManage(user);
                const hasCustomPermissions = user.permissions && Object.keys(user.permissions).length > 0;
                const isChecked = selectedUserIds.has(user.id);

                return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isChecked ? 'bg-purple-50/50' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap w-10">
                      {isTargetOwner ? (
                        <span title="Tài khoản Chủ sở hữu không áp dụng phân quyền hàng loạt" className="inline-block text-gray-300 text-xs cursor-not-allowed">
                          🔒
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectUser(user.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isTargetOwner
                              ? 'bg-amber-100 text-amber-800 border-2 border-amber-400'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {isTargetOwner ? '👑' : user.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-4 flex-1 flex items-center">
                          {editingUserId === user.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Nhập họ tên..."
                                autoFocus
                              />
                              <input
                                type="text"
                                value={editJobTitle}
                                onChange={(e) => setEditJobTitle(e.target.value)}
                                className="block w-32 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Chức danh..."
                              />
                              <button onClick={() => saveName(user.id)} className="text-green-600 hover:text-green-900">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEditing} className="text-red-600 hover:text-red-900">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{user.display_name || 'Chưa cập nhật'}</span>
                              {isTargetOwner && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Owner
                                </span>
                              )}
                              {manage.canEdit && !isTargetOwner && (
                                <button onClick={() => startEditingName(user)} className="text-gray-400 hover:text-indigo-600" title="Sửa thông tin">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingUserId === user.id ? (
                        <input
                          type="text"
                          value={editJobTitle}
                          onChange={(e) => setEditJobTitle(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Chức danh..."
                        />
                      ) : (
                        user.job_title || <span className="text-gray-300 italic">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isTargetOwner ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          👑 Toàn quyền hệ thống
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.role}
                            disabled={!manage.canEdit}
                            onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                            className="block pl-2.5 pr-7 py-1 text-xs border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="viewer">Viewer (Chỉ xem)</option>
                            <option value="manager">Manager (Thêm/Sửa)</option>
                            <option value="admin">Admin (Toàn quyền)</option>
                          </select>
                          {hasCustomPermissions && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Tùy chỉnh
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {/* Nút Phân quyền chi tiết */}
                      <button
                        onClick={() => setPermissionsModalUser(user)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors inline-flex items-center space-x-1"
                        title="Cấu hình ma trận phân quyền chi tiết"
                      >
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-medium hidden md:inline">Phân quyền</span>
                      </button>

                      {/* Gửi link đặt lại mật khẩu */}
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center"
                        title="Gửi link đặt lại mật khẩu"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      {/* Nút Xóa */}
                      {manage.canDelete && !isTargetOwner ? (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors inline-flex items-center"
                          title="Xóa người dùng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="p-1.5 text-gray-300 inline-flex items-center cursor-not-allowed"
                          title={isTargetOwner ? 'Tài khoản Chủ sở hữu được bảo vệ' : 'Không có quyền xóa'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Permissions Modal (Single User) */}
      {permissionsModalUser && (
        <UserPermissionsModal
          user={permissionsModalUser}
          isOpen={!!permissionsModalUser}
          onClose={() => setPermissionsModalUser(null)}
          onSuccess={loadUsers}
        />
      )}

      {/* Permissions Modal (Bulk Users) */}
      {isBulkPermissionsOpen && (
        <UserPermissionsModal
          users={users.filter((u) => selectedUserIds.has(u.id))}
          isOpen={isBulkPermissionsOpen}
          onClose={() => setIsBulkPermissionsOpen(false)}
          onSuccess={() => {
            setSelectedUserIds(new Set());
            loadUsers();
          }}
        />
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Thêm Người dùng mới</h2>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError('');
                }} 
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && (
                <div className="rounded-md bg-red-50 p-3 text-red-700 text-sm">
                  {createError}
                </div>
              )}

              <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm mb-4">
                Nhập email, mật khẩu và phân quyền để tạo người dùng mới.
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="ví dụ: nguyenvan.a@email.com"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  disabled={creating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nhập họ tên đầy đủ..."
                  disabled={creating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phân quyền *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as Role})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={creating}
                >
                  <option value="viewer">Viewer (Chỉ xem)</option>
                  <option value="manager">Manager (Thêm/Sửa)</option>
                  <option value="admin">Admin (Toàn quyền)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError('');
                  }}
                  disabled={creating}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
