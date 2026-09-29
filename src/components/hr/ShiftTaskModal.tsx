import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { X, Calendar as CalendarIcon, Clock, User, AlertCircle, FileText } from 'lucide-react';
import { logActivity } from '../../utils/activityLogger';

interface ShiftTaskModalProps {
  task: any | null;
  selectedDate: string;
  selectedShiftId: string;
  onClose: () => void;
  onSaved: () => void;
}

export const ShiftTaskModal: React.FC<ShiftTaskModalProps> = ({ task, selectedDate, selectedShiftId, onClose, onSaved }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    date: task?.date || selectedDate,
    shift_id: task?.shift_id || (selectedShiftId !== 'all' ? selectedShiftId : ''),
    assignee_id: task?.assignee_id || profile?.id || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo'
  });

  useEffect(() => {
    fetchUsers();
    fetchShiftTypes();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, display_name, email');
    if (data) setUsers(data);
  };

  const fetchShiftTypes = async () => {
    const { data } = await supabase.from('shift_types').select('*').order('order_index');
    if (data) {
      setShiftTypes(data);
      if (!formData.shift_id && data.length > 0) {
        setFormData(prev => ({ ...prev, shift_id: data[0].id }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        assignee_id: formData.assignee_id || null,
        shift_id: formData.shift_id || null,
        updated_at: new Date().toISOString()
      };

      if (task) {
        const { error } = await supabase.from('hr_shift_tasks').update(payload).eq('id', task.id);
        if (error) throw error;
        logActivity({
          action: 'update_shift_task',
          entityType: 'hr_shift_tasks',
          entityId: task.id,
          details: { title: payload.title }
        });
      } else {
        const { data, error } = await supabase.from('hr_shift_tasks').insert([{ ...payload, created_by: profile?.id }]).select();
        if (error) throw error;
        logActivity({
          action: 'create_shift_task',
          entityType: 'hr_shift_tasks',
          entityId: data[0].id,
          details: { title: payload.title }
        });
      }
      onSaved();
    } catch (err: any) {
      alert('Lỗi khi lưu công việc: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">
            {task ? 'Chi tiết Công việc ca' : 'Tạo Công việc mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tên công việc <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Nhập tên công việc..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Yêu cầu, lưu ý cụ thể..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày làm việc <span className="text-red-500">*</span></label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ca làm việc <span className="text-red-500">*</span></label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  required
                  value={formData.shift_id}
                  onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                  className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                >
                  {shiftTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Người phụ trách</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.assignee_id}
                  onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                  className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">-- Chưa phân công --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.display_name || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mức độ ưu tiên</label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Bình thường</option>
                  <option value="high">Khẩn cấp</option>
                </select>
              </div>
            </div>
          </div>
          
          {task && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái hiện tại</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="todo">Chưa làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="done">Hoàn thành</option>
                <option value="handover">Bàn giao ca sau</option>
              </select>
            </div>
          )}
        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : null}
            {task ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
