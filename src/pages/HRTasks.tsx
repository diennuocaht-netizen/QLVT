import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, ArrowRight, User, CheckCircle, Edit3, Trash2, FileText, ChevronDown, ChevronUp, History, X } from 'lucide-react';
import { ShiftTaskModal } from '../components/hr/ShiftTaskModal';
import { HandoverModal } from '../components/hr/HandoverModal';
import { TaskTimelineModal } from '../components/hr/TaskTimelineModal';

export const HRTasks: React.FC = () => {
  const { profile } = useAuth();
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const [groupStatuses, setGroupStatuses] = useState<Record<string, any>>({});
  const [timelineGroupId, setTimelineGroupId] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<any | null>(null);
  const [completionNote, setCompletionNote] = useState('');


  const toggleTaskExpand = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, columnId);
    }
  };

  const [handoverTask, setHandoverTask] = useState<any | null>(null);


  useEffect(() => {
    fetchShiftTypes();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedDate, selectedShiftId]);

  const fetchShiftTypes = async () => {
    const { data } = await supabase.from('shift_types').select('*').order('order_index');
    if (data && data.length > 0) {
      setShiftTypes(data);
      // Auto-select first shift if none selected
      if (selectedShiftId === 'all') {
         setSelectedShiftId(data[0].id);
      }
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('hr_shift_tasks')
        .select(`*, assignee:users!hr_shift_tasks_assignee_id_fkey(id, display_name), shift:shift_types(id, name, code)`)
        .eq('date', selectedDate);
        
      if (selectedShiftId !== 'all') {
        query = query.eq('shift_id', selectedShiftId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error && error.code !== '42P01') {
        console.error('Error fetching tasks:', error);
      }
      
      if (data) {
        let finalTasks = data;
        if (selectedShiftId === 'all') {
          // When viewing all shifts in a day, only show the latest version of a task chain
          const groupMap = new Map();
          data.forEach(t => {
            const gid = t.group_id || t.id;
            if (!groupMap.has(gid)) {
              groupMap.set(gid, t);
            } else {
              const existing = groupMap.get(gid);
              if (new Date(t.created_at) > new Date(existing.created_at)) {
                groupMap.set(gid, t);
              }
            }
          });
          finalTasks = Array.from(groupMap.values());
        }
        setTasks(finalTasks);
        
        // Fetch group statuses for handover tasks (using finalTasks)
        const handoverGroupIds = finalTasks.filter(t => t.status === 'handover').map(t => t.group_id || t.id);
        if (handoverGroupIds.length > 0) {
           const { data: latestInGroup } = await supabase
             .from('hr_shift_tasks')
             .select('group_id, status, shift:shift_types(name)')
             .in('group_id', handoverGroupIds)
             .order('created_at', { ascending: false });
             
           const gs: Record<string, any> = {};
           latestInGroup?.forEach(t => {
              if (!gs[t.group_id]) {
                 gs[t.group_id] = t;
              }
           });
           setGroupStatuses(gs);
        } else {
           setGroupStatuses({});
        }
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  
  const generateRoutineTasks = async () => {
    if (!selectedShiftId || selectedShiftId === 'all') {
      alert('Vui lòng chọn một Ca cụ thể để sinh checklist!');
      return;
    }
    setLoading(true);
    try {
      const routines = [
        { title: 'Kiểm tra thông số tủ điện chính', priority: 'high' },
        { title: 'Vệ sinh phòng máy', priority: 'low' },
        { title: 'Kiểm tra hệ thống báo cháy', priority: 'high' },
        { title: 'Đọc và ghi sổ nhật ký ca trước', priority: 'medium' }
      ];
      
      const inserts = routines.map(r => ({
        title: r.title,
        description: 'Công việc định kỳ sinh tự động',
        date: selectedDate,
        shift_id: selectedShiftId,
        priority: r.priority,
        status: 'todo',
        created_by: profile?.id || null
      }));

      const { error } = await supabase.from('hr_shift_tasks').insert(inserts);
      if (error) throw error;
      
      fetchTasks();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleCompleteTask = async () => {
    if (!completingTask) return;
    setLoading(true);
    try {
      const newDescription = completionNote.trim() 
        ? (completingTask.description ? completingTask.description + '\n\n[KẾT LUẬN XỬ LÝ]: ' + completionNote : '[KẾT LUẬN XỬ LÝ]: ' + completionNote)
        : completingTask.description;
        
      const { error } = await supabase.from('hr_shift_tasks').update({ 
        status: 'done',
        description: newDescription,
        updated_at: new Date().toISOString()
      }).eq('id', completingTask.id);
      
      if (error) throw error;
      
      setCompletingTask(null);
      fetchTasks();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('hr_shift_tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi cập nhật: ' + err.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      const { error } = await supabase.from('hr_shift_tasks').delete().eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi xóa: ' + err.message);
    }
  };

  const columns = [
    { id: 'todo', title: 'Chưa làm', color: 'border-gray-200 bg-gray-50' },
    { id: 'in_progress', title: 'Đang làm', color: 'border-blue-200 bg-blue-50' },
    { id: 'done', title: 'Hoàn thành', color: 'border-green-200 bg-green-50' },
    { id: 'handover', title: 'Bàn giao ca sau', color: 'border-orange-200 bg-orange-50' }
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Công việc & Giao ca</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý công việc trong ngày và bàn giao cho ca tiếp theo.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center shadow-sm font-medium transition-colors"
              onClick={generateRoutineTasks}
              title="Tự động tạo các công việc bắt buộc cho ca đã chọn"
            >
              <FileText className="w-4 h-4 mr-2" />
              Sinh Check-list
            </button>
          )}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm font-medium transition-colors"
            onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Tạo công việc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ngày làm việc</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-40"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ca làm việc</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-48 appearance-none"
              >
                <option value="all">Tất cả các ca</option>
                {shiftTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="flex gap-4 h-full pb-4">
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              return (
                <div 
                  key={col.id} 
                  className={`flex-1 min-w-[280px] max-w-[350px] flex flex-col rounded-lg border ${col.color}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div className="p-3 border-b border-black/5 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-800">{col.title}</h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-600 shadow-sm">{colTasks.length}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-6 text-sm text-gray-400 italic">Không có công việc</div>
                    ) : (
                      colTasks.map(task => (
                        <div 
                          key={task.id} 
                          className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                        >
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded px-1">
                             <button onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }} className="p-1 text-gray-400 hover:text-indigo-600 rounded"><Edit3 size={14}/></button>
                             {canEdit && <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14}/></button>}
                          </div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {task.priority === 'high' ? 'Khẩn cấp' : task.priority === 'low' ? 'Thấp' : 'Thường'}
                            </span>
                            {task.shift && <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{task.shift.code}</span>}
                          </div>
                          
                          <h4 className="font-bold text-sm text-gray-900 mb-1">{task.title}</h4>
                          {task.description && (
                            <div className="mb-3">
                              <p className={`text-xs text-gray-500 whitespace-pre-wrap ${expandedTaskIds.has(task.id) ? '' : 'line-clamp-2'}`}>
                                {task.description}
                              </p>
                              {task.description.length > 80 && (
                                <button 
                                  onClick={(e) => toggleTaskExpand(e, task.id)}
                                  className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center mt-1"
                                >
                                  {expandedTaskIds.has(task.id) ? <><ChevronUp size={12} className="mr-0.5"/> Ẩn bớt</> : <><ChevronDown size={12} className="mr-0.5"/> Xem toàn bộ thông tin</>}
                                </button>
                              )}
                            </div>
                          )}
                          
                          {(task.group_id || task.id) && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTimelineGroupId(task.group_id || task.id); }}
                              className="text-[10px] text-blue-600 font-bold flex items-center bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors w-full justify-center mb-3"
                            >
                              <History size={12} className="mr-1" />
                              Truy vết luồng xử lý
                            </button>
                          )}

                          {task.status === 'handover' && groupStatuses[task.group_id || task.id] && groupStatuses[task.group_id || task.id].status === 'done' && (
                            <div className="mt-2 mb-3 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-200 flex items-center shadow-sm">
                              <CheckCircle size={12} className="mr-1" />
                              Đã hoàn thành bởi {groupStatuses[task.group_id || task.id].shift?.name || 'ca sau'}
                            </div>
                          )}
                          
                          {task.status === 'handover' && task.handover_note && (
                            <div className="bg-orange-50 border border-orange-100 rounded p-2 text-xs text-orange-800 mb-3 font-medium">
                              <span className="font-bold">Bàn giao: </span>{task.handover_note}
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-600">
                              <User className="w-3.5 h-3.5 mr-1" />
                              {task.assignee?.display_name || 'Chưa phân công'}
                            </div>
                            <div className="flex items-center space-x-1">
                               {task.status !== 'done' && task.status !== 'handover' && (
                                 <button onClick={(e) => { e.stopPropagation(); setCompletionNote(''); setCompletingTask(task); }} title="Hoàn thành & Ghi chú" className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors">
                                   <CheckCircle size={16} />
                                 </button>
                               )}
                               {task.status !== 'done' && task.status !== 'handover' && (
                                 <button onClick={() => { setHandoverTask(task); setIsHandoverModalOpen(true); }} title="Bàn giao ca sau" className="p-1 rounded hover:bg-orange-100 text-gray-400 hover:text-orange-600 transition-colors flex items-center">
                                   <ArrowRight size={16} />
                                 </button>
                               )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {isTaskModalOpen && (
        <ShiftTaskModal
          task={editingTask}
          selectedDate={selectedDate}
          selectedShiftId={selectedShiftId}
          onClose={() => setIsTaskModalOpen(false)}
          onSaved={() => {
            setIsTaskModalOpen(false);
            fetchTasks();
          }}
        />
      )}
      {isHandoverModalOpen && handoverTask && (
        <HandoverModal
          task={handoverTask}
          shiftTypes={shiftTypes}
          onClose={() => setIsHandoverModalOpen(false)}
          onSaved={() => {
            setIsHandoverModalOpen(false);
            fetchTasks();
          }}
        />
      )}
          
      {completingTask && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
              <h2 className="text-lg font-bold text-green-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Hoàn thành công việc
              </h2>
              <button onClick={() => setCompletingTask(null)} className="text-green-400 hover:text-green-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-bold text-gray-900">{completingTask.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kết luận xử lý (Tùy chọn)</label>
                <p className="text-xs text-gray-500 mb-2">Ghi lại kết quả, nguyên nhân hoặc thông số đo đạc được.</p>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Ví dụ: Đã thay thế aptomat mới, thông số dòng ổn định 15A..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCompleteTask}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : null}
                Lưu & Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

      {timelineGroupId && (
        <TaskTimelineModal
          groupId={timelineGroupId}
          onClose={() => setTimelineGroupId(null)}
        />
      )}
    </div>
  );
};
