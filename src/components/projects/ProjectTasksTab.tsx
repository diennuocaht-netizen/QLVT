import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { Plus, Trash2, Save, ListTodo, AlertCircle, Clock, User } from 'lucide-react';
import { logActivity } from '../../utils/activityLogger';

interface ProjectTasksTabProps {
  project: any;
}

export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ project }) => {
  const [tasks, setTasks] = useState<any[]>(project.tasks || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

    const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('*').order('display_name');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);
  
useEffect(() => {
    setTasks(project.tasks || []);
    setHasChanges(false);
  }, [project]);

  const addTask = () => {
    setTasks([...tasks, { id: crypto.randomUUID(), name: '', start_date: '', end_date: '', progress: 0, status: 'pending', assignee: '' }]);
    setHasChanges(true);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateTask = (index: number, field: string, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
    setHasChanges(true);
  };

  const saveTasks = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ tasks })
        .eq('id', project.id);
        
      if (error) throw error;
      await logActivity({
        action: `Cập nhật hạng mục công việc cho dự án ${project.code}`,
        entityType: 'project',
        entityId: project.id,
        details: { tasks_count: tasks.length }
      });
      alert('Đã lưu các thay đổi hạng mục công việc');
      setHasChanges(false);
    } catch (e: any) {
      alert('Lỗi khi lưu: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getTaskStatusWarning = (task: any) => {
    if (task.status === 'completed') return null;
    if (!task.start_date || !task.end_date) return null;

    const start = new Date(task.start_date).getTime();
    const end = new Date(task.end_date).getTime();
    const now = new Date().getTime();

    if (now > end && task.progress < 100) {
      return { type: 'danger', message: 'Đã quá hạn nhưng chưa hoàn thành' };
    }

    const totalDuration = end - start;
    const elapsed = now - start;
    if (totalDuration > 0 && elapsed > 0) {
      const timeRatio = elapsed / totalDuration;
      if (timeRatio >= 0.75 && task.progress < 75) {
        return { type: 'warning', message: 'Thời gian đã qua 75% nhưng tiến độ chưa đạt 75%' };
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-indigo-500" /> Quản lý hạng mục
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addTask}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <Plus className="w-4 h-4 mr-1" /> Thêm mới
          </button>
          {hasChanges && (
            <button
              type="button"
              onClick={saveTasks}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4 mr-1" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
          <ListTodo className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có hạng mục công việc nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => {
            const warning = getTaskStatusWarning(task);
            return (
            <div key={task.id || index} className={`bg-white p-4 rounded-md border ${warning?.type === 'danger' ? 'border-red-300 shadow-sm shadow-red-100' : warning?.type === 'warning' ? 'border-yellow-300 shadow-sm shadow-yellow-100' : 'border-gray-200 shadow-sm'} relative`}>
              <button
                type="button"
                onClick={() => removeTask(index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 bg-white rounded-md z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              {warning && (
                <div className={`mb-3 flex items-center p-2 rounded-md text-xs font-medium ${warning.type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  <AlertCircle className="w-4 h-4 mr-1" /> {warning.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-9">
                  <label className="block text-xs font-medium text-gray-700">Tên hạng mục *</label>
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => updateTask(index, 'name', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Người phụ trách</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={task.assignee || ''}
                      onChange={(e) => updateTask(index, 'assignee', e.target.value)}
                      className="block w-full pl-8 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">-- Chưa gán --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.display_name || u.email}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Bắt đầu</label>
                  <input
                    type="date"
                    value={task.start_date || ''}
                    onChange={(e) => updateTask(index, 'start_date', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Kết thúc</label>
                  <input
                    type="date"
                    value={task.end_date || ''}
                    onChange={(e) => updateTask(index, 'end_date', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Tiến độ (%)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={task.progress}
                      onChange={(e) => updateTask(index, 'progress', parseInt(e.target.value) || 0)}
                      className="block w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${task.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Trạng thái</label>
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(index, 'status', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Chưa bắt đầu</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="delayed">Đang chậm trễ</option>
                  </select>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};
