import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { X, ArrowRight, FileText, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { logActivity } from '../../utils/activityLogger';

interface HandoverModalProps {
  task: any;
  shiftTypes: any[];
  onClose: () => void;
  onSaved: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ task, shiftTypes, onClose, onSaved }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Calculate default next date/shift based on current task
  const [nextDate, setNextDate] = useState<string>('');
  const [nextShiftId, setNextShiftId] = useState<string>('');
  const [handoverNote, setHandoverNote] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCompleters, setSelectedCompleters] = useState<string[]>([]);
  const [nextAssigneeId, setNextAssigneeId] = useState<string>('');

  useEffect(() => {
    supabase.from('users').select('id, display_name, email').then(({ data }) => {
      if (data) setUsers(data);
    });
  }, []);

  useEffect(() => {
    if (task) {
      const defaultWorker = task.assignee_id ? [task.assignee_id] : (profile?.id ? [profile.id] : []);
      setSelectedCompleters(defaultWorker);
      setNextAssigneeId(task.assignee_id || '');
    }
  }, [task, profile]);

  useEffect(() => {
    // Basic logic to suggest next shift
    if (task && shiftTypes.length > 0) {
      const currentShiftIndex = shiftTypes.findIndex(s => s.id === task.shift_id);
      if (currentShiftIndex >= 0 && currentShiftIndex < shiftTypes.length - 1) {
        // Next shift in the same day
        setNextDate(task.date);
        setNextShiftId(shiftTypes[currentShiftIndex + 1].id);
      } else {
        // First shift of the next day
        const d = new Date(task.date);
        d.setDate(d.getDate() + 1);
        setNextDate(d.toISOString().split('T')[0]);
        setNextShiftId(shiftTypes[0].id);
      }
    }
  }, [task, shiftTypes]);

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Update current task to 'handover' status with note and completers of this shift
      const resolvedGroupId = task.group_id || task.id;
      const { error: updateError } = await supabase.from('hr_shift_tasks').update({
        status: 'handover',
        handover_note: handoverNote,
        completers: selectedCompleters,
        group_id: resolvedGroupId,
        updated_at: new Date().toISOString()
      }).eq('id', task.id);
      
      if (updateError) throw updateError;

      // 2. Clone the task to the new shift
      const oldShiftName = shiftTypes.find(s => s.id === task.shift_id)?.name || 'Ca trước';
      const historyStamp = `\n\n[BÀN GIAO TỪ ${oldShiftName.toUpperCase()} - ${new Date(task.date).toLocaleDateString('vi-VN')}]: ${handoverNote}`;
      const newDescription = (task.description || '') + historyStamp;

      const { data: clonedTask, error: cloneError } = await supabase.from('hr_shift_tasks').insert([{
        title: task.title,
        description: newDescription,
        date: nextDate,
        shift_id: nextShiftId,
        assignee_id: nextAssigneeId || null,
        priority: task.priority,
        status: 'todo',
        subsystem_id: task.subsystem_id || null,
        created_by: profile?.id || null,
        group_id: resolvedGroupId
      }]).select();

      if (cloneError) throw cloneError;

      logActivity({
        action: 'handover_shift_task',
        entityType: 'hr_shift_tasks',
        entityId: task.id,
        details: { 
          cloned_task_id: clonedTask[0].id,
          next_date: nextDate,
          handover_note: handoverNote,
          shift_completers: selectedCompleters
        }
      });

      if (nextAssigneeId) {
        import('../../utils/notificationService').then(m => m.sendNotification({
          userId: nextAssigneeId,
          title: 'Công việc bàn giao ca mới',
          message: `Nhiệm vụ "${task.title}" đã được bàn giao sang ca tiếp theo. Ghi chú: ${handoverNote}`,
          type: 'info',
          link: '/hr-tasks'
        })).catch(() => {});
      }

      onSaved();
    } catch (err: any) {
      alert('Lỗi bàn giao ca: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50">
          <h2 className="text-lg font-bold text-orange-800 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2" />
            Bàn giao công việc
          </h2>
          <button onClick={onClose} className="text-orange-400 hover:text-orange-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleHandover} className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Công việc đang chọn</p>
            <p className="text-sm font-bold text-gray-900">{task?.title}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú bàn giao <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-500 mb-2">Ghi rõ lý do chưa xong hoặc tiến độ hiện tại cho ca sau.</p>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                required
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Ví dụ: Đã kiểm tra tủ số 1, tủ số 2 đang kiểm tra dở..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Người tham gia xử lý ca này</label>
            <p className="text-xs text-gray-500 mb-2">Những nhân sự đã trực tiếp kiểm tra/thao tác trong ca hiện tại.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedCompleters.map(userId => {
                const user = users.find(u => u.id === userId);
                return (
                  <span key={userId} className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-800 text-xs font-medium border border-orange-200">
                    <User size={12} className="mr-1 text-orange-600" />
                    {user ? (user.display_name || user.email) : 'Unknown'}
                    <button type="button" onClick={() => setSelectedCompleters(prev => prev.filter(id => id !== userId))} className="ml-1 text-orange-400 hover:text-orange-700">
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val && !selectedCompleters.includes(val)) {
                  setSelectedCompleters([...selectedCompleters, val]);
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="">-- Thêm người tham gia xử lý --</option>
              {users.filter(u => !selectedCompleters.includes(u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.display_name || u.email}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-bold text-gray-800 mb-3">Thông tin ca nhận bàn giao</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày làm việc</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ca làm việc</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    required
                    value={nextShiftId}
                    onChange={(e) => setNextShiftId(e.target.value)}
                    className="w-full pl-10 pr-6 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500 appearance-none"
                  >
                    {shiftTypes.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Người phụ trách ca sau (Tùy chọn)</label>
              <select
                value={nextAssigneeId}
                onChange={(e) => setNextAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">-- Để trống (Chung cho ca nhận) --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.display_name || u.email}</option>
                ))}
              </select>
            </div>
          </div>
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
            onClick={handleHandover}
            disabled={loading || !handoverNote.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : null}
            Bàn giao & Nhân bản
          </button>
        </div>
      </div>
    </div>
  );
};
