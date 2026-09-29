import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { X, Plus, Trash, GripVertical, Check, AlertCircle } from 'lucide-react';

interface RoutineChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftTypeId: string;
}

export const RoutineChecklistModal: React.FC<RoutineChecklistModalProps> = ({ isOpen, onClose, shiftTypeId }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [shiftName, setShiftName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && shiftTypeId) {
      fetchRoutines();
    }
  }, [isOpen, shiftTypeId]);

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      // Get shift name
      const { data: s } = await supabase.from('shift_types').select('name').eq('id', shiftTypeId).single();
      if (s) setShiftName(s.name);

      const { data, error } = await supabase
        .from('shift_routine_tasks')
        .select('*')
        .eq('shift_type_id', shiftTypeId)
        .order('order_index', { ascending: true });

      if (error) {
        // Table might not exist yet
        console.error(error);
        return;
      }
      if (data) {
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setTasks([...tasks, {
      id: `temp-${Date.now()}`,
      shift_type_id: shiftTypeId,
      title: '',
      description: '',
      priority: 'medium',
      is_active: true,
      order_index: tasks.length,
      isNew: true
    }]);
  };

  const handleRemoveTask = async (task: any, index: number) => {
    if (!task.isNew && !task.id.startsWith('temp-')) {
      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa mẫu công việc này?');
      if (!confirmed) return;
      
      try {
        await supabase.from('shift_routine_tasks').delete().eq('id', task.id);
      } catch (e) {
        console.error(e);
      }
    }
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleSave = async () => {
    // Validate
    const invalid = tasks.some(t => !t.title.trim());
    if (invalid) {
      alert('Vui lòng nhập tên công việc cho tất cả các dòng.');
      return;
    }

    setSaving(true);
    try {
      const upserts = tasks.map((t, idx) => ({
        ...(t.isNew ? {} : { id: t.id }),
        shift_type_id: shiftTypeId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        is_active: t.is_active,
        order_index: idx
      }));

      if (upserts.length > 0) {
        const { error } = await supabase.from('shift_routine_tasks').upsert(upserts);
        if (error) throw error;
      }
      
      alert('Đã lưu cấu hình Checklist!');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu. Có thể bảng CSDL chưa được tạo.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cấu hình Checklist (Công việc định kỳ)</h2>
            <p className="text-sm text-gray-500 mt-1">
              Thiết lập các công việc mặc định cần làm cho <span className="font-bold text-indigo-600">{shiftName || 'ca đã chọn'}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center py-12 text-gray-500">Đang tải cấu hình...</div>
          ) : (
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-10 bg-white border border-gray-200 rounded-lg border-dashed">
                  <p className="text-gray-500 mb-3">Chưa có công việc định kỳ nào được cấu hình cho ca này.</p>
                </div>
              ) : (
                tasks.map((task, idx) => (
                  <div key={task.id} className="flex gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm items-start">
                    <div className="mt-2 text-gray-400 cursor-move"><GripVertical size={20} /></div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          placeholder="Tên công việc (Bắt buộc)"
                          value={task.title}
                          onChange={e => handleChange(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          placeholder="Mô tả / Ghi chú"
                          value={task.description || ''}
                          onChange={e => handleChange(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <select
                          value={task.priority}
                          onChange={e => handleChange(idx, 'priority', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="low">Thấp</option>
                          <option value="medium">TB</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task, idx)}
                      className="mt-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Xóa công việc này"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={handleAddTask}
                className="mt-4 flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm việc vào Checklist
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 bg-white border-t border-gray-100">
          <div></div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center transition-colors shadow-sm"
            >
              {saving ? 'Đang lưu...' : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Lưu Cấu hình
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

