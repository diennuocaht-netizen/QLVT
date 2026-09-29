import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Clock, MapPin, AlignLeft, Calendar as CalendarIcon, CheckSquare, Plus, Trash2, User, AlertCircle, MessageSquare } from 'lucide-react';
import { logActivity } from '../../utils/activityLogger';

interface EventDetailsModalProps {
  event: any | null; // if null, it's a new event
  onClose: () => void;
  onSaved: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onSaved }) => {
  const { profile } = useAuth();
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  
  const [activeTab, setActiveTab] = useState<'general' | 'tasks'>(event ? 'tasks' : 'general');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [startTime, setStartTime] = useState(event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState(event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '');
  const [status, setStatus] = useState(event?.status || 'upcoming');
  
  // Tasks State
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (event?.id) {
      fetchTasks();
    }
  }, [event]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, display_name, email');
    if (data) setUsers(data);
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    const { data } = await supabase
      .from('hr_event_tasks')
      .select('*')
      .eq('event_id', event.id)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (data) setTasks(data);
    setLoadingTasks(false);
  };

  const handleSaveGeneral = async () => {
    if (!title) return alert('Vui lòng nhập tên sự kiện');
    
    setLoading(true);
    try {
      const eventData = {
        title,
        description,
        location,
        start_time: startTime || null,
        end_time: endTime || null,
        status,
        updated_at: new Date().toISOString()
      };

      let newEventId = event?.id;

      if (event?.id) {
        await supabase.from('hr_events').update(eventData).eq('id', event.id);
        logActivity({
          action: 'update_event',
          entityType: 'hr_event',
          entityId: event.id,
          details: { title }
        });
      } else {
        const { data, error } = await supabase.from('hr_events').insert([{ ...eventData, created_by: profile?.id }]).select().single();
        if (error) throw error;
        newEventId = data.id;
        logActivity({
          action: 'create_event',
          entityType: 'hr_event',
          entityId: newEventId,
          details: { title }
        });
      }
      
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu sự kiện.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- TASKS LOGIC ----------------
  const handleAddTask = async () => {
    if (!event?.id) return alert('Vui lòng lưu thông tin chung trước khi thêm hạng mục.');
    
    const newTask = {
      event_id: event.id,
      title: 'Hạng mục mới',
      status: 'todo',
      order_index: tasks.length
    };
    
    const { data } = await supabase.from('hr_event_tasks').insert([newTask]).select().single();
    if (data) {
      setTasks([...tasks, data]);
    }
  };

  const updateLocalTask = (taskId: string, updates: any) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const saveTaskToDb = async (taskId: string, updates: any) => {
    const { error } = await supabase.from('hr_event_tasks').update(updates).eq('id', taskId);
    if (error) {
      console.error(error);
      fetchTasks();
    } else if (updates.result_note || updates.status === 'done') {
      logActivity({
        action: 'update_event_task',
        entityType: 'hr_event',
        entityId: event.id,
        details: { taskId, updates }
      });
    }
  };

  const updateTask = async (taskId: string, updates: any) => {
    updateLocalTask(taskId, updates);
    saveTaskToDb(taskId, updates);
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hạng mục này?')) return;
    setTasks(tasks.filter(t => t.id !== taskId));
    await supabase.from('hr_event_tasks').delete().eq('id', taskId);
  };

  // Progress Bar calculation
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{event ? 'Chi tiết Sự kiện' : 'Tạo Sự kiện Mới'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {event && (
          <div className="flex border-b border-gray-200 px-6 pt-2">
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('general')}
            >
              Thông tin chung
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('tasks')}
            >
              Hạng mục công việc ({tasks.length})
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sự kiện <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Vd: Tiệc tất niên 2026..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={!canEdit}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={!canEdit}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!canEdit}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Vd: Hội trường A"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="upcoming">Sắp diễn ra</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nhập mô tả sự kiện..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="w-1/2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Tiến độ sự kiện</span>
                    <span className="font-bold text-indigo-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                {canEdit && (
                  <button onClick={handleAddTask} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center shadow-sm">
                    <Plus className="w-4 h-4 mr-1" /> Thêm hạng mục
                  </button>
                )}
              </div>

              {loadingTasks ? (
                <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div></div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <CheckSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Chưa có hạng mục công việc nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                    const isWarning = task.deadline && new Date(task.deadline).getTime() - new Date().getTime() < 24*60*60*1000 && task.status !== 'done';
                    const borderClass = isOverdue ? 'border-red-400 shadow-sm ring-1 ring-red-400' : isWarning ? 'border-yellow-400 shadow-sm ring-1 ring-yellow-400' : 'border-gray-200';
                    
                    return (
                      <div key={task.id} className={`bg-white border rounded-lg p-4 transition-all ${borderClass}`}>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                          
                          {/* Task Status */}
                          <div className="shrink-0">
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(task.id, { status: e.target.value })}
                              disabled={!canEdit && profile?.id !== task.assignee_id}
                              className={`text-sm rounded border-gray-300 font-medium px-2 py-1 ${
                                task.status === 'done' ? 'bg-green-100 text-green-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <option value="todo">Chưa làm</option>
                              <option value="in_progress">Đang làm</option>
                              <option value="done">Hoàn thành</option>
                            </select>
                          </div>

                          {/* Task Info */}
                          <div className="flex-1 w-full space-y-2">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateLocalTask(task.id, { title: e.target.value })} onBlur={(e) => saveTaskToDb(task.id, { title: e.target.value })}
                              disabled={!canEdit}
                              placeholder="Tên hạng mục..."
                              className="w-full font-bold text-gray-900 border-none bg-transparent focus:ring-0 p-0 text-base mb-1"
                            />
                            <textarea
                              value={task.description || ''}
                              onChange={(e) => updateLocalTask(task.id, { description: e.target.value })}
                              onBlur={(e) => saveTaskToDb(task.id, { description: e.target.value })}
                              disabled={!canEdit}
                              placeholder="Mô tả chi tiết hạng mục (yêu cầu, lưu ý...)"
                              rows={1}
                              className="w-full text-sm text-gray-600 border-none bg-transparent focus:ring-0 p-0 resize-none mb-2"
                            />
                            
                            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                              <div className="flex items-center bg-gray-50 border rounded px-2 py-1">
                                <User className="w-3.5 h-3.5 mr-1" />
                                <select 
                                  value={task.assignee_id || ''}
                                  onChange={(e) => updateTask(task.id, { assignee_id: e.target.value || null })}
                                  disabled={!canEdit}
                                  className="bg-transparent border-none text-xs p-0 focus:ring-0"
                                >
                                  <option value="">-- Phân công --</option>
                                  {users.map(u => <option key={u.id} value={u.id}>{u.display_name || u.email}</option>)}
                                </select>
                              </div>
                              
                              <div className={`flex items-center border rounded px-2 py-1 ${isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50'}`}>
                                <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                                <input
                                  type="datetime-local"
                                  value={task.deadline ? new Date(task.deadline).toISOString().slice(0,16) : ''}
                                  onChange={(e) => updateTask(task.id, { deadline: e.target.value || null })}
                                  disabled={!canEdit}
                                  className="bg-transparent border-none text-xs p-0 focus:ring-0"
                                />
                              </div>
                              
                              {isOverdue && <span className="flex items-center text-xs text-red-600 font-bold"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Quá hạn</span>}
                            </div>

                            {/* Result Note */}
                            <div className="relative mt-2">
                              <MessageSquare className="absolute left-2 top-2 text-gray-400 w-3.5 h-3.5" />
                              <textarea
                                value={task.result_note || ''}
                                onChange={(e) => updateLocalTask(task.id, { result_note: e.target.value })} onBlur={(e) => saveTaskToDb(task.id, { result_note: e.target.value })}
                                disabled={!canEdit && profile?.id !== task.assignee_id}
                                placeholder="Ghi chú cập nhật kết quả..."
                                rows={1}
                                className="w-full text-sm pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                              />
                            </div>
                          </div>

                          {/* Delete */}
                          {canEdit && (
                            <div className="shrink-0">
                              <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'general' && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium">Hủy</button>
            <button onClick={handleSaveGeneral} disabled={loading || !canEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center font-medium shadow-sm">
              {loading ? <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4 mr-2" />}
              {event ? 'Lưu thay đổi' : 'Tạo sự kiện'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
