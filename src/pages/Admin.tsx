import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Users, ShieldAlert, Edit2, Check, X, Plus, Trash2, Mail } from 'lucide-react';
import type { UserProfile, Role } from '../contexts/AuthContext';

export const Admin: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('viewer');
  
  // Create User State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', role: 'viewer' as Role });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Load users
  useEffect(() => {
    if (profile?.role !== 'admin') return;
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

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

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
  };

  const saveName = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: editName, role: editRole })
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

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng ${userEmail}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      // Delete from users table only (auth user should be deleted separately via Supabase dashboard or CLI)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;
      await loadUsers();
      alert(`✅ Người dùng ${userEmail} đã bị xóa khỏi hệ thống`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Không thể xóa người dùng. Vui lòng thử lại.");
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

      // Create a temporary client that doesn't persist sessions
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const { createClient } = await import('@supabase/supabase-js');
      const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });

      // 1. Sign up the user (this creates auth.users record)
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) {
        throw new Error(`Lỗi tạo tài khoản: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Tạo tài khoản thất bại (không trả về user).");
      }

      // 2. Insert the user profile into public.users
      const { error: profileError } = await supabase.from('users').insert([{
        id: authData.user.id,
        email: newUser.email,
        display_name: newUser.displayName || newUser.email.split('@')[0],
        role: newUser.role,
        created_at: new Date().toISOString()
      }]);

      if (profileError) {
        // If profile creation fails, we can't easily rollback auth.users without admin key,
        // but we'll notify the admin.
        throw new Error(`Tài khoản đã tạo nhưng lỗi lưu thông tin profile: ${profileError.message}`);
      }

      setCreateSuccess(
        `✅ Người dùng ${newUser.email} đã được tạo thành công!\n\n` +
        `📋 Thông tin:\n` +
        `• Email: ${newUser.email}\n` +
        `• Phân quyền: ${newUser.role}\n\n` +
        `👉 User có thể đăng nhập ngay (hoặc cần xác nhận email nếu Supabase yêu cầu).`
      );
      
      setIsCreateModalOpen(false);
      setNewUser({ email: '', password: '', displayName: '', role: 'viewer' });
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

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
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

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản trị Người dùng</h1>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm người dùng
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p>Không có người dùng nào.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phân quyền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {user.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
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
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as Role)}
                              className="block border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button onClick={() => saveName(user.id)} className="text-green-600 hover:text-green-900">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEditing} className="text-red-600 hover:text-red-900">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">{user.display_name || 'Chưa cập nhật'}</div>
                            <button onClick={() => startEditingName(user)} className="ml-2 text-gray-400 hover:text-indigo-600" title="Sửa tên">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="viewer">Viewer (Chỉ xem)</option>
                      <option value="manager">Manager (Thêm/Sửa)</option>
                      <option value="admin">Admin (Toàn quyền)</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleResetPassword(user.email)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      title="Gửi link đặt lại mật khẩu"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-900"
                      title="Xóa người dùng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
